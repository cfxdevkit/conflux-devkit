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

import { ConnectButton } from './ConnectButton';
import { NetworkDropdown } from './NetworkDropdown';
import { useAuthStore } from '../stores/authStore';

interface HeaderProps {
  currentNetwork: 'local' | 'testnet' | 'mainnet';
  nodeRunning: boolean;
  onNetworkChange: (network: 'local' | 'testnet' | 'mainnet') => void;
}

export function Header({
  currentNetwork,
  nodeRunning,
  onNetworkChange,
}: HeaderProps) {
  const { isAdmin } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Conflux DevKit
          </h1>
          {isAdmin && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Admin
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <NetworkDropdown
            currentNetwork={currentNetwork}
            nodeRunning={nodeRunning}
            onNetworkChange={onNetworkChange}
          />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}