// Browser-safe contract manager for blockchain package

import type { ContractOrchestrator } from '@conflux-devkit/core';
import { createContractError } from '@conflux-devkit/core';
import type { CoreClient } from '../rpc/CoreClient';
import type { EvmClient } from '../rpc/EvmClient';
import { BrowserContractWrapper } from './BrowserContractWrapper';
import type {
  BrowserContractOrchestrator,
  BrowserContractRegistryEntry,
  ContractDeploymentSummary,
  ContractInteractionSummary,
  ContractSearchResult,
  ContractStatistics,
} from './types';

export class BrowserContractManager {
  private contracts: Map<string, BrowserContractWrapper> = new Map();
  private registry: Map<string, BrowserContractRegistryEntry> = new Map();
  private evmClients: Map<string, EvmClient> = new Map();
  private coreClients: Map<string, CoreClient> = new Map();

  /**
   * Register contract with clients
   */
  registerContract(
    orchestrator: ContractOrchestrator,
    evmClient?: EvmClient,
    coreClient?: CoreClient
  ): BrowserContractWrapper {
    try {
      // Create browser wrapper
      const wrapper = new BrowserContractWrapper(
        orchestrator,
        evmClient,
        coreClient
      );

      // Store wrapper
      this.contracts.set(orchestrator.id, wrapper);

      // Store clients if provided
      if (evmClient) {
        this.evmClients.set(orchestrator.networkId, evmClient);
      }
      if (coreClient) {
        this.coreClients.set(orchestrator.networkId, coreClient);
      }

      // Create registry entry
      const browserOrchestrator = wrapper.toBrowserSafe();
      const entry: BrowserContractRegistryEntry = {
        id: orchestrator.id,
        contract: browserOrchestrator,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        tags: orchestrator.metadata.tags || [],
        searchableText: this.createSearchableText(browserOrchestrator),
        categories: [
          orchestrator.metadata.category || 'custom',
          orchestrator.chainType,
        ],
      };

      this.registry.set(orchestrator.id, entry);

      return wrapper;
    } catch (error) {
      throw createContractError('Failed to register contract', {
        contractId: orchestrator.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get contract wrapper by ID
   */
  getContract(id: string): BrowserContractWrapper | undefined {
    return this.contracts.get(id);
  }

  /**
   * Get contract by address
   */
  getContractByAddress(address: string): BrowserContractWrapper | undefined {
    for (const wrapper of this.contracts.values()) {
      if (
        wrapper.toBrowserSafe().address.toLowerCase() === address.toLowerCase()
      ) {
        return wrapper;
      }
    }
    return undefined;
  }

  /**
   * List all contracts
   */
  listContracts(): BrowserContractOrchestrator[] {
    return Array.from(this.contracts.values()).map((wrapper) =>
      wrapper.toBrowserSafe()
    );
  }

  /**
   * Get all contracts (alias for listContracts)
   */
  getAllContracts(): BrowserContractOrchestrator[] {
    return this.listContracts();
  }

  /**
   * Remove contract by address
   */
  removeContract(address: string): boolean {
    const wrapper = this.getContractByAddress(address);
    if (wrapper) {
      const browserSafe = wrapper.toBrowserSafe();
      if (browserSafe.id) {
        this.contracts.delete(browserSafe.id);
      }
      this.registry.delete(address);
      return true;
    }
    return false;
  }

  /**
   * Search contracts
   */
  searchContracts(
    query: string,
    filters?: {
      category?: string;
      chainType?: 'core' | 'evm';
      networkId?: string;
      tags?: string[];
    }
  ): ContractSearchResult {
    const lowerQuery = query.toLowerCase();
    const results: BrowserContractOrchestrator[] = [];

    for (const entry of this.registry.values()) {
      if (!entry.isActive) continue;

      // Apply text search
      if (entry.searchableText.includes(lowerQuery)) {
        // Apply filters
        if (filters) {
          if (
            filters.category &&
            entry.contract.metadata?.category !== filters.category
          ) {
            continue;
          }
          if (
            filters.chainType &&
            entry.contract.chainType !== filters.chainType
          ) {
            continue;
          }
          if (
            filters.networkId &&
            entry.contract.networkId !== filters.networkId
          ) {
            continue;
          }
          if (
            filters.tags &&
            !filters.tags.some((tag) =>
              entry.contract.metadata?.tags?.includes(tag)
            )
          ) {
            continue;
          }
        }

        results.push(entry.contract);
      }
    }

    return {
      contracts: results,
      total: results.length,
      query,
      filters,
    };
  }

  /**
   * Get contracts by category
   */
  getContractsByCategory(category: string): BrowserContractOrchestrator[] {
    return this.listContracts().filter(
      (contract) => contract.metadata?.category === category
    );
  }

  /**
   * Get contracts by chain type
   */
  getContractsByChainType(
    chainType: 'core' | 'evm'
  ): BrowserContractOrchestrator[] {
    return this.listContracts().filter(
      (contract) => contract.chainType === chainType
    );
  }

  /**
   * Get contracts by network
   */
  getContractsByNetwork(networkId: string): BrowserContractOrchestrator[] {
    return this.listContracts().filter(
      (contract) => contract.networkId === networkId
    );
  }

  /**
   * Get active contracts
   */
  getActiveContracts(): BrowserContractOrchestrator[] {
    return this.listContracts().filter((contract) => contract.ui?.isActive);
  }

  /**
   * Get recently used contracts
   */
  getRecentlyUsedContracts(limit: number = 10): BrowserContractOrchestrator[] {
    return this.listContracts()
      .filter((contract) => contract.ui?.lastUsed)
      .sort(
        (a, b) =>
          new Date(b.ui?.lastUsed || 0).getTime() -
          new Date(a.ui?.lastUsed || 0).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Get most used contracts
   */
  getMostUsedContracts(limit: number = 10): BrowserContractOrchestrator[] {
    return this.listContracts()
      .sort((a, b) => (b.ui?.usageCount || 0) - (a.ui?.usageCount || 0))
      .slice(0, limit);
  }

  /**
   * Get contracts with errors
   */
  getContractsWithErrors(): BrowserContractOrchestrator[] {
    return this.listContracts().filter((contract) => contract.types?.error);
  }

  /**
   * Get contracts by tags
   */
  getContractsByTags(tags: string[]): BrowserContractOrchestrator[] {
    return this.listContracts().filter((contract) =>
      tags.some((tag) => contract.metadata?.tags?.includes(tag))
    );
  }

  /**
   * Get contract statistics
   */
  getStatistics(): ContractStatistics {
    const contracts = this.listContracts();
    const byChainType = {
      evm: contracts.filter((c) => c.chainType === 'evm').length,
      core: contracts.filter((c) => c.chainType === 'core').length,
    };

    const byCategory: Record<string, number> = {};
    const byNetwork: Record<string, number> = {};

    for (const contract of contracts) {
      const category = contract.metadata?.category || 'custom';
      byCategory[category] = (byCategory[category] || 0) + 1;
      byNetwork[contract.networkId] = (byNetwork[contract.networkId] || 0) + 1;
    }

    const totalInteractions = contracts.reduce(
      (sum, c) => sum + (c.ui?.usageCount || 0),
      0
    );
    const averageSuccessRate = 100; // Would calculate from actual data

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.filter((c) => c.ui?.isActive).length,
      contractsWithErrors: contracts.filter((c) => c.types?.error).length,
      byChainType,
      byCategory,
      byNetwork,
      totalInteractions,
      averageSuccessRate,
    };
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
      const category = contract.metadata?.category || 'custom';
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    return {
      totalContracts: contracts.length,
      byChainType,
      byNetwork,
      byCategory,
      recentlyDeployed: contracts
        .filter((c) => c.deployment?.deployedAt)
        .sort(
          (a, b) =>
            new Date(b.deployment?.deployedAt || 0).getTime() -
            new Date(a.deployment?.deployedAt || 0).getTime()
        )
        .slice(0, 5),
      mostUsed: contracts
        .sort((a, b) => (b.ui?.usageCount || 0) - (a.ui?.usageCount || 0))
        .slice(0, 5),
      withErrors: contracts.filter((c) => c.types?.error),
    };
  }

  /**
   * Get interaction summary for contract
   */
  getInteractionSummary(
    contractId: string
  ): ContractInteractionSummary | undefined {
    const wrapper = this.contracts.get(contractId);
    if (!wrapper) return undefined;

    return wrapper.getInteractionSummary();
  }

  /**
   * Get all interaction summaries
   */
  getAllInteractionSummaries(): ContractInteractionSummary[] {
    const summaries: ContractInteractionSummary[] = [];
    for (const wrapper of this.contracts.values()) {
      summaries.push(wrapper.getInteractionSummary());
    }
    return summaries;
  }

  /**
   * Update contract metadata
   */
  updateContractMetadata(
    id: string,
    metadata: Partial<BrowserContractOrchestrator['metadata']>
  ): void {
    const wrapper = this.contracts.get(id);
    if (!wrapper) {
      throw createContractError('Contract not found', { id });
    }

    const browserContract = wrapper.toBrowserSafe();
    browserContract.metadata = { ...browserContract.metadata, ...metadata };

    // Update registry entry
    const entry = this.registry.get(id);
    if (entry) {
      entry.contract = browserContract;
      entry.updatedAt = new Date().toISOString();
      entry.searchableText = this.createSearchableText(browserContract);
    }
  }

  /**
   * Record contract interaction
   */
  recordInteraction(
    contractId: string,
    _methodName: string,
    _success: boolean,
    _gasUsed?: string
  ): void {
    const wrapper = this.contracts.get(contractId);
    if (!wrapper) return;

    // Update usage count
    const browserContract = wrapper.toBrowserSafe();
    if (browserContract.ui) {
      browserContract.ui.usageCount = (browserContract.ui.usageCount || 0) + 1;
      browserContract.ui.lastUsed = new Date().toISOString();
    }
  }

  /**
   * Validate contract
   */
  validateContract(contractId: string) {
    const wrapper = this.contracts.get(contractId);
    if (!wrapper) {
      throw createContractError('Contract not found', { contractId });
    }

    return wrapper.validate();
  }

  /**
   * Get contract by partial ID or name
   */
  findContract(partialId: string): BrowserContractWrapper | undefined {
    // Try exact match first
    const wrapper = this.contracts.get(partialId);
    if (wrapper) return wrapper;

    // Try partial match on ID
    for (const [id, w] of this.contracts) {
      if (id.includes(partialId)) {
        return w;
      }
    }

    // Try partial match on name
    for (const wrapper of this.contracts.values()) {
      const contract = wrapper.toBrowserSafe();
      if (contract.name.toLowerCase().includes(partialId.toLowerCase())) {
        return wrapper;
      }
    }

    // Try partial match on address
    if (partialId.startsWith('0x')) {
      return this.getContractByAddress(partialId);
    }

    return undefined;
  }

  /**
   * Get contracts by capability
   */
  getContractsByCapability(
    capability: keyof BrowserContractOrchestrator['capabilities']
  ): BrowserContractOrchestrator[] {
    return this.listContracts().filter(
      (contract) => contract.capabilities[capability]
    );
  }

  /**
   * Get callable contracts
   */
  getCallableContracts(): BrowserContractOrchestrator[] {
    return this.getContractsByCapability('canWrite');
  }

  /**
   * Get readable contracts
   */
  getReadableContracts(): BrowserContractOrchestrator[] {
    return this.getContractsByCapability('canRead');
  }

  /**
   * Get contracts with events
   */
  getContractsWithEvents(): BrowserContractOrchestrator[] {
    return this.getContractsByCapability('hasEvents');
  }

  /**
   * Export contracts to JSON
   */
  exportContracts(): string {
    const contracts = this.listContracts();
    return JSON.stringify(contracts, null, 2);
  }

  /**
   * Import contracts from JSON
   */
  importContracts(jsonData: string): void {
    try {
      const contracts: BrowserContractOrchestrator[] = JSON.parse(jsonData);
      // Note: This would need to recreate the wrappers and clients
      // For now, just log the import
      console.log('Imported contracts:', contracts.length);
    } catch (error) {
      throw createContractError('Failed to import contracts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Clear all contracts
   */
  clearAllContracts(): void {
    this.contracts.clear();
    this.registry.clear();
    this.evmClients.clear();
    this.coreClients.clear();
  }

  /**
   * Create searchable text for contract
   */
  private createSearchableText(contract: BrowserContractOrchestrator): string {
    const parts = [
      contract.name,
      contract.address,
      contract.metadata?.description || '',
      contract.metadata?.tags?.join(' ') || '',
      ...(Array.isArray(contract.methods.read)
        ? contract.methods.read
            .map((m) => (typeof m === 'string' ? m : (m as any)?.name || ''))
            .filter(Boolean)
        : []),
      ...(Array.isArray(contract.methods.write)
        ? contract.methods.write
            .map((m) => (typeof m === 'string' ? m : (m as any)?.name || ''))
            .filter(Boolean)
        : []),
      ...(Array.isArray(contract.methods.events)
        ? contract.methods.events
            .map((e) => (typeof e === 'string' ? e : (e as any)?.name || ''))
            .filter(Boolean)
        : []),
    ];

    return parts.join(' ').toLowerCase();
  }
}

// Export singleton instance
export const browserContractManager = new BrowserContractManager();
