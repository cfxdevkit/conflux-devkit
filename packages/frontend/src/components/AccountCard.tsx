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
import { DevKitApiService } from '../services/api';
import type { AccountInfo, AccountBalance } from '../types/accounts';

interface AccountCardProps {
  account: AccountInfo;
  isSelected: boolean;
  onSelect: (index: number) => void;
  currentNetwork: 'local' | 'testnet' | 'mainnet';
}

export function AccountCard({ 
  account, 
  isSelected, 
  onSelect, 
  currentNetwork 
}: AccountCardProps) {
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [loading, setLoading] = useState(false);

  // Format address for display (show first 6 and last 4 characters)
  const formatAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance for display (convert from Drip to CFX)
  const formatBalance = (balance: string) => {
    if (!balance || balance === '0') return '0';
    const cfx = parseFloat(balance) / Math.pow(10, 18);
    return cfx.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 3 
    });
  };

  // Load balance when component mounts or network changes
  useEffect(() => {
    const loadBalance = async () => {
      setLoading(true);
      try {
        if (currentNetwork === 'local') {
          // For local network, try to get balance from DevKit backend
          const balanceData = await DevKitApiService.getAccountBalance(account.index);
          setBalance(balanceData);
        } else {
          // For testnet/mainnet, these accounts can connect to real endpoints
          // but we don't fetch balances through DevKit backend
          setBalance({
            index: account.index,
            balances: { core: '0', evm: '0' },
            nodeStatus: `Ready for ${currentNetwork}`,
            // Note: No error - these accounts are valid for the network
          });
        }
      } catch (error) {
        console.error(`Failed to load balance for account ${account.index}:`, error);
        
        if (currentNetwork === 'local') {
          // Local network: Node is not running
          setBalance({
            index: account.index,
            balances: { core: '0', evm: '0' },
            error: 'Local node not running',
            nodeStatus: 'disconnected'
          });
        } else {
          // Testnet/mainnet: Connection issue, but accounts are still valid
          setBalance({
            index: account.index,
            balances: { core: '0', evm: '0' },
            nodeStatus: `Ready for ${currentNetwork}`,
            error: 'Unable to connect to backend'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, [account.index, currentNetwork]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(account.index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(account.index);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <input
            type="radio"
            checked={isSelected}
            onChange={() => onSelect(account.index)}
            className="mr-3 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex items-center">
            <span className="font-medium text-gray-900">
              Account {account.index}
            </span>
            {account.isAdmin && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>
        </div>
        
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Addresses */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-500 w-12">Core:</span>
            <code className="text-sm text-gray-700 font-mono">
              {formatAddress(account.addresses.core)}
            </code>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(account.addresses.core);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Copy Core address"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-500 w-12">eSpace:</span>
            <code className="text-sm text-gray-700 font-mono">
              {formatAddress(account.addresses.evm)}
            </code>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(account.addresses.evm);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Copy eSpace address"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002 2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
          </button>
        </div>
      </div>

            {/* Balances or Status */}
      {balance && (
        <div className="space-y-2">
          {/* Show balances only for local network when node is running */}
          {currentNetwork === 'local' && !balance.error && (
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <span className="text-gray-500">Core:</span>
                <span className="ml-2 font-medium text-green-600">
                  {formatBalance(balance.balances.core)} CFX
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500">eSpace:</span>
                <span className="ml-2 font-medium text-purple-600">
                  {formatBalance(balance.balances.evm)} CFX
                </span>
              </div>
            </div>
          )}

          {/* Show status for all networks */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Status:</span>
            <span className={`font-medium ${
              balance.nodeStatus === 'disconnected' ? 'text-red-600' :
              balance.nodeStatus?.includes('Ready') ? 'text-blue-600' :
              balance.nodeStatus?.includes('Connected') ? 'text-green-600' :
              'text-gray-600'
            }`}>
              {balance.nodeStatus || (currentNetwork === 'local' ? 'Node running' : `Available on ${currentNetwork}`)}
            </span>
          </div>

          {/* Show helpful information for testnet/mainnet */}
          {currentNetwork !== 'local' && !balance.error && (
            <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
              💡 Import private key to external wallet to use on {currentNetwork}
            </div>
          )}

          {/* Show error message */}
          {balance.error && (
            <div className="text-xs text-red-600">
              {balance.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}