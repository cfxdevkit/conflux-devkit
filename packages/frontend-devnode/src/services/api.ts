/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import axios, { type AxiosInstance } from 'axios';
import type { NodeConfig } from '@/types/devnode';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type StartNodeConfig = Partial<NodeConfig> & {
  persistence?: boolean;
  configChanged?: boolean;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth sessionId interceptor
    this.client.interceptors.request.use((config) => {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        config.headers.Authorization = `Bearer ${sessionId}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url: string | undefined = error.config?.url;

        if (status === 401) {
          const isAuthEndpoint = url?.includes('/auth/challenge') || url?.includes('/auth/verify');
          // For auth endpoints, just surface the error without tearing down wallet state
          if (!isAuthEndpoint) {
            localStorage.removeItem('sessionId');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:session-expired'));
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ===== Authentication =====

  async createChallenge(address: string) {
    const response = await this.client.post('/auth/challenge', { address });
    return response.data as { message: string; nonce: string };
  }

  async verifySignature(address: string, signature: string) {
    const response = await this.client.post('/auth/verify', {
      address,
      signature,
    });
    return response.data as { sessionId: string; address: string; isAdmin: boolean };
  }

  // Auth endpoints - get development session
  async getDevelopmentSession() {
    const response = await this.client.get('/dev/session');
    return response.data;
  }

  // DevKit endpoints (matching backend routes at /api/devkit/*)
  async getDevKitStatus() {
    const response = await this.client.get('/devkit/status');
    const data = response.data;

    // Log the response for debugging
    console.log('Backend status response:', data);

    // Transform backend response to match frontend types
    return {
      isRunning: data.running || false,
      coreSpace: {
        chainId: data.chains?.core?.chainId || data.config?.chainId || 0,
        rpcUrl: data.rpcUrls?.core || '',
        blockNumber: data.chains?.core?.blockNumber || 0,
        gasPrice: data.chains?.core?.gasPrice || '0',
      },
      eSpace: {
        chainId: data.chains?.evm?.chainId || data.config?.evmChainId || 0,
        rpcUrl: data.rpcUrls?.evm || '',
        blockNumber: data.chains?.evm?.blockNumber || 0,
        gasPrice: data.chains?.evm?.gasPrice || '0',
      },
      miningMode: (data.mining?.isRunning ? 'auto' : 'manual') as 'auto' | 'manual',
      miningInterval: data.mining?.interval,
      config: data.config,
      accounts: [],
    };
  }

  async startNode(config?: StartNodeConfig) {
    // Node startup can take 30+ seconds, use longer timeout
    const response = await this.client.post('/devkit/node/start', config, {
      timeout: 60000, // 60 second timeout for node startup
    });
    return response.data;
  }

  async stopNode() {
    const response = await this.client.post('/devkit/node/stop');
    return response.data;
  }

  async restartNode() {
    // Backend doesn't have restart endpoint, so stop then start
    await this.stopNode();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await this.startNode();
  }

  async resetNode(clearData: boolean = false) {
    // Node reset can take time, especially if clearing data
    const response = await this.client.post('/devkit/node/reset', { clearData }, {
      timeout: 60000, // 60 second timeout
    });
    return response.data as { message: string; dataCleared: boolean; status: unknown };
  }

  async clearData() {
    // Clear blockchain data without restarting the node
    const response = await this.client.post('/devkit/node/clear-data', {}, {
      timeout: 30000, // 30 second timeout
    });
    return response.data as { message: string };
  }

  /**
   * Mine blocks using the test client
   * @param blocks Number of blocks to mine
   * @param numTxs If provided, mine blocks that pack transactions from txpool
   */
  async mineBlocks(blocks: number = 1, numTxs?: number) {
    const response = await this.client.post('/devkit/mining/mine', { blocks, numTxs });
    return response.data;
  }

  /**
   * Start auto-mining with optional interval
   * @param interval Mining interval in milliseconds (default 500ms)
   */
  async startAutoMine(interval?: number) {
    const response = await this.client.post('/devkit/mining/start', { interval });
    return response.data;
  }

  /**
   * Stop auto-mining
   */
  async stopAutoMine() {
    const response = await this.client.post('/devkit/mining/stop');
    return response.data;
  }

  /**
   * Set auto-mining interval
   * @param interval Mining interval in milliseconds (minimum 100ms)
   */
  async setMiningInterval(interval: number) {
    const response = await this.client.post('/devkit/mining/interval', { interval });
    return response.data;
  }

  async getAccounts() {
    const response = await this.client.get('/devkit/accounts');
    // Backend returns { accounts: [...], total: N, faucetAccount: {...} }
    return {
      accounts: response.data.accounts || [],
      faucetAccount: response.data.faucetAccount || null,
    };
  }

  async getAccountBalance(index: number) {
    const response = await this.client.get(`/devkit/accounts/${index}/balance`);
    return response.data as {
      balances: { core: string; evm: string };
      error?: string;
    };
  }

  async getBalanceByAddress(address: string) {
    const response = await this.client.get(`/devkit/balance/address/${address}`);
    return response.data as {
      balances: { core: string; evm: string };
      error?: string;
    };
  }

  async getBalance(address: string, chain: 'core' | 'eSpace') {
    const response = await this.client.get(`/devkit/accounts/balance/${address}`, {
      params: { chain },
    });
    return response.data;
  }

  async getNodeInfo() {
    const response = await this.client.get('/devkit/node/info');
    return response.data;
  }

  async requestFaucet(address: string, amount: string, chain?: 'core' | 'eSpace' | 'auto') {
    const response = await this.client.post('/devkit/faucet', {
      address,
      amount,
      chain: chain || 'auto',
    });
    return response.data;
  }

  // Generic request method for extensibility
  async request(method: string, url: string, data?: unknown) {
    const response = await this.client.request({
      method,
      url,
      data,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
