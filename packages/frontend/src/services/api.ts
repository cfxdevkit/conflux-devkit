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

  // ===== Setup API =====

  async getSetupStatus() {
    const response = await this.client.get('/setup/status');
    return response.data as {
      setupCompleted: boolean;
      status?: {
        mnemonicsCount: number;
        adminsCount: number;
        isLocked: boolean;
        isEncrypted: boolean;
        activeMnemonic?: string;
      };
      message?: string;
      setupEndpoint?: string;
      generateMnemonicEndpoint?: string;
    };
  }

  async generateSetupMnemonic() {
    const response = await this.client.post('/setup/generate-mnemonic');
    return response.data as {
      mnemonic: string;
      wordCount: number;
      warning: string;
    };
  }

  async validateSetup(data: {
    adminAddress?: string;
    mnemonic?: string;
    mnemonicLabel?: string;
    nodeConfig?: {
      accountsCount?: number;
      chainId?: number;
      evmChainId?: number;
      miningAuthor?: string;
    };
    encryption?: {
      enabled: boolean;
      password?: string;
    };
  }) {
    const response = await this.client.post('/setup/validate', data);
    return response.data as {
      valid: boolean;
      errors: string[];
      warnings?: string[];
    };
  }

  async completeSetup(data: {
    adminAddress: string;
    mnemonic: string;
    mnemonicLabel?: string;
    nodeConfig?: {
      accountsCount?: number;
      chainId?: number;
      evmChainId?: number;
      miningAuthor?: string;
    };
    encryption?: {
      enabled: boolean;
      password?: string;
    };
  }) {
    const response = await this.client.post('/setup/complete', data);
    return response.data as {
      success: boolean;
      message: string;
      setupData: {
        adminAddress: string;
        mnemonicLabel: string;
        nodeConfig: {
          accountsCount: number;
          chainId: number;
          evmChainId: number;
          miningAuthor?: string;
        };
        encryptionEnabled: boolean;
      };
    };
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
      network: data.network || 'local',
      networkConfig: data.networkConfig || {
        evmChainId: data.config?.evmChainId || 2030,
        rpcUrl: data.rpcUrls?.evm || 'http://localhost:8545',
        coreNetworkId: data.config?.chainId || 2029,
        coreRpcUrl: data.rpcUrls?.core || 'http://localhost:12537',
      },
      capabilities: data.capabilities || {
        canMine: true,
        canUseFaucet: true,
        canControlNode: true,
        canResetNode: true,
        canDeploy: true,
        canMonitor: true,
        requiresWallet: false,
      },
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
    const response = await this.client.post(
      '/devkit/node/reset',
      { clearData },
      {
        timeout: 60000, // 60 second timeout
      }
    );
    return response.data as { message: string; dataCleared: boolean; status: unknown };
  }

  async clearData() {
    // Clear blockchain data without restarting the node
    const response = await this.client.post(
      '/devkit/node/clear-data',
      {},
      {
        timeout: 30000, // 30 second timeout
      }
    );
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

  // Network management
  async switchNetwork(network: 'local' | 'testnet' | 'mainnet') {
    const response = await this.client.post('/devkit/network/switch', { network });
    return response.data;
  }

  async getCurrentNetwork() {
    const response = await this.client.get('/devkit/network/current');
    return response.data;
  }

  // ===== Configuration Management =====

  async getConfig() {
    const response = await this.client.get('/devkit/config');
    return response.data as {
      node: {
        chainId: number;
        evmChainId: number;
        jsonrpcHttpPort: number;
        jsonrpcHttpEthPort: number;
        jsonrpcWsPort?: number;
        jsonrpcWsEthPort?: number;
        logging: boolean;
      };
      rpcUrls: { core: string; evm: string };
      mining: {
        isRunning: boolean;
        interval: number;
        mode: 'auto' | 'manual';
      };
      network: string;
    };
  }

  async getConfigView() {
    const response = await this.client.get('/devkit/config/view');
    return response.data as Record<string, Record<string, any>>;
  }

  async updateConfig(updates: {
    chainId?: number;
    evmChainId?: number;
    jsonrpcHttpPort?: number;
    jsonrpcHttpEthPort?: number;
    logging?: boolean;
    miningInterval?: number;
  }) {
    const response = await this.client.post('/devkit/config/update', updates);
    return response.data as {
      success: boolean;
      updates: Record<string, any>;
      requiresRestart: boolean;
      restartRequired: string[];
      message: string;
    };
  }

  // ===== Wallet / Keystore Management =====

  async getKeystoreEntries() {
    const response = await this.client.get('/devkit/wallet/keystore');
    return response.data as {
      entries: Array<{
        index: number;
        label: string;
        type: string;
        isActive: boolean;
      }>;
      activeIndex: number;
      activeLabel: string;
    };
  }

  // Alias for compatibility with WalletSettingsEnhanced
  async listWallets() {
    const data = await this.getKeystoreEntries();
    return {
      wallets: data.entries,
      activeIndex: data.activeIndex,
      activeLabel: data.activeLabel,
    };
  }

  async getWalletDataDirs() {
    const response = await this.client.get('/devkit/wallet/data-dirs');
    return response.data as {
      activeDataDir: string;
      wallets: Array<{
        index: number;
        label: string;
        dataDir: string;
        hash: string;
      }>;
    };
  }

  async addMnemonic(options: {
    mnemonic?: string;
    label?: string;
    setActive?: boolean;
    generate?: boolean;
  }) {
    const response = await this.client.post('/devkit/wallet/keystore/add', options);
    return response.data as {
      success: boolean;
      index: number;
      label: string;
      message: string;
      mnemonic?: string;
      warning?: string;
    };
  }

  async deleteMnemonic(index: number) {
    const response = await this.client.delete(`/devkit/wallet/keystore/${index}`);
    return response.data as {
      success: boolean;
      message: string;
      activeIndex: number;
    };
  }

  async selectMnemonic(index: number) {
    const response = await this.client.post('/devkit/wallet/keystore/select', { index });
    return response.data as {
      success: boolean;
      activeIndex: number;
      activeLabel: string;
      message: string;
    };
  }

  async updateWalletLabel(index: number, label: string) {
    const response = await this.client.patch(`/devkit/wallet/keystore/${index}/label`, { label });
    return response.data;
  }

  async showMnemonic(confirmed: boolean) {
    const response = await this.client.post('/devkit/wallet/keystore/show-mnemonic', { confirmed });
    return response.data as {
      mnemonic?: string;
      label?: string;
      warning?: string;
      error?: string;
      requiresConfirmation?: boolean;
    };
  }

  async deriveAccount(network: 'core' | 'espace', index?: number, customPath?: string) {
    const params = new URLSearchParams({ network });
    if (index !== undefined) params.append('index', String(index));
    if (customPath) params.append('customPath', customPath);

    const response = await this.client.get(`/devkit/wallet/derive?${params.toString()}`);
    return response.data as {
      address: string;
      path: string;
      index: number;
      network: string;
    };
  }

  async deriveAccounts(network: 'core' | 'espace', count?: number, startIndex?: number) {
    const params = new URLSearchParams({ network });
    if (count !== undefined) params.append('count', String(count));
    if (startIndex !== undefined) params.append('startIndex', String(startIndex));

    const response = await this.client.get(`/devkit/wallet/derive/batch?${params.toString()}`);
    return response.data as {
      accounts: Array<{
        address: string;
        path: string;
        index: number;
        network: string;
      }>;
      activeWallet: string;
    };
  }

  async getPrivateKey(network: 'core' | 'espace', index: number, confirmed: boolean) {
    const response = await this.client.post('/devkit/wallet/private-key', {
      network,
      index,
      confirmed,
    });
    return response.data as {
      privateKey?: string;
      address?: string;
      path?: string;
      network?: string;
      warning?: string;
      error?: string;
      requiresConfirmation?: boolean;
    };
  }

  async generateMnemonic() {
    const response = await this.client.get('/devkit/wallet/generate-mnemonic');
    return response.data as {
      mnemonic: string;
      message: string;
      wordCount: number;
    };
  }

  async validateMnemonic(mnemonic: string) {
    const response = await this.client.post('/devkit/wallet/validate-mnemonic', { mnemonic });
    return response.data as {
      valid: boolean;
      wordCount: number;
      message: string;
    };
  }

  // Wallet status and encryption endpoints
  async getWalletStatus() {
    const response = await this.client.get('/devkit/wallet/status');
    return response.data as {
      isTestMnemonic: boolean | null;
      hasCustomMnemonic: boolean | null;
      encryptionEnabled: boolean;
      isLocked: boolean;
      adminAddress: string | null;
      walletCount: number;
      activeWallet: string;
    };
  }

  async enableEncryption(password: string) {
    const response = await this.client.post('/devkit/wallet/encryption/enable', { password });
    return response.data as {
      success: boolean;
      message: string;
    };
  }

  async unlockWallet(password: string) {
    const response = await this.client.post('/devkit/wallet/encryption/unlock', { password });
    return response.data as {
      success: boolean;
      message: string;
    };
  }

  // ===== Wallet v2 API (from /api/wallet routes) =====

  async getWalletList() {
    const response = await this.client.get('/wallet/list');
    return response.data as {
      mnemonics: Array<{
        id: string;
        label: string;
        type: 'generated' | 'imported' | 'test';
        createdAt: string;
        isActive: boolean;
        nodeConfig?: {
          accountsCount: number;
          chainId: number;
          evmChainId: number;
          miningAuthor?: string;
        };
      }>;
      count: number;
      isLocked: boolean;
      isEncrypted: boolean;
    };
  }

  async getActiveWallet() {
    const response = await this.client.get('/wallet/active');
    return response.data as {
      id: string;
      label: string;
      type: 'generated' | 'imported' | 'test';
      createdAt: string;
      nodeConfig?: {
        accountsCount: number;
        chainId: number;
        evmChainId: number;
        miningAuthor?: string;
      };
      isLocked: boolean;
    };
  }

  async switchWallet(id: string) {
    const response = await this.client.post(`/wallet/switch/${id}`);
    return response.data as {
      success: boolean;
      message: string;
      active: {
        id: string;
        label: string;
        nodeConfig: {
          accountsCount: number;
          chainId: number;
          evmChainId: number;
          miningAuthor?: string;
        };
      };
    };
  }

  async addWalletV2(data: {
    mnemonic: string;
    label: string;
    nodeConfig: {
      accountsCount: number;
      chainId?: number;
      evmChainId?: number;
      miningAuthor?: string;
    };
    setAsActive?: boolean;
  }) {
    const response = await this.client.post('/wallet/add', data);
    return response.data as {
      success: boolean;
      message: string;
      mnemonic: {
        id: string;
        label: string;
        nodeConfig: {
          accountsCount: number;
          chainId: number;
          evmChainId: number;
          miningAuthor?: string;
        };
        createdAt: string;
      };
    };
  }

  async deleteWalletV2(id: string, deleteData: boolean = false) {
    const response = await this.client.delete(`/wallet/${id}`, {
      params: { deleteData },
    });
    return response.data as {
      success: boolean;
      message: string;
    };
  }

  async getWalletAccounts(id: string) {
    const response = await this.client.get(`/wallet/${id}/accounts`);
    return response.data as {
      accounts: Array<{
        index: number;
        core: string;
        evm: string;
      }>;
      count: number;
    };
  }

  async getWalletNodeConfig(id: string) {
    const response = await this.client.get(`/wallet/${id}/config`);
    return response.data as {
      config: {
        accountsCount: number;
        chainId: number;
        evmChainId: number;
        miningAuthor?: string;
      };
      canModify: boolean;
      modificationInfo?: {
        reason: string;
        dataDir: string;
      };
    };
  }

  async updateWalletNodeConfig(
    id: string,
    updates: {
      accountsCount?: number;
      chainId?: number;
      evmChainId?: number;
      miningAuthor?: string;
    }
  ) {
    const response = await this.client.put(`/wallet/${id}/config`, updates);
    return response.data as {
      success: boolean;
      message: string;
      config: {
        accountsCount: number;
        chainId: number;
        evmChainId: number;
        miningAuthor?: string;
      };
    };
  }

  // ===== Admin Management API =====

  async getAdminList() {
    const response = await this.client.get('/admin/list');
    return response.data as {
      admins: string[];
      count: number;
      currentAdmin: string;
    };
  }

  async addAdmin(address: string) {
    const response = await this.client.post('/admin/add', { address });
    return response.data as {
      success: boolean;
      message: string;
      address: string;
    };
  }

  async removeAdmin(address: string) {
    const response = await this.client.delete(`/admin/${address}`);
    return response.data as {
      success: boolean;
      message: string;
      address: string;
    };
  }

  async checkAdmin(address: string) {
    const response = await this.client.get(`/admin/check/${address}`);
    return response.data as {
      address: string;
      isAdmin: boolean;
    };
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
