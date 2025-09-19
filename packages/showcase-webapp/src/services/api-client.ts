import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface WorkspaceStatus {
  apiServer: 'healthy' | 'degraded' | 'unhealthy';
  stateServer: 'healthy' | 'degraded' | 'unhealthy';
  websocket: 'healthy' | 'degraded' | 'unhealthy';
  database: 'healthy' | 'degraded' | 'unhealthy';
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
}

export interface NodeStatus {
  isRunning: boolean;
  uptime: number;
  blockHeight: number;
  peerCount: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: Date;
}

export interface NodeConfig {
  name: string;
  chainId: number;
  networkId: number;
  port: number;
  rpcPort: number;
  miningEnabled: boolean;
  [key: string]: any;
}

export interface Wallet {
  address: string;
  balance: string;
  type: 'evm' | 'core';
  isActive: boolean;
}

export interface ContractInfo {
  address: string;
  name: string;
  abi: any[];
  bytecode?: string;
  deployedAt?: Date;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for consistent error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => response,
      (error) => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  // Health & System endpoints
  async getHealthStatus(): Promise<WorkspaceStatus> {
    try {
      const response = await this.client.get<ApiResponse<any>>('/api/health/detailed');
      const healthData = response.data.data;

      return {
        apiServer: 'healthy', // API is responding
        stateServer: healthData.services?.blockchain === 'healthy' ? 'healthy' : 'degraded',
        websocket: healthData.services?.node === 'healthy' ? 'healthy' : 'degraded',
        database: healthData.services?.database === 'healthy' ? 'healthy' : 'degraded',
        overallStatus: healthData.status === 'healthy' ? 'healthy' : 'degraded',
        lastCheck: new Date()
      };
    } catch (error) {
      // Fallback to degraded status if API is unreachable
      return {
        apiServer: 'unhealthy',
        stateServer: 'unhealthy',
        websocket: 'unhealthy',
        database: 'unhealthy',
        overallStatus: 'unhealthy',
        lastCheck: new Date()
      };
    }
  }

  // Node Management
  async getNodeStatus(): Promise<NodeStatus> {
    try {
      const response = await this.client.get<ApiResponse<any>>('/api/node/status');
      const nodeData = response.data.data;

      return {
        isRunning: nodeData.running || false,
        uptime: nodeData.uptime || 0,
        blockHeight: nodeData.blockHeight || 0,
        peerCount: nodeData.peerCount || 0,
        health: nodeData.running ? 'healthy' : 'unhealthy',
        lastHealthCheck: new Date()
      };
    } catch (error) {
      return {
        isRunning: false,
        uptime: 0,
        blockHeight: 0,
        peerCount: 0,
        health: 'unhealthy',
        lastHealthCheck: new Date()
      };
    }
  }

  async startNode(config?: Partial<NodeConfig>): Promise<void> {
    await this.client.post('/api/node/start', { config });
  }

  async stopNode(): Promise<void> {
    await this.client.post('/api/node/stop');
  }

  async restartNode(config?: Partial<NodeConfig>): Promise<void> {
    await this.client.post('/api/node/restart', { config });
  }

  async getNodeConfig(): Promise<NodeConfig> {
    const response = await this.client.get<ApiResponse<NodeConfig>>('/api/node/config');
    return response.data.data;
  }

  async updateNodeConfig(config: Partial<NodeConfig>): Promise<void> {
    await this.client.put('/api/node/config', { config });
  }

  // Wallet Management
  async getAllWallets(): Promise<Wallet[]> {
    try {
      const response = await this.client.get<ApiResponse<Wallet[]>>('/api/wallet');
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  async getWallet(address: string): Promise<Wallet | null> {
    try {
      const response = await this.client.get<ApiResponse<Wallet>>(`/api/wallet/${address}`);
      return response.data.data;
    } catch (error) {
      return null;
    }
  }

  async createWallet(mnemonic?: string, index: number = 0): Promise<Wallet> {
    const response = await this.client.post<ApiResponse<Wallet>>('/api/wallet', {
      mnemonic,
      index
    });
    return response.data.data;
  }

  async getWalletBalance(address: string): Promise<string> {
    try {
      const response = await this.client.get<ApiResponse<{ balance: string }>>(`/api/wallet/${address}/balance`);
      return response.data.data.balance;
    } catch (error) {
      return '0';
    }
  }

  async setMiningWallet(address: string): Promise<void> {
    await this.client.post(`/api/wallet/${address}/mining`);
  }

  // Contract Management
  async getAllContracts(): Promise<ContractInfo[]> {
    try {
      const response = await this.client.get<ApiResponse<ContractInfo[]>>('/api/contract');
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  async getContract(address: string): Promise<ContractInfo | null> {
    try {
      const response = await this.client.get<ApiResponse<ContractInfo>>(`/api/contract/${address}`);
      return response.data.data;
    } catch (error) {
      return null;
    }
  }

  async deployContract(contractData: {
    name: string;
    bytecode: string;
    abi: any[];
    constructorArgs?: any[];
    gasLimit?: string;
    gasPrice?: string;
  }): Promise<ContractInfo> {
    const response = await this.client.post<ApiResponse<ContractInfo>>('/api/contract/deploy', contractData);
    return response.data.data;
  }

  async callContractMethod(address: string, method: string, args: any[] = [], options: {
    gasLimit?: string;
    gasPrice?: string;
    value?: string;
  } = {}): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/api/contract/${address}/call`, {
      method,
      args,
      ...options
    });
    return response.data.data;
  }

  // Transaction Management
  async getTransactionHistory(address?: string, limit: number = 50): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (address) params.append('address', address);
      params.append('limit', limit.toString());

      const response = await this.client.get<ApiResponse<any[]>>(`/api/transaction?${params}`);
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  async getTransaction(txHash: string): Promise<any | null> {
    try {
      const response = await this.client.get<ApiResponse<any>>(`/api/transaction/${txHash}`);
      return response.data.data;
    } catch (error) {
      return null;
    }
  }

  async sendTransaction(transactionData: {
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
  }): Promise<{ txHash: string }> {
    const response = await this.client.post<ApiResponse<{ txHash: string }>>('/api/transaction/send', transactionData);
    return response.data.data;
  }

  // Connection status
  async checkConnection(): Promise<boolean> {
    try {
      await this.client.get('/api/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get base URL for WebSocket connections
  getWebSocketURL(): string {
    return this.baseURL.replace(/^http/, 'ws');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };