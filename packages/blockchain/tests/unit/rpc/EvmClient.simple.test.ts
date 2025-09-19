// Simple EvmClient tests

import { describe, it, expect } from 'vitest';
import { EvmClient } from '../../../src/rpc/EvmClient';
import { createMockNetworkConfig } from '../../helpers/test-utils';

describe('EvmClient - Simple Tests', () => {
  describe('Constructor', () => {
    it('should create client with network config', () => {
      const network = createMockNetworkConfig();
      const client = new EvmClient(network);

      expect(client).toBeDefined();
    });

    it('should create client with network config and private key', () => {
      const network = createMockNetworkConfig();
      const privateKey =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;
      const client = new EvmClient(network, privateKey);

      expect(client).toBeDefined();
    });
  });

  describe('Static Factory Methods', () => {
    it('should have createFromNetworkId method', () => {
      expect(typeof EvmClient.createFromNetworkId).toBe('function');
    });

    it('should have createLocal method', () => {
      expect(typeof EvmClient.createLocal).toBe('function');
    });

    it('should have createTestnet method', () => {
      expect(typeof EvmClient.createTestnet).toBe('function');
    });

    it('should have createMainnet method', () => {
      expect(typeof EvmClient.createMainnet).toBe('function');
    });
  });

  describe('Instance Methods', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
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
});
