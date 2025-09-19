// Contract Orchestration Service - Manages contract operations with state integration
// This service provides high-level contract management using the state store

import type {
  AbiItem,
  BrowserContractOrchestrator,
  ContractEvent,
} from '@conflux-devkit/core';

import type { StateIntegrationService } from './StateIntegrationService';
import { getStateIntegrationService } from './StateIntegrationService';

// Note: These types will be imported from @conflux-devkit/state when available
// For now, we'll define them locally
interface ContractCallParams {
  contractAddress: string;
  method: string;
  args?: unknown[];
  value?: bigint;
  from?: string;
}

export interface ContractCallState {
  callId: string;
  contractAddress: string;
  method: string;
  args: unknown[];
  result: unknown;
  timestamp: string;
  error?: string;
}

export interface ContractDeploymentRequest {
  contractName: string;
  constructorArgs?: unknown[];
  networkId?: string;
}

export interface ContractCallRequest {
  contractAddress: string;
  method: string;
  args?: unknown[];
  value?: bigint;
  from?: string;
}

export interface ContractEventSubscription {
  contractAddress: string;
  eventName?: string;
  callback?: (event: ContractEvent) => void;
}

export class ContractOrchestrationService {
  private stateIntegration: StateIntegrationService;

  constructor() {
    this.stateIntegration = getStateIntegrationService();
  }

  // ========================================================================
  // Contract Discovery & Management
  // ========================================================================

  /**
   * Get all deployed contracts with their current state
   */
  async getAllContracts(): Promise<BrowserContractOrchestrator[]> {
    return this.stateIntegration.getAllContractsDataForAPI();
  }

  /**
   * Get contract by address with full state information
   */
  async getContract(contractAddress: string): Promise<{
    contract: BrowserContractOrchestrator;
    calls: ContractCallState[];
    events: ContractEvent[];
    isActive: boolean;
  } | null> {
    return this.stateIntegration.getContractDataForAPI(contractAddress);
  }

  /**
   * Get contracts by name pattern
   */
  async getContractsByName(
    namePattern: string
  ): Promise<BrowserContractOrchestrator[]> {
    const allContracts = await this.getAllContracts();
    const pattern = new RegExp(namePattern, 'i');
    return allContracts.filter((contract) => pattern.test(contract.name || ''));
  }

  /**
   * Get contracts by network
   */
  async getContractsByNetwork(
    networkId: string
  ): Promise<BrowserContractOrchestrator[]> {
    const allContracts = await this.getAllContracts();
    return allContracts.filter((contract) => contract.chainId === networkId);
  }

  /**
   * Get active contract (currently selected)
   */
  async getActiveContract(): Promise<BrowserContractOrchestrator | null> {
    const contractState = this.stateIntegration.getContractState();
    return contractState.activeContract;
  }

  // ========================================================================
  // Contract Deployment
  // ========================================================================

  /**
   * Deploy a new contract
   */
  async deployContract(
    request: ContractDeploymentRequest
  ): Promise<BrowserContractOrchestrator> {
    // Switch network if specified
    if (request.networkId) {
      await this.stateIntegration.switchNetwork(request.networkId);
    }

    // Deploy the contract
    const contract = await this.stateIntegration.deployContract(
      request.contractName,
      request.constructorArgs
    );

    // Select the newly deployed contract
    this.stateIntegration.selectContract(contract.address);

    return contract;
  }

  /**
   * Deploy multiple contracts in sequence
   */
  async deployMultipleContracts(
    requests: ContractDeploymentRequest[]
  ): Promise<BrowserContractOrchestrator[]> {
    const contracts: BrowserContractOrchestrator[] = [];

    for (const request of requests) {
      const contract = await this.deployContract(request);
      contracts.push(contract);
    }

    return contracts;
  }

  // ========================================================================
  // Contract Interaction
  // ========================================================================

  /**
   * Call a contract method (read or write)
   */
  async callContractMethod(
    request: ContractCallRequest
  ): Promise<ContractCallState> {
    const params: ContractCallParams = {
      contractAddress: request.contractAddress,
      method: request.method,
      args: request.args || [],
      value: request.value || 0n,
      from: request.from,
    };

    return this.stateIntegration.callContractMethod(params);
  }

  /**
   * Read contract data (view/pure functions)
   */
  async readContract(
    contractAddress: string,
    method: string,
    args: unknown[] = []
  ): Promise<ContractCallState> {
    return this.callContractMethod({
      contractAddress,
      method,
      args,
    });
  }

  /**
   * Write to contract (state-changing functions)
   */
  async writeContract(
    contractAddress: string,
    method: string,
    args: unknown[] = [],
    value: bigint = 0n,
    from?: string
  ): Promise<ContractCallState> {
    return this.callContractMethod({
      contractAddress,
      method,
      args,
      value,
      from,
    });
  }

  // ========================================================================
  // Contract Events
  // ========================================================================

  /**
   * Subscribe to contract events
   */
  async subscribeToContractEvents(
    subscription: ContractEventSubscription
  ): Promise<void> {
    this.stateIntegration.subscribeToEvents(
      subscription.contractAddress,
      subscription.eventName
    );
  }

  /**
   * Unsubscribe from contract events
   */
  async unsubscribeFromContractEvents(
    subscription: ContractEventSubscription
  ): Promise<void> {
    this.stateIntegration.unsubscribeFromEvents(
      subscription.contractAddress,
      subscription.eventName
    );
  }

  /**
   * Get contract events history
   */
  async getContractEvents(contractAddress: string): Promise<ContractEvent[]> {
    const contractData = await this.getContract(contractAddress);
    return contractData?.events || [];
  }

  // ========================================================================
  // Contract Analysis
  // ========================================================================

  /**
   * Analyze contract capabilities
   */
  async analyzeContract(contractAddress: string): Promise<{
    capabilities: {
      canRead: boolean;
      canWrite: boolean;
      canReceive: boolean;
      canFallback: boolean;
      hasEvents: boolean;
      isUpgradeable: boolean;
      isPausable: boolean;
      isOwnable: boolean;
    };
    methods: {
      read: string[];
      write: string[];
      events: string[];
    };
    stats: {
      totalMethods: number;
      readMethods: number;
      writeMethods: number;
      events: number;
    };
  }> {
    const contractData = await this.getContract(contractAddress);
    if (!contractData) {
      throw new Error('Contract not found');
    }

    const contract = contractData.contract;
    const methods = contract.methods;

    return {
      capabilities: {
        canRead: contract.capabilities.read || false,
        canWrite: contract.capabilities.write || false,
        canReceive: false, // Not available in core capabilities
        canFallback: false, // Not available in core capabilities
        hasEvents: contract.capabilities.events || false,
        isUpgradeable: false, // Not available in core capabilities
        isPausable: false, // Not available in core capabilities
        isOwnable: false, // Not available in core capabilities
      },
      methods: {
        read: methods.read || [],
        write: methods.write || [],
        events: methods.events || [],
      },
      stats: {
        totalMethods:
          (methods.read?.length || 0) + (methods.write?.length || 0),
        readMethods: methods.read?.length || 0,
        writeMethods: methods.write?.length || 0,
        events: methods.events?.length || 0,
      },
    };
  }

  /**
   * Get contract usage statistics
   */
  async getContractUsageStats(contractAddress: string): Promise<{
    totalCalls: number;
    readCalls: number;
    writeCalls: number;
    lastCall: string | null;
    callHistory: ContractCallState[];
  }> {
    const contractData = await this.getContract(contractAddress);
    if (!contractData) {
      throw new Error('Contract not found');
    }

    const calls = contractData.calls;
    const readCalls = calls.filter(
      (call) => call.method.includes('view') || call.method.includes('pure')
    );
    const writeCalls = calls.filter(
      (call) => !call.method.includes('view') && !call.method.includes('pure')
    );

    return {
      totalCalls: calls.length,
      readCalls: readCalls.length,
      writeCalls: writeCalls.length,
      lastCall: calls.length > 0 ? calls[calls.length - 1].timestamp : null,
      callHistory: calls,
    };
  }

  // ========================================================================
  // Contract Management
  // ========================================================================

  /**
   * Select a contract as active
   */
  async selectContract(contractAddress: string): Promise<void> {
    this.stateIntegration.selectContract(contractAddress);
  }

  /**
   * Get contract ABI for external use
   */
  async getContractABI(contractAddress: string): Promise<AbiItem[]> {
    const contractData = await this.getContract(contractAddress);
    if (!contractData) {
      throw new Error('Contract not found');
    }

    const abi = contractData.contract.abi;
    if (typeof abi === 'string') {
      return JSON.parse(abi) as AbiItem[];
    } else {
      return abi as AbiItem[];
    }
  }

  /**
   * Get contract bytecode for external use
   */
  async getContractBytecode(contractAddress: string): Promise<string> {
    const contractData = await this.getContract(contractAddress);
    if (!contractData) {
      throw new Error('Contract not found');
    }
    return contractData.contract.bytecode;
  }
}
