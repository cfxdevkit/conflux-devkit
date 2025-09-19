// ============================================================================
// @conflux-devkit/state-server
// Server-side state management and API for Conflux DevKit applications
// ============================================================================

// Types
export type {
  APIResponse,
  ConnectionResponse,
  NodeResponse,
  WalletResponse,
  WalletsResponse,
  BalanceResponse,
  ContractResponse,
  ContractsResponse,
  ContractCallResponse,
  NetworkResponse,
  NetworksResponse,
  WebSocketEvent,
  ConnectionEvent,
  NodeEvent,
  WalletEvent,
  ContractEvent,
  ContractCallEvent,
  NetworkEvent,
  ErrorEvent,
  ServerState,
  ServerActions,
  ServerStore,
} from './types';

// Services
export { useServerStore, stateEventEmitter } from './services/StateService';

// API
export { RestAPIServer } from './api/RestAPI';
export { WebSocketAPIServer } from './api/WebSocketAPI';

// Utils
export { EventEmitter } from './utils/EventEmitter';

// Default export
export { useServerStore as default } from './services/StateService';
