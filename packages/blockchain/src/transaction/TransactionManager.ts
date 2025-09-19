// Transaction management for blockchain operations

import type {
  CoreClient,
  EvmClient,
  NetworkConfig,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from '@conflux-devkit/core';
import { createNetworkError } from '@conflux-devkit/core';

export class TransactionManager {
  private evmClient: EvmClient | null = null;
  private coreClient: CoreClient | null = null;

  constructor(evmClient?: EvmClient, coreClient?: CoreClient) {
    this.evmClient = evmClient || null;
    this.coreClient = coreClient || null;
  }

  /**
   * Send transaction on EVM
   */
  async sendEvmTransaction(
    transaction: TransactionRequest,
    _network: NetworkConfig
  ): Promise<`0x${string}`> {
    try {
      if (!this.evmClient) {
        throw createNetworkError('EVM client not initialized');
      }

      const hash = await this.evmClient.sendTransaction({
        to: transaction.to,
        value: transaction.value || 0n,
        data: transaction.data || '0x',
        // gasLimit: transaction.gasLimit || 21000n, // Removed - not in SendTransactionParams
        gasPrice: transaction.gasPrice || 1000000000n,
      });

      return hash;
    } catch (error) {
      throw createNetworkError('Failed to send EVM transaction', {
        transaction,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send transaction on Core
   */
  async sendCoreTransaction(
    transaction: TransactionRequest,
    _network: NetworkConfig
  ): Promise<`0x${string}`> {
    try {
      if (!this.coreClient) {
        throw createNetworkError('Core client not initialized');
      }

      const hash = await this.coreClient.sendTransaction({
        from: '0x0000000000000000000000000000000000000000', // Placeholder
        to: transaction.to,
        value: transaction.value || 0n,
        data: transaction.data || '0x',
        gasPrice: transaction.gasPrice || 1000000000n,
        gasLimit: transaction.gasLimit || 21000n,
      });

      return hash;
    } catch (error) {
      throw createNetworkError('Failed to send Core transaction', {
        transaction,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Wait for transaction receipt
   */
  async waitForTransactionReceipt(
    hash: `0x${string}`,
    _network: NetworkConfig
  ): Promise<TransactionReceipt> {
    try {
      if (!this.evmClient) {
        throw createNetworkError('EVM client not initialized');
      }

      const receipt = await this.evmClient.getTransactionReceipt({ hash });
      if (!receipt) {
        throw createNetworkError('Transaction receipt not found', { hash });
      }
      return receipt;
    } catch (error) {
      throw createNetworkError('Failed to get transaction receipt', {
        hash,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    hash: `0x${string}`,
    network: NetworkConfig
  ): Promise<TransactionResponse> {
    try {
      const receipt = await this.waitForTransactionReceipt(hash, network);

      return {
        hash,
        from: receipt.from,
        to: receipt.to || '0x0000000000000000000000000000000000000000',
        value: 0n, // Would need to get from transaction
        gasUsed: receipt.gasUsed,
        status: receipt.status === 'success' ? 'success' : 'failed',
        blockNumber: receipt.blockNumber || undefined,
        confirmations: 1, // Simplified
      };
    } catch (error) {
      throw createNetworkError('Failed to get transaction status', {
        hash,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    transaction: TransactionRequest,
    _network: NetworkConfig
  ): Promise<bigint> {
    try {
      if (!this.evmClient) {
        throw createNetworkError('EVM client not initialized');
      }

      const gasEstimate = await this.evmClient.estimateGas({
        to: transaction.to,
        value: transaction.value || 0n,
        data: transaction.data || '0x',
      });

      return gasEstimate;
    } catch (error) {
      throw createNetworkError('Failed to estimate gas', {
        transaction,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice(_network: NetworkConfig): Promise<bigint> {
    try {
      if (!this.evmClient) {
        throw createNetworkError('EVM client not initialized');
      }

      const gasPrice = await this.evmClient.getGasPrice();
      return gasPrice;
    } catch (error) {
      throw createNetworkError('Failed to get gas price', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
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
  setCoreClient(client: CoreClient): void {
    this.coreClient = client;
  }
}
