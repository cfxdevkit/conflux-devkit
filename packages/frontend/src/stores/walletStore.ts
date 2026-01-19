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

import { create } from 'zustand';
import { apiClient } from '@/services/api';

export interface WalletEntry {
  id: string;
  label: string;
  type: 'generated' | 'imported' | 'test';
  createdAt: string;
  isActive: boolean;
  nodeConfig?: {
    accountsCount: number;
    chainId: number;
    evmChainId: number;
    miningAuthor?: string;
  };
}

interface WalletStore {
  wallets: WalletEntry[];
  activeWallet: WalletEntry | null;
  isLoading: boolean;
  isSwitching: boolean;
  isLocked: boolean;
  isEncrypted: boolean;
  error: string | null;

  // Actions
  fetchWallets: () => Promise<void>;
  switchWallet: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  activeWallet: null,
  isLoading: false,
  isSwitching: false,
  isLocked: false,
  isEncrypted: false,
  error: null,

  fetchWallets: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await apiClient.getWalletList();

      const active = data.mnemonics.find((w: WalletEntry) => w.isActive) || null;

      set({
        wallets: data.mnemonics,
        activeWallet: active,
        isLocked: data.isLocked,
        isEncrypted: data.isEncrypted,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch wallets';
      console.error('Failed to fetch wallets:', error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  switchWallet: async (id: string) => {
    try {
      set({ isSwitching: true, error: null });
      await apiClient.switchWallet(id);

      // Refresh wallet list to get updated active state
      await get().fetchWallets();

      set({ isSwitching: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to switch wallet';
      console.error('Failed to switch wallet:', error);
      set({ error: errorMessage, isSwitching: false });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
}));
