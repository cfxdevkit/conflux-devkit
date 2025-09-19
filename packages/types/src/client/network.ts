// Client-side network types - Browser-safe versions of base types

import type { BaseNetworkConfig } from '@conflux-devkit/core';

// ============================================================================
// Client Network Interface
// ============================================================================

export interface ClientNetworkConfig
  extends Omit<BaseNetworkConfig, 'chainId' | 'evmChainId' | 'currency'> {
  chainId: string; // Browser-safe chain ID (string for JSON serialization)
  evmChainId?: string; // Browser-safe EVM chain ID
  currency: {
    name: string;
    symbol: string;
    decimals: string; // Browser-safe decimals (string for JSON serialization)
  };
}

// ============================================================================
// Client Network Creation Options
// ============================================================================

export interface ClientNetworkCreateOptions {
  name: string;
  rpcUrl: string;
  chainId: number;
  evmChainId?: number;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  networkType?: 'core' | 'evm';
  blockExplorer?: string;
}

// ============================================================================
// Client Network Update Options
// ============================================================================

export interface ClientNetworkUpdateOptions {
  name?: string;
  rpcUrl?: string;
  blockExplorer?: string;
}

// ============================================================================
// Client Network Display Info
// ============================================================================

export interface ClientNetworkDisplayInfo {
  id: string;
  name: string;
  chainId: string;
  evmChainId?: string;
  symbol: string;
  isTestnet: boolean;
  networkType: 'core' | 'evm';
  blockExplorer?: string;
  color?: string;
  icon?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isClientNetworkConfig(
  value: unknown
): value is ClientNetworkConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'rpcUrl' in value &&
    'chainId' in value &&
    'currency' in value &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).rpcUrl === 'string' &&
    typeof (value as any).chainId === 'string' &&
    typeof (value as any).currency === 'object' &&
    (value as any).currency !== null &&
    'name' in (value as any).currency &&
    'symbol' in (value as any).currency &&
    'decimals' in (value as any).currency &&
    typeof (value as any).currency.name === 'string' &&
    typeof (value as any).currency.symbol === 'string' &&
    typeof (value as any).currency.decimals === 'string'
  );
}

export function isClientNetworkDisplayInfo(
  value: unknown
): value is ClientNetworkDisplayInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'chainId' in value &&
    'symbol' in value &&
    'isTestnet' in value &&
    'networkType' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).chainId === 'string' &&
    typeof (value as any).symbol === 'string' &&
    typeof (value as any).isTestnet === 'boolean' &&
    ['core', 'evm'].includes((value as any).networkType)
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createClientNetworkConfig(
  base: BaseNetworkConfig
): ClientNetworkConfig {
  return {
    ...base,
    chainId: base.chainId.toString(),
    evmChainId: base.evmChainId?.toString(),
    currency: {
      ...base.currency,
      decimals: base.currency.decimals.toString(),
    },
  };
}

export function createClientNetworkDisplayInfo(
  config: ClientNetworkConfig,
  id?: string,
  color?: string,
  icon?: string
): ClientNetworkDisplayInfo {
  return {
    id: id ?? config.chainId,
    name: config.name,
    chainId: config.chainId,
    evmChainId: config.evmChainId,
    symbol: config.currency.symbol,
    isTestnet: config.isTestnet,
    networkType: config.networkType ?? 'evm',
    blockExplorer: config.blockExplorer,
    color,
    icon,
  };
}

export function normalizeClientChainId(chainId: string | number): string {
  return chainId.toString();
}

export function parseClientChainId(chainId: string): number {
  const parsed = parseInt(chainId, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }
  return parsed;
}
