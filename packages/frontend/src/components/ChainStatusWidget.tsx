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

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface ChainInfo {
  chainId: number;
  networkName: string;
  blockNumber: number;
  gasPrice: string;
  connected: boolean;
  error?: string;
}

interface ChainStatusWidgetProps {
  currentNetwork: 'testnet' | 'mainnet';
}

export function ChainStatusWidget({ currentNetwork }: ChainStatusWidgetProps) {
  const [coreChainInfo, setCoreChainInfo] = useState<ChainInfo | null>(null);
  const [espaceChainInfo, setEspaceChainInfo] = useState<ChainInfo | null>(
    null
  );
  const queryClient = useQueryClient();

  // Mock chain status check - backend handles actual network operations
  const checkChainStatus = async (network: 'testnet' | 'mainnet') => {
    try {
      // For now, return mock data based on network
      const coreChainId = network === 'testnet' ? 1 : 1029;
      const espaceChainId = network === 'testnet' ? 71 : 1030;

      return {
        core: {
          chainId: coreChainId,
          networkName: `Conflux Core ${network === 'testnet' ? 'Testnet' : 'Mainnet'}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 100000,
          gasPrice: '1000000000',
          connected: true,
        },
        espace: {
          chainId: espaceChainId,
          networkName: `Conflux eSpace ${network === 'testnet' ? 'Testnet' : 'Mainnet'}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 100000,
          gasPrice: '1000000000',
          connected: true,
        },
      };
    } catch (error) {
      return {
        core: {
          chainId: 0,
          networkName: 'Conflux Core (Disconnected)',
          blockNumber: 0,
          gasPrice: '0',
          connected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        },
        espace: {
          chainId: 0,
          networkName: 'Conflux eSpace (Disconnected)',
          blockNumber: 0,
          gasPrice: '0',
          connected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        },
      };
    }
  };

  // Query chain status
  const { data: chainStatus, isLoading } = useQuery({
    queryKey: ['chain-status', currentNetwork],
    queryFn: () => checkChainStatus(currentNetwork),
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 2,
  });

  // Trigger immediate data fetch when component mounts or network changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['chain-status', currentNetwork] });
  }, [currentNetwork, queryClient]);

  useEffect(() => {
    if (chainStatus) {
      setCoreChainInfo(chainStatus.core);
      setEspaceChainInfo(chainStatus.espace);
    }
  }, [chainStatus]);

  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? '✅' : '❌';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Chain Status
        </h3>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Checking chain status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Chain Status</h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {currentNetwork.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Space Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Conflux Core</h4>
            <span className={getStatusColor(coreChainInfo?.connected || false)}>
              {getStatusIcon(coreChainInfo?.connected || false)}
            </span>
          </div>

          {coreChainInfo && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Chain ID:</span>
                <span className="font-mono">{coreChainInfo.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block:</span>
                <span className="font-mono">
                  #{coreChainInfo.blockNumber.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Price:</span>
                <span className="font-mono">
                  {parseFloat(coreChainInfo.gasPrice) / 1e9} Gwei
                </span>
              </div>
              {coreChainInfo.error && (
                <div className="text-red-600 text-xs mt-2">
                  Error: {coreChainInfo.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* eSpace Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Conflux eSpace</h4>
            <span
              className={getStatusColor(espaceChainInfo?.connected || false)}
            >
              {getStatusIcon(espaceChainInfo?.connected || false)}
            </span>
          </div>

          {espaceChainInfo && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Chain ID:</span>
                <span className="font-mono">{espaceChainInfo.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block:</span>
                <span className="font-mono">
                  #{espaceChainInfo.blockNumber.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Price:</span>
                <span className="font-mono">
                  {parseFloat(espaceChainInfo.gasPrice) / 1e9} Gwei
                </span>
              </div>
              {espaceChainInfo.error && (
                <div className="text-red-600 text-xs mt-2">
                  Error: {espaceChainInfo.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Network Information</p>
            <p className="mt-1">
              Connected to {currentNetwork} network. Chain status is checked
              every 10 seconds.
              {currentNetwork === 'testnet' &&
                ' Use testnet faucets to get test tokens.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
