// Contract orchestrator for simplified contract management and UI visualization

import type { AbiItem, NetworkConfig } from '../types/blockchain';
import type {
  ContractDeploymentSummary,
  ContractEvent,
  ContractInteractionSummary,
  ContractMetadata,
  ContractMethod,
  ContractOrchestrator,
  ContractRegistryEntry,
  ContractValidationResult,
  TypedDeploymentResult,
} from '../types/contract-orchestration';
import { createContractError } from '../types/errors';

export class ContractOrchestratorManager {
  private contracts: Map<string, ContractOrchestrator> = new Map();
  private registry: Map<string, ContractRegistryEntry> = new Map();
  private interactions: Map<string, ContractInteractionSummary> = new Map();

  /**
   * Create contract orchestrator from deployment result
   */
  createOrchestrator(
    deploymentResult: TypedDeploymentResult,
    networkConfig: NetworkConfig,
    metadata?: Partial<ContractMetadata>
  ): ContractOrchestrator {
    try {
      // Extract methods and events from ABI
      const { methods, events } = this.extractContractInterface(
        deploymentResult.abi
      );

      // Create contract metadata
      const contractMetadata: ContractMetadata = {
        name: deploymentResult.contractName,
        version: '1.0.0',
        description: `Deployed ${deploymentResult.contractName} contract`,
        category: 'custom',
        tags: ['deployed', deploymentResult.chainType],
        ...metadata,
      };

      // Create capabilities assessment
      const capabilities = this.assessContractCapabilities(
        deploymentResult.abi
      );

      // Create orchestrator object
      const orchestrator: ContractOrchestrator = {
        id: `${deploymentResult.contractName}-${deploymentResult.networkId}`,
        name: deploymentResult.contractName,
        address: deploymentResult.address,
        chainType: deploymentResult.chainType,
        networkId: deploymentResult.networkId,
        chainId: networkConfig.chainId,
        evmChainId: networkConfig.evmChainId,

        metadata: contractMetadata,

        abi: deploymentResult.abi,
        bytecode: deploymentResult.bytecode,
        deployedBytecode: deploymentResult.deployedBytecode,

        methods: {
          read: methods.filter((m) => m.category === 'read'),
          write: methods.filter((m) => m.category === 'write'),
          events: events,
          constructor: null, // Constructor info not currently used
        },

        deployment: {
          transactionHash: deploymentResult.transactionHash,
          blockNumber: deploymentResult.blockNumber,
          gasUsed: deploymentResult.gasUsed,
          deployedAt: new Date(),
          isVerified: false,
        },

        types: {
          generated: deploymentResult.typesGenerated,
          generatedAt: deploymentResult.typesGenerated ? new Date() : undefined,
          error: deploymentResult.typeGenerationError,
          generatedTypes: deploymentResult.generatedContract,
        },

        ui: {
          displayName: contractMetadata.name,
          description:
            contractMetadata.description ||
            `Smart contract deployed at ${deploymentResult.address}`,
          category: contractMetadata.category || 'custom',
          tags: contractMetadata.tags || [],
          isActive: true,
          usageCount: 0,
        },

        capabilities,

        network: {
          name: networkConfig.name,
          rpcUrl: networkConfig.rpcUrl,
          isTestnet: networkConfig.isTestnet,
          currency: networkConfig.currency,
        },
      };

      // Register contract
      this.registerContract(orchestrator);

      return orchestrator;
    } catch (error) {
      throw createContractError('Failed to create contract orchestrator', {
        contractName: deploymentResult.contractName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Extract contract interface from ABI
   */
  private extractContractInterface(abi: AbiItem[]): {
    methods: ContractMethod[];
    events: ContractEvent[];
    constructor: ContractMethod | null;
  } {
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
          category: this.categorizeMethod(item),
          isPayable: item.stateMutability === 'payable',
          isView: item.stateMutability === 'view',
          isPure: item.stateMutability === 'pure',
        };
        methods.push(method);
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
          category: this.categorizeEvent(item),
        };
        events.push(event);
      } else if (item.type === 'constructor') {
        contractConstructor = {
          name: 'constructor',
          type: 'constructor',
          stateMutability: (item.stateMutability || 'nonpayable') as
            | 'pure'
            | 'view'
            | 'nonpayable'
            | 'payable',
          inputs: item.inputs || [],
          outputs: [],
          category: 'constructor',
        };
      }
    }

    return { methods, events, constructor: contractConstructor };
  }

  /**
   * Categorize method based on name and state mutability
   */
  private categorizeMethod(
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
  private categorizeEvent(
    item: AbiItem
  ): 'transfer' | 'mint' | 'burn' | 'approval' | 'custom' {
    const name = (item.name || '').toLowerCase();
    if (name.includes('transfer')) return 'transfer';
    if (name.includes('mint')) return 'mint';
    if (name.includes('burn')) return 'burn';
    if (name.includes('approval') || name.includes('approve'))
      return 'approval';
    return 'custom';
  }

  /**
   * Assess contract capabilities
   */
  private assessContractCapabilities(
    abi: AbiItem[]
  ): ContractOrchestrator['capabilities'] {
    const hasRead = abi.some(
      (item) =>
        item.type === 'function' &&
        (item.stateMutability === 'view' || item.stateMutability === 'pure')
    );
    const hasWrite = abi.some(
      (item) =>
        item.type === 'function' &&
        (item.stateMutability === 'nonpayable' ||
          item.stateMutability === 'payable')
    );
    const hasReceive = abi.some((item) => item.type === 'receive');
    const hasFallback = abi.some((item) => item.type === 'fallback');
    const hasEvents = abi.some((item) => item.type === 'event');

    // Check for common patterns
    const hasOwnable = abi.some(
      (item) => item.name === 'owner' || item.name === 'transferOwnership'
    );
    const hasPausable = abi.some(
      (item) => item.name === 'pause' || item.name === 'unpause'
    );
    const hasUpgradeable = abi.some(
      (item) => item.name === 'upgrade' || item.name === 'implementation'
    );

    return {
      canRead: hasRead,
      canWrite: hasWrite,
      canReceive: hasReceive,
      canFallback: hasFallback,
      hasEvents: hasEvents,
      isUpgradeable: hasUpgradeable,
      isPausable: hasPausable,
      isOwnable: hasOwnable,
    };
  }

  /**
   * Register contract in registry
   */
  public registerContract(contract: ContractOrchestrator): void {
    const entry: ContractRegistryEntry = {
      id: contract.id,
      contract,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: contract.metadata.tags || [],
      searchableText: this.createSearchableText(contract),
      categories: [contract.metadata.category || 'custom', contract.chainType],
    };

    this.contracts.set(contract.id, contract);
    this.registry.set(contract.id, entry);
  }

  /**
   * Create searchable text for contract
   */
  private createSearchableText(contract: ContractOrchestrator): string {
    const parts = [
      contract.name,
      contract.address,
      contract.metadata.description || '',
      contract.metadata.tags?.join(' ') || '',
      contract.methods.read.map((m) => m.name).join(' '),
      contract.methods.write.map((m) => m.name).join(' '),
      contract.methods.events.map((e) => e.name).join(' '),
    ];

    return parts.join(' ').toLowerCase();
  }

  /**
   * Get contract by ID
   */
  getContract(id: string): ContractOrchestrator | undefined {
    return this.contracts.get(id);
  }

  /**
   * Get contract by address
   */
  getContractByAddress(
    address: `0x${string}`
  ): ContractOrchestrator | undefined {
    for (const contract of this.contracts.values()) {
      if (contract.address.toLowerCase() === address.toLowerCase()) {
        return contract;
      }
    }
    return undefined;
  }

  /**
   * List all contracts
   */
  listContracts(): ContractOrchestrator[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Search contracts
   */
  searchContracts(query: string): ContractOrchestrator[] {
    const lowerQuery = query.toLowerCase();
    const results: ContractOrchestrator[] = [];

    for (const entry of this.registry.values()) {
      if (entry.searchableText.includes(lowerQuery)) {
        results.push(entry.contract);
      }
    }

    return results;
  }

  /**
   * Filter contracts by category
   */
  filterContractsByCategory(category: string): ContractOrchestrator[] {
    return this.listContracts().filter(
      (contract) => contract.metadata.category === category
    );
  }

  /**
   * Filter contracts by chain type
   */
  filterContractsByChainType(
    chainType: 'core' | 'evm'
  ): ContractOrchestrator[] {
    return this.listContracts().filter(
      (contract) => contract.chainType === chainType
    );
  }

  /**
   * Get deployment summary
   */
  getDeploymentSummary(): ContractDeploymentSummary {
    const contracts = this.listContracts();
    const byChainType = {
      evm: contracts.filter((c) => c.chainType === 'evm').length,
      core: contracts.filter((c) => c.chainType === 'core').length,
    };

    const byNetwork: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const contract of contracts) {
      byNetwork[contract.networkId] = (byNetwork[contract.networkId] || 0) + 1;
      byCategory[contract.metadata.category || 'custom'] =
        (byCategory[contract.metadata.category || 'custom'] || 0) + 1;
    }

    return {
      totalContracts: contracts.length,
      byChainType,
      byNetwork,
      byCategory,
      recentlyDeployed: contracts
        .sort(
          (a, b) =>
            b.deployment.deployedAt.getTime() -
            a.deployment.deployedAt.getTime()
        )
        .slice(0, 5),
      mostUsed: contracts
        .sort((a, b) => b.ui.usageCount - a.ui.usageCount)
        .slice(0, 5),
      withErrors: contracts.filter((c) => c.types.error),
    };
  }

  /**
   * Validate contract
   */
  validateContract(contract: ContractOrchestrator): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    const checks = {
      abiValid: contract.abi.length > 0,
      addressValid:
        contract.address.startsWith('0x') && contract.address.length === 42,
      bytecodeValid: contract.bytecode.startsWith('0x'),
      networkCompatible: true, // Would need network validation
      typesGenerated: contract.types.generated,
      methodsAccessible:
        contract.methods.read.length > 0 || contract.methods.write.length > 0,
    };

    if (!checks.abiValid) errors.push('Invalid ABI');
    if (!checks.addressValid) errors.push('Invalid contract address');
    if (!checks.bytecodeValid) errors.push('Invalid bytecode');
    if (!checks.typesGenerated) warnings.push('Types not generated');
    if (!checks.methodsAccessible) warnings.push('No accessible methods');

    if (contract.types.error) {
      errors.push(`Type generation error: ${contract.types.error}`);
    }

    if (
      contract.methods.read.length === 0 &&
      contract.methods.write.length === 0
    ) {
      suggestions.push(
        'Consider adding read or write methods to make the contract useful'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      checks,
    };
  }

  /**
   * Update contract metadata
   */
  updateContractMetadata(
    id: string,
    metadata: Partial<ContractMetadata>
  ): void {
    const contract = this.contracts.get(id);
    if (!contract) {
      throw createContractError('Contract not found', { id });
    }

    contract.metadata = { ...contract.metadata, ...metadata };
    contract.ui.displayName = metadata.name || contract.ui.displayName;
    contract.ui.description = metadata.description || contract.ui.description;
    contract.ui.category = metadata.category || contract.ui.category;
    contract.ui.tags = metadata.tags || contract.ui.tags;

    // Update registry entry
    const entry = this.registry.get(id);
    if (entry) {
      entry.updatedAt = new Date();
      entry.searchableText = this.createSearchableText(contract);
    }
  }

  /**
   * Record contract interaction
   */
  recordInteraction(
    contractId: string,
    methodName: string,
    _success: boolean,
    gasUsed?: bigint
  ): void {
    const contract = this.contracts.get(contractId);
    if (!contract) return;

    // Update usage count
    contract.ui.usageCount++;
    contract.ui.lastUsed = new Date();

    // Update interaction summary
    let summary = this.interactions.get(contractId);
    if (!summary) {
      summary = {
        contractId,
        contractName: contract.name,
        totalCalls: 0,
        readCalls: 0,
        writeCalls: 0,
        eventLogs: 0,
        lastInteraction: new Date(),
        successRate: 0,
        averageGasUsed: 0n,
        totalGasUsed: 0n,
        errors: [],
      };
    }

    summary.totalCalls++;
    summary.lastInteraction = new Date();

    // Categorize call
    const method = [...contract.methods.read, ...contract.methods.write].find(
      (m) => m.name === methodName
    );
    if (method?.category === 'read') {
      summary.readCalls++;
    } else if (method?.category === 'write') {
      summary.writeCalls++;
    }

    if (gasUsed) {
      summary.totalGasUsed += gasUsed;
      summary.averageGasUsed =
        summary.totalGasUsed / BigInt(summary.totalCalls);
    }

    // Update success rate
    const successfulCalls = summary.totalCalls - summary.errors.length;
    summary.successRate = (successfulCalls / summary.totalCalls) * 100;

    this.interactions.set(contractId, summary);
  }

  /**
   * Get contract interaction summary
   */
  getInteractionSummary(
    contractId: string
  ): ContractInteractionSummary | undefined {
    return this.interactions.get(contractId);
  }

  /**
   * Clear all contracts
   */
  clearContracts(): void {
    this.contracts.clear();
    this.registry.clear();
    this.interactions.clear();
  }
}

// Export singleton instance
export const contractOrchestratorManager = new ContractOrchestratorManager();
