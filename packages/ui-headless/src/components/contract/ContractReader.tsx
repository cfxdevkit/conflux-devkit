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
 * ContractReader - Headless Contract Read Component
 *
 * Reads data from smart contracts with customizable rendering
 */

import type { ChainType } from '@conflux-devkit/core';
import type React from 'react';
import { useState } from 'react';
import { useContract } from '../../hooks/useContract.js';
import type { BaseComponentProps, RenderPropChild } from '../../types/index.js';

export interface ContractReaderRenderProps<T = unknown> {
  read: (args?: unknown[]) => Promise<void>;
  result?: T;
  isLoading: boolean;
  error?: Error;
}

export interface ContractReaderProps<T = unknown> extends BaseComponentProps {
  address: string;
  abi: unknown[];
  functionName: string;
  chain: ChainType;
  children?: RenderPropChild<ContractReaderRenderProps<T>> | React.ReactNode;
}

/**
 * ContractReader Component
 *
 * Headless contract read component. Use render prop for custom UI.
 *
 * @example
 * ```tsx
 * <ContractReader
 *   address="0x..."
 *   abi={ERC20_ABI}
 *   functionName="balanceOf"
 *   chain="evm"
 * >
 *   {({ read, result, isLoading }) => (
 *     <div>
 *       <button onClick={() => read(['0x...'])}>Get Balance</button>
 *       {isLoading && <p>Loading...</p>}
 *       {result && <p>Balance: {result}</p>}
 *     </div>
 *   )}
 * </ContractReader>
 * ```
 */
export function ContractReader<T = unknown>({
  address,
  abi,
  functionName,
  chain,
  children,
  className,
}: ContractReaderProps<T>) {
  const { read: readContract, isLoading, error } = useContract();
  const [result, setResult] = useState<T>();

  const read = async (args?: unknown[]) => {
    const data = await readContract<T>({
      address,
      abi,
      functionName,
      args,
      chain,
    });
    setResult(data);
  };

  const renderProps: ContractReaderRenderProps<T> = {
    read,
    result,
    isLoading,
    error,
  };

  // If children is a function, use render prop pattern
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  // Default rendering
  return (
    <div className={className || 'p-4 border rounded'}>
      <h3 className="font-semibold mb-2">Read: {functionName}</h3>
      <button
        onClick={() => read()}
        disabled={isLoading}
        className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        type="button"
      >
        {isLoading ? 'Reading...' : 'Read'}
      </button>
      {result && (
        <div className="mt-2">
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      {error && <p className="mt-2 text-red-500">{error.message}</p>}
      {children}
    </div>
  );
}
