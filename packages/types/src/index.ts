// Conflux DevKit Types - Unified type definitions for client and server

// ============================================================================
// Client Types (Browser-safe)
// ============================================================================

export * from './client';

// ============================================================================
// Server Types (Re-export from core)
// ============================================================================

export type {
  // Base types
  BaseAddress,
  BaseWalletInfo,
  BaseNetworkConfig,
  BaseContractInfo,
  BaseTransactionRequest,
  BaseTransactionResponse,
  BaseBlock,
  BaseTransaction,
  BaseLog,
  BaseContractCallParams,
  BaseContractCallResult,
  BaseNodeStatus,

  // ABI types
  AbiItem,
  AbiInput,
  AbiOutput,

  // Utility types
  DeepPartial,
  RequiredFields,
  OptionalFields,
} from '@conflux-devkit/core';

// ============================================================================
// Type Conversion Utilities
// ============================================================================

export { TypeConverter } from './shared/conversion';

// ============================================================================
// Shared Utilities
// ============================================================================

export * from './shared/utils';
