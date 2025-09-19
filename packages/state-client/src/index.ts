// ============================================================================
// @conflux-devkit/state-client - Client-side API and State Management
// ============================================================================

// Types
export type {
  APIConfig,
  ClientState,
  ClientActions,
  ClientStore,
  ClientWalletInfo,
  ClientContractOrchestrator,
  ClientNetworkConfig,
  ClientNodeStatus,
  ClientContractCallState,
  ClientContractEventState,
  WebSocketEvent,
  ConnectionEvent,
  NodeEvent,
  WalletEvent,
  ContractEvent,
  NetworkEvent,
  ErrorEvent,
  APIResponse,
  ConnectionResponse,
  NodeResponse,
  WalletResponse,
  WalletsResponse,
  ContractResponse,
  ContractsResponse,
  NetworkResponse,
  NetworksResponse,
} from './types';

// API Clients
export { APIClient } from './api/APIClient';
export { WebSocketClient } from './api/WebSocketClient';

// Store
export { useClientStore } from './store';

// React Hooks
export {
  useClientState,
  useConnection,
  useNode,
  useWallets,
  useContracts,
  useNetwork,
  useLoading,
  useError,
  useWebSocket,
  useClientInitialization,
} from './hooks';

// Contract Business Logic
export * from './contracts';

// Default export
export { useClientState as default } from './hooks';
