// Contract orchestration types for simplified contract management

import type { AbiItem } from './blockchain';

// Typed deployment result
export interface TypedDeploymentResult {
  contractName: string;
  address: `0x${string}`;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  gasUsed: bigint;
  gasPrice: bigint;
  abi: AbiItem[];
  bytecode: `0x${string}`;
  deployedBytecode: `0x${string}`;
  deployedAt: Date;
  network: string;
  networkId: string;
  chainId: number;
  evmChainId?: number;
  chainType: 'core' | 'evm';
  typesGenerated: boolean;
  typeGenerationError?: string;
  generatedContract?: Record<string, unknown>;
}

// Contract method information
export interface ContractMethod {
  name: string;
  type: 'function' | 'constructor' | 'fallback' | 'receive' | 'event';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  inputs: Array<{
    name: string;
    type: string;
    internalType?: string;
    indexed?: boolean;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  // UI-friendly information
  description?: string;
  category?: 'read' | 'write' | 'event' | 'constructor';
  gasEstimate?: bigint;
  isPayable?: boolean;
  isView?: boolean;
  isPure?: boolean;
}

// Contract event information
export interface ContractEvent {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed: boolean;
    internalType?: string;
  }>;
  anonymous: boolean;
  // UI-friendly information
  description?: string;
  category?: 'transfer' | 'mint' | 'burn' | 'approval' | 'custom';
}

// Contract metadata for UI and orchestration
export interface ContractMetadata {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  source?: string;
  tags?: string[];
  category?: 'token' | 'nft' | 'defi' | 'governance' | 'utility' | 'custom';
  // UI information
  icon?: string;
  color?: string;
  website?: string;
  documentation?: string;
}

// Simplified contract orchestration object
export interface ContractOrchestrator {
  // Basic contract information
  id: string;
  name: string;
  address: `0x${string}`;
  chainType: 'core' | 'evm';
  networkId: string;
  chainId: number;
  evmChainId?: number;

  // Contract metadata
  metadata: ContractMetadata;

  // Contract interface
  abi: AbiItem[];
  bytecode: `0x${string}`;
  deployedBytecode: `0x${string}`;

  // Organized methods and events
  methods: {
    read: ContractMethod[];
    write: ContractMethod[];
    events: ContractEvent[];
    constructor: ContractMethod | null;
  };

  // Contract status and deployment info
  deployment: {
    transactionHash: `0x${string}`;
    blockNumber: bigint;
    gasUsed: bigint;
    deployedAt: Date;
    isVerified: boolean;
    verificationStatus?: 'pending' | 'verified' | 'failed';
  };

  // Type generation status
  types: {
    generated: boolean;
    generatedAt?: Date;
    error?: string;
    generatedTypes?: Record<string, unknown>;
  };

  // UI-friendly information
  ui: {
    displayName: string;
    description: string;
    category: string;
    icon?: string;
    color?: string;
    tags: string[];
    isActive: boolean;
    lastUsed?: Date;
    usageCount: number;
  };

  // Contract capabilities
  capabilities: {
    canRead: boolean;
    canWrite: boolean;
    canReceive: boolean;
    canFallback: boolean;
    hasEvents: boolean;
    isUpgradeable: boolean;
    isPausable: boolean;
    isOwnable: boolean;
  };

  // Network information
  network: {
    name: string;
    rpcUrl: string;
    isTestnet: boolean;
    blockExplorer?: string;
    currency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  };
}

// Contract registry entry
export interface ContractRegistryEntry {
  id: string;
  contract: ContractOrchestrator;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  tags: string[];
  // Search and filtering
  searchableText: string;
  categories: string[];
}

// Contract method call parameters
export interface ContractMethodCall {
  methodName: string;
  parameters: Record<string, unknown>;
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
}

// Contract method call result
export interface ContractMethodResult {
  methodName: string;
  result: unknown;
  gasUsed?: bigint;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
  success: boolean;
  error?: string;
}

// Contract event filter
export interface ContractEventFilter {
  eventName: string;
  fromBlock?: bigint;
  toBlock?: bigint;
  topics?: Array<`0x${string}` | null>;
  address?: `0x${string}`;
}

// Contract event log
export interface ContractEventLog {
  eventName: string;
  address: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  transactionHash: `0x${string}`;
  transactionIndex: number;
  logIndex: number;
  topics: `0x${string}`[];
  data: `0x${string}`;
  args: Record<string, unknown>;
  removed: boolean;
}

// Contract interaction summary
export interface ContractInteractionSummary {
  contractId: string;
  contractName: string;
  totalCalls: number;
  readCalls: number;
  writeCalls: number;
  eventLogs: number;
  lastInteraction: Date;
  successRate: number;
  averageGasUsed: bigint;
  totalGasUsed: bigint;
  errors: Array<{
    methodName: string;
    error: string;
    count: number;
    lastOccurred: Date;
  }>;
}

// Contract deployment summary
export interface ContractDeploymentSummary {
  totalContracts: number;
  byChainType: {
    evm: number;
    core: number;
  };
  byNetwork: Record<string, number>;
  byCategory: Record<string, number>;
  recentlyDeployed: ContractOrchestrator[];
  mostUsed: ContractOrchestrator[];
  withErrors: ContractOrchestrator[];
}

// Contract validation result
export interface ContractValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  // Specific validation checks
  checks: {
    abiValid: boolean;
    addressValid: boolean;
    bytecodeValid: boolean;
    networkCompatible: boolean;
    typesGenerated: boolean;
    methodsAccessible: boolean;
  };
}
