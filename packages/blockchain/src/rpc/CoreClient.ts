// Mock Core RPC client implementation - Core functionality disabled for development

import type {
  Block,
  CoreClient as ICoreClient,
  ReadContractParams,
  TransactionReceipt,
  TransactionRequest,
  WriteContractParams,
} from '@conflux-devkit/core';
import { networkManager } from '../network';

export class CoreClient implements ICoreClient {
  private throwNotImplemented(method: string): never {
    throw new Error(
      `CoreClient.${method} is not implemented - Core functionality is disabled for development`
    );
  }

  /**
   * Create Core client using network manager
   */
  static createFromNetworkId(networkId: string): CoreClient {
    const network = networkManager.getNetwork(networkId);
    if (!network) {
      throw new Error(`Network not found: ${networkId}`);
    }
    return new CoreClient();
  }

  static createLocal(): CoreClient {
    const network = networkManager.getLocalNetwork('core');
    if (!network) {
      throw new Error('Core local network not found');
    }
    return new CoreClient();
  }

  static createTestnet(): CoreClient {
    const network = networkManager.getTestnetNetwork('core');
    if (!network) {
      throw new Error('Core testnet network not found');
    }
    return new CoreClient();
  }

  static createMainnet(): CoreClient {
    const network = networkManager.getMainnetNetwork('core');
    if (!network) {
      throw new Error('Core mainnet network not found');
    }
    return new CoreClient();
  }

  // Mock implementations that throw graceful errors
  async getBalance(_params: { address: `0x${string}` }): Promise<bigint> {
    this.throwNotImplemented('getBalance');
  }

  async getBlockNumber(): Promise<bigint> {
    this.throwNotImplemented('getBlockNumber');
  }

  async getBlock(
    _params: { blockNumber: bigint } | { blockTag: 'latest' }
  ): Promise<Block> {
    this.throwNotImplemented('getBlock');
  }

  async getTransactionReceipt(_params: {
    hash: `0x${string}`;
  }): Promise<TransactionReceipt | null> {
    this.throwNotImplemented('getTransactionReceipt');
  }

  async sendTransaction(_params: TransactionRequest): Promise<`0x${string}`> {
    this.throwNotImplemented('sendTransaction');
  }

  async call(_params: {
    to: `0x${string}`;
    data: `0x${string}`;
  }): Promise<`0x${string}`> {
    this.throwNotImplemented('call');
  }

  async getNetworkId(): Promise<number> {
    this.throwNotImplemented('getNetworkId');
  }

  async getGasPrice(): Promise<bigint> {
    this.throwNotImplemented('getGasPrice');
  }

  async readContract(
    _params: ReadContractParams
  ): Promise<string | number | bigint | boolean | `0x${string}` | unknown[]> {
    this.throwNotImplemented('readContract');
  }

  async writeContract(_params: WriteContractParams): Promise<`0x${string}`> {
    this.throwNotImplemented('writeContract');
  }

  async getEpochNumber(): Promise<number> {
    this.throwNotImplemented('getEpochNumber');
  }

  async getChainId(): Promise<number> {
    this.throwNotImplemented('getChainId');
  }

  async estimateGas(_params: TransactionRequest): Promise<bigint> {
    this.throwNotImplemented('estimateGas');
  }
}
