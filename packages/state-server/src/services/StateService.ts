// ============================================================================
// State Service - Server-side state management
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ServerStore, ServerState, ServerActions } from '../types';
import { EventEmitter } from '../utils/EventEmitter';

// ============================================================================
// Event Emitter for WebSocket events
// ============================================================================

export const stateEventEmitter = new EventEmitter();

// ============================================================================
// Initial State
// ============================================================================

const initialState: ServerState = {
  // Connection state
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  currentNetwork: null,

  // Node state
  node: {
    status: {
      isRunning: false,
      isStarting: false,
      isStopping: false,
      error: null,
      lastHealthCheck: null,
      uptime: 0,
    },
    isRunning: false,
    isStarting: false,
    isStopping: false,
    error: null,
    lastHealthCheck: null,
    uptime: 0,
  },

  // Wallet state
  wallets: {
    activeWallet: null,
    wallets: new Map(),
    isCreating: false,
    isImporting: false,
    error: null,
  },

  // Contract state
  contracts: {
    activeContract: null,
    contracts: new Map(),
    isDeploying: false,
    deploymentError: null,
    error: null,
  },

  // Network state
  networks: {
    available: [],
    isSwitching: false,
    switchError: null,
  },
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useServerStore = create<ServerStore>()(
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
          // TODO: Implement actual connection logic
          // This would integrate with the blockchain services

          set(state => {
            state.isConnected = true;
            state.isConnecting = false;
            if (config?.chainId) {
              // Set current network based on config
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

          stateEventEmitter.emit('connection:connected', { isConnected: true });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Connection failed';
          set(state => {
            state.isConnected = false;
            state.isConnecting = false;
            state.connectionError = errorMessage;
          });
          stateEventEmitter.emit('connection:error', { error: errorMessage });
        }
      },

      disconnect: async () => {
        set(state => {
          state.isConnected = false;
          state.isConnecting = false;
          state.connectionError = null;
          state.currentNetwork = null;
          state.node.isRunning = false;
          state.wallets.activeWallet = null;
          state.wallets.wallets.clear();
          state.contracts.activeContract = null;
          state.contracts.contracts.clear();
        });

        stateEventEmitter.emit('connection:disconnected', {
          isConnected: false,
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
          state.node.isStarting = true;
          state.node.error = null;
        });

        try {
          // TODO: Implement actual node start logic
          // This would integrate with the node manager

          set(state => {
            state.node.isRunning = true;
            state.node.isStarting = false;
            state.node.status.isRunning = true;
            state.node.status.isStarting = false;
            state.node.lastHealthCheck = new Date();
            state.node.uptime = 0;
          });

          stateEventEmitter.emit('node:started', { status: get().node.status });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to start node';
          set(state => {
            state.node.isStarting = false;
            state.node.error = errorMessage;
            state.node.status.error = errorMessage;
          });
          stateEventEmitter.emit('node:error', { error: errorMessage });
        }
      },

      stopNode: async () => {
        set(state => {
          state.node.isStopping = true;
          state.node.error = null;
        });

        try {
          // TODO: Implement actual node stop logic

          set(state => {
            state.node.isRunning = false;
            state.node.isStopping = false;
            state.node.status.isRunning = false;
            state.node.status.isStopping = false;
            state.node.uptime = 0;
          });

          stateEventEmitter.emit('node:stopped', { status: get().node.status });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to stop node';
          set(state => {
            state.node.isStopping = false;
            state.node.error = errorMessage;
            state.node.status.error = errorMessage;
          });
          stateEventEmitter.emit('node:error', { error: errorMessage });
        }
      },

      restartNode: async config => {
        await get().stopNode();
        await get().startNode(config);
      },

      updateNodeStatus: status => {
        set(state => {
          state.node.status = status;
          state.node.isRunning = status.isRunning;
          state.node.isStarting = status.isStarting;
          state.node.isStopping = status.isStopping;
          state.node.error = status.error;
          state.node.lastHealthCheck = status.lastHealthCheck
            ? new Date(status.lastHealthCheck)
            : null;
          state.node.uptime = status.uptime;
        });

        stateEventEmitter.emit('node:status:changed', { status });
      },

      setNodeError: error => {
        set(state => {
          state.node.error = error;
          state.node.status.error = error;
        });
      },

      // ====================================================================
      // Wallet Actions
      // ====================================================================

      createWallet: async mnemonic => {
        set(state => {
          state.wallets.isCreating = true;
          state.wallets.error = null;
        });

        try {
          // TODO: Implement actual wallet creation logic
          // This would integrate with the wallet manager

          const wallet: any = {
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            balance: '0',
            balanceFormatted: '0.000000 CFX',
            isActive: false,
          };

          set(state => {
            state.wallets.wallets.set(wallet.address, wallet);
            state.wallets.isCreating = false;
          });

          stateEventEmitter.emit('wallet:created', { wallet });
          return wallet;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create wallet';
          set(state => {
            state.wallets.isCreating = false;
            state.wallets.error = errorMessage;
          });
          throw new Error(errorMessage);
        }
      },

      importWallet: async privateKey => {
        set(state => {
          state.wallets.isImporting = true;
          state.wallets.error = null;
        });

        try {
          // TODO: Implement actual wallet import logic

          const wallet: any = {
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            balance: '0',
            balanceFormatted: '0.000000 CFX',
            isActive: false,
          };

          set(state => {
            state.wallets.wallets.set(wallet.address, wallet);
            state.wallets.isImporting = false;
          });

          stateEventEmitter.emit('wallet:created', { wallet });
          return wallet;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to import wallet';
          set(state => {
            state.wallets.isImporting = false;
            state.wallets.error = errorMessage;
          });
          throw new Error(errorMessage);
        }
      },

      selectWallet: address => {
        set(state => {
          state.wallets.activeWallet = address;
          // Update active status for all wallets
          state.wallets.wallets.forEach((wallet, key) => {
            wallet.isActive = key === address;
          });
        });

        const wallet = get().wallets.wallets.get(address);
        if (wallet) {
          stateEventEmitter.emit('wallet:selected', { wallet });
        }
      },

      refreshWalletBalance: async address => {
        try {
          // TODO: Implement actual balance refresh logic

          const wallet = get().wallets.wallets.get(address);
          if (wallet) {
            const updatedWallet = {
              ...wallet,
              balance: Math.random().toString(),
              balanceFormatted: `${Math.random().toFixed(6)} CFX`,
            };

            set(state => {
              state.wallets.wallets.set(address, updatedWallet);
            });

            stateEventEmitter.emit('wallet:balance:updated', {
              address,
              balance: updatedWallet.balance,
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to refresh balance';
          set(state => {
            state.wallets.error = errorMessage;
          });
        }
      },

      setWalletError: error => {
        set(state => {
          state.wallets.error = error;
        });
      },

      removeWallet: address => {
        set(state => {
          state.wallets.wallets.delete(address);
          if (state.wallets.activeWallet === address) {
            state.wallets.activeWallet = null;
          }
        });

        stateEventEmitter.emit('wallet:removed', { address });
      },

      // ====================================================================
      // Contract Actions
      // ====================================================================

      deployContract: async (contractName, args) => {
        set(state => {
          state.contracts.isDeploying = true;
          state.contracts.deploymentError = null;
        });

        try {
          // TODO: Implement actual contract deployment logic

          const contract: any = {
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            name: contractName,
            abi: '[]',
            network: get().currentNetwork?.chainId || 'unknown',
            isActive: false,
          };

          set(state => {
            state.contracts.contracts.set(contract.address, contract);
            state.contracts.isDeploying = false;
          });

          stateEventEmitter.emit('contract:deployed', { contract });
          return contract;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to deploy contract';
          set(state => {
            state.contracts.isDeploying = false;
            state.contracts.deploymentError = errorMessage;
          });
          throw new Error(errorMessage);
        }
      },

      selectContract: address => {
        set(state => {
          state.contracts.activeContract = address;
          // Update active status for all contracts
          state.contracts.contracts.forEach((contract, key) => {
            contract.isActive = key === address;
          });
        });

        const contract = get().contracts.contracts.get(address);
        if (contract) {
          stateEventEmitter.emit('contract:selected', { contract });
        }
      },

      callContractMethod: async params => {
        try {
          // TODO: Implement actual contract call logic

          const result = {
            result: 'mock result',
            success: true,
          };

          stateEventEmitter.emit('contract:called', {
            call: {
              method: params.method,
              args: params.args,
              result: result.result,
              success: result.success,
            },
          });

          return result;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Contract call failed';
          stateEventEmitter.emit('contract:error', { error: errorMessage });
          return {
            result: null,
            success: false,
            error: errorMessage,
          };
        }
      },

      setContractError: error => {
        set(state => {
          state.contracts.error = error;
        });
      },

      removeContract: address => {
        set(state => {
          state.contracts.contracts.delete(address);
          if (state.contracts.activeContract === address) {
            state.contracts.activeContract = null;
          }
        });

        stateEventEmitter.emit('contract:removed', { address });
      },

      // ====================================================================
      // Network Actions
      // ====================================================================

      switchNetwork: async networkId => {
        set(state => {
          state.networks.isSwitching = true;
          state.networks.switchError = null;
        });

        try {
          // TODO: Implement actual network switching logic

          const network = {
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
            state.networks.isSwitching = false;
          });

          stateEventEmitter.emit('network:switched', { network });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to switch network';
          set(state => {
            state.networks.isSwitching = false;
            state.networks.switchError = errorMessage;
          });
          stateEventEmitter.emit('network:error', { error: errorMessage });
        }
      },

      setNetworkError: error => {
        set(state => {
          state.networks.switchError = error;
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
        // Refresh all wallet balances
        const wallets = Array.from(get().wallets.wallets.keys());
        await Promise.all(
          wallets.map(address => get().refreshWalletBalance(address))
        );
      },
    }))
  )
);
