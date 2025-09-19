// Contract deployment manager for both EVM and Core networks

import type {
  ContractDeploymentConfig,
  ContractDeploymentProgress,
  ContractDeploymentStatus,
  NetworkConfig,
  TypedDeploymentResult,
} from '../types/contracts';
import { createContractError } from '../types/errors';
import { ContractArtifactManager } from './ContractArtifactManager';
import { WagmiCodegen } from './WagmiCodegen';

export class ContractDeploymentManager {
  private artifactManager: ContractArtifactManager;
  private codegen: WagmiCodegen;
  private deployments: Map<string, TypedDeploymentResult> = new Map();

  constructor() {
    this.artifactManager = new ContractArtifactManager();
    this.codegen = new WagmiCodegen();
  }

  /**
   * Deploy contract to EVM network (eSpace)
   */
  async deployEvmContract(
    config: ContractDeploymentConfig,
    networkConfig: NetworkConfig,
    deployFunction: (config: ContractDeploymentConfig) => Promise<{
      address: `0x${string}`;
      transactionHash: `0x${string}`;
      blockNumber: bigint;
      blockHash: `0x${string}`;
      gasUsed: bigint;
      gasPrice: bigint;
    }>
  ): Promise<TypedDeploymentResult> {
    try {
      // Load artifact
      const artifact = this.artifactManager.loadArtifact(config.artifactPath);

      // Deploy contract
      const deploymentInfo = await deployFunction(config);

      // Create deployment result
      const result: TypedDeploymentResult = {
        contractName: config.contractName,
        address: deploymentInfo.address,
        transactionHash: deploymentInfo.transactionHash,
        blockNumber: deploymentInfo.blockNumber,
        blockHash: deploymentInfo.blockHash || '0x0',
        gasUsed: deploymentInfo.gasUsed,
        gasPrice: deploymentInfo.gasPrice || 0n,
        chainType: 'evm',
        networkId: config.networkId,
        network: config.networkId,
        chainId: config.chainId,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode,
        deployedAt: new Date(),
        typesGenerated: false,
      };

      // Save deployment info to artifact
      this.artifactManager.saveDeploymentInfo(artifact, config.networkId, {
        ...deploymentInfo,
        chainType: 'evm',
        chainId: networkConfig.chainId,
        evmChainId: networkConfig.evmChainId,
      });

      // Generate types
      try {
        const generatedContract = await this.codegen.generateContractTypes(
          result,
          {
            chainId: networkConfig.evmChainId || networkConfig.chainId,
            evmChainId: networkConfig.evmChainId,
          }
        );

        result.generatedContract = generatedContract;
        result.typesGenerated = true;
      } catch (typeError) {
        result.typesGenerated = false;
        result.typeGenerationError =
          typeError instanceof Error ? typeError.message : 'Unknown error';
      }

      // Cache deployment result
      this.deployments.set(
        `${config.contractName}-${config.networkId}`,
        result
      );

      return result;
    } catch (error) {
      throw createContractError('Failed to deploy EVM contract', {
        contractName: config.contractName,
        networkId: config.networkId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Deploy contract to Core network (structured for future implementation)
   */
  async deployCoreContract(
    config: ContractDeploymentConfig,
    networkConfig: NetworkConfig,
    deployFunction?: (config: ContractDeploymentConfig) => Promise<{
      address: `0x${string}`;
      transactionHash: `0x${string}`;
      blockNumber: bigint;
      blockHash: `0x${string}`;
      gasUsed: bigint;
      gasPrice: bigint;
    }>
  ): Promise<TypedDeploymentResult> {
    try {
      // Load artifact
      const artifact = this.artifactManager.loadArtifact(config.artifactPath);

      if (!deployFunction) {
        // Return structured result for future implementation
        const result: TypedDeploymentResult = {
          contractName: config.contractName,
          address:
            '0x0000000000000000000000000000000000000000' as `0x${string}`,
          transactionHash:
            '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
          blockNumber: 0n,
          blockHash: '0x0',
          gasUsed: 0n,
          gasPrice: 0n,
          chainType: 'core',
          networkId: config.networkId,
          network: config.networkId,
          chainId: config.chainId,
          abi: artifact.abi,
          bytecode: artifact.bytecode,
          deployedBytecode: artifact.deployedBytecode,
          deployedAt: new Date(),
          typesGenerated: false,
          typeGenerationError: 'Core contract deployment not yet implemented',
        };

        return result;
      }

      // Deploy contract (when implementation is ready)
      const deploymentInfo = await deployFunction(config);

      // Create deployment result
      const result: TypedDeploymentResult = {
        contractName: config.contractName,
        address: deploymentInfo.address,
        transactionHash: deploymentInfo.transactionHash,
        blockNumber: deploymentInfo.blockNumber,
        blockHash: deploymentInfo.blockHash || '0x0',
        gasUsed: deploymentInfo.gasUsed,
        gasPrice: deploymentInfo.gasPrice || 0n,
        chainType: 'core',
        networkId: config.networkId,
        network: config.networkId,
        chainId: config.chainId,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode,
        deployedAt: new Date(),
        typesGenerated: false,
      };

      // Save deployment info to artifact
      this.artifactManager.saveDeploymentInfo(artifact, config.networkId, {
        ...deploymentInfo,
        chainType: 'core',
        chainId: networkConfig.chainId,
      });

      // Note: Core contracts don't use wagmi codegen
      // They would use a different type generation system
      result.typesGenerated = false;
      result.typeGenerationError =
        'Core contract type generation not yet implemented';

      // Cache deployment result
      this.deployments.set(
        `${config.contractName}-${config.networkId}`,
        result
      );

      return result;
    } catch (error) {
      throw createContractError('Failed to deploy Core contract', {
        contractName: config.contractName,
        networkId: config.networkId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Deploy contract with automatic chain type detection
   */
  async deployContract(
    config: ContractDeploymentConfig,
    networkConfig: NetworkConfig,
    deployFunction?: (config: ContractDeploymentConfig) => Promise<{
      address: `0x${string}`;
      transactionHash: `0x${string}`;
      blockNumber: bigint;
      blockHash: `0x${string}`;
      gasUsed: bigint;
      gasPrice: bigint;
    }>
  ): Promise<TypedDeploymentResult> {
    if (config.chainType === 'evm') {
      if (!deployFunction) {
        throw createContractError(
          'Deploy function required for EVM contracts',
          {
            contractName: config.contractName,
          }
        );
      }
      return this.deployEvmContract(config, networkConfig, deployFunction);
    } else if (config.chainType === 'core') {
      return this.deployCoreContract(config, networkConfig, deployFunction);
    } else {
      throw createContractError('Invalid chain type', {
        chainType: config.chainType,
        contractName: config.contractName,
      });
    }
  }

  /**
   * Get deployment result
   */
  getDeploymentResult(
    contractName: string,
    networkId: string
  ): TypedDeploymentResult | undefined {
    return this.deployments.get(`${contractName}-${networkId}`);
  }

  /**
   * List all deployment results
   */
  listDeployments(): TypedDeploymentResult[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Get deployment progress
   */
  getDeploymentProgress(
    contractName: string,
    networkId: string
  ): ContractDeploymentProgress {
    const result = this.getDeploymentResult(contractName, networkId);

    if (!result) {
      return {
        contractName,
        status: 'pending',
        progress: 0,
        currentStep: 'Not started',
      };
    }

    let status: ContractDeploymentStatus = 'deployed';
    let progress = 100;
    let currentStep = 'Completed';

    if (!result.typesGenerated) {
      status = result.typeGenerationError
        ? 'type-generation-failed'
        : 'type-generating';
      progress = 80;
      currentStep = 'Generating types...';
    }

    return {
      contractName,
      status,
      progress,
      currentStep,
      result,
    };
  }

  /**
   * Generate types for all deployed contracts
   */
  async generateAllTypes(): Promise<void> {
    const evmDeployments = this.listDeployments().filter(
      (d) => d.chainType === 'evm'
    );

    if (evmDeployments.length === 0) {
      return;
    }

    try {
      await this.codegen.generateMultipleContractTypes(
        evmDeployments.map((deployment) => ({
          deploymentResult: deployment,
          networkConfig: {
            chainId: deployment.chainType === 'evm' ? 1030 : 1029, // Default values
            evmChainId: deployment.chainType === 'evm' ? 1030 : undefined,
          },
        }))
      );
    } catch (error) {
      throw createContractError('Failed to generate types for all contracts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Clear all deployments
   */
  clearDeployments(): void {
    this.deployments.clear();
  }

  /**
   * Get artifact manager
   */
  getArtifactManager(): ContractArtifactManager {
    return this.artifactManager;
  }

  /**
   * Get codegen instance
   */
  getCodegen(): WagmiCodegen {
    return this.codegen;
  }
}

// Export singleton instance
export const contractDeploymentManager = new ContractDeploymentManager();
