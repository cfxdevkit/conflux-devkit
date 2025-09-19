// Client-side contract types - Browser-safe versions of base types

import type { BaseContractInfo, AbiItem } from '@conflux-devkit/core';
import type { ClientAddress } from './wallet';
import type { ClientNetworkConfig } from './network';

// ============================================================================
// Client Contract Interface
// ============================================================================

export interface ClientContractInfo extends Omit<BaseContractInfo, 'address'> {
  address: ClientAddress; // Browser-safe address
}

// ============================================================================
// Client Contract Orchestrator
// ============================================================================

export interface ClientContractOrchestrator
  extends Omit<BaseContractInfo, 'address' | 'network' | 'abi'> {
  id?: string;
  address: ClientAddress; // Browser-safe address
  abi: string | AbiItem[]; // JSON stringified ABI or ABI array
  bytecode: string;
  deployedBytecode: string;
  chainType: 'core' | 'evm';
  networkId: string;
  chainId: string | number; // Support both string and number
  evmChainId?: string | number; // Support both string and number
  network: ClientNetworkConfig;
  methods: {
    read: string[] | AbiItem[]; // Method names or method objects
    write: string[] | AbiItem[]; // Method names or method objects
    events: string[] | AbiItem[]; // Event names or event objects
    constructor?: AbiItem; // Optional constructor method
  };
  capabilities: {
    read: boolean;
    write: boolean;
    events: boolean;
    canRead?: boolean; // Alias for backward compatibility
    canWrite?: boolean; // Alias for backward compatibility
    hasEvents?: boolean; // Alias for backward compatibility
    canReceive?: boolean;
    canFallback?: boolean;
    isUpgradeable?: boolean;
    isPausable?: boolean;
    isOwnable?: boolean;
  };
  metadata?: {
    name?: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    source?: string;
    tags?: string[];
    category?: string;
    icon?: string;
    color?: string;
    website?: string;
    documentation?: string;
  };
  deployment?: {
    transactionHash?: string;
    blockNumber?: string;
    gasUsed?: string;
    deployedAt?: string;
    isVerified?: boolean;
    verificationStatus?: string;
  };
  types?: {
    generated?: boolean;
    generatedAt?: string;
    error?: string;
    generatedTypes?: Record<string, unknown>;
  };
  ui?: {
    displayName?: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    tags?: string[];
    isActive?: boolean;
    lastUsed?: string;
    usageCount?: number;
  };
}

// ============================================================================
// Client Contract Creation Options
// ============================================================================

export interface ClientContractCreateOptions {
  name: string;
  abi: AbiItem[];
  bytecode: string;
  deployedBytecode?: string;
  chainType?: 'core' | 'evm';
  networkId: string;
  chainId: string | number;
  evmChainId?: string | number;
  network: ClientNetworkConfig;
  metadata?: ClientContractOrchestrator['metadata'];
  ui?: ClientContractOrchestrator['ui'];
}

// ============================================================================
// Client Contract Call Types
// ============================================================================

export interface ClientContractCallParams {
  contractAddress: ClientAddress;
  method: string;
  args: unknown[];
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface ClientContractCallResult {
  success: boolean;
  result?: unknown;
  error?: string;
  gasUsed?: string;
  transactionHash?: string;
  blockNumber?: string;
}

export interface ClientContractCallState {
  id: string;
  contractAddress: ClientAddress;
  method: string;
  methodName: string;
  args: unknown[];
  result: unknown | null;
  error: string | null;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  gasUsed?: string;
  transactionHash?: string;
}

// ============================================================================
// Client Contract Event Types
// ============================================================================

export interface ClientContractEventState {
  id: string;
  contractAddress: ClientAddress;
  eventName: string;
  data: Record<string, unknown>;
  blockNumber: string;
  transactionHash: string;
  timestamp: Date;
  topics: string[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isClientContractInfo(
  value: unknown
): value is ClientContractInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'address' in value &&
    'abi' in value &&
    'name' in value &&
    'network' in value &&
    typeof (value as any).address === 'string' &&
    Array.isArray((value as any).abi) &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).network === 'string'
  );
}

export function isClientContractOrchestrator(
  value: unknown
): value is ClientContractOrchestrator {
  return (
    typeof value === 'object' &&
    value !== null &&
    'address' in value &&
    'abi' in value &&
    'name' in value &&
    'bytecode' in value &&
    'chainType' in value &&
    'networkId' in value &&
    'chainId' in value &&
    'network' in value &&
    'methods' in value &&
    'capabilities' in value &&
    typeof (value as any).address === 'string' &&
    (typeof (value as any).abi === 'string' ||
      Array.isArray((value as any).abi)) &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).bytecode === 'string' &&
    ['core', 'evm'].includes((value as any).chainType) &&
    typeof (value as any).networkId === 'string' &&
    (typeof (value as any).chainId === 'string' ||
      typeof (value as any).chainId === 'number')
  );
}

export function isClientContractCallParams(
  value: unknown
): value is ClientContractCallParams {
  return (
    typeof value === 'object' &&
    value !== null &&
    'contractAddress' in value &&
    'method' in value &&
    'args' in value &&
    typeof (value as any).contractAddress === 'string' &&
    typeof (value as any).method === 'string' &&
    Array.isArray((value as any).args)
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createClientContractInfo(
  base: BaseContractInfo
): ClientContractInfo {
  return {
    ...base,
    address: base.address,
  };
}

export function createClientContractOrchestrator(
  options: ClientContractCreateOptions
): ClientContractOrchestrator {
  return {
    id: `contract_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`,
    name: options.name,
    address: '0x0000000000000000000000000000000000000000' as ClientAddress,
    abi: options.abi,
    bytecode: options.bytecode,
    deployedBytecode: options.deployedBytecode || options.bytecode,
    chainType: options.chainType || 'evm',
    networkId: options.networkId,
    chainId: options.chainId,
    evmChainId: options.evmChainId,
    network: options.network,
    methods: {
      read: options.abi.filter(
        item => item.type === 'function' && item.stateMutability === 'view'
      ),
      write: options.abi.filter(
        item => item.type === 'function' && item.stateMutability !== 'view'
      ),
      events: options.abi.filter(item => item.type === 'event'),
      constructor: options.abi.find(item => item.type === 'constructor'),
    },
    capabilities: {
      read: true,
      write: true,
      events: true,
      canRead: true,
      canWrite: true,
      hasEvents: true,
    },
    metadata: options.metadata,
    ui: options.ui,
  };
}

export function normalizeClientABI(abi: string | AbiItem[]): AbiItem[] {
  if (typeof abi === 'string') {
    try {
      return JSON.parse(abi);
    } catch (error) {
      throw new Error(`Invalid ABI JSON: ${error}`);
    }
  }
  return abi;
}

export function stringifyClientABI(abi: AbiItem[]): string {
  return JSON.stringify(abi);
}
