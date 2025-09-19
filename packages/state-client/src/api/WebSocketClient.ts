// ============================================================================
// WebSocket Client for Real-time Updates
// ============================================================================

import type {
  WebSocketEvent,
  ConnectionEvent,
  NodeEvent,
  WalletEvent,
  ContractEvent,
  NetworkEvent,
  ErrorEvent,
  APIConfig,
} from '../types';

export type WebSocketEventHandler<T = unknown> = (data: T) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<APIConfig>['websocket'];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isDestroyed = false;

  // Event handlers
  private eventHandlers = new Map<string, Set<WebSocketEventHandler>>();

  constructor(config: Required<APIConfig>['websocket']) {
    this.config = config;
  }

  // ========================================================================
  // Connection Management
  // ========================================================================

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isDestroyed) {
        reject(new Error('WebSocket is already connecting or destroyed'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connection:connected', { isConnected: true });
          resolve();
        };

        this.ws.onmessage = event => {
          try {
            const message: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = event => {
          this.isConnecting = false;
          this.emit('connection:disconnected', { isConnected: false });

          if (!this.isDestroyed && !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = error => {
          this.isConnecting = false;
          this.emit('connection:error', {
            isConnected: false,
            error: error.toString(),
          });
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isDestroyed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (
      this.isDestroyed ||
      this.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        this.connect().catch(() => {
          // Reconnection failed, will be handled by scheduleReconnect
        });
      }
    }, delay);
  }

  // ========================================================================
  // Message Handling
  // ========================================================================

  private handleMessage(message: WebSocketEvent): void {
    const { type, data } = message;

    switch (type) {
      case 'connection:connected':
      case 'connection:disconnected':
      case 'connection:error':
        this.emit(type, data as ConnectionEvent['data']);
        break;

      case 'node:started':
      case 'node:stopped':
      case 'node:status':
      case 'node:error':
        this.emit(type, data as NodeEvent['data']);
        break;

      case 'wallet:created':
      case 'wallet:imported':
      case 'wallet:selected':
      case 'wallet:removed':
      case 'wallet:balance':
        this.emit(type, data as WalletEvent['data']);
        break;

      case 'contract:deployed':
      case 'contract:called':
      case 'contract:selected':
      case 'contract:removed':
        this.emit(type, data as ContractEvent['data']);
        break;

      case 'network:switched':
      case 'network:available':
        this.emit(type, data as NetworkEvent['data']);
        break;

      case 'error:occurred':
      case 'error:cleared':
        this.emit(type, data as ErrorEvent['data']);
        break;

      default:
        console.warn('Unknown WebSocket event type:', type);
    }
  }

  // ========================================================================
  // Event Management
  // ========================================================================

  on<T = unknown>(event: string, handler: WebSocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as WebSocketEventHandler);
  }

  off<T = unknown>(event: string, handler: WebSocketEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as WebSocketEventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  private emit<T = unknown>(event: string, data: T): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(
            `Error in WebSocket event handler for ${event}:`,
            error
          );
        }
      });
    }
  }

  // ========================================================================
  // Specific Event Handlers
  // ========================================================================

  onConnection(handler: WebSocketEventHandler<ConnectionEvent['data']>): void {
    this.on('connection:connected', handler);
    this.on('connection:disconnected', handler);
    this.on('connection:error', handler);
  }

  onNode(handler: WebSocketEventHandler<NodeEvent['data']>): void {
    this.on('node:started', handler);
    this.on('node:stopped', handler);
    this.on('node:status', handler);
    this.on('node:error', handler);
  }

  onWallet(handler: WebSocketEventHandler<WalletEvent['data']>): void {
    this.on('wallet:created', handler);
    this.on('wallet:imported', handler);
    this.on('wallet:selected', handler);
    this.on('wallet:removed', handler);
    this.on('wallet:balance', handler);
  }

  onContract(handler: WebSocketEventHandler<ContractEvent['data']>): void {
    this.on('contract:deployed', handler);
    this.on('contract:called', handler);
    this.on('contract:selected', handler);
    this.on('contract:removed', handler);
  }

  onNetwork(handler: WebSocketEventHandler<NetworkEvent['data']>): void {
    this.on('network:switched', handler);
    this.on('network:available', handler);
  }

  onError(handler: WebSocketEventHandler<ErrorEvent['data']>): void {
    this.on('error:occurred', handler);
    this.on('error:cleared', handler);
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getMaxReconnectAttempts(): number {
    return this.config.maxReconnectAttempts;
  }

  destroy(): void {
    this.disconnect();
    this.eventHandlers.clear();
  }
}
