// ============================================================================
// Contract Business Logic Store Generator
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ClientContractOrchestrator } from '../types';

// ============================================================================
// Contract Business Logic Types
// ============================================================================

export interface ContractMethod {
  name: string;
  type: 'read' | 'write' | 'event';
  inputs: ContractInput[];
  outputs: ContractOutput[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  payable?: boolean;
  constant?: boolean;
}

export interface ContractInput {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
}

export interface ContractOutput {
  name: string;
  type: string;
  internalType?: string;
}

export interface ContractEvent {
  name: string;
  type: 'event';
  inputs: ContractInput[];
  anonymous: boolean;
}

export interface ContractCallState {
  id: string;
  method: string;
  args: unknown[];
  result?: unknown;
  error?: string;
  status: 'pending' | 'success' | 'error';
  timestamp: string;
  transactionHash?: string;
  gasUsed?: string;
}

export interface ContractEventState {
  id: string;
  eventName: string;
  data: unknown;
  blockNumber: string;
  transactionHash: string;
  timestamp: string;
  topics: string[];
}

export interface ContractBusinessState {
  // Contract info
  contract: ClientContractOrchestrator;

  // Method states
  methods: {
    read: ContractMethod[];
    write: ContractMethod[];
    events: ContractEvent[];
  };

  // Call states
  calls: ContractCallState[];
  activeCall: ContractCallState | null;

  // Event states
  events: ContractEventState[];
  eventFilters: Record<string, unknown>;

  // Loading states
  loading: {
    calls: Record<string, boolean>;
    events: Record<string, boolean>;
    methods: boolean;
  };

  // Error states
  errors: {
    calls: Record<string, string>;
    events: Record<string, string>;
    general: string | null;
  };

  // Business logic state (user-defined)
  businessState: Record<string, unknown>;

  // Configuration
  config: {
    autoRefresh: boolean;
    refreshInterval: number;
    maxCalls: number;
    maxEvents: number;
    gasLimit?: string;
    gasPrice?: string;
  };
}

export interface ContractBusinessActions {
  // Method execution
  callReadMethod: (methodName: string, args: unknown[]) => Promise<unknown>;
  callWriteMethod: (
    methodName: string,
    args: unknown[],
    options?: {
      gasLimit?: string;
      gasPrice?: string;
      value?: string;
    }
  ) => Promise<string>;

  // Event management
  subscribeToEvent: (
    eventName: string,
    filter?: Record<string, unknown>
  ) => void;
  unsubscribeFromEvent: (eventName: string) => void;
  getEventHistory: (
    eventName: string,
    fromBlock?: string,
    toBlock?: string
  ) => Promise<ContractEventState[]>;

  // Call management
  getCallHistory: (methodName?: string) => ContractCallState[];
  retryCall: (callId: string) => Promise<void>;
  clearCallHistory: () => void;

  // Business logic management
  setBusinessState: (key: string, value: unknown) => void;
  getBusinessState: (key: string) => unknown;
  resetBusinessState: () => void;

  // Configuration
  updateConfig: (config: Partial<ContractBusinessState['config']>) => void;

  // Error management
  setError: (
    type: 'calls' | 'events' | 'general',
    key: string,
    error: string
  ) => void;
  clearError: (type: 'calls' | 'events' | 'general', key: string) => void;
  clearAllErrors: () => void;

  // Utility
  refreshContract: () => Promise<void>;
  reset: () => void;
}

export type ContractBusinessStore = ContractBusinessState &
  ContractBusinessActions;

// ============================================================================
// Contract Business Logic Store Generator
// ============================================================================

export class ContractBusinessLogicGenerator {
  private static stores = new Map<string, ContractBusinessStore>();

  static createStore(contract: ClientContractOrchestrator): any {
    const storeId = `contract-${contract.address}`;

    if (this.stores.has(storeId)) {
      return this.stores.get(storeId)!;
    }

    const store = this.generateStore(contract);
    this.stores.set(storeId, store);
    return store;
  }

  private static generateStore(contract: ClientContractOrchestrator): any {
    const methods = this.parseContractMethods(contract);

    const initialState: ContractBusinessState = {
      contract,
      methods,
      calls: [],
      activeCall: null,
      events: [],
      eventFilters: {},
      loading: {
        calls: {},
        events: {},
        methods: false,
      },
      errors: {
        calls: {},
        events: {},
        general: null,
      },
      businessState: {},
      config: {
        autoRefresh: true,
        refreshInterval: 5000,
        maxCalls: 100,
        maxEvents: 100,
      },
    };

    const store = create<ContractBusinessStore>()(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // ====================================================================
          // Method Execution
          // ====================================================================

          callReadMethod: async (methodName, args) => {
            const state = get();
            const method = state.methods.read.find(m => m.name === methodName);

            if (!method) {
              throw new Error(`Read method '${methodName}' not found`);
            }

            const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            set(draft => {
              draft.loading.calls[callId] = true;
              draft.calls.push({
                id: callId,
                method: methodName,
                args,
                timestamp: new Date().toISOString(),
                status: 'pending',
              });
            });

            try {
              // This would integrate with the actual contract calling logic
              const result = await this.executeReadMethod(
                contract,
                methodName,
                args
              );

              set(draft => {
                const call = draft.calls.find(c => c.id === callId);
                if (call) {
                  call.status = 'success';
                  call.result = result;
                }
                draft.loading.calls[callId] = false;
              });

              return result;
            } catch (error) {
              set(draft => {
                const call = draft.calls.find(c => c.id === callId);
                if (call) {
                  call.status = 'error';
                  call.error =
                    error instanceof Error ? error.message : 'Unknown error';
                }
                draft.loading.calls[callId] = false;
                if (draft.errors && draft.errors.calls) {
                  const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                  // Use direct assignment to avoid type issues
                  (draft.errors as any).calls[callId] = errorMessage;
                }
              });
              throw error;
            }
          },

          callWriteMethod: async (methodName, args, options = {}) => {
            const state = get();
            const method = state.methods.write.find(m => m.name === methodName);

            if (!method) {
              throw new Error(`Write method '${methodName}' not found`);
            }

            const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            set(draft => {
              draft.loading.calls[callId] = true;
              draft.calls.push({
                id: callId,
                method: methodName,
                args,
                timestamp: new Date().toISOString(),
                status: 'pending',
              });
            });

            try {
              // This would integrate with the actual contract calling logic
              const transactionHash = await this.executeWriteMethod(
                contract,
                methodName,
                args,
                options
              );

              set(draft => {
                const call = draft.calls.find(c => c.id === callId);
                if (call) {
                  call.status = 'success';
                  call.transactionHash = transactionHash;
                }
                draft.loading.calls[callId] = false;
              });

              return transactionHash;
            } catch (error) {
              set(draft => {
                const call = draft.calls.find(c => c.id === callId);
                if (call) {
                  call.status = 'error';
                  call.error =
                    error instanceof Error ? error.message : 'Unknown error';
                }
                draft.loading.calls[callId] = false;
                if (draft.errors && draft.errors.calls) {
                  const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                  // Use direct assignment to avoid type issues
                  (draft.errors as any).calls[callId] = errorMessage;
                }
              });
              throw error;
            }
          },

          // ====================================================================
          // Event Management
          // ====================================================================

          subscribeToEvent: (eventName, filter) => {
            set(draft => {
              draft.eventFilters[eventName] = filter || {};
            });

            // This would integrate with WebSocket or event subscription
            this.subscribeToContractEvent(contract, eventName, filter);
          },

          unsubscribeFromEvent: eventName => {
            set(draft => {
              delete draft.eventFilters[eventName];
            });

            // This would integrate with WebSocket or event subscription
            this.unsubscribeFromContractEvent(contract, eventName);
          },

          getEventHistory: async (eventName, fromBlock, toBlock) => {
            // This would integrate with blockchain event querying
            return this.queryContractEvents(
              contract,
              eventName,
              fromBlock,
              toBlock
            );
          },

          // ====================================================================
          // Call Management
          // ====================================================================

          getCallHistory: methodName => {
            const state = get();
            return methodName
              ? state.calls.filter(call => call.method === methodName)
              : state.calls;
          },

          retryCall: async callId => {
            const state = get();
            const call = state.calls.find(c => c.id === callId);

            if (!call) {
              throw new Error(`Call with ID '${callId}' not found`);
            }

            const method =
              state.methods.read.find(m => m.name === call.method) ||
              state.methods.write.find(m => m.name === call.method);

            if (!method) {
              throw new Error(`Method '${call.method}' not found`);
            }

            if (method.type === 'read') {
              await get().callReadMethod(call.method, call.args);
            } else {
              await get().callWriteMethod(call.method, call.args);
            }
          },

          clearCallHistory: () => {
            set(draft => {
              draft.calls = [];
            });
          },

          // ====================================================================
          // Business Logic Management
          // ====================================================================

          setBusinessState: (key, value) => {
            set(draft => {
              draft.businessState[key] = value;
            });
          },

          getBusinessState: key => {
            const state = get();
            return state.businessState[key];
          },

          resetBusinessState: () => {
            set(draft => {
              draft.businessState = {};
            });
          },

          // ====================================================================
          // Configuration
          // ====================================================================

          updateConfig: config => {
            set(draft => {
              draft.config = { ...draft.config, ...config };
            });
          },

          // ====================================================================
          // Error Management
          // ====================================================================

          setError: (type, key, error) => {
            set(draft => {
              (draft.errors as any)[type][key] = error;
            });
          },

          clearError: (type, key) => {
            set(draft => {
              delete (draft.errors as any)[type][key];
            });
          },

          clearAllErrors: () => {
            set(draft => {
              draft.errors = {
                calls: {},
                events: {},
                general: null,
              };
            });
          },

          // ====================================================================
          // Utility
          // ====================================================================

          refreshContract: async () => {
            set(draft => {
              draft.loading.methods = true;
            });

            try {
              // This would refresh contract data from the blockchain
              await this.refreshContractData(contract);

              set(draft => {
                draft.loading.methods = false;
              });
            } catch (error) {
              set(draft => {
                draft.loading.methods = false;
                draft.errors.general =
                  error instanceof Error ? error.message : 'Unknown error';
              });
              throw error;
            }
          },

          reset: () => {
            set(draft => {
              Object.assign(draft, initialState);
            });
          },
        }))
      )
    );

    return store;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private static parseContractMethods(contract: ClientContractOrchestrator): {
    read: ContractMethod[];
    write: ContractMethod[];
    events: ContractEvent[];
  } {
    const abi = Array.isArray(contract.abi)
      ? contract.abi
      : JSON.parse(contract.abi as string);

    const methods = {
      read: [] as ContractMethod[],
      write: [] as ContractMethod[],
      events: [] as ContractEvent[],
    };

    abi.forEach((item: any) => {
      if (item.type === 'function') {
        const method: ContractMethod = {
          name: item.name,
          type:
            item.stateMutability === 'view' || item.stateMutability === 'pure'
              ? 'read'
              : 'write',
          inputs: item.inputs || [],
          outputs: item.outputs || [],
          stateMutability: item.stateMutability,
          payable: item.payable,
          constant: item.constant,
        };

        if (method.type === 'read') {
          methods.read.push(method);
        } else {
          methods.write.push(method);
        }
      } else if (item.type === 'event') {
        methods.events.push({
          name: item.name,
          type: 'event',
          inputs: item.inputs || [],
          anonymous: item.anonymous,
        });
      }
    });

    return methods;
  }

  private static async executeReadMethod(
    contract: ClientContractOrchestrator,
    methodName: string,
    args: unknown[]
  ): Promise<unknown> {
    // This would integrate with the actual contract calling logic
    // For now, return a mock result
    return `Mock result for ${methodName}(${args.join(', ')})`;
  }

  private static async executeWriteMethod(
    contract: ClientContractOrchestrator,
    methodName: string,
    args: unknown[],
    options: any
  ): Promise<string> {
    // This would integrate with the actual contract calling logic
    // For now, return a mock transaction hash
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  private static subscribeToContractEvent(
    contract: ClientContractOrchestrator,
    eventName: string,
    filter?: Record<string, unknown>
  ): void {
    // This would integrate with WebSocket or event subscription
    console.log(
      `Subscribing to event ${eventName} on contract ${contract.address}`,
      filter
    );
  }

  private static unsubscribeFromContractEvent(
    contract: ClientContractOrchestrator,
    eventName: string
  ): void {
    // This would integrate with WebSocket or event subscription
    console.log(
      `Unsubscribing from event ${eventName} on contract ${contract.address}`
    );
  }

  private static async queryContractEvents(
    contract: ClientContractOrchestrator,
    eventName: string,
    fromBlock?: string,
    toBlock?: string
  ): Promise<ContractEventState[]> {
    // This would integrate with blockchain event querying
    return [];
  }

  private static async refreshContractData(
    contract: ClientContractOrchestrator
  ): Promise<void> {
    // This would refresh contract data from the blockchain
    console.log(`Refreshing contract data for ${contract.address}`);
  }
}
