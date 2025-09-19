// Browser-safe contract wrapper for blockchain package

import type {
  ContractEvent,
  ContractEventFilter,
  ContractMethod,
  ContractOrchestrator,
} from '@conflux-devkit/core';
import { createContractError } from '@conflux-devkit/core';
import type { CoreClient } from '../rpc/CoreClient';
import type { EvmClient } from '../rpc/EvmClient';
import type {
  BrowserContractEvent,
  BrowserContractEventLog,
  BrowserContractMethod,
  BrowserContractMethodResult,
  BrowserContractOrchestrator,
  ContractEventOptions,
  ContractInteractionOptions,
  ContractInteractionSummary,
  ContractReadOptions,
  ContractValidationResult,
  ContractWriteOptions,
} from './types';

export class BrowserContractWrapper {
  private orchestrator: ContractOrchestrator;
  private evmClient?: EvmClient;
  private coreClient?: CoreClient;
  private interactionCount = 0;

  constructor(
    orchestrator: ContractOrchestrator,
    evmClient?: EvmClient,
    coreClient?: CoreClient
  ) {
    this.orchestrator = orchestrator;
    this.evmClient = evmClient;
    this.coreClient = coreClient;
  }

  /**
   * Convert to browser-safe format
   */
  toBrowserSafe(): BrowserContractOrchestrator {
    return {
      id: this.orchestrator.id,
      name: this.orchestrator.name,
      address: this.orchestrator.address,
      chainType: this.orchestrator.chainType,
      networkId: this.orchestrator.networkId,
      chainId: this.orchestrator.chainId,
      evmChainId: this.orchestrator.evmChainId,

      metadata: this.orchestrator.metadata,

      abi: this.orchestrator.abi,
      bytecode: this.orchestrator.bytecode,
      deployedBytecode: this.orchestrator.deployedBytecode,

      methods: {
        read: this.orchestrator.methods.read.map(this.convertMethodToBrowser),
        write: this.orchestrator.methods.write.map(this.convertMethodToBrowser),
        events: this.orchestrator.methods.events.map(
          this.convertEventToBrowser
        ),
        constructor: this.orchestrator.methods.constructor
          ? this.convertMethodToBrowser(this.orchestrator.methods.constructor)
          : null,
      },

      deployment: {
        transactionHash: this.orchestrator.deployment.transactionHash,
        blockNumber: this.orchestrator.deployment.blockNumber.toString(),
        gasUsed: this.orchestrator.deployment.gasUsed.toString(),
        deployedAt: this.orchestrator.deployment.deployedAt.toISOString(),
        isVerified: this.orchestrator.deployment.isVerified,
        verificationStatus: this.orchestrator.deployment.verificationStatus,
      },

      types: {
        generated: this.orchestrator.types.generated,
        generatedAt: this.orchestrator.types.generatedAt?.toISOString(),
        error: this.orchestrator.types.error,
        generatedTypes: this.orchestrator.types.generatedTypes,
      },

      ui: {
        displayName: this.orchestrator.ui.displayName,
        description: this.orchestrator.ui.description,
        category: this.orchestrator.ui.category,
        icon: this.orchestrator.ui.icon,
        color: this.orchestrator.ui.color,
        tags: this.orchestrator.ui.tags,
        isActive: this.orchestrator.ui.isActive,
        lastUsed: this.orchestrator.ui.lastUsed?.toISOString(),
        usageCount: this.orchestrator.ui.usageCount,
      },

      capabilities: {
        read: this.orchestrator.capabilities.canRead || false,
        write: this.orchestrator.capabilities.canWrite || false,
        events: this.orchestrator.capabilities.hasEvents || false,
        canRead: this.orchestrator.capabilities.canRead,
        canWrite: this.orchestrator.capabilities.canWrite,
        hasEvents: this.orchestrator.capabilities.hasEvents,
        canReceive: this.orchestrator.capabilities.canReceive,
        canFallback: this.orchestrator.capabilities.canFallback,
        isUpgradeable: this.orchestrator.capabilities.isUpgradeable,
        isPausable: this.orchestrator.capabilities.isPausable,
        isOwnable: this.orchestrator.capabilities.isOwnable,
      },

      network: {
        name: this.orchestrator.network.name,
        rpcUrl: this.orchestrator.network.rpcUrl,
        chainId: this.orchestrator.chainId?.toString() || '0',
        evmChainId: this.orchestrator.evmChainId?.toString(),
        isTestnet: this.orchestrator.network.isTestnet,
        networkType: this.orchestrator.chainType,
        currency: {
          name: this.orchestrator.network.currency.name,
          symbol: this.orchestrator.network.currency.symbol,
          decimals: this.orchestrator.network.currency.decimals.toString(),
        },
        blockExplorer: this.orchestrator.network.blockExplorer,
      },
    };
  }

  /**
   * Convert method to browser-safe format
   */
  private convertMethodToBrowser(
    method: ContractMethod
  ): BrowserContractMethod {
    return {
      ...method,
      gasEstimate: method.gasEstimate?.toString(),
    };
  }

  /**
   * Convert event to browser-safe format
   */
  private convertEventToBrowser(event: ContractEvent): BrowserContractEvent {
    return event;
  }

  /**
   * Read contract method
   */
  async readMethod(
    methodName: string,
    parameters: Record<string, unknown> = {},
    _options: ContractReadOptions = {}
  ): Promise<BrowserContractMethodResult> {
    try {
      const method = this.findMethod(methodName, 'read');
      if (!method) {
        throw createContractError('Method not found', { methodName });
      }

      const client = this.getClient();
      const result = await client.readContract({
        address: this.orchestrator.address,
        abi: this.orchestrator.abi,
        functionName: methodName,
        args: Object.values(parameters),
      });

      this.recordInteraction(methodName, true);

      return {
        methodName,
        result,
        success: true,
      };
    } catch (error) {
      this.recordInteraction(methodName, false);
      return {
        methodName,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Write contract method
   */
  async writeMethod(
    methodName: string,
    parameters: Record<string, unknown> = {},
    options: ContractWriteOptions = {}
  ): Promise<BrowserContractMethodResult> {
    try {
      const method = this.findMethod(methodName, 'write');
      if (!method) {
        throw createContractError('Method not found', { methodName });
      }

      const client = this.getClient();
      const hash = await client.writeContract({
        address: this.orchestrator.address,
        abi: this.orchestrator.abi,
        functionName: methodName,
        args: Object.values(parameters),
        value: options.value ? BigInt(options.value) : undefined,
      });

      let receipt = null;
      if (options.waitForReceipt) {
        receipt = await client.getTransactionReceipt({ hash });
      }

      this.recordInteraction(methodName, true);

      return {
        methodName,
        result: hash,
        transactionHash: hash,
        success: true,
        gasUsed: receipt?.gasUsed?.toString(),
        blockNumber: receipt?.blockNumber?.toString(),
      };
    } catch (error) {
      this.recordInteraction(methodName, false);
      return {
        methodName,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Listen to contract events
   */
  async listenToEvents(
    eventName: string,
    options: ContractEventOptions = {},
    _callback: (log: BrowserContractEventLog) => void
  ): Promise<() => void> {
    try {
      const event = this.findEvent(eventName);
      if (!event) {
        throw createContractError('Event not found', { eventName });
      }

      const _client = this.getClient();

      // Convert browser options to core format
      const _filter: ContractEventFilter = {
        eventName,
        fromBlock: options.fromBlock ? BigInt(options.fromBlock) : undefined,
        toBlock: options.toBlock ? BigInt(options.toBlock) : undefined,
        topics: options.topics as `0x${string}`[],
        address: options.address as `0x${string}`,
      };

      // This would need to be implemented based on the client
      // For now, return a mock unsubscribe function
      const unsubscribe = () => {
        // Unsubscribe logic would go here
      };

      return unsubscribe;
    } catch (error) {
      throw createContractError('Failed to listen to events', {
        eventName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get contract balance
   */
  async getBalance(): Promise<string> {
    try {
      const client = this.getClient();
      const balance = await client.getBalance({
        address: this.orchestrator.address,
      });
      return balance.toString();
    } catch (error) {
      throw createContractError('Failed to get balance', {
        address: this.orchestrator.address,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Estimate gas for method call
   */
  async estimateGas(
    methodName: string,
    _parameters: Record<string, unknown> = {},
    options: ContractInteractionOptions = {}
  ): Promise<string> {
    try {
      const method = this.findMethod(methodName, 'write');
      if (!method) {
        throw createContractError('Method not found', { methodName });
      }

      const client = this.getClient();
      const gasEstimate = await client.estimateGas({
        to: this.orchestrator.address,
        value: options.value ? BigInt(options.value) : undefined,
        data: '0x', // Would need to encode function call
      });

      return gasEstimate.toString();
    } catch (error) {
      throw createContractError('Failed to estimate gas', {
        methodName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate contract
   */
  validate(): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    const checks = {
      abiValid: this.orchestrator.abi.length > 0,
      addressValid:
        this.orchestrator.address.startsWith('0x') &&
        this.orchestrator.address.length === 42,
      bytecodeValid: this.orchestrator.bytecode.startsWith('0x'),
      networkCompatible: true,
      typesGenerated: this.orchestrator.types.generated,
      methodsAccessible:
        this.orchestrator.methods.read.length > 0 ||
        this.orchestrator.methods.write.length > 0,
    };

    if (!checks.abiValid) errors.push('Invalid ABI');
    if (!checks.addressValid) errors.push('Invalid contract address');
    if (!checks.bytecodeValid) errors.push('Invalid bytecode');
    if (!checks.typesGenerated) warnings.push('Types not generated');
    if (!checks.methodsAccessible) warnings.push('No accessible methods');

    if (this.orchestrator.types.error) {
      errors.push(`Type generation error: ${this.orchestrator.types.error}`);
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
   * Get interaction summary
   */
  getInteractionSummary(): ContractInteractionSummary {
    return {
      contractId: this.orchestrator.id,
      contractName: this.orchestrator.name,
      totalCalls: this.interactionCount,
      readCalls: 0, // Would track separately
      writeCalls: 0, // Would track separately
      eventLogs: 0, // Would track separately
      lastInteraction: new Date().toISOString(),
      successRate: 100, // Would calculate from actual data
      averageGasUsed: '0',
      totalGasUsed: '0',
      errors: [],
    };
  }

  /**
   * Find method by name and type
   */
  private findMethod(
    name: string,
    type: 'read' | 'write'
  ): ContractMethod | undefined {
    const methods =
      type === 'read'
        ? this.orchestrator.methods.read
        : this.orchestrator.methods.write;
    return methods.find((method) => method.name === name);
  }

  /**
   * Find event by name
   */
  private findEvent(name: string): ContractEvent | undefined {
    return this.orchestrator.methods.events.find(
      (event) => event.name === name
    );
  }

  /**
   * Get appropriate client
   */
  private getClient(): EvmClient | CoreClient {
    if (this.orchestrator.chainType === 'evm' && this.evmClient) {
      return this.evmClient;
    } else if (this.orchestrator.chainType === 'core' && this.coreClient) {
      return this.coreClient;
    } else {
      throw createContractError('Client not available', {
        chainType: this.orchestrator.chainType,
      });
    }
  }

  /**
   * Record interaction
   */
  private recordInteraction(_methodName: string, _success: boolean): void {
    this.interactionCount++;
    this.orchestrator.ui.usageCount++;
    this.orchestrator.ui.lastUsed = new Date();
  }

  /**
   * Get contract info
   */
  getInfo(): {
    name: string;
    address: string;
    chainType: 'core' | 'evm';
    networkId: string;
    capabilities: Record<string, boolean>; // Simplified for mock implementation
    methods: {
      read: number;
      write: number;
      events: number;
    };
  } {
    return {
      name: this.orchestrator.name,
      address: this.orchestrator.address,
      chainType: this.orchestrator.chainType,
      networkId: this.orchestrator.networkId,
      capabilities: this.orchestrator.capabilities,
      methods: {
        read: this.orchestrator.methods.read.length,
        write: this.orchestrator.methods.write.length,
        events: this.orchestrator.methods.events.length,
      },
    };
  }
}
