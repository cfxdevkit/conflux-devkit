// Type conversion utilities for browser-safe transformations

import type {
  AbiItem,
  ContractCallResult,
  DeploymentResult,
  NetworkConfig,
  WalletInfo,
} from '../types/blockchain';
import type {
  BrowserContractCallResult,
  BrowserContractOrchestrator,
  BrowserDeploymentResult,
  BrowserNetworkConfig,
  BrowserWalletInfo,
} from '../types/browser-safe';

/**
 * Convert bigint to string for browser compatibility
 */
export function bigintToString(value: bigint | undefined | null): string {
  if (value === undefined || value === null) return '0';
  return value.toString();
}

/**
 * Convert string to bigint for internal use
 */
export function stringToBigint(value: string | undefined | null): bigint {
  if (!value || value === '0') return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

/**
 * Convert number to string for browser compatibility
 */
export function numberToString(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0';
  return value.toString();
}

/**
 * Convert WalletInfo to BrowserWalletInfo
 */
export function walletInfoToBrowser(wallet: WalletInfo): BrowserWalletInfo {
  return {
    index: wallet.index,
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic,
    balance: bigintToString(wallet.balance),
    balanceFormatted: wallet.balanceFormatted || bigintToString(wallet.balance),
    isMining: wallet.isMining || false,
    isDefault: false, // Default value
    name: `Wallet ${wallet.index}`, // Generate default name
    network: 'local', // Default network
  };
}

/**
 * Convert NetworkConfig to BrowserNetworkConfig
 */
export function networkConfigToBrowser(
  network: NetworkConfig
): BrowserNetworkConfig {
  return {
    name: network.name,
    rpcUrl: network.rpcUrl,
    chainId: numberToString(network.chainId),
    evmChainId: network.evmChainId
      ? numberToString(network.evmChainId)
      : undefined,
    currency: {
      name: network.currency.name,
      symbol: network.currency.symbol,
      decimals: numberToString(network.currency.decimals),
    },
    isTestnet: network.isTestnet,
    networkType: network.networkType || 'core',
    blockExplorer: network.blockExplorer,
  };
}

/**
 * Convert ContractCallResult to BrowserContractCallResult
 */
export function contractCallResultToBrowser(
  result: ContractCallResult
): BrowserContractCallResult {
  return {
    result: JSON.stringify(result.result),
    gasUsed: bigintToString(result.gasUsed),
    blockNumber: bigintToString(result.blockNumber),
  };
}

/**
 * Convert DeploymentResult to BrowserDeploymentResult
 */
export function deploymentResultToBrowser(
  result: DeploymentResult
): BrowserDeploymentResult {
  return {
    contractName: result.contract,
    address: result.address,
    txHash: result.txHash,
    gasUsed: bigintToString(result.gasUsed),
    timestamp: result.timestamp.toISOString(),
    abi: JSON.stringify([]), // Empty ABI by default
    bytecode: '', // Empty bytecode by default
    deployedBytecode: '', // Empty deployed bytecode by default
    network: result.network,
    chainId: numberToString(result.id ? parseInt(result.id, 10) : 0),
    evmChainId: undefined,
    chainType: 'core', // Default chain type
  };
}

/**
 * Convert ABI to JSON string for browser compatibility
 */
export function abiToString(abi: AbiItem[]): string {
  return JSON.stringify(abi);
}

/**
 * Parse ABI from JSON string
 */
export function abiFromString(abiString: string): AbiItem[] {
  try {
    return JSON.parse(abiString);
  } catch {
    return [];
  }
}

/**
 * Validate browser-safe address format
 */
export function validateBrowserAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Ensure address is in browser-safe format
 */
export function toBrowserAddress(address: string): string {
  if (!validateBrowserAddress(address)) {
    throw new Error(`Invalid address format: ${address}`);
  }
  return address as `0x${string}`;
}

/**
 * Convert any object to browser-safe format by stringifying BigInt values
 */
export function toBrowserSafe<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(toBrowserSafe);
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = toBrowserSafe(value);
    }
    return result;
  }

  return obj;
}

/**
 * Create a minimal BrowserContractOrchestrator for compatibility
 */
export function createMinimalBrowserContractOrchestrator(
  name: string,
  address: string,
  abi: AbiItem[] = [],
  network: BrowserNetworkConfig
): BrowserContractOrchestrator {
  return {
    name,
    address: toBrowserAddress(address),
    abi: abiToString(abi),
    bytecode: '',
    deployedBytecode: '',
    chainType: 'core',
    networkId: network.name,
    chainId: network.chainId,
    evmChainId: network.evmChainId,
    network,
    methods: {
      read: [],
      write: [],
      events: [],
    },
    capabilities: {
      read: false,
      write: false,
      events: false,
    },
  };
}
