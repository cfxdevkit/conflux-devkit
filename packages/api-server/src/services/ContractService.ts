// Contract service

import { ContractManager } from '@conflux-devkit/blockchain';
import type {
  AbiItem,
  ContractCallResult,
  ContractInfo,
  NetworkConfig,
} from '@conflux-devkit/core';
import { createContractError } from '@conflux-devkit/core';

export class ContractService {
  private contractManager: ContractManager;

  constructor() {
    this.contractManager = new ContractManager();
  }

  /**
   * Get all contracts
   */
  async getAllContracts(): Promise<ContractInfo[]> {
    try {
      return this.contractManager.getAllContracts();
    } catch (error) {
      throw createContractError('Failed to get contracts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get contract by address
   */
  async getContract(address: `0x${string}`): Promise<ContractInfo | null> {
    try {
      return this.contractManager.getContract(address) || null;
    } catch (error) {
      throw createContractError('Failed to get contract', {
        address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Deploy contract
   */
  async deployContract(
    bytecode: `0x${string}`,
    abi: AbiItem[],
    name: string,
    constructorArgs: unknown[] = []
  ): Promise<ContractInfo> {
    try {
      const network: NetworkConfig = {
        name: 'Local Development',
        rpcUrl: 'http://localhost:8545',
        chainId: 2030,
        evmChainId: 2031,
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      return await this.contractManager.deployContract(
        bytecode,
        abi,
        name,
        network,
        constructorArgs
      );
    } catch (error) {
      throw createContractError('Failed to deploy contract', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Read contract
   */
  async readContract(
    address: `0x${string}`,
    abi: AbiItem[],
    functionName: string,
    args: unknown[] = []
  ): Promise<ContractCallResult> {
    try {
      const network: NetworkConfig = {
        name: 'Local Development',
        rpcUrl: 'http://localhost:8545',
        chainId: 2030,
        evmChainId: 2031,
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      return await this.contractManager.readContract(
        address,
        abi,
        functionName,
        args,
        network
      );
    } catch (error) {
      throw createContractError('Failed to read contract', {
        address,
        functionName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Write contract
   */
  async writeContract(
    address: `0x${string}`,
    abi: AbiItem[],
    functionName: string,
    args: unknown[] = [],
    value: bigint = 0n
  ): Promise<`0x${string}`> {
    try {
      const network: NetworkConfig = {
        name: 'Local Development',
        rpcUrl: 'http://localhost:8545',
        chainId: 2030,
        evmChainId: 2031,
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      return await this.contractManager.writeContract(
        address,
        abi,
        functionName,
        args,
        value,
        network
      );
    } catch (error) {
      throw createContractError('Failed to write contract', {
        address,
        functionName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
