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
 * Conflux DevKit Wallet - Advanced Wallet Abstractions
 *
 * This package provides advanced wallet management features for Conflux applications:
 * - Session Keys: Temporary delegated signing with permissions
 * - Transaction Batching: Efficient multi-transaction execution
 * - Embedded Wallets: Server-side custody for seamless UX
 *
 * @packageDocumentation
 */

// Session Keys
export { SessionKeyManager } from './session-keys/manager.js';

// Transaction Batching
export { TransactionBatcher } from './batching/batcher.js';

// Embedded Wallets
export { EmbeddedWalletManager } from './embedded/custody.js';

// Types
export type {
  // Session Keys
  SessionKey,
  SessionKeyOptions,
  SessionKeyPermissions,

  // Batching
  BatchTransaction,
  BatchResult,
  BatcherOptions,

  // Embedded Wallets
  EmbeddedWallet,
  WalletExport,
  EmbeddedWalletOptions,

  // Common
  SignTransactionRequest,
  SignedTransaction,
  WalletManagerOptions,
} from './types/index.js';

// Errors
export {
  WalletError,
  SessionKeyError,
  BatcherError,
  EmbeddedWalletError,
} from './types/index.js';

// Version
export const VERSION = '0.1.0';
