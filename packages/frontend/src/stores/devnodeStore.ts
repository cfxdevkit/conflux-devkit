/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { apiClient } from '@/services/api';
import type { DevNodeAccount, DevNodeInfo, DevNodeStatus, FaucetRequest, NetworkType, NodeConfig } from '@/types/devnode';
import { create } from 'zustand';

interface DevNodeStore {
  status: DevNodeStatus | null;
  nodeInfo: DevNodeInfo | null;
  config: NodeConfig;
  accounts: DevNodeAccount[];
  faucetAccount: DevNodeAccount | null;
  isLoading: boolean; // Deprecated - use specific flags
  isStarting: boolean;
  isStopping: boolean;
  isRestarting: boolean;
  isResetting: boolean;
  isMining: boolean;
  isClearingData: boolean;
  isSwitchingNetwork: boolean;
  error: string | null;

  // Actions
  fetchStatus: () => Promise<void>;
  fetchNodeInfo: () => Promise<void>;
  startNode: (config?: Partial<NodeConfig>) => Promise<void>;
  setConfig: (config: Partial<NodeConfig>) => void;
  resetConfig: () => void;
  stopNode: () => Promise<void>;
  restartNode: () => Promise<void>;
  resetNode: (clearData?: boolean) => Promise<void>;
  clearData: () => Promise<void>;
  mineBlocks: (blocks: number, numTxs?: number) => Promise<void>;
  startAutoMine: (interval?: number) => Promise<void>;
  stopAutoMine: () => Promise<void>;
  setMiningInterval: (interval: number) => Promise<void>;
  requestFaucet: (request: FaucetRequest) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  updateStatus: (status: Partial<DevNodeStatus>) => void;
  switchNetwork: (network: NetworkType) => Promise<void>;
}

export const useDevNodeStore = create<DevNodeStore>((set, get) => ({
  status: null,
  nodeInfo: null,
  config: {
    chainId: 2029,
    evmChainId: 2030,
    accountsCount: 10, // Default: generate 10 accounts from mnemonic
    jsonrpcHttpPort: 12537,
    jsonrpcWsPort: 12535,
    jsonrpcHttpEthPort: 8545,
    jsonrpcWsEthPort: 8546,
  },
  accounts: [],
  faucetAccount: null,
  isLoading: false,
  isStarting: false,
  isStopping: false,
  isRestarting: false,
  isResetting: false,
  isMining: false,
  isClearingData: false,
  isSwitchingNetwork: false,
  error: null,

  fetchStatus: async () => {
    try {
      set({ error: null });
      const status = await apiClient.getDevKitStatus();
      set({ status });
      if (status.isRunning && !get().nodeInfo) {
        await get().fetchNodeInfo();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch node status';
      console.error('Failed to fetch status:', error);
      set({ error: errorMessage });
    }
  },

  fetchNodeInfo: async () => {
    try {
      set({ error: null });
      const info = await apiClient.getNodeInfo();
      set({ nodeInfo: info });
    } catch (error: any) {
      console.error('Failed to fetch node info:', error);
    }
  },

  startNode: async (configOverrides?: Partial<NodeConfig>) => {
    try {
      console.log('Starting node...');
      set({ isStarting: true, error: null });
      
      const finalConfig = { ...get().config, ...configOverrides };
      
      // Check if configuration has changed from the last start
      const lastConfigStr = localStorage.getItem('lastNodeConfig');
      const lastConfig = lastConfigStr ? JSON.parse(lastConfigStr) : null;
      const configChanged = !lastConfig || JSON.stringify(lastConfig) !== JSON.stringify(finalConfig);
      
      if (configChanged) {
        console.log('Configuration changed, requesting data cleanup...');
      }
      
      const result = await apiClient.startNode({ ...finalConfig, configChanged });
      console.log('Start node result:', result);

      // Store the current configuration as the last successful config
      localStorage.setItem('lastNodeConfig', JSON.stringify(finalConfig));

      // Poll status until node is running (max 30 seconds)
      const maxAttempts = 30;
      let attempts = 0;
      let nodeStarted = false;

      while (attempts < maxAttempts && !nodeStarted) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const status = await apiClient.getDevKitStatus();
        console.log(`Polling node status (attempt ${attempts + 1}/30):`, status.isRunning);

        if (status.isRunning) {
          nodeStarted = true;
          set({ status, isStarting: false });
          // Fetch static node info once the node is confirmed running
          await get().fetchNodeInfo();
          console.log('Node started successfully after', attempts + 1, 'seconds');
        }

        attempts++;
      }

      if (!nodeStarted) {
        // Timeout - fetch final status
        await get().fetchStatus();
        set({ isStarting: false });
        console.warn('Node start timeout after 30 seconds');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to start node';
      console.error('Failed to start node:', error);
      set({ error: errorMessage, isStarting: false });
      throw error;
    }
  },

  stopNode: async () => {
    try {
      set({ isStopping: true, error: null });
      await apiClient.stopNode();
      set({
        status: null,
        accounts: [],
        isStopping: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to stop node';
      set({ error: errorMessage, isStopping: false });
      throw error;
    }
  },

  restartNode: async () => {
    try {
      set({ isRestarting: true, error: null });
      await apiClient.restartNode();
      await get().fetchStatus();
      set({ isRestarting: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to restart node';
      set({ error: errorMessage, isRestarting: false });
      throw error;
    }
  },

  resetNode: async (clearData = false) => {
    try {
      set({ isResetting: true, error: null });
      await apiClient.resetNode(clearData);
      // Clear nodeInfo so it gets refetched with fresh data
      set({ nodeInfo: null });
      await get().fetchStatus();
      await get().fetchNodeInfo();
      set({ isResetting: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset node';
      set({ error: errorMessage, isResetting: false });
      throw error;
    }
  },

  clearData: async () => {
    try {
      set({ isClearingData: true, error: null });
      await apiClient.clearData();
      set({ isClearingData: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to clear data';
      set({ error: errorMessage, isClearingData: false });
      throw error;
    }
  },

  mineBlocks: async (blocks: number, numTxs?: number) => {
    try {
      set({ isMining: true, error: null });
      await apiClient.mineBlocks(blocks, numTxs);
      await get().fetchStatus();
      set({ isMining: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to mine blocks';
      set({ error: errorMessage, isMining: false });
      throw error;
    }
  },

  startAutoMine: async (interval?: number) => {
    try {
      set({ error: null });
      await apiClient.startAutoMine(interval);
      await get().fetchStatus();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to start auto-mining';
      set({ error: errorMessage });
      throw error;
    }
  },

  stopAutoMine: async () => {
    try {
      set({ error: null });
      await apiClient.stopAutoMine();
      await get().fetchStatus();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to stop auto-mining';
      set({ error: errorMessage });
      throw error;
    }
  },

  setMiningInterval: async (interval: number) => {
    try {
      set({ error: null });
      await apiClient.setMiningInterval(interval);
      await get().fetchStatus();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to set mining interval';
      set({ error: errorMessage });
      throw error;
    }
  },

  requestFaucet: async (request: FaucetRequest) => {
    try {
      // Note: Per-address loading state is managed in AccountsTable component
      set({ error: null });
      await apiClient.requestFaucet(request.address, request.amount, request.chain);
      await get().fetchAccounts();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Faucet request failed';
      set({ error: errorMessage });
      throw error;
    }
  },

  fetchAccounts: async () => {
    try {
      set({ error: null });
      const { accounts, faucetAccount } = await apiClient.getAccounts();

      // Check if we're on local network and if node is running
      const currentStatus = get().status;
      const isLocalNetwork = !currentStatus?.network || currentStatus.network === 'local';
      const isNodeRunning = currentStatus?.isRunning ?? false;

      // Skip balance fetching if on local network and node is not running
      // This prevents console flooding with "node not running" warnings
      const shouldFetchBalances = !isLocalNetwork || isNodeRunning;

      if (!shouldFetchBalances) {
        // Return accounts without balance data when node is stopped
        // Still set faucet account but without balance
        set({ 
          accounts, 
          faucetAccount: faucetAccount ? { ...faucetAccount, index: -1, balance: { core: '0', eSpace: '0' } } : null 
        });
        return;
      }

      // Fetch balances per account index and merge
      const accountsWithBalances = await Promise.all(
        accounts.map(async (account: DevNodeAccount) => {
          try {
            const balance = await apiClient.getAccountBalance(account.index);
            return {
              ...account,
              balance: {
                core: balance.balances.core,
                eSpace: balance.balances.evm,
              },
            };
          } catch (error) {
            console.warn('Balance fetch failed for account', account.index, error);
            return account;
          }
        })
      );

      // Fetch faucet account balance if available
      let faucetAccountWithBalance: DevNodeAccount | null = null;
      if (faucetAccount) {
        try {
          // Query faucet balance using Core address (since faucet is mining account)
          const coreAddress = faucetAccount.addresses?.core;
          if (coreAddress) {
            const balance = await apiClient.getBalanceByAddress(coreAddress);
            faucetAccountWithBalance = {
              ...faucetAccount,
              index: -1, // Mining account has special index -1
              balance: {
                core: balance.balances.core,
                eSpace: balance.balances.evm,
              },
            };
          } else {
            faucetAccountWithBalance = {
              ...faucetAccount,
              index: -1,
            };
          }
        } catch (error) {
          console.warn('Balance fetch failed for faucet account', error);
          faucetAccountWithBalance = {
            ...faucetAccount,
            index: -1,
          };
        }
      }

      set({ accounts: accountsWithBalances, faucetAccount: faucetAccountWithBalance });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch accounts';
      set({ error: errorMessage });
    }
  },

  updateStatus: (updates: Partial<DevNodeStatus>) => {
    set((state) => {
      if (!state.status) return state;

      const mergedCore = updates.coreSpace
        ? { ...state.status.coreSpace, ...updates.coreSpace }
        : state.status.coreSpace;

      const mergedESpace = updates.eSpace
        ? { ...state.status.eSpace, ...updates.eSpace }
        : state.status.eSpace;

      return {
        status: {
          ...state.status,
          ...updates,
          coreSpace: mergedCore,
          eSpace: mergedESpace,
        },
      };
    });
  },

  setConfig: (updates: Partial<NodeConfig>) => {
    set((state) => ({
      config: { ...state.config, ...updates },
    }));
  },

  resetConfig: () => {
    set({
      config: {
        chainId: 2029,
        evmChainId: 2030,
        jsonrpcHttpPort: 12537,
        jsonrpcWsPort: 12535,
        jsonrpcHttpEthPort: 8545,
        jsonrpcWsEthPort: 8546,
      },
    });
  },

  switchNetwork: async (network) => {
    try {
      set({ isSwitchingNetwork: true, error: null });
      const result = await apiClient.switchNetwork(network);
      
      console.log('[Store] switchNetwork result:', result);
      console.log('[Store] Updating status with network:', result.network);
      
      // Update status with new network info
      set((state) => {
        console.log('[Store] Current status before update:', state.status);
        const newStatus = state.status ? {
          ...state.status,
          network: result.network,
          networkConfig: result.config,
          capabilities: result.capabilities,
        } : null;
        console.log('[Store] New status after update:', newStatus);
        return {
          status: newStatus,
          isSwitchingNetwork: false,
        };
      });

      // Clear accounts if switching away from local (they're not relevant)
      if (network !== 'local') {
        set({ accounts: [], faucetAccount: null });
      } else {
        // Refetch accounts for local network
        await get().fetchAccounts();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to switch network';
      set({ error: errorMessage, isSwitchingNetwork: false });
      throw error;
    }
  },
}));
