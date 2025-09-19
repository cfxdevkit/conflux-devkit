/**
 * DevKitAccount Tests
 *
 * Tests the DevKitAccount wrapper class including:
 * - Account properties and methods
 * - Balance queries
 * - Wallet client lazy initialization
 * - Transaction operations
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DevKit, type DevKitAccount } from '../src/devkit.js';
import { MOCK_ACCOUNT, TEST_CONFIG } from './setup.js';

// Mock the wallet clients
vi.mock('../src/clients/core.js', () => ({
  CoreClient: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue('500000000000000000000'),
  })),
  CoreWalletClient: vi.fn().mockImplementation(() => ({
    sendTransaction: vi.fn().mockResolvedValue('0xcore123'),
    deployContract: vi.fn().mockResolvedValue('cfx:contract123'),
    callContract: vi.fn().mockResolvedValue('result'),
    writeContract: vi.fn().mockResolvedValue('0xwrite123'),
    waitForTransaction: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../src/clients/evm.js', () => ({
  EspaceClient: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue('750000000000000000000'),
  })),
  EspaceWalletClient: vi.fn().mockImplementation(() => ({
    sendTransaction: vi.fn().mockResolvedValue('0xevm456'),
    deployContract: vi
      .fn()
      .mockResolvedValue('0x1234567890123456789012345678901234567890'),
    callContract: vi.fn().mockResolvedValue('result'),
    writeContract: vi.fn().mockResolvedValue('0xwrite456'),
    waitForTransaction: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock ServerManager
vi.mock('../src/server/index.js', () => ({
  ServerManager: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    getAccounts: vi.fn().mockReturnValue([MOCK_ACCOUNT]),
    getRpcUrls: vi.fn().mockReturnValue({
      core: 'http://localhost:12537',
      evm: 'http://localhost:8545',
    }),
    fundCoreAccount: vi.fn().mockResolvedValue('0xfund123'),
    fundEvmAccount: vi.fn().mockResolvedValue('0xfund456'),
  })),
}));

describe('DevKitAccount', () => {
  let devkit: DevKit;
  let account: DevKitAccount;

  beforeEach(() => {
    vi.clearAllMocks();
    devkit = new DevKit(TEST_CONFIG);
    account = devkit.account(0);
  });

  describe('Account Properties', () => {
    it('should have correct address properties', () => {
      expect(account.address.core).toBe(MOCK_ACCOUNT.coreAddress);
      expect(account.address.evm).toBe(MOCK_ACCOUNT.evmAddress);
    });

    it('should have correct private key', () => {
      expect(account.privateKey).toBe(MOCK_ACCOUNT.privateKey);
    });

    it('should have correct index', () => {
      expect(account.index).toBe(0);
    });
  });

  describe('Balance Operations', () => {
    it('should get core balance', async () => {
      const balance = await account.getBalance('core');
      expect(balance).toBe('500000000000000000000');
    });

    it('should get evm balance', async () => {
      const balance = await account.getBalance('evm');
      expect(balance).toBe('750000000000000000000');
    });

    it('should get both balances', async () => {
      const balances = await account.getBalance();
      expect(balances).toEqual({
        core: '500000000000000000000',
        evm: '750000000000000000000',
      });
    });

    it('should get balances using getBalances method', async () => {
      const balances = await account.getBalances();
      expect(balances).toEqual({
        core: '500000000000000000000',
        evm: '750000000000000000000',
      });
    });
  });

  describe('Faucet Operations', () => {
    it('should fund from faucet for core', async () => {
      const txHash = await account.fundFromFaucet(
        '1000000000000000000',
        'core'
      );
      expect(txHash).toBe('0xfund123');
    });

    it('should fund from faucet for evm', async () => {
      const txHash = await account.fundFromFaucet('1000000000000000000', 'evm');
      expect(txHash).toBe('0xfund456');
    });
  });

  describe('Transfer Operations', () => {
    it('should transfer on core chain', async () => {
      const txHash = await account.transfer(
        'cfx:recipient123',
        '1000000000000000000',
        'core'
      );
      expect(txHash).toBe('0xcore123');

      // Verify the wallet client was called with correct parameters
      const coreWallet = account.core;
      expect(coreWallet.sendTransaction).toHaveBeenCalledWith({
        to: 'cfx:recipient123',
        value: BigInt('1000000000000000000'),
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });
    });

    it('should transfer on evm chain', async () => {
      const txHash = await account.transfer(
        '0x1234567890123456789012345678901234567890',
        '1000000000000000000',
        'evm'
      );
      expect(txHash).toBe('0xevm456');

      // Verify the wallet client was called with correct parameters
      const evmWallet = account.evm;
      expect(evmWallet.sendTransaction).toHaveBeenCalledWith({
        to: '0x1234567890123456789012345678901234567890',
        value: BigInt('1000000000000000000'),
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });
    });
  });

  describe('Wallet Client Lazy Initialization', () => {
    it('should initialize core wallet client on first access', () => {
      const coreWallet = account.core;
      expect(coreWallet).toBeDefined();

      // Should return same instance on subsequent calls
      const coreWallet2 = account.core;
      expect(coreWallet2).toBe(coreWallet);
    });

    it('should initialize evm wallet client on first access', () => {
      const evmWallet = account.evm;
      expect(evmWallet).toBeDefined();

      // Should return same instance on subsequent calls
      const evmWallet2 = account.evm;
      expect(evmWallet2).toBe(evmWallet);
    });

    it('should create separate wallet instances for core and evm', () => {
      const coreWallet = account.core;
      const evmWallet = account.evm;

      expect(coreWallet).not.toBe(evmWallet);
    });
  });

  describe('Contract Operations via Wallet Clients', () => {
    const mockAbi = [{ name: 'test', type: 'function' }];
    const mockBytecode = '0x608060405234801561001057600080fd5b50';

    it('should deploy contract via core wallet', async () => {
      const address = await account.core.deployContract(
        mockAbi,
        mockBytecode,
        []
      );
      expect(address).toBe('cfx:contract123');
    });

    it('should deploy contract via evm wallet', async () => {
      const address = await account.evm.deployContract(
        mockAbi,
        mockBytecode,
        []
      );
      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should call contract via core wallet', async () => {
      const result = await account.core.callContract(
        'cfx:contract123',
        mockAbi,
        'test',
        []
      );
      expect(result).toBe('result');
    });

    it('should call contract via evm wallet', async () => {
      const result = await account.evm.callContract(
        '0x1234567890123456789012345678901234567890',
        mockAbi,
        'test',
        []
      );
      expect(result).toBe('result');
    });

    it('should write to contract via core wallet', async () => {
      const txHash = await account.core.writeContract(
        'cfx:contract123',
        mockAbi,
        'test',
        [],
        undefined
      );
      expect(txHash).toBe('0xwrite123');
    });

    it('should write to contract via evm wallet', async () => {
      const txHash = await account.evm.writeContract(
        '0x1234567890123456789012345678901234567890',
        mockAbi,
        'test',
        [],
        undefined
      );
      expect(txHash).toBe('0xwrite456');
    });
  });
});
