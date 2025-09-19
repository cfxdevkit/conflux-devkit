// RPC client management

import type {
  CoreClient as ICoreClient,
  EvmClient as IEvmClient,
  NetworkConfig,
} from '@conflux-devkit/core';
import { CoreClient } from './CoreClient';
import { EvmClient } from './EvmClient';

export class RpcManager {
  private evmClient: IEvmClient | null = null;
  private coreClient: ICoreClient | null = null;

  /**
   * Initialize RPC clients for a network
   */
  async initializeClients(
    network: NetworkConfig,
    privateKey?: `0x${string}`
  ): Promise<void> {
    try {
      this.evmClient = new EvmClient(network, privateKey);
      this.coreClient = new CoreClient();
    } catch (error) {
      throw new Error(
        `Failed to initialize RPC clients: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get EVM client
   */
  getEvmClient(): IEvmClient {
    if (!this.evmClient) {
      throw new Error('EVM client not initialized');
    }
    return this.evmClient;
  }

  /**
   * Get Core client
   */
  getCoreClient(): ICoreClient {
    if (!this.coreClient) {
      throw new Error('Core client not initialized');
    }
    return this.coreClient;
  }

  /**
   * Check if clients are initialized
   */
  isInitialized(): boolean {
    return this.evmClient !== null && this.coreClient !== null;
  }

  /**
   * Disconnect clients
   */
  disconnect(): void {
    this.evmClient = null;
    this.coreClient = null;
  }
}
