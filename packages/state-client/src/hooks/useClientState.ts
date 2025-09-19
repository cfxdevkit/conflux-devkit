// ============================================================================
// Client State Hook - React hook for managing client state
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useCallback, useEffect, useRef } from 'react';
import { APIClient } from '../api/APIClient';
import { WebSocketClient } from '../api/WebSocketClient';
import { ClientStore, ClientState, ClientActions, APIConfig } from '../types';
import {
  ClientWalletInfo,
  ClientNetworkConfig,
  ClientContractOrchestrator,
  ClientNodeStatus,
} from '@conflux-devkit/types';

// ============================================================================
// Initial State
// ============================================================================

const initialState: ClientState = {
  // Connection state
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  currentNetwork: null,

  // Node state
  nodeStatus: null,
  isNodeRunning: false,
  nodeError: null,

  // Wallet state
  wallets: [],
  activeWallet: null,
  walletError: null,

  // Contract state
  contracts: [],
  activeContract: null,
  contractError: null,

  // Network state
  availableNetworks: [],
  isNetworkSwitching: false,
  networkError: null,

  // Loading states
  loading: {},
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useClientStore = create<ClientStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // ====================================================================
      // Connection Actions
      // ====================================================================

      connect: async config => {
        set(state => {
          state.isConnecting = true;
          state.connectionError = null;
        });

        try {
          // This would be called from the hook with actual API client
          // For now, we'll just simulate the state change
          set(state => {
            state.isConnected = true;
            state.isConnecting = false;
            if (config?.chainId) {
              state.currentNetwork = {
                name: 'Conflux Network',
                chainId: config.chainId,
                rpcUrl: config.rpcUrl || 'http://localhost:12537',
                currency: {
                  name: 'Conflux',
                  symbol: 'CFX',
                  decimals: '18',
                },
                isTestnet: true,
              };
            }
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Connection failed';
          set(state => {
            state.isConnected = false;
            state.isConnecting = false;
            state.connectionError = errorMessage;
          });
        }
      },

      disconnect: async () => {
        set(state => {
          state.isConnected = false;
          state.isConnecting = false;
          state.connectionError = null;
          state.currentNetwork = null;
          state.nodeStatus = null;
          state.isNodeRunning = false;
          state.wallets = [];
          state.activeWallet = null;
          state.contracts = [];
          state.activeContract = null;
        });
      },

      setConnectionError: error => {
        set(state => {
          state.connectionError = error;
        });
      },

      // ====================================================================
      // Node Actions
      // ====================================================================

      startNode: async config => {
        set(state => {
          state.loading['node:start'] = true;
          state.nodeError = null;
        });

        try {
          // This would be called from the hook with actual API client
          set(state => {
            state.isNodeRunning = true;
            state.nodeStatus = {
              running: true,
              corePort: '12537',
              evmPort: '12539',
              chainId: '1',
              evmChainId: '1030',
              blockNumber: '0',
              peerCount: '0',
              walletMode: 'mnemonic',
              wallets: [],
              miningAddress: null,
              health: 'healthy',
              lastHealthCheck: new Date().toISOString(),
            };
            state.loading['node:start'] = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to start node';
          set(state => {
            state.nodeError = errorMessage;
            state.loading['node:start'] = false;
          });
        }
      },

      stopNode: async () => {
        set(state => {
          state.loading['node:stop'] = true;
          state.nodeError = null;
        });

        try {
          // This would be called from the hook with actual API client
          set(state => {
            state.isNodeRunning = false;
            state.nodeStatus = {
              running: false,
              corePort: '12537',
              evmPort: '12539',
              chainId: '1',
              evmChainId: '1030',
              blockNumber: '0',
              peerCount: '0',
              walletMode: 'mnemonic',
              wallets: [],
              miningAddress: null,
              health: 'unhealthy',
              lastHealthCheck: new Date().toISOString(),
            };
            state.loading['node:stop'] = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to stop node';
          set(state => {
            state.nodeError = errorMessage;
            state.loading['node:stop'] = false;
          });
        }
      },

      restartNode: async config => {
        await get().stopNode();
        await get().startNode(config);
      },

      refreshNodeStatus: async () => {
        set(state => {
          state.loading['node:status'] = true;
        });

        try {
          // This would be called from the hook with actual API client
          set(state => {
            state.loading['node:status'] = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to refresh node status';
          set(state => {
            state.nodeError = errorMessage;
            state.loading['node:status'] = false;
          });
        }
      },

      setNodeError: error => {
        set(state => {
          state.nodeError = error;
        });
      },

      // ====================================================================
      // Wallet Actions
      // ====================================================================

      createWallet: async mnemonic => {
        set(state => {
          state.loading['wallet:create'] = true;
          state.walletError = null;
        });

        try {
          // This would be called from the hook with actual API client
          const wallet: ClientWalletInfo = {
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            privateKey: `0x${Math.random().toString(16).substr(2, 64)}`,
            index: 0,
            balance: '0',
            balanceFormatted: '0.000000 CFX',
            isDefault: false,
          };

          set(state => {
            state.wallets.push(wallet);
            state.loading['wallet:create'] = false;
          });

          return wallet;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create wallet';
          set(state => {
            state.walletError = errorMessage;
            state.loading['wallet:create'] = false;
          });
          throw error;
        }
      },

      importWallet: async privateKey => {
        set(state => {
          state.loading['wallet:import'] = true;
          state.walletError = null;
        });

        try {
          // This would be called from the hook with actual API client
          const wallet: ClientWalletInfo = {
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            privateKey: `0x${Math.random().toString(16).substr(2, 64)}`,
            index: 0,
            balance: '0',
            balanceFormatted: '0.000000 CFX',
            isDefault: false,
          };

          set(state => {
            state.wallets.push(wallet);
            state.loading['wallet:import'] = false;
          });

          return wallet;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to import wallet';
          set(state => {
            state.walletError = errorMessage;
            state.loading['wallet:import'] = false;
          });
          throw error;
        }
      },

      selectWallet: async address => {
        set(state => {
          state.activeWallet =
            state.wallets.find(w => w.address === address) || null;
          state.wallets.forEach(wallet => {
            wallet.isDefault = wallet.address === address;
          });
        });
      },

      refreshWalletBalance: async address => {
        set(state => {
          state.loading[`wallet:balance:${address}`] = true;
        });

        try {
          // This would be called from the hook with actual API client
          set(state => {
            const wallet = state.wallets.find(w => w.address === address);
            if (wallet) {
              wallet.balance = Math.random().toString();
              wallet.balanceFormatted = `${Math.random().toFixed(6)} CFX`;
            }
            state.loading[`wallet:balance:${address}`] = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to refresh balance';
          set(state => {
            state.walletError = errorMessage;
            state.loading[`wallet:balance:${address}`] = false;
          });
        }
      },

      setWalletError: error => {
        set(state => {
          state.walletError = error;
        });
      },

      removeWallet: async address => {
        set(state => {
          state.wallets = state.wallets.filter(w => w.address !== address);
          if (state.activeWallet?.address === address) {
            state.activeWallet = null;
          }
        });
      },

      // ====================================================================
      // Contract Actions
      // ====================================================================

      deployContract: async (contractName, args) => {
        set(state => {
          state.loading['contract:deploy'] = true;
          state.contractError = null;
        });

        try {
          // This would be called from the hook with actual API client
          const contract: ClientContractOrchestrator = {
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            name: contractName,
            abi: '[]',
            bytecode: '0x',
            deployedBytecode: '0x',
            chainType: 'evm',
            networkId: '1',
            chainId: '1',
            evmChainId: '1030',
            network: get().currentNetwork || {
              name: 'Conflux Network',
              chainId: '1',
              rpcUrl: 'http://localhost:12537',
              currency: {
                name: 'Conflux',
                symbol: 'CFX',
                decimals: '18',
              },
              isTestnet: true,
            },
            methods: {
              read: [],
              write: [],
              events: [],
            } as any,
            capabilities: {
              read: true,
              write: true,
              events: true,
            },
          };

          set(state => {
            state.contracts.push(contract);
            state.loading['contract:deploy'] = false;
          });

          return contract;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to deploy contract';
          set(state => {
            state.contractError = errorMessage;
            state.loading['contract:deploy'] = false;
          });
          throw error;
        }
      },

      selectContract: async address => {
        set(state => {
          state.activeContract =
            state.contracts.find(c => c.address === address) || null;
        });
      },

      callContractMethod: async params => {
        set(state => {
          state.loading[`contract:call:${params.method}`] = true;
        });

        try {
          // This would be called from the hook with actual API client
          const result = {
            result: 'mock result',
            success: true,
          };

          set(state => {
            state.loading[`contract:call:${params.method}`] = false;
          });

          return result;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Contract call failed';
          set(state => {
            state.contractError = errorMessage;
            state.loading[`contract:call:${params.method}`] = false;
          });
          return {
            result: null,
            success: false,
            error: errorMessage,
          };
        }
      },

      setContractError: error => {
        set(state => {
          state.contractError = error;
        });
      },

      removeContract: async address => {
        set(state => {
          state.contracts = state.contracts.filter(c => c.address !== address);
          if (state.activeContract?.address === address) {
            state.activeContract = null;
          }
        });
      },

      // ====================================================================
      // Network Actions
      // ====================================================================

      switchNetwork: async networkId => {
        set(state => {
          state.isNetworkSwitching = true;
          state.networkError = null;
        });

        try {
          // This would be called from the hook with actual API client
          const network: ClientNetworkConfig = {
            name: 'Conflux Network',
            chainId: networkId,
            rpcUrl: 'http://localhost:12537',
            currency: {
              name: 'Conflux',
              symbol: 'CFX',
              decimals: '18',
            },
            isTestnet: true,
          };

          set(state => {
            state.currentNetwork = network;
            state.isNetworkSwitching = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to switch network';
          set(state => {
            state.isNetworkSwitching = false;
            state.networkError = errorMessage;
          });
        }
      },

      refreshNetworks: async () => {
        set(state => {
          state.loading['networks:refresh'] = true;
        });

        try {
          // This would be called from the hook with actual API client
          set(state => {
            state.loading['networks:refresh'] = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to refresh networks';
          set(state => {
            state.networkError = errorMessage;
            state.loading['networks:refresh'] = false;
          });
        }
      },

      setNetworkError: error => {
        set(state => {
          state.networkError = error;
        });
      },

      // ====================================================================
      // Loading Actions
      // ====================================================================

      setLoading: (key, loading) => {
        set(state => {
          if (loading) {
            state.loading[key] = true;
          } else {
            delete state.loading[key];
          }
        });
      },

      // ====================================================================
      // Utility Actions
      // ====================================================================

      reset: () => {
        set(state => {
          Object.assign(state, initialState);
        });
      },

      refreshAll: async () => {
        await get().refreshNodeStatus();
        await get().refreshNetworks();

        // Refresh all wallet balances
        const wallets = get().wallets;
        await Promise.all(
          wallets.map(wallet => get().refreshWalletBalance(wallet.address))
        );
      },
    }))
  )
);

// ============================================================================
// React Hook
// ============================================================================

export function useClientState(config: APIConfig) {
  const apiClientRef = useRef<APIClient | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);

  // Initialize API client
  useEffect(() => {
    apiClientRef.current = new APIClient(config);
    wsClientRef.current = new WebSocketClient(config.wsURL);
  }, [config]);

  // WebSocket connection
  useEffect(() => {
    const wsClient = wsClientRef.current;
    if (!wsClient) return;

    const connect = async () => {
      try {
        await wsClient.connect();
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connect();

    // Set up event listeners
    wsClient.onWalletCreated(data => {
      useClientStore.getState().wallets.push(data.wallet);
    });

    wsClient.onWalletUpdated(data => {
      const store = useClientStore.getState();
      const index = store.wallets.findIndex(
        w => w.address === data.wallet.address
      );
      if (index !== -1) {
        store.wallets[index] = data.wallet;
      }
    });

    wsClient.onWalletRemoved(data => {
      const store = useClientStore.getState();
      store.wallets = store.wallets.filter(w => w.address !== data.address);
    });

    wsClient.onContractDeployed(data => {
      useClientStore.getState().contracts.push(data.contract);
    });

    wsClient.onContractUpdated(data => {
      const store = useClientStore.getState();
      const index = store.contracts.findIndex(
        c => c.address === data.contract.address
      );
      if (index !== -1) {
        store.contracts[index] = data.contract;
      }
    });

    wsClient.onContractRemoved(data => {
      const store = useClientStore.getState();
      store.contracts = store.contracts.filter(c => c.address !== data.address);
    });

    wsClient.onNodeStatusChanged(data => {
      useClientStore.getState().nodeStatus = data.status;
    });

    wsClient.onNetworkSwitched(data => {
      useClientStore.getState().currentNetwork = data.network;
    });

    return () => {
      wsClient.disconnect();
    };
  }, []);

  // Enhanced actions that use API client
  const enhancedActions = {
    connect: useCallback(
      async (config?: { chainId?: string; rpcUrl?: string }) => {
        const apiClient = apiClientRef.current;
        if (!apiClient) return;

        try {
          const response = await apiClient.connect(config);
          if (response.success) {
            useClientStore.getState().connect(config);
          } else {
            useClientStore
              .getState()
              .setConnectionError(response.error || 'Connection failed');
          }
        } catch (error) {
          useClientStore
            .getState()
            .setConnectionError(
              error instanceof Error ? error.message : 'Connection failed'
            );
        }
      },
      []
    ),

    startNode: useCallback(
      async (config?: { chainId?: string; rpcUrl?: string }) => {
        const apiClient = apiClientRef.current;
        if (!apiClient) return;

        try {
          const response = await apiClient.startNode(config);
          if (response.success) {
            useClientStore.getState().startNode(config);
          } else {
            useClientStore
              .getState()
              .setNodeError(response.error || 'Failed to start node');
          }
        } catch (error) {
          useClientStore
            .getState()
            .setNodeError(
              error instanceof Error ? error.message : 'Failed to start node'
            );
        }
      },
      []
    ),

    stopNode: useCallback(async () => {
      const apiClient = apiClientRef.current;
      if (!apiClient) return;

      try {
        const response = await apiClient.stopNode();
        if (response.success) {
          useClientStore.getState().stopNode();
        } else {
          useClientStore
            .getState()
            .setNodeError(response.error || 'Failed to stop node');
        }
      } catch (error) {
        useClientStore
          .getState()
          .setNodeError(
            error instanceof Error ? error.message : 'Failed to stop node'
          );
      }
    }, []),

    createWallet: useCallback(async (mnemonic?: string) => {
      const apiClient = apiClientRef.current;
      if (!apiClient) return useClientStore.getState().createWallet(mnemonic);

      try {
        const response = await apiClient.createWallet(mnemonic);
        if (response.success && response.data) {
          const wallet = (response.data as any).wallet;
          useClientStore.getState().wallets.push(wallet);
          return wallet;
        } else {
          throw new Error(response.error || 'Failed to create wallet');
        }
      } catch (error) {
        useClientStore
          .getState()
          .setWalletError(
            error instanceof Error ? error.message : 'Failed to create wallet'
          );
        throw error;
      }
    }, []),

    deployContract: useCallback(
      async (contractName: string, args?: unknown[]) => {
        const apiClient = apiClientRef.current;
        if (!apiClient)
          return useClientStore.getState().deployContract(contractName, args);

        try {
          const response = await apiClient.deployContract(contractName, args);
          if (response.success && response.data) {
            const contract = (response.data as any).contract;
            useClientStore.getState().contracts.push(contract);
            return contract;
          } else {
            throw new Error(response.error || 'Failed to deploy contract');
          }
        } catch (error) {
          useClientStore
            .getState()
            .setContractError(
              error instanceof Error
                ? error.message
                : 'Failed to deploy contract'
            );
          throw error;
        }
      },
      []
    ),
  };

  return {
    ...useClientStore(),
    ...enhancedActions,
  };
}
