// ============================================================================
// React Hooks for Contract Business Logic
// ============================================================================

import { useCallback, useEffect, useMemo } from 'react';
import { ContractBusinessLogicGenerator } from './ContractBusinessLogic';
import type { ClientContractOrchestrator } from '../types';
import type { ContractBusinessStore } from './ContractBusinessLogic';

// ============================================================================
// Main Contract Business Logic Hook
// ============================================================================

export function useContractBusinessLogic(contract: ClientContractOrchestrator) {
  const store = ContractBusinessLogicGenerator.createStore(contract);

  return {
    // Contract info
    contract: store.contract,
    methods: store.methods,

    // Call states
    calls: store.calls,
    activeCall: store.activeCall,

    // Event states
    events: store.events,
    eventFilters: store.eventFilters,

    // Loading states
    loading: store.loading,

    // Error states
    errors: store.errors,

    // Business logic state
    businessState: store.businessState,

    // Configuration
    config: store.config,

    // Actions
    callReadMethod: store.callReadMethod,
    callWriteMethod: store.callWriteMethod,
    subscribeToEvent: store.subscribeToEvent,
    unsubscribeFromEvent: store.unsubscribeFromEvent,
    getEventHistory: store.getEventHistory,
    getCallHistory: store.getCallHistory,
    retryCall: store.retryCall,
    clearCallHistory: store.clearCallHistory,
    setBusinessState: store.setBusinessState,
    getBusinessState: store.getBusinessState,
    resetBusinessState: store.resetBusinessState,
    updateConfig: store.updateConfig,
    setError: store.setError,
    clearError: store.clearError,
    clearAllErrors: store.clearAllErrors,
    refreshContract: store.refreshContract,
    reset: store.reset,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

// Read Methods Hook
export function useContractReadMethods(contract: ClientContractOrchestrator) {
  const store = ContractBusinessLogicGenerator.createStore(contract);

  const readMethods = store.methods.read;
  const callReadMethod = store.callReadMethod;
  const calls = store.calls;
  const loading = store.loading;
  const errors = store.errors;

  // Helper method for calling read methods with loading state
  const callMethod = useCallback(
    async (methodName: string, args: unknown[]) => {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        const result = await callReadMethod(methodName, args);
        return result;
      } catch (error) {
        throw error;
      }
    },
    [callReadMethod]
  );

  // Get call history for a specific method
  const getMethodCalls = useCallback(
    (methodName: string) => {
      return calls.filter((call: any) => call.method === methodName);
    },
    [calls]
  );

  // Check if a method is currently being called
  const isMethodLoading = useCallback(
    (methodName: string) => {
      return Object.keys(loading.calls).some(
        key =>
          loading.calls[key] &&
          calls.find((call: any) => call.id === key)?.method === methodName
      );
    },
    [loading.calls, calls]
  );

  return {
    readMethods,
    callMethod,
    getMethodCalls,
    isMethodLoading,
    calls,
    loading,
    errors,
  };
}

// Write Methods Hook
export function useContractWriteMethods(contract: ClientContractOrchestrator) {
  const store = ContractBusinessLogicGenerator.createStore(contract);

  const writeMethods = store.methods.write;
  const callWriteMethod = store.callWriteMethod;
  const calls = store.calls;
  const loading = store.loading;
  const errors = store.errors;

  // Helper method for calling write methods with loading state
  const callMethod = useCallback(
    async (
      methodName: string,
      args: unknown[],
      options?: {
        gasLimit?: string;
        gasPrice?: string;
        value?: string;
      }
    ) => {
      try {
        const transactionHash = await callWriteMethod(
          methodName,
          args,
          options
        );
        return transactionHash;
      } catch (error) {
        throw error;
      }
    },
    [callWriteMethod]
  );

  // Get call history for a specific method
  const getMethodCalls = useCallback(
    (methodName: string) => {
      return calls.filter((call: any) => call.method === methodName);
    },
    [calls]
  );

  // Check if a method is currently being called
  const isMethodLoading = useCallback(
    (methodName: string) => {
      return Object.keys(loading.calls).some(
        key =>
          loading.calls[key] &&
          calls.find((call: any) => call.id === key)?.method === methodName
      );
    },
    [loading.calls, calls]
  );

  return {
    writeMethods,
    callMethod,
    getMethodCalls,
    isMethodLoading,
    calls,
    loading,
    errors,
  };
}

// Events Hook
export function useContractEvents(contract: ClientContractOrchestrator) {
  const store = ContractBusinessLogicGenerator.createStore(contract);

  const events = store.methods.events;
  const eventStates = store.events;
  const eventFilters = store.eventFilters;
  const subscribeToEvent = store.subscribeToEvent;
  const unsubscribeFromEvent = store.unsubscribeFromEvent;
  const getEventHistory = store.getEventHistory;
  const loading = store.loading;
  const errors = store.errors;

  // Subscribe to an event with automatic cleanup
  const useEventSubscription = useCallback(
    (eventName: string, filter?: Record<string, unknown>) => {
      useEffect(() => {
        subscribeToEvent(eventName, filter);

        return () => {
          unsubscribeFromEvent(eventName);
        };
      }, [eventName, filter, subscribeToEvent, unsubscribeFromEvent]);
    },
    [subscribeToEvent, unsubscribeFromEvent]
  );

  // Get events for a specific event name
  const getEventsByName = useCallback(
    (eventName: string) => {
      return eventStates.filter((event: any) => event.eventName === eventName);
    },
    [eventStates]
  );

  // Check if an event is currently being subscribed to
  const isEventSubscribed = useCallback(
    (eventName: string) => {
      return eventName in eventFilters;
    },
    [eventFilters]
  );

  return {
    events,
    eventStates,
    eventFilters,
    subscribeToEvent,
    unsubscribeFromEvent,
    getEventHistory,
    useEventSubscription,
    getEventsByName,
    isEventSubscribed,
    loading,
    errors,
  };
}

// Business Logic State Hook
export function useContractBusinessState(contract: ClientContractOrchestrator) {
  const store = ContractBusinessLogicGenerator.createStore(contract);

  const businessState = store.businessState;
  const setBusinessState = store.setBusinessState;
  const getBusinessState = store.getBusinessState;
  const resetBusinessState = store.resetBusinessState;

  // Helper method for setting multiple business state values
  const setMultipleBusinessState = useCallback(
    (values: Record<string, unknown>) => {
      Object.entries(values).forEach(([key, value]) => {
        setBusinessState(key, value);
      });
    },
    [setBusinessState]
  );

  // Helper method for getting multiple business state values
  const getMultipleBusinessState = useCallback(
    (keys: string[]) => {
      return keys.reduce(
        (acc, key) => {
          acc[key] = getBusinessState(key);
          return acc;
        },
        {} as Record<string, unknown>
      );
    },
    [getBusinessState]
  );

  return {
    businessState,
    setBusinessState,
    getBusinessState,
    resetBusinessState,
    setMultipleBusinessState,
    getMultipleBusinessState,
  };
}

// Contract Configuration Hook
export function useContractConfig(contract: ClientContractOrchestrator) {
  const store = ContractBusinessLogicGenerator.createStore(contract);

  const config = store.config;
  const updateConfig = store.updateConfig;

  // Helper method for updating specific config values
  const updateConfigValue = useCallback(
    (key: string, value: any) => {
      updateConfig({ [key]: value } as any);
    },
    [updateConfig]
  );

  // Helper method for resetting config to defaults
  const resetConfig = useCallback(() => {
    updateConfig({
      autoRefresh: true,
      refreshInterval: 5000,
      maxCalls: 100,
      maxEvents: 100,
    });
  }, [updateConfig]);

  return {
    config,
    updateConfig,
    updateConfigValue,
    resetConfig,
  };
}

// Contract Error Management Hook
export function useContractErrors(contract: ClientContractOrchestrator) {
  const store = ContractBusinessLogicGenerator.createStore(contract);

  const errors = store.errors;
  const setError = store.setError;
  const clearError = store.clearError;
  const clearAllErrors = store.clearAllErrors;

  // Helper method for getting all errors
  const getAllErrors = useCallback(() => {
    const allErrors: Record<string, string> = {};

    Object.entries(errors.calls).forEach(([key, error]) => {
      allErrors[`calls.${key}`] = String(error);
    });

    Object.entries(errors.events).forEach(([key, error]) => {
      allErrors[`events.${key}`] = String(error);
    });

    if (errors.general) {
      allErrors.general = errors.general;
    }

    return allErrors;
  }, [errors]);

  // Helper method for checking if there are any errors
  const hasErrors = useCallback(() => {
    return (
      Object.keys(errors.calls).length > 0 ||
      Object.keys(errors.events).length > 0 ||
      errors.general !== null
    );
  }, [errors]);

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    getAllErrors,
    hasErrors,
  };
}

// Contract Loading States Hook
export function useContractLoading(contract: ClientContractOrchestrator) {
  const store = ContractBusinessLogicGenerator.createStore(contract);

  const loading = store.loading;

  // Helper method for checking if any operation is loading
  const isLoading = useCallback(
    (type?: 'calls' | 'events' | 'methods') => {
      if (type === 'calls') {
        return Object.values(loading.calls).some(Boolean);
      }
      if (type === 'events') {
        return Object.values(loading.events).some(Boolean);
      }
      if (type === 'methods') {
        return loading.methods;
      }
      return (
        Object.values(loading.calls).some(Boolean) ||
        Object.values(loading.events).some(Boolean) ||
        loading.methods
      );
    },
    [loading]
  );

  // Helper method for checking if a specific call is loading
  const isCallLoading = useCallback(
    (callId: string) => {
      return loading.calls[callId] || false;
    },
    [loading.calls]
  );

  // Helper method for checking if a specific event is loading
  const isEventLoading = useCallback(
    (eventName: string) => {
      return loading.events[eventName] || false;
    },
    [loading.events]
  );

  return {
    loading,
    isLoading,
    isCallLoading,
    isEventLoading,
  };
}

// ============================================================================
// Contract Template Generator
// ============================================================================

export function generateContractTemplate(
  contract: ClientContractOrchestrator
): string {
  const contractName = contract.name || 'Contract';
  const contractAddress = contract.address;

  const readMethods = (contract.methods?.read || []) as any[];
  const writeMethods = (contract.methods?.write || []) as any[];
  const events = (contract.methods?.events || []) as any[];

  const template = `// ============================================================================
// ${contractName} Business Logic Template
// Generated for contract: ${contractAddress}
// ============================================================================

import React from 'react';
import {
  useContractBusinessLogic,
  useContractReadMethods,
  useContractWriteMethods,
  useContractEvents,
  useContractBusinessState,
  useContractConfig,
  useContractErrors,
  useContractLoading,
} from '@conflux-devkit/state-client';

// ============================================================================
// Contract Component Template
// ============================================================================

export function ${contractName}Component({ contract }: { contract: ClientContractOrchestrator }) {
  // Main contract business logic
  const {
    methods,
    calls,
    events: eventStates,
    businessState,
    config,
    callReadMethod,
    callWriteMethod,
    subscribeToEvent,
    unsubscribeFromEvent,
    setBusinessState,
    updateConfig,
  } = useContractBusinessLogic(contract);

  // Specialized hooks
  const { readMethods, callMethod: callRead } = useContractReadMethods(contract);
  const { writeMethods, callMethod: callWrite } = useContractWriteMethods(contract);
  const { events, useEventSubscription } = useContractEvents(contract);
  const { businessState: state, setBusinessState: setState } = useContractBusinessState(contract);
  const { config: contractConfig, updateConfig: updateContractConfig } = useContractConfig(contract);
  const { errors, hasErrors } = useContractErrors(contract);
  const { isLoading } = useContractLoading(contract);

  // ============================================================================
  // Read Methods
  // ============================================================================

${readMethods
  .map(
    (
      method: any
    ) => `  const handle${method.name} = async (args: unknown[]) => {
    try {
      const result = await callRead('${method.name}', args);
      console.log('${method.name} result:', result);
      return result;
    } catch (error) {
      console.error('${method.name} error:', error);
      throw error;
    }
  };`
  )
  .join('\n\n')}

  // ============================================================================
  // Write Methods
  // ============================================================================

${writeMethods
  .map(
    (
      method: any
    ) => `  const handle${method.name} = async (args: unknown[], options?: any) => {
    try {
      const transactionHash = await callWrite('${method.name}', args, options);
      console.log('${method.name} transaction:', transactionHash);
      return transactionHash;
    } catch (error) {
      console.error('${method.name} error:', error);
      throw error;
    }
  };`
  )
  .join('\n\n')}

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

${events
  .map(
    (event: any) => `  // Subscribe to ${event.name} event
  useEventSubscription('${event.name}');`
  )
  .join('\n')}

  // ============================================================================
  // Business Logic State Management
  // ============================================================================

  // Add your custom business logic state here
  const customBusinessLogic = {
    // Example: track user interactions
    userInteractions: state.userInteractions || 0,
    
    // Example: track contract state
    contractState: state.contractState || 'idle',
    
    // Add more custom state as needed
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

${events
  .map(
    (event: any) => `  const handle${event.name}Event = (eventData: any) => {
    console.log('${event.name} event received:', eventData);
    // Add your custom event handling logic here
  };`
  )
  .join('\n\n')}

  // ============================================================================
  // Component Render
  // ============================================================================

  return (
    <div className="${contractName.toLowerCase()}-component">
      <h2>${contractName} Contract</h2>
      <p>Address: {contractAddress}</p>
      
      {/* Read Methods */}
      <div className="read-methods">
        <h3>Read Methods</h3>
        {readMethods.map((method: any) => (
          <div key={method.name} className="method">
            <h4>{method.name}</h4>
            <p>Inputs: {method.inputs.map((input: any) => \`\${input.name}: \${input.type}\`).join(', ')}</p>
            <p>Outputs: {method.outputs.map((output: any) => \`\${output.name}: \${output.type}\`).join(', ')}</p>
            <button onClick={() => handle\${method.name}([])}>
              Call \${method.name}
            </button>
          </div>
        ))}
      </div>

      {/* Write Methods */}
      <div className="write-methods">
        <h3>Write Methods</h3>
        {writeMethods.map((method: any) => (
          <div key={method.name} className="method">
            <h4>{method.name}</h4>
            <p>Inputs: {method.inputs.map((input: any) => \`\${input.name}: \${input.type}\`).join(', ')}</p>
            <p>State Mutability: {method.stateMutability}</p>
            <button onClick={() => handle\${method.name}([], {})}>
              Call \${method.name}
            </button>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="events">
        <h3>Events</h3>
        {events.map(event => (
          <div key={event.name} className="event">
            <h4>{event.name}</h4>
            <p>Inputs: {event.inputs.map(input => \`\${input.name}: \${input.type}\`).join(', ')}</p>
            <p>Anonymous: {event.anonymous ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>

      {/* Business Logic State */}
      <div className="business-state">
        <h3>Business Logic State</h3>
        <pre>{JSON.stringify(customBusinessLogic, null, 2)}</pre>
      </div>

      {/* Error Display */}
      {hasErrors() && (
        <div className="errors">
          <h3>Errors</h3>
          <pre>{JSON.stringify(errors, null, 2)}</pre>
        </div>
      )}

      {/* Loading State */}
      {isLoading() && (
        <div className="loading">
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Custom Hooks for ${contractName}
// ============================================================================

// Hook for ${contractName} read operations
export function use${contractName}Read() {
  const { readMethods, callMethod, getMethodCalls, isMethodLoading } = useContractReadMethods(contract);
  
  return {
    methods: readMethods,
    call: callMethod,
    getCalls: getMethodCalls,
    isLoading: isMethodLoading,
  };
}

// Hook for ${contractName} write operations
export function use${contractName}Write() {
  const { writeMethods, callMethod, getMethodCalls, isMethodLoading } = useContractWriteMethods(contract);
  
  return {
    methods: writeMethods,
    call: callMethod,
    getCalls: getMethodCalls,
    isLoading: isMethodLoading,
  };
}

// Hook for ${contractName} events
export function use${contractName}Events() {
  const { events, useEventSubscription, getEventsByName, isEventSubscribed } = useContractEvents(contract);
  
  return {
    events,
    subscribe: useEventSubscription,
    getEvents: getEventsByName,
    isSubscribed: isEventSubscribed,
  };
}

// Hook for ${contractName} business state
export function use${contractName}BusinessState() {
  const { businessState, setBusinessState, getBusinessState, resetBusinessState } = useContractBusinessState(contract);
  
  return {
    state: businessState,
    set: setBusinessState,
    get: getBusinessState,
    reset: resetBusinessState,
  };
}

export default ${contractName}Component;`;

  return template;
}
