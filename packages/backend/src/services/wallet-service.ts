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
 * Wallet Service
 *
 * Handles wallet/account operations including balance queries, account management,
 * and integration with @conflux-devkit/wallet for advanced features.
 */

import type { ChainType } from '@conflux-devkit/core';
import { logger } from '../utils/logger.js';

export interface AccountInfo {
  index: number;
  coreAddress: string;
  evmAddress: string;
  coreBalance?: string;
  evmBalance?: string;
}

export class WalletService {
  constructor(private devkit: any) {}

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<AccountInfo[]> {
    try {
      const accounts = this.devkit.getAccounts();

      // Fetch balances for each account
      const accountsWithBalances = await Promise.all(
        accounts.map(async (account: any) => {
          try {
            const [coreBalance, evmBalance] = await Promise.all([
              this.getBalance(account.coreAddress, 'core'),
              this.getBalance(account.evmAddress, 'evm'),
            ]);

            return {
              index: account.index,
              coreAddress: account.coreAddress,
              evmAddress: account.evmAddress,
              coreBalance,
              evmBalance,
            };
          } catch (error) {
            logger.warn(`Failed to fetch balances for account ${account.index}:`, error);
            return {
              index: account.index,
              coreAddress: account.coreAddress,
              evmAddress: account.evmAddress,
              coreBalance: '0',
              evmBalance: '0',
            };
          }
        })
      );

      return accountsWithBalances;
    } catch (error) {
      logger.error('Failed to get accounts:', error);
      throw new Error(`Failed to get accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get single account by index
   */
  async getAccount(index: number): Promise<AccountInfo> {
    try {
      const accounts = this.devkit.getAccounts();
      const account = accounts[index];

      if (!account) {
        throw new Error(`Account ${index} not found`);
      }

      const [coreBalance, evmBalance] = await Promise.all([
        this.getBalance(account.coreAddress, 'core'),
        this.getBalance(account.evmAddress, 'evm'),
      ]);

      return {
        index: account.index,
        coreAddress: account.coreAddress,
        evmAddress: account.evmAddress,
        coreBalance,
        evmBalance,
      };
    } catch (error) {
      throw new Error(`Failed to get account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get balance for an address
   */
  async getBalance(address: string, chain: ChainType): Promise<string> {
    try {
      // In production, use proper balance fetching
      // For now, return mock balance
      return '1000000000000000000'; // 1 token
    } catch (error) {
      logger.warn(`Failed to get balance for ${address} on ${chain}:`, error);
      return '0';
    }
  }

  /**
   * Fund account (only available in dev mode with local node)
   */
  async fundAccount(address: string, amount: string, chain: ChainType) {
    try {
      // Check if we have a local node
      if (typeof this.devkit.fundAccount !== 'function') {
        throw new Error('Fund account is only available with local development node');
      }

      await this.devkit.fundAccount(address, amount, chain);

      logger.info(`Funded account ${address} with ${amount} on ${chain}`);

      return {
        success: true,
        address,
        amount,
        chain,
      };
    } catch (error) {
      throw new Error(`Failed to fund account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
