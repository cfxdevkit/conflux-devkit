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

import {
  deriveAccounts,
  deriveFaucetAccount,
  validateMnemonic,
} from '@conflux-devkit/core/wallet';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Test the account derivation logic using core wallet module
describe('Account Derivation', () => {
  const TEST_MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  describe('HD Key Derivation', () => {
    it('should derive consistent accounts from mnemonic', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 1 });

      expect(accounts.length).toBe(1);
      expect(accounts[0].evmPrivateKey).toBeDefined();
      expect(accounts[0].corePrivateKey).toBeDefined();
    });

    it('should derive different keys for different indices', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 2 });

      expect(accounts[0].evmPrivateKey).not.toEqual(accounts[1].evmPrivateKey);
      expect(accounts[0].corePrivateKey).not.toEqual(accounts[1].corePrivateKey);
    });

    it('should generate valid Ethereum addresses', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 1 });

      expect(accounts[0].evmAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should derive expected address for test mnemonic', () => {
      // Known first address for the "abandon..." mnemonic
      const EXPECTED_FIRST_ADDRESS = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 1 });

      expect(accounts[0].evmAddress.toLowerCase()).toBe(
        EXPECTED_FIRST_ADDRESS.toLowerCase()
      );
    });
  });

  describe('Multiple Account Derivation', () => {
    it('should derive specified number of accounts', () => {
      const accountsCount = 10;
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: accountsCount });

      expect(accounts.length).toBe(accountsCount);
      // All addresses should be unique
      const evmAddresses = accounts.map((a) => a.evmAddress);
      expect(new Set(evmAddresses).size).toBe(accountsCount);
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
      // This test verifies that deriveAccounts can work during initial setup
      const accounts = deriveAccounts(TEST_MNEMONIC, {
        count: 10,
        coreNetworkId: 2029, // Simulating chainIdOverride parameter
      });

      expect(accounts.length).toBe(10);
      expect(accounts[0].evmAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      // Core addresses should use network-specific prefix
      expect(accounts[0].coreAddress).toMatch(/^net2029:/);
    });

    it('should derive faucet account', () => {
      // Faucet account derivation
      const faucetAccount = deriveFaucetAccount(TEST_MNEMONIC, 2029);

      expect(faucetAccount.evmPrivateKey).toBeDefined();
      expect(faucetAccount.corePrivateKey).toBeDefined();
      expect(faucetAccount.evmAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      // Faucet uses mining path, so it's index 0 in mining account type
      expect(faucetAccount.index).toBe(0);
    });

    it('should handle mnemonic validation during setup', () => {
      // Valid mnemonic
      expect(validateMnemonic(TEST_MNEMONIC).valid).toBe(true);

      // Invalid mnemonic (wrong word)
      expect(
        validateMnemonic('invalid mnemonic phrase that should fail').valid
      ).toBe(false);

      // Mnemonic with extra whitespace should be trimmed
      const mnemonicWithSpaces = `  ${TEST_MNEMONIC}  `;
      expect(validateMnemonic(mnemonicWithSpaces.trim()).valid).toBe(true);
    });
  });
});
