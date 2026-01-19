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
 * ConnectButton - Headless Wallet Connection Component
 *
 * Provides wallet connection functionality with customizable rendering
 */

import React from 'react';
import { useWalletContext } from '../../providers/WalletProvider.js';
import type { BaseComponentProps, RenderPropChild } from '../../types/index.js';

export interface ConnectButtonRenderProps {
  isConnected: boolean;
  address?: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
}

export interface ConnectButtonProps extends BaseComponentProps {
  accountIndex?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  children?: RenderPropChild<ConnectButtonRenderProps> | React.ReactNode;
}

/**
 * ConnectButton Component
 *
 * Headless wallet connection button. Use render prop pattern for custom UI.
 *
 * @example
 * ```tsx
 * // With render prop (full control)
 * <ConnectButton>
 *   {({ isConnected, address, connect, disconnect }) => (
 *     <button onClick={isConnected ? disconnect : connect}>
 *       {isConnected ? `Connected: ${address}` : 'Connect Wallet'}
 *     </button>
 *   )}
 * </ConnectButton>
 *
 * // With default styling
 * <ConnectButton className="px-4 py-2 bg-blue-500 text-white rounded" />
 * ```
 */
export function ConnectButton({
  accountIndex = 0,
  onConnect,
  onDisconnect,
  children,
  className,
}: ConnectButtonProps) {
  const {
    isConnected,
    address,
    connect: contextConnect,
    disconnect: contextDisconnect,
  } = useWalletContext();
  const [isLoading, setIsLoading] = React.useState(false);

  const connect = async () => {
    setIsLoading(true);
    try {
      await contextConnect(accountIndex);
      onConnect?.();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    contextDisconnect();
    onDisconnect?.();
  };

  const renderProps: ConnectButtonRenderProps = {
    isConnected,
    address,
    connect,
    disconnect,
    isLoading,
  };

  // If children is a function, use render prop pattern
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }

  // If children provided, wrap in default button
  if (children) {
    return (
      <button
        onClick={isConnected ? disconnect : connect}
        disabled={isLoading}
        className={className}
        type="button"
      >
        {children}
      </button>
    );
  }

  // Default rendering with Tailwind classes
  return (
    <button
      onClick={isConnected ? disconnect : connect}
      disabled={isLoading}
      className={
        className ||
        'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
      }
      type="button"
    >
      {isLoading
        ? 'Connecting...'
        : isConnected
          ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`
          : 'Connect Wallet'}
    </button>
  );
}
