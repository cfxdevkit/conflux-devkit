// Transaction service

import { TransactionManager } from '@conflux-devkit/blockchain';
import type {
  NetworkConfig,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from '@conflux-devkit/core';
import { createNetworkError } from '@conflux-devkit/core';

export class TransactionService {
  private transactionManager: TransactionManager;

  constructor() {
    this.transactionManager = new TransactionManager();
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    transaction: TransactionRequest
  ): Promise<`0x${string}`> {
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

      return await this.transactionManager.sendEvmTransaction(
        transaction,
        network
      );
    } catch (error) {
      throw createNetworkError('Failed to send transaction', {
        transaction,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    hash: `0x${string}`
  ): Promise<TransactionResponse> {
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

      return await this.transactionManager.getTransactionStatus(hash, network);
    } catch (error) {
      throw createNetworkError('Failed to get transaction status', {
        hash,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Wait for transaction receipt
   */
  async waitForTransactionReceipt(
    hash: `0x${string}`
  ): Promise<TransactionReceipt> {
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

      return await this.transactionManager.waitForTransactionReceipt(
        hash,
        network
      );
    } catch (error) {
      throw createNetworkError('Failed to get transaction receipt', {
        hash,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Estimate gas
   */
  async estimateGas(transaction: TransactionRequest): Promise<bigint> {
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

      return await this.transactionManager.estimateGas(transaction, network);
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
  async getGasPrice(): Promise<bigint> {
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

      return await this.transactionManager.getGasPrice(network);
    } catch (error) {
      throw createNetworkError('Failed to get gas price', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
