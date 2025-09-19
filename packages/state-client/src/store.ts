// ============================================================================
// Client State Store using Zustand
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { APIClient } from './api/APIClient';
import { WebSocketClient } from './api/WebSocketClient';
import type {
  ClientState,
  ClientActions,
  ClientStore,
  APIConfig,
  ClientWalletInfo,
  ClientContractOrchestrator,
  ClientNetworkConfig,
  ClientNodeStatus,
  ClientContractCallState,
  ClientContractEventState,
} from './types';

// ============================================================================
// Initial State
// ============================================================================

const initialState: ClientState = {
  // Connection state
  isConnected: false,
  isConnecting: false,
  connectionError: null,

  // Node state
  node: {
    status: null,
    isRunning: false,
    isStarting: false,
    isStopping: false,
    error: null,
  },

  // Wallet state
  wallets: {
    activeWallet: null,
    wallets: [],
    isCreating: false,
    isImporting: false,
    error: null,
    balance: null,
    isRefreshing: false,
  },

  // Contract state
  contracts: {
    deployed: [],
    isDeploying: false,
    deploymentError: null,
    activeContract: null,
    contractCalls: [],
    events: [],
    error: null,
  },

  // Network state
  network: {
    current: null,
    available: [],
    isSwitching: false,
    switchError: null,
  },

  // Loading states
  loading: {},
  globalLoading: false,

  // Error state
  error: null,
  errors: {},
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useClientStore = create<ClientStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,

        // API and WebSocket clients (not persisted)
        apiClient: null,
        wsClient: null,

        // ====================================================================
        // Connection Actions
        // ====================================================================

        connect: async config => {
          const state = get();
          if (state.isConnecting || state.isConnected) {
            return;
          }

          set(draft => {
            draft.isConnecting = true;
            draft.connectionError = null;
          });

          try {
            if (!state.apiClient) {
              throw new Error('API client not initialized');
            }

            await state.apiClient.connect(config);

            set(draft => {
              draft.isConnected = true;
              draft.isConnecting = false;
              draft.connectionError = null;
            });
          } catch (error) {
            set(draft => {
              draft.isConnecting = false;
              draft.connectionError =
                error instanceof Error ? error.message : 'Connection failed';
            });
            throw error;
          }
        },

        disconnect: async () => {
          const state = get();

          try {
            if (state.apiClient) {
              await state.apiClient.disconnect();
            }

            set(draft => {
              draft.isConnected = false;
              draft.isConnecting = false;
              draft.connectionError = null;
            });
          } catch (error) {
            console.error('Error disconnecting:', error);
          }
        },

        setConnectionError: error => {
          set(draft => {
            draft.connectionError = error;
          });
        },

        // ====================================================================
        // Node Actions
        // ====================================================================

        startNode: async config => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          set(draft => {
            draft.node.isStarting = true;
            draft.node.error = null;
          });

          try {
            await state.apiClient.startNode(config);
            const status = await state.apiClient.getNodeStatus();

            set(draft => {
              draft.node.isStarting = false;
              draft.node.isRunning = true;
              draft.node.status = status;
            });
          } catch (error) {
            set(draft => {
              draft.node.isStarting = false;
              draft.node.error =
                error instanceof Error ? error.message : 'Failed to start node';
            });
            throw error;
          }
        },

        stopNode: async () => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          set(draft => {
            draft.node.isStopping = true;
            draft.node.error = null;
          });

          try {
            await state.apiClient.stopNode();

            set(draft => {
              draft.node.isStopping = false;
              draft.node.isRunning = false;
              draft.node.status = null;
            });
          } catch (error) {
            set(draft => {
              draft.node.isStopping = false;
              draft.node.error =
                error instanceof Error ? error.message : 'Failed to stop node';
            });
            throw error;
          }
        },

        restartNode: async config => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          set(draft => {
            draft.node.isStarting = true;
            draft.node.isStopping = true;
            draft.node.error = null;
          });

          try {
            await state.apiClient.restartNode(config);
            const status = await state.apiClient.getNodeStatus();

            set(draft => {
              draft.node.isStarting = false;
              draft.node.isStopping = false;
              draft.node.isRunning = true;
              draft.node.status = status;
            });
          } catch (error) {
            set(draft => {
              draft.node.isStarting = false;
              draft.node.isStopping = false;
              draft.node.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to restart node';
            });
            throw error;
          }
        },

        getNodeStatus: async () => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          try {
            const status = await state.apiClient.getNodeStatus();

            set(draft => {
              draft.node.status = status;
              draft.node.isRunning = status?.isRunning ?? false;
            });

            return status;
          } catch (error) {
            set(draft => {
              draft.node.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to get node status';
            });
            throw error;
          }
        },

        // ====================================================================
        // Wallet Actions
        // ====================================================================

        createWallet: async mnemonic => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          set(draft => {
            draft.wallets.isCreating = true;
            draft.wallets.error = null;
          });

          try {
            const wallet = await state.apiClient.createWallet(mnemonic);

            set(draft => {
              draft.wallets.isCreating = false;
              draft.wallets.wallets.push(wallet);
              draft.wallets.activeWallet = wallet;
            });

            return wallet;
          } catch (error) {
            set(draft => {
              draft.wallets.isCreating = false;
              draft.wallets.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to create wallet';
            });
            throw error;
          }
        },

        importWallet: async privateKey => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          set(draft => {
            draft.wallets.isImporting = true;
            draft.wallets.error = null;
          });

          try {
            const wallet = await state.apiClient.importWallet(privateKey);

            set(draft => {
              draft.wallets.isImporting = false;
              draft.wallets.wallets.push(wallet);
              draft.wallets.activeWallet = wallet;
            });

            return wallet;
          } catch (error) {
            set(draft => {
              draft.wallets.isImporting = false;
              draft.wallets.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to import wallet';
            });
            throw error;
          }
        },

        selectWallet: async address => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          try {
            await state.apiClient.selectWallet(address);

            set(draft => {
              draft.wallets.activeWallet =
                draft.wallets.wallets.find(w => w.address === address) || null;
            });
          } catch (error) {
            set(draft => {
              draft.wallets.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to select wallet';
            });
            throw error;
          }
        },

        refreshWalletBalance: async address => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          set(draft => {
            draft.wallets.isRefreshing = true;
            draft.wallets.error = null;
          });

          try {
            const balance = await state.apiClient.getWalletBalance(address);

            set(draft => {
              draft.wallets.isRefreshing = false;
              draft.wallets.balance = balance;

              // Update wallet in the list
              const wallet = draft.wallets.wallets.find(
                w => w.address === address
              );
              if (wallet) {
                wallet.balance = balance;
                wallet.balanceFormatted = `${balance} CFX`;
              }

              // Update active wallet
              if (draft.wallets.activeWallet?.address === address) {
                draft.wallets.activeWallet.balance = balance;
                draft.wallets.activeWallet.balanceFormatted = `${balance} CFX`;
              }
            });
          } catch (error) {
            set(draft => {
              draft.wallets.isRefreshing = false;
              draft.wallets.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to refresh balance';
            });
            throw error;
          }
        },

        removeWallet: async address => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          try {
            await state.apiClient.removeWallet(address);

            set(draft => {
              draft.wallets.wallets = draft.wallets.wallets.filter(
                w => w.address !== address
              );
              if (draft.wallets.activeWallet?.address === address) {
                draft.wallets.activeWallet = null;
              }
            });
          } catch (error) {
            set(draft => {
              draft.wallets.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to remove wallet';
            });
            throw error;
          }
        },

        // ====================================================================
        // Contract Actions
        // ====================================================================

        deployContract: async (name, bytecode, abi, args) => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          set(draft => {
            draft.contracts.isDeploying = true;
            draft.contracts.deploymentError = null;
          });

          try {
            const contract = await state.apiClient.deployContract(
              name,
              bytecode,
              abi,
              args
            );

            set(draft => {
              draft.contracts.isDeploying = false;
              draft.contracts.deployed.push(contract);
              draft.contracts.activeContract = contract;
            });

            return contract;
          } catch (error) {
            set(draft => {
              draft.contracts.isDeploying = false;
              draft.contracts.deploymentError =
                error instanceof Error
                  ? error.message
                  : 'Failed to deploy contract';
            });
            throw error;
          }
        },

        callContract: async (address, method, args) => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          set(draft => {
            draft.contracts.contractCalls.push({
              id: callId,
              contractAddress: address,
              method,
              args,
              timestamp: new Date().toISOString(),
              status: 'pending',
            });
          });

          try {
            const result = await state.apiClient.callContract(
              address,
              method,
              args
            );

            set(draft => {
              const call = draft.contracts.contractCalls.find(
                c => c.id === callId
              );
              if (call) {
                call.status = 'success';
                call.result = result;
              }
            });

            return result;
          } catch (error) {
            set(draft => {
              const call = draft.contracts.contractCalls.find(
                c => c.id === callId
              );
              if (call) {
                call.status = 'error';
                call.error =
                  error instanceof Error
                    ? error.message
                    : 'Contract call failed';
              }
            });
            throw error;
          }
        },

        selectContract: async address => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          try {
            await state.apiClient.selectContract(address);

            set(draft => {
              draft.contracts.activeContract =
                draft.contracts.deployed.find(c => c.address === address) ||
                null;
            });
          } catch (error) {
            set(draft => {
              draft.contracts.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to select contract';
            });
            throw error;
          }
        },

        removeContract: async address => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          try {
            await state.apiClient.removeContract(address);

            set(draft => {
              draft.contracts.deployed = draft.contracts.deployed.filter(
                c => c.address !== address
              );
              if (draft.contracts.activeContract?.address === address) {
                draft.contracts.activeContract = null;
              }
            });
          } catch (error) {
            set(draft => {
              draft.contracts.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to remove contract';
            });
            throw error;
          }
        },

        // ====================================================================
        // Network Actions
        // ====================================================================

        switchNetwork: async networkId => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          set(draft => {
            draft.network.isSwitching = true;
            draft.network.switchError = null;
          });

          try {
            await state.apiClient.switchNetwork(networkId);

            set(draft => {
              draft.network.isSwitching = false;
              draft.network.current =
                draft.network.available.find(n => n.chainId === networkId) ||
                null;
            });
          } catch (error) {
            set(draft => {
              draft.network.isSwitching = false;
              draft.network.switchError =
                error instanceof Error
                  ? error.message
                  : 'Failed to switch network';
            });
            throw error;
          }
        },

        getAvailableNetworks: async () => {
          const state = get();
          if (!state.apiClient) {
            throw new Error('API client not initialized');
          }

          try {
            const networks = await state.apiClient.getAvailableNetworks();

            set(draft => {
              draft.network.available = networks;
            });

            return networks;
          } catch (error) {
            set(draft => {
              draft.network.switchError =
                error instanceof Error
                  ? error.message
                  : 'Failed to get networks';
            });
            throw error;
          }
        },

        // ====================================================================
        // Loading Actions
        // ====================================================================

        setLoading: (key, loading) => {
          set(draft => {
            if (loading) {
              draft.loading[key] = true;
            } else {
              delete draft.loading[key];
            }
          });
        },

        setGlobalLoading: loading => {
          set(draft => {
            draft.globalLoading = loading;
          });
        },

        // ====================================================================
        // Error Actions
        // ====================================================================

        setError: error => {
          set(draft => {
            draft.error = error;
          });
        },

        setFieldError: (field, error) => {
          set(draft => {
            draft.errors[field] = error;
          });
        },

        clearError: () => {
          set(draft => {
            draft.error = null;
          });
        },

        clearFieldError: field => {
          set(draft => {
            delete draft.errors[field];
          });
        },

        clearAllErrors: () => {
          set(draft => {
            draft.error = null;
            draft.errors = {};
          });
        },

        // ====================================================================
        // Utility Actions
        // ====================================================================

        reset: () => {
          set(draft => {
            Object.assign(draft, initialState);
          });
        },

        // ====================================================================
        // Client Initialization
        // ====================================================================

        initializeClients: (config: APIConfig) => {
          const apiClient = new APIClient(config);
          const wsClient = new WebSocketClient(
            config.websocket || {
              url: config.baseURL.replace('http', 'ws'),
              reconnectInterval: 5000,
              maxReconnectAttempts: 10,
            }
          );

          set(draft => {
            draft.apiClient = apiClient;
            draft.wsClient = wsClient;
          });

          return { apiClient, wsClient };
        },
      })),
      {
        name: 'conflux-devkit-client-state',
        partialize: state => ({
          // Only persist essential state, not API clients
          isConnected: state.isConnected,
          wallets: state.wallets,
          contracts: state.contracts,
          network: state.network,
        }),
      }
    )
  )
);
