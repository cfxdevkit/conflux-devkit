// ============================================================================
// WebSocket API Implementation
// ============================================================================

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { stateEventEmitter } from '../services/StateService';
import { WebSocketEvent } from '../types';

// ============================================================================
// WebSocket Server Class
// ============================================================================

export class WebSocketAPIServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private port: number;

  constructor(port: number = 3002) {
    this.port = port;
    this.wss = new WebSocketServer({ port: this.port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log(
        `🔌 New WebSocket connection from ${req.socket.remoteAddress}`
      );

      // Add client to set
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection:established',
        data: { message: 'Connected to Conflux DevKit WebSocket API' },
        timestamp: new Date().toISOString(),
      });

      // Handle client messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', error => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Set up event listeners for state changes
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Connection events
    stateEventEmitter.on('connection:connected', data => {
      this.broadcast({
        type: 'connection:connected',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('connection:disconnected', data => {
      this.broadcast({
        type: 'connection:disconnected',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('connection:error', data => {
      this.broadcast({
        type: 'connection:error',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    // Node events
    stateEventEmitter.on('node:started', data => {
      this.broadcast({
        type: 'node:started',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('node:stopped', data => {
      this.broadcast({
        type: 'node:stopped',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('node:status:changed', data => {
      this.broadcast({
        type: 'node:status:changed',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('node:error', data => {
      this.broadcast({
        type: 'node:error',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    // Wallet events
    stateEventEmitter.on('wallet:created', data => {
      this.broadcast({
        type: 'wallet:created',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('wallet:updated', data => {
      this.broadcast({
        type: 'wallet:updated',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('wallet:removed', data => {
      this.broadcast({
        type: 'wallet:removed',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('wallet:selected', data => {
      this.broadcast({
        type: 'wallet:selected',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('wallet:balance:updated', data => {
      this.broadcast({
        type: 'wallet:balance:updated',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    // Contract events
    stateEventEmitter.on('contract:deployed', data => {
      this.broadcast({
        type: 'contract:deployed',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('contract:updated', data => {
      this.broadcast({
        type: 'contract:updated',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('contract:removed', data => {
      this.broadcast({
        type: 'contract:removed',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('contract:selected', data => {
      this.broadcast({
        type: 'contract:selected',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('contract:called', data => {
      this.broadcast({
        type: 'contract:called',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('contract:event', data => {
      this.broadcast({
        type: 'contract:event',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    // Network events
    stateEventEmitter.on('network:switched', data => {
      this.broadcast({
        type: 'network:switched',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    stateEventEmitter.on('network:error', data => {
      this.broadcast({
        type: 'network:error',
        data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    // Handle client-specific messages here
    // For now, we just echo back the message
    this.sendToClient(ws, {
      type: 'message:echo',
      data: message,
      timestamp: new Date().toISOString(),
    });
  }

  private sendToClient(ws: WebSocket, event: WebSocketEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(event));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.clients.delete(ws);
      }
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendToClient(ws, {
      type: 'error',
      data: { error },
      timestamp: new Date().toISOString(),
    });
  }

  private broadcast(event: WebSocketEvent): void {
    const message = JSON.stringify(event);

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Failed to broadcast WebSocket message:', error);
          this.clients.delete(ws);
        }
      } else {
        this.clients.delete(ws);
      }
    });
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public getPort(): number {
    return this.port;
  }

  public close(): Promise<void> {
    return new Promise(resolve => {
      this.wss.close(() => {
        console.log('🛑 WebSocket Server stopped');
        resolve();
      });
    });
  }
}
