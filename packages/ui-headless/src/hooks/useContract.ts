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
 * useContract Hook
 *
 * Interact with smart contracts (read and write)
 */

import { useState } from 'react';
import type { ChainType } from '@conflux-devkit/core';
import { useDevKitContext } from '../providers/DevKitProvider.js';
import { useWalletContext } from '../providers/WalletProvider.js';

export interface ReadContractOptions {
  address: string;
  abi: unknown[];
  functionName: string;
  args?: unknown[];
  chain: ChainType;
}

export interface WriteContractOptions extends ReadContractOptions {
  value?: string;
}

export interface UseContractReturn {
  read: <T = unknown>(options: ReadContractOptions) => Promise<T>;
  write: (options: WriteContractOptions) => Promise<string>;
  isLoading: boolean;
  error?: Error;
}

/**
 * Hook to interact with smart contracts
 *
 * @example
 * ```tsx
 * const { read, write, isLoading } = useContract();
 *
 * // Read contract
 * const balance = await read({
 *   address: '0x...',
 *   abi: ERC20_ABI,
 *   functionName: 'balanceOf',
 *   args: ['0x...'],
 *   chain: 'evm'
 * });
 *
 * // Write contract
 * const hash = await write({
 *   address: '0x...',
 *   abi: ERC20_ABI,
 *   functionName: 'transfer',
 *   args: ['0x...', '1000000000000000000'],
 *   chain: 'evm'
 * });
 * ```
 */
export function useContract(): UseContractReturn {
  const { apiUrl } = useDevKitContext();
  const { accountIndex } = useWalletContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const read = async <T = unknown,>(options: ReadContractOptions): Promise<T> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // In production, call backend API
      // For now, return mock data
      return {} as T;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Contract read failed');
      setError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  const write = async (options: WriteContractOptions): Promise<string> => {
    if (accountIndex === undefined) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(undefined);

    try {
      // In production, call backend API
      // For now, return mock hash
      const hash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('')}`;

      return hash;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Contract write failed');
      setError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    read,
    write,
    isLoading,
    error,
  };
}
