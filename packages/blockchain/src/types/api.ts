// Blockchain-specific API types with full normalization

import type { ApiError, ApiResponse, ResponseMeta } from '@conflux-devkit/core';

// Blockchain-aware response wrapper
export interface BlockchainApiResponse<T = unknown> extends ApiResponse<T> {
  // Blockchain-specific metadata
  network?: string;
  chainId?: number;
  blockNumber?: bigint;
  gasUsed?: bigint;
  // Browser-safe versions
  networkFormatted?: string;
  chainIdFormatted?: string;
  blockNumberFormatted?: string;
  gasUsedFormatted?: string;
}

// Contract API types
export interface ContractDeploymentApiResponse
  extends BlockchainApiResponse<{
    contractName: string;
    address: string; // Browser-safe
    txHash: string; // Browser-safe
    gasUsed: string; // Browser-safe
    network: string;
    chainType: 'core' | 'evm';
    deployedAt: string; // ISO string
    abi: string; // JSON stringified
    bytecode: string;
    deployedBytecode: string;
  }> {}

export interface ContractCallApiResponse
  extends BlockchainApiResponse<{
    result: string; // Browser-safe JSON string
    gasUsed: string; // Browser-safe
    blockNumber: string; // Browser-safe
    method: string;
    contractAddress: string; // Browser-safe
    success: boolean;
  }> {}

export interface ContractReadApiResponse
  extends BlockchainApiResponse<{
    result: string; // Browser-safe JSON string
    method: string;
    contractAddress: string; // Browser-safe
    blockNumber: string; // Browser-safe
  }> {}

export interface ContractWriteApiResponse
  extends BlockchainApiResponse<{
    hash: string; // Browser-safe
    gasUsed: string; // Browser-safe
    blockNumber: string; // Browser-safe
    method: string;
    contractAddress: string; // Browser-safe
    success: boolean;
  }> {}

// Transaction API types
export interface TransactionSendApiResponse
  extends BlockchainApiResponse<{
    hash: string; // Browser-safe
    gasPrice: string; // Browser-safe
    gasLimit: string; // Browser-safe
    nonce: string; // Browser-safe
    from: string; // Browser-safe
    to: string | null; // Browser-safe
    value: string; // Browser-safe
    data: string;
  }> {}

export interface TransactionReceiptApiResponse
  extends BlockchainApiResponse<{
    transactionHash: string; // Browser-safe
    blockNumber: string; // Browser-safe
    blockHash: string; // Browser-safe
    from: string; // Browser-safe
    to: string | null; // Browser-safe
    gasUsed: string; // Browser-safe
    status: 'success' | 'reverted';
    contractAddress?: string | null; // Browser-safe
    transactionIndex: string; // Browser-safe
    effectiveGasPrice: string; // Browser-safe
    logs: Array<{
      address: string; // Browser-safe
      topics: string[];
      data: string;
      blockNumber: string; // Browser-safe
      transactionHash: string; // Browser-safe
      logIndex: string; // Browser-safe
      transactionIndex: string; // Browser-safe
    }>;
  }> {}

export interface TransactionStatusApiResponse
  extends BlockchainApiResponse<{
    hash: string; // Browser-safe
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: string; // Browser-safe
    blockNumber: string | null; // Browser-safe
    gasUsed: string | null; // Browser-safe
    receipt: TransactionReceiptApiResponse['data'] | null | undefined;
  }> {}

// Wallet API types
export interface WalletCreateApiResponse
  extends BlockchainApiResponse<{
    address: string; // Browser-safe
    privateKey: string; // Browser-safe (never expose in production!)
    mnemonic?: string;
    index: number;
    isMining: boolean;
    createdAt: string; // ISO string
  }> {}

export interface WalletListApiResponse
  extends BlockchainApiResponse<
    Array<{
      index: number;
      address: string; // Browser-safe
      balance: string; // Browser-safe
      balanceFormatted: string; // Human-readable
      isMining: boolean;
      createdAt: string; // ISO string
    }>
  > {}

export interface WalletBalanceApiResponse
  extends BlockchainApiResponse<{
    address: string; // Browser-safe
    balance: string; // Browser-safe
    balanceFormatted: string; // Human-readable
    currency: string;
    lastUpdated: string; // ISO string
  }> {}

export interface WalletFundApiResponse
  extends BlockchainApiResponse<{
    from: string; // Browser-safe
    to: string; // Browser-safe
    amount: string; // Browser-safe
    txHash: string; // Browser-safe
    success: boolean;
  }> {}

// Node API types
export interface NodeStatusApiResponse
  extends BlockchainApiResponse<{
    running: boolean;
    corePort: string; // Browser-safe
    evmPort: string; // Browser-safe
    chainId: string; // Browser-safe
    evmChainId: string; // Browser-safe
    blockNumber: string; // Browser-safe
    peerCount: string; // Browser-safe
    walletMode: 'mnemonic' | 'privatekey';
    wallets: Array<{
      index: number;
      address: string; // Browser-safe
      balance: string; // Browser-safe
      balanceFormatted: string;
      isMining: boolean;
    }>;
    miningAddress: string | null; // Browser-safe
    uptime: string; // Browser-safe (seconds)
    version: string;
  }> {}

export interface NodeStartApiResponse
  extends BlockchainApiResponse<{
    success: boolean;
    corePort: string; // Browser-safe
    evmPort: string; // Browser-safe
    chainId: string; // Browser-safe
    evmChainId: string; // Browser-safe
    message: string;
    startedAt: string; // ISO string
  }> {}

export interface NodeStopApiResponse
  extends BlockchainApiResponse<{
    success: boolean;
    message: string;
    stoppedAt: string; // ISO string
  }> {}

// Network API types
export interface NetworkInfoApiResponse
  extends BlockchainApiResponse<{
    name: string;
    rpcUrl: string;
    chainId: string; // Browser-safe
    evmChainId: string; // Browser-safe
    currency: {
      name: string;
      symbol: string;
      decimals: string; // Browser-safe
    };
    isTestnet: boolean;
    networkType: 'core' | 'evm';
    blockNumber: string; // Browser-safe
    gasPrice: string; // Browser-safe
    connected: boolean;
    latency: string; // Browser-safe (ms)
  }> {}

export interface NetworkSwitchApiResponse
  extends BlockchainApiResponse<{
    from: string;
    to: string;
    success: boolean;
    message: string;
    switchedAt: string; // ISO string
  }> {}

// Block API types
export interface BlockInfoApiResponse
  extends BlockchainApiResponse<{
    number: string; // Browser-safe
    hash: string; // Browser-safe
    parentHash: string; // Browser-safe
    timestamp: string; // Browser-safe
    gasLimit: string; // Browser-safe
    gasUsed: string; // Browser-safe
    transactionCount: string; // Browser-safe
    size: string; // Browser-safe
  }> {}

export interface BlockListApiResponse
  extends BlockchainApiResponse<
    Array<{
      number: string; // Browser-safe
      hash: string; // Browser-safe
      timestamp: string; // Browser-safe
      transactionCount: string; // Browser-safe
      gasUsed: string; // Browser-safe
    }>
  > {}

// Event API types
export interface EventLogApiResponse
  extends BlockchainApiResponse<{
    address: string; // Browser-safe
    topics: string[];
    data: string;
    blockNumber: string; // Browser-safe
    transactionHash: string; // Browser-safe
    logIndex: string; // Browser-safe
    transactionIndex: string; // Browser-safe
    removed: boolean;
  }> {}

export interface EventFilterApiResponse
  extends BlockchainApiResponse<
    Array<{
      address: string; // Browser-safe
      topics: string[];
      data: string;
      blockNumber: string; // Browser-safe
      transactionHash: string; // Browser-safe
      logIndex: string; // Browser-safe
      transactionIndex: string; // Browser-safe
      removed: boolean;
    }>
  > {}

// Error API types
export interface BlockchainApiError extends ApiError {
  code:
    | 'NETWORK_ERROR'
    | 'CONTRACT_ERROR'
    | 'TRANSACTION_ERROR'
    | 'WALLET_ERROR'
    | 'NODE_ERROR';
  network?: string;
  chainId?: number;
  blockNumber?: bigint;
  // Browser-safe versions
  networkFormatted?: string;
  chainIdFormatted?: string;
  blockNumberFormatted?: string;
}

// Utility types for API responses
export type ApiResponseData<T> = T extends BlockchainApiResponse<infer U>
  ? U
  : never;

export type ApiResponseSuccess<T> = T extends BlockchainApiResponse<infer U>
  ? U & { success: true }
  : never;

export type ApiResponseError<T> = T extends BlockchainApiResponse<infer _U>
  ? BlockchainApiError
  : never;

// Type guards
export function isBlockchainApiResponse<T>(
  response: unknown
): response is BlockchainApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'network' in response
  );
}

export function isBlockchainApiError(
  error: unknown
): error is BlockchainApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'network' in error
  );
}

// Response builders
export function createBlockchainApiResponse<T>(
  data: T,
  network?: string,
  chainId?: number,
  blockNumber?: bigint,
  gasUsed?: bigint,
  meta?: ResponseMeta
): BlockchainApiResponse<T> {
  return {
    success: true,
    data,
    network,
    chainId,
    blockNumber,
    gasUsed,
    networkFormatted: network,
    chainIdFormatted: chainId?.toString(),
    blockNumberFormatted: blockNumber?.toString(),
    gasUsedFormatted: gasUsed?.toString(),
    meta,
  };
}

export function createBlockchainApiError(
  code: BlockchainApiError['code'],
  message: string,
  network?: string,
  chainId?: number,
  blockNumber?: bigint,
  details?: Record<string, unknown>
): BlockchainApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date(),
    },
    network,
    chainId,
    blockNumber,
    networkFormatted: network,
    chainIdFormatted: chainId?.toString(),
    blockNumberFormatted: blockNumber?.toString(),
  };
}
