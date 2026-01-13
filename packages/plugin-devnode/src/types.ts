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
 * Types for DevNode Plugin
 * Re-exports types needed from @conflux-devkit/core
 */

// Mining Configuration
export interface MiningConfig {
  enabled?: boolean;
  interval?: number;
  autoStart?: boolean;
}

// Node Configuration
export interface NodeConfig {
  chainId?: number;
  evmChainId?: number;
  coreRpcPort?: number;
  evmRpcPort?: number;
  wsPort?: number;
  dataDir?: string;
  mnemonic?: string;
  logging?: boolean;
  devBlockIntervalMs?: number;
}

export interface ServerConfig extends NodeConfig {
  jsonrpcHttpPort?: number;
  jsonrpcHttpEthPort?: number;
  jsonrpcWsPort?: number;
  jsonrpcWsEthPort?: number;
  log?: boolean;
  accounts?: number;
  balance?: string;
  mining?: MiningConfig;
  devPackTxImmediately?: boolean;
}

// Start Options
export interface StartOptions {
  mining?: boolean;
  waitForBlocks?: boolean;
}

// Mining Status
export interface MiningStatus {
  isRunning: boolean;
  interval?: number;
  blocksMined?: number;
  blocksGenerated?: number;
  startTime?: Date;
}

// Account Info
export interface AccountInfo {
  index: number;
  coreAddress: string;
  evmAddress: string;
  privateKey: string;
  evmPrivateKey?: string;
  coreBalance?: string;
  evmBalance?: string;
  path?: string;
  evmPath?: string;
  mnemonic?: string;
}

// Faucet Balances
export interface FaucetBalances {
  core: string;
  evm: string;
}

// Chain Balances
export interface ChainBalances {
  core: string;
  evm: string;
}

// Server Status
export type ServerStatus =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';

// Chain Type
export type ChainType = 'core' | 'evm';

// Node Error Interface
export interface ConfluxNodeError {
  code: string;
  chain?: ChainType;
  context?: Record<string, unknown>;
}

// Node Error Class
export class NodeError extends Error implements ConfluxNodeError {
  public readonly code: string;
  public readonly chain?: ChainType;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    chain?: ChainType,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NodeError';
    this.code = code;
    this.chain = chain;
    this.context = context;
  }
}
