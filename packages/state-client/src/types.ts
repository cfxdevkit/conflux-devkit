// ============================================================================
// Client-side API Types for Conflux DevKit
// ============================================================================

// Base API configuration
export interface APIConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  websocket?: {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
  };
}

// Client-side data types (browser-safe)
export interface ClientWalletInfo {
  address: string;
  privateKey: string; // Only for development/testing
  balance: string;
  balanceFormatted: string;
  isDefault?: boolean;
  name?: string;
  network?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientContractOrchestrator {
  id?: string;
  address: string;
  name: string;
  abi: string | any[];
  bytecode: string;
  deployedBytecode: string;
  chainType: 'core' | 'evm';
  networkId: string;
  chainId: string | number;
  evmChainId?: string | number;
  network: ClientNetworkConfig;
  methods: {
    read: string[] | any[];
    write: string[] | any[];
    events: string[] | any[];
    constructor?: any;
  };
  capabilities: {
    read: boolean;
    write: boolean;
    events: boolean;
    canRead?: boolean;
    canWrite?: boolean;
    hasEvents?: boolean;
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

export interface ClientNetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: string;
  evmChainId?: string;
  currency: {
    name: string;
    symbol: string;
    decimals: string;
  };
  isTestnet: boolean;
  networkType?: 'core' | 'evm';
  blockExplorer?: string;
}

export interface ClientNodeStatus {
  isRunning: boolean;
  isStarting: boolean;
  isStopping: boolean;
  error: string | null;
  lastHealthCheck: string | null;
  uptime: number;
  version?: string;
  network?: string;
  blockNumber?: string;
  peerCount?: number;
}

// Client state interface
export interface ClientState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Node state
  node: {
    status: ClientNodeStatus | null;
    isRunning: boolean;
    isStarting: boolean;
    isStopping: boolean;
    error: string | null;
  };

  // Wallet state
  wallets: {
    activeWallet: ClientWalletInfo | null;
    wallets: ClientWalletInfo[];
    isCreating: boolean;
    isImporting: boolean;
    error: string | null;
    balance: string | null;
    isRefreshing: boolean;
  };

  // Contract state
  contracts: {
    deployed: ClientContractOrchestrator[];
    isDeploying: boolean;
    deploymentError: string | null;
    activeContract: ClientContractOrchestrator | null;
    contractCalls: ClientContractCallState[];
    events: ClientContractEventState[];
    error: string | null;
  };

  // Network state
  network: {
    current: ClientNetworkConfig | null;
    available: ClientNetworkConfig[];
    isSwitching: boolean;
    switchError: string | null;
  };

  // Loading states
  loading: Record<string, boolean>;
  globalLoading: boolean;

  // Error state
  error: string | null;
  errors: Record<string, string>;
}

// Client actions interface
export interface ClientActions {
  // Connection actions
  connect: (config?: Partial<ClientNetworkConfig>) => Promise<void>;
  disconnect: () => Promise<void>;
  setConnectionError: (error: string | null) => void;

  // Node actions
  startNode: (config?: Partial<ClientNetworkConfig>) => Promise<void>;
  stopNode: () => Promise<void>;
  restartNode: (config?: Partial<ClientNetworkConfig>) => Promise<void>;
  getNodeStatus: () => Promise<ClientNodeStatus | null>;

  // Wallet actions
  createWallet: (mnemonic?: string) => Promise<ClientWalletInfo>;
  importWallet: (privateKey: string) => Promise<ClientWalletInfo>;
  selectWallet: (address: string) => Promise<void>;
  refreshWalletBalance: (address: string) => Promise<void>;
  removeWallet: (address: string) => Promise<void>;

  // Contract actions
  deployContract: (
    name: string,
    bytecode: string,
    abi: any[],
    args: unknown[]
  ) => Promise<ClientContractOrchestrator>;
  callContract: (
    address: string,
    method: string,
    args: unknown[]
  ) => Promise<unknown>;
  selectContract: (address: string) => Promise<void>;
  removeContract: (address: string) => Promise<void>;

  // Network actions
  switchNetwork: (networkId: string) => Promise<void>;
  getAvailableNetworks: () => Promise<ClientNetworkConfig[]>;

  // Loading actions
  setLoading: (key: string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;

  // Error actions
  setError: (error: string) => void;
  setFieldError: (field: string, error: string) => void;
  clearError: () => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;

  // Utility actions
  reset: () => void;
}

// Combined client store
export type ClientStore = ClientState &
  ClientActions & {
    // API clients (not persisted)
    apiClient: any | null;
    wsClient: any | null;

    // Client initialization
    initializeClients: (config: APIConfig) => { apiClient: any; wsClient: any };
  };

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface ConnectionResponse {
  isConnected: boolean;
  network: ClientNetworkConfig;
  timestamp: string;
}

export interface NodeResponse {
  status: ClientNodeStatus;
  timestamp: string;
}

export interface WalletResponse {
  wallet: ClientWalletInfo;
  timestamp: string;
}

export interface WalletsResponse {
  wallets: ClientWalletInfo[];
  activeWallet: ClientWalletInfo | null;
  timestamp: string;
}

export interface ContractResponse {
  contract: ClientContractOrchestrator;
  timestamp: string;
}

export interface ContractsResponse {
  contracts: ClientContractOrchestrator[];
  activeContract: ClientContractOrchestrator | null;
  timestamp: string;
}

export interface NetworkResponse {
  network: ClientNetworkConfig;
  timestamp: string;
}

export interface NetworksResponse {
  networks: ClientNetworkConfig[];
  current: ClientNetworkConfig | null;
  timestamp: string;
}

// WebSocket event types
export interface WebSocketEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface ConnectionEvent {
  type: 'connection:connected' | 'connection:disconnected' | 'connection:error';
  data: {
    isConnected: boolean;
    error?: string;
  };
}

export interface NodeEvent {
  type: 'node:started' | 'node:stopped' | 'node:status' | 'node:error';
  data: ClientNodeStatus;
}

export interface WalletEvent {
  type:
    | 'wallet:created'
    | 'wallet:imported'
    | 'wallet:selected'
    | 'wallet:removed'
    | 'wallet:balance';
  data: ClientWalletInfo;
}

export interface ContractEvent {
  type:
    | 'contract:deployed'
    | 'contract:called'
    | 'contract:selected'
    | 'contract:removed';
  data: ClientContractOrchestrator;
}

export interface NetworkEvent {
  type: 'network:switched' | 'network:available';
  data: ClientNetworkConfig | ClientNetworkConfig[];
}

export interface ErrorEvent {
  type: 'error:occurred' | 'error:cleared';
  data: {
    error: string;
    field?: string;
  };
}

// Contract call and event states
export interface ClientContractCallState {
  id: string;
  contractAddress: string;
  method: string;
  args: unknown[];
  result?: unknown;
  error?: string;
  timestamp: string;
  status: 'pending' | 'success' | 'error';
}

export interface ClientContractEventState {
  id: string;
  contractAddress: string;
  eventName: string;
  data: unknown;
  blockNumber: string;
  transactionHash: string;
  timestamp: string;
}
