// Simple NetworkManager tests

import { describe, it, expect } from 'vitest';
import { NetworkManager } from '../../../src/network/NetworkManager';

describe('NetworkManager - Simple Tests', () => {
  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = NetworkManager.getInstance();
      const instance2 = NetworkManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Instance Methods', () => {
    let networkManager: NetworkManager;

    beforeEach(() => {
      networkManager = NetworkManager.getInstance();
    });

    it('should have getNetwork method', () => {
      expect(typeof networkManager.getNetwork).toBe('function');
    });

    it('should have getAllNetworks method', () => {
      expect(typeof networkManager.getAllNetworks).toBe('function');
    });

    it('should have getCoreNetworks method', () => {
      expect(typeof networkManager.getCoreNetworks).toBe('function');
    });

    it('should have getEvmNetworks method', () => {
      expect(typeof networkManager.getEvmNetworks).toBe('function');
    });

    it('should have getMainnetNetworks method', () => {
      expect(typeof networkManager.getMainnetNetworks).toBe('function');
    });

    it('should have getTestnetNetworks method', () => {
      expect(typeof networkManager.getTestnetNetworks).toBe('function');
    });

    it('should have getLocalNetworks method', () => {
      expect(typeof networkManager.getLocalNetworks).toBe('function');
    });

    it('should have getNetworkByChainId method', () => {
      expect(typeof networkManager.getNetworkByChainId).toBe('function');
    });

    it('should have getNetworkByEvmChainId method', () => {
      expect(typeof networkManager.getNetworkByEvmChainId).toBe('function');
    });

    it('should have getMainnetNetwork method', () => {
      expect(typeof networkManager.getMainnetNetwork).toBe('function');
    });

    it('should have getTestnetNetwork method', () => {
      expect(typeof networkManager.getTestnetNetwork).toBe('function');
    });

    it('should have getLocalNetwork method', () => {
      expect(typeof networkManager.getLocalNetwork).toBe('function');
    });
  });

  describe('Network Retrieval', () => {
    let networkManager: NetworkManager;

    beforeEach(() => {
      networkManager = NetworkManager.getInstance();
    });

    it('should return all networks', () => {
      const networks = networkManager.getAllNetworks();

      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should return core networks', () => {
      const networks = networkManager.getCoreNetworks();

      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should return EVM networks', () => {
      const networks = networkManager.getEvmNetworks();

      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should return mainnet networks', () => {
      const networks = networkManager.getMainnetNetworks();

      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should return testnet networks', () => {
      const networks = networkManager.getTestnetNetworks();

      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should return local networks', () => {
      const networks = networkManager.getLocalNetworks();

      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });
  });

  describe('Network Lookup', () => {
    let networkManager: NetworkManager;

    beforeEach(() => {
      networkManager = NetworkManager.getInstance();
    });

    it('should find network by chain ID', () => {
      const network = networkManager.getNetworkByChainId(2029);

      expect(network).toBeDefined();
      expect(network?.chainId).toBe(2029);
    });

    it('should find network by EVM chain ID', () => {
      const network = networkManager.getNetworkByEvmChainId(2030);

      expect(network).toBeDefined();
      expect(network?.evmChainId).toBe(2030);
    });

    it('should return undefined for non-existent chain ID', () => {
      const network = networkManager.getNetworkByChainId(9999);

      expect(network).toBeUndefined();
    });

    it('should return undefined for non-existent EVM chain ID', () => {
      const network = networkManager.getNetworkByEvmChainId(9999);

      expect(network).toBeUndefined();
    });
  });

  describe('Specific Network Types', () => {
    let networkManager: NetworkManager;

    beforeEach(() => {
      networkManager = NetworkManager.getInstance();
    });

    it('should get mainnet core network', () => {
      const network = networkManager.getMainnetNetwork('core');

      expect(network).toBeDefined();
      expect(network?.isTestnet).toBe(false);
      expect(network?.networkType).toBe('core');
    });

    it('should get mainnet EVM network', () => {
      const network = networkManager.getMainnetNetwork('evm');

      expect(network).toBeDefined();
      expect(network?.isTestnet).toBe(false);
      expect(network?.networkType).toBe('evm');
    });

    it('should get testnet core network', () => {
      const network = networkManager.getTestnetNetwork('core');

      expect(network).toBeDefined();
      expect(network?.isTestnet).toBe(true);
      expect(network?.networkType).toBe('core');
    });

    it('should get testnet EVM network', () => {
      const network = networkManager.getTestnetNetwork('evm');

      expect(network).toBeDefined();
      expect(network?.isTestnet).toBe(true);
      expect(network?.networkType).toBe('evm');
    });

    it('should get local core network', () => {
      const network = networkManager.getLocalNetwork('core');

      expect(network).toBeDefined();
      expect(network?.isTestnet).toBe(false);
      expect(network?.networkType).toBe('core');
    });

    it('should get local EVM network', () => {
      const network = networkManager.getLocalNetwork('evm');

      expect(network).toBeDefined();
      expect(network?.isTestnet).toBe(false);
      expect(network?.networkType).toBe('evm');
    });
  });
});
