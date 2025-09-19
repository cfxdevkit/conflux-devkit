// Browser-safe contract types for blockchain package

// Browser-safe contract method call parameters
export interface BrowserContractMethodCall {
  methodName: string;
  parameters: Record<string, unknown>;
  value?: string; // BigInt as string for browser compatibility
  gasLimit?: string;
  gasPrice?: string;
}

// Browser-safe contract method result
export interface BrowserContractMethodResult {
  methodName: string;
  result: unknown;
  gasUsed?: string;
  blockNumber?: string;
  transactionHash?: string;
  success: boolean;
  error?: string;
}

// Browser-safe contract event filter
export interface BrowserContractEventFilter {
  eventName: string;
  fromBlock?: string;
  toBlock?: string;
  topics?: Array<string | null>;
  address?: string;
}

// Browser-safe contract event log
export interface BrowserContractEventLog {
  eventName: string;
  address: string;
  blockNumber: string;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  topics: string[];
  data: string;
  args: Record<string, unknown>;
  removed: boolean;
}

// Import and re-export BrowserContractOrchestrator from core
import type { BrowserContractOrchestrator } from '@conflux-devkit/core';
export type { BrowserContractOrchestrator };

// Browser-safe contract method
export interface BrowserContractMethod {
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
  gasEstimate?: string;
  isPayable?: boolean;
  isView?: boolean;
  isPure?: boolean;
}

// Browser-safe contract event
export interface BrowserContractEvent {
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

// Contract interaction options
export interface ContractInteractionOptions {
  gasLimit?: string;
  gasPrice?: string;
  value?: string;
  from?: string;
  timeout?: number; // milliseconds
  retries?: number;
}

// Contract read options
export interface ContractReadOptions extends ContractInteractionOptions {
  blockTag?: 'latest' | 'earliest' | 'pending' | string;
}

// Contract write options
export interface ContractWriteOptions extends ContractInteractionOptions {
  confirmations?: number;
  waitForReceipt?: boolean;
}

// Contract event options
export interface ContractEventOptions {
  fromBlock?: string;
  toBlock?: string;
  topics?: Array<string | null>;
  address?: string;
  once?: boolean; // Only listen for one occurrence
}

// Contract deployment options
export interface ContractDeploymentOptions {
  constructorArgs?: unknown[];
  gasLimit?: string;
  gasPrice?: string;
  value?: string;
  confirmations?: number;
}

// Contract validation result
export interface ContractValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  checks: {
    abiValid: boolean;
    addressValid: boolean;
    bytecodeValid: boolean;
    networkCompatible: boolean;
    typesGenerated: boolean;
    methodsAccessible: boolean;
  };
}

// Contract interaction summary
export interface ContractInteractionSummary {
  contractId: string;
  contractName: string;
  totalCalls: number;
  readCalls: number;
  writeCalls: number;
  eventLogs: number;
  lastInteraction: string; // ISO string
  successRate: number;
  averageGasUsed: string;
  totalGasUsed: string;
  errors: Array<{
    methodName: string;
    error: string;
    count: number;
    lastOccurred: string; // ISO string
  }>;
}

// Contract registry entry
export interface BrowserContractRegistryEntry {
  id: string;
  contract: BrowserContractOrchestrator;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isActive: boolean;
  tags: string[];
  searchableText: string;
  categories: string[];
}

// Contract search result
export interface ContractSearchResult {
  contracts: BrowserContractOrchestrator[];
  total: number;
  query: string;
  filters?: {
    category?: string;
    chainType?: 'core' | 'evm';
    networkId?: string;
    tags?: string[];
  };
}

// Contract statistics
export interface ContractStatistics {
  totalContracts: number;
  activeContracts: number;
  contractsWithErrors: number;
  byChainType: { evm: number; core: number };
  byCategory: Record<string, number>;
  byNetwork: Record<string, number>;
  totalInteractions: number;
  averageSuccessRate: number;
}

// Contract deployment summary
export interface ContractDeploymentSummary {
  totalContracts: number;
  byChainType: { evm: number; core: number };
  byNetwork: Record<string, number>;
  byCategory: Record<string, number>;
  recentlyDeployed: BrowserContractOrchestrator[];
  mostUsed: BrowserContractOrchestrator[];
  withErrors: BrowserContractOrchestrator[];
}
