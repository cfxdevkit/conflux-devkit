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
 * Wallet Provider
 *
 * Manages wallet connection state and provides wallet-related functionality
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { ChainType } from '@conflux-devkit/core';

export interface WalletContextValue {
  isConnected: boolean;
  address?: string;
  coreAddress?: string;
  evmAddress?: string;
  chain?: ChainType;
  accountIndex?: number;
  connect: (accountIndex: number) => Promise<void>;
  disconnect: () => void;
  switchChain: (chain: ChainType) => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Wallet Provider Component
 *
 * Manages wallet connection state
 *
 * @example
 * ```tsx
 * <WalletProvider>
 *   <ConnectButton />
 *   <AccountCard />
 * </WalletProvider>
 * ```
 */
export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [coreAddress, setCoreAddress] = useState<string>();
  const [evmAddress, setEvmAddress] = useState<string>();
  const [chain, setChain] = useState<ChainType>('evm');
  const [accountIndex, setAccountIndex] = useState<number>();

  const connect = async (index: number) => {
    // In production, this would fetch account info from backend
    // For now, simulate connection
    setAccountIndex(index);
    setCoreAddress(`cfx:account${index}`);
    setEvmAddress(`0xaccount${index}`);
    setIsConnected(true);
  };

  const disconnect = () => {
    setIsConnected(false);
    setCoreAddress(undefined);
    setEvmAddress(undefined);
    setAccountIndex(undefined);
  };

  const switchChain = (newChain: ChainType) => {
    setChain(newChain);
  };

  const value: WalletContextValue = {
    isConnected,
    address: chain === 'core' ? coreAddress : evmAddress,
    coreAddress,
    evmAddress,
    chain,
    accountIndex,
    connect,
    disconnect,
    switchChain,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/**
 * Hook to access Wallet context
 *
 * @throws Error if used outside WalletProvider
 */
export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
}
