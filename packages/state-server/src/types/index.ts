// ============================================================================
// Server State Types
// ============================================================================

import { z } from 'zod';

// ============================================================================
// API Request/Response Types
// ============================================================================

export const ConnectionRequestSchema = z.object({
  config: z
    .object({
      chainId: z.string().optional(),
      rpcUrl: z.string().optional(),
    })
    .optional(),
});

export const NodeRequestSchema = z.object({
  config: z
    .object({
      chainId: z.string().optional(),
      rpcUrl: z.string().optional(),
    })
    .optional(),
});

export const WalletCreateRequestSchema = z.object({
  mnemonic: z.string().optional(),
});

export const WalletImportRequestSchema = z.object({
  privateKey: z.string(),
});

export const ContractDeployRequestSchema = z.object({
  contractName: z.string(),
  args: z.array(z.unknown()).optional(),
});

export const ContractCallRequestSchema = z.object({
  method: z.string(),
  args: z.array(z.unknown()),
});

export const NetworkSwitchRequestSchema = z.object({
  networkId: z.string(),
});

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ConnectionResponse {
  isConnected: boolean;
  network?: {
    name: string;
    chainId: string;
    rpcUrl: string;
  };
}

export interface NodeResponse {
  status: {
    isRunning: boolean;
    isStarting: boolean;
    isStopping: boolean;
    error: string | null;
    lastHealthCheck: string | null;
    uptime: number;
  };
}

export interface WalletResponse {
  address: string;
  balance: string;
  balanceFormatted: string;
  isActive: boolean;
}

export interface WalletsResponse {
  wallets: WalletResponse[];
  activeWallet: string | null;
}

export interface BalanceResponse {
  balance: string;
  balanceFormatted: string;
}

export interface ContractResponse {
  address: string;
  name: string;
  abi: string;
  network: string;
  isActive: boolean;
}

export interface ContractsResponse {
  contracts: ContractResponse[];
  activeContract: string | null;
}

export interface ContractCallResponse {
  result: unknown;
  success: boolean;
  error?: string;
}

export interface NetworkResponse {
  network: {
    name: string;
    chainId: string;
    rpcUrl: string;
    currency: {
      name: string;
      symbol: string;
      decimals: string;
    };
    isTestnet: boolean;
  };
}

export interface NetworksResponse {
  networks: NetworkResponse['network'][];
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export interface WebSocketEvent<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
}

export interface ConnectionEvent {
  isConnected: boolean;
}

export interface NodeEvent {
  status: NodeResponse['status'];
}

export interface WalletEvent {
  wallet: WalletResponse;
}

export interface ContractEvent {
  contract: ContractResponse;
}

export interface ContractCallEvent {
  call: {
    method: string;
    args: unknown[];
    result: unknown;
    success: boolean;
    error?: string;
  };
}

export interface NetworkEvent {
  network: NetworkResponse['network'];
}

export interface ErrorEvent {
  error: string;
  context: string;
}

// ============================================================================
// Server State Types
// ============================================================================

export interface ServerState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  currentNetwork: NetworkResponse['network'] | null;

  // Node state
  node: {
    status: NodeResponse['status'];
    isRunning: boolean;
    isStarting: boolean;
    isStopping: boolean;
    error: string | null;
    lastHealthCheck: Date | null;
    uptime: number;
  };

  // Wallet state
  wallets: {
    activeWallet: string | null;
    wallets: Map<string, WalletResponse>;
    isCreating: boolean;
    isImporting: boolean;
    error: string | null;
  };

  // Contract state
  contracts: {
    activeContract: string | null;
    contracts: Map<string, ContractResponse>;
    isDeploying: boolean;
    deploymentError: string | null;
    error: string | null;
  };

  // Network state
  networks: {
    available: NetworkResponse['network'][];
    isSwitching: boolean;
    switchError: string | null;
  };
}

// ============================================================================
// Server Actions
// ============================================================================

export interface ServerActions {
  // Connection actions
  connect: (config?: { chainId?: string; rpcUrl?: string }) => Promise<void>;
  disconnect: () => Promise<void>;
  setConnectionError: (error: string | null) => void;

  // Node actions
  startNode: (config?: { chainId?: string; rpcUrl?: string }) => Promise<void>;
  stopNode: () => Promise<void>;
  restartNode: (config?: {
    chainId?: string;
    rpcUrl?: string;
  }) => Promise<void>;
  updateNodeStatus: (status: NodeResponse['status']) => void;
  setNodeError: (error: string | null) => void;

  // Wallet actions
  createWallet: (mnemonic?: string) => Promise<WalletResponse>;
  importWallet: (privateKey: string) => Promise<WalletResponse>;
  selectWallet: (address: string) => void;
  refreshWalletBalance: (address: string) => Promise<void>;
  setWalletError: (error: string | null) => void;
  removeWallet: (address: string) => void;

  // Contract actions
  deployContract: (
    contractName: string,
    args?: unknown[]
  ) => Promise<ContractResponse>;
  selectContract: (address: string) => void;
  callContractMethod: (
    params: z.infer<typeof ContractCallRequestSchema>
  ) => Promise<ContractCallResponse>;
  setContractError: (error: string | null) => void;
  removeContract: (address: string) => void;

  // Network actions
  switchNetwork: (networkId: string) => Promise<void>;
  setNetworkError: (error: string | null) => void;

  // Utility actions
  reset: () => void;
  refreshAll: () => Promise<void>;
}

export type ServerStore = ServerState & ServerActions;
