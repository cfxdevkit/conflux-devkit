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
 * AccountCard - Headless Account Display Component
 *
 * Displays account information with customizable rendering
 */

import React from 'react';
import { useWalletContext } from '../../providers/WalletProvider.js';
import { useBalance } from '../../hooks/useBalance.js';
import type { BaseComponentProps, RenderPropChild } from '../../types/index.js';

export interface AccountCardRenderProps {
  isConnected: boolean;
  coreAddress?: string;
  evmAddress?: string;
  coreBalance?: string;
  evmBalance?: string;
  isLoadingBalance: boolean;
}

export interface AccountCardProps extends BaseComponentProps {
  showBalance?: boolean;
  children?: RenderPropChild<AccountCardRenderProps> | React.ReactNode;
}

/**
 * AccountCard Component
 *
 * Headless account information display. Use render prop pattern for custom UI.
 *
 * @example
 * ```tsx
 * // With render prop
 * <AccountCard showBalance>
 *   {({ coreAddress, evmAddress, coreBalance, evmBalance }) => (
 *     <div>
 *       <p>Core: {coreAddress}</p>
 *       <p>EVM: {evmAddress}</p>
 *       <p>Balance: {coreBalance}</p>
 *     </div>
 *   )}
 * </AccountCard>
 *
 * // With default styling
 * <AccountCard showBalance className="p-4 bg-gray-100 rounded" />
 * ```
 */
export function AccountCard({
  showBalance = true,
  children,
  className,
}: AccountCardProps) {
  const { isConnected, coreAddress, evmAddress, chain } = useWalletContext();

  const { balance: coreBalance, isLoading: isLoadingCore } = useBalance({
    address: coreAddress,
    chain: 'core',
    enabled: showBalance && isConnected,
  });

  const { balance: evmBalance, isLoading: isLoadingEvm } = useBalance({
    address: evmAddress,
    chain: 'evm',
    enabled: showBalance && isConnected,
  });

  const renderProps: AccountCardRenderProps = {
    isConnected,
    coreAddress,
    evmAddress,
    coreBalance,
    evmBalance,
    isLoadingBalance: isLoadingCore || isLoadingEvm,
  };

  // If children is a function, use render prop pattern
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  // If not connected, show nothing or custom children
  if (!isConnected) {
    return children ? <div className={className}>{children}</div> : null;
  }

  // Default rendering
  return (
    <div className={className || 'p-4 bg-gray-100 rounded-lg space-y-2'}>
      <div>
        <span className="font-semibold">Core Space:</span>
        <span className="ml-2 font-mono text-sm">{coreAddress}</span>
        {showBalance && (
          <span className="ml-2 text-gray-600">
            {isLoadingCore ? 'Loading...' : `${coreBalance} CFX`}
          </span>
        )}
      </div>
      <div>
        <span className="font-semibold">eSpace:</span>
        <span className="ml-2 font-mono text-sm">{evmAddress}</span>
        {showBalance && (
          <span className="ml-2 text-gray-600">
            {isLoadingEvm ? 'Loading...' : `${evmBalance} CFX`}
          </span>
        )}
      </div>
    </div>
  );
}
