// Type guards and validators for runtime type checking

import type { ApiError, ApiResponse } from '../types/api';
import type {
  AbiItem,
  ContractCallResult,
  DeploymentResult,
  NetworkConfig,
  WalletInfo,
} from '../types/blockchain';
import type {
  BrowserContractOrchestrator,
  BrowserNetworkConfig,
  BrowserNodeStatus,
  BrowserWalletInfo,
} from '../types/browser-safe';
import type { NodeConfig, NodeStatus } from '../types/node';

/**
 * Type guard for WalletInfo
 */
export function isWalletInfo(obj: unknown): obj is WalletInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).index === 'number' &&
    typeof (obj as any).address === 'string' &&
    typeof (obj as any).privateKey === 'string' &&
    (obj as any).address.startsWith('0x')
  );
}

/**
 * Type guard for BrowserWalletInfo
 */
export function isBrowserWalletInfo(obj: unknown): obj is BrowserWalletInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).index === 'number' &&
    typeof (obj as any).address === 'string' &&
    typeof (obj as any).privateKey === 'string' &&
    typeof (obj as any).balance === 'string' &&
    typeof (obj as any).balanceFormatted === 'string' &&
    typeof (obj as any).isMining === 'boolean'
  );
}

/**
 * Type guard for NetworkConfig
 */
export function isNetworkConfig(obj: unknown): obj is NetworkConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).rpcUrl === 'string' &&
    typeof (obj as any).chainId === 'number' &&
    typeof (obj as any).currency === 'object' &&
    typeof (obj as any).currency.name === 'string' &&
    typeof (obj as any).currency.symbol === 'string' &&
    typeof (obj as any).currency.decimals === 'number' &&
    typeof (obj as any).isTestnet === 'boolean'
  );
}

/**
 * Type guard for BrowserNetworkConfig
 */
export function isBrowserNetworkConfig(
  obj: unknown
): obj is BrowserNetworkConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).rpcUrl === 'string' &&
    typeof (obj as any).chainId === 'string' &&
    typeof (obj as any).currency === 'object' &&
    typeof (obj as any).currency.name === 'string' &&
    typeof (obj as any).currency.symbol === 'string' &&
    typeof (obj as any).currency.decimals === 'string' &&
    typeof (obj as any).isTestnet === 'boolean'
  );
}

/**
 * Type guard for AbiItem
 */
export function isAbiItem(obj: unknown): obj is AbiItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).type === 'string' &&
    ['function', 'constructor', 'event', 'fallback', 'receive'].includes(
      (obj as any).type
    )
  );
}

/**
 * Type guard for ABI array
 */
export function isAbiArray(obj: unknown): obj is AbiItem[] {
  return Array.isArray(obj) && obj.every(isAbiItem);
}

/**
 * Type guard for ContractCallResult
 */
export function isContractCallResult(obj: unknown): obj is ContractCallResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).success === 'boolean'
  );
}

/**
 * Type guard for DeploymentResult
 */
export function isDeploymentResult(obj: unknown): obj is DeploymentResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).network === 'string' &&
    typeof (obj as any).contract === 'string' &&
    typeof (obj as any).address === 'string' &&
    typeof (obj as any).txHash === 'string' &&
    (obj as any).address.startsWith('0x') &&
    (obj as any).txHash.startsWith('0x')
  );
}

/**
 * Type guard for NodeConfig
 */
export function isNodeConfig(obj: unknown): obj is NodeConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).port === 'number' &&
    typeof (obj as any).ethPort === 'number'
  );
}

/**
 * Type guard for NodeStatus
 */
export function isNodeStatus(obj: unknown): obj is NodeStatus {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).running === 'boolean' &&
    typeof (obj as any).port === 'number' &&
    typeof (obj as any).ethPort === 'number'
  );
}

/**
 * Type guard for BrowserNodeStatus
 */
export function isBrowserNodeStatus(obj: unknown): obj is BrowserNodeStatus {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).running === 'boolean' &&
    typeof (obj as any).corePort === 'string' &&
    typeof (obj as any).evmPort === 'string' &&
    typeof (obj as any).chainId === 'string' &&
    typeof (obj as any).evmChainId === 'string' &&
    typeof (obj as any).blockNumber === 'string' &&
    typeof (obj as any).peerCount === 'string' &&
    Array.isArray((obj as any).wallets)
  );
}

/**
 * Type guard for BrowserContractOrchestrator
 */
export function isBrowserContractOrchestrator(
  obj: unknown
): obj is BrowserContractOrchestrator {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).address === 'string' &&
    (obj as any).address.startsWith('0x') &&
    typeof (obj as any).bytecode === 'string' &&
    typeof (obj as any).deployedBytecode === 'string' &&
    ['core', 'evm'].includes((obj as any).chainType) &&
    typeof (obj as any).networkId === 'string' &&
    typeof (obj as any).methods === 'object' &&
    typeof (obj as any).capabilities === 'object'
  );
}

/**
 * Type guard for ApiResponse
 */
export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).success === 'boolean'
  );
}

/**
 * Type guard for ApiError
 */
export function isApiError(obj: unknown): obj is ApiError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).code === 'string' &&
    typeof (obj as any).message === 'string' &&
    (obj as any).timestamp instanceof Date
  );
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate transaction hash format
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !Number.isNaN(value);
}

/**
 * Validate non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && !Number.isNaN(value);
}

/**
 * Validate string is not empty
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Runtime validation with type guards
 */
export class TypeValidator {
  /**
   * Assert that value matches type guard
   */
  static assert<T>(
    value: unknown,
    guard: (value: unknown) => value is T,
    message?: string
  ): asserts value is T {
    if (!guard(value)) {
      throw new Error(message || 'Type assertion failed');
    }
  }

  /**
   * Safely convert unknown value using type guard
   */
  static safeCast<T>(
    value: unknown,
    guard: (value: unknown) => value is T
  ): T | null {
    return guard(value) ? value : null;
  }

  /**
   * Validate array of items using type guard
   */
  static validateArray<T>(
    values: unknown[],
    guard: (value: unknown) => value is T
  ): T[] {
    const validated: T[] = [];
    for (const value of values) {
      if (guard(value)) {
        validated.push(value);
      }
    }
    return validated;
  }
}

/**
 * Production-ready configuration validator
 */
export function validateProductionConfig(config: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object');
    return { isValid: false, errors };
  }

  const cfg = config as any;

  // Validate required fields exist
  if (!cfg.networks || !Array.isArray(cfg.networks)) {
    errors.push('Networks configuration is required and must be an array');
  }

  if (!cfg.rpcUrls || typeof cfg.rpcUrls !== 'object') {
    errors.push('RPC URLs configuration is required');
  }

  // Validate network configurations
  if (cfg.networks) {
    cfg.networks.forEach((network: unknown, index: number) => {
      if (!isNetworkConfig(network)) {
        errors.push(`Network at index ${index} is not valid`);
      }
    });
  }

  // Validate RPC URLs
  if (cfg.rpcUrls) {
    Object.entries(cfg.rpcUrls).forEach(([name, url]) => {
      if (!isValidUrl(url as string)) {
        errors.push(`RPC URL for ${name} is not valid`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}
