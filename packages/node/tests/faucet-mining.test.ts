/**
 * Faucet and Mining System Tests
 * 
 * Tests the faucet operations and mining functionality:
 * - Faucet balance queries
 * - Account funding operations
 * - Mining control and status
 * - Block mining operations
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DevKit } from '../src/devkit.js';
import { MOCK_ACCOUNT, TEST_CONFIG } from './setup.js';

// Mock ServerManager with faucet and mining operations
vi.mock('../src/server/index.js', () => ({
  ServerManager: vi.fn().mockImplementation(function () {
    return {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      getAccounts: vi.fn().mockReturnValue([MOCK_ACCOUNT]),
      getRpcUrls: vi.fn().mockReturnValue({
        core: 'http://localhost:12537',
        evm: 'http://localhost:8545',
      }),

      // Faucet operations
      getFaucetBalances: vi.fn().mockResolvedValue({
        coreBalance: '5000000000000000000000', // 5,000 CFX
        evmBalance: '3000000000000000000000', // 3,000 CFX
      }),
      getFaucetAccount: vi.fn().mockReturnValue({
        ...MOCK_ACCOUNT,
        index: -1, // Special faucet account
        privateKey: '0xfaucet_private_key_here',
        coreAddress: 'cfx:faucet_core_address',
        evmAddress: '0xfaucet_evm_address',
      }),
      fundCoreAccount: vi.fn().mockImplementation((address, amount) => {
        if (amount === '0') {
          return Promise.reject(new Error('Cannot fund with zero amount'));
        }
        if (address === 'invalid_address') {
          return Promise.reject(new Error('Invalid address format'));
        }
        return Promise.resolve(
          '0xfund_core_tx_' + Math.floor(Math.random() * 1000)
        );
      }),
      fundEvmAccount: vi.fn().mockImplementation((address, amount) => {
        if (amount === '0') {
          return Promise.reject(new Error('Cannot fund with zero amount'));
        }
        if (address === 'invalid_address') {
          return Promise.reject(new Error('Invalid address format'));
        }
        return Promise.resolve(
          '0xfund_evm_tx_' + Math.floor(Math.random() * 1000)
        );
      }),

      // Mining operations
      startMining: vi.fn().mockImplementation(function () {
        // Simulate already running
        if (mockMiningStatus.isRunning) {
          return Promise.reject(new Error('Mining is already running'));
        }
        mockMiningStatus.isRunning = true;
        mockMiningStatus.startTime = new Date();
        return Promise.resolve();
      }),
      stopMining: vi.fn().mockImplementation(function () {
        if (!mockMiningStatus.isRunning) {
          return Promise.reject(new Error('Mining is not running'));
        }
        mockMiningStatus.isRunning = false;
        mockMiningStatus.startTime = undefined;
        return Promise.resolve();
      }),
      mine: vi.fn().mockImplementation(function (blocks: number) {
        if (blocks <= 0) {
          return Promise.reject(new Error('Must mine at least 1 block'));
        }
        mockMiningStatus.blocksMined += blocks;
        return Promise.resolve();
      }),
      getMiningStatus: vi.fn(() => ({ ...mockMiningStatus })),
    };
  }),
}));

// Mock mining status that can be modified by operations
const mockMiningStatus = {
  isRunning: false,
  interval: 1000,
  blocksMined: 0,
  startTime: undefined as Date | undefined
};

describe('DevKit Faucet System', () => {
  let devkit: DevKit;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mining status
    mockMiningStatus.isRunning = false;
    mockMiningStatus.blocksMined = 0;
    mockMiningStatus.startTime = undefined;
    
    devkit = new DevKit(TEST_CONFIG);
  });

  describe('Faucet Balance Operations', () => {
    it('should get faucet balances', async () => {
      const balances = await devkit.getFaucetBalances();
      
      expect(balances.coreBalance).toBe('5000000000000000000000');
      expect(balances.evmBalance).toBe('3000000000000000000000');
      expect(devkit['server'].getFaucetBalances).toHaveBeenCalledOnce();
    });

    it('should get faucet account', async () => {
      const faucetAccount = await devkit.getFaucetAccount();
      
      expect(faucetAccount.index).toBe(-1); // Special faucet index
      expect(faucetAccount.privateKey).toBe('0xfaucet_private_key_here');
      expect(faucetAccount.address.core).toBe('cfx:faucet_core_address');
      expect(faucetAccount.address.evm).toBe('0xfaucet_evm_address');
    });
  });

  describe('Account Funding Operations', () => {
    it('should fund core account successfully', async () => {
      const txHash = await devkit.fundAccount(
        'cfx:test_recipient_address',
        '1000000000000000000', // 1 CFX
        'core'
      );
      
      expect(txHash).toMatch(/^0xfund_core_tx_\d+$/);
      expect(devkit['server'].fundCoreAccount).toHaveBeenCalledWith(
        'cfx:test_recipient_address',
        '1000000000000000000'
      );
    });

    it('should fund evm account successfully', async () => {
      const txHash = await devkit.fundAccount(
        '0x1234567890123456789012345678901234567890',
        '2000000000000000000', // 2 CFX
        'evm'
      );
      
      expect(txHash).toMatch(/^0xfund_evm_tx_\d+$/);
      expect(devkit['server'].fundEvmAccount).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        '2000000000000000000'
      );
    });

    it('should reject funding with zero amount', async () => {
      await expect(
        devkit.fundAccount('cfx:test_address', '0', 'core')
      ).rejects.toThrow('Cannot fund with zero amount');
    });

    it('should reject funding with invalid address', async () => {
      await expect(
        devkit.fundAccount('invalid_address', '1000000000000000000', 'core')
      ).rejects.toThrow('Invalid address format');
    });

    it('should fund account via DevKitAccount wrapper', async () => {
      const account = devkit.account(0);
      
      const coreTxHash = await account.fundFromFaucet('500000000000000000', 'core');
      const evmTxHash = await account.fundFromFaucet('750000000000000000', 'evm');
      
      expect(coreTxHash).toMatch(/^0xfund_core_tx_\d+$/);
      expect(evmTxHash).toMatch(/^0xfund_evm_tx_\d+$/);
      
      expect(devkit['server'].fundCoreAccount).toHaveBeenCalledWith(
        MOCK_ACCOUNT.coreAddress,
        '500000000000000000'
      );
      expect(devkit['server'].fundEvmAccount).toHaveBeenCalledWith(
        MOCK_ACCOUNT.evmAddress,
        '750000000000000000'
      );
    });
  });
});

describe('DevKit Mining System', () => {
  let devkit: DevKit;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mining status
    mockMiningStatus.isRunning = false;
    mockMiningStatus.blocksMined = 0;
    mockMiningStatus.startTime = undefined;
    
    devkit = new DevKit(TEST_CONFIG);
  });

  describe('Mining Control', () => {
    it('should start mining', async () => {
      await devkit.startMining();
      
      expect(mockMiningStatus.isRunning).toBe(true);
      expect(mockMiningStatus.startTime).toBeInstanceOf(Date);
      expect(devkit['server'].startMining).toHaveBeenCalledOnce();
    });

    it('should stop mining', async () => {
      // First start mining
      await devkit.startMining();
      expect(mockMiningStatus.isRunning).toBe(true);
      
      // Then stop it
      await devkit.stopMining();
      
      expect(mockMiningStatus.isRunning).toBe(false);
      expect(mockMiningStatus.startTime).toBeUndefined();
      expect(devkit['server'].stopMining).toHaveBeenCalledOnce();
    });

    it('should reject starting mining when already running', async () => {
      // Start mining first
      await devkit.startMining();
      
      // Try to start again
      await expect(devkit.startMining()).rejects.toThrow('Mining is already running');
    });

    it('should reject stopping mining when not running', async () => {
      await expect(devkit.stopMining()).rejects.toThrow('Mining is not running');
    });
  });

  describe('Block Mining', () => {
    it('should mine single block by default', async () => {
      await devkit.mine();
      
      expect(mockMiningStatus.blocksMined).toBe(1);
      expect(devkit['server'].mine).toHaveBeenCalledWith(1);
    });

    it('should mine multiple blocks', async () => {
      await devkit.mine(5);
      
      expect(mockMiningStatus.blocksMined).toBe(5);
      expect(devkit['server'].mine).toHaveBeenCalledWith(5);
    });

    it('should accumulate mined blocks', async () => {
      await devkit.mine(3);
      await devkit.mine(2);
      
      expect(mockMiningStatus.blocksMined).toBe(5);
    });

    it('should reject mining zero or negative blocks', async () => {
      await expect(devkit.mine(0)).rejects.toThrow('Must mine at least 1 block');
      await expect(devkit.mine(-1)).rejects.toThrow('Must mine at least 1 block');
    });
  });

  describe('Mining Status', () => {
    it('should get mining status when not running', () => {
      const status = devkit.getMiningStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.interval).toBe(1000);
      expect(status.blocksMined).toBe(0);
      expect(status.startTime).toBeUndefined();
    });

    it('should get mining status when running', async () => {
      await devkit.startMining();
      await devkit.mine(3);
      
      const status = devkit.getMiningStatus();
      
      expect(status.isRunning).toBe(true);
      expect(status.interval).toBe(1000);
      expect(status.blocksMined).toBe(3);
      expect(status.startTime).toBeInstanceOf(Date);
    });
  });

  describe('Auto-mining on Start', () => {
    it('should auto-start mining when starting DevKit', async () => {
      await devkit.start();
      
      expect(devkit['server'].startMining).toHaveBeenCalledOnce();
    });

    it('should not auto-start mining when disabled', async () => {
      await devkit.start({ mining: false });
      
      expect(devkit['server'].startMining).not.toHaveBeenCalled();
    });

    it('should mine initial blocks after starting', async () => {
      await devkit.start({ waitForBlocks: 3 });
      
      expect(devkit['server'].mine).toHaveBeenCalledWith(3);
    });

    it('should start mining and then mine blocks', async () => {
      await devkit.start({ mining: true, waitForBlocks: 2 });
      
      expect(devkit['server'].startMining).toHaveBeenCalledOnce();
      expect(devkit['server'].mine).toHaveBeenCalledWith(2);
    });
  });
});