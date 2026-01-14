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
  config?: {
    chainId?: number;
    evmChainId?: number;
    ports?: {
      jsonrpcHttp?: number;
      jsonrpcHttpEth?: number;
      jsonrpcWs?: number;
    };
  };
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

export interface MiningConfig {
  autoMining: boolean;
  blockTime?: number;
}

export interface FaucetRequest {
  address: string;
  amount: string;
  chain?: 'core' | 'eSpace' | 'auto';
}
