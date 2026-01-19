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
 * SwapWidget - Headless Swap Component (Swappi)
 *
 * Token swap interface with customizable rendering
 */

import type React from 'react';
import { useState } from 'react';
import { useDevKitContext } from '../../providers/DevKitProvider.js';
import { useWalletContext } from '../../providers/WalletProvider.js';
import type { BaseComponentProps, RenderPropChild } from '../../types/index.js';

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  priceImpact: string;
  slippage: number;
}

export interface SwapWidgetRenderProps {
  getQuote: (
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ) => Promise<void>;
  executeSwap: () => Promise<void>;
  quote?: SwapQuote;
  isLoadingQuote: boolean;
  isExecutingSwap: boolean;
  error?: Error;
  hash?: string;
}

export interface SwapWidgetProps extends BaseComponentProps {
  defaultSlippage?: number;
  onSuccess?: (hash: string) => void;
  children?: RenderPropChild<SwapWidgetRenderProps> | React.ReactNode;
}

/**
 * SwapWidget Component
 *
 * Headless swap interface for Swappi DEX. Use render prop for custom UI.
 *
 * @example
 * ```tsx
 * <SwapWidget defaultSlippage={0.5}>
 *   {({ getQuote, executeSwap, quote, isLoadingQuote }) => (
 *     <div>
 *       <button onClick={() => getQuote('WCFX', 'USDT', '1.0')}>
 *         Get Quote
 *       </button>
 *       {quote && <p>You get: {quote.amountOut}</p>}
 *       <button onClick={executeSwap} disabled={!quote}>
 *         Swap
 *       </button>
 *     </div>
 *   )}
 * </SwapWidget>
 * ```
 */
export function SwapWidget({
  defaultSlippage = 0.5,
  onSuccess,
  children,
  className,
}: SwapWidgetProps) {
  const { apiUrl } = useDevKitContext();
  const { isConnected, accountIndex } = useWalletContext();

  const [quote, setQuote] = useState<SwapQuote>();
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [error, setError] = useState<Error>();
  const [hash, setHash] = useState<string>();

  const [currentQuoteParams, setCurrentQuoteParams] = useState<{
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
  }>();

  const getQuote = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ) => {
    if (!isConnected) {
      setError(new Error('Wallet not connected'));
      return;
    }

    setIsLoadingQuote(true);
    setError(undefined);

    try {
      // In production, call backend API to get quote from Swappi
      // For now, simulate quote
      const mockQuote: SwapQuote = {
        amountIn,
        amountOut: (parseFloat(amountIn) * 0.997).toString(), // 0.3% fee
        amountOutMin: (parseFloat(amountIn) * 0.997 * 0.995).toString(), // With slippage
        priceImpact: '0.3',
        slippage: defaultSlippage,
      };

      setQuote(mockQuote);
      setCurrentQuoteParams({ tokenIn, tokenOut, amountIn });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get quote'));
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const executeSwap = async () => {
    if (
      !quote ||
      !currentQuoteParams ||
      !isConnected ||
      accountIndex === undefined
    ) {
      setError(new Error('Missing required data for swap'));
      return;
    }

    setIsExecutingSwap(true);
    setError(undefined);

    try {
      // In production, call backend API to execute swap on Swappi
      // For now, simulate swap
      const mockHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      setHash(mockHash);
      onSuccess?.(mockHash);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Swap failed'));
    } finally {
      setIsExecutingSwap(false);
    }
  };

  const renderProps: SwapWidgetRenderProps = {
    getQuote,
    executeSwap,
    quote,
    isLoadingQuote,
    isExecutingSwap,
    error,
    hash,
  };

  // If children is a function, use render prop pattern
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  // Default rendering
  return (
    <div className={className || 'p-4 border rounded-lg'}>
      <h2 className="text-xl font-bold mb-4">Swap (Swappi)</h2>

      {!isConnected && (
        <p className="text-gray-600">Connect wallet to start swapping</p>
      )}

      {quote && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p>Amount In: {quote.amountIn}</p>
          <p>Amount Out: {quote.amountOut}</p>
          <p>Min Amount: {quote.amountOutMin}</p>
          <p>Slippage: {quote.slippage}%</p>
        </div>
      )}

      {hash && (
        <div className="mt-4 p-3 bg-green-100 rounded">
          <p className="text-sm font-semibold">Swap Successful!</p>
          <p className="text-xs font-mono break-all">{hash}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 rounded">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {children}
    </div>
  );
}
