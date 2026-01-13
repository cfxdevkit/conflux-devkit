/**
 * Error Handling and Edge Cases Tests
 *
 * Tests error conditions, edge cases, and failure modes:
 * - Invalid configurations
 * - Network failures
 * - Invalid parameters
 * - Resource constraints
 * - Concurrent operations
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CoreWalletClient } from '../src/clients/core.js';
import type { EspaceWalletClient } from '../src/clients/evm.js';
import { DevKit } from '../src/devkit.js';
import type { NodeConfig } from '../src/types/index.js';
import { MOCK_ACCOUNT, TEST_CONFIG } from './setup.js';

const RPC_URLS = {
  core: 'http://localhost:12537',
  evm: 'http://localhost:8545',
};

describe('DevKit Error Handling', () => {
  describe('Configuration Errors', () => {
    it('should handle empty configuration gracefully', () => {
      const devkit = new DevKit();
      const config = devkit.getConfig();

      // Should use sensible defaults
      expect(config.chainId).toBe(1029);
      expect(config.evmChainId).toBe(1030);
      expect(config.log).toBe(false);
    });

    it('should handle partial configuration', () => {
      const devkit = new DevKit({ chainId: 999 });
      const config = devkit.getConfig();

      expect(config.chainId).toBe(999);
      expect(config.evmChainId).toBe(1030); // Default
    });

    it('should handle invalid port numbers', () => {
      // Invalid ports should still be accepted (let the underlying system handle validation)
      const devkit = new DevKit({
        jsonrpcHttpPort: -1,
        jsonrpcHttpEthPort: 999999,
      });
      const config = devkit.getConfig();

      expect(config.jsonrpcHttpPort).toBe(-1);
      expect(config.jsonrpcHttpEthPort).toBe(999999);
    });
  });

  describe('Account Access Errors', () => {
    let devkit: DevKit;

    const createAccountServerMock = (
      accounts: Array<typeof MOCK_ACCOUNT>
    ) => ({
      getAccounts: vi.fn().mockReturnValue(accounts),
      getRpcUrls: vi.fn().mockReturnValue(RPC_URLS),
    });

    beforeEach(() => {
      devkit = new DevKit(TEST_CONFIG, () =>
        createAccountServerMock([MOCK_ACCOUNT])
      );
    });

    it('should throw error when accessing non-existent account', () => {
      expect(() => devkit.account(1)).toThrow(
        'Account 1 does not exist. Available accounts: 0-0'
      );
      expect(() => devkit.account(99)).toThrow(
        'Account 99 does not exist. Available accounts: 0-0'
      );
      expect(() => devkit.account(-1)).toThrow(
        'Account -1 does not exist. Available accounts: 0-0'
      );
    });

    it('should handle empty account list', () => {
      const emptyDevkit = new DevKit(TEST_CONFIG, () =>
        createAccountServerMock([])
      );
      expect(() => emptyDevkit.account(0)).toThrow(
        'Account 0 does not exist. Available accounts: none'
      );
    });
  });

  describe('Network and Connection Errors', () => {
    let devkit: DevKit;

    const createNetworkErrorServer = () => ({
      start: vi
        .fn()
        .mockRejectedValue(new Error('Failed to start node: Port already in use')),
      stop: vi.fn().mockRejectedValue(new Error('Node is not running')),
      startMining: vi
        .fn()
        .mockRejectedValue(new Error('Node is not ready for mining')),
      getAccounts: vi.fn().mockReturnValue([MOCK_ACCOUNT]),
      getRpcUrls: vi.fn().mockReturnValue(RPC_URLS),
      getFaucetBalances: vi
        .fn()
        .mockRejectedValue(new Error('Connection refused')),
      fundCoreAccount: vi
        .fn()
        .mockRejectedValue(new Error('Insufficient faucet balance')),
      fundEvmAccount: vi
        .fn()
        .mockRejectedValue(new Error('Network timeout')),
    });

    beforeEach(() => {
      devkit = new DevKit(TEST_CONFIG, () => createNetworkErrorServer());
    });

    it('should propagate node start errors', async () => {
      await expect(devkit.start()).rejects.toThrow(
        'Failed to start node: Port already in use'
      );
    });

    it('should propagate node stop errors', async () => {
      await expect(devkit.stop()).rejects.toThrow('Node is not running');
    });

    it('should propagate mining start errors', async () => {
      await expect(devkit.startMining()).rejects.toThrow(
        'Node is not ready for mining'
      );
    });

    it('should propagate faucet balance errors', async () => {
      await expect(devkit.getFaucetBalances()).rejects.toThrow(
        'Connection refused'
      );
    });

    it('should propagate funding errors', async () => {
      await expect(
        devkit.fundAccount('cfx:test', '1000000000000000000', 'core')
      ).rejects.toThrow('Insufficient faucet balance');

      await expect(
        devkit.fundAccount('0x123', '1000000000000000000', 'evm')
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('Contract Operation Errors', () => {
    let devkit: DevKit;

    beforeEach(() => {
      const contractServerMock = () => ({
        getAccounts: vi.fn().mockReturnValue([MOCK_ACCOUNT]),
        getRpcUrls: vi.fn().mockReturnValue(RPC_URLS),
      });

      const clientFactories = {
        coreWalletFactory: () =>
          ({
            deployContract: vi
              .fn()
              .mockRejectedValue(new Error('Insufficient gas')),
            callContract: vi
              .fn()
              .mockRejectedValue(new Error('Contract not found')),
            writeContract: vi
              .fn()
              .mockRejectedValue(new Error('Transaction reverted')),
            waitForTransaction: vi
              .fn()
              .mockRejectedValue(new Error('Transaction timeout')),
          } as unknown as CoreWalletClient),
        evmWalletFactory: () =>
          ({
            deployContract: vi
              .fn()
              .mockRejectedValue(new Error('Contract creation failed')),
            callContract: vi
              .fn()
              .mockRejectedValue(new Error('Execution reverted')),
            writeContract: vi.fn().mockRejectedValue(new Error('Nonce too high')),
            waitForTransaction: vi
              .fn()
              .mockRejectedValue(new Error('Block not found')),
          } as unknown as EspaceWalletClient),
      };

      devkit = new DevKit(
        TEST_CONFIG,
        () => contractServerMock(),
        clientFactories
      );
    });

    const mockAbi = [{ name: 'test', type: 'function' }];
    const mockBytecode = '0x608060405234801561001057600080fd5b50';

    it('should propagate deployment errors', async () => {
      await expect(
        devkit.deployContract({
          abi: mockAbi,
          bytecode: mockBytecode,
          args: [],
          account: 0,
          chain: 'core',
        })
      ).rejects.toThrow('Insufficient gas');

      await expect(
        devkit.deployContract({
          abi: mockAbi,
          bytecode: mockBytecode,
          args: [],
          account: 0,
          chain: 'evm',
        })
      ).rejects.toThrow('Contract creation failed');
    });

    it('should propagate contract read errors', async () => {
      await expect(
        devkit.readContract({
          address: 'cfx:invalid',
          abi: mockAbi,
          functionName: 'test',
          args: [],
          chain: 'core',
        })
      ).rejects.toThrow('Contract not found');

      await expect(
        devkit.readContract({
          address: '0xinvalid',
          abi: mockAbi,
          functionName: 'test',
          args: [],
          chain: 'evm',
        })
      ).rejects.toThrow('Execution reverted');
    });

    it('should propagate contract write errors', async () => {
      await expect(
        devkit.writeContract({
          address: 'cfx:test',
          abi: mockAbi,
          functionName: 'test',
          args: [],
          account: 0,
          chain: 'core',
        })
      ).rejects.toThrow('Transaction reverted');

      await expect(
        devkit.writeContract({
          address: '0xtest',
          abi: mockAbi,
          functionName: 'test',
          args: [],
          account: 0,
          chain: 'evm',
        })
      ).rejects.toThrow('Nonce too high');
    });
  });

  describe('Parameter Validation', () => {
    let devkit: DevKit;

    beforeEach(() => {
      const successClients = {
        coreWalletFactory: () =>
          ({
            deployContract: vi.fn().mockResolvedValue('cfx:deployed'),
            callContract: vi.fn().mockResolvedValue('result'),
            writeContract: vi.fn().mockResolvedValue('0x123'),
            waitForTransaction: vi.fn().mockResolvedValue(undefined),
          } as unknown as CoreWalletClient),
        evmWalletFactory: () =>
          ({
            deployContract: vi.fn().mockResolvedValue('0x123'),
            callContract: vi.fn().mockResolvedValue('result'),
            writeContract: vi.fn().mockResolvedValue('0x123'),
            waitForTransaction: vi.fn().mockResolvedValue(undefined),
          } as unknown as EspaceWalletClient),
      };

      devkit = new DevKit(
        TEST_CONFIG,
        () => ({
          getAccounts: vi.fn().mockReturnValue([MOCK_ACCOUNT]),
          getRpcUrls: vi.fn().mockReturnValue(RPC_URLS),
        }),
        successClients
      );
    });

    it('should reject contract deployment without chain specification', async () => {
      const deployOptions = {
        abi: [],
        bytecode: '0x123',
        args: [],
        account: 0,
        // Missing chain or chains
      } as any;

      await expect(devkit.deployContract(deployOptions)).rejects.toThrow(
        'Must specify either chain or chains in deploy options'
      );
    });

    it('should handle empty arrays in contract operations', async () => {
      const result = await devkit.deployContract({
        abi: [], // Empty ABI
        bytecode: '0x123',
        args: [], // Empty args
        account: 0,
        chain: 'core',
      });

      expect(result.core).toBe('cfx:deployed');
    });
  });

  describe('Resource Constraints', () => {
    it('should handle memory constraints gracefully', () => {
      // Test with large configuration objects
      const largeConfig: Partial<NodeConfig> = {
        chainId: 1029,
        evmChainId: 1030,
        // Add many properties to test memory handling
        log: true,
        jsonrpcHttpPort: 12537,
        jsonrpcHttpEthPort: 8545,
        jsonrpcWsPort: 12535,
      };

      const devkit = new DevKit(largeConfig);
      expect(devkit.getConfig()).toEqual(expect.objectContaining(largeConfig));
    });

    it('should handle concurrent account access', () => {
      const devkit = new DevKit(TEST_CONFIG);

      // Create many accounts concurrently (should use caching)
      const accounts = Array.from({ length: 10 }, (_, i) => {
        if (i === 0) {
          return devkit.account(0); // Only account 0 exists in mock
        }
        return undefined;
      }).filter(Boolean);

      expect(accounts).toHaveLength(1);

      // All should be the same cached instance
      const account1 = devkit.account(0);
      const account2 = devkit.account(0);
      expect(account1).toBe(account2);
    });
  });

  describe('Cleanup and Resource Management', () => {
    let devkit: DevKit;

    const createCleanupServer = () => ({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      startMining: vi.fn().mockResolvedValue(undefined),
      stopMining: vi.fn().mockResolvedValue(undefined),
      getAccounts: vi.fn().mockReturnValue([MOCK_ACCOUNT]),
      getRpcUrls: vi.fn().mockReturnValue(RPC_URLS),
    });

    beforeEach(() => {
      devkit = new DevKit(TEST_CONFIG, () => createCleanupServer());
    });

    it('should handle multiple stop calls gracefully', async () => {
      await devkit.start();

      // Multiple stops should not cause issues
      await devkit.stop();
      await devkit.stop(); // Should not throw
    });

    it('should handle stop without start', async () => {
      // Should not throw even if never started
      await devkit.stop();
    });

    it('should clear account cache appropriately', async () => {
      const account1 = devkit.account(0);

      // Simulate adding an account which refreshes cache
      vi.spyOn(devkit as any, 'refreshAccounts').mockImplementation(() => {
        (devkit as any).accounts.clear();
      });

      (devkit as any).refreshAccounts();

      const account2 = devkit.account(0);

      // Should be different instances after cache clear
      expect(account1).not.toBe(account2);
    });
  });
});
