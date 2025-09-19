// API service for communicating with DevKit Backend Core
import axios from 'axios';

// In development, use Vite proxy to backend (/api -> localhost:3001)
// In production, use full URL from environment variable
const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  : '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor to include auth header
api.interceptors.request.use((config) => {
  if (typeof localStorage !== 'undefined') {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers.Authorization = `Bearer ${sessionId}`;
    }
  }
  return config;
});

export class DevKitApiService {
  // Health check
  static async getHealth() {
    const response = await api.get('/health');
    return response.data;
  }

  // Public status
  static async getPublicStatus() {
    const response = await api.get('/status');
    return response.data;
  }

  // Authenticated DevKit status
  static async getDevKitStatus() {
    const response = await api.get('/devkit/status');
    return response.data;
  }

  // Get all accounts
  static async getAllAccounts() {
    const response = await api.get('/devkit/accounts');
    return response.data;
  }

  // Get account info
  static async getAccount(index: number) {
    const response = await api.get(`/devkit/accounts/${index}`);
    return response.data;
  }

  // Get account balance
  static async getAccountBalance(index: number) {
    const response = await api.get(`/devkit/accounts/${index}/balance`);
    return response.data;
  }

  // Deploy contract
  static async deployContract(
    contractName: string,
    args: any[] = [],
    chain: 'core' | 'evm' = 'core'
  ) {
    const response = await api.post('/devkit/deploy', {
      contractName,
      args,
      chain,
    });
    return response.data;
  }

  // Node control methods
  static async startNode() {
    const response = await api.post('/devkit/node/start');
    return response.data;
  }

  static async stopNode() {
    const response = await api.post('/devkit/node/stop');
    return response.data;
  }

  static async startMining() {
    const response = await api.post('/devkit/mining/start');
    return response.data;
  }

  static async stopMining() {
    const response = await api.post('/devkit/mining/stop');
    return response.data;
  }

  static async setMiningInterval(interval: number) {
    const response = await api.post('/devkit/mining/interval', { interval });
    return response.data;
  }

  static async mineBlocks(blocks: number = 1) {
    const response = await api.post('/devkit/mining/mine', { blocks });
    return response.data;
  }

  // Send transaction
  static async sendTransaction(transferRequest: { accountIndex: number; to: string; value: string; chain: 'core' | 'evm' }) {
    const response = await api.post('/devkit/transactions/send', transferRequest);
    return response.data;
  }

  // Sign message
  static async signMessage(signRequest: { accountIndex: number; message: string; chain: 'core' | 'evm' }) {
    const response = await api.post(`/devkit/accounts/${signRequest.accountIndex}/sign`, {
      message: signRequest.message,
      chain: signRequest.chain,
    });
    return response.data;
  }

  // Switch network
  static async switchNetwork(network: 'local' | 'testnet' | 'mainnet') {
    const response = await api.post('/devkit/network/switch', { network });
    return response.data;
  }

  // Get current network
  static async getCurrentNetwork() {
    const response = await api.get('/devkit/network/current');
    return response.data;
  }

  // Session management
  static setSession(sessionId: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sessionId', sessionId);
    }
  }

  static clearSession() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sessionId');
    }
  }
}

export { api };
