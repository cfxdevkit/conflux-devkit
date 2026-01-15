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

// Conflux DevKit Core - Foundation Package
// Blockchain clients, types, and configuration without dev dependencies

// Core Space Clients
export { CoreClient, CoreWalletClient, CoreTestClient } from './clients/core.js';

// EVM Space Clients
export { EspaceClient, EspaceWalletClient, EspaceTestClient } from './clients/evm.js';

// Client Manager - Main orchestration layer
export { ClientManager } from './clients/manager.js';
export type { ClientManagerConfig, ClientManagerStatus, ClientManagerEvents } from './clients/manager.js';

// Chain Configuration and Network Management
export {
  NetworkSelector,
  defaultNetworkSelector,
  SUPPORTED_CHAINS,
  getChainConfig,
  getCoreChains,
  getEvmChains,
  getMainnetChains,
  getTestnetChains,
  isValidChainId,
  toCiveChain,
  toViemChain,
  CORE_MAINNET,
  CORE_TESTNET,
  CORE_LOCAL,
  EVM_MAINNET,
  EVM_TESTNET,
  EVM_LOCAL
} from './config/chains.js';
export type { ChainConfig } from './config/chains.js';

// Base types and interfaces (excluding node-specific types)
export type {
  ClientConfig,
  WalletConfig,
  TestConfig,
  ChainClient,
  WalletClient,
  TestClient,
  BaseTransaction,
  TransactionReceipt,
  CoreClientInstance,
  EspaceClientInstance,
  HealthStatus,
  SupportedChainId,
  ChainType,
  AccountInfo,
  Log,
} from './types/index.js';

// Re-export useful utilities from dependencies
export { formatCFX, parseCFX } from 'cive';
export { formatUnits, parseUnits, isAddress as isCoreAddress } from 'cive/utils';
export { isAddress as isEspaceAddress } from 'viem';

// Version info
export const VERSION = '0.1.0';
