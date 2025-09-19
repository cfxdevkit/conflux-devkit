import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseRealTimeWebSocketProps {
  url: string;
  enabled?: boolean;
  onStatusUpdate?: (data: any) => void;
  onNodeEvent?: (data: any) => void;
  onContractEvent?: (data: any) => void;
  onNetworkEvent?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useRealTimeWebSocket({
  url,
  enabled = true,
  onStatusUpdate,
  onNodeEvent,
  onContractEvent,
  onNetworkEvent,
  onError
}: UseRealTimeWebSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      // Create socket connection
      const socket = io(url, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        console.warn('🔶 WebSocket connection error:', error.message);
        if (onError) {
          onError(new Error(`WebSocket connection failed: ${error.message}`));
        }
      });

      // Status updates
      if (onStatusUpdate) {
        socket.on('status:workspace', onStatusUpdate);
        socket.on('status:node', onStatusUpdate);
        socket.on('status:service', onStatusUpdate);
      }

      // Node events
      if (onNodeEvent) {
        socket.on('node:started', onNodeEvent);
        socket.on('node:stopped', onNodeEvent);
        socket.on('node:block', onNodeEvent);
        socket.on('node:peer', onNodeEvent);
        socket.on('node:error', onNodeEvent);
      }

      // Contract events
      if (onContractEvent) {
        socket.on('contract:deployed', onContractEvent);
        socket.on('contract:event', onContractEvent);
        socket.on('contract:transaction', onContractEvent);
      }

      // Network events
      if (onNetworkEvent) {
        socket.on('network:changed', onNetworkEvent);
        socket.on('network:latency', onNetworkEvent);
        socket.on('network:peers', onNetworkEvent);
      }

      // Error handling
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (onError) {
          onError(new Error(`WebSocket error: ${error.message || error}`));
        }
      });

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown WebSocket error'));
      }
    }
  }, [url, enabled, onStatusUpdate, onNodeEvent, onContractEvent, onNetworkEvent, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Connection management
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    emit,
    connect,
    disconnect,
  };
}