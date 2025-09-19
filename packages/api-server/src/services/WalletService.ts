// Wallet service

import { WalletManager, WalletOperations } from '@conflux-devkit/blockchain';
import type { NetworkConfig, WalletInfo } from '@conflux-devkit/core';
import { createWalletError } from '@conflux-devkit/core';

export class WalletService {
  private walletManager: WalletManager;
  private walletOperations: WalletOperations;

  constructor() {
    this.walletManager = new WalletManager();
    this.walletOperations = new WalletOperations();
  }

  /**
   * Get all wallets
   */
  async getAllWallets(): Promise<WalletInfo[]> {
    try {
      return this.walletManager.getAllWallets();
    } catch (error) {
      throw createWalletError('Failed to get wallets', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get wallet by address
   */
  async getWallet(address: `0x${string}`): Promise<WalletInfo | null> {
    try {
      return this.walletManager.getWallet(address) || null;
    } catch (error) {
      throw createWalletError('Failed to get wallet', {
        address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create new wallet
   */
  async createWallet(mnemonic: string, index: number = 0): Promise<WalletInfo> {
    try {
      const network: NetworkConfig = {
        name: 'Local Development',
        rpcUrl: 'http://localhost:8545',
        chainId: 2030,
        evmChainId: 2031,
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      return await this.walletManager.generateWallet(mnemonic, index, network);
    } catch (error) {
      throw createWalletError('Failed to create wallet', {
        mnemonic: `${mnemonic.substring(0, 10)}...`,
        index,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: `0x${string}`): Promise<bigint> {
    try {
      const network: NetworkConfig = {
        name: 'Local Development',
        rpcUrl: 'http://localhost:8545',
        chainId: 2030,
        evmChainId: 2031,
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      return await this.walletOperations.getWalletBalance(
        {
          address,
          privateKey: '0x0',
          index: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        network
      );
    } catch (error) {
      throw createWalletError('Failed to get wallet balance', {
        address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Set mining wallet
   */
  async setMiningWallet(address: `0x${string}`): Promise<void> {
    try {
      this.walletManager.setMiningWallet(address);
    } catch (error) {
      throw createWalletError('Failed to set mining wallet', {
        address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
