// Main exports - Core functionality
export { ConfluxNode } from './ConfluxNode';
// Main exports - Operations
export {
  callContractMethod,
  deployContract,
  getBlockInfo,
  runCompleteDeploymentFlow,
  sendTransaction,
} from './ConfluxOperations';
export { ContractDeployer } from './ContractDeployer';
// Main exports - CLI
export { UnifiedCLI } from './cli/unified';
export { NodeManager } from './NodeManager';
// Main exports - Services
export { NodeService } from './services/NodeService';
export { TestRunner } from './TestRunner';
// Legacy type exports for backward compatibility
export type { DeploymentResult } from './types';

// Type exports - Unified types
export type {
  ContractOrchestrator,
  DeployOptions,
  ExecutionResult,
  IContractService,
  // Service interfaces
  INodeService,
  IWalletService,
  IWorkflowService,
  NetworkConfig,
  NodeCommandOptions,
  // Core types
  NodeConfig,
  // Error types
  NodeError,
  // Utility types
  NodeEventCallback,
  // Configuration types
  NodeServiceConfig,
  // Node types
  NodeStatus,
  ServiceFactory,
  TestOptions,
  TestResult,
  TypedDeploymentResult,
  ValidationError,
  ValidationResult,
  WalletInfo,
  // Command types
  WorkflowCommandOptions,
  WorkflowError,
  WorkflowResult,
  WorkflowServiceConfig,
} from './types/unified';
export { WalletManager } from './WalletManager';
