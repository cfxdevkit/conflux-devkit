// Contract deployment implementation for blockchain package

import type {
  ContractDeploymentConfig,
  NetworkConfig,
  TypedDeploymentResult,
} from '@conflux-devkit/core';
import { createContractError } from '@conflux-devkit/core';
import type { CoreClient } from '../rpc/CoreClient';
import { EvmClient } from '../rpc/EvmClient';

export class ContractDeployer {
  private evmClient: EvmClient | null = null;
  private coreClient: CoreClient | null = null;

  constructor(evmClient?: EvmClient, coreClient?: CoreClient) {
    this.evmClient = evmClient || null;
    this.coreClient = coreClient || null;
  }

  /**
   * Deploy contract to EVM network (eSpace)
   */
  async deployEvmContract(
    config: ContractDeploymentConfig,
    networkConfig: NetworkConfig,
    privateKey: `0x${string}`
  ): Promise<TypedDeploymentResult> {
    if (!this.evmClient) {
      throw createContractError('EVM client not initialized', {
        contractName: config.contractName,
      });
    }

    try {
      // Create EVM client with private key for deployment
      const deployClient = new EvmClient(networkConfig, privateKey);

      // Deploy contract using viem
      const hash = await deployClient.writeContract({
        address: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Contract creation
        abi: [], // Will be provided by artifact
        functionName: 'constructor',
        args: config.constructorArgs || [],
        value: config.value || 0n,
      });

      // Wait for transaction receipt
      const receipt = await deployClient.getTransactionReceipt({ hash });
      if (!receipt) {
        throw createContractError('Transaction receipt not found', { hash });
      }

      if (receipt.status !== 'success') {
        throw createContractError('Contract deployment failed', { hash });
      }

      if (!receipt.contractAddress) {
        throw createContractError('Contract address not found in receipt', {
          hash,
        });
      }

      return {
        contractName: config.contractName,
        address: receipt.contractAddress,
        transactionHash: hash,
        blockNumber: receipt.blockNumber || 0n,
        blockHash: receipt.blockHash || '0x0',
        gasUsed: receipt.gasUsed,
        gasPrice: receipt.effectiveGasPrice || 0n,
        abi: [], // Will be filled by deployment manager
        bytecode: '0x', // Will be filled by deployment manager
        deployedBytecode: '0x', // Will be filled by deployment manager
        deployedAt: new Date(),
        network: networkConfig.name,
        networkId: config.networkId,
        chainId: config.chainId,
        evmChainId: networkConfig.evmChainId,
        chainType: 'evm',
        typesGenerated: false,
      };
    } catch (error) {
      throw createContractError('Failed to deploy EVM contract', {
        contractName: config.contractName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Deploy contract to Core network (structured for future implementation)
   */
  async deployCoreContract(
    config: ContractDeploymentConfig,
    _networkConfig: NetworkConfig,
    _privateKey: `0x${string}`
  ): Promise<TypedDeploymentResult> {
    if (!this.coreClient) {
      throw createContractError('Core client not initialized', {
        contractName: config.contractName,
      });
    }

    // Core contract deployment is not yet implemented
    // This is structured for future implementation
    throw createContractError('Core contract deployment not yet implemented', {
      contractName: config.contractName,
      chainType: 'core',
    });
  }

  /**
   * Deploy contract with automatic chain type detection
   */
  async deployContract(
    config: ContractDeploymentConfig,
    networkConfig: NetworkConfig,
    privateKey: `0x${string}`
  ): Promise<TypedDeploymentResult> {
    if (config.chainType === 'evm') {
      return this.deployEvmContract(config, networkConfig, privateKey);
    } else if (config.chainType === 'core') {
      return this.deployCoreContract(config, networkConfig, privateKey);
    } else {
      throw createContractError('Invalid chain type', {
        chainType: config.chainType,
        contractName: config.contractName,
      });
    }
  }

  /**
   * Estimate gas for contract deployment
   */
  async estimateDeploymentGas(
    config: ContractDeploymentConfig,
    _networkConfig: NetworkConfig
  ): Promise<bigint> {
    if (config.chainType === 'evm' && this.evmClient) {
      return await this.evmClient.estimateGas({
        to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        value: config.value || 0n,
        data: config.bytecode || '0x',
        gasLimit: config.gasLimit,
        gasPrice: config.gasPrice,
      });
    } else if (config.chainType === 'core' && this.coreClient) {
      return await this.coreClient.estimateGas({
        // from: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Removed - not in TransactionRequest
        to: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        value: config.value || 0n,
        data: config.bytecode || '0x',
        gasLimit: config.gasLimit,
        gasPrice: config.gasPrice,
      });
    } else {
      throw createContractError('Client not available for gas estimation', {
        chainType: config.chainType,
        contractName: config.contractName,
      });
    }
  }

  /**
   * Get gas price for deployment
   */
  async getDeploymentGasPrice(networkConfig: NetworkConfig): Promise<bigint> {
    if (networkConfig.networkType === 'evm' && this.evmClient) {
      return await this.evmClient.getGasPrice();
    } else if (networkConfig.networkType === 'core' && this.coreClient) {
      return await this.coreClient.getGasPrice();
    } else {
      throw createContractError('Client not available for gas price', {
        networkType: networkConfig.networkType,
      });
    }
  }
}
