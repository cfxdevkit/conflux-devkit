// CoreClient tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoreClient } from '../../../src/rpc/CoreClient';
import { createMockNetworkConfig } from '../../helpers/test-utils';
import { MOCK_NETWORKS } from '../../helpers/mock-data';

// Mock network manager
vi.mock('../../../src/network', () => ({
  networkManager: {
    getNetwork: vi.fn(),
    getLocalNetwork: vi.fn(),
    getTestnetNetwork: vi.fn(),
    getMainnetNetwork: vi.fn(),
  },
}));

describe('CoreClient', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with network config', () => {
      const network = createMockNetworkConfig();
      const client = new CoreClient(network);

      expect(client).toBeDefined();
    });
  });

  describe('Static Factory Methods', () => {
    let mockNetworkManager: any;

    beforeEach(async () => {
      const { networkManager } = await import('../../../src/network');
      mockNetworkManager = networkManager;

      mockNetworkManager.getNetwork.mockReturnValue(MOCK_NETWORKS.mainnetCore);
      mockNetworkManager.getLocalNetwork.mockReturnValue(
        MOCK_NETWORKS.localCore
      );
      mockNetworkManager.getTestnetNetwork.mockReturnValue(
        MOCK_NETWORKS.testnetCore
      );
      mockNetworkManager.getMainnetNetwork.mockReturnValue(
        MOCK_NETWORKS.mainnetCore
      );
    });

    it('should create client from network ID', () => {
      const client = CoreClient.createFromNetworkId('core-mainnet');

      expect(client).toBeDefined();
      expect(mockNetworkManager.getNetwork).toHaveBeenCalledWith(
        'core-mainnet'
      );
    });

    it('should throw error for invalid network ID', () => {
      mockNetworkManager.getNetwork.mockReturnValue(null);

      expect(() => CoreClient.createFromNetworkId('invalid')).toThrow(
        'Network not found: invalid'
      );
    });

    it('should create local client', () => {
      const client = CoreClient.createLocal();

      expect(client).toBeDefined();
      expect(mockNetworkManager.getLocalNetwork).toHaveBeenCalledWith('core');
    });

    it('should throw error if local network not found', () => {
      mockNetworkManager.getLocalNetwork.mockReturnValue(null);

      expect(() => CoreClient.createLocal()).toThrow(
        'Core local network not found'
      );
    });

    it('should create testnet client', () => {
      const client = CoreClient.createTestnet();

      expect(client).toBeDefined();
      expect(mockNetworkManager.getTestnetNetwork).toHaveBeenCalledWith('core');
    });

    it('should throw error if testnet network not found', () => {
      mockNetworkManager.getTestnetNetwork.mockReturnValue(null);

      expect(() => CoreClient.createTestnet()).toThrow(
        'Core testnet network not found'
      );
    });

    it('should create mainnet client', () => {
      const client = CoreClient.createMainnet();

      expect(client).toBeDefined();
      expect(mockNetworkManager.getMainnetNetwork).toHaveBeenCalledWith('core');
    });

    it('should throw error if mainnet network not found', () => {
      mockNetworkManager.getMainnetNetwork.mockReturnValue(null);

      expect(() => CoreClient.createMainnet()).toThrow(
        'Core mainnet network not found'
      );
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
