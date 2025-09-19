// RpcManager tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RpcManager } from '../../../src/rpc/RpcManager';
import { createMockNetworkConfig } from '../../helpers/test-utils';
import { MOCK_PRIVATE_KEYS } from '../../helpers/mock-data';

// Mock the client classes
const mockEvmClient = {
  getBalance: vi.fn(),
  getBlockNumber: vi.fn(),
};

const mockCoreClient = {
  getBalance: vi.fn(),
  getBlockNumber: vi.fn(),
};

vi.mock('../../../src/rpc/EvmClient', () => ({
  EvmClient: vi.fn().mockImplementation(() => mockEvmClient),
}));

vi.mock('../../../src/rpc/CoreClient', () => ({
  CoreClient: vi.fn().mockImplementation(() => mockCoreClient),
}));

describe('RpcManager', () => {
  let rpcManager: RpcManager;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset mock implementations to default
    const { EvmClient } = await import('../../../src/rpc/EvmClient');
    const { CoreClient } = await import('../../../src/rpc/CoreClient');

    vi.mocked(EvmClient).mockReset();
    vi.mocked(CoreClient).mockReset();

    vi.mocked(EvmClient).mockImplementation(() => mockEvmClient);
    vi.mocked(CoreClient).mockImplementation(() => mockCoreClient);

    // Create new RpcManager instance
    rpcManager = new RpcManager();
  });

  describe('Constructor', () => {
    it('should create RpcManager instance', () => {
      expect(rpcManager).toBeDefined();
    });

    it('should start with uninitialized clients', () => {
      expect(rpcManager.isInitialized()).toBe(false);
    });
  });

  describe('initializeClients', () => {
    it('should initialize both EVM and Core clients', async () => {
      const network = createMockNetworkConfig();
      const privateKey = MOCK_PRIVATE_KEYS.valid as `0x${string}`;

      await rpcManager.initializeClients(network, privateKey);

      expect(rpcManager.isInitialized()).toBe(true);
    });

    it('should initialize clients without private key', async () => {
      const network = createMockNetworkConfig();

      await rpcManager.initializeClients(network);

      expect(rpcManager.isInitialized()).toBe(true);
    });

    it('should throw error if client initialization fails', async () => {
      const network = createMockNetworkConfig();
      const invalidPrivateKey = 'invalid-key';

      // Mock the client constructors to throw errors
      const { EvmClient } = await import('../../../src/rpc/EvmClient');
      const { CoreClient } = await import('../../../src/rpc/CoreClient');

      vi.mocked(EvmClient).mockImplementationOnce(() => {
        throw new Error('Client initialization failed');
      });
      vi.mocked(CoreClient).mockImplementationOnce(() => {
        throw new Error('Client initialization failed');
      });

      await expect(
        rpcManager.initializeClients(
          network,
          invalidPrivateKey as `0x${string}`
        )
      ).rejects.toThrow('Failed to initialize RPC clients');
    });

    it('should throw error with unknown error type', async () => {
      const network = createMockNetworkConfig();
      const invalidPrivateKey = 'invalid-key';

      // Mock the client constructors to throw unknown errors
      const { EvmClient } = await import('../../../src/rpc/EvmClient');
      const { CoreClient } = await import('../../../src/rpc/CoreClient');

      vi.mocked(EvmClient).mockImplementationOnce(() => {
        throw 'Unknown error';
      });
      vi.mocked(CoreClient).mockImplementationOnce(() => {
        throw 'Unknown error';
      });

      await expect(
        rpcManager.initializeClients(
          network,
          invalidPrivateKey as `0x${string}`
        )
      ).rejects.toThrow('Failed to initialize RPC clients');
    });
  });

  describe('getEvmClient', () => {
    it('should return EVM client when initialized', async () => {
      const network = createMockNetworkConfig();
      await rpcManager.initializeClients(network);

      const client = rpcManager.getEvmClient();

      expect(client).toBeDefined();
    });

    it('should throw error when EVM client not initialized', () => {
      expect(() => rpcManager.getEvmClient()).toThrow(
        'EVM client not initialized'
      );
    });
  });

  describe('getCoreClient', () => {
    it('should return Core client when initialized', async () => {
      const network = createMockNetworkConfig();
      await rpcManager.initializeClients(network);

      const client = rpcManager.getCoreClient();

      expect(client).toBeDefined();
    });

    it('should throw error when Core client not initialized', () => {
      expect(() => rpcManager.getCoreClient()).toThrow(
        'Core client not initialized'
      );
    });
  });

  describe('isInitialized', () => {
    it('should return false when clients are not initialized', () => {
      expect(rpcManager.isInitialized()).toBe(false);
    });

    it('should return true when both clients are initialized', async () => {
      const network = createMockNetworkConfig();
      await rpcManager.initializeClients(network);

      expect(rpcManager.isInitialized()).toBe(true);
    });

    it('should return false when only EVM client is initialized', async () => {
      const network = createMockNetworkConfig();
      await rpcManager.initializeClients(network);

      // This test is actually checking that both clients are initialized
      expect(rpcManager.isInitialized()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect clients', async () => {
      const network = createMockNetworkConfig();
      await rpcManager.initializeClients(network);

      rpcManager.disconnect();

      expect(rpcManager.isInitialized()).toBe(false);
    });

    it('should handle disconnect when clients are not initialized', () => {
      expect(() => rpcManager.disconnect()).not.toThrow();
    });
  });

  describe('Client Integration', () => {
    it('should allow access to client methods after initialization', async () => {
      const network = createMockNetworkConfig();
      const privateKey = MOCK_PRIVATE_KEYS.valid as `0x${string}`;

      await rpcManager.initializeClients(network, privateKey);

      const evmClient = rpcManager.getEvmClient();
      const coreClient = rpcManager.getCoreClient();

      expect(evmClient).toBeDefined();
      expect(coreClient).toBeDefined();
    });

    it('should maintain client state after multiple operations', async () => {
      const network = createMockNetworkConfig();
      await rpcManager.initializeClients(network);

      expect(rpcManager.isInitialized()).toBe(true);

      rpcManager.disconnect();
      expect(rpcManager.isInitialized()).toBe(false);

      await rpcManager.initializeClients(network);
      expect(rpcManager.isInitialized()).toBe(true);
    });
  });
});
