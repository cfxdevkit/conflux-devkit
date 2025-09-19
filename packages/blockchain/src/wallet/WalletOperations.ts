// Wallet-specific operations

import type {
  CoreClient,
  EvmClient,
  NetworkConfig,
  TransactionRequest,
  WalletInfo,
} from '@conflux-devkit/core';
import { createNetworkError, createWalletError } from '@conflux-devkit/core';
import { parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export class WalletOperations {
  private evmClient: EvmClient | null = null;

  constructor(evmClient?: EvmClient, _coreClient?: CoreClient) {
    this.evmClient = evmClient || null;
  }

  /**
   * Fund wallet with test tokens
   */
  async fundWallet(
    wallet: WalletInfo,
    amount: string,
    network: NetworkConfig
  ): Promise<`0x${string}`> {
    try {
      if (!this.evmClient) {
        throw createNetworkError('EVM client not initialized');
      }

      const _account = privateKeyToAccount(wallet.privateKey);
      const _value = parseEther(amount);

      // This is a simplified implementation
      // In a real scenario, you'd need to have a funded account to send from
      throw createWalletError(
        'Funding not implemented - requires funded account',
        {
          wallet: wallet.address,
          amount,
          network: network.name,
        }
      );
    } catch (error) {
      throw createWalletError('Failed to fund wallet', {
        wallet: wallet.address,
        amount,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(
    wallet: WalletInfo,
    _network: NetworkConfig
  ): Promise<bigint> {
    try {
      if (!this.evmClient) {
        throw createNetworkError('EVM client not initialized');
      }

      const balance = await this.evmClient.getBalance({
        address: wallet.address,
      });
      return balance;
    } catch (error) {
      throw createWalletError('Failed to get wallet balance', {
        wallet: wallet.address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send transaction from wallet
   */
  async sendTransaction(
    wallet: WalletInfo,
    transaction: TransactionRequest,
    _network: NetworkConfig
  ): Promise<`0x${string}`> {
    try {
      if (!this.evmClient) {
        throw createNetworkError('EVM client not initialized');
      }

      const _account = privateKeyToAccount(wallet.privateKey);

      const hash = await this.evmClient.sendTransaction({
        to: transaction.to,
        value: transaction.value || 0n,
        data: transaction.data || '0x',
        gas: transaction.gasLimit || 21000n,
        gasPrice: transaction.gasPrice || 1000000000n,
      });

      return hash;
    } catch (error) {
      throw createWalletError('Failed to send transaction', {
        wallet: wallet.address,
        transaction,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Sign message with wallet
   */
  async signMessage(
    wallet: WalletInfo,
    message: string,
    _network: NetworkConfig
  ): Promise<`0x${string}`> {
    try {
      const _account = privateKeyToAccount(wallet.privateKey);

      // This would require a wallet client implementation
      throw createWalletError('Message signing not implemented', {
        wallet: wallet.address,
        message: `${message.substring(0, 20)}...`,
      });
    } catch (error) {
      throw createWalletError('Failed to sign message', {
        wallet: wallet.address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate wallet address
   */
  validateWalletAddress(address: string): address is `0x${string}` {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate private key
   */
  validatePrivateKey(privateKey: string): privateKey is `0x${string}` {
    return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
  }

  /**
   * Set EVM client
   */
  setEvmClient(client: EvmClient): void {
    this.evmClient = client;
  }

  /**
   * Set Core client
   */
  setCoreClient(_client: CoreClient): void {
    // Core client functionality not implemented yet
  }
}
