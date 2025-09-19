// Network utilities

import { getAllNetworks as getAllNetworksFromConstants } from '../constants';
import type { NetworkConfig } from '../types';

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(
  chainId: number
): NetworkConfig | undefined {
  return getAllNetworksFromConstants().find(
    (network) => network.chainId === chainId
  );
}

/**
 * Get network by name
 */
export function getNetworkByName(name: string): NetworkConfig | undefined {
  return getAllNetworksFromConstants().find(
    (network) => network.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get network by EVM chain ID
 */
export function getNetworkByEvmChainId(
  evmChainId: number
): NetworkConfig | undefined {
  return getAllNetworksFromConstants().find(
    (network) => network.evmChainId === evmChainId
  );
}

/**
 * Validate network configuration
 */
export function validateNetworkConfig(config: NetworkConfig): boolean {
  return !!(
    config.name &&
    config.rpcUrl &&
    config.chainId &&
    config.currency &&
    config.currency.name &&
    config.currency.symbol &&
    typeof config.currency.decimals === 'number'
  );
}

/**
 * Check if network is testnet
 */
export function isTestnet(network: NetworkConfig): boolean {
  return network.isTestnet;
}

/**
 * Get network display name
 */
export function getNetworkDisplayName(network: NetworkConfig): string {
  return `${network.name} (${network.isTestnet ? 'Testnet' : 'Mainnet'})`;
}

/**
 * Get all available networks
 */
export function getAllNetworks(): NetworkConfig[] {
  return getAllNetworksFromConstants();
}

/**
 * Get testnet networks only
 */
export function getTestnetNetworks(): NetworkConfig[] {
  return getAllNetworksFromConstants().filter((network) => network.isTestnet);
}

/**
 * Get mainnet networks only
 */
export function getMainnetNetworks(): NetworkConfig[] {
  return getAllNetworksFromConstants().filter((network) => !network.isTestnet);
}
