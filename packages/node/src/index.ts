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

// Conflux DevKit Node - Unified Client Library
// Main entry point for the dual-chain Conflux client library

// DevKit - Main ergonomic API
export { DevKit, DevKitAccount } from './devkit.js';

// Core Space Clients
export { CoreClient, CoreWalletClient, CoreTestClient, createCoreClient } from './clients/core.js';

// EVM Space Clients
export { EspaceClient, EspaceWalletClient, EspaceTestClient, createEspaceClient } from './clients/evm.js';

// Client Manager - Main orchestration layer
export { ClientManager, createClientManager } from './manager/index.js';
export type { ClientManagerConfig, ClientManagerStatus, ClientManagerEvents } from './manager/index.js';

// Server Manager - Development node lifecycle
export { ServerManager } from './server/index.js';

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

// Base types and interfaces
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
  NodeConfig,
  ServerConfig,
  ServerStatus,
  AccountInfo,
  MiningConfig,
  MiningStatus,
  Log,
  NodeError,
} from './types/index.js';

// Re-export useful utilities from dependencies
export { formatCFX, parseCFX } from 'cive';
export { formatUnits, parseUnits } from 'cive/utils';

// Version info
export const VERSION = '0.2.0';