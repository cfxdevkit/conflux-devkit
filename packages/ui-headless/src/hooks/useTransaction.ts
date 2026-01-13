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

/**
 * useTransaction Hook
 *
 * Sends transactions and tracks their status
 */

import { useState } from 'react';
import type { ChainType } from '@conflux-devkit/core';
import { useDevKitContext } from '../providers/DevKitProvider.js';
import { useWalletContext } from '../providers/WalletProvider.js';

export interface SendTransactionOptions {
  to: string;
  value?: string;
  data?: string;
  chain?: ChainType;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'success' | 'failed';
}

export interface UseTransactionReturn {
  send: (options: SendTransactionOptions) => Promise<TransactionResult>;
  isLoading: boolean;
  error?: Error;
  transaction?: TransactionResult;
  reset: () => void;
}

/**
 * Hook to send transactions
 *
 * @example
 * ```tsx
 * const { send, isLoading, transaction } = useTransaction();
 *
 * const handleSend = async () => {
 *   const result = await send({
 *     to: '0x...',
 *     value: '1000000000000000000',
 *     chain: 'evm'
 *   });
 * };
 * ```
 */
export function useTransaction(): UseTransactionReturn {
  const { apiUrl } = useDevKitContext();
  const { accountIndex, chain } = useWalletContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [transaction, setTransaction] = useState<TransactionResult>();

  const send = async (options: SendTransactionOptions): Promise<TransactionResult> => {
    if (accountIndex === undefined) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(undefined);

    try {
      // In production, call backend API to send transaction
      // For now, simulate transaction
      const result: TransactionResult = {
        hash: `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join('')}`,
        status: 'pending',
      };

      setTransaction(result);

      // Simulate confirmation
      setTimeout(() => {
        setTransaction({ ...result, status: 'success' });
      }, 2000);

      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Transaction failed');
      setError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setTransaction(undefined);
    setError(undefined);
  };

  return {
    send,
    isLoading,
    error,
    transaction,
    reset,
  };
}
