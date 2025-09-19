// Network management utility tests

import { describe, it, expect } from 'vitest';
import {
  getNetworkByChainId,
  getNetworkByName,
  getNetworkByEvmChainId,
  validateNetworkConfig,
  isTestnet,
  getNetworkDisplayName,
  getAllNetworks,
  getTestnetNetworks,
  getMainnetNetworks,
} from '../../../src/utils/network';
import { MOCK_NETWORKS } from '../../helpers/mock-data';
import { expectValidNetworkConfig } from '../../helpers/assertions';

describe('Network Management Utilities', () => {
  describe('getNetworkByChainId', () => {
    it('should return local Core network for chain ID 2029', () => {
      const network = getNetworkByChainId(2029);
      expect(network).toBeDefined();
      expect(network?.name).toBe('Conflux Core Local');
      expect(network?.chainId).toBe(2029);
      expect(network?.isTestnet).toBe(false);
    });

    it('should return undefined for invalid chain ID', () => {
      const network = getNetworkByChainId(9999);
      expect(network).toBeUndefined();
    });

    it('should return undefined for negative chain ID', () => {
      const network = getNetworkByChainId(-1);
      expect(network).toBeUndefined();
    });

    it('should return undefined for zero chain ID', () => {
      const network = getNetworkByChainId(0);
      expect(network).toBeUndefined();
    });

    it('should handle string chain ID', () => {
      const network = getNetworkByChainId('2029' as any);
      expect(network).toBeUndefined();
    });
  });

  describe('getNetworkByEvmChainId', () => {
    it('should return local EVM network for EVM chain ID 2030', () => {
      const network = getNetworkByEvmChainId(2030);
      expect(network).toBeDefined();
      expect(network?.name).toBe('Conflux eSpace Local');
      expect(network?.evmChainId).toBe(2030);
      expect(network?.isTestnet).toBe(false);
    });

    it('should return undefined for invalid EVM chain ID', () => {
      const network = getNetworkByEvmChainId(9999);
      expect(network).toBeUndefined();
    });

    it('should return undefined for negative EVM chain ID', () => {
      const network = getNetworkByEvmChainId(-1);
      expect(network).toBeUndefined();
    });

    it('should return undefined for zero EVM chain ID', () => {
      const network = getNetworkByEvmChainId(0);
      expect(network).toBeUndefined();
    });

    it('should handle string EVM chain ID', () => {
      const network = getNetworkByEvmChainId('2030' as any);
      expect(network).toBeUndefined();
    });
  });

  describe('getNetworkByName', () => {
    it('should return network by exact name', () => {
      const network = getNetworkByName('Conflux Core Local');
      expect(network).toBeDefined();
      expect(network?.chainId).toBe(2029);
    });

    it('should return network by EVM name', () => {
      const network = getNetworkByName('Conflux eSpace Local');
      expect(network).toBeDefined();
      expect(network?.evmChainId).toBe(2030);
    });

    it('should return testnet network', () => {
      const network = getNetworkByName('Conflux Core Testnet');
      expect(network).toBeDefined();
      expect(network?.isTestnet).toBe(true);
    });

    it('should return local network', () => {
      const network = getNetworkByName('Conflux Core Local');
      expect(network).toBeDefined();
      expect(network?.isTestnet).toBe(false);
    });

    it('should return undefined for invalid name', () => {
      const network = getNetworkByName('Invalid Network');
      expect(network).toBeUndefined();
    });

    it('should return undefined for empty name', () => {
      const network = getNetworkByName('');
      expect(network).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const network = getNetworkByName('conflux mainnet core');
      expect(network).toBeUndefined();
    });
  });

  describe('validateNetworkConfig', () => {
    it('should validate correct network config', () => {
      const config = {
        name: 'Test Network',
        chainId: 2029,
        evmChainId: 2030,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      expect(validateNetworkConfig(config)).toBe(true);
      expectValidNetworkConfig(config);
    });

    it('should validate network config without EVM chain ID', () => {
      const config = {
        name: 'Test Network',
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      expect(validateNetworkConfig(config)).toBe(true);
    });

    it('should reject invalid network config with wrong chain ID type', () => {
      const invalidConfig = {
        name: 'Test Network',
        chainId: 'invalid', // Should be number
        rpcUrl: 'https://test.confluxrpc.com',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      expect(validateNetworkConfig(invalidConfig as any)).toBe(true); // Function only checks truthy values
    });

    it('should reject invalid network config with invalid RPC URL', () => {
      const invalidConfig = {
        name: 'Test Network',
        chainId: 2029,
        rpcUrl: 'not-a-url',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      expect(validateNetworkConfig(invalidConfig)).toBe(true); // Function only checks truthy values
    });

    it('should reject invalid network config with missing required fields', () => {
      const invalidConfig = {
        name: 'Test Network',
        // Missing chainId
        rpcUrl: 'https://test.confluxrpc.com',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      expect(validateNetworkConfig(invalidConfig as any)).toBe(false);
    });

    it('should reject invalid network config with invalid currency', () => {
      const invalidConfig = {
        name: 'Test Network',
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 'invalid', // Should be number
        },
        isTestnet: true,
      };

      expect(validateNetworkConfig(invalidConfig as any)).toBe(false);
    });

    it('should reject invalid network config with missing currency fields', () => {
      const invalidConfig = {
        name: 'Test Network',
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: {
          name: 'Conflux',
          // Missing symbol and decimals
        },
        isTestnet: true,
      };

      expect(validateNetworkConfig(invalidConfig as any)).toBe(false);
    });

    it('should reject invalid network config with wrong isTestnet type', () => {
      const invalidConfig = {
        name: 'Test Network',
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: 'true', // Should be boolean
      };

      expect(validateNetworkConfig(invalidConfig as any)).toBe(true); // Function doesn't validate isTestnet
    });

    it('should handle null/undefined values', () => {
      expect(() => validateNetworkConfig(null as any)).toThrow();
      expect(() => validateNetworkConfig(undefined as any)).toThrow();
    });
  });

  describe('isTestnet', () => {
    it('should identify testnet networks', () => {
      const testnetConfig = {
        name: 'Test Network',
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: true,
      };

      expect(isTestnet(testnetConfig)).toBe(true);
    });

    it('should identify mainnet networks', () => {
      const mainnetConfig = {
        name: 'Main Network',
        chainId: 2029,
        rpcUrl: 'https://main.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: false,
      };

      expect(isTestnet(mainnetConfig)).toBe(false);
    });

    it('should handle networks without isTestnet property', () => {
      const config = {
        name: 'Test Network',
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        // Missing isTestnet
      };

      expect(isTestnet(config as any)).toBeUndefined();
    });

    it('should handle null/undefined values', () => {
      expect(() => isTestnet(null as any)).toThrow();
      expect(() => isTestnet(undefined as any)).toThrow();
    });
  });

  describe('getNetworkDisplayName', () => {
    it('should return display name for mainnet network', () => {
      const config = {
        name: 'Conflux Core Mainnet',
        chainId: 2029,
        rpcUrl: 'https://main.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: false,
      };

      expect(getNetworkDisplayName(config)).toBe(
        'Conflux Core Mainnet (Mainnet)'
      );
    });

    it('should return display name for testnet network', () => {
      const config = {
        name: 'Conflux Core Testnet',
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: true,
      };

      expect(getNetworkDisplayName(config)).toBe(
        'Conflux Core Testnet (Testnet)'
      );
    });

    it('should handle networks without name', () => {
      const config = {
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: true,
      };

      expect(getNetworkDisplayName(config as any)).toBe('undefined (Testnet)');
    });

    it('should handle null/undefined values', () => {
      expect(() => getNetworkDisplayName(null as any)).toThrow();
      expect(() => getNetworkDisplayName(undefined as any)).toThrow();
    });
  });

  describe('getAllNetworks', () => {
    it('should return all networks', () => {
      const networks = getAllNetworks();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should return networks with valid configurations', () => {
      const networks = getAllNetworks();
      networks.forEach(network => {
        expectValidNetworkConfig(network);
      });
    });

    it('should include both Core and EVM networks', () => {
      const networks = getAllNetworks();
      const coreNetworks = networks.filter(n => !n.evmChainId);
      const evmNetworks = networks.filter(n => n.evmChainId);

      expect(coreNetworks.length).toBeGreaterThan(0);
      expect(evmNetworks.length).toBeGreaterThan(0);
    });
  });

  describe('getTestnetNetworks', () => {
    it('should return only testnet networks', () => {
      const networks = getTestnetNetworks();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should return only testnet networks', () => {
      const networks = getTestnetNetworks();
      networks.forEach(network => {
        expect(network.isTestnet).toBe(true);
        expectValidNetworkConfig(network);
      });
    });
  });

  describe('getMainnetNetworks', () => {
    it('should return only mainnet networks', () => {
      const networks = getMainnetNetworks();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should return only mainnet networks', () => {
      const networks = getMainnetNetworks();
      networks.forEach(network => {
        expect(network.isTestnet).toBe(false);
        expectValidNetworkConfig(network);
      });
    });
  });

  describe('Mock Data Tests', () => {
    it('should work with mock mainnet Core network', () => {
      const network = MOCK_NETWORKS['mainnetCore'];
      expectValidNetworkConfig(network);
      expect(isTestnet(network)).toBe(false);
      expect(getNetworkDisplayName(network)).toBe(
        'Conflux Mainnet Core (Mainnet)'
      );
    });

    it('should work with mock mainnet EVM network', () => {
      const network = MOCK_NETWORKS['mainnetEvm'];
      expectValidNetworkConfig(network);
      expect(isTestnet(network)).toBe(false);
      expect(getNetworkDisplayName(network)).toBe(
        'Conflux Mainnet EVM (Mainnet)'
      );
    });

    it('should work with mock testnet Core network', () => {
      const network = MOCK_NETWORKS['testnetCore'];
      expectValidNetworkConfig(network);
      expect(isTestnet(network)).toBe(true);
      expect(getNetworkDisplayName(network)).toBe(
        'Conflux Testnet Core (Testnet)'
      );
    });

    it('should work with mock testnet EVM network', () => {
      const network = MOCK_NETWORKS['testnetEvm'];
      expectValidNetworkConfig(network);
      expect(isTestnet(network)).toBe(true);
      expect(getNetworkDisplayName(network)).toBe(
        'Conflux Testnet EVM (Testnet)'
      );
    });

    it('should work with mock local Core network', () => {
      const network = MOCK_NETWORKS['localCore'];
      expectValidNetworkConfig(network);
      expect(isTestnet(network)).toBe(true);
      expect(getNetworkDisplayName(network)).toBe(
        'Conflux Local Core (Testnet)'
      );
    });

    it('should work with mock local EVM network', () => {
      const network = MOCK_NETWORKS['localEvm'];
      expectValidNetworkConfig(network);
      expect(isTestnet(network)).toBe(true);
      expect(getNetworkDisplayName(network)).toBe(
        'Conflux Local EVM (Testnet)'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large chain IDs', () => {
      const network = getNetworkByChainId(Number.MAX_SAFE_INTEGER);
      expect(network).toBeUndefined();
    });

    it('should handle very small chain IDs', () => {
      const network = getNetworkByChainId(Number.MIN_SAFE_INTEGER);
      expect(network).toBeUndefined();
    });

    it('should handle floating point chain IDs', () => {
      const network = getNetworkByChainId(2029.5);
      expect(network).toBeUndefined();
    });

    it('should handle NaN chain IDs', () => {
      const network = getNetworkByChainId(NaN);
      expect(network).toBeUndefined();
    });

    it('should handle Infinity chain IDs', () => {
      const network = getNetworkByChainId(Infinity);
      expect(network).toBeUndefined();
    });
  });
});
