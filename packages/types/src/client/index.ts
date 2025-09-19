// Client-side types - Browser-safe versions of all base types

// ============================================================================
// Wallet Types
// ============================================================================

export type {
  ClientAddress,
  ClientWalletInfo,
  ClientWalletCreateOptions,
  ClientWalletImportOptions,
  ClientWalletUpdateOptions,
} from './wallet';

export {
  isClientAddress,
  isClientWalletInfo,
  createClientWalletInfo,
  normalizeClientAddress,
  formatClientBalance,
} from './wallet';

// ============================================================================
// Network Types
// ============================================================================

export type {
  ClientNetworkConfig,
  ClientNetworkCreateOptions,
  ClientNetworkUpdateOptions,
  ClientNetworkDisplayInfo,
} from './network';

export {
  isClientNetworkConfig,
  isClientNetworkDisplayInfo,
  createClientNetworkConfig,
  createClientNetworkDisplayInfo,
  normalizeClientChainId,
  parseClientChainId,
} from './network';

// ============================================================================
// Contract Types
// ============================================================================

export type {
  ClientContractInfo,
  ClientContractOrchestrator,
  ClientContractCreateOptions,
  ClientContractCallParams,
  ClientContractCallResult,
  ClientContractCallState,
  ClientContractEventState,
} from './contract';

export {
  isClientContractInfo,
  isClientContractOrchestrator,
  isClientContractCallParams,
  createClientContractInfo,
  createClientContractOrchestrator,
  normalizeClientABI,
  stringifyClientABI,
} from './contract';

// ============================================================================
// Node Types
// ============================================================================

export type {
  ClientNodeStatus,
  ClientNodeConfig,
  ClientNodeHealthCheck,
  ClientNodeMetrics,
} from './node';

export {
  isClientNodeStatus,
  isClientNodeConfig,
  isClientNodeHealthCheck,
  createClientNodeStatus,
  createClientNodeHealthCheck,
  createClientNodeMetrics,
  formatClientUptime,
  parseClientPort,
} from './node';

// ============================================================================
// Re-exports from Core
// ============================================================================

export type { AbiItem, AbiInput, AbiOutput } from '@conflux-devkit/core';
