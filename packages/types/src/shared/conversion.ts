// Type conversion utilities between server and client types

import type {
  BaseWalletInfo,
  BaseNetworkConfig,
  BaseContractInfo,
  BaseNodeStatus,
} from '@conflux-devkit/core';

import type {
  ClientWalletInfo,
  ClientNetworkConfig,
  ClientContractInfo,
  ClientContractOrchestrator,
  ClientNodeStatus,
  ClientAddress,
} from '../client';

// ============================================================================
// Type Converter Class
// ============================================================================

export class TypeConverter {
  // ========================================================================
  // Wallet Conversions
  // ========================================================================

  /**
   * Convert server wallet info to client wallet info
   */
  static toClientWalletInfo(
    server: BaseWalletInfo,
    balance: string = '0',
    balanceFormatted: string = '0',
    options: {
      isDefault?: boolean;
      name?: string;
      network?: string;
    } = {}
  ): ClientWalletInfo {
    return {
      ...server,
      address: server.address,
      privateKey: server.privateKey,
      balance,
      balanceFormatted,
      isDefault: options.isDefault ?? false,
      name: options.name,
      network: options.network,
    };
  }

  /**
   * Convert client wallet info to server wallet info
   */
  static toServerWalletInfo(client: ClientWalletInfo): BaseWalletInfo {
    return {
      ...client,
      address: client.address as `0x${string}`,
      privateKey: client.privateKey as `0x${string}`,
    };
  }

  // ========================================================================
  // Network Conversions
  // ========================================================================

  /**
   * Convert server network config to client network config
   */
  static toClientNetworkConfig(server: BaseNetworkConfig): ClientNetworkConfig {
    return {
      ...server,
      chainId: server.chainId.toString(),
      evmChainId: server.evmChainId?.toString(),
      currency: {
        ...server.currency,
        decimals: server.currency.decimals.toString(),
      },
    };
  }

  /**
   * Convert client network config to server network config
   */
  static toServerNetworkConfig(client: ClientNetworkConfig): BaseNetworkConfig {
    return {
      ...client,
      chainId: parseInt(client.chainId, 10),
      evmChainId: client.evmChainId
        ? parseInt(client.evmChainId, 10)
        : undefined,
      currency: {
        ...client.currency,
        decimals: parseInt(client.currency.decimals, 10),
      },
    };
  }

  // ========================================================================
  // Contract Conversions
  // ========================================================================

  /**
   * Convert server contract info to client contract info
   */
  static toClientContractInfo(server: BaseContractInfo): ClientContractInfo {
    return {
      ...server,
      address: server.address,
    };
  }

  /**
   * Convert client contract info to server contract info
   */
  static toServerContractInfo(client: ClientContractInfo): BaseContractInfo {
    return {
      ...client,
      address: client.address as `0x${string}`,
    };
  }

  /**
   * Convert server contract orchestrator to client contract orchestrator
   */
  static toClientContractOrchestrator(
    server: any, // This would be a server contract orchestrator type
    clientNetwork: ClientNetworkConfig
  ): ClientContractOrchestrator {
    return {
      id: server.id,
      name: server.name,
      address: server.address,
      abi: server.abi,
      bytecode: server.bytecode,
      deployedBytecode: server.deployedBytecode || server.bytecode,
      chainType: server.chainType || 'evm',
      networkId: server.networkId,
      chainId: server.chainId?.toString() || '0',
      evmChainId: server.evmChainId?.toString(),
      network: clientNetwork,
      methods: server.methods || {
        read: [],
        write: [],
        events: [],
      },
      capabilities: server.capabilities || {
        read: true,
        write: true,
        events: true,
      },
      metadata: server.metadata,
      deployment: server.deployment,
      types: server.types,
      ui: server.ui,
    };
  }

  // ========================================================================
  // Node Conversions
  // ========================================================================

  /**
   * Convert server node status to client node status
   */
  static toClientNodeStatus(
    server: BaseNodeStatus,
    clientWallets: ClientWalletInfo[] = []
  ): ClientNodeStatus {
    return {
      ...server,
      corePort: server.corePort.toString(),
      evmPort: server.evmPort.toString(),
      chainId: server.chainId.toString(),
      evmChainId: server.evmChainId.toString(),
      blockNumber: server.blockNumber.toString(),
      peerCount: server.peerCount.toString(),
      wallets: clientWallets,
      miningAddress: server.miningAddress,
      lastHealthCheck: server.lastHealthCheck.toISOString(),
    };
  }

  /**
   * Convert client node status to server node status
   */
  static toServerNodeStatus(client: ClientNodeStatus): BaseNodeStatus {
    return {
      ...client,
      corePort: parseInt(client.corePort, 10),
      evmPort: parseInt(client.evmPort, 10),
      chainId: parseInt(client.chainId, 10),
      evmChainId: parseInt(client.evmChainId, 10),
      blockNumber: BigInt(client.blockNumber),
      peerCount: parseInt(client.peerCount, 10),
      wallets: client.wallets.map(w => this.toServerWalletInfo(w)),
      miningAddress: client.miningAddress as `0x${string}` | null,
      lastHealthCheck: new Date(client.lastHealthCheck),
    };
  }

  // ========================================================================
  // Address Conversions
  // ========================================================================

  /**
   * Convert server address to client address
   */
  static toClientAddress(server: `0x${string}`): ClientAddress {
    return server;
  }

  /**
   * Convert client address to server address
   */
  static toServerAddress(client: ClientAddress): `0x${string}` {
    if (!/^0x[a-fA-F0-9]{40}$/.test(client)) {
      throw new Error(`Invalid address format: ${client}`);
    }
    return client as `0x${string}`;
  }

  // ========================================================================
  // Batch Conversions
  // ========================================================================

  /**
   * Convert multiple server wallets to client wallets
   */
  static toClientWallets(
    servers: BaseWalletInfo[],
    balances: string[] = [],
    balanceFormatted: string[] = []
  ): ClientWalletInfo[] {
    return servers.map((server, index) =>
      this.toClientWalletInfo(
        server,
        balances[index] || '0',
        balanceFormatted[index] || '0'
      )
    );
  }

  /**
   * Convert multiple client wallets to server wallets
   */
  static toServerWallets(clients: ClientWalletInfo[]): BaseWalletInfo[] {
    return clients.map(client => this.toServerWalletInfo(client));
  }

  // ========================================================================
  // Validation Helpers
  // ========================================================================

  /**
   * Validate that a value can be converted to client address
   */
  static isValidClientAddress(value: unknown): value is ClientAddress {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
  }

  /**
   * Validate that a value can be converted to server address
   */
  static isValidServerAddress(value: unknown): value is `0x${string}` {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
  }

  /**
   * Safe conversion with error handling
   */
  static safeToClientWalletInfo(
    server: BaseWalletInfo,
    balance: string = '0',
    balanceFormatted: string = '0',
    options: {
      isDefault?: boolean;
      name?: string;
      network?: string;
    } = {}
  ):
    | { success: true; data: ClientWalletInfo }
    | { success: false; error: string } {
    try {
      const result = this.toClientWalletInfo(
        server,
        balance,
        balanceFormatted,
        options
      );
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
