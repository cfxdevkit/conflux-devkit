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

export type {
  AccountCardProps,
  AccountCardRenderProps,
  ConnectButtonProps,
  ConnectButtonRenderProps,
  ContractReaderProps,
  ContractReaderRenderProps,
  ContractWriterProps,
  ContractWriterRenderProps,
  SwapQuote,
  SwapWidgetProps,
  SwapWidgetRenderProps,
} from './components/index.js';
// Components
export {
  AccountCard,
  ConnectButton,
  ContractReader,
  ContractWriter,
  SwapWidget,
} from './components/index.js';
export type {
  ReadContractOptions,
  SendTransactionOptions,
  TransactionResult,
  UseBalanceOptions,
  UseBalanceReturn,
  UseContractReturn,
  UseTransactionReturn,
  WriteContractOptions,
} from './hooks/index.js';
// Hooks
export {
  useBalance,
  useContract,
  useTransaction,
} from './hooks/index.js';
// Types
export type {
  DevKitContextValue,
  DevKitProviderProps,
  WalletContextValue,
  WalletProviderProps,
} from './providers/index.js';
// Providers
export {
  DevKitProvider,
  useDevKitContext,
  useWalletContext,
  WalletProvider,
} from './providers/index.js';

export type {
  BaseComponentProps,
  ContractDeployment,
  NetworkInfo,
  RenderPropChild,
  TransactionResult as TxResult,
  WalletConnection,
} from './types/index.js';

// Version
export const VERSION = '1.0.0';
