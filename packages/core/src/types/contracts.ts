// Contract artifact and deployment types

import type { AbiItem, NetworkConfig } from './blockchain';

// Re-export types that might be needed by other packages
export type { ContractOrchestrator } from './contract-orchestration';

// Contract artifact structure
export interface ContractArtifact {
  contractName: string;
  sourceName: string;
  abi: AbiItem[];
  bytecode: `0x${string}`;
  deployedBytecode: `0x${string}`;
  linkReferences: Record<
    string,
    Record<string, Array<{ length: number; start: number }>>
  >;
  deployedLinkReferences: Record<
    string,
    Record<string, Array<{ length: number; start: number }>>
  >;
  solcVersion: string;
  compiler: {
    name: string;
    version: string;
  };
  networks: Record<string, ContractNetworkInfo>;
  schemaVersion: string;
  updatedAt: string;
}

// Network-specific contract information
export interface ContractNetworkInfo {
  address: `0x${string}`;
  transactionHash: `0x${string}`;
  blockNumber: number;
  blockHash: `0x${string}`;
  gasUsed: string;
  gasPrice: string;
  deployedAt: string;
  chainType: 'core' | 'evm';
  chainId: number;
  evmChainId?: number;
}

// Contract deployment configuration
export interface ContractDeploymentConfig {
  contractName: string;
  artifactPath: string;
  bytecode?: `0x${string}`;
  constructorArgs?: unknown[];
  gasLimit?: bigint;
  gasPrice?: bigint;
  value?: bigint;
  chainType: 'core' | 'evm';
  networkId: string;
  chainId: number;
}

// Generated contract types (from wagmi codegen)
export interface GeneratedContract {
  address: `0x${string}`;
  abi: AbiItem[];
  name: string;
  chainType: 'core' | 'evm';
  networkId: string;
  // Generated types will be added here by wagmi codegen
  [key: string]: unknown;
}

// Re-export TypedDeploymentResult from contract-orchestration
export type { TypedDeploymentResult } from './contract-orchestration';

// Wagmi codegen configuration
export interface WagmiCodegenConfig {
  contracts: ContractCodegenConfig[];
  out: string;
  watch: boolean;
  target: 'react' | 'vue' | 'vanilla';
  plugins: string[];
}

export interface ContractCodegenConfig {
  name: string;
  address: `0x${string}`;
  abi: AbiItem[];
  chainId: number;
  chainType: 'core' | 'evm';
  evmChainId?: number;
}

// Re-export NetworkConfig from blockchain types to avoid duplication
export type { NetworkConfig } from './blockchain';

// Contract factory for creating typed contract instances
export interface ContractFactory<T = unknown> {
  create(contractAddress: `0x${string}`, networkConfig: NetworkConfig): T;
  getABI(): AbiItem[];
  getBytecode(): `0x${string}`;
  getDeployedBytecode(): `0x${string}`;
  getContractName(): string;
  getChainType(): 'core' | 'evm';
}

// Contract deployment status
export type ContractDeploymentStatus =
  | 'pending'
  | 'deploying'
  | 'deployed'
  | 'failed'
  | 'type-generating'
  | 'type-generated'
  | 'type-generation-failed';

// Contract deployment progress
export interface ContractDeploymentProgress {
  contractName: string;
  status: ContractDeploymentStatus;
  progress: number; // 0-100
  currentStep: string;
  error?: string;
  result?: import('./contract-orchestration').TypedDeploymentResult;
}
