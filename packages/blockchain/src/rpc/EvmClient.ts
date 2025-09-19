// Functional EVM RPC client implementation using viem

import type {
  Block,
  EvmClient as IEvmClient,
  NetworkConfig,
  ReadContractParams,
  TransactionReceipt,
  TransactionRequest,
  WriteContractParams,
} from '@conflux-devkit/core';
import { normalizeAddress, rpcMethods } from '@conflux-devkit/core';
import {
  type Address,
  type CallReturnType,
  createPublicClient,
  createWalletClient,
  http,
  type Block as ViemBlock,
  type TransactionReceipt as ViemTransactionReceipt,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { networkManager } from '../network';

export class EvmClient implements IEvmClient {
  private client: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;

  constructor(network: NetworkConfig, privateKey?: `0x${string}`) {
    // Network config stored for future use

    // Create public client
    this.client = createPublicClient({
      transport: http(network.rpcUrl),
    });

    // Create wallet client if private key provided
    if (privateKey) {
      const account = privateKeyToAccount(privateKey);
      this.walletClient = createWalletClient({
        account,
        transport: http(network.rpcUrl),
      });
    }
  }

  /**
   * Create EVM client using network manager
   */
  static createFromNetworkId(
    networkId: string,
    privateKey?: `0x${string}`
  ): EvmClient {
    const network = networkManager.getNetwork(networkId);
    if (!network) {
      throw new Error(`Network not found: ${networkId}`);
    }
    return new EvmClient(network, privateKey);
  }

  static createLocal(privateKey?: `0x${string}`): EvmClient {
    const network = networkManager.getLocalNetwork('evm');
    if (!network) {
      throw new Error('EVM local network not found');
    }
    return new EvmClient(network, privateKey);
  }

  static createTestnet(privateKey?: `0x${string}`): EvmClient {
    const network = networkManager.getTestnetNetwork('evm');
    if (!network) {
      throw new Error('EVM testnet network not found');
    }
    return new EvmClient(network, privateKey);
  }

  static createMainnet(privateKey?: `0x${string}`): EvmClient {
    const network = networkManager.getMainnetNetwork('evm');
    if (!network) {
      throw new Error('EVM mainnet network not found');
    }
    return new EvmClient(network, privateKey);
  }

  // Functional implementations using viem with RPC caching
  async getBalance(params: { address: `0x${string}` }): Promise<bigint> {
    const normalizedAddress = normalizeAddress(params.address);
    if (!normalizedAddress.startsWith('0x')) {
      throw new Error(`Invalid EVM address format: ${normalizedAddress}`);
    }

    return await rpcMethods.getBalance({ address: normalizedAddress }, () =>
      this.client.getBalance({
        address: normalizedAddress as Address,
      })
    );
  }

  async getBlockNumber(): Promise<bigint> {
    return await rpcMethods.getBlockNumber(() => this.client.getBlockNumber());
  }

  async getBlock(
    params: { blockNumber: bigint } | { blockTag: 'latest' }
  ): Promise<Block> {
    const block = (await rpcMethods.getBlock(params, () =>
      this.client.getBlock(params)
    )) as ViemBlock;
    return {
      number: block.number ? BigInt(block.number.toString()) : null,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: BigInt(block.timestamp.toString()),
      gasLimit: block.gasLimit,
      gasUsed: block.gasUsed,
      // miner: block.miner, // Not in our Block interface
      transactions: [], // Simplified for now
    };
  }

  async getTransactionReceipt(params: {
    hash: `0x${string}`;
  }): Promise<TransactionReceipt | null> {
    const receipt = (await rpcMethods.getTransactionReceipt(
      { hash: params.hash },
      () => this.client.getTransactionReceipt({ hash: params.hash })
    )) as ViemTransactionReceipt | null;
    if (!receipt) return null;

    return {
      transactionHash: receipt.transactionHash as `0x${string}`,
      blockNumber: receipt.blockNumber
        ? BigInt(receipt.blockNumber.toString())
        : null,
      blockHash: receipt.blockHash || '',
      from: receipt.from as `0x${string}`,
      to: receipt.to ? (receipt.to as `0x${string}`) : null,
      gasUsed: receipt.gasUsed,
      status: receipt.status === 'success' ? 'success' : 'reverted',
      contractAddress: receipt.contractAddress
        ? (receipt.contractAddress as `0x${string}`)
        : null,
      transactionIndex: receipt.transactionIndex,
      effectiveGasPrice: receipt.effectiveGasPrice || 0n,
      logs: [], // Simplified for now
    };
  }

  async sendTransaction(_params: TransactionRequest): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized - private key required');
    }

    // Simplified implementation
    throw new Error(
      'sendTransaction not implemented - use viem directly for now'
    );
  }

  async call(params: {
    to: `0x${string}`;
    data: `0x${string}`;
  }): Promise<`0x${string}`> {
    // Direct call without RPC cache for now since viem call returns CallReturnType
    const result = (await this.client.call({
      to: params.to as Address,
      data: params.data,
    })) as CallReturnType;
    return result.data as `0x${string}`;
  }

  async getNetworkId(): Promise<number> {
    return await rpcMethods.getNetworkId(() => this.client.getChainId());
  }

  async getGasPrice(): Promise<bigint> {
    return await rpcMethods.getGasPrice(() => this.client.getGasPrice());
  }

  async readContract(
    params: ReadContractParams
  ): Promise<string | number | bigint | boolean | `0x${string}` | unknown[]> {
    return (await rpcMethods.readContract(
      {
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
      },
      () =>
        this.client.readContract({
          address: params.address as Address,
          abi: params.abi,
          functionName: params.functionName,
          args: params.args,
        })
    )) as string | number | bigint | boolean | `0x${string}` | unknown[];
  }

  async writeContract(_params: WriteContractParams): Promise<`0x${string}`> {
    // Simplified implementation
    throw new Error(
      'writeContract not implemented - use viem directly for now'
    );
  }

  async getChainId(): Promise<number> {
    return await rpcMethods.getChainId(() => this.client.getChainId());
  }

  async estimateGas(params: TransactionRequest): Promise<bigint> {
    return await rpcMethods.estimateGas(
      {
        to: params.to,
        value: params.value,
        data: params.data,
      },
      () =>
        this.client.estimateGas({
          to: params.to as Address,
          value: params.value || 0n,
          data: params.data || '0x',
        })
    );
  }
}
