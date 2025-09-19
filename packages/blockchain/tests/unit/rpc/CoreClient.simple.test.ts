// Simple CoreClient tests

import { describe, it, expect } from 'vitest';
import { CoreClient } from '../../../src/rpc/CoreClient';
import { createMockNetworkConfig } from '../../helpers/test-utils';

describe('CoreClient - Simple Tests', () => {
  describe('Constructor', () => {
    it('should create client with network config', () => {
      const network = createMockNetworkConfig();
      const client = new CoreClient(network);

      expect(client).toBeDefined();
    });
  });

  describe('Static Factory Methods', () => {
    it('should have createFromNetworkId method', () => {
      expect(typeof CoreClient.createFromNetworkId).toBe('function');
    });

    it('should have createLocal method', () => {
      expect(typeof CoreClient.createLocal).toBe('function');
    });

    it('should have createTestnet method', () => {
      expect(typeof CoreClient.createTestnet).toBe('function');
    });

    it('should have createMainnet method', () => {
      expect(typeof CoreClient.createMainnet).toBe('function');
    });
  });

  describe('Instance Methods', () => {
    let client: CoreClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new CoreClient(network);
    });

    it('should have getBalance method', () => {
      expect(typeof client.getBalance).toBe('function');
    });

    it('should have getBlockNumber method', () => {
      expect(typeof client.getBlockNumber).toBe('function');
    });

    it('should have getBlock method', () => {
      expect(typeof client.getBlock).toBe('function');
    });

    it('should have getTransactionReceipt method', () => {
      expect(typeof client.getTransactionReceipt).toBe('function');
    });

    it('should have sendTransaction method', () => {
      expect(typeof client.sendTransaction).toBe('function');
    });

    it('should have call method', () => {
      expect(typeof client.call).toBe('function');
    });

    it('should have getNetworkId method', () => {
      expect(typeof client.getNetworkId).toBe('function');
    });

    it('should have getGasPrice method', () => {
      expect(typeof client.getGasPrice).toBe('function');
    });

    it('should have readContract method', () => {
      expect(typeof client.readContract).toBe('function');
    });

    it('should have writeContract method', () => {
      expect(typeof client.writeContract).toBe('function');
    });

    it('should have getChainId method', () => {
      expect(typeof client.getChainId).toBe('function');
    });

    it('should have estimateGas method', () => {
      expect(typeof client.estimateGas).toBe('function');
    });
  });

  describe('Disabled Methods', () => {
    let client: CoreClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new CoreClient(network);
    });

    it('should throw error for getBalance', async () => {
      await expect(
        client.getBalance({ address: 'CFX:TYPE.USER:test' })
      ).rejects.toThrow(
        'CoreClient.getBalance is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for getBlockNumber', async () => {
      await expect(client.getBlockNumber()).rejects.toThrow(
        'CoreClient.getBlockNumber is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for getBlock', async () => {
      await expect(client.getBlock({ blockNumber: 12345n })).rejects.toThrow(
        'CoreClient.getBlock is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for getTransactionReceipt', async () => {
      await expect(
        client.getTransactionReceipt({ hash: '0x123' })
      ).rejects.toThrow(
        'CoreClient.getTransactionReceipt is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for sendTransaction', async () => {
      await expect(
        client.sendTransaction({ to: 'CFX:TYPE.USER:test', value: 1000n })
      ).rejects.toThrow(
        'CoreClient.sendTransaction is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for call', async () => {
      await expect(
        client.call({ to: 'CFX:TYPE.USER:test', data: '0x' })
      ).rejects.toThrow(
        'CoreClient.call is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for getNetworkId', async () => {
      await expect(client.getNetworkId()).rejects.toThrow(
        'CoreClient.getNetworkId is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for getGasPrice', async () => {
      await expect(client.getGasPrice()).rejects.toThrow(
        'CoreClient.getGasPrice is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for readContract', async () => {
      await expect(
        client.readContract({
          address: 'CFX:TYPE.USER:test',
          abi: [],
          functionName: 'test',
        })
      ).rejects.toThrow(
        'CoreClient.readContract is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for writeContract', async () => {
      await expect(
        client.writeContract({
          address: 'CFX:TYPE.USER:test',
          abi: [],
          functionName: 'test',
        })
      ).rejects.toThrow(
        'CoreClient.writeContract is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for getChainId', async () => {
      await expect(client.getChainId()).rejects.toThrow(
        'CoreClient.getChainId is not implemented - Core functionality is disabled for development'
      );
    });

    it('should throw error for estimateGas', async () => {
      await expect(
        client.estimateGas({ to: 'CFX:TYPE.USER:test', value: 1000n })
      ).rejects.toThrow(
        'CoreClient.estimateGas is not implemented - Core functionality is disabled for development'
      );
    });
  });
});
