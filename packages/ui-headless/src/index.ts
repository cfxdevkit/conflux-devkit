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
 * Conflux DevKit UI Headless - Customizable React Components
 *
 * This package provides headless React components for Conflux applications.
 * Components use the render prop pattern for maximum customization while
 * also providing default Tailwind-based styling.
 *
 * Features:
 * - Headless components with render props
 * - Default Tailwind styling
 * - React hooks for blockchain operations
 * - Context providers for state management
 * - Full TypeScript support
 *
 * @packageDocumentation
 */

// Providers
export {
  DevKitProvider,
  useDevKitContext,
  WalletProvider,
  useWalletContext,
} from './providers/index.js';

// Hooks
export {
  useBalance,
  useTransaction,
  useContract,
} from './hooks/index.js';

// Components
export {
  ConnectButton,
  AccountCard,
  ContractReader,
  ContractWriter,
  SwapWidget,
} from './components/index.js';

// Types
export type {
  DevKitProviderProps,
  DevKitContextValue,
  WalletProviderProps,
  WalletContextValue,
} from './providers/index.js';

export type {
  UseBalanceOptions,
  UseBalanceReturn,
  SendTransactionOptions,
  TransactionResult,
  UseTransactionReturn,
  ReadContractOptions,
  WriteContractOptions,
  UseContractReturn,
} from './hooks/index.js';

export type {
  ConnectButtonProps,
  ConnectButtonRenderProps,
  AccountCardProps,
  AccountCardRenderProps,
  ContractReaderProps,
  ContractReaderRenderProps,
  ContractWriterProps,
  ContractWriterRenderProps,
  SwapWidgetProps,
  SwapWidgetRenderProps,
  SwapQuote,
} from './components/index.js';

export type {
  WalletConnection,
  NetworkInfo,
  ContractDeployment,
  TransactionResult as TxResult,
  RenderPropChild,
  BaseComponentProps,
} from './types/index.js';

// Version
export const VERSION = '1.0.0';
