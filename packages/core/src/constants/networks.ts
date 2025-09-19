// Network configurations

import type { NetworkConfig } from '../types';

export const DEFAULT_NETWORKS: Record<string, NetworkConfig> = {
  // Core Networks
  'core-local': {
    name: 'Conflux Core Local',
    rpcUrl: 'http://localhost:12537',
    chainId: 2029,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'core',
  },
  'core-testnet': {
    name: 'Conflux Core Testnet',
    rpcUrl: 'https://test.confluxrpc.com',
    chainId: 1,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
    networkType: 'core',
  },
  'core-mainnet': {
    name: 'Conflux Core Mainnet',
    rpcUrl: 'https://main.confluxrpc.com',
    chainId: 1029,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'core',
  },

  // EVM Networks
  'evm-local': {
    name: 'Conflux eSpace Local',
    rpcUrl: 'http://localhost:8545',
    chainId: 2029,
    evmChainId: 2030,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'evm',
  },
  'evm-testnet': {
    name: 'Conflux eSpace Testnet',
    rpcUrl: 'https://evmtestnet.confluxrpc.com',
    chainId: 1,
    evmChainId: 71,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
    networkType: 'evm',
  },
  'evm-mainnet': {
    name: 'Conflux eSpace Mainnet',
    rpcUrl: 'https://evm.confluxrpc.com',
    chainId: 1029,
    evmChainId: 1030,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'evm',
  },
};

// Legacy aliases for backward compatibility
export const LEGACY_NETWORKS: Record<string, NetworkConfig> = {
  local: DEFAULT_NETWORKS['core-local'],
  testnet: DEFAULT_NETWORKS['core-testnet'],
  mainnet: DEFAULT_NETWORKS['core-mainnet'],
};

// Helper functions
export function getNetworkConfig(networkId: string): NetworkConfig {
  return DEFAULT_NETWORKS[networkId] || LEGACY_NETWORKS[networkId];
}

export function getCoreNetworks(): NetworkConfig[] {
  return Object.values(DEFAULT_NETWORKS).filter(
    network => network.networkType === 'core'
  );
}

export function getEvmNetworks(): NetworkConfig[] {
  return Object.values(DEFAULT_NETWORKS).filter(
    network => network.networkType === 'evm'
  );
}

export function getAllNetworks(): NetworkConfig[] {
  return Object.values(DEFAULT_NETWORKS);
}

export const API_ENDPOINTS = {
  WALLET: '/api/wallet',
  TRANSACTION: '/api/transaction',
  CONTRACT: '/api/contract',
  NETWORK: '/api/network',
  NODE: '/api/node',
  HEALTH: '/api/health',
} as const;
