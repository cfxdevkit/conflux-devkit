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

export { ContractService } from './contract-service.js';
export { KeystoreService, getKeystoreService, initializeKeystoreService } from './keystore-service.js';
export { SwapService } from './swap-service.js';
export { TransactionService } from './transaction-service.js';
export { WalletService } from './wallet-service.js';

export type { DerivedAccount, KeystoreEntry, KeystoreFile } from './keystore-service.js';
export type {
    SwapExecuteParams,
    SwapQuote, SwapQuoteParams, SwapResult
} from './swap-service.js';
export type { SendTransactionOptions } from './transaction-service.js';
export type { AccountInfo } from './wallet-service.js';

