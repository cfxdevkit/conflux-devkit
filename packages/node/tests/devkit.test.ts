/**
 * DevKit Core Functionality Tests
 *
 * Tests the main DevKit class including:
 * - Constructor and configuration
 * - Lifecycle management
 * - Account management
 * - Configuration methods
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DevKit, DevKitAccount } from '../src/devkit.js';
import type { NodeConfig } from '../src/types/index.js';
import { MOCK_ACCOUNT, TEST_CONFIG } from './setup.js';

// Mock the ServerManager
vi.mock('../src/server/index.js', () => ({
  ServerManager: vi.fn().mockImplementation(function () {
    return {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      startMining: vi.fn().mockResolvedValue(undefined),
      stopMining: vi.fn().mockResolvedValue(undefined),
      mine: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn().mockReturnValue('running'),
      getMiningStatus: vi.fn().mockReturnValue({
        isRunning: true,
        interval: 1000,
        blocksMined: 5,
        startTime: new Date(),
      }),
      getAccounts: vi
        .fn()
        .mockReturnValue([
          MOCK_ACCOUNT,
          {
            ...MOCK_ACCOUNT,
            privateKey:
              '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          },
        ]),
      addAccount: vi.fn().mockResolvedValue(MOCK_ACCOUNT),
      getRpcUrls: vi.fn().mockReturnValue({
        core: 'http://localhost:12537',
        evm: 'http://localhost:8545',
      }),
      getFaucetBalances: vi.fn().mockResolvedValue({
        coreBalance: '1000000000000000000000',
        evmBalance: '1000000000000000000000',
      }),
      getFaucetAccount: vi.fn().mockReturnValue(MOCK_ACCOUNT),
      fundCoreAccount: vi.fn().mockResolvedValue('0x123abc'),
      fundEvmAccount: vi.fn().mockResolvedValue('0x456def'),
    };
  }),
}));

describe('DevKit', () => {
  let devkit: DevKit;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (devkit) {
      try {
        await devkit.stop();
      } catch (_error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('Constructor and Configuration', () => {
    it('should create DevKit with default configuration', () => {
      devkit = new DevKit();
      const config = devkit.getConfig();

      expect(config.chainId).toBe(1029);
      expect(config.evmChainId).toBe(1030);
      expect(config.jsonrpcHttpPort).toBe(12537);
      expect(config.jsonrpcHttpEthPort).toBe(8545);
      expect(config.log).toBe(false);
    });

    it('should create DevKit with custom configuration', () => {
      const customConfig: Partial<NodeConfig> = {
        chainId: 1337,
        evmChainId: 1338,
        jsonrpcHttpPort: 9999,
        log: true,
      };

      devkit = new DevKit(customConfig);
      const config = devkit.getConfig();

      expect(config.chainId).toBe(1337);
      expect(config.evmChainId).toBe(1338);
      expect(config.jsonrpcHttpPort).toBe(9999);
      expect(config.log).toBe(true);
      // Should maintain defaults for unspecified values
      expect(config.jsonrpcHttpEthPort).toBe(8545);
    });

    it('should provide RPC URLs', () => {
      devkit = new DevKit(TEST_CONFIG);
      const urls = devkit.getRpcUrls();

      expect(urls).toEqual({
        core: 'http://localhost:12537',
        evm: 'http://localhost:8545',
      });
    });
  });

  describe('Lifecycle Management', () => {
    beforeEach(() => {
      devkit = new DevKit(TEST_CONFIG);
    });

    it('should start with default options', async () => {
      const serverStart = vi.spyOn(devkit.server, 'start');
      const serverStartMining = vi.spyOn(devkit.server, 'startMining');

      await devkit.start();

      expect(serverStart).toHaveBeenCalledOnce();
      expect(serverStartMining).toHaveBeenCalledOnce();
    });

    it('should start without mining when specified', async () => {
      const serverStart = vi.spyOn(devkit.server, 'start');
      const serverStartMining = vi.spyOn(devkit.server, 'startMining');

      await devkit.start({ mining: false });

      expect(serverStart).toHaveBeenCalledOnce();
      expect(serverStartMining).not.toHaveBeenCalled();
    });

    it('should start and mine initial blocks', async () => {
      const serverMine = vi.spyOn(devkit.server, 'mine');

      await devkit.start({ waitForBlocks: 3 });

      expect(serverMine).toHaveBeenCalledWith(3);
    });

    it('should stop the server', async () => {
      const serverStop = vi.spyOn(devkit.server, 'stop');

      await devkit.stop();

      expect(serverStop).toHaveBeenCalledOnce();
    });
  });

  describe('Account Management', () => {
    beforeEach(() => {
      devkit = new DevKit(TEST_CONFIG);
    });

    it('should get account by index', () => {
      const account = devkit.account(0);

      expect(account).toBeInstanceOf(DevKitAccount);
      expect(account.index).toBe(0);
      expect(account.address.core).toBe(MOCK_ACCOUNT.coreAddress);
      expect(account.address.evm).toBe(MOCK_ACCOUNT.evmAddress);
      expect(account.privateKey).toBe(MOCK_ACCOUNT.privateKey);
    });

    it('should cache accounts', () => {
      const account1 = devkit.account(0);
      const account2 = devkit.account(0);

      expect(account1).toBe(account2); // Same instance
    });

    it('should throw error for non-existent account', () => {
      expect(() => devkit.account(999)).toThrow('Account 999 does not exist');
    });

    it('should get all accounts', () => {
      const accounts = devkit.getAccounts();

      expect(accounts).toHaveLength(2);
      expect(accounts[0]).toBeInstanceOf(DevKitAccount);
      expect(accounts[1]).toBeInstanceOf(DevKitAccount);
      expect(accounts[0].index).toBe(0);
      expect(accounts[1].index).toBe(1);
    });

    it('should add new account', async () => {
      const account = await devkit.addAccount();

      expect(account).toBeInstanceOf(DevKitAccount);
      expect(devkit.server.addAccount).toHaveBeenCalledOnce();
    });
  });

  describe('Mining Operations', () => {
    beforeEach(() => {
      devkit = new DevKit(TEST_CONFIG);
    });

    it('should start mining', async () => {
      const serverStartMining = vi.spyOn(devkit.server, 'startMining');

      await devkit.startMining();

      expect(serverStartMining).toHaveBeenCalledOnce();
    });

    it('should stop mining', async () => {
      const serverStopMining = vi.spyOn(devkit.server, 'stopMining');

      await devkit.stopMining();

      expect(serverStopMining).toHaveBeenCalledOnce();
    });

    it('should mine specific blocks', async () => {
      const serverMine = vi.spyOn(devkit.server, 'mine');

      await devkit.mine(5);

      expect(serverMine).toHaveBeenCalledWith(5);
    });

    it('should mine one block by default', async () => {
      const serverMine = vi.spyOn(devkit.server, 'mine');

      await devkit.mine();

      expect(serverMine).toHaveBeenCalledWith(1);
    });

    it('should get mining status', () => {
      const status = devkit.getMiningStatus();

      expect(status.isRunning).toBe(true);
      expect(status.interval).toBe(1000);
      expect(status.blocksMined).toBe(5);
      expect(status.startTime).toBeInstanceOf(Date);
    });
  });

  describe('Faucet Operations', () => {
    beforeEach(() => {
      devkit = new DevKit(TEST_CONFIG);
    });

    it('should get faucet balances', async () => {
      const balances = await devkit.getFaucetBalances();

      expect(balances.coreBalance).toBe('1000000000000000000000');
      expect(balances.evmBalance).toBe('1000000000000000000000');
    });

    it('should get faucet account', async () => {
      const faucetAccount = await devkit.getFaucetAccount();

      expect(faucetAccount).toBeInstanceOf(DevKitAccount);
      expect(faucetAccount.index).toBe(-1); // Special index for faucet
    });

    it('should fund core account', async () => {
      const txHash = await devkit.fundAccount(
        'cfx:test123',
        '1000000000000000000',
        'core'
      );

      expect(txHash).toBe('0x123abc');
      expect(devkit.server.fundCoreAccount).toHaveBeenCalledWith(
        'cfx:test123',
        '1000000000000000000'
      );
    });

    it('should fund evm account', async () => {
      const txHash = await devkit.fundAccount(
        '0x123abc',
        '1000000000000000000',
        'evm'
      );

      expect(txHash).toBe('0x456def');
      expect(devkit.server.fundEvmAccount).toHaveBeenCalledWith(
        '0x123abc',
        '1000000000000000000'
      );
    });
  });

  describe('Chain Status', () => {
    beforeEach(() => {
      devkit = new DevKit(TEST_CONFIG);
    });

    it('should get chain status', async () => {
      const status = await devkit.getStatus();

      expect(status.core.connected).toBe(true);
      expect(status.core.status).toBe('running');
      expect(status.evm.connected).toBe(true);
      expect(status.evm.status).toBe('running');
    });
  });
});
