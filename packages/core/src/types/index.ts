// Re-export all types from organized modules
export * from './blockchain';
// Re-export specific error types to avoid conflicts
export {
  AuthenticationError,
  AuthorizationError,
  BaseError,
  ConfigurationError,
  ConflictError,
  ContractError,
  createConfigurationError,
  createContractError,
  createDeploymentError,
  createInternalError,
  createNetworkError,
  createNodeError,
  createNotFoundError,
  createValidationError,
  createWalletError,
  DeploymentError,
  type DevKitError,
  InternalError,
  NetworkError,
  NodeError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  WalletError,
} from './errors';
export * from './node';
export * from './validation';

// Legacy types for backward compatibility (deprecated - use core types instead)
/** @deprecated Use BrowserWalletInfo from browser-safe types instead */
export type WalletType = 'mnemonic' | 'privateKey';

/** @deprecated Use BrowserWalletInfo from browser-safe types instead */
export interface WalletConfig {
  type: WalletType;
  value: string;
  index?: number;
}

// Import types for legacy compatibility
import type { ContractInfo, NetworkConfig } from './blockchain';

/** @deprecated Use ContractDeploymentConfig from contracts types instead */
export interface DeploymentConfig {
  contracts: ContractInfo[];
  networks: NetworkConfig[];
}
