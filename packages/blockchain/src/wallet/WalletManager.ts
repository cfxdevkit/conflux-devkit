// Wallet management for blockchain operations

import type { NetworkConfig, WalletInfo } from '@conflux-devkit/core';
import { createWalletError } from '@conflux-devkit/core';
import { BIP32Factory } from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import * as ecc from 'tiny-secp256k1';
import { formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { networkManager } from '../network';

// Create BIP32 instance - can be mocked in tests
export const createBip32 = () => BIP32Factory(ecc);

export class WalletManager {
  private wallets: Map<string, WalletInfo> = new Map();

  /**
   * Create wallet manager with specific network
   */
  static createForNetwork(networkId: string): WalletManager {
    const network = networkManager.getNetwork(networkId);
    if (!network) {
      throw new Error(`Network not found: ${networkId}`);
    }
    return new WalletManager();
  }

  /**
   * Create wallet manager for local development
   */
  static createLocal(): WalletManager {
    return new WalletManager();
  }

  /**
   * Create wallet manager for testnet
   */
  static createTestnet(): WalletManager {
    return new WalletManager();
  }

  /**
   * Create wallet manager for mainnet
   */
  static createMainnet(): WalletManager {
    return new WalletManager();
  }

  /**
   * Generate a new wallet from mnemonic
   */
  async generateWallet(
    mnemonic: string,
    index: number = 0,
    _network: NetworkConfig
  ): Promise<WalletInfo> {
    try {
      // Validate mnemonic
      if (!this.isValidMnemonic(mnemonic)) {
        throw createWalletError('Invalid mnemonic phrase', { mnemonic });
      }

      // Generate seed from mnemonic
      const seed = mnemonicToSeedSync(mnemonic);
      const bip32 = createBip32();
      const root = bip32.fromSeed(seed);

      // Derive wallet at index
      const child = root.derivePath(`m/44'/60'/0'/0/${index}`);

      if (!child.privateKey) {
        throw createWalletError('Failed to derive private key', { index });
      }

      const privateKey =
        `0x${child.privateKey.toString('hex')}` as `0x${string}`;
      const account = privateKeyToAccount(privateKey);
      const address = account.address;

      const wallet: WalletInfo = {
        index,
        address,
        privateKey,
        mnemonic,
        balance: 0n, // Initialize with zero balance
        balanceFormatted: '0.0 CFX',
        isMining: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.wallets.set(address, wallet);
      return wallet;
    } catch (error) {
      throw createWalletError('Failed to generate wallet', {
        mnemonic: `${mnemonic.substring(0, 10)}...`,
        index,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate multiple wallets from mnemonic
   */
  async generateWallets(
    mnemonic: string,
    count: number,
    network: NetworkConfig
  ): Promise<WalletInfo[]> {
    const wallets: WalletInfo[] = [];

    for (let i = 0; i < count; i++) {
      const wallet = await this.generateWallet(mnemonic, i, network);
      wallets.push(wallet);
    }

    return wallets;
  }

  /**
   * Create wallet from private key
   */
  async createWalletFromPrivateKey(
    privateKey: `0x${string}`,
    index: number = 0
  ): Promise<WalletInfo> {
    try {
      const account = privateKeyToAccount(privateKey);
      const address = account.address;

      const wallet: WalletInfo = {
        index,
        address,
        privateKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.wallets.set(address, wallet);
      return wallet;
    } catch (error) {
      throw createWalletError('Failed to create wallet from private key', {
        privateKey: `${privateKey.substring(0, 10)}...`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get wallet by address
   */
  getWallet(address: `0x${string}`): WalletInfo | undefined {
    return this.wallets.get(address);
  }

  /**
   * Get all wallets
   */
  getAllWallets(): WalletInfo[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Remove wallet
   */
  removeWallet(address: `0x${string}`): boolean {
    return this.wallets.delete(address);
  }

  /**
   * Clear all wallets
   */
  clearWallets(): void {
    this.wallets.clear();
  }

  /**
   * Get wallet count
   */
  getWalletCount(): number {
    return this.wallets.size;
  }

  /**
   * Update wallet balance
   */
  async updateWalletBalance(
    address: `0x${string}`,
    balance: bigint,
    _network: NetworkConfig
  ): Promise<void> {
    const wallet = this.wallets.get(address);
    if (!wallet) {
      throw createWalletError('Wallet not found', { address });
    }

    wallet.balance = balance;
    wallet.balanceFormatted = formatEther(balance);
    wallet.updatedAt = new Date();

    this.wallets.set(address, wallet);
  }

  /**
   * Set mining wallet
   */
  setMiningWallet(address: `0x${string}`): void {
    // Clear previous mining wallet
    for (const wallet of this.wallets.values()) {
      wallet.isMining = false;
    }

    // Set new mining wallet
    const wallet = this.wallets.get(address);
    if (wallet) {
      wallet.isMining = true;
      this.wallets.set(address, wallet);
    }
  }

  /**
   * Get mining wallet
   */
  getMiningWallet(): WalletInfo | undefined {
    return Array.from(this.wallets.values()).find((wallet) => wallet.isMining);
  }

  /**
   * List all wallets
   */
  listWallets(): WalletInfo[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Get balance for a specific address
   */
  async getBalance(address: string): Promise<string> {
    const wallet = this.wallets.get(address);
    if (wallet) {
      return wallet.balanceFormatted || '0.0 CFX';
    }
    // Return default balance if wallet not found
    return '0.0 CFX';
  }

  /**
   * Validate mnemonic phrase
   */
  private isValidMnemonic(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/);
    return [12, 15, 18, 21, 24].includes(words.length);
  }
}
