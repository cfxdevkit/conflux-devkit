// Contract artifact management and extraction

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AbiItem } from '../types/blockchain';
import type {
  ContractArtifact,
  ContractDeploymentConfig,
  ContractNetworkInfo,
  NetworkConfig,
} from '../types/contracts';
import { createContractError } from '../types/errors';

export class ContractArtifactManager {
  private artifacts: Map<string, ContractArtifact> = new Map();

  /**
   * Load contract artifact from file
   */
  loadArtifact(artifactPath: string): ContractArtifact {
    try {
      if (!existsSync(artifactPath)) {
        throw createContractError('Artifact file not found', { artifactPath });
      }

      const artifactContent = readFileSync(artifactPath, 'utf-8');
      const artifact: ContractArtifact = JSON.parse(artifactContent);

      // Validate artifact structure
      this.validateArtifact(artifact);

      // Cache the artifact
      this.artifacts.set(artifact.contractName, artifact);

      return artifact;
    } catch (error) {
      throw createContractError('Failed to load contract artifact', {
        artifactPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get contract artifact by name
   */
  getArtifact(contractName: string): ContractArtifact | undefined {
    return this.artifacts.get(contractName);
  }

  /**
   * Extract contract information for deployment
   */
  extractDeploymentInfo(
    artifact: ContractArtifact,
    _networkConfig: NetworkConfig
  ): {
    abi: AbiItem[];
    bytecode: `0x${string}`;
    deployedBytecode: `0x${string}`;
    constructorArgs: unknown[];
  } {
    return {
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      deployedBytecode: artifact.deployedBytecode,
      constructorArgs: [], // Will be provided during deployment
    };
  }

  /**
   * Save deployment information to artifact
   */
  saveDeploymentInfo(
    artifact: ContractArtifact,
    networkId: string,
    deploymentInfo: {
      address: `0x${string}`;
      transactionHash: `0x${string}`;
      blockNumber: bigint;
      blockHash: `0x${string}`;
      gasUsed: bigint;
      gasPrice: bigint;
      chainType: 'core' | 'evm';
      chainId: number;
      evmChainId?: number;
    }
  ): ContractArtifact {
    const networkInfo: ContractNetworkInfo = {
      address: deploymentInfo.address,
      transactionHash: deploymentInfo.transactionHash,
      blockNumber: Number(deploymentInfo.blockNumber),
      blockHash: deploymentInfo.blockHash,
      gasUsed: deploymentInfo.gasUsed.toString(),
      gasPrice: deploymentInfo.gasPrice.toString(),
      deployedAt: new Date().toISOString(),
      chainType: deploymentInfo.chainType,
      chainId: deploymentInfo.chainId,
      evmChainId: deploymentInfo.evmChainId,
    };

    const updatedArtifact: ContractArtifact = {
      ...artifact,
      networks: {
        ...artifact.networks,
        [networkId]: networkInfo,
      },
      updatedAt: new Date().toISOString(),
    };

    // Update cache
    this.artifacts.set(artifact.contractName, updatedArtifact);

    return updatedArtifact;
  }

  /**
   * Get deployed contract information
   */
  getDeployedContract(
    contractName: string,
    networkId: string
  ): ContractNetworkInfo | undefined {
    const artifact = this.artifacts.get(contractName);
    if (!artifact) {
      return undefined;
    }

    return artifact.networks[networkId];
  }

  /**
   * List all deployed contracts for a network
   */
  getDeployedContracts(networkId: string): Array<{
    contractName: string;
    networkInfo: ContractNetworkInfo;
  }> {
    const deployedContracts: Array<{
      contractName: string;
      networkInfo: ContractNetworkInfo;
    }> = [];

    for (const [contractName, artifact] of this.artifacts) {
      const networkInfo = artifact.networks[networkId];
      if (networkInfo) {
        deployedContracts.push({
          contractName,
          networkInfo,
        });
      }
    }

    return deployedContracts;
  }

  /**
   * Generate contract deployment configuration
   */
  generateDeploymentConfig(
    contractName: string,
    networkConfig: NetworkConfig,
    constructorArgs?: unknown[]
  ): ContractDeploymentConfig {
    const artifact = this.getArtifact(contractName);
    if (!artifact) {
      throw createContractError('Contract artifact not found', {
        contractName,
      });
    }

    return {
      contractName,
      artifactPath: '', // Will be set by caller
      constructorArgs: constructorArgs || [],
      chainType: networkConfig.networkType || 'evm',
      networkId: `${networkConfig.networkType || 'evm'}-${networkConfig.name}`,
      chainId: networkConfig.chainId,
    };
  }

  /**
   * Validate contract artifact structure
   */
  private validateArtifact(artifact: ContractArtifact): void {
    const requiredFields = [
      'contractName',
      'abi',
      'bytecode',
      'deployedBytecode',
      'networks',
    ];

    for (const field of requiredFields) {
      if (!(field in artifact)) {
        throw createContractError('Invalid artifact structure', {
          missingField: field,
          contractName: artifact.contractName,
        });
      }
    }

    if (!Array.isArray(artifact.abi)) {
      throw createContractError('Invalid ABI in artifact', {
        contractName: artifact.contractName,
      });
    }

    if (
      typeof artifact.bytecode !== 'string' ||
      !artifact.bytecode.startsWith('0x')
    ) {
      throw createContractError('Invalid bytecode in artifact', {
        contractName: artifact.contractName,
      });
    }
  }

  /**
   * Get artifact file path for a contract
   */
  getArtifactPath(contractName: string, artifactsDir: string): string {
    return join(artifactsDir, `${contractName}.json`);
  }

  /**
   * List all available artifacts
   */
  listArtifacts(): string[] {
    return Array.from(this.artifacts.keys());
  }

  /**
   * Clear artifact cache
   */
  clearCache(): void {
    this.artifacts.clear();
  }
}

// Export singleton instance
export const contractArtifactManager = new ContractArtifactManager();
