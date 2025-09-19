// Network management for blockchain operations
// Centralized network configuration using core package's 6 Conflux network states

import {
  getAllNetworks,
  getCoreNetworks,
  getEvmNetworks,
  type NetworkConfig,
} from '@conflux-devkit/core';

export class NetworkManager {
  private static instance: NetworkManager;
  private networks: Map<string, NetworkConfig> = new Map();

  private constructor() {
    this.initializeNetworks();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  /**
   * Initialize all 6 Conflux network configurations
   */
  private initializeNetworks(): void {
    const allNetworks = getAllNetworks();

    for (const network of allNetworks) {
      const networkId = this.getNetworkId(network);
      this.networks.set(networkId, network);
    }
  }

  /**
   * Get network ID from network configuration
   */
  private getNetworkId(network: NetworkConfig): string {
    // Check if it's a local network first
    if (network.name.toLowerCase().includes('local')) {
      return network.networkType === 'core' ? 'core-local' : 'evm-local';
    }

    if (network.networkType === 'core') {
      return network.isTestnet ? 'core-testnet' : 'core-mainnet';
    } else {
      return network.isTestnet ? 'evm-testnet' : 'evm-mainnet';
    }
  }

  /**
   * Get network configuration by ID
   */
  getNetwork(networkId: string): NetworkConfig | undefined {
    return this.networks.get(networkId);
  }

  /**
   * Get all available networks
   */
  getAllNetworks(): NetworkConfig[] {
    return Array.from(this.networks.values());
  }

  /**
   * Get Core networks only
   */
  getCoreNetworks(): NetworkConfig[] {
    return getCoreNetworks();
  }

  /**
   * Get EVM networks only
   */
  getEvmNetworks(): NetworkConfig[] {
    return getEvmNetworks();
  }

  /**
   * Get network by chain ID
   */
  getNetworkByChainId(chainId: number): NetworkConfig | undefined {
    for (const network of this.networks.values()) {
      if (network.chainId === chainId) {
        return network;
      }
    }
    return undefined;
  }

  /**
   * Get network by EVM chain ID
   */
  getNetworkByEvmChainId(evmChainId: number): NetworkConfig | undefined {
    for (const network of this.networks.values()) {
      if (network.evmChainId === evmChainId) {
        return network;
      }
    }
    return undefined;
  }

  /**
   * Get network by name
   */
  getNetworkByName(name: string): NetworkConfig | undefined {
    for (const network of this.networks.values()) {
      if (network.name.toLowerCase() === name.toLowerCase()) {
        return network;
      }
    }
    return undefined;
  }

  /**
   * Get local development network
   */
  getLocalNetwork(
    networkType: 'core' | 'evm' = 'evm'
  ): NetworkConfig | undefined {
    const networkId = networkType === 'core' ? 'core-local' : 'evm-local';
    return this.getNetwork(networkId);
  }

  /**
   * Get testnet network
   */
  getTestnetNetwork(
    networkType: 'core' | 'evm' = 'evm'
  ): NetworkConfig | undefined {
    const networkId = networkType === 'core' ? 'core-testnet' : 'evm-testnet';
    return this.getNetwork(networkId);
  }

  /**
   * Get mainnet network
   */
  getMainnetNetwork(
    networkType: 'core' | 'evm' = 'evm'
  ): NetworkConfig | undefined {
    const networkId = networkType === 'core' ? 'core-mainnet' : 'evm-mainnet';
    return this.getNetwork(networkId);
  }

  /**
   * Get all mainnet networks
   */
  getMainnetNetworks(): NetworkConfig[] {
    return Array.from(this.networks.values()).filter(
      (network) => !network.isTestnet
    );
  }

  /**
   * Get all testnet networks
   */
  getTestnetNetworks(): NetworkConfig[] {
    return Array.from(this.networks.values()).filter(
      (network) => network.isTestnet
    );
  }

  /**
   * Get all local networks
   */
  getLocalNetworks(): NetworkConfig[] {
    return Array.from(this.networks.values()).filter((network) =>
      network.name.toLowerCase().includes('local')
    );
  }

  /**
   * Validate network configuration
   */
  validateNetwork(network: NetworkConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!network.name) {
      errors.push('Network name is required');
    }

    if (!network.rpcUrl) {
      errors.push('RPC URL is required');
    }

    if (!network.chainId) {
      errors.push('Chain ID is required');
    }

    if (
      !network.currency ||
      !network.currency.name ||
      !network.currency.symbol
    ) {
      errors.push('Currency information is required');
    }

    if (typeof network.isTestnet !== 'boolean') {
      errors.push('isTestnet must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get network display information
   */
  getNetworkDisplayInfo(network: NetworkConfig): {
    id: string;
    name: string;
    type: 'core' | 'evm';
    environment: 'local' | 'testnet' | 'mainnet';
    chainId: number;
    evmChainId?: number;
    rpcUrl: string;
    isTestnet: boolean;
  } {
    const networkId = this.getNetworkId(network);
    const environment = network.isTestnet ? 'testnet' : 'mainnet';

    return {
      id: networkId,
      name: network.name,
      type: network.networkType || 'evm',
      environment: networkId.includes('local') ? 'local' : environment,
      chainId: network.chainId,
      evmChainId: network.evmChainId,
      rpcUrl: network.rpcUrl,
      isTestnet: network.isTestnet,
    };
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance();
