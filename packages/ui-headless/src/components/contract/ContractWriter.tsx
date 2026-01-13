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
 * ContractWriter - Headless Contract Write Component
 *
 * Writes to smart contracts with customizable rendering
 */

import React, { useState } from 'react';
import type { ChainType } from '@conflux-devkit/core';
import { useContract } from '../../hooks/useContract.js';
import type { BaseComponentProps, RenderPropChild } from '../../types/index.js';

export interface ContractWriterRenderProps {
  write: (args?: unknown[], value?: string) => Promise<void>;
  hash?: string;
  isLoading: boolean;
  error?: Error;
  reset: () => void;
}

export interface ContractWriterProps extends BaseComponentProps {
  address: string;
  abi: unknown[];
  functionName: string;
  chain: ChainType;
  onSuccess?: (hash: string) => void;
  children?: RenderPropChild<ContractWriterRenderProps> | React.ReactNode;
}

/**
 * ContractWriter Component
 *
 * Headless contract write component. Use render prop for custom UI.
 *
 * @example
 * ```tsx
 * <ContractWriter
 *   address="0x..."
 *   abi={ERC20_ABI}
 *   functionName="transfer"
 *   chain="evm"
 *   onSuccess={(hash) => console.log('Success:', hash)}
 * >
 *   {({ write, hash, isLoading }) => (
 *     <div>
 *       <button onClick={() => write(['0x...', '1000000000000000000'])}>
 *         Transfer
 *       </button>
 *       {isLoading && <p>Sending...</p>}
 *       {hash && <p>TX: {hash}</p>}
 *     </div>
 *   )}
 * </ContractWriter>
 * ```
 */
export function ContractWriter({
  address,
  abi,
  functionName,
  chain,
  onSuccess,
  children,
  className,
}: ContractWriterProps) {
  const { write: writeContract, isLoading, error } = useContract();
  const [hash, setHash] = useState<string>();

  const write = async (args?: unknown[], value?: string) => {
    const txHash = await writeContract({
      address,
      abi,
      functionName,
      args,
      chain,
      value,
    });
    setHash(txHash);
    onSuccess?.(txHash);
  };

  const reset = () => {
    setHash(undefined);
  };

  const renderProps: ContractWriterRenderProps = {
    write,
    hash,
    isLoading,
    error,
    reset,
  };

  // If children is a function, use render prop pattern
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  // Default rendering
  return (
    <div className={className || 'p-4 border rounded'}>
      <h3 className="font-semibold mb-2">Write: {functionName}</h3>
      <button
        onClick={() => write()}
        disabled={isLoading}
        className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50"
        type="button"
      >
        {isLoading ? 'Sending...' : 'Execute'}
      </button>
      {hash && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">Transaction Hash:</p>
          <p className="font-mono text-xs break-all">{hash}</p>
          <button
            onClick={reset}
            className="mt-1 text-sm text-blue-500 hover:underline"
            type="button"
          >
            Reset
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-red-500">{error.message}</p>}
      {children}
    </div>
  );
}
