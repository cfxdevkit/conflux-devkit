// Re-export core types from core package
export type {
  AbiItem,
  DeploymentResult,
  NodeConfig,
  NodeStatus,
  TestOptions,
  TestResult,
  TransactionRequest,
  TransactionResponse,
  WalletInfo,
} from '@conflux-devkit/core';

// Node-specific types that extend core types
export interface ExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
}

export interface DeployOptions {
  network?: string;
  port?: string;
  ethPort?: string;
}
