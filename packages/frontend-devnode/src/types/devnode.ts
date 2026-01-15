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

export interface DevNodeStatus {
  isRunning: boolean;
  network: NetworkType;
  networkConfig: NetworkConfig;
  capabilities: NetworkCapabilities;
  coreSpace: {
    chainId: number;
    rpcUrl: string;
    blockNumber: number;
    gasPrice: string;
  };
  eSpace: {
    chainId: number;
    rpcUrl: string;
    blockNumber: number;
    gasPrice: string;
  };
  miningMode: 'auto' | 'manual';
  miningInterval?: number;
  config?: NodeConfig;
  accounts: DevNodeAccount[];
}

export interface DevNodeInfo {
  core: {
    clientVersion?: string;
    chainId?: number;
    networkId?: number;
  };
  eSpace: {
    clientVersion?: string;
    chainId?: number;
    networkId?: number;
  };
}

export interface NodeConfig {
  chainId: number;
  evmChainId: number;
  accountsCount?: number; // Number of accounts to generate from mnemonic (1-20)
  miningAuthor?: string; // Core address to receive mining rewards
  jsonrpcHttpPort?: number;
  jsonrpcWsPort?: number;
  jsonrpcHttpEthPort?: number;
  jsonrpcWsEthPort?: number;
}

export interface DevNodeAccount {
  index: number;
  addresses: {
    core: string;
    evm: string;
  };
  isAdmin: boolean;
  balance?: {
    core: string;
    eSpace: string;
  };
}

export interface FaucetRequest {
  address: string;
  amount: string;
  chain?: 'core' | 'eSpace' | 'auto';
}

// Network types
export type NetworkType = 'local' | 'testnet' | 'mainnet';

export interface NetworkConfig {
  evmChainId: number;
  rpcUrl: string;
  coreNetworkId: number;
  coreRpcUrl: string;
}

export interface NetworkCapabilities {
  canMine: boolean;
  canUseFaucet: boolean;
  canControlNode: boolean;
  canResetNode: boolean;
  canDeploy: boolean;
  canMonitor: boolean;
  requiresWallet: boolean;
}
