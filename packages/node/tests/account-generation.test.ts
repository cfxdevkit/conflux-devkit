/**
 * Test suite for BIP32/BIP39 account generation
 *
 * Verifies that account generation follows BIP standards correctly
 * and produces expected addresses from known mnemonics.
 */

import { BIP32Factory } from 'bip32';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { privateKeyToAccount } from 'cive/accounts';
import * as ecc from 'tiny-secp256k1';
import { privateKeyToAccount as privateKeyToEvmAccount } from 'viem/accounts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerManager } from '../src/server/index.js';
import type { ServerConfig } from '../src/types/index.js';

// Test vectors from standard BIP39/BIP32 implementations
const TEST_VECTORS = {
  // Standard Hardhat test mnemonic
  HARDHAT_MNEMONIC:
    'test test test test test test test test test test test junk',
  HARDHAT_EXPECTED: {
    // These addresses are what we expect from m/44'/60'/0'/0/0 (Ethereum path)
    EVM_ADDRESS_0: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    PRIVATE_KEY_0:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  // Alternative test mnemonic for validation
  ALT_MNEMONIC:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  ALT_EXPECTED: {
    EVM_ADDRESS_0: '0x9858EfFD232B4033E47d90003D41EC34EcaEda94',
    PRIVATE_KEY_0:
      '0x8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f',
  },
};

describe('Account Generation', () => {
  let serverManager: ServerManager;
  let config: ServerConfig;

  beforeEach(() => {
    config = {
      coreRpcPort: 12537,
      evmRpcPort: 8545,
      wsPort: 12536,
      chainId: 1029, // Use local development chainId like the backend
      evmChainId: 1030,
      accounts: 5,
      balance: '1000000',
      mnemonic: TEST_VECTORS.HARDHAT_MNEMONIC,
      logging: false,
      detached: false,
    };

    serverManager = new ServerManager(config);
  });

  describe('BIP39 Mnemonic Validation', () => {
    it('should validate test mnemonics correctly', () => {
      expect(validateMnemonic(TEST_VECTORS.HARDHAT_MNEMONIC)).toBe(true);
      expect(validateMnemonic(TEST_VECTORS.ALT_MNEMONIC)).toBe(true);
      expect(validateMnemonic('invalid mnemonic phrase')).toBe(false);
    });

    it('should generate valid mnemonics when none provided', () => {
      const mnemonic = generateMnemonic();
      expect(validateMnemonic(mnemonic)).toBe(true);
      expect(mnemonic.split(' ')).toHaveLength(12);
    });
  });

  describe('BIP32 Key Derivation', () => {
    it('should derive correct private keys from test mnemonic using Ethereum path', () => {
      const bip32 = BIP32Factory(ecc);
      const seed = mnemonicToSeedSync(TEST_VECTORS.HARDHAT_MNEMONIC);
      const root = bip32.fromSeed(seed);

      // Test Ethereum derivation path (m/44'/60'/0'/0/0)
      const child = root.derivePath(`m/44'/60'/0'/0/0`);
      expect(child.privateKey).toBeDefined();

      const privateKey = `0x${child.privateKey?.toString('hex')}`;
      expect(privateKey).toBe(TEST_VECTORS.HARDHAT_EXPECTED.PRIVATE_KEY_0);
    });

    it('should derive correct private keys using Conflux path', () => {
      const bip32 = BIP32Factory(ecc);
      const seed = mnemonicToSeedSync(TEST_VECTORS.HARDHAT_MNEMONIC);
      const root = bip32.fromSeed(seed);

      // Test Conflux derivation path (m/44'/503'/0'/0/0)
      const child = root.derivePath(`m/44'/503'/0'/0/0`);
      expect(child.privateKey).toBeDefined();

      const privateKey = `0x${child.privateKey?.toString('hex')}`;
      // This will be different from Ethereum path
      expect(privateKey).not.toBe(TEST_VECTORS.HARDHAT_EXPECTED.PRIVATE_KEY_0);
      expect(privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should generate deterministic accounts from same mnemonic', () => {
      const bip32 = BIP32Factory(ecc);
      const seed = mnemonicToSeedSync(TEST_VECTORS.HARDHAT_MNEMONIC);
      const root = bip32.fromSeed(seed);

      // Generate multiple accounts
      const accounts = [];
      for (let i = 0; i < 3; i++) {
        const child = root.derivePath(`m/44'/503'/0'/0/${i}`);
        accounts.push(`0x${child.privateKey?.toString('hex')}`);
      }

      // Re-generate with same mnemonic
      const seed2 = mnemonicToSeedSync(TEST_VECTORS.HARDHAT_MNEMONIC);
      const root2 = bip32.fromSeed(seed2);

      for (let i = 0; i < 3; i++) {
        const child = root2.derivePath(`m/44'/503'/0'/0/${i}`);
        const privateKey = `0x${child.privateKey?.toString('hex')}`;
        expect(privateKey).toBe(accounts[i]);
      }
    });
  });

  describe('Address Generation', () => {
    it('should generate correct EVM addresses from private keys', () => {
      // Test with known private key
      const evmAccount = privateKeyToEvmAccount(
        TEST_VECTORS.HARDHAT_EXPECTED.PRIVATE_KEY_0 as `0x${string}`
      );
      expect(evmAccount.address).toBe(
        TEST_VECTORS.HARDHAT_EXPECTED.EVM_ADDRESS_0
      );
    });

    it('should generate Core addresses from private keys', () => {
      // Test with local development network (chainId 1029)
      const coreAccount = privateKeyToAccount(
        TEST_VECTORS.HARDHAT_EXPECTED.PRIVATE_KEY_0 as `0x${string}`,
        {
          networkId: 1029,
        }
      );

      // networkId 1029 uses cfx: prefix (mainnet format)
      expect(coreAccount.address).toMatch(/^cfx:[a-z0-9]+$/);
      expect(coreAccount.address).toBeDefined();
    });

    it('should generate consistent addresses across network IDs', () => {
      const privateKey = TEST_VECTORS.HARDHAT_EXPECTED
        .PRIVATE_KEY_0 as `0x${string}`;

      const coreAccount1 = privateKeyToAccount(privateKey, { networkId: 1 });
      const coreAccount1029 = privateKeyToAccount(privateKey, {
        networkId: 1029,
      });

      // Different network IDs should produce different address formats
      expect(coreAccount1.address).not.toBe(coreAccount1029.address);
      expect(coreAccount1.address).toMatch(/^cfxtest:[a-z0-9]+$/); // testnet prefix
      expect(coreAccount1029.address).toMatch(/^cfx:[a-z0-9]+$/); // mainnet prefix
    });
  });

  describe('Server Manager Account Generation', () => {
    it('should generate accounts correctly with test mnemonic', async () => {
      // Access private method for testing (TypeScript hack)
      const generateAccounts = (serverManager as any).generateAccounts.bind(
        serverManager
      );

      // Set the mnemonic
      (serverManager as any).mnemonic = TEST_VECTORS.HARDHAT_MNEMONIC;

      await generateAccounts();

      const accounts = serverManager.getAccounts();
      expect(accounts).toHaveLength(5);

      // Check first account structure
      const firstAccount = accounts[0];
      expect(firstAccount).toMatchObject({
        index: 0,
        privateKey: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        coreAddress: expect.stringMatching(/^cfx:[a-z0-9]+$/), // mainnet prefix for networkId 1029
        evmAddress: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        mnemonic: TEST_VECTORS.HARDHAT_MNEMONIC,
        path: "m/44'/503'/0'/0/0",
      });
    });

    it('should generate mining account with different derivation path', async () => {
      // Access private method for testing
      const generateMiningAccount = (
        serverManager as any
      ).generateMiningAccount.bind(serverManager);

      // Set the mnemonic
      (serverManager as any).mnemonic = TEST_VECTORS.HARDHAT_MNEMONIC;
      (serverManager as any).config = config;

      await generateMiningAccount();

      const miningAccount = (serverManager as any).miningAccount;
      expect(miningAccount).toMatchObject({
        index: -1,
        privateKey: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
        coreAddress: expect.stringMatching(/^cfx:[a-z0-9]+$/), // mainnet prefix for networkId 1029
        evmAddress: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        mnemonic: TEST_VECTORS.HARDHAT_MNEMONIC,
        path: "m/44'/503'/1'/0/0",
      });
    });

    it('should generate accounts from any mnemonic string (BIP39 behavior)', async () => {
      // Note: BIP39 mnemonicToSeedSync() doesn't validate - it generates seeds from any string
      // Validation should be done separately using validateMnemonic()
      const invalidConfig = {
        ...config,
        mnemonic:
          'completely invalid words that are not in bip39 wordlist at all',
      };
      const invalidServerManager = new ServerManager(invalidConfig);

      // This should still work because mnemonicToSeedSync accepts any string
      const generateAccounts = (
        invalidServerManager as any
      ).generateAccounts.bind(invalidServerManager);
      (invalidServerManager as any).mnemonic =
        'completely invalid words that are not in bip39 wordlist at all';
      (invalidServerManager as any).config = invalidConfig;

      // Should not throw - BIP39 allows any string as input to seed generation
      await expect(generateAccounts()).resolves.not.toThrow();

      // But the mnemonic should fail validation
      expect(
        validateMnemonic(
          'completely invalid words that are not in bip39 wordlist at all'
        )
      ).toBe(false);
    });
  });

  describe('Cross-Chain Consistency', () => {
    it('should generate same EVM address from same private key on different chains', () => {
      const privateKey =
        '0x1234567890123456789012345678901234567890123456789012345678901234';

      const evmAccount1 = privateKeyToEvmAccount(privateKey as `0x${string}`);
      const evmAccount2 = privateKeyToEvmAccount(privateKey as `0x${string}`);

      expect(evmAccount1.address).toBe(evmAccount2.address);
    });

    it('should generate different Core addresses for different network IDs', () => {
      const privateKey =
        '0x1234567890123456789012345678901234567890123456789012345678901234';

      const coreAccount1 = privateKeyToAccount(privateKey as `0x${string}`, {
        networkId: 1,
      });
      const coreAccount1029 = privateKeyToAccount(privateKey as `0x${string}`, {
        networkId: 1029,
      });

      expect(coreAccount1.address).not.toBe(coreAccount1029.address);
    });
  });

  describe('Security Considerations', () => {
    it('should not expose private keys in logs or errors', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // Generate accounts
      const generateAccounts = (serverManager as any).generateAccounts.bind(
        serverManager
      );
      (serverManager as any).mnemonic = TEST_VECTORS.HARDHAT_MNEMONIC;

      await generateAccounts();

      // Check that private keys are not logged
      const allLogs = [
        ...consoleLogSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
      ].flat();
      const hasPrivateKeyInLogs = allLogs.some(
        (log) =>
          typeof log === 'string' &&
          log.includes(
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
          )
      );

      expect(hasPrivateKeyInLogs).toBe(false);

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should validate derivation path format', () => {
      const bip32 = BIP32Factory(ecc);
      const seed = mnemonicToSeedSync(TEST_VECTORS.HARDHAT_MNEMONIC);
      const root = bip32.fromSeed(seed);

      // Valid paths should work
      expect(() => root.derivePath(`m/44'/503'/0'/0/0`)).not.toThrow();
      expect(() => root.derivePath(`m/44'/60'/0'/0/0`)).not.toThrow();

      // Invalid paths should throw
      expect(() => root.derivePath(`invalid/path`)).toThrow();
      // Note: BIP32 library may be more permissive than expected, so we test actual invalid formats
      expect(() => root.derivePath(``)).toThrow(); // Empty path
      expect(() => root.derivePath(`not-a-path`)).toThrow(); // Completely invalid
    });
  });

  describe('Performance', () => {
    it('should generate accounts efficiently', async () => {
      const start = performance.now();

      const generateAccounts = (serverManager as any).generateAccounts.bind(
        serverManager
      );
      (serverManager as any).mnemonic = TEST_VECTORS.HARDHAT_MNEMONIC;

      await generateAccounts();

      const end = performance.now();
      const duration = end - start;

      // Should generate 5 accounts in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle large number of accounts', async () => {
      const largeConfig = { ...config, accounts: 100 };
      const largeServerManager = new ServerManager(largeConfig);

      const generateAccounts = (
        largeServerManager as any
      ).generateAccounts.bind(largeServerManager);
      (largeServerManager as any).mnemonic = TEST_VECTORS.HARDHAT_MNEMONIC;

      const start = performance.now();
      await generateAccounts();
      const end = performance.now();

      const accounts = largeServerManager.getAccounts();
      expect(accounts).toHaveLength(100);

      // Should handle 100 accounts in reasonable time (< 1000ms)
      expect(end - start).toBeLessThan(1000);
    });
  });
});

describe('BIP32/BIP39 Standard Compliance', () => {
  it('should follow BIP44 coin type for Conflux (503)', () => {
    // Conflux coin type is 503 according to SLIP-0044
    const expectedPath = `m/44'/503'/0'/0/0`;

    const bip32 = BIP32Factory(ecc);
    const seed = mnemonicToSeedSync(TEST_VECTORS.HARDHAT_MNEMONIC);
    const root = bip32.fromSeed(seed);

    const child = root.derivePath(expectedPath);
    expect(child.privateKey).toBeDefined();
  });

  it('should be compatible with standard BIP39 implementations', () => {
    // Test entropy and checksum validation
    const mnemonic = TEST_VECTORS.HARDHAT_MNEMONIC;

    // Should validate correctly
    expect(validateMnemonic(mnemonic)).toBe(true);

    // Should generate deterministic seed
    const seed1 = mnemonicToSeedSync(mnemonic);
    const seed2 = mnemonicToSeedSync(mnemonic);

    expect(seed1).toEqual(seed2);
    expect(seed1.length).toBe(64); // 512 bits
  });

  it('should support custom derivation paths', () => {
    const bip32 = BIP32Factory(ecc);
    const seed = mnemonicToSeedSync(TEST_VECTORS.HARDHAT_MNEMONIC);
    const root = bip32.fromSeed(seed);

    // Test various derivation paths
    const paths = [
      `m/44'/503'/0'/0/0`, // Conflux standard
      `m/44'/60'/0'/0/0`, // Ethereum standard
      `m/44'/503'/1'/0/0`, // Mining account path
      `m/44'/503'/0'/1/0`, // Different change index
    ];

    const privateKeys = paths.map((path) => {
      const child = root.derivePath(path);
      return `0x${child.privateKey?.toString('hex')}`;
    });

    // All should be different
    const uniqueKeys = new Set(privateKeys);
    expect(uniqueKeys.size).toBe(paths.length);
  });
});
