// Node configuration extractor and enricher

import type { ConfluxConfig } from '@xcfx/node';
import type { NodeConfig } from '../types/node';

/**
 * Extract base configuration from @xcfx/node ConfluxConfig
 */
export function extractBaseConfig(
  xcfxConfig: ConfluxConfig
): Partial<NodeConfig> {
  return {
    // Port mappings
    port: xcfxConfig.tcpPort,
    corePort: xcfxConfig.tcpPort,
    ethPort: xcfxConfig.jsonrpcHttpEthPort,
    evmPort: xcfxConfig.jsonrpcHttpEthPort,

    // Network configuration
    chainId: xcfxConfig.chainId,
    evmChainId: xcfxConfig.evmChainId,

    // Data directories
    dataDir: xcfxConfig.confluxDataDir,

    // Mining configuration
    mining: xcfxConfig.miningType !== 'disable',
    miningThreads: 1, // Default, can be configured separately

    // RPC configuration
    rpc: !!(xcfxConfig.jsonrpcHttpPort || xcfxConfig.jsonrpcWsPort),
    rpcPort: xcfxConfig.jsonrpcHttpPort,

    // EVM configuration
    evm: !!(xcfxConfig.jsonrpcHttpEthPort || xcfxConfig.jsonrpcWsEthPort),

    // Logging
    logLevel: xcfxConfig.logLevel as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error'
      | undefined,

    // Development settings
    dev: xcfxConfig.devBlockIntervalMs !== undefined,
    genesis: undefined, // Not directly available in ConfluxConfig
  };
}

/**
 * Enrich base configuration with node-manager specific settings
 */
export function enrichNodeConfig(
  baseConfig: Partial<NodeConfig>,
  overrides: Partial<NodeConfig> = {}
): NodeConfig {
  return {
    // Port configuration with defaults
    port: overrides.port ?? baseConfig.port ?? 12537,
    corePort: overrides.corePort ?? baseConfig.corePort ?? 12537,
    ethPort: overrides.ethPort ?? baseConfig.ethPort ?? 8545,
    evmPort: overrides.evmPort ?? baseConfig.evmPort ?? 8545,

    // Network configuration
    network: overrides.network ?? 'local',
    chainId: overrides.chainId ?? baseConfig.chainId ?? 1029,
    evmChainId: overrides.evmChainId ?? baseConfig.evmChainId ?? 1030,

    // Data and storage
    dataDir: overrides.dataDir ?? baseConfig.dataDir ?? './conflux-data',

    // Mining configuration
    mining: overrides.mining ?? baseConfig.mining ?? false,
    miningThreads: overrides.miningThreads ?? baseConfig.miningThreads ?? 1,

    // RPC configuration
    rpc: overrides.rpc ?? baseConfig.rpc ?? true,
    rpcPort: overrides.rpcPort ?? baseConfig.rpcPort ?? 12539,

    // EVM configuration
    evm: overrides.evm ?? baseConfig.evm ?? true,

    // Logging and debugging
    logLevel: overrides.logLevel ?? baseConfig.logLevel ?? 'info',
    silent: overrides.silent ?? false,

    // Network settings
    maxPeers: overrides.maxPeers ?? 50,
    syncMode: overrides.syncMode ?? 'full',

    // Development settings
    dev: overrides.dev ?? baseConfig.dev ?? false,
    genesis: overrides.genesis,

    // Wallet configuration
    walletMode: overrides.walletMode ?? 'mnemonic',
    mnemonic: overrides.mnemonic,
    privateKey: overrides.privateKey,
    fundWallets: overrides.fundWallets ?? true,
    walletCount: overrides.walletCount ?? 10,

    // Legacy properties
    blockInterval: overrides.blockInterval ?? 1000,
  };
}

/**
 * Create a complete NodeConfig from @xcfx/node ConfluxConfig
 */
export function createNodeConfigFromXcfx(
  xcfxConfig: ConfluxConfig,
  overrides: Partial<NodeConfig> = {}
): NodeConfig {
  const baseConfig = extractBaseConfig(xcfxConfig);
  return enrichNodeConfig(baseConfig, overrides);
}

/**
 * Create default ConfluxConfig for @xcfx/node
 */
export function createDefaultXcfxConfig(): ConfluxConfig {
  return {
    nodeType: 'full',
    blockDbType: 'sqlite',
    chainId: 1029,
    evmChainId: 1030,
    tcpPort: 12537,
    udpPort: 12537,
    jsonrpcHttpPort: 12539,
    jsonrpcHttpEthPort: 8545,
    jsonrpcWsPort: 12540,
    jsonrpcWsEthPort: 8546,
    publicRpcApis: 'all',
    publicEvmRpcApis: 'evm',
    miningType: 'cpu',
    devBlockIntervalMs: 1000,
    logLevel: 'info',
    confluxDataDir: './conflux-data',
  };
}

/**
 * Convert NodeConfig back to ConfluxConfig for @xcfx/node
 */
export function convertToXcfxConfig(nodeConfig: NodeConfig): ConfluxConfig {
  return {
    nodeType: 'full',
    blockDbType: 'sqlite',
    chainId: nodeConfig.chainId,
    evmChainId: nodeConfig.evmChainId,
    tcpPort: nodeConfig.port ?? nodeConfig.corePort,
    udpPort: nodeConfig.port ?? nodeConfig.corePort,
    jsonrpcHttpPort: nodeConfig.rpc ? nodeConfig.rpcPort : undefined,
    jsonrpcHttpEthPort: nodeConfig.evm ? nodeConfig.ethPort : undefined,
    jsonrpcWsPort: nodeConfig.rpc
      ? nodeConfig.rpcPort
        ? nodeConfig.rpcPort + 1
        : undefined
      : undefined,
    jsonrpcWsEthPort: nodeConfig.evm
      ? nodeConfig.ethPort
        ? nodeConfig.ethPort + 1
        : undefined
      : undefined,
    publicRpcApis: 'all',
    publicEvmRpcApis: 'evm',
    miningType: nodeConfig.mining ? 'cpu' : 'disable',
    devBlockIntervalMs: nodeConfig.dev ? nodeConfig.blockInterval : undefined,
    logLevel: nodeConfig.logLevel,
    confluxDataDir: nodeConfig.dataDir,
    devPackTxImmediately: nodeConfig.dev,
  };
}

/**
 * Validate NodeConfig
 */
export function validateNodeConfig(config: NodeConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Port validation
  if (config.port && (config.port < 1024 || config.port > 65535)) {
    errors.push('Port must be between 1024 and 65535');
  }
  if (config.ethPort && (config.ethPort < 1024 || config.ethPort > 65535)) {
    errors.push('EVM port must be between 1024 and 65535');
  }

  // Network validation
  if (
    config.network &&
    !['local', 'testnet', 'mainnet'].includes(config.network)
  ) {
    errors.push('Network must be local, testnet, or mainnet');
  }

  // Chain ID validation
  if (config.chainId && (config.chainId < 1 || config.chainId > 65535)) {
    errors.push('Chain ID must be between 1 and 65535');
  }

  // Log level validation
  if (
    config.logLevel &&
    !['debug', 'info', 'warn', 'error'].includes(config.logLevel)
  ) {
    errors.push('Log level must be debug, info, warn, or error');
  }

  // Wallet validation
  if (
    config.walletMode &&
    !['mnemonic', 'privatekey'].includes(config.walletMode)
  ) {
    errors.push('Wallet mode must be mnemonic or privatekey');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
