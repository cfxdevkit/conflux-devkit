// Node management types

// Node configuration with optional properties
export interface NodeConfig {
  // Port configuration
  port?: number;
  corePort?: number;
  ethPort?: number;
  evmPort?: number;

  // Network configuration
  network?: 'local' | 'testnet' | 'mainnet';
  chainId?: number;
  evmChainId?: number;

  // Data and storage
  dataDir?: string;

  // Mining configuration
  mining?: boolean;
  miningThreads?: number;

  // RPC configuration
  rpc?: boolean;
  rpcPort?: number;

  // EVM configuration
  evm?: boolean;

  // Logging and debugging
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  silent?: boolean;

  // Network settings
  maxPeers?: number;
  syncMode?: 'full' | 'fast' | 'light';

  // Development settings
  dev?: boolean;
  genesis?: string;

  // Wallet configuration
  walletMode?: 'mnemonic' | 'privatekey';
  mnemonic?: string;
  privateKey?: string;
  fundWallets?: boolean;
  walletCount?: number;

  // Legacy properties for backward compatibility
  blockInterval?: number;
}

// Default node configuration
export const DEFAULT_NODE_CONFIG: Required<NodeConfig> = {
  // Port configuration
  port: 12537,
  corePort: 12537,
  ethPort: 8545,
  evmPort: 8545,

  // Network configuration
  network: 'local',
  chainId: 1029,
  evmChainId: 1030,

  // Data and storage
  dataDir: './conflux-data',

  // Mining configuration
  mining: false,
  miningThreads: 1,

  // RPC configuration
  rpc: true,
  rpcPort: 12539,

  // EVM configuration
  evm: true,

  // Logging and debugging
  logLevel: 'info',
  silent: false,

  // Network settings
  maxPeers: 50,
  syncMode: 'full',

  // Development settings
  dev: false,
  genesis: '',

  // Wallet configuration
  walletMode: 'mnemonic',
  mnemonic: '',
  privateKey: '',
  fundWallets: true,
  walletCount: 10,

  // Legacy properties
  blockInterval: 1000,
};

// Node status
export interface NodeStatus {
  running: boolean;
  corePort?: number;
  evmPort?: number;
  chainId?: number;
  evmChainId?: number;
  blockNumber?: bigint;
  peerCount?: number;
  walletMode?: 'mnemonic' | 'privatekey';
  wallets?: WalletInfo[];
  miningAddress?: `0x${string}`;
  uptime?: number;
  lastBlockTime?: Date;
  health?: 'healthy' | 'unhealthy' | 'unknown' | 'starting' | 'stopping';
  lastHealthCheck?: Date;
}

// Import WalletInfo from blockchain types
import type { WalletInfo } from './blockchain';
