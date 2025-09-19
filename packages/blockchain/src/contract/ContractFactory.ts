// Contract factory for creating browser-safe contract instances

import type {
  AbiItem,
  ContractEvent,
  ContractMethod,
  ContractOrchestrator,
  BrowserContractOrchestrator as CoreBrowserContractOrchestrator,
  NetworkConfig,
} from '@conflux-devkit/core';
import { createContractError } from '@conflux-devkit/core';
import { CoreClient } from '../rpc/CoreClient';
import { EvmClient } from '../rpc/EvmClient';
import { browserContractManager } from './BrowserContractManager';
import type { BrowserContractWrapper } from './BrowserContractWrapper';
import type { BrowserContractOrchestrator } from './types';

/**
 * Create contract wrapper from orchestrator
 */
export function createContract(
  orchestrator: ContractOrchestrator,
  networkConfig: NetworkConfig,
  privateKey?: `0x${string}`
): BrowserContractWrapper {
  try {
    let evmClient: EvmClient | undefined;
    let coreClient: CoreClient | undefined;

    // Create appropriate client based on chain type
    if (orchestrator.chainType === 'evm') {
      evmClient = new EvmClient(networkConfig, privateKey);
    } else if (orchestrator.chainType === 'core') {
      coreClient = new CoreClient();
    }

    // Register contract with manager
    const wrapper = browserContractManager.registerContract(
      orchestrator,
      evmClient,
      coreClient
    );

    return wrapper;
  } catch (error) {
    throw createContractError('Failed to create contract', {
      contractId: orchestrator.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Create contract from address and ABI
 */
export function createContractFromAddress(
  address: `0x${string}`,
  abi: AbiItem[],
  networkConfig: NetworkConfig,
  contractName: string = 'UnknownContract',
  privateKey?: `0x${string}`
): BrowserContractWrapper {
  try {
    // Create a basic orchestrator from address and ABI
    const orchestrator: ContractOrchestrator = {
      id: `${contractName}-${address}`,
      name: contractName,
      address,
      deployment: {
        transactionHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 0n,
        gasUsed: 0n,
        deployedAt: new Date(),
        isVerified: false,
      },
      abi,
      bytecode: '0x',
      deployedBytecode: '0x',
      chainType: networkConfig.networkType || 'evm',
      networkId: networkConfig.chainId.toString(),
      chainId: networkConfig.chainId,
      evmChainId: networkConfig.evmChainId,
      network: {
        name: networkConfig.name,
        rpcUrl: networkConfig.rpcUrl,
        isTestnet: networkConfig.isTestnet,
        blockExplorer: networkConfig.blockExplorer,
        currency: {
          name: networkConfig.currency.name,
          symbol: networkConfig.currency.symbol,
          decimals: networkConfig.currency.decimals,
        },
      },
      metadata: {
        name: contractName,
        version: '1.0.0',
        author: 'Conflux DevKit',
        license: 'MIT',
        description: 'Smart contract deployed on Conflux network',
        tags: [],
        category: 'custom',
      },
      methods: {
        read: [],
        write: [],
        events: [],
        constructor: null,
      },
      capabilities: {
        canRead: false,
        canWrite: false,
        canReceive: false,
        canFallback: false,
        hasEvents: false,
        isUpgradeable: false,
        isPausable: false,
        isOwnable: false,
      },
      types: {
        generated: false,
      },
      ui: {
        displayName: contractName,
        description: 'Smart contract deployed on Conflux network',
        category: 'Smart Contract',
        tags: [],
        isActive: true,
        usageCount: 0,
      },
    };

    // Extract contract interface from ABI
    extractContractInterface(orchestrator, abi);

    return createContract(orchestrator, networkConfig, privateKey);
  } catch (error) {
    throw createContractError('Failed to create contract from address', {
      address,
      contractName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Create contract from deployment result
 */
export function createContractFromDeployment(
  deploymentResult: {
    contractName: string;
    address: `0x${string}`;
    transactionHash: `0x${string}`;
    blockNumber: bigint;
    blockHash: `0x${string}`;
    gasUsed: bigint;
    gasPrice: bigint;
    abi: AbiItem[];
    bytecode: `0x${string}`;
    deployedBytecode: `0x${string}`;
    deployedAt: Date;
    network: string;
    networkId: string;
    chainId: number;
    evmChainId?: number;
    chainType: 'core' | 'evm';
    typesGenerated: boolean;
    generatedContract?: Record<string, unknown>;
    constructorArgs: unknown[];
  },
  networkConfig: NetworkConfig,
  privateKey?: `0x${string}`
): BrowserContractWrapper {
  try {
    const orchestrator: ContractOrchestrator = {
      id: `${deploymentResult.contractName}-${deploymentResult.address}`,
      name: deploymentResult.contractName,
      address: deploymentResult.address,
      chainType: deploymentResult.chainType,
      networkId: deploymentResult.networkId,
      chainId: deploymentResult.chainId,
      evmChainId: deploymentResult.evmChainId,
      network: {
        name: deploymentResult.network,
        rpcUrl: networkConfig.rpcUrl,
        isTestnet: networkConfig.isTestnet,
        blockExplorer: networkConfig.blockExplorer,
        currency: {
          name: networkConfig.currency.name,
          symbol: networkConfig.currency.symbol,
          decimals: networkConfig.currency.decimals,
        },
      },
      metadata: {
        name: deploymentResult.contractName,
        version: '1.0.0',
        author: 'Conflux DevKit',
        license: 'MIT',
        description: 'Smart contract deployed on Conflux network',
        tags: [],
        category: 'custom',
      },
      abi: deploymentResult.abi,
      bytecode: deploymentResult.bytecode,
      deployedBytecode: deploymentResult.deployedBytecode,
      methods: {
        read: [],
        write: [],
        events: [],
        constructor: null,
      },
      deployment: {
        transactionHash: deploymentResult.transactionHash,
        blockNumber: deploymentResult.blockNumber,
        gasUsed: deploymentResult.gasUsed,
        deployedAt: deploymentResult.deployedAt,
        isVerified: false,
      },
      types: {
        generated: deploymentResult.typesGenerated,
        generatedTypes: deploymentResult.generatedContract,
      },
      ui: {
        displayName: deploymentResult.contractName,
        description: 'Smart contract deployed on Conflux network',
        category: 'Smart Contract',
        tags: [],
        isActive: true,
        usageCount: 0,
      },
      capabilities: {
        canRead: false,
        canWrite: false,
        canReceive: false,
        canFallback: false,
        hasEvents: false,
        isUpgradeable: false,
        isPausable: false,
        isOwnable: false,
      },
    };

    // Extract contract interface from ABI
    extractContractInterface(orchestrator, deploymentResult.abi);

    return createContract(orchestrator, networkConfig, privateKey);
  } catch (error) {
    throw createContractError('Failed to create contract from deployment', {
      contractName: deploymentResult.contractName,
      address: deploymentResult.address,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get contract by address
 */
export function getContract(
  address: `0x${string}`
): BrowserContractWrapper | undefined {
  return browserContractManager.getContract(address);
}

/**
 * Convert blockchain BrowserContractOrchestrator to core BrowserContractOrchestrator
 */
function toCoreBrowserContractOrchestrator(
  contract: BrowserContractOrchestrator
): CoreBrowserContractOrchestrator {
  return {
    name: contract.name,
    address: contract.address,
    abi: JSON.stringify(contract.abi), // Convert ABI to string
    bytecode: contract.bytecode,
    deployedBytecode: contract.deployedBytecode,
    chainType: contract.chainType,
    networkId: contract.networkId,
    chainId: contract.chainId.toString(), // Convert to string
    evmChainId: contract.evmChainId?.toString(),
    network: {
      name: contract.network.name,
      rpcUrl: contract.network.rpcUrl,
      chainId: contract.chainId.toString(),
      evmChainId: contract.evmChainId?.toString(),
      currency: {
        name: contract.network.currency.name,
        symbol: contract.network.currency.symbol,
        decimals: contract.network.currency.decimals.toString(),
      },
      isTestnet: contract.network.isTestnet,
      networkType: contract.chainType,
    },
    methods: {
      read: contract.methods.read
        .map((m) => (typeof m === 'string' ? m : (m as any)?.name || ''))
        .filter(Boolean),
      write: contract.methods.write
        .map((m) => (typeof m === 'string' ? m : (m as any)?.name || ''))
        .filter(Boolean),
      events: contract.methods.events
        .map((e) => (typeof e === 'string' ? e : (e as any)?.name || ''))
        .filter(Boolean),
    },
    capabilities: {
      read:
        contract.capabilities.canRead || contract.capabilities.read || false,
      write:
        contract.capabilities.canWrite || contract.capabilities.write || false,
      events:
        contract.capabilities.hasEvents ||
        contract.capabilities.events ||
        false,
    },
  };
}

/**
 * Get all contracts
 */
export function getAllContracts(): CoreBrowserContractOrchestrator[] {
  return browserContractManager
    .getAllContracts()
    .map(toCoreBrowserContractOrchestrator);
}

/**
 * Remove contract by address
 */
export function removeContract(address: `0x${string}`): boolean {
  return browserContractManager.removeContract(address);
}

/**
 * Clear all contracts
 */
export function clearAllContracts(): void {
  browserContractManager.clearAllContracts();
}

/**
 * Extract contract interface from ABI
 */
function extractContractInterface(
  orchestrator: ContractOrchestrator,
  abi: AbiItem[]
): void {
  const methods: ContractMethod[] = [];
  const events: ContractEvent[] = [];
  let contractConstructor: ContractMethod | null = null;

  for (const item of abi) {
    if (item.type === 'function') {
      const method: ContractMethod = {
        name: item.name || 'unnamed',
        type: 'function',
        stateMutability: (item.stateMutability || 'nonpayable') as
          | 'pure'
          | 'view'
          | 'nonpayable'
          | 'payable',
        inputs: item.inputs || [],
        outputs: item.outputs || [],
        category: categorizeMethod(item),
        gasEstimate: undefined,
        isPayable: item.stateMutability === 'payable',
        isView: item.stateMutability === 'view',
        isPure: item.stateMutability === 'pure',
      };

      if (method.category === 'read') {
        methods.push(method);
      } else if (method.category === 'write') {
        methods.push(method);
      }
    } else if (item.type === 'event') {
      const event: ContractEvent = {
        name: item.name || 'unnamed',
        inputs: (item.inputs || []).map((input) => ({
          name: input.name || 'unnamed',
          type: input.type,
          indexed: input.indexed || false,
          internalType: input.internalType,
        })),
        anonymous: item.anonymous || false,
        category: categorizeEvent(item),
      };
      events.push(event);
    } else if (item.type === 'constructor') {
      contractConstructor = {
        name: 'constructor',
        type: 'constructor',
        stateMutability: 'nonpayable',
        inputs: item.inputs || [],
        outputs: [],
        category: 'constructor',
        gasEstimate: undefined,
        isPayable: false,
        isView: false,
        isPure: false,
      };
    }
  }

  // Categorize methods
  const readMethods = methods.filter((m) => m.category === 'read');
  const writeMethods = methods.filter((m) => m.category === 'write');

  // Update orchestrator
  orchestrator.methods = {
    read: readMethods,
    write: writeMethods,
    events,
    constructor: contractConstructor,
  };

  orchestrator.capabilities = {
    canRead: readMethods.length > 0,
    canWrite: writeMethods.length > 0,
    canReceive: abi.some((item) => item.type === 'receive'),
    canFallback: abi.some((item) => item.type === 'fallback'),
    hasEvents: events.length > 0,
    isUpgradeable: abi.some(
      (item) => item.name === 'upgrade' || item.name === 'implementation'
    ),
    isPausable: abi.some(
      (item) => item.name === 'pause' || item.name === 'unpause'
    ),
    isOwnable: abi.some(
      (item) => item.name === 'owner' || item.name === 'transferOwnership'
    ),
  };
}

/**
 * Categorize method based on name and state mutability
 */
function categorizeMethod(
  item: AbiItem
): 'read' | 'write' | 'event' | 'constructor' {
  if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
    return 'read';
  }
  return 'write';
}

/**
 * Categorize event based on name
 */
function categorizeEvent(
  item: AbiItem
): 'transfer' | 'mint' | 'burn' | 'approval' | 'custom' {
  const name = item.name?.toLowerCase() || '';
  if (name.includes('transfer')) return 'transfer';
  if (name.includes('mint')) return 'mint';
  if (name.includes('burn')) return 'burn';
  if (name.includes('approval') || name.includes('approve')) return 'approval';
  return 'custom';
}

/**
 * Search contracts
 */
export function searchContracts(
  query: string,
  filters?: Record<string, unknown>
) {
  return browserContractManager.searchContracts(query, filters);
}
