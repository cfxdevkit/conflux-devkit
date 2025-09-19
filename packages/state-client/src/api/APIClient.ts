// ============================================================================
// API Client for Conflux DevKit Backend Services
// ============================================================================

import type {
  APIConfig,
  APIResponse,
  ConnectionResponse,
  NodeResponse,
  WalletResponse,
  WalletsResponse,
  ContractResponse,
  ContractsResponse,
  NetworkResponse,
  NetworksResponse,
  ClientWalletInfo,
  ClientContractOrchestrator,
  ClientNetworkConfig,
  ClientNodeStatus,
} from '../types';

export class APIClient {
  private config: Required<APIConfig>;
  private abortController: AbortController | null = null;

  constructor(config: APIConfig) {
    this.config = {
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      websocket: {
        url: config.websocket?.url ?? config.baseURL.replace('http', 'ws'),
        reconnectInterval: config.websocket?.reconnectInterval ?? 5000,
        maxReconnectAttempts: config.websocket?.maxReconnectAttempts ?? 10,
      },
    };
  }

  // ========================================================================
  // HTTP Client Methods
  // ========================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.config.headers,
        'X-Request-ID': requestId,
        ...options.headers,
      },
      signal: this.abortController?.signal,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          ...data,
          requestId,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.retries) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================================================================
  // Connection Endpoints
  // ========================================================================

  async connect(
    config?: Partial<ClientNetworkConfig>
  ): Promise<ConnectionResponse> {
    const response = await this.request<ConnectionResponse>('/api/connect', {
      method: 'POST',
      body: JSON.stringify(config),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to connect');
    }

    return response.data;
  }

  async disconnect(): Promise<void> {
    await this.request('/api/disconnect', {
      method: 'POST',
    });
  }

  // ========================================================================
  // Node Endpoints
  // ========================================================================

  async getNodeStatus(): Promise<ClientNodeStatus | null> {
    const response = await this.request<NodeResponse>('/api/node/status');

    if (!response.success) {
      throw new Error(response.error || 'Failed to get node status');
    }

    return response.data?.status || null;
  }

  async startNode(config?: Partial<ClientNetworkConfig>): Promise<void> {
    const response = await this.request('/api/node/start', {
      method: 'POST',
      body: JSON.stringify(config),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to start node');
    }
  }

  async stopNode(): Promise<void> {
    const response = await this.request('/api/node/stop', {
      method: 'POST',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to stop node');
    }
  }

  async restartNode(config?: Partial<ClientNetworkConfig>): Promise<void> {
    const response = await this.request('/api/node/restart', {
      method: 'POST',
      body: JSON.stringify(config),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to restart node');
    }
  }

  // ========================================================================
  // Wallet Endpoints
  // ========================================================================

  async getWallets(): Promise<ClientWalletInfo[]> {
    const response = await this.request<WalletsResponse>('/api/wallets');

    if (!response.success) {
      throw new Error(response.error || 'Failed to get wallets');
    }

    return response.data?.wallets || [];
  }

  async createWallet(mnemonic?: string): Promise<ClientWalletInfo> {
    const response = await this.request<WalletResponse>('/api/wallets', {
      method: 'POST',
      body: JSON.stringify({ mnemonic }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create wallet');
    }

    return response.data.wallet;
  }

  async importWallet(privateKey: string): Promise<ClientWalletInfo> {
    const response = await this.request<WalletResponse>('/api/wallets/import', {
      method: 'POST',
      body: JSON.stringify({ privateKey }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to import wallet');
    }

    return response.data.wallet;
  }

  async selectWallet(address: string): Promise<void> {
    const response = await this.request(`/api/wallets/${address}/select`, {
      method: 'PUT',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to select wallet');
    }
  }

  async getWalletBalance(address: string): Promise<string> {
    const response = await this.request<{ balance: string }>(
      `/api/wallets/${address}/balance`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get wallet balance');
    }

    return response.data?.balance || '0';
  }

  async removeWallet(address: string): Promise<void> {
    const response = await this.request(`/api/wallets/${address}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to remove wallet');
    }
  }

  // ========================================================================
  // Contract Endpoints
  // ========================================================================

  async getContracts(): Promise<ClientContractOrchestrator[]> {
    const response = await this.request<ContractsResponse>('/api/contracts');

    if (!response.success) {
      throw new Error(response.error || 'Failed to get contracts');
    }

    return response.data?.contracts || [];
  }

  async deployContract(
    name: string,
    bytecode: string,
    abi: any[],
    args: unknown[]
  ): Promise<ClientContractOrchestrator> {
    const response = await this.request<ContractResponse>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify({
        name,
        bytecode,
        abi,
        args,
      }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to deploy contract');
    }

    return response.data.contract;
  }

  async selectContract(address: string): Promise<void> {
    const response = await this.request(`/api/contracts/${address}/select`, {
      method: 'PUT',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to select contract');
    }
  }

  async callContract(
    address: string,
    method: string,
    args: unknown[]
  ): Promise<unknown> {
    const response = await this.request<{ result: unknown }>(
      `/api/contracts/${address}/call`,
      {
        method: 'POST',
        body: JSON.stringify({
          method,
          args,
        }),
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to call contract');
    }

    return response.data?.result;
  }

  async removeContract(address: string): Promise<void> {
    const response = await this.request(`/api/contracts/${address}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to remove contract');
    }
  }

  // ========================================================================
  // Network Endpoints
  // ========================================================================

  async getAvailableNetworks(): Promise<ClientNetworkConfig[]> {
    const response = await this.request<NetworksResponse>('/api/networks');

    if (!response.success) {
      throw new Error(response.error || 'Failed to get networks');
    }

    return response.data?.networks || [];
  }

  async switchNetwork(networkId: string): Promise<void> {
    const response = await this.request('/api/networks/switch', {
      method: 'POST',
      body: JSON.stringify({ networkId }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to switch network');
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  setConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): Required<APIConfig> {
    return { ...this.config };
  }

  cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
  }

  destroy(): void {
    this.cancelRequests();
  }
}
