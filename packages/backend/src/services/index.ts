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
 * Backend Services
 *
 * Export all service modules for easy importing
 */

// Re-export keystore types
export type {
  AddMnemonicData,
  ConfigModificationCheck,
  DerivedKeys,
  KeystoreV2,
  MnemonicEntry,
  MnemonicSummary,
  NodeConfig,
  SetupData,
  ValidationResult,
} from '../types/keystore.js';
export { ContractService } from './contract-service.js';
export { EncryptionService } from './encryption-service.js';
export type { DerivedAccount } from './keystore-service.js';
export {
  getKeystoreService,
  KeystoreLockedError,
  KeystoreService,
} from './keystore-service.js';
export { SetupService } from './setup-service.js';
export type {
  SwapExecuteParams,
  SwapQuote,
  SwapQuoteParams,
  SwapResult,
} from './swap-service.js';
export { SwapService } from './swap-service.js';
export type { SendTransactionOptions } from './transaction-service.js';
export { TransactionService } from './transaction-service.js';
export type { AccountInfo } from './wallet-service.js';
export { WalletService } from './wallet-service.js';
