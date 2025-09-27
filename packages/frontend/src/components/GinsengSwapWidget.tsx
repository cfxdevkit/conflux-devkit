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

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { confluxESpaceTestnet, confluxESpace } from 'wagmi/chains';

import { useAuthStore } from '../stores/authStore';

// Token Configuration
const TOKENS = {
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18,
  },
} as const;

// Swap interfaces
interface SwapQuote {
  fromToken: typeof TOKENS[keyof typeof TOKENS];
  toToken: typeof TOKENS[keyof typeof TOKENS];
  amountIn: string;
  amountOut: string;
  fee: number;
  path: string;
  poolExists: boolean;
}

interface SwapBalances {
  address: string;
  balances: {
    USDT: string;
    USDC: string;
    CFX: string;
  };
}

interface GinsengSwapWidgetProps {
  isVisible: boolean;
  currentNetwork: string;
}

export function GinsengSwapWidget({ isVisible, currentNetwork }: GinsengSwapWidgetProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sessionId } = useAuthStore();
  const [fromToken, setFromToken] = useState<'USDT' | 'USDC'>('USDT');
  const [toToken, setToToken] = useState<'USDT' | 'USDC'>('USDC');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [balances, setBalances] = useState<SwapBalances | null>(null);
  const [selectedFee, setSelectedFee] = useState<500 | 3000 | 10000>(3000);
  const [slippage, setSlippage] = useState(0.5); // 0.5%
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show on testnet and mainnet (production)
  if (!isVisible || (currentNetwork !== 'testnet' && currentNetwork !== 'mainnet')) {
    return null;
  }



  // Get the correct chain ID based on network
  const getTargetChainId = () => {
    return currentNetwork === 'testnet' ? confluxESpaceTestnet.id : confluxESpace.id;
  };

  // Check if user is on the correct chain
  const targetChainId = getTargetChainId();
  const isOnCorrectChain = chainId === targetChainId;

  // Auto-switch to appropriate chain when component loads
  useEffect(() => {
    if (isConnected && !isOnCorrectChain) {
      switchChain?.({ chainId: targetChainId });
    }
  }, [isConnected, isOnCorrectChain, targetChainId, switchChain]);

  // Load balances when component mounts
  useEffect(() => {
    const loadBalances = async () => {
      if (!sessionId) {
        console.log('No session ID available for balance loading');
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/swap/balances?network=${currentNetwork}`, {
          headers: {
            'Authorization': `Bearer ${sessionId}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setBalances(data);
          setError(null);
        } else {
          const errorText = await response.text();
          console.error('Balance fetch failed:', response.status, errorText);
          setError('Failed to load balances');
        }
      } catch (error) {
        console.error('Failed to load balances:', error);
        setError('Failed to load balances');
      } finally {
        setIsLoading(false);
      }
    };

    if ((currentNetwork === 'testnet' || currentNetwork === 'mainnet') && sessionId) {
      loadBalances();
    }
  }, [currentNetwork, sessionId]);

  // Get quote when amount or tokens change
  useEffect(() => {
    const getQuote = async () => {
      if (!amount || parseFloat(amount) <= 0 || fromToken === toToken) {
        setQuote(null);
        return;
      }

      if (!sessionId) {
        console.log('No session ID available for quote fetching');
        return;
      }

      try {
        const response = await fetch('/api/swap/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`,
          },
          body: JSON.stringify({
            fromToken,
            toToken,
            amount,
            fee: selectedFee,
            network: currentNetwork,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setQuote(data);
          setError(null);
        } else {
          const errorText = await response.text();
          console.error('Quote fetch failed:', response.status, errorText);
          setQuote(null);
          setError('Failed to get quote');
        }
      } catch (error) {
        console.error('Quote error:', error);
        setQuote(null);
        setError('Failed to get quote');
      }
    };

    const debounceTimer = setTimeout(getQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [amount, fromToken, toToken, selectedFee, sessionId, currentNetwork]);

  const handleSwap = async () => {
    if (!amount || !quote || !sessionId) return;

    setIsSwapping(true);
    setError(null);

    try {
      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          fee: selectedFee,
          slippage,
          network: currentNetwork,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Swap successful:', data);

        // Refresh balances after successful swap
        const balanceResponse = await fetch(`/api/swap/balances?network=${currentNetwork}`, {
          headers: {
            'Authorization': `Bearer ${sessionId}`,
          },
        });
        if (balanceResponse.ok) {
          const newBalances = await balanceResponse.json();
          setBalances(newBalances);
        }

        // Reset form
        setAmount('');
        setQuote(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Swap failed');
      }
    } catch (error) {
      console.error('Swap failed:', error);
      setError('Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleTokenSwitch = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setQuote(null);
  };

  const getTokenBalance = (token: 'USDT' | 'USDC') => {
    return balances?.balances[token] || '0.0000';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">GinsengSwap</h3>
          <p className="text-sm text-gray-600 mt-1">
            Uniswap V3 stablecoin DEX on Conflux eSpace {currentNetwork === 'mainnet' ? '(Mainnet)' : '(Testnet)'}
          </p>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">Powered by</span>
          <span className="text-sm font-medium text-green-600">Ginseng</span>
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Connect your wallet to start swapping</p>
        </div>
      ) : !isOnCorrectChain ? (
        <div className="text-center py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-yellow-800">Wrong Network</span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Please switch to Conflux eSpace Testnet to use GinsengSwap
            </p>
            <button
              onClick={() => switchChain?.({ chainId: targetChainId })}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Switch to Testnet
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* From Token */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">From</span>
              <span className="text-xs text-gray-500">
                Balance: {getTokenBalance(fromToken)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 text-lg font-medium bg-transparent border-none outline-none"
              />
              <button
                onClick={() => setAmount(getTokenBalance(fromToken))}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200"
              >
                MAX
              </button>
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value as 'USDT' | 'USDC')}
                className="text-sm font-medium bg-white border border-gray-300 rounded px-2 py-1"
              >
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTokenSwitch}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Token */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">To</span>
              <span className="text-xs text-gray-500">
                Balance: {getTokenBalance(toToken)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={quote ? parseFloat(quote.amountOut).toFixed(6) : ''}
                placeholder="0.0"
                disabled
                className="flex-1 text-lg font-medium bg-transparent border-none outline-none text-gray-600"
              />
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value as 'USDT' | 'USDC')}
                className="text-sm font-medium bg-white border border-gray-300 rounded px-2 py-1"
              >
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Pool Fee</span>
              <span className="text-sm font-medium text-gray-700">Slippage</span>
            </div>
            <div className="flex justify-between items-center">
              <select
                value={selectedFee}
                onChange={(e) => setSelectedFee(Number(e.target.value) as 500 | 3000 | 10000)}
                className="text-xs bg-white border border-gray-300 rounded px-2 py-1"
              >
                <option value={500}>0.05%</option>
                <option value={3000}>0.3%</option>
                <option value={10000}>1%</option>
              </select>
              <div className="flex space-x-1">
                {[0.1, 0.5, 1.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={`text-xs px-2 py-1 rounded ${
                      slippage === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {error && (
              <div className="w-full bg-red-50 border border-red-200 text-red-700 py-2 px-4 rounded-lg text-center text-sm mb-2">
                {error}
              </div>
            )}
            {fromToken === toToken ? (
              <div className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-lg text-center font-medium">
                Select different tokens
              </div>
            ) : !amount || parseFloat(amount) === 0 ? (
              <div className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-lg text-center font-medium">
                Enter amount
              </div>
            ) : isLoading ? (
              <div className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-lg text-center font-medium">
                Loading...
              </div>
            ) : !quote ? (
              <div className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-lg text-center font-medium">
                Getting quote...
              </div>
            ) : (
              <button
                onClick={handleSwap}
                disabled={isSwapping || !quote}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {isSwapping ? 'Swapping...' : 'Swap'}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1 pt-2">
            <div className="flex justify-between">
              <span>Network:</span>
              <span>Conflux eSpace Testnet</span>
            </div>
            {quote && (
              <div className="flex justify-between">
                <span>Estimated output:</span>
                <span>{parseFloat(quote.amountOut).toFixed(6)} {toToken}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}