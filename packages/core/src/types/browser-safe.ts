// Browser-safe types for frontend consumption

import type { BrowserAddress } from '../utils/type-normalization';

// Browser-safe wallet information
export interface BrowserWalletInfo {
  index: number;
  address: BrowserAddress;
  privateKey: string; // Never expose in production!
  mnemonic?: string;
  balance: string; // Formatted balance as string
  balanceFormatted: string; // Human-readable balance
  isMining: boolean;
  isDefault?: boolean; // Whether this is the default wallet
  name?: string; // Optional display name for the wallet
  network?: string; // Network this wallet is associated with
}

// Browser-safe transaction receipt
export interface BrowserTransactionReceipt {
  transactionHash: string;
  blockNumber: string;
  blockHash: string;
  from: BrowserAddress;
  to: BrowserAddress | null;
  gasUsed: string;
  status: 'success' | 'reverted';
  contractAddress?: BrowserAddress | null;
  transactionIndex: string;
  effectiveGasPrice: string;
  logs: BrowserLog[];
}

// Browser-safe log entry
export interface BrowserLog {
  address: BrowserAddress;
  topics: string[];
  data: string;
  blockNumber: string;
  blockHash: string;
  transactionHash: string;
  logIndex: string;
  transactionIndex: string;
  removed: boolean;
}

// Browser-safe block information
export interface BrowserBlock {
  number: string | null;
  hash: string;
  parentHash: string;
  timestamp: string;
  gasLimit: string;
  gasUsed: string;
  baseFeePerGas: string;
  transactions: string[]; // Transaction hashes only for simplicity
}

// Browser-safe transaction information
export interface BrowserTransaction {
  hash: string;
  from: BrowserAddress;
  to: BrowserAddress | null;
  value: string;
  gas: string;
  gasPrice: string;
  nonce: string;
  blockNumber: string | null;
  blockHash: string | null;
  transactionIndex: string | null;
}

// Browser-safe contract call result
export interface BrowserContractCallResult {
  result: string; // JSON stringified result
  gasUsed: string;
  blockNumber: string;
}

// Browser-safe deployment result
export interface BrowserDeploymentResult {
  contractName: string;
  address: BrowserAddress;
  txHash: string;
  gasUsed: string;
  timestamp: string; // ISO string
  abi: string; // JSON stringified ABI
  bytecode: string;
  deployedBytecode: string;
  network: string;
  chainId: string;
  evmChainId?: string;
  chainType: 'core' | 'evm';
}

// Browser-safe node status
export interface BrowserNodeStatus {
  running: boolean;
  corePort: string;
  evmPort: string;
  chainId: string;
  evmChainId: string;
  blockNumber: string;
  peerCount: string;
  walletMode: 'mnemonic' | 'privatekey';
  wallets: BrowserWalletInfo[];
  miningAddress: BrowserAddress | null;
  health: 'healthy' | 'unhealthy' | 'unknown' | 'starting' | 'stopping';
  lastHealthCheck: string;
}

// Browser-safe network configuration
export interface BrowserNetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: string;
  evmChainId?: string;
  currency: {
    name: string;
    symbol: string;
    decimals: string;
  };
  isTestnet: boolean;
  networkType: 'core' | 'evm';
  blockExplorer?: string;
}

// Browser-safe contract orchestrator - flexible interface that can handle both string and complex types
export interface BrowserContractOrchestrator {
  id?: string;
  name: string;
  address: BrowserAddress;
  abi: string | any[]; // JSON stringified ABI or ABI array
  bytecode: string;
  deployedBytecode: string;
  chainType: 'core' | 'evm';
  networkId: string;
  chainId: string | number; // Support both string and number
  evmChainId?: string | number; // Support both string and number
  network: BrowserNetworkConfig;
  methods: {
    read: string[] | any[]; // Method names or method objects
    write: string[] | any[]; // Method names or method objects
    events: string[] | any[]; // Event names or event objects
    constructor?: any; // Optional constructor method
  };
  capabilities: {
    read: boolean;
    write: boolean;
    events: boolean;
    canRead?: boolean; // Alias for backward compatibility
    canWrite?: boolean; // Alias for backward compatibility
    hasEvents?: boolean; // Alias for backward compatibility
    canReceive?: boolean;
    canFallback?: boolean;
    isUpgradeable?: boolean;
    isPausable?: boolean;
    isOwnable?: boolean;
  };
  // Optional metadata for extended functionality
  metadata?: {
    name?: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    source?: string;
    tags?: string[];
    category?: string;
    icon?: string;
    color?: string;
    website?: string;
    documentation?: string;
  };
  deployment?: {
    transactionHash?: string;
    blockNumber?: string;
    gasUsed?: string;
    deployedAt?: string;
    isVerified?: boolean;
    verificationStatus?: string;
  };
  types?: {
    generated?: boolean;
    generatedAt?: string;
    error?: string;
    generatedTypes?: Record<string, unknown>;
  };
  ui?: {
    displayName?: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    tags?: string[];
    isActive?: boolean;
    lastUsed?: string;
    usageCount?: number;
  };
}

// Utility type for converting any object to browser-safe format
export type BrowserSafe<T> = {
  [K in keyof T]: T[K] extends bigint
    ? string
    : T[K] extends `0x${string}`
      ? BrowserAddress
      : T[K] extends string
        ? string
        : T[K] extends number
          ? string
          : T[K] extends boolean
            ? boolean
            : T[K] extends Date
              ? string
              : T[K] extends object
                ? BrowserSafe<T[K]>
                : string;
};
