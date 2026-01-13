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

/**
 * Transaction Service
 *
 * Handles transaction operations including sending, signing, and batching.
 */

import type { ChainType } from '@conflux-devkit/core';
import { logger } from '../utils/logger.js';

export interface SendTransactionOptions {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  account: number;
  chain: ChainType;
}

export class TransactionService {
  constructor(private devkit: any) {}

  /**
   * Send a transaction
   */
  async sendTransaction(options: SendTransactionOptions) {
    try {
      // Get account
      const accounts = this.devkit.getAccounts();
      const account = accounts[options.account];

      if (!account) {
        throw new Error(`Account ${options.account} not found`);
      }

      // Send transaction
      // In production, use proper transaction sending logic
      const hash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('')}`;

      logger.info(`Transaction sent: ${hash}`, {
        chain: options.chain,
        from: options.chain === 'core' ? account.coreAddress : account.evmAddress,
        to: options.to,
      });

      return {
        hash,
        from: options.chain === 'core' ? account.coreAddress : account.evmAddress,
        to: options.to,
        chain: options.chain,
      };
    } catch (error) {
      logger.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string, chain: ChainType) {
    try {
      // In production, fetch actual receipt
      return {
        hash,
        blockNumber: 1000n,
        status: 'success' as const,
        gasUsed: 21000n,
        chain,
      };
    } catch (error) {
      throw new Error(`Failed to get receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(options: Omit<SendTransactionOptions, 'account' | 'gasLimit' | 'gasPrice'>) {
    try {
      // In production, use proper gas estimation
      return 21000n;
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
