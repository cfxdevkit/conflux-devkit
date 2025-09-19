// ============================================================================
// React Hooks for Client State Management
// ============================================================================

import { useCallback, useEffect, useMemo } from 'react';
import { useClientStore } from './store';
import type { APIConfig } from './types';

// ============================================================================
// Main Client State Hook
// ============================================================================

export function useClientState() {
  const store = useClientStore();

  return {
    // State
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    connectionError: store.connectionError,
    node: store.node,
    wallets: store.wallets,
    contracts: store.contracts,
    network: store.network,
    loading: store.loading,
    globalLoading: store.globalLoading,
    error: store.error,
    errors: store.errors,

    // Actions
    connect: store.connect,
    disconnect: store.disconnect,
    setConnectionError: store.setConnectionError,
    startNode: store.startNode,
    stopNode: store.stopNode,
    restartNode: store.restartNode,
    getNodeStatus: store.getNodeStatus,
    createWallet: store.createWallet,
    importWallet: store.importWallet,
    selectWallet: store.selectWallet,
    refreshWalletBalance: store.refreshWalletBalance,
    removeWallet: store.removeWallet,
    deployContract: store.deployContract,
    callContract: store.callContract,
    selectContract: store.selectContract,
    removeContract: store.removeContract,
    switchNetwork: store.switchNetwork,
    getAvailableNetworks: store.getAvailableNetworks,
    setLoading: store.setLoading,
    setGlobalLoading: store.setGlobalLoading,
    setError: store.setError,
    setFieldError: store.setFieldError,
    clearError: store.clearError,
    clearFieldError: store.clearFieldError,
    clearAllErrors: store.clearAllErrors,
    reset: store.reset,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

export function useConnection() {
  const isConnected = useClientStore(state => state.isConnected);
  const isConnecting = useClientStore(state => state.isConnecting);
  const connectionError = useClientStore(state => state.connectionError);
  const connect = useClientStore(state => state.connect);
  const disconnect = useClientStore(state => state.disconnect);
  const setConnectionError = useClientStore(state => state.setConnectionError);

  return {
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    setConnectionError,
  };
}

export function useNode() {
  const node = useClientStore(state => state.node);
  const startNode = useClientStore(state => state.startNode);
  const stopNode = useClientStore(state => state.stopNode);
  const restartNode = useClientStore(state => state.restartNode);
  const getNodeStatus = useClientStore(state => state.getNodeStatus);

  return {
    ...node,
    startNode,
    stopNode,
    restartNode,
    getNodeStatus,
  };
}

export function useWallets() {
  const wallets = useClientStore(state => state.wallets);
  const createWallet = useClientStore(state => state.createWallet);
  const importWallet = useClientStore(state => state.importWallet);
  const selectWallet = useClientStore(state => state.selectWallet);
  const refreshWalletBalance = useClientStore(
    state => state.refreshWalletBalance
  );
  const removeWallet = useClientStore(state => state.removeWallet);

  return {
    ...wallets,
    createWallet,
    importWallet,
    selectWallet,
    refreshWalletBalance,
    removeWallet,
  };
}

export function useContracts() {
  const contracts = useClientStore(state => state.contracts);
  const deployContract = useClientStore(state => state.deployContract);
  const callContract = useClientStore(state => state.callContract);
  const selectContract = useClientStore(state => state.selectContract);
  const removeContract = useClientStore(state => state.removeContract);

  return {
    ...contracts,
    deployContract,
    callContract,
    selectContract,
    removeContract,
  };
}

export function useNetwork() {
  const network = useClientStore(state => state.network);
  const switchNetwork = useClientStore(state => state.switchNetwork);
  const getAvailableNetworks = useClientStore(
    state => state.getAvailableNetworks
  );

  useEffect(() => {
    getAvailableNetworks().catch(console.error);
  }, [getAvailableNetworks]);

  return {
    ...network,
    switchNetwork,
    getAvailableNetworks,
  };
}

export function useLoading() {
  const loading = useClientStore(state => state.loading);
  const globalLoading = useClientStore(state => state.globalLoading);
  const setLoading = useClientStore(state => state.setLoading);
  const setGlobalLoading = useClientStore(state => state.setGlobalLoading);

  const isLoading = useCallback(
    (key: string) => {
      return loading[key] ?? false;
    },
    [loading]
  );

  const isAnyLoading = useMemo(() => {
    return Object.keys(loading).length > 0 || globalLoading;
  }, [loading, globalLoading]);

  return {
    loading,
    globalLoading,
    isLoading,
    isAnyLoading,
    setLoading,
    setGlobalLoading,
  };
}

export function useError() {
  const error = useClientStore(state => state.error);
  const errors = useClientStore(state => state.errors);
  const setError = useClientStore(state => state.setError);
  const setFieldError = useClientStore(state => state.setFieldError);
  const clearError = useClientStore(state => state.clearError);
  const clearFieldError = useClientStore(state => state.clearFieldError);
  const clearAllErrors = useClientStore(state => state.clearAllErrors);

  const fieldError = useCallback(
    (field: string) => {
      return errors[field];
    },
    [errors]
  );

  const hasErrors = useMemo(() => {
    return error !== null || Object.keys(errors).length > 0;
  }, [error, errors]);

  return {
    error,
    errors,
    fieldError,
    hasErrors,
    setError,
    setFieldError,
    clearError,
    clearFieldError,
    clearAllErrors,
  };
}

export function useWebSocket() {
  const wsClient = useClientStore(state => state.wsClient);
  const isConnected = wsClient?.isConnected() ?? false;

  const connect = useCallback(async () => {
    if (wsClient) {
      await wsClient.connect();
    }
  }, [wsClient]);

  const disconnect = useCallback(() => {
    if (wsClient) {
      wsClient.disconnect();
    }
  }, [wsClient]);

  const on = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (wsClient) {
        wsClient.on(event, handler);
      }
    },
    [wsClient]
  );

  const off = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (wsClient) {
        wsClient.off(event, handler);
      }
    },
    [wsClient]
  );

  return {
    isConnected,
    connect,
    disconnect,
    on,
    off,
  };
}

export function useClientInitialization() {
  const initializeClients = useClientStore(state => state.initializeClients);

  const initialize = useCallback(
    (config: APIConfig) => {
      return initializeClients(config);
    },
    [initializeClients]
  );

  return {
    initialize,
  };
}
