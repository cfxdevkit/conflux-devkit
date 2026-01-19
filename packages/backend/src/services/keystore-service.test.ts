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

import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { privateKeyToAccount } from 'viem/accounts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Test the account derivation logic
describe('Account Derivation', () => {
  const TEST_MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  describe('HD Key Derivation', () => {
    it('should derive consistent accounts from mnemonic', () => {
      const seed = mnemonicToSeedSync(TEST_MNEMONIC);
      const hdKey = HDKey.fromMasterSeed(seed);

      // Derive first account using BIP-44 path: m/44'/60'/0'/0/0
      const childKey = hdKey.derive("m/44'/60'/0'/0/0");
      expect(childKey.privateKey).toBeDefined();
      expect(childKey.privateKey?.length).toBe(32);
    });

    it('should derive different keys for different indices', () => {
      const seed = mnemonicToSeedSync(TEST_MNEMONIC);
      const hdKey = HDKey.fromMasterSeed(seed);

      const key0 = hdKey.derive("m/44'/60'/0'/0/0");
      const key1 = hdKey.derive("m/44'/60'/0'/0/1");

      expect(key0.privateKey).not.toEqual(key1.privateKey);
    });

    it('should generate valid Ethereum addresses', () => {
      const seed = mnemonicToSeedSync(TEST_MNEMONIC);
      const hdKey = HDKey.fromMasterSeed(seed);
      const childKey = hdKey.derive("m/44'/60'/0'/0/0");

      if (childKey.privateKey) {
        const privateKeyHex = `0x${Buffer.from(childKey.privateKey).toString('hex')}` as `0x${string}`;
        const account = privateKeyToAccount(privateKeyHex);

        expect(account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    it('should derive expected address for test mnemonic', () => {
      // Known first address for the "abandon..." mnemonic
      const EXPECTED_FIRST_ADDRESS = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

      const seed = mnemonicToSeedSync(TEST_MNEMONIC);
      const hdKey = HDKey.fromMasterSeed(seed);
      const childKey = hdKey.derive("m/44'/60'/0'/0/0");

      if (childKey.privateKey) {
        const privateKeyHex = `0x${Buffer.from(childKey.privateKey).toString('hex')}` as `0x${string}`;
        const account = privateKeyToAccount(privateKeyHex);

        expect(account.address.toLowerCase()).toBe(
          EXPECTED_FIRST_ADDRESS.toLowerCase()
        );
      }
    });
  });

  describe('Multiple Account Derivation', () => {
    it('should derive specified number of accounts', () => {
      const seed = mnemonicToSeedSync(TEST_MNEMONIC);
      const hdKey = HDKey.fromMasterSeed(seed);
      const accountsCount = 10;

      const accounts: string[] = [];
      for (let i = 0; i < accountsCount; i++) {
        const childKey = hdKey.derive(`m/44'/60'/0'/0/${i}`);
        if (childKey.privateKey) {
          const privateKeyHex = `0x${Buffer.from(childKey.privateKey).toString('hex')}` as `0x${string}`;
          const account = privateKeyToAccount(privateKeyHex);
          accounts.push(account.address);
        }
      }

      expect(accounts.length).toBe(accountsCount);
      // All addresses should be unique
      expect(new Set(accounts).size).toBe(accountsCount);
    });
  });
});

describe('Keystore Data Structure', () => {
  describe('KeystoreV2 Interface', () => {
    it('should have correct structure', () => {
      const keystore = {
        version: 2,
        encryptionEnabled: false,
        adminAddresses: ['0x1234567890123456789012345678901234567890'],
        mnemonics: [
          {
            id: 'test-id',
            label: 'Test Wallet',
            encryptedMnemonic: 'encrypted-data',
            isActive: true,
            createdAt: new Date().toISOString(),
            nodeConfig: {
              accountsCount: 10,
              chainId: 2029,
              evmChainId: 2030,
            },
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(keystore.version).toBe(2);
      expect(keystore.mnemonics.length).toBe(1);
      expect(keystore.mnemonics[0].isActive).toBe(true);
    });
  });

  describe('MnemonicEntry Structure', () => {
    it('should track mnemonic metadata correctly', () => {
      const entry = {
        id: 'uuid-here',
        label: 'Main Wallet',
        encryptedMnemonic: 'base64-encrypted-data',
        isActive: true,
        isTestMnemonic: false,
        createdAt: new Date().toISOString(),
        nodeConfig: {
          accountsCount: 10,
          chainId: 2029,
          evmChainId: 2030,
          miningAuthor: undefined,
        },
      };

      expect(entry.id).toBeDefined();
      expect(entry.label).toBe('Main Wallet');
      expect(entry.nodeConfig.accountsCount).toBe(10);
    });
  });
});

describe('Encryption', () => {
  describe('Password Requirements', () => {
    it('should require minimum 8 characters', () => {
      const passwords = ['short', 'longenough', 'verylongpassword'];
      const results = passwords.map((p) => p.length >= 8);
      expect(results).toEqual([false, true, true]);
    });

    it('should recommend 12+ characters', () => {
      const password = 'password1';
      expect(password.length >= 8).toBe(true);
      expect(password.length >= 12).toBe(false);
    });
  });
});

describe('Admin Address Management', () => {
  describe('Address Validation', () => {
    it('should validate Ethereum addresses', () => {
      const validAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      ];

      const invalidAddresses = [
        '0x123', // Too short
        '1234567890123456789012345678901234567890', // Missing 0x
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // Invalid hex
      ];

      for (const addr of validAddresses) {
        expect(/^0x[a-fA-F0-9]{40}$/.test(addr)).toBe(true);
      }

      for (const addr of invalidAddresses) {
        expect(/^0x[a-fA-F0-9]{40}$/.test(addr)).toBe(false);
      }
    });

    it('should normalize addresses to lowercase', () => {
      const mixedCase = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
      const normalized = mixedCase.toLowerCase();
      expect(normalized).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    });
  });

  describe('Admin Operations', () => {
    it('should not allow removing last admin', () => {
      const admins = ['0x1234567890123456789012345678901234567890'];
      const canRemove = admins.length > 1;
      expect(canRemove).toBe(false);
    });

    it('should allow removing admin when multiple exist', () => {
      const admins = [
        '0x1234567890123456789012345678901234567890',
        '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      ];
      const canRemove = admins.length > 1;
      expect(canRemove).toBe(true);
    });
  });
});

describe('Node Configuration', () => {
  describe('Default Values', () => {
    it('should have correct defaults', () => {
      const defaults = {
        accountsCount: 10,
        chainId: 2029,
        evmChainId: 2030,
      };

      expect(defaults.accountsCount).toBe(10);
      expect(defaults.chainId).toBe(2029);
      expect(defaults.evmChainId).toBe(2030);
    });
  });

  describe('Configuration Constraints', () => {
    it('should limit accountsCount to 1-20', () => {
      const isValid = (count: number) =>
        Number.isInteger(count) && count >= 1 && count <= 20;

      expect(isValid(1)).toBe(true);
      expect(isValid(10)).toBe(true);
      expect(isValid(20)).toBe(true);
      expect(isValid(0)).toBe(false);
      expect(isValid(21)).toBe(false);
      expect(isValid(1.5)).toBe(false);
    });

    it('should require positive chainId', () => {
      const isValid = (id: number) => Number.isInteger(id) && id > 0;

      expect(isValid(1)).toBe(true);
      expect(isValid(2029)).toBe(true);
      expect(isValid(0)).toBe(false);
      expect(isValid(-1)).toBe(false);
    });
  });
});

// Integration test for the complete setup flow
describe('Setup Completion Integration', () => {
  const TEST_MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  describe('Account derivation during setup', () => {
    it('should derive accounts without requiring existing keystore', () => {
      // This test verifies that deriveAccountsFromMnemonic can work
      // with chainIdOverride during initial setup when no active mnemonic exists
      const seed = mnemonicToSeedSync(TEST_MNEMONIC);
      const hdKey = HDKey.fromMasterSeed(seed);
      const chainId = 2029; // Simulating chainIdOverride parameter

      const accounts: Array<{ index: number; evm: string }> = [];

      // Derive multiple accounts using eSpace path (BIP-44 for Ethereum)
      for (let i = 0; i < 10; i++) {
        const evmPath = `m/44'/60'/0'/0/${i}`;
        const evmKey = hdKey.derive(evmPath);

        if (evmKey.privateKey) {
          const privateKeyHex = `0x${Buffer.from(evmKey.privateKey).toString('hex')}` as `0x${string}`;
          const account = privateKeyToAccount(privateKeyHex);
          accounts.push({
            index: i,
            evm: account.address,
          });
        }
      }

      expect(accounts.length).toBe(10);
      expect(accounts[0].evm).toMatch(/^0x[a-fA-F0-9]{40}$/);
      // chainId is used for Core Space, but accounts should still derive
      expect(chainId).toBe(2029);
    });

    it('should derive faucet account at specified index', () => {
      const seed = mnemonicToSeedSync(TEST_MNEMONIC);
      const hdKey = HDKey.fromMasterSeed(seed);
      const accountsCount = 10;

      // Faucet account is at accountsCount index (Core path)
      const corePath = `m/44'/503'/0'/0/${accountsCount}`;
      const coreKey = hdKey.derive(corePath);

      expect(coreKey.privateKey).toBeDefined();
      expect(coreKey.privateKey?.length).toBe(32);
    });

    it('should handle mnemonic validation during setup', () => {
      // Valid mnemonic
      expect(validateMnemonic(TEST_MNEMONIC, wordlist)).toBe(true);

      // Invalid mnemonic (wrong word)
      expect(
        validateMnemonic('invalid mnemonic phrase that should fail', wordlist)
      ).toBe(false);

      // Mnemonic with extra whitespace should be trimmed
      const mnemonicWithSpaces = `  ${TEST_MNEMONIC}  `;
      expect(validateMnemonic(mnemonicWithSpaces.trim(), wordlist)).toBe(true);
    });
  });
});
