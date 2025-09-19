// Base types for Conflux DevKit - Foundation for all other types

// ============================================================================
// Base Address Type
// ============================================================================

export type BaseAddress = `0x${string}`;

// ============================================================================
// Base Wallet Interface
// ============================================================================

export interface BaseWalletInfo {
  index: number;
  address: BaseAddress;
  privateKey: BaseAddress;
  mnemonic?: string;
  isMining?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// Base Network Interface
// ============================================================================

export interface BaseNetworkConfig {
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
// Base Contract Interface
// ============================================================================

export interface BaseContractInfo {
  address: BaseAddress;
  abi: AbiItem[];
  name: string;
  version?: string;
  deployedAt?: Date;
  network: string;
}

// ============================================================================
// Base ABI Types
// ============================================================================

export interface AbiItem {
  type: string;
  name?: string;
  inputs?: AbiInput[];
  outputs?: AbiOutput[];
  stateMutability?: string;
  anonymous?: boolean;
}

export interface AbiInput {
  name: string;
  type: string;
  indexed?: boolean;
  internalType?: string;
}

export interface AbiOutput {
  name: string;
  type: string;
  internalType?: string;
}

// ============================================================================
// Base Transaction Types
// ============================================================================

export interface BaseTransactionRequest {
  to: BaseAddress;
  value?: bigint;
  data?: BaseAddress;
  gasLimit?: bigint;
  gasPrice?: bigint;
}

export interface BaseTransactionResponse {
  hash: BaseAddress;
  from: BaseAddress;
  to: BaseAddress;
  value: bigint;
  gasUsed: bigint;
  status: 'pending' | 'success' | 'failed';
  blockNumber?: bigint;
  confirmations?: number;
}

// ============================================================================
// Base Block Types
// ============================================================================

export interface BaseBlock {
  number: bigint | null;
  hash: BaseAddress | null;
  parentHash: BaseAddress;
  timestamp: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  transactions: BaseAddress[] | BaseTransaction[];
}

export interface BaseTransaction {
  hash: BaseAddress;
  from: BaseAddress;
  to: BaseAddress | null;
  value: bigint;
  gas: bigint;
  gasPrice: bigint;
  nonce: number;
  blockNumber: bigint | null;
  blockHash: BaseAddress | null;
  transactionIndex: number | null;
}

// ============================================================================
// Base Log Types
// ============================================================================

export interface BaseLog {
  address: BaseAddress;
  topics: BaseAddress[];
  data: BaseAddress;
  blockNumber: bigint | null;
  blockHash: BaseAddress | null;
  transactionHash: BaseAddress | null;
  transactionIndex: number | null;
  logIndex: number | null;
  removed: boolean;
}

// ============================================================================
// Base Contract Call Types
// ============================================================================

export interface BaseContractCallParams {
  address: BaseAddress;
  abi: AbiItem[];
  functionName: string;
  args?: unknown[];
}

export interface BaseContractCallResult {
  result: unknown;
  gasUsed: bigint;
  blockNumber: bigint;
}

// ============================================================================
// Base Node Status Interface
// ============================================================================

export interface BaseNodeStatus {
  running: boolean;
  corePort: number;
  evmPort: number;
  chainId: number;
  evmChainId: number;
  blockNumber: bigint;
  peerCount: number;
  walletMode: 'mnemonic' | 'privatekey';
  wallets: BaseWalletInfo[];
  miningAddress: BaseAddress | null;
  health: 'healthy' | 'unhealthy' | 'unknown' | 'starting' | 'stopping';
  lastHealthCheck: Date;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isBaseAddress(value: unknown): value is BaseAddress {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isBaseWalletInfo(value: unknown): value is BaseWalletInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'address' in value &&
    'privateKey' in value &&
    'index' in value &&
    isBaseAddress((value as any).address) &&
    isBaseAddress((value as any).privateKey) &&
    typeof (value as any).index === 'number'
  );
}

export function isBaseNetworkConfig(
  value: unknown
): value is BaseNetworkConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'rpcUrl' in value &&
    'chainId' in value &&
    'currency' in value &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).rpcUrl === 'string' &&
    typeof (value as any).chainId === 'number'
  );
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
