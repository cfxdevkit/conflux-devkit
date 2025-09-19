// Unified type interfaces for the merged node package

import type {
  NodeStatus as CoreNodeStatus,
  NodeConfig,
  WalletInfo,
} from '@conflux-devkit/core';
import type {
  ContractOrchestrator,
  TypedDeploymentResult,
} from '@conflux-devkit/core/src/types/contract-orchestration';

// Enhanced NodeStatus that combines both packages
export interface NodeStatus extends CoreNodeStatus {
  // Core node status
  running: boolean;
  corePort: number;
  evmPort: number;
  chainId: number;
  evmChainId: number;
  blockNumber: bigint;
  peerCount: number; // Changed from bigint to number to match core
  walletMode: 'mnemonic' | 'privatekey';
  wallets: WalletInfo[];
  miningAddress?: `0x${string}`;

  // Lifecycle management status
  isRunning: boolean;
  pid?: number;
  startTime?: Date;
  uptime?: number;
  health: 'healthy' | 'unhealthy' | 'unknown' | 'starting' | 'stopping';
  lastHealthCheck?: Date;
  error?: string;
}

// Workflow result types
export interface WorkflowResult {
  success: boolean;
  nodeStatus: NodeStatus;
  wallets: WalletInfo[];
  contracts: ContractOrchestrator[];
  deploymentResults: TypedDeploymentResult[];
  validationResults: ValidationResult[];
  errors: string[];
  duration: number;
}

export interface ValidationResult {
  contractId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Re-export ExecutionResult from main types to avoid duplication
export type { ExecutionResult } from '../types';

// Deployment options
export interface DeployOptions {
  network?: string;
  port?: string;
  ethPort?: string;
  silent?: boolean;
  fundWallets?: boolean;
  walletCount?: number;
}

// Test options
export interface TestOptions {
  timeout?: number;
  retries?: number;
  silent?: boolean;
  verbose?: boolean;
}

export interface TestResult {
  success: boolean;
  tests: Array<{
    name: string;
    success: boolean;
    duration: number;
    error?: string;
  }>;
  totalDuration: number;
  passed: number;
  failed: number;
}

// CLI command types
export interface WorkflowCommandOptions {
  network?: 'mainnet' | 'testnet' | 'local';
  persistent?: boolean;
  dev?: boolean;
  config?: string;
  silent?: boolean;
  verbose?: boolean;
  contracts?: string[]; // Add contracts property
}

export interface NodeCommandOptions {
  start?: boolean;
  stop?: boolean;
  status?: boolean;
  restart?: boolean;
  config?: string;
  port?: number;
  ethPort?: number;
  silent?: boolean;
}

// Event types for workflow management
export interface WorkflowEvents {
  'workflow:start': [];
  'workflow:step': [string];
  'workflow:complete': [WorkflowResult];
  'workflow:error': [Error];
  'node:start': [];
  'node:stop': [];
  'node:ready': [];
  'node:error': [Error];
  'wallet:create': [WalletInfo];
  'contract:deploy': [TypedDeploymentResult];
  'validation:complete': [ValidationResult[]];
}

// Service interfaces
export interface INodeService {
  start(config?: Partial<NodeConfig>): Promise<void>;
  stop(): Promise<void>;
  restart(config?: Partial<NodeConfig>): Promise<void>;
  getStatus(): Promise<NodeStatus>;
  isHealthy(): Promise<boolean>;
}

export interface IWorkflowService {
  runCompleteWorkflow(
    options?: WorkflowCommandOptions
  ): Promise<WorkflowResult>;
  runDeploymentWorkflow(contracts: string[]): Promise<WorkflowResult>;
  runValidationWorkflow(): Promise<WorkflowResult>;
}

export interface IWalletService {
  createWallet(
    mode: 'mnemonic' | 'privatekey',
    count?: number
  ): Promise<WalletInfo[]>;
  loadWallet(address: string): Promise<WalletInfo | null>;
  fundWallet(address: string, amount: bigint): Promise<string>;
  getBalance(address: string): Promise<bigint>;
}

export interface IContractService {
  deployContract(
    contractName: string,
    constructorArgs?: unknown[],
    options?: DeployOptions
  ): Promise<TypedDeploymentResult>;
  callContract(
    contractAddress: string,
    method: string,
    args?: unknown[]
  ): Promise<string | number | bigint | boolean | `0x${string}` | unknown[]>;
  validateContract(contractAddress: string): Promise<ValidationResult>;
}

// Configuration types
export interface NodeServiceConfig {
  autoStart: boolean;
  healthCheckInterval: number;
  maxRetries: number;
  timeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface WorkflowServiceConfig {
  defaultNetwork: 'mainnet' | 'testnet' | 'local';
  autoValidate: boolean;
  parallelDeployments: boolean;
  maxConcurrentDeployments: number;
}

// Error types
export class NodeError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NodeError';
  }
}

export class WorkflowError extends Error {
  constructor(
    message: string,
    public step: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public contractId: string,
    public errors: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Utility types
export type NodeEventCallback<T extends keyof WorkflowEvents> = (
  ...args: WorkflowEvents[T]
) => void;

export type ServiceFactory<T> = (config?: Partial<NodeConfig>) => T;

// Re-export core types for convenience
export type {
  ContractOrchestrator,
  NetworkConfig,
  NodeConfig,
  TypedDeploymentResult,
  WalletInfo,
} from '@conflux-devkit/core';
