// WebSocket service for real-time DevKit events
import { create } from 'zustand';

export interface BlockInfo {
  number: string;
  hash: string;
  timestamp: string;
  transactions: number;
}

export interface NodeStats {
  coreBlockNumber: string;
  evmBlockNumber: string;
  coreLatestBlock?: BlockInfo;
  evmLatestBlock?: BlockInfo;
  miningStatus: boolean;
  gasPrice: {
    core: string;
    evm: string;
  };
  networkInfo: {
    chainId: number;
    evmChainId: number;
  };
}

export interface WebSocketState {
  isConnected: boolean;
  nodeStats: NodeStats | null;
  lastUpdate: Date | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  subscribeToBlocks: () => void;
  unsubscribeFromBlocks: () => void;
  setQueryClient: (queryClient: any) => void;
}

class DevKitWebSocketService {
  private coreWs: WebSocket | null = null;
  private evmWs: WebSocket | null = null;
  private backendWs: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private queryClient: any = null; // Will be injected

  // WebSocket URLs for DevKit nodes (currently disabled)
  // private readonly CORE_WS_URL = 'ws://localhost:12535';
  // private readonly EVM_WS_URL = 'ws://localhost:8546';
  private readonly BACKEND_WS_URL = 'ws://localhost:3002';

  private updateStore: (update: Partial<WebSocketState>) => void = () => {};

  setStoreUpdater(updater: (update: Partial<WebSocketState>) => void) {
    this.updateStore = updater;
  }

  setQueryClient(queryClient: any) {
    this.queryClient = queryClient;
  }

  getCurrentStats(): any {
    // This will be set by the store
    return null;
  }

  async connect(): Promise<void> {
    try {
      // Connect to backend WebSocket (always available)
      await this.connectBackend();
      
      // Skip direct DevKit node WebSocket connections for now
      // TODO: Debug DevKit node WebSocket access later
      console.log('Note: Direct DevKit node WebSocket connections disabled for debugging');
      
      this.updateStore({ 
        isConnected: true, 
        error: null,
        lastUpdate: new Date() 
      });
      
    } catch (error) {
      console.error('Failed to connect WebSockets:', error);
      this.updateStore({ 
        error: error instanceof Error ? error.message : 'Connection failed',
        isConnected: false 
      });
    }
  }

  private async connectBackend(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.backendWs = new WebSocket(this.BACKEND_WS_URL);
      
      this.backendWs.onopen = () => {
        console.log('Connected to backend WebSocket');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.backendWs.onerror = (error) => {
        console.error('Backend WebSocket error:', error);
        reject(new Error('Backend WebSocket connection failed'));
      };

      this.backendWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleBackendMessage(data);
        } catch (error) {
          console.error('Failed to parse backend message:', error);
        }
      };

      this.backendWs.onclose = () => {
        console.log('Backend WebSocket closed');
        this.handleReconnect();
      };
    });
  }

  /*
  private async connectDevKitNodes(): Promise<void> {
    // Temporarily disabled for debugging
    console.log('DevKit WebSocket connections disabled for debugging');
    return;

    // Try Core WebSocket
    try {
      await this.connectCoreNode();
    } catch (error) {
      console.log('Core WebSocket not available:', error);
    }

    // Try EVM WebSocket
    try {
      await this.connectEvmNode();
    } catch (error) {
      console.log('EVM WebSocket not available:', error);
    }
  }
  */

  /*
  private async connectCoreNode(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.coreWs = new WebSocket(this.CORE_WS_URL);

      this.coreWs.onopen = () => {
        console.log('Connected to Core WebSocket');
        // Subscribe to new blocks
        this.coreWs?.send(JSON.stringify({
          method: 'cfx_subscribe',
          params: ['newHeads'],
          id: 1
        }));
        resolve();
      };

      this.coreWs.onerror = (error) => {
        console.error('Core WebSocket error:', error);
        reject(error);
      };

      this.coreWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleCoreMessage(data);
        } catch (error) {
          console.error('Failed to parse core message:', error);
        }
      };

      this.coreWs.onclose = () => {
        console.log('Core WebSocket closed');
      };
    });
  }
  */

  /*
  private async connectEvmNode(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.evmWs = new WebSocket(this.EVM_WS_URL);

      this.evmWs.onopen = () => {
        console.log('Connected to EVM WebSocket');
        // Subscribe to new blocks
        this.evmWs?.send(JSON.stringify({
          method: 'eth_subscribe',
          params: ['newHeads'],
          id: 1
        }));
        resolve();
      };

      this.evmWs.onerror = (error) => {
        console.error('EVM WebSocket error:', error);
        reject(error);
      };

      this.evmWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvmMessage(data);
        } catch (error) {
          console.error('Failed to parse EVM message:', error);
        }
      };

      this.evmWs.onclose = () => {
        console.log('EVM WebSocket closed');
      };
    });
  }
  */

  private handleBackendMessage(data: any) {
    // Handle backend WebSocket messages (DevKit events, status updates, etc.)
    console.log('Received backend message:', data);

    if (data.type === 'nodeStats') {
      const nodeStatsData = data.data;

      // Check if node running status changed
      const currentStats = this.getCurrentStats();
      const nodeStatusChanged = currentStats &&
        (currentStats.nodeRunning !== nodeStatsData.nodeRunning);

      // Update store with new data
      this.updateStore({
        nodeStats: nodeStatsData,
        isConnected: true,
        lastUpdate: new Date()
      });

      // If node status changed, trigger query invalidation
      if (nodeStatusChanged && this.queryClient) {
        console.log('Node status changed, invalidating queries');
        this.queryClient.invalidateQueries({ queryKey: ['devkit-status'] });
        this.queryClient.invalidateQueries({ queryKey: ['public-status'] });
        // Only invalidate balance if node is now running
        if (nodeStatsData.nodeRunning) {
          this.queryClient.invalidateQueries({ queryKey: ['account-balance'] });
        }
      }
    } else if (data.type === 'connected') {
      console.log('Backend WebSocket connected:', data.data?.message || data.message);
      this.updateStore({ isConnected: true });
    } else if (data.type === 'blockUpdate') {
      // Handle block updates from backend
      console.log('Block update:', data);
    }
  }

  /*
  private handleCoreMessage(data: any) {
    // Handle Conflux Core RPC WebSocket messages
    if (data.method === 'cfx_subscription' && data.params) {
      const blockData = data.params.result;
      console.log('New Core block:', blockData);

      // Update store with new core block
      this.updateStore({
        nodeStats: {
          ...this.getCurrentStats(),
          coreBlockNumber: blockData.height || '0',
          coreLatestBlock: {
            number: blockData.height || '0',
            hash: blockData.hash || '',
            timestamp: blockData.timestamp || '',
            transactions: blockData.transactions?.length || 0
          }
        },
        lastUpdate: new Date()
      });
    }
  }
  */

  /*
  private handleEvmMessage(data: any) {
    // Handle EVM RPC WebSocket messages
    if (data.method === 'eth_subscription' && data.params) {
      const blockData = data.params.result;
      console.log('New EVM block:', blockData);

      // Update store with new EVM block
      this.updateStore({
        nodeStats: {
          ...this.getCurrentStats(),
          evmBlockNumber: parseInt(blockData.number || '0x0', 16).toString(),
          evmLatestBlock: {
            number: parseInt(blockData.number || '0x0', 16).toString(),
            hash: blockData.hash || '',
            timestamp: new Date(parseInt(blockData.timestamp || '0x0', 16) * 1000).toISOString(),
            transactions: blockData.transactions?.length || 0
          }
        },
        lastUpdate: new Date()
      });
    }
  }
  */

  /*
  private getCurrentStats(): NodeStats {
    // Get current stats or return default
    return {
      coreBlockNumber: '0',
      evmBlockNumber: '0',
      miningStatus: false,
      gasPrice: { core: '0', evm: '0' },
      networkInfo: { chainId: 1029, evmChainId: 1030 }
    };
  }
  */

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.updateStore({ 
        error: 'Connection lost. Please refresh the page.',
        isConnected: false 
      });
    }
  }

  disconnect() {
    this.coreWs?.close();
    this.evmWs?.close();
    this.backendWs?.close();
    
    this.coreWs = null;
    this.evmWs = null;
    this.backendWs = null;
    
    this.updateStore({ 
      isConnected: false,
      nodeStats: null,
      lastUpdate: null 
    });
  }
}

// Create singleton instance
const wsService = new DevKitWebSocketService();

// Create Zustand store
export const useWebSocketStore = create<WebSocketState>((set, get) => {
  // Set the store updater in the service
  wsService.setStoreUpdater((update) => set(update));

  // Allow the service to access current stats
  wsService.getCurrentStats = () => get().nodeStats;

  return {
    isConnected: false,
    nodeStats: null,
    lastUpdate: null,
    error: null,

    connect: () => {
      wsService.connect();
    },

    disconnect: () => {
      wsService.disconnect();
    },

    subscribeToBlocks: () => {
      // Additional block subscription logic if needed
      console.log('Subscribing to block updates');
    },

    unsubscribeFromBlocks: () => {
      // Unsubscribe logic if needed
      console.log('Unsubscribing from block updates');
    },

    setQueryClient: (queryClient: any) => {
      wsService.setQueryClient(queryClient);
    }
  };
});