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
import type { DevNodeAccount, DevNodeStatus, FaucetRequest, MiningConfig } from '@/types/devnode';
import { create } from 'zustand';

interface DevNodeStore {
  status: DevNodeStatus | null;
  accounts: DevNodeAccount[];
  isLoading: boolean; // Deprecated - use specific flags
  isStarting: boolean;
  isStopping: boolean;
  isRestarting: boolean;
  isMining: boolean;
  error: string | null;

  // Actions
  fetchStatus: () => Promise<void>;
  startNode: () => Promise<void>;
  stopNode: () => Promise<void>;
  restartNode: () => Promise<void>;
  setMiningMode: (config: MiningConfig) => Promise<void>;
  mineBlock: () => Promise<void>;
  requestFaucet: (request: FaucetRequest) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  updateStatus: (status: Partial<DevNodeStatus>) => void;
}

export const useDevNodeStore = create<DevNodeStore>((set, get) => ({
  status: null,
  accounts: [],
  isLoading: false,
  isStarting: false,
  isStopping: false,
  isRestarting: false,
  isMining: false,
  error: null,

  fetchStatus: async () => {
    try {
      set({ error: null });
      const status = await apiClient.getDevKitStatus();
      set({ status });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch node status';
      console.error('Failed to fetch status:', error);
      set({ error: errorMessage });
    }
  },

  startNode: async () => {
    try {
      console.log('Starting node...');
      set({ isStarting: true, error: null });
      const result = await apiClient.startNode();
      console.log('Start node result:', result);

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

  setMiningMode: async (config: MiningConfig) => {
    try {
      set({ isMining: true, error: null });
      await apiClient.setMiningMode(config.autoMining ? 'auto' : 'manual', config.blockTime);
      await get().fetchStatus();
      set({ isMining: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to set mining mode';
      set({ error: errorMessage, isMining: false });
      throw error;
    }
  },

  mineBlock: async () => {
    try {
      set({ isMining: true, error: null });
      await apiClient.mineBlock();
      await get().fetchStatus();
      set({ isMining: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to mine block';
      set({ error: errorMessage, isMining: false });
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
      const accounts = await apiClient.getAccounts();

      // Fetch balances per account index and merge
      const accountsWithBalances = await Promise.all(
        accounts.map(async (account) => {
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

      set({ accounts: accountsWithBalances });
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
}));
