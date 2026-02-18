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
 * Wallet Module - HD Wallet Derivation
 *
 * Provides unified BIP32/BIP39 HD wallet derivation for both
 * Conflux Core Space and eSpace (EVM) addresses.
 *
 * @example
 * ```typescript
 * import {
 *   generateMnemonic,
 *   deriveAccounts,
 *   deriveFaucetAccount,
 * } from '@conflux-devkit/core/wallet';
 *
 * // Generate a new mnemonic
 * const mnemonic = generateMnemonic();
 *
 * // Derive 10 accounts
 * const accounts = deriveAccounts(mnemonic, { count: 10 });
 *
 * // Each account has both Core and eSpace addresses
 * console.log(accounts[0].coreAddress); // cfx:...
 * console.log(accounts[0].evmAddress);  // 0x...
 *
 * // Derive faucet/mining account
 * const faucet = deriveFaucetAccount(mnemonic);
 * ```
 *
 * @packageDocumentation
 */

// Derivation functions
export {
  deriveAccount,
  deriveAccounts,
  deriveFaucetAccount,
  generateMnemonic,
  getDerivationPath,
  validateMnemonic,
} from './derivation.js';

// Types and constants
export {
  COIN_TYPES,
  CORE_NETWORK_IDS,
  type DerivedAccount,
  type DerivationOptions,
  type MnemonicValidation,
} from './types.js';
