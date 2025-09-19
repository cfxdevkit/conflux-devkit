// Type normalization utility tests

import { describe, it, expect } from 'vitest';
import {
  normalizeAddress,
  normalizeBigInt,
  normalizeBigIntFormatted,
  normalizeTxHash,
  normalizeBlockNumber,
  toEvmAddress,
  toCoreAddress,
  isEvmAddress,
  isCoreAddress,
  getAddressNetworkType,
  createBrowserSafeObject,
} from '../../../src/utils/type-normalization';
import {
  MOCK_ADDRESSES,
  MOCK_BIGINTS,
  MOCK_TX_HASHES,
  MOCK_BLOCK_NUMBERS,
} from '../../helpers/mock-data';
import {
  expectValidEvmAddress,
  expectValidCoreAddress,
  expectValidBigIntString,
  expectValidTxHash,
  expectValidBlockNumber,
} from '../../helpers/assertions';

describe('Type Normalization Utilities', () => {
  describe('normalizeAddress', () => {
    describe('Core Address Formats', () => {
      it('should handle mainnet Core addresses (CFX:)', () => {
        expect(normalizeAddress('CFX:TYPE.USER:abc123def456')).toBe(
          'CFX:TYPE.USER:abc123def456'
        );
      });

      it('should handle testnet Core addresses (CFXTEST:)', () => {
        expect(normalizeAddress('CFXTEST:TYPE.USER:abc123def456')).toBe(
          'CFXTEST:TYPE.USER:abc123def456'
        );
      });

      it('should handle local Core addresses (NET)', () => {
        expect(normalizeAddress('NET:TYPE.USER:abc123def456')).toBe(
          'NET:TYPE.USER:abc123def456'
        );
      });
    });

    describe('EVM Address Formats', () => {
      it('should handle valid EVM addresses (0x...)', () => {
        expect(
          normalizeAddress('0x1234567890abcdef1234567890abcdef12345678')
        ).toBe('0x1234567890abcdef1234567890abcdef12345678');
      });

      it('should handle short EVM addresses', () => {
        expect(normalizeAddress('0x1234')).toBe('0x1234');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        expect(normalizeAddress('')).toBe('');
      });

      it('should handle invalid formats', () => {
        expect(normalizeAddress('invalid')).toBe('invalid');
      });

      it('should handle null/undefined gracefully', () => {
        expect(normalizeAddress(null as any)).toBe(null);
        expect(normalizeAddress(undefined as any)).toBe(undefined);
      });
    });

    describe('Mock Data Tests', () => {
      it('should normalize all mock EVM addresses', () => {
        expect(normalizeAddress(MOCK_ADDRESSES.evm)).toBe(MOCK_ADDRESSES.evm);
        expectValidEvmAddress(normalizeAddress(MOCK_ADDRESSES.evm));
      });

      it('should normalize all mock Core addresses', () => {
        expect(normalizeAddress(MOCK_ADDRESSES.core)).toBe(MOCK_ADDRESSES.core);
        expect(normalizeAddress(MOCK_ADDRESSES.coreTestnet)).toBe(
          MOCK_ADDRESSES.coreTestnet
        );
        expect(normalizeAddress(MOCK_ADDRESSES.coreLocal)).toBe(
          MOCK_ADDRESSES.coreLocal
        );
        expectValidCoreAddress(normalizeAddress(MOCK_ADDRESSES.core));
      });

      it('should handle invalid addresses', () => {
        expect(normalizeAddress(MOCK_ADDRESSES.invalid)).toBe(
          MOCK_ADDRESSES.invalid
        );
        expect(normalizeAddress(MOCK_ADDRESSES.empty)).toBe(
          MOCK_ADDRESSES.empty
        );
        expect(normalizeAddress(MOCK_ADDRESSES.short)).toBe(
          MOCK_ADDRESSES.short
        );
      });
    });
  });

  describe('normalizeBigInt', () => {
    it('should convert BigInt to string', () => {
      expect(normalizeBigInt(1000000000000000000n)).toBe('1000000000000000000');
    });

    it('should convert string to string', () => {
      expect(normalizeBigInt('1000000000000000000')).toBe(
        '1000000000000000000'
      );
    });

    it('should convert number to string', () => {
      expect(normalizeBigInt(1000000)).toBe('1000000');
    });

    it('should handle zero values', () => {
      expect(normalizeBigInt(0n)).toBe('0');
      expect(normalizeBigInt('0')).toBe('0');
      expect(normalizeBigInt(0)).toBe('0');
    });

    it('should handle negative values', () => {
      expect(normalizeBigInt(-1000n)).toBe('-1000');
      expect(normalizeBigInt('-1000')).toBe('-1000');
      expect(normalizeBigInt(-1000)).toBe('-1000');
    });

    describe('Mock Data Tests', () => {
      it('should normalize all mock BigInt values', () => {
        expect(normalizeBigInt(MOCK_BIGINTS.zero)).toBe('0');
        expect(normalizeBigInt(MOCK_BIGINTS.one)).toBe('1');
        expect(normalizeBigInt(MOCK_BIGINTS.thousand)).toBe('1000');
        expect(normalizeBigInt(MOCK_BIGINTS.million)).toBe('1000000');
        expect(normalizeBigInt(MOCK_BIGINTS.billion)).toBe('1000000000');
        expect(normalizeBigInt(MOCK_BIGINTS.wei)).toBe('1000000000000000000');
        expect(normalizeBigInt(MOCK_BIGINTS.negative)).toBe('-1000');
        expect(normalizeBigInt(MOCK_BIGINTS.max)).toBe(
          MOCK_BIGINTS.max.toString()
        );
        expect(normalizeBigInt(MOCK_BIGINTS.min)).toBe(
          MOCK_BIGINTS.min.toString()
        );
      });

      it('should produce valid BigInt strings', () => {
        const result = normalizeBigInt(MOCK_BIGINTS.wei);
        expectValidBigIntString(result);
        expect(() => BigInt(result)).not.toThrow();
      });
    });
  });

  describe('normalizeBigIntFormatted', () => {
    it('should format BigInt with default decimals', () => {
      const result = normalizeBigIntFormatted(1000000000000000000n);
      expect(result).toBe('1');
    });

    it('should format BigInt with custom decimals', () => {
      const result = normalizeBigIntFormatted(1000000000000000000n, 6);
      expect(result).toBe('1000000000000');
    });

    it('should handle zero values', () => {
      expect(normalizeBigIntFormatted(0n)).toBe('0');
      expect(normalizeBigIntFormatted(0n, 2)).toBe('0');
    });

    it('should handle negative values', () => {
      expect(normalizeBigIntFormatted(-1000000000000000000n)).toBe('-1');
    });
  });

  describe('normalizeTxHash', () => {
    it('should normalize valid transaction hashes', () => {
      expect(
        normalizeTxHash(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        )
      ).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      );
    });

    it('should handle short hashes', () => {
      expect(normalizeTxHash('0x1234')).toBe('0x1234');
    });

    it('should handle invalid hashes', () => {
      expect(normalizeTxHash('invalid')).toBe('invalid');
    });

    describe('Mock Data Tests', () => {
      it('should normalize all mock transaction hashes', () => {
        expect(normalizeTxHash(MOCK_TX_HASHES.valid)).toBe(
          MOCK_TX_HASHES.valid
        );
        expect(normalizeTxHash(MOCK_TX_HASHES.short)).toBe(
          MOCK_TX_HASHES.short
        );
        expect(normalizeTxHash(MOCK_TX_HASHES.invalid)).toBe(
          MOCK_TX_HASHES.invalid
        );
        expect(normalizeTxHash(MOCK_TX_HASHES.empty)).toBe(
          MOCK_TX_HASHES.empty
        );
      });

      it('should produce valid transaction hashes for valid inputs', () => {
        const result = normalizeTxHash(MOCK_TX_HASHES.valid);
        expectValidTxHash(result);
      });
    });
  });

  describe('normalizeBlockNumber', () => {
    it('should normalize BigInt block numbers', () => {
      expect(normalizeBlockNumber(12345n)).toBe('12345');
    });

    it('should normalize string block numbers', () => {
      expect(normalizeBlockNumber('12345')).toBe('12345');
    });

    it('should normalize number block numbers', () => {
      expect(normalizeBlockNumber(12345)).toBe('12345');
    });

    it('should handle zero block number', () => {
      expect(normalizeBlockNumber(0n)).toBe('0');
    });

    describe('Mock Data Tests', () => {
      it('should normalize all mock block numbers', () => {
        expect(normalizeBlockNumber(MOCK_BLOCK_NUMBERS.zero)).toBe('0');
        expect(normalizeBlockNumber(MOCK_BLOCK_NUMBERS.one)).toBe('1');
        expect(normalizeBlockNumber(MOCK_BLOCK_NUMBERS.thousand)).toBe('1000');
        expect(normalizeBlockNumber(MOCK_BLOCK_NUMBERS.million)).toBe(
          '1000000'
        );
        expect(normalizeBlockNumber(MOCK_BLOCK_NUMBERS.max)).toBe(
          MOCK_BLOCK_NUMBERS.max.toString()
        );
      });

      it('should produce valid block numbers', () => {
        const result = normalizeBlockNumber(MOCK_BLOCK_NUMBERS.thousand);
        expectValidBlockNumber(result);
      });
    });
  });

  describe('Address Conversion', () => {
    describe('toEvmAddress', () => {
      it('should convert EVM address to EVM format', () => {
        expect(toEvmAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(
          '0x1234567890abcdef1234567890abcdef12345678'
        );
      });

      it('should throw error for Core addresses', () => {
        expect(() => toEvmAddress('CFX:TYPE.USER:abc123')).toThrow(
          'Cannot convert Core address to EVM format'
        );
      });

      it('should throw error for invalid addresses', () => {
        expect(() => toEvmAddress('invalid')).toThrow();
      });
    });

    describe('toCoreAddress', () => {
      it('should convert Core address to Core format', () => {
        expect(toCoreAddress('CFX:TYPE.USER:abc123def456')).toBe(
          'CFX:TYPE.USER:abc123def456'
        );
      });

      it('should throw error for EVM addresses', () => {
        expect(() =>
          toCoreAddress('0x1234567890abcdef1234567890abcdef12345678')
        ).toThrow('Cannot convert EVM address to Core format');
      });

      it('should throw error for invalid addresses', () => {
        expect(() => toCoreAddress('invalid')).toThrow();
      });
    });
  });

  describe('Address Type Detection', () => {
    describe('isEvmAddress', () => {
      it('should detect valid EVM addresses', () => {
        expect(isEvmAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(
          true
        );
        expect(isEvmAddress('0x1234')).toBe(true);
      });

      it('should reject Core addresses', () => {
        expect(isEvmAddress('CFX:TYPE.USER:abc123')).toBe(false);
        expect(isEvmAddress('CFXTEST:TYPE.USER:abc123')).toBe(false);
        expect(isEvmAddress('NET:TYPE.USER:abc123')).toBe(false);
      });

      it('should reject invalid addresses', () => {
        expect(isEvmAddress('invalid')).toBe(false);
        expect(isEvmAddress('')).toBe(false);
      });
    });

    describe('isCoreAddress', () => {
      it('should detect Core addresses', () => {
        expect(isCoreAddress('CFX:TYPE.USER:abc123')).toBe(true);
        expect(isCoreAddress('CFXTEST:TYPE.USER:abc123')).toBe(true);
        expect(isCoreAddress('NET:TYPE.USER:abc123')).toBe(true);
      });

      it('should reject EVM addresses', () => {
        expect(
          isCoreAddress('0x1234567890abcdef1234567890abcdef12345678')
        ).toBe(false);
        expect(isCoreAddress('0x1234')).toBe(false);
      });

      it('should reject invalid addresses', () => {
        expect(isCoreAddress('invalid')).toBe(false);
        expect(isCoreAddress('')).toBe(false);
      });
    });

    describe('getAddressNetworkType', () => {
      it('should return "evm" for EVM addresses', () => {
        expect(
          getAddressNetworkType('0x1234567890abcdef1234567890abcdef12345678')
        ).toBe('evm');
        expect(getAddressNetworkType('0x1234')).toBe('evm');
      });

      it('should return "core" for Core addresses', () => {
        expect(getAddressNetworkType('CFX:TYPE.USER:abc123')).toBe('core');
        expect(getAddressNetworkType('CFXTEST:TYPE.USER:abc123')).toBe('core');
        expect(getAddressNetworkType('NET:TYPE.USER:abc123')).toBe('core');
      });

      it('should throw error for invalid addresses', () => {
        expect(() => getAddressNetworkType('invalid')).toThrow();
        expect(() => getAddressNetworkType('')).toThrow();
      });
    });
  });

  describe('createBrowserSafeObject', () => {
    it('should convert object with BigInt values to browser-safe format', () => {
      const obj = {
        balance: 1000000000000000000n,
        blockNumber: 12345n,
        gasPrice: 20000000000n,
        name: 'Test',
        count: 42,
      };

      const result = createBrowserSafeObject(obj);

      expect(result).toEqual({
        balance: '1000000000000000000',
        blockNumber: '12345',
        gasPrice: '20000000000',
        name: 'Test',
        count: '42',
      });
    });

    it('should handle nested objects', () => {
      const obj = {
        wallet: {
          balance: 1000000000000000000n,
          address: '0x1234567890abcdef1234567890abcdef12345678',
        },
        transaction: {
          gasUsed: 21000n,
          blockNumber: 12345n,
        },
      };

      const result = createBrowserSafeObject(obj);

      expect(result).toEqual({
        wallet:
          '{"balance":"1000000000000000000","address":"0x1234567890abcdef1234567890abcdef12345678"}',
        transaction: '{"gasUsed":"21000","blockNumber":"12345"}',
      });
    });

    it('should handle arrays with BigInt values', () => {
      const obj = {
        balances: [
          1000000000000000000n,
          2000000000000000000n,
          3000000000000000000n,
        ],
        blockNumbers: [12345n, 12346n, 12347n],
      };

      const result = createBrowserSafeObject(obj);

      expect(result).toEqual({
        balances:
          '["1000000000000000000","2000000000000000000","3000000000000000000"]',
        blockNumbers: '["12345","12346","12347"]',
      });
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = createBrowserSafeObject(obj);
      expect(result).toEqual({});
    });

    it('should handle objects without BigInt values', () => {
      const obj = {
        name: 'Test',
        count: 42,
        active: true,
      };

      const result = createBrowserSafeObject(obj);

      expect(result).toEqual({
        name: 'Test',
        count: '42',
        active: 'true',
      });
    });
  });
});
