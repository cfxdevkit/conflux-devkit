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
 * UI Headless Types
 */

import type { ChainType } from '@conflux-devkit/core';

export interface WalletConnection {
  isConnected: boolean;
  address?: string;
  chainType?: ChainType;
  balance?: string;
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  type: 'local' | 'testnet' | 'mainnet';
  rpcUrl: string;
}

export interface ContractDeployment {
  address: string;
  transactionHash: string;
  chain: ChainType;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  blockNumber?: bigint;
}

export type RenderPropChild<T> = (props: T) => React.ReactNode;

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode | RenderPropChild<any>;
}
