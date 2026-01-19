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
 * DevKit Provider
 *
 * Provides DevKit instance and configuration to all child components
 */

import React, { createContext, type ReactNode, useContext } from 'react';

export interface DevKitContextValue {
  /** Backend API URL */
  apiUrl: string;
  /** WebSocket URL */
  wsUrl?: string;
  /** Current network */
  network: 'local' | 'testnet' | 'mainnet';
  /** Enable debug mode */
  debug?: boolean;
}

const DevKitContext = createContext<DevKitContextValue | undefined>(undefined);

export interface DevKitProviderProps {
  apiUrl: string;
  wsUrl?: string;
  network?: 'local' | 'testnet' | 'mainnet';
  debug?: boolean;
  children: ReactNode;
}

/**
 * DevKit Provider Component
 *
 * Wrap your app with this provider to enable DevKit functionality
 *
 * @example
 * ```tsx
 * <DevKitProvider apiUrl="http://localhost:3000" network="local">
 *   <App />
 * </DevKitProvider>
 * ```
 */
export function DevKitProvider({
  apiUrl,
  wsUrl,
  network = 'local',
  debug = false,
  children,
}: DevKitProviderProps) {
  const value: DevKitContextValue = {
    apiUrl,
    wsUrl,
    network,
    debug,
  };

  return (
    <DevKitContext.Provider value={value}>{children}</DevKitContext.Provider>
  );
}

/**
 * Hook to access DevKit context
 *
 * @throws Error if used outside DevKitProvider
 */
export function useDevKitContext() {
  const context = useContext(DevKitContext);
  if (!context) {
    throw new Error('useDevKitContext must be used within DevKitProvider');
  }
  return context;
}
