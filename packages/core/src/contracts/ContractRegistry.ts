// Contract registry for centralized contract management

import type {
  ContractDeploymentSummary,
  ContractInteractionSummary,
  ContractOrchestrator,
} from '../types/contract-orchestration';
import { createContractError } from '../types/errors';
import { contractOrchestratorManager } from './ContractOrchestrator';

export class ContractRegistry {
  private orchestrator = contractOrchestratorManager;

  /**
   * Register a new contract
   */
  registerContract(contract: ContractOrchestrator): void {
    this.orchestrator.registerContract(contract);
  }

  /**
   * Get contract by ID
   */
  getContract(id: string): ContractOrchestrator | undefined {
    return this.orchestrator.getContract(id);
  }

  /**
   * Get contract by address
   */
  getContractByAddress(
    address: `0x${string}`
  ): ContractOrchestrator | undefined {
    return this.orchestrator.getContractByAddress(address);
  }

  /**
   * List all contracts
   */
  listContracts(): ContractOrchestrator[] {
    return this.orchestrator.listContracts();
  }

  /**
   * Search contracts
   */
  searchContracts(query: string): ContractOrchestrator[] {
    return this.orchestrator.searchContracts(query);
  }

  /**
   * Filter contracts by category
   */
  getContractsByCategory(category: string): ContractOrchestrator[] {
    return this.orchestrator.filterContractsByCategory(category);
  }

  /**
   * Filter contracts by chain type
   */
  getContractsByChainType(chainType: 'core' | 'evm'): ContractOrchestrator[] {
    return this.orchestrator.filterContractsByChainType(chainType);
  }

  /**
   * Get contracts by network
   */
  getContractsByNetwork(networkId: string): ContractOrchestrator[] {
    return this.listContracts().filter(
      (contract) => contract.networkId === networkId
    );
  }

  /**
   * Get active contracts
   */
  getActiveContracts(): ContractOrchestrator[] {
    return this.listContracts().filter((contract) => contract.ui.isActive);
  }

  /**
   * Get recently used contracts
   */
  getRecentlyUsedContracts(limit: number = 10): ContractOrchestrator[] {
    return this.listContracts()
      .filter((contract) => contract.ui.lastUsed)
      .sort(
        (a, b) =>
          (b.ui.lastUsed?.getTime() || 0) - (a.ui.lastUsed?.getTime() || 0)
      )
      .slice(0, limit);
  }

  /**
   * Get most used contracts
   */
  getMostUsedContracts(limit: number = 10): ContractOrchestrator[] {
    return this.listContracts()
      .sort((a, b) => b.ui.usageCount - a.ui.usageCount)
      .slice(0, limit);
  }

  /**
   * Get contracts with errors
   */
  getContractsWithErrors(): ContractOrchestrator[] {
    return this.listContracts().filter((contract) => contract.types.error);
  }

  /**
   * Get contracts by tags
   */
  getContractsByTags(tags: string[]): ContractOrchestrator[] {
    return this.listContracts().filter((contract) =>
      tags.some((tag) => contract.metadata.tags?.includes(tag))
    );
  }

  /**
   * Get deployment summary
   */
  getDeploymentSummary(): ContractDeploymentSummary {
    return this.orchestrator.getDeploymentSummary();
  }

  /**
   * Get contract interaction summary
   */
  getInteractionSummary(
    contractId: string
  ): ContractInteractionSummary | undefined {
    return this.orchestrator.getInteractionSummary(contractId);
  }

  /**
   * Get all interaction summaries
   */
  getAllInteractionSummaries(): ContractInteractionSummary[] {
    const summaries: ContractInteractionSummary[] = [];
    for (const contract of this.listContracts()) {
      const summary = this.getInteractionSummary(contract.id);
      if (summary) {
        summaries.push(summary);
      }
    }
    return summaries;
  }

  /**
   * Update contract metadata
   */
  updateContractMetadata(
    id: string,
    metadata: Partial<ContractOrchestrator['metadata']>
  ): void {
    this.orchestrator.updateContractMetadata(id, metadata);
  }

  /**
   * Record contract interaction
   */
  recordInteraction(
    contractId: string,
    methodName: string,
    success: boolean,
    gasUsed?: bigint
  ): void {
    this.orchestrator.recordInteraction(
      contractId,
      methodName,
      success,
      gasUsed
    );
  }

  /**
   * Validate contract
   */
  validateContract(contract: ContractOrchestrator) {
    return this.orchestrator.validateContract(contract);
  }

  /**
   * Get contract statistics
   */
  getContractStatistics(): {
    totalContracts: number;
    activeContracts: number;
    contractsWithErrors: number;
    byChainType: { evm: number; core: number };
    byCategory: Record<string, number>;
    byNetwork: Record<string, number>;
    totalInteractions: number;
    averageSuccessRate: number;
  } {
    const contracts = this.listContracts();
    const summaries = this.getAllInteractionSummaries();

    const byChainType = {
      evm: contracts.filter((c) => c.chainType === 'evm').length,
      core: contracts.filter((c) => c.chainType === 'core').length,
    };

    const byCategory: Record<string, number> = {};
    const byNetwork: Record<string, number> = {};

    for (const contract of contracts) {
      byCategory[contract.metadata.category || 'custom'] =
        (byCategory[contract.metadata.category || 'custom'] || 0) + 1;
      byNetwork[contract.networkId] = (byNetwork[contract.networkId] || 0) + 1;
    }

    const totalInteractions = summaries.reduce(
      (sum, s) => sum + s.totalCalls,
      0
    );
    const averageSuccessRate =
      summaries.length > 0
        ? summaries.reduce((sum, s) => sum + s.successRate, 0) /
          summaries.length
        : 0;

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.filter((c) => c.ui.isActive).length,
      contractsWithErrors: contracts.filter((c) => c.types.error).length,
      byChainType,
      byCategory,
      byNetwork,
      totalInteractions,
      averageSuccessRate,
    };
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
      const contracts: ContractOrchestrator[] = JSON.parse(jsonData);
      for (const contract of contracts) {
        this.registerContract(contract);
      }
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
    this.orchestrator.clearContracts();
  }

  /**
   * Get contract by partial ID or name
   */
  findContract(partialId: string): ContractOrchestrator | undefined {
    // Try exact match first
    let contract = this.getContract(partialId);
    if (contract) return contract;

    // Try partial match on ID
    const contracts = this.listContracts();
    contract = contracts.find((c) => c.id.includes(partialId));
    if (contract) return contract;

    // Try partial match on name
    contract = contracts.find((c) =>
      c.name.toLowerCase().includes(partialId.toLowerCase())
    );
    if (contract) return contract;

    // Try partial match on address
    if (partialId.startsWith('0x')) {
      contract = this.getContractByAddress(partialId as `0x${string}`);
      if (contract) return contract;
    }

    return undefined;
  }

  /**
   * Get contracts by capability
   */
  getContractsByCapability(
    capability: keyof ContractOrchestrator['capabilities']
  ): ContractOrchestrator[] {
    return this.listContracts().filter(
      (contract) => contract.capabilities[capability]
    );
  }

  /**
   * Get contracts that can be called (have write methods)
   */
  getCallableContracts(): ContractOrchestrator[] {
    return this.getContractsByCapability('canWrite');
  }

  /**
   * Get contracts that can be read (have read methods)
   */
  getReadableContracts(): ContractOrchestrator[] {
    return this.getContractsByCapability('canRead');
  }

  /**
   * Get contracts with events
   */
  getContractsWithEvents(): ContractOrchestrator[] {
    return this.getContractsByCapability('hasEvents');
  }
}

// Export singleton instance
export const contractRegistry = new ContractRegistry();
