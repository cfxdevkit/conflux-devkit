// Service Orchestrator - Coordinates all API services with state management
// This is the main service that orchestrates all other services

import type { NodeConfig } from '@conflux-devkit/core';
import { ContractOrchestrationService } from './ContractOrchestrationService';
import { NodeOrchestrationService } from './NodeOrchestrationService';
import type { StateIntegrationService } from './StateIntegrationService';
import { getStateIntegrationService } from './StateIntegrationService';
import { WalletOrchestrationService } from './WalletOrchestrationService';

export interface ServiceHealth {
  state: 'healthy' | 'unhealthy';
  contracts: 'healthy' | 'unhealthy';
  wallets: 'healthy' | 'unhealthy';
  node: 'healthy' | 'unhealthy';
  overall: 'healthy' | 'unhealthy';
  lastCheck: string;
}

export interface ServiceMetrics {
  uptime: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // requests per minute
  };
  state: {
    contracts: number;
    wallets: number;
    nodeRunning: boolean;
    connections: number;
  };
  performance: {
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface ServiceConfiguration {
  autoStart: boolean;
  autoConnect: boolean;
  monitoring: {
    enabled: boolean;
    interval: number;
  };
  caching: {
    enabled: boolean;
    ttl: number;
  };
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export class ServiceOrchestrator {
  private stateIntegration: StateIntegrationService;
  private contractService: ContractOrchestrationService;
  private walletService: WalletOrchestrationService;
  private nodeService: NodeOrchestrationService;
  private isInitialized = false;
  private startTime: number = 0;
  private requestCount = 0;
  private successfulRequests = 0;
  private failedRequests = 0;

  constructor() {
    this.stateIntegration = getStateIntegrationService();
    this.contractService = new ContractOrchestrationService();
    this.walletService = new WalletOrchestrationService();
    this.nodeService = new NodeOrchestrationService();
  }

  // ========================================================================
  // Service Lifecycle
  // ========================================================================

  /**
   * Initialize all services
   */
  async initialize(config?: Partial<ServiceConfiguration>): Promise<void> {
    if (this.isInitialized) {
      console.warn('ServiceOrchestrator is already initialized');
      return;
    }

    try {
      // Initialize state service
      // Note: StateIntegrationService doesn't have initialize method yet
      // await this.stateIntegration.initialize();

      // Set up event listeners
      this.setupEventListeners();

      // Start monitoring if enabled
      if (config?.monitoring?.enabled) {
        await this.startMonitoring(config.monitoring.interval);
      }

      this.isInitialized = true;
      this.startTime = Date.now();
      console.log('ServiceOrchestrator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ServiceOrchestrator:', error);
      throw error;
    }
  }

  /**
   * Destroy all services
   */
  async destroy(): Promise<void> {
    try {
      // Stop monitoring
      await this.stopMonitoring();

      // Disconnect from state
      await this.stateIntegration.disconnect();

      // Note: StateIntegrationService doesn't have destroy method yet
      // this.stateIntegration.destroy();

      this.isInitialized = false;
      console.log('ServiceOrchestrator destroyed');
    } catch (error) {
      console.error('Failed to destroy ServiceOrchestrator:', error);
    }
  }

  // ========================================================================
  // Service Access
  // ========================================================================

  /**
   * Get contract orchestration service
   */
  getContractService(): ContractOrchestrationService {
    return this.contractService;
  }

  /**
   * Get wallet orchestration service
   */
  getWalletService(): WalletOrchestrationService {
    return this.walletService;
  }

  /**
   * Get node orchestration service
   */
  getNodeService(): NodeOrchestrationService {
    return this.nodeService;
  }

  /**
   * Get state integration service
   */
  getStateService(): StateIntegrationService {
    return this.stateIntegration;
  }

  // ========================================================================
  // Service Health & Monitoring
  // ========================================================================

  /**
   * Get overall service health
   */
  async getServiceHealth(): Promise<ServiceHealth> {
    try {
      const nodeHealth = await this.nodeService.getNodeHealthCheck();
      const isNodeHealthy = nodeHealth.status === 'healthy';

      // Check if services are responsive
      const contractsHealthy = await this.checkContractServiceHealth();
      const walletsHealthy = await this.checkWalletServiceHealth();
      const stateHealthy = await this.checkStateServiceHealth();

      const overall =
        isNodeHealthy && contractsHealthy && walletsHealthy && stateHealthy
          ? 'healthy'
          : 'unhealthy';

      return {
        state: stateHealthy ? 'healthy' : 'unhealthy',
        contracts: contractsHealthy ? 'healthy' : 'unhealthy',
        wallets: walletsHealthy ? 'healthy' : 'unhealthy',
        node: isNodeHealthy ? 'healthy' : 'unhealthy',
        overall,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get service health:', error);
      return {
        state: 'unhealthy',
        contracts: 'unhealthy',
        wallets: 'unhealthy',
        node: 'unhealthy',
        overall: 'unhealthy',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Get service metrics
   */
  async getServiceMetrics(): Promise<ServiceMetrics> {
    const uptime = this.startTime > 0 ? Date.now() - this.startTime : 0;
    const rate = this.startTime > 0 ? this.requestCount / (uptime / 60000) : 0;

    const state = this.stateIntegration.getStateForAPI();
    const nodeRunning = await this.nodeService.isNodeRunning();

    return {
      uptime,
      requests: {
        total: this.requestCount,
        successful: this.successfulRequests,
        failed: this.failedRequests,
        rate,
      },
      state: {
        contracts: state.contracts.deployed.length,
        wallets: state.wallets.wallets.length,
        nodeRunning,
        connections: state.connection.isConnected ? 1 : 0,
      },
      performance: {
        averageResponseTime: 0, // TODO: Implement response time tracking
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0, // TODO: Implement CPU usage tracking
      },
    };
  }

  // ========================================================================
  // Request Tracking
  // ========================================================================

  /**
   * Track a successful request
   */
  trackRequest(success: boolean = true): void {
    this.requestCount++;
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }
  }

  // ========================================================================
  // Quick Access Methods
  // ========================================================================

  /**
   * Get complete system status
   */
  async getSystemStatus(): Promise<{
    health: ServiceHealth;
    metrics: ServiceMetrics;
    state: unknown;
  }> {
    const [health, metrics, state] = await Promise.all([
      this.getServiceHealth(),
      this.getServiceMetrics(),
      this.stateIntegration.getStateForAPI(),
    ]);

    return { health, metrics, state };
  }

  /**
   * Quick start - Initialize and start node
   */
  async quickStart(config?: Partial<NodeConfig>): Promise<void> {
    await this.initialize();
    await this.nodeService.startNode({
      config,
      autoConnect: true,
      waitForReady: true,
    });
  }

  /**
   * Quick stop - Stop node and cleanup
   */
  async quickStop(): Promise<void> {
    await this.nodeService.stopNode();
    await this.destroy();
  }

  // ========================================================================
  // Event Listeners
  // ========================================================================

  private setupEventListeners(): void {
    // Listen to state events and propagate them
    this.stateIntegration.on('state:connected', () => {
      console.log('ServiceOrchestrator: Connected to Conflux network');
    });

    this.stateIntegration.on('state:disconnected', () => {
      console.log('ServiceOrchestrator: Disconnected from Conflux network');
    });

    this.stateIntegration.on('state:node:started', (status) => {
      console.log('ServiceOrchestrator: Node started', status);
    });

    this.stateIntegration.on('state:node:stopped', () => {
      console.log('ServiceOrchestrator: Node stopped');
    });

    this.stateIntegration.on('state:wallet:created', (wallet) => {
      console.log(
        'ServiceOrchestrator: Wallet created',
        (wallet as { address: string }).address
      );
    });

    this.stateIntegration.on('state:contract:deployed', (contract) => {
      console.log(
        'ServiceOrchestrator: Contract deployed',
        (contract as { address: string }).address
      );
    });

    this.stateIntegration.on('state:error', (type, error) => {
      console.error(`ServiceOrchestrator: Error in ${type}`, error);
    });
  }

  // ========================================================================
  // Health Check Helpers
  // ========================================================================

  private async checkContractServiceHealth(): Promise<boolean> {
    try {
      await this.contractService.getAllContracts();
      return true;
    } catch {
      return false;
    }
  }

  private async checkWalletServiceHealth(): Promise<boolean> {
    try {
      await this.walletService.getAllWallets();
      return true;
    } catch {
      return false;
    }
  }

  private async checkStateServiceHealth(): Promise<boolean> {
    try {
      this.stateIntegration.getStateForAPI();
      return true;
    } catch {
      return false;
    }
  }

  // ========================================================================
  // Monitoring
  // ========================================================================

  private monitoringInterval: NodeJS.Timeout | null = null;

  private async startMonitoring(interval: number): Promise<void> {
    this.monitoringInterval = setInterval(async () => {
      try {
        const health = await this.getServiceHealth();
        if (health.overall === 'unhealthy') {
          console.warn('Service health check failed:', health);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, interval);
  }

  private async stopMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Singleton instance
let serviceOrchestratorInstance: ServiceOrchestrator | null = null;

export const getServiceOrchestrator = (): ServiceOrchestrator => {
  if (!serviceOrchestratorInstance) {
    serviceOrchestratorInstance = new ServiceOrchestrator();
  }
  return serviceOrchestratorInstance;
};
