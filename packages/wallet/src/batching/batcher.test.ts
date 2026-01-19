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

import { beforeEach, describe, expect, it } from 'vitest';
import { TransactionBatcher } from './batcher.js';

describe('TransactionBatcher', () => {
  let batcher: TransactionBatcher;

  beforeEach(() => {
    batcher = new TransactionBatcher({
      maxBatchSize: 10,
      autoExecuteTimeout: 0, // Disable auto-execute for tests
    });
  });

  describe('addTransaction', () => {
    it('should add transaction to correct batch', () => {
      const txId = batcher.addTransaction({
        to: '0xRecipient',
        value: 1000n,
        chain: 'evm',
      });

      expect(txId).toMatch(/^tx_/);

      const pending = batcher.getPendingTransactions('evm');
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(txId);
    });

    it('should separate core and evm transactions', () => {
      const coreId = batcher.addTransaction({
        to: 'cfx:recipient',
        chain: 'core',
      });

      const evmId = batcher.addTransaction({
        to: '0xRecipient',
        chain: 'evm',
      });

      const corePending = batcher.getPendingTransactions('core');
      const evmPending = batcher.getPendingTransactions('evm');

      expect(corePending).toHaveLength(1);
      expect(evmPending).toHaveLength(1);
      expect(corePending[0].id).toBe(coreId);
      expect(evmPending[0].id).toBe(evmId);
    });

    it('should include timestamp', () => {
      const before = new Date();
      batcher.addTransaction({
        to: '0xRecipient',
        chain: 'evm',
      });
      const after = new Date();

      const pending = batcher.getPendingTransactions('evm');
      const timestamp = pending[0].addedAt;

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('removeTransaction', () => {
    it('should remove transaction from batch', () => {
      const txId = batcher.addTransaction({
        to: '0xRecipient',
        chain: 'evm',
      });

      const removed = batcher.removeTransaction(txId, 'evm');

      expect(removed).toBe(true);
      expect(batcher.getPendingTransactions('evm')).toHaveLength(0);
    });

    it('should return false for non-existent transaction', () => {
      const removed = batcher.removeTransaction('non-existent', 'evm');

      expect(removed).toBe(false);
    });
  });

  describe('getPendingTransactions', () => {
    it('should return copy of pending transactions', () => {
      batcher.addTransaction({ to: '0xRecipient1', chain: 'evm' });
      batcher.addTransaction({ to: '0xRecipient2', chain: 'evm' });

      const pending = batcher.getPendingTransactions('evm');

      expect(pending).toHaveLength(2);
      // Verify it's a copy by mutating it
      pending.pop();
      expect(batcher.getPendingTransactions('evm')).toHaveLength(2);
    });
  });

  describe('getBatchStats', () => {
    it('should calculate batch statistics', () => {
      batcher.addTransaction({
        to: '0xRecipient1',
        value: 1000n,
        gasLimit: 21000n,
        chain: 'evm',
      });

      batcher.addTransaction({
        to: '0xRecipient2',
        value: 2000n,
        gasLimit: 30000n,
        chain: 'evm',
      });

      const stats = batcher.getBatchStats('evm');

      expect(stats.count).toBe(2);
      expect(stats.totalValue).toBe(3000n);
      expect(stats.avgGasLimit).toBe(25500n);
      expect(stats.oldestTransaction).toBeDefined();
    });

    it('should return zero average for empty batch', () => {
      const stats = batcher.getBatchStats('evm');

      expect(stats.count).toBe(0);
      expect(stats.totalValue).toBe(0n);
      expect(stats.avgGasLimit).toBe(0n);
    });
  });

  describe('executeBatch', () => {
    it('should execute all transactions in batch', async () => {
      batcher.addTransaction({ to: '0xRecipient1', chain: 'evm' });
      batcher.addTransaction({ to: '0xRecipient2', chain: 'evm' });

      const result = await batcher.executeBatch('evm');

      expect(result.batchId).toMatch(/^batch_/);
      expect(result.transactionHashes).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.chain).toBe('evm');
    });

    it('should clear batch after execution', async () => {
      batcher.addTransaction({ to: '0xRecipient', chain: 'evm' });

      await batcher.executeBatch('evm');

      expect(batcher.getPendingTransactions('evm')).toHaveLength(0);
    });

    it('should throw error for empty batch', async () => {
      await expect(batcher.executeBatch('evm')).rejects.toThrow(
        'No transactions'
      );
    });

    it('should use custom signer if provided', async () => {
      batcher.addTransaction({ to: '0xRecipient', chain: 'evm' });

      const customHashes: string[] = [];
      const customSigner = async () => {
        const hash = '0xcustom';
        customHashes.push(hash);
        return hash;
      };

      const result = await batcher.executeBatch('evm', customSigner);

      expect(result.transactionHashes).toEqual(customHashes);
    });
  });

  describe('clearBatch', () => {
    it('should clear specific chain batch', () => {
      batcher.addTransaction({ to: '0xRecipient1', chain: 'evm' });
      batcher.addTransaction({ to: 'cfx:recipient1', chain: 'core' });

      batcher.clearBatch('evm');

      expect(batcher.getPendingTransactions('evm')).toHaveLength(0);
      expect(batcher.getPendingTransactions('core')).toHaveLength(1);
    });

    it('should clear all batches if no chain specified', () => {
      batcher.addTransaction({ to: '0xRecipient1', chain: 'evm' });
      batcher.addTransaction({ to: 'cfx:recipient1', chain: 'core' });

      batcher.clearBatch();

      expect(batcher.getPendingTransactions('evm')).toHaveLength(0);
      expect(batcher.getPendingTransactions('core')).toHaveLength(0);
    });
  });

  describe('getOptions', () => {
    it('should return batcher configuration', () => {
      const options = batcher.getOptions();

      expect(options.maxBatchSize).toBe(10);
      expect(options.autoExecuteTimeout).toBe(0);
    });
  });

  describe('updateOptions', () => {
    it('should update batcher configuration', () => {
      batcher.updateOptions({ maxBatchSize: 20 });

      const options = batcher.getOptions();
      expect(options.maxBatchSize).toBe(20);
    });

    it('should preserve unchanged options', () => {
      batcher.updateOptions({ maxBatchSize: 20 });

      const options = batcher.getOptions();
      expect(options.autoExecuteTimeout).toBe(0);
    });
  });
});
