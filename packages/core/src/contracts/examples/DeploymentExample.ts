// Example of contract deployment with type generation

import type { NetworkConfig } from '../../types/blockchain';
import type { TypedDeploymentResult } from '../../types/contract-orchestration';
import type { ContractDeploymentConfig } from '../../types/contracts';
import {
  contractArtifactManager,
  contractDeploymentManager,
  wagmiCodegen,
} from '../index';

/**
 * Example: Deploy a contract and generate types
 */
export async function deployContractExample() {
  // 1. Load contract artifact
  const artifactPath = './artifacts/MyContract.json';
  const _artifact = contractArtifactManager.loadArtifact(artifactPath);

  // 2. Create deployment configuration
  const deploymentConfig: ContractDeploymentConfig = {
    contractName: 'MyContract',
    artifactPath,
    constructorArgs: ['Hello World', 42],
    chainType: 'evm', // or 'core'
    networkId: 'evm-mainnet',
    chainId: 1,
  };

  // 3. Network configuration
  const networkConfig: NetworkConfig = {
    name: 'Conflux eSpace Mainnet',
    rpcUrl: 'https://evm.confluxrpc.com',
    chainId: 1029,
    evmChainId: 1030,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'evm',
  };

  // 4. Deploy function (provided by blockchain package)
  const deployFunction = async (_config: ContractDeploymentConfig) => {
    // This would be implemented by the blockchain package
    // using viem for EVM or cive for Core
    return {
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      transactionHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`,
      blockNumber: 12345n,
      blockHash:
        '0x9876543210987654321098765432109876543210987654321098765432109876' as `0x${string}`,
      gasUsed: 1000000n,
      gasPrice: 20000000000n, // 20 gwei
    };
  };

  // 5. Deploy contract
  const result: TypedDeploymentResult =
    await contractDeploymentManager.deployContract(
      deploymentConfig,
      networkConfig,
      deployFunction
    );

  console.log('Contract deployed:', result);
  console.log('Types generated:', result.typesGenerated);

  return result;
}

/**
 * Example: Deploy multiple contracts and generate all types
 */
export async function deployMultipleContractsExample() {
  const contracts = [
    {
      name: 'TokenContract',
      artifactPath: './artifacts/TokenContract.json',
      constructorArgs: ['MyToken', 'MTK', 18],
    },
    {
      name: 'VaultContract',
      artifactPath: './artifacts/VaultContract.json',
      constructorArgs: [],
    },
  ];

  const networkConfig: NetworkConfig = {
    name: 'Conflux eSpace Testnet',
    rpcUrl: 'https://evmtestnet.confluxrpc.com',
    chainId: 1,
    evmChainId: 71,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
    networkType: 'evm',
  };

  const results: TypedDeploymentResult[] = [];

  for (const contract of contracts) {
    const config: ContractDeploymentConfig = {
      contractName: contract.name,
      artifactPath: contract.artifactPath,
      constructorArgs: contract.constructorArgs,
      chainType: 'evm',
      networkId: 'evm-testnet',
      chainId: 1,
    };

    const deployFunction = async (_config: ContractDeploymentConfig) => {
      // Mock deployment function
      return {
        address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        transactionHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
        blockNumber: 1n,
        blockHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
        gasUsed: 1000000n,
        gasPrice: 20000000000n,
      };
    };

    const result = await contractDeploymentManager.deployContract(
      config,
      networkConfig,
      deployFunction
    );

    results.push(result);
  }

  // Generate types for all contracts
  await contractDeploymentManager.generateAllTypes();

  return results;
}

/**
 * Example: Core contract deployment (structured for future implementation)
 */
export async function deployCoreContractExample() {
  const config: ContractDeploymentConfig = {
    contractName: 'CoreContract',
    artifactPath: './artifacts/CoreContract.json',
    constructorArgs: [],
    chainType: 'core',
    networkId: 'core-mainnet',
    chainId: 1029,
  };

  const networkConfig: NetworkConfig = {
    name: 'Conflux Core Mainnet',
    rpcUrl: 'https://main.confluxrpc.com',
    chainId: 1029,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'core',
  };

  // Core deployment is structured but not yet implemented
  const result = await contractDeploymentManager.deployContract(
    config,
    networkConfig
    // No deploy function provided - will return structured result
  );

  console.log('Core contract deployment structured:', result);
  console.log('Implementation status:', result.typeGenerationError);

  return result;
}

/**
 * Example: Watch for contract changes and regenerate types
 */
export async function watchContractTypesExample() {
  // Start watching for changes
  await wagmiCodegen.watchTypes();

  console.log('Watching for contract changes...');
  console.log('Types will be regenerated automatically when contracts change');
}

/**
 * Example: Get deployment status and progress
 */
export function getDeploymentStatusExample(
  contractName: string,
  networkId: string
) {
  const progress = contractDeploymentManager.getDeploymentProgress(
    contractName,
    networkId
  );

  console.log(`Contract: ${progress.contractName}`);
  console.log(`Status: ${progress.status}`);
  console.log(`Progress: ${progress.progress}%`);
  console.log(`Current Step: ${progress.currentStep}`);

  if (progress.error) {
    console.log(`Error: ${progress.error}`);
  }

  return progress;
}
