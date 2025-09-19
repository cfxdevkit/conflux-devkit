// ============================================================================
// Client State Types
// ============================================================================

import {
  ClientWalletInfo,
  ClientNetworkConfig,
  ClientContractOrchestrator,
  ClientNodeStatus,
} from '@conflux-devkit/types';

// ============================================================================
// API Configuration
// ============================================================================

export interface APIConfig {
  baseURL: string;
  wsURL: string;
  timeout?: number;
  retries?: number;
}

// ============================================================================
// Client State
// ============================================================================

export interface ClientState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  currentNetwork: ClientNetworkConfig | null;

  // Node state
  nodeStatus: ClientNodeStatus | null;
  isNodeRunning: boolean;
  nodeError: string | null;

  // Wallet state
  wallets: ClientWalletInfo[];
  activeWallet: ClientWalletInfo | null;
  walletError: string | null;

  // Contract state
  contracts: ClientContractOrchestrator[];
  activeContract: ClientContractOrchestrator | null;
  contractError: string | null;

  // Network state
  availableNetworks: ClientNetworkConfig[];
  isNetworkSwitching: boolean;
  networkError: string | null;

  // Loading states
  loading: Record<string, boolean>;
}

// ============================================================================
// Client Actions
// ============================================================================

export interface ClientActions {
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
  refreshNodeStatus: () => Promise<void>;
  setNodeError: (error: string | null) => void;

  // Wallet actions
  createWallet: (mnemonic?: string) => Promise<ClientWalletInfo>;
  importWallet: (privateKey: string) => Promise<ClientWalletInfo>;
  selectWallet: (address: string) => Promise<void>;
  refreshWalletBalance: (address: string) => Promise<void>;
  setWalletError: (error: string | null) => void;
  removeWallet: (address: string) => Promise<void>;

  // Contract actions
  deployContract: (
    contractName: string,
    args?: unknown[]
  ) => Promise<ClientContractOrchestrator>;
  selectContract: (address: string) => Promise<void>;
  callContractMethod: (params: {
    method: string;
    args: unknown[];
  }) => Promise<{ result: unknown; success: boolean; error?: string }>;
  setContractError: (error: string | null) => void;
  removeContract: (address: string) => Promise<void>;

  // Network actions
  switchNetwork: (networkId: string) => Promise<void>;
  refreshNetworks: () => Promise<void>;
  setNetworkError: (error: string | null) => void;

  // Loading actions
  setLoading: (key: string, loading: boolean) => void;

  // Utility actions
  reset: () => void;
  refreshAll: () => Promise<void>;
}

export type ClientStore = ClientState & ClientActions;

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
  status: ClientNodeStatus;
}

export interface WalletEvent {
  wallet: ClientWalletInfo;
}

export interface ContractEvent {
  contract: ClientContractOrchestrator;
}

export interface NetworkEvent {
  network: ClientNetworkConfig;
}

export interface ErrorEvent {
  error: string;
  context: string;
}

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
  network?: ClientNetworkConfig;
}

export interface NodeResponse {
  status: ClientNodeStatus;
}

export interface WalletResponse {
  wallet: ClientWalletInfo;
}

export interface WalletsResponse {
  wallets: ClientWalletInfo[];
  activeWallet: string | null;
}

export interface ContractResponse {
  contract: ClientContractOrchestrator;
}

export interface ContractsResponse {
  contracts: ClientContractOrchestrator[];
  activeContract: string | null;
}

export interface NetworkResponse {
  network: ClientNetworkConfig;
}

export interface NetworksResponse {
  networks: ClientNetworkConfig[];
}
