// Wallet Orchestration Service - Manages wallet operations with state integration
// This service provides high-level wallet management using the state store

import type { BrowserWalletInfo } from '@conflux-devkit/core';
import type { StateIntegrationService } from './StateIntegrationService';
import { getStateIntegrationService } from './StateIntegrationService';

export interface WalletCreationRequest {
  mnemonic?: string;
  index?: number;
  name?: string;
  description?: string;
}

export interface WalletImportRequest {
  privateKey: string;
  name?: string;
  description?: string;
}

export interface WalletBalanceInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  currency: string;
  network: string;
  lastUpdated: string;
}

export interface WalletTransactionHistory {
  address: string;
  transactions: Array<{
    hash: string;
    type: 'send' | 'receive' | 'contract';
    amount: string;
    timestamp: string;
    status: 'pending' | 'confirmed' | 'failed';
  }>;
  totalSent: string;
  totalReceived: string;
}

export class WalletOrchestrationService {
  private stateIntegration: StateIntegrationService;

  constructor() {
    this.stateIntegration = getStateIntegrationService();
  }

  // ========================================================================
  // Wallet Discovery & Management
  // ========================================================================

  /**
   * Get all wallets with their current state
   */
  async getAllWallets(): Promise<BrowserWalletInfo[]> {
    return this.stateIntegration.getAllWalletsDataForAPI();
  }

  /**
   * Get wallet by address with full state information
   */
  async getWallet(address: string): Promise<BrowserWalletInfo | null> {
    return this.stateIntegration.getWalletDataForAPI(address);
  }

  /**
   * Get active wallet (currently selected)
   */
  async getActiveWallet(): Promise<BrowserWalletInfo | null> {
    const walletState = this.stateIntegration.getWalletState();
    // For now, return the first wallet as active
    // This should be updated when the state service provides activeWallet
    return walletState.wallets[0] || null;
  }

  /**
   * Get wallets by network
   * Note: BrowserWalletInfo doesn't include network information
   * This would need to be implemented at the state level
   */
  async getWalletsByNetwork(_networkId: string): Promise<BrowserWalletInfo[]> {
    // For now, return all wallets since network info is not available
    // This would need to be implemented in the state service
    console.warn('Network filtering not implemented - returning all wallets');
    return this.getAllWallets();
  }

  // ========================================================================
  // Wallet Creation & Import
  // ========================================================================

  /**
   * Create a new wallet
   */
  async createWallet(
    request: WalletCreationRequest
  ): Promise<BrowserWalletInfo> {
    const wallet = await this.stateIntegration.createWallet(request.mnemonic);

    // TODO: Add name and description to wallet metadata
    // This would require extending the wallet type to include metadata

    return wallet;
  }

  /**
   * Import an existing wallet
   */
  async importWallet(request: WalletImportRequest): Promise<BrowserWalletInfo> {
    const wallet = await this.stateIntegration.importWallet(request.privateKey);

    // TODO: Add name and description to wallet metadata
    // This would require extending the wallet type to include metadata

    return wallet;
  }

  /**
   * Create multiple wallets from a single mnemonic
   */
  async createWalletDerivation(
    mnemonic: string,
    count: number,
    startIndex: number = 0
  ): Promise<BrowserWalletInfo[]> {
    const wallets: BrowserWalletInfo[] = [];

    for (let i = 0; i < count; i++) {
      const wallet = await this.createWallet({
        mnemonic,
        index: startIndex + i,
      });
      wallets.push(wallet);
    }

    return wallets;
  }

  // ========================================================================
  // Wallet Selection & Management
  // ========================================================================

  /**
   * Select a wallet as active
   */
  async selectWallet(address: string): Promise<void> {
    this.stateIntegration.selectWallet(address);
  }

  /**
   * Get wallet selection history
   */
  async getWalletSelectionHistory(): Promise<{
    current: string | null;
    history: Array<{
      address: string;
      selectedAt: string;
      duration: number; // in seconds
    }>;
  }> {
    const walletState = this.stateIntegration.getWalletState();
    // TODO: Implement selection history tracking
    return {
      current: walletState.wallets[0]?.address || null,
      history: [],
    };
  }

  // ========================================================================
  // Wallet Balance Management
  // ========================================================================

  /**
   * Get wallet balance with formatting
   */
  async getWalletBalance(address: string): Promise<WalletBalanceInfo> {
    const wallet = await this.getWallet(address);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Refresh balance
    await this.stateIntegration.refreshWalletBalance(address);

    const networkState = this.stateIntegration.getNetworkState();
    const currentNetwork = networkState.current;

    return {
      address: wallet.address,
      balance: wallet.balance,
      balanceFormatted: this.formatBalance(wallet.balance),
      currency: currentNetwork?.currency?.symbol || 'CFX',
      network: currentNetwork?.name || 'Unknown',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get all wallet balances
   */
  async getAllWalletBalances(): Promise<WalletBalanceInfo[]> {
    const wallets = await this.getAllWallets();
    const balances: WalletBalanceInfo[] = [];

    for (const wallet of wallets) {
      try {
        const balance = await this.getWalletBalance(wallet.address);
        balances.push(balance);
      } catch (error) {
        console.error(
          `Failed to get balance for wallet ${wallet.address}:`,
          error
        );
      }
    }

    return balances;
  }

  /**
   * Refresh all wallet balances
   */
  async refreshAllWalletBalances(): Promise<void> {
    const wallets = await this.getAllWallets();

    for (const wallet of wallets) {
      await this.stateIntegration.refreshWalletBalance(wallet.address);
    }
  }

  // ========================================================================
  // Wallet Analysis
  // ========================================================================

  /**
   * Get wallet statistics
   */
  async getWalletStats(): Promise<{
    totalWallets: number;
    activeWallet: string | null;
    totalBalance: string;
    averageBalance: string;
    walletsByNetwork: Record<string, number>;
    balanceDistribution: Array<{
      range: string;
      count: number;
    }>;
  }> {
    const wallets = await this.getAllWallets();
    const balances = await this.getAllWalletBalances();

    const totalBalance = balances.reduce((sum, balance) => {
      return sum + BigInt(balance.balance);
    }, 0n);

    const averageBalance =
      wallets.length > 0
        ? (totalBalance / BigInt(wallets.length)).toString()
        : '0';

    // Network-based statistics not available in BrowserWalletInfo
    const walletsByNetwork: Record<string, number> = { all: wallets.length };

    // Balance distribution (simplified)
    const balanceDistribution = [
      { range: '0-1 CFX', count: 0 },
      { range: '1-10 CFX', count: 0 },
      { range: '10-100 CFX', count: 0 },
      { range: '100+ CFX', count: 0 },
    ];

    balances.forEach((balance) => {
      const balanceNum = parseFloat(balance.balanceFormatted);
      if (balanceNum < 1) balanceDistribution[0].count++;
      else if (balanceNum < 10) balanceDistribution[1].count++;
      else if (balanceNum < 100) balanceDistribution[2].count++;
      else balanceDistribution[3].count++;
    });

    const walletState = this.stateIntegration.getWalletState();

    return {
      totalWallets: wallets.length,
      activeWallet: walletState.wallets[0]?.address || null,
      totalBalance: totalBalance.toString(),
      averageBalance,
      walletsByNetwork,
      balanceDistribution,
    };
  }

  /**
   * Get wallet transaction history (mock implementation)
   */
  async getWalletTransactionHistory(
    address: string
  ): Promise<WalletTransactionHistory> {
    // TODO: Implement real transaction history tracking
    return {
      address,
      transactions: [],
      totalSent: '0',
      totalReceived: '0',
    };
  }

  // ========================================================================
  // Wallet Operations
  // ========================================================================

  /**
   * Set mining wallet
   */
  async setMiningWallet(address: string): Promise<void> {
    // TODO: Implement mining wallet setting
    // This would require integration with the node service
    console.log(`Setting mining wallet to ${address}`);
  }

  /**
   * Get mining wallet
   */
  async getMiningWallet(): Promise<string | null> {
    // TODO: Implement mining wallet retrieval
    // This would require integration with the node service
    return null;
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Format balance for display
   */
  private formatBalance(balance: string): string {
    const balanceNum = parseFloat(balance);
    if (balanceNum === 0) return '0.000000';
    if (balanceNum < 0.000001) return '< 0.000001';
    return balanceNum.toFixed(6);
  }

  /**
   * Validate wallet address
   */
  validateWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get wallet address checksum
   */
  getWalletAddressChecksum(address: string): string {
    // TODO: Implement proper checksum validation
    return address;
  }
}
