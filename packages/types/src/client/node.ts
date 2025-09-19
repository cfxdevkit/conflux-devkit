// Client-side node types - Browser-safe versions of base types

import type { BaseNodeStatus, BaseWalletInfo } from '@conflux-devkit/core';
import type { ClientWalletInfo } from './wallet';

// ============================================================================
// Client Node Status Interface
// ============================================================================

export interface ClientNodeStatus
  extends Omit<
    BaseNodeStatus,
    | 'corePort'
    | 'evmPort'
    | 'chainId'
    | 'evmChainId'
    | 'blockNumber'
    | 'peerCount'
    | 'wallets'
    | 'miningAddress'
    | 'lastHealthCheck'
  > {
  corePort: string; // Browser-safe port (string for JSON serialization)
  evmPort: string; // Browser-safe port
  chainId: string; // Browser-safe chain ID
  evmChainId: string; // Browser-safe EVM chain ID
  blockNumber: string; // Browser-safe block number
  peerCount: string; // Browser-safe peer count
  wallets: ClientWalletInfo[]; // Client wallet info array
  miningAddress: string | null; // Browser-safe mining address
  lastHealthCheck: string; // ISO string for JSON serialization
}

// ============================================================================
// Client Node Configuration
// ============================================================================

export interface ClientNodeConfig {
  corePort?: number;
  evmPort?: number;
  chainId?: number;
  evmChainId?: number;
  walletMode?: 'mnemonic' | 'privatekey';
  miningAddress?: string;
  networkId?: string;
  dataDir?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// Client Node Health Check
// ============================================================================

export interface ClientNodeHealthCheck {
  status: 'healthy' | 'unhealthy' | 'unknown' | 'starting' | 'stopping';
  timestamp: string;
  responseTime?: number;
  error?: string;
  details?: {
    blockNumber?: string;
    peerCount?: string;
    uptime?: string;
    memoryUsage?: string;
    cpuUsage?: string;
  };
}

// ============================================================================
// Client Node Metrics
// ============================================================================

export interface ClientNodeMetrics {
  uptime: string; // Human-readable uptime
  blockNumber: string;
  peerCount: string;
  memoryUsage: string;
  cpuUsage: string;
  diskUsage: string;
  networkLatency?: string;
  lastHealthCheck: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isClientNodeStatus(value: unknown): value is ClientNodeStatus {
  return (
    typeof value === 'object' &&
    value !== null &&
    'running' in value &&
    'corePort' in value &&
    'evmPort' in value &&
    'chainId' in value &&
    'evmChainId' in value &&
    'blockNumber' in value &&
    'peerCount' in value &&
    'walletMode' in value &&
    'wallets' in value &&
    'miningAddress' in value &&
    'health' in value &&
    'lastHealthCheck' in value &&
    typeof (value as any).running === 'boolean' &&
    typeof (value as any).corePort === 'string' &&
    typeof (value as any).evmPort === 'string' &&
    typeof (value as any).chainId === 'string' &&
    typeof (value as any).evmChainId === 'string' &&
    typeof (value as any).blockNumber === 'string' &&
    typeof (value as any).peerCount === 'string' &&
    ['mnemonic', 'privatekey'].includes((value as any).walletMode) &&
    Array.isArray((value as any).wallets) &&
    (typeof (value as any).miningAddress === 'string' ||
      (value as any).miningAddress === null) &&
    ['healthy', 'unhealthy', 'unknown', 'starting', 'stopping'].includes(
      (value as any).health
    ) &&
    typeof (value as any).lastHealthCheck === 'string'
  );
}

export function isClientNodeConfig(value: unknown): value is ClientNodeConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('corePort' in value ||
      'evmPort' in value ||
      'chainId' in value ||
      'evmChainId' in value ||
      'walletMode' in value ||
      'miningAddress' in value ||
      'networkId' in value ||
      'dataDir' in value ||
      'logLevel' in value)
  );
}

export function isClientNodeHealthCheck(
  value: unknown
): value is ClientNodeHealthCheck {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'timestamp' in value &&
    ['healthy', 'unhealthy', 'unknown', 'starting', 'stopping'].includes(
      (value as any).status
    ) &&
    typeof (value as any).timestamp === 'string'
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createClientNodeStatus(
  base: BaseNodeStatus,
  wallets: ClientWalletInfo[] = []
): ClientNodeStatus {
  return {
    ...base,
    corePort: base.corePort.toString(),
    evmPort: base.evmPort.toString(),
    chainId: base.chainId.toString(),
    evmChainId: base.evmChainId.toString(),
    blockNumber: base.blockNumber.toString(),
    peerCount: base.peerCount.toString(),
    wallets,
    miningAddress: base.miningAddress,
    lastHealthCheck: base.lastHealthCheck.toISOString(),
  };
}

export function createClientNodeHealthCheck(
  status: ClientNodeStatus,
  responseTime?: number,
  error?: string,
  details?: ClientNodeHealthCheck['details']
): ClientNodeHealthCheck {
  return {
    status: status.health,
    timestamp: new Date().toISOString(),
    responseTime,
    error,
    details,
  };
}

export function createClientNodeMetrics(
  status: ClientNodeStatus,
  uptime: string,
  memoryUsage: string,
  cpuUsage: string,
  diskUsage: string,
  networkLatency?: string
): ClientNodeMetrics {
  return {
    uptime,
    blockNumber: status.blockNumber,
    peerCount: status.peerCount,
    memoryUsage,
    cpuUsage,
    diskUsage,
    networkLatency,
    lastHealthCheck: status.lastHealthCheck,
  };
}

export function formatClientUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function parseClientPort(port: string): number {
  const parsed = parseInt(port, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port: ${port}`);
  }
  return parsed;
}

export function parseClientChainId(chainId: string): number {
  const parsed = parseInt(chainId, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }
  return parsed;
}
