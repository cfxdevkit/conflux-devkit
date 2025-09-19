// RPC client interfaces aligned with viem/cive APIs

import type { AbiItem, TransactionRequest } from './blockchain';

// EVM RPC client interface (aligned with viem)
export interface EvmClient {
  getBalance: (params: { address: `0x${string}` }) => Promise<bigint>;
  getBlockNumber: () => Promise<bigint>;
  getBlock: (
    params: { blockNumber: bigint } | { blockTag: 'latest' }
  ) => Promise<Block>;
  waitForTransactionReceipt: (
    hash: `0x${string}`
  ) => Promise<TransactionReceipt>;
  readContract: (
    params: ReadContractParams
  ) => Promise<string | number | bigint | boolean | `0x${string}` | unknown[]>;
  writeContract: (params: WriteContractParams) => Promise<`0x${string}`>;
  sendTransaction: (params: SendTransactionParams) => Promise<`0x${string}`>;
  getGasPrice: () => Promise<bigint>;
  estimateGas: (params: TransactionRequest) => Promise<bigint>;
}

// Core RPC client interface (aligned with cive)
export interface CoreClient {
  getBalance: (address: `0x${string}`) => Promise<bigint>;
  getBlockNumber: () => Promise<bigint>;
  getBlock: (
    params: { blockNumber: bigint } | { blockTag: 'latest' }
  ) => Promise<Block>;
  sendTransaction: (params: CoreTransactionRequest) => Promise<`0x${string}`>;
  call: (params: {
    to: `0x${string}`;
    data: `0x${string}`;
  }) => Promise<`0x${string}`>;
  getNetworkId: () => Promise<number>;
  getEpochNumber: () => Promise<number>;
  getGasPrice: () => Promise<bigint>;
  estimateGas: (params: CoreTransactionRequest) => Promise<bigint>;
}

// Contract operation parameters
export interface ReadContractParams {
  address: `0x${string}`;
  abi: AbiItem[];
  functionName: string;
  args?: unknown[];
}

export interface WriteContractParams {
  address: `0x${string}`;
  abi: AbiItem[];
  functionName: string;
  args?: unknown[];
  value?: bigint;
}

export interface SendTransactionParams {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
  gas?: bigint;
  gasPrice?: bigint;
}

export interface CoreTransactionRequest {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  data?: `0x${string}`;
  gasPrice?: bigint;
  gas?: bigint;
  nonce?: number;
  epochHeight?: bigint;
}

// Block and transaction types
export interface Block {
  number: bigint;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
  timestamp: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  transactions: Transaction[];
}

export interface Transaction {
  hash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}` | null;
  value: bigint;
  gas: bigint;
  gasPrice: bigint;
  data: `0x${string}`;
  nonce: number;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  transactionIndex: number;
}

export interface TransactionReceipt {
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  transactionIndex: number;
  from: `0x${string}`;
  to: `0x${string}` | null;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: 'success' | 'reverted';
  contractAddress: `0x${string}` | null; // Added missing property
  logs: Log[];
}

export interface Log {
  address: `0x${string}`;
  topics: `0x${string}`[];
  data: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  transactionHash: `0x${string}`;
  transactionIndex: number;
  logIndex: number;
  removed: boolean;
}
