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

export interface SetupStatus {
  setupCompleted: boolean;
  mnemonicsCount?: number;
  adminsCount?: number;
  isLocked?: boolean;
  isEncrypted?: boolean;
  activeMnemonic?: string;
}

export interface SetupFormData {
  adminAddress: string;
  mnemonic: string;
  mnemonicLabel: string;
  accountsCount: number;
  chainId: number;
  evmChainId: number;
  miningAuthor: string;
  encryptionEnabled: boolean;
  encryptionPassword: string;
  encryptionConfirm: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

interface SetupStore {
  // Status
  status: SetupStatus | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Wizard state
  currentStep: number;
  formData: SetupFormData;
  generatedMnemonic: string | null;
  validation: ValidationResult | null;

  // Actions
  fetchStatus: () => Promise<void>;
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<SetupFormData>) => void;
  generateMnemonic: () => Promise<string>;
  validateForm: () => Promise<ValidationResult>;
  completeSetup: () => Promise<boolean>;
  reset: () => void;
}

const initialFormData: SetupFormData = {
  adminAddress: '',
  mnemonic: '',
  mnemonicLabel: 'Default Wallet',
  accountsCount: 10,
  chainId: 2029,
  evmChainId: 2030,
  miningAuthor: 'auto',
  encryptionEnabled: false,
  encryptionPassword: '',
  encryptionConfirm: '',
};

export const useSetupStore = create<SetupStore>((set, get) => ({
  // Initial state
  status: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  currentStep: 0,
  formData: { ...initialFormData },
  generatedMnemonic: null,
  validation: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getSetupStatus();
      set({
        status: {
          setupCompleted: response.setupCompleted,
          mnemonicsCount: response.status?.mnemonicsCount,
          adminsCount: response.status?.adminsCount,
          isLocked: response.status?.isLocked,
          isEncrypted: response.status?.isEncrypted,
          activeMnemonic: response.status?.activeMnemonic,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch setup status',
        isLoading: false,
      });
    }
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  updateFormData: (data: Partial<SetupFormData>) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
      validation: null, // Clear validation when form changes
    }));
  },

  generateMnemonic: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.generateSetupMnemonic();
      set({
        generatedMnemonic: response.mnemonic,
        formData: { ...get().formData, mnemonic: response.mnemonic },
        isLoading: false,
      });
      return response.mnemonic;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate mnemonic';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  validateForm: async () => {
    const { formData } = get();
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.validateSetup({
        adminAddress: formData.adminAddress,
        mnemonic: formData.mnemonic,
        mnemonicLabel: formData.mnemonicLabel,
        nodeConfig: {
          accountsCount: formData.accountsCount,
          chainId: formData.chainId,
          evmChainId: formData.evmChainId,
          miningAuthor: formData.miningAuthor === 'auto' ? undefined : formData.miningAuthor,
        },
        encryption: formData.encryptionEnabled
          ? {
              enabled: true,
              password: formData.encryptionPassword,
            }
          : { enabled: false },
      });

      set({ validation: response, isLoading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      set({
        error: errorMessage,
        validation: { valid: false, errors: [errorMessage] },
        isLoading: false,
      });
      return { valid: false, errors: [errorMessage] };
    }
  },

  completeSetup: async () => {
    const { formData } = get();
    set({ isSubmitting: true, error: null });

    try {
      await apiClient.completeSetup({
        adminAddress: formData.adminAddress,
        mnemonic: formData.mnemonic,
        mnemonicLabel: formData.mnemonicLabel,
        nodeConfig: {
          accountsCount: formData.accountsCount,
          chainId: formData.chainId,
          evmChainId: formData.evmChainId,
          miningAuthor: formData.miningAuthor === 'auto' ? undefined : formData.miningAuthor,
        },
        encryption: formData.encryptionEnabled
          ? {
              enabled: true,
              password: formData.encryptionPassword,
            }
          : { enabled: false },
      });

      // Refresh status after setup
      await get().fetchStatus();
      set({ isSubmitting: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Setup failed';
      set({ error: errorMessage, isSubmitting: false });
      return false;
    }
  },

  reset: () => {
    set({
      currentStep: 0,
      formData: { ...initialFormData },
      generatedMnemonic: null,
      validation: null,
      error: null,
    });
  },
}));
