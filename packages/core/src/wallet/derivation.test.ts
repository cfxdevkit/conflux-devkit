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

import { describe, expect, it } from 'vitest';
import {
  deriveAccount,
  deriveAccounts,
  deriveFaucetAccount,
  generateMnemonic,
  getDerivationPath,
  validateMnemonic,
} from './derivation.js';
import { COIN_TYPES, CORE_NETWORK_IDS } from './types.js';

// Standard BIP-39 test mnemonic (DO NOT use in production!)
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('Wallet Derivation', () => {
  describe('generateMnemonic', () => {
    it('should generate a 12-word mnemonic by default', () => {
      const mnemonic = generateMnemonic();
      const words = mnemonic.split(' ');
      expect(words).toHaveLength(12);
    });

    it('should generate a 24-word mnemonic when strength is 256', () => {
      const mnemonic = generateMnemonic(256);
      const words = mnemonic.split(' ');
      expect(words).toHaveLength(24);
    });

    it('should generate unique mnemonics each time', () => {
      const mnemonic1 = generateMnemonic();
      const mnemonic2 = generateMnemonic();
      expect(mnemonic1).not.toBe(mnemonic2);
    });

    it('generated mnemonics should be valid', () => {
      const mnemonic = generateMnemonic();
      const result = validateMnemonic(mnemonic);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateMnemonic', () => {
    it('should validate a correct 12-word mnemonic', () => {
      const result = validateMnemonic(TEST_MNEMONIC);
      expect(result.valid).toBe(true);
      expect(result.wordCount).toBe(12);
      expect(result.error).toBeUndefined();
    });

    it('should reject mnemonic with wrong word count', () => {
      const result = validateMnemonic('abandon abandon abandon');
      expect(result.valid).toBe(false);
      expect(result.wordCount).toBe(3);
      expect(result.error).toContain('Invalid word count');
    });

    it('should reject mnemonic with invalid checksum', () => {
      const badMnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
      const result = validateMnemonic(badMnemonic);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('checksum');
    });

    it('should handle extra whitespace', () => {
      const mnemonicWithSpaces = `  ${TEST_MNEMONIC}  `;
      const result = validateMnemonic(mnemonicWithSpaces);
      expect(result.valid).toBe(true);
    });

    it('should be case-insensitive', () => {
      const upperMnemonic = TEST_MNEMONIC.toUpperCase();
      const result = validateMnemonic(upperMnemonic);
      expect(result.valid).toBe(true);
    });
  });

  describe('deriveAccounts', () => {
    it('should derive the correct number of accounts', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 5 });
      expect(accounts).toHaveLength(5);
    });

    it('should derive accounts with correct indexes', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 3 });
      expect(accounts[0].index).toBe(0);
      expect(accounts[1].index).toBe(1);
      expect(accounts[2].index).toBe(2);
    });

    it('should derive accounts with Core Space addresses', () => {
      // Local network uses net2029: prefix
      const localAccounts = deriveAccounts(TEST_MNEMONIC, {
        count: 1,
        coreNetworkId: CORE_NETWORK_IDS.LOCAL,
      });
      expect(localAccounts[0].coreAddress).toMatch(/^net2029:/);

      // Mainnet uses cfx: prefix
      const mainnetAccounts = deriveAccounts(TEST_MNEMONIC, {
        count: 1,
        coreNetworkId: CORE_NETWORK_IDS.MAINNET,
      });
      expect(mainnetAccounts[0].coreAddress).toMatch(/^cfx:/);

      // Testnet uses cfxtest: prefix
      const testnetAccounts = deriveAccounts(TEST_MNEMONIC, {
        count: 1,
        coreNetworkId: CORE_NETWORK_IDS.TESTNET,
      });
      expect(testnetAccounts[0].coreAddress).toMatch(/^cfxtest:/);
    });

    it('should derive accounts with eSpace addresses (0x...)', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 1 });
      expect(accounts[0].evmAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should derive accounts with private keys', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 1 });
      expect(accounts[0].corePrivateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(accounts[0].evmPrivateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should include derivation paths', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, { count: 1 });
      expect(accounts[0].paths.core).toBe("m/44'/503'/0'/0/0");
      expect(accounts[0].paths.evm).toBe("m/44'/60'/0'/0/0");
    });

    it('should support custom start index', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, {
        count: 2,
        startIndex: 5,
      });
      expect(accounts[0].index).toBe(5);
      expect(accounts[1].index).toBe(6);
      expect(accounts[0].paths.core).toBe("m/44'/503'/0'/0/5");
    });

    it('should derive consistent addresses for the same mnemonic', () => {
      const accounts1 = deriveAccounts(TEST_MNEMONIC, { count: 3 });
      const accounts2 = deriveAccounts(TEST_MNEMONIC, { count: 3 });

      expect(accounts1[0].coreAddress).toBe(accounts2[0].coreAddress);
      expect(accounts1[0].evmAddress).toBe(accounts2[0].evmAddress);
      expect(accounts1[2].corePrivateKey).toBe(accounts2[2].corePrivateKey);
    });

    it('should use mining account type path when specified', () => {
      const accounts = deriveAccounts(TEST_MNEMONIC, {
        count: 1,
        accountType: 'mining',
      });
      expect(accounts[0].paths.core).toBe("m/44'/503'/1'/0/0");
      expect(accounts[0].paths.evm).toBe("m/44'/60'/1'/0/0");
    });

    it('should derive different addresses for different account types', () => {
      const standard = deriveAccounts(TEST_MNEMONIC, {
        count: 1,
        accountType: 'standard',
      });
      const mining = deriveAccounts(TEST_MNEMONIC, {
        count: 1,
        accountType: 'mining',
      });
      expect(standard[0].coreAddress).not.toBe(mining[0].coreAddress);
      expect(standard[0].evmAddress).not.toBe(mining[0].evmAddress);
    });

    it('should throw error for invalid mnemonic', () => {
      expect(() => {
        deriveAccounts('invalid mnemonic phrase words here', { count: 1 });
      }).toThrow('Invalid mnemonic');
    });

    it('should support different network IDs for Core addresses', () => {
      const localAccounts = deriveAccounts(TEST_MNEMONIC, {
        count: 1,
        coreNetworkId: CORE_NETWORK_IDS.LOCAL,
      });
      const mainnetAccounts = deriveAccounts(TEST_MNEMONIC, {
        count: 1,
        coreNetworkId: CORE_NETWORK_IDS.MAINNET,
      });

      // Same private key, different address encoding
      expect(localAccounts[0].corePrivateKey).toBe(
        mainnetAccounts[0].corePrivateKey
      );
      // Addresses should be different due to network ID in encoding
      expect(localAccounts[0].coreAddress).not.toBe(
        mainnetAccounts[0].coreAddress
      );
    });
  });

  describe('deriveAccount', () => {
    it('should derive a single account at the specified index', () => {
      const account = deriveAccount(TEST_MNEMONIC, 5);
      expect(account.index).toBe(5);
      expect(account.paths.core).toBe("m/44'/503'/0'/0/5");
    });

    it('should match deriveAccounts for the same index', () => {
      const account = deriveAccount(TEST_MNEMONIC, 3);
      const accounts = deriveAccounts(TEST_MNEMONIC, {
        count: 4,
      });
      expect(account.coreAddress).toBe(accounts[3].coreAddress);
      expect(account.evmAddress).toBe(accounts[3].evmAddress);
    });
  });

  describe('deriveFaucetAccount', () => {
    it('should derive account with mining path at index 0', () => {
      const faucet = deriveFaucetAccount(TEST_MNEMONIC);
      expect(faucet.index).toBe(0);
      expect(faucet.paths.core).toBe("m/44'/503'/1'/0/0");
      expect(faucet.paths.evm).toBe("m/44'/60'/1'/0/0");
    });

    it('should derive different address than standard account 0', () => {
      const faucet = deriveFaucetAccount(TEST_MNEMONIC);
      const standard = deriveAccount(TEST_MNEMONIC, 0);
      expect(faucet.coreAddress).not.toBe(standard.coreAddress);
      expect(faucet.evmAddress).not.toBe(standard.evmAddress);
    });

    it('should support custom network ID', () => {
      const localFaucet = deriveFaucetAccount(
        TEST_MNEMONIC,
        CORE_NETWORK_IDS.LOCAL
      );
      const mainnetFaucet = deriveFaucetAccount(
        TEST_MNEMONIC,
        CORE_NETWORK_IDS.MAINNET
      );

      // Same private key, different address encoding
      expect(localFaucet.corePrivateKey).toBe(mainnetFaucet.corePrivateKey);
      expect(localFaucet.coreAddress).not.toBe(mainnetFaucet.coreAddress);
    });
  });

  describe('getDerivationPath', () => {
    it('should generate correct Conflux standard path', () => {
      const path = getDerivationPath(COIN_TYPES.CONFLUX, 0, 'standard');
      expect(path).toBe("m/44'/503'/0'/0/0");
    });

    it('should generate correct Ethereum standard path', () => {
      const path = getDerivationPath(COIN_TYPES.ETHEREUM, 5, 'standard');
      expect(path).toBe("m/44'/60'/0'/0/5");
    });

    it('should generate correct mining path', () => {
      const path = getDerivationPath(COIN_TYPES.CONFLUX, 0, 'mining');
      expect(path).toBe("m/44'/503'/1'/0/0");
    });

    it('should default to standard account type', () => {
      const path = getDerivationPath(COIN_TYPES.ETHEREUM, 10);
      expect(path).toBe("m/44'/60'/0'/0/10");
    });
  });

  describe('COIN_TYPES', () => {
    it('should have correct Conflux coin type', () => {
      expect(COIN_TYPES.CONFLUX).toBe(503);
    });

    it('should have correct Ethereum coin type', () => {
      expect(COIN_TYPES.ETHEREUM).toBe(60);
    });
  });

  describe('CORE_NETWORK_IDS', () => {
    it('should have correct network IDs', () => {
      expect(CORE_NETWORK_IDS.LOCAL).toBe(2029);
      expect(CORE_NETWORK_IDS.TESTNET).toBe(1);
      expect(CORE_NETWORK_IDS.MAINNET).toBe(1029);
    });
  });
});
