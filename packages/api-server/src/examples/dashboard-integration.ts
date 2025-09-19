// Dashboard Integration Example - Shows how to connect the dashboard to the orchestrated API

import { OrchestratedApiServer } from '../api/orchestrated-server';

/**
 * Example of how to integrate the dashboard with the orchestrated API server
 */
export class DashboardIntegration {
  private apiServer: OrchestratedApiServer;
  private baseUrl: string;

  constructor(port: number = 3001) {
    this.apiServer = new OrchestratedApiServer(port);
    this.baseUrl = `http://localhost:${port}`;
  }

  /**
   * Initialize the API server for dashboard integration
   */
  async initialize(): Promise<void> {
    await this.apiServer.initialize();
    await this.apiServer.start();
    console.log('✅ Dashboard integration initialized');
  }

  /**
   * Get all available API endpoints for the dashboard
   */
  getApiEndpoints() {
    return {
      // System endpoints
      system: {
        status: `${this.baseUrl}/api/system/status`,
        health: `${this.baseUrl}/api/system/health`,
        metrics: `${this.baseUrl}/api/system/metrics`,
        state: `${this.baseUrl}/api/system/state`,
        docs: `${this.baseUrl}/api/system/docs`,
      },

      // Contract endpoints
      contracts: {
        list: `${this.baseUrl}/api/contracts`,
        get: (address: string) => `${this.baseUrl}/api/contracts/${address}`,
        deploy: `${this.baseUrl}/api/contracts/deploy`,
        call: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/call`,
        read: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/read`,
        write: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/write`,
        events: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/events`,
        analyze: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/analyze`,
        stats: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/stats`,
        select: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/select`,
        abi: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/abi`,
        bytecode: (address: string) =>
          `${this.baseUrl}/api/contracts/${address}/bytecode`,
      },

      // Wallet endpoints
      wallets: {
        list: `${this.baseUrl}/api/wallets`,
        get: (address: string) => `${this.baseUrl}/api/wallets/${address}`,
        create: `${this.baseUrl}/api/wallets`,
        import: `${this.baseUrl}/api/wallets/import`,
        derive: `${this.baseUrl}/api/wallets/derive`,
        select: (address: string) =>
          `${this.baseUrl}/api/wallets/${address}/select`,
        balance: (address: string) =>
          `${this.baseUrl}/api/wallets/${address}/balance`,
        balances: `${this.baseUrl}/api/wallets/balances/all`,
        refresh: `${this.baseUrl}/api/wallets/balances/refresh`,
        stats: `${this.baseUrl}/api/wallets/stats/overview`,
        history: (address: string) =>
          `${this.baseUrl}/api/wallets/${address}/history`,
        mining: (address: string) =>
          `${this.baseUrl}/api/wallets/${address}/mining`,
      },

      // Node endpoints
      node: {
        status: `${this.baseUrl}/api/node/status`,
        health: `${this.baseUrl}/api/node/health`,
        running: `${this.baseUrl}/api/node/running`,
        starting: `${this.baseUrl}/api/node/starting`,
        stopping: `${this.baseUrl}/api/node/stopping`,
        start: `${this.baseUrl}/api/node/start`,
        stop: `${this.baseUrl}/api/node/stop`,
        restart: `${this.baseUrl}/api/node/restart`,
        config: `${this.baseUrl}/api/node/config`,
        network: {
          current: `${this.baseUrl}/api/node/network/current`,
          switch: `${this.baseUrl}/api/node/network/switch`,
          available: `${this.baseUrl}/api/node/network/available`,
        },
        monitoring: {
          start: `${this.baseUrl}/api/node/monitoring/start`,
          stop: `${this.baseUrl}/api/node/monitoring/stop`,
        },
        metrics: `${this.baseUrl}/api/node/metrics`,
        logs: `${this.baseUrl}/api/node/logs`,
      },
    };
  }

  /**
   * Example dashboard data fetching functions
   */
  async fetchDashboardData() {
    const endpoints = this.getApiEndpoints();

    try {
      // Fetch all dashboard data in parallel
      const [systemStatus, contracts, wallets, nodeStatus, systemHealth] =
        await Promise.all([
          fetch(endpoints.system.status).then((res) => res.json()),
          fetch(endpoints.contracts.list).then((res) => res.json()),
          fetch(endpoints.wallets.list).then((res) => res.json()),
          fetch(endpoints.node.status).then((res) => res.json()),
          fetch(endpoints.system.health).then((res) => res.json()),
        ]);

      return {
        system: {
          status: (systemStatus as { data: unknown }).data,
          health: (systemHealth as { data: unknown }).data,
        },
        contracts: (contracts as { data: unknown }).data,
        wallets: (wallets as { data: unknown }).data,
        node: (nodeStatus as { data: unknown }).data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  /**
   * Example of real-time data subscription
   */
  async subscribeToRealTimeUpdates(callback: (data: unknown) => void) {
    const _endpoints = this.getApiEndpoints();

    // Poll for updates every 5 seconds
    const interval = setInterval(async () => {
      try {
        const data = await this.fetchDashboardData();
        callback(data);
      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
      }
    }, 5000);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }

  /**
   * Example of contract operations for dashboard
   */
  async deployContractForDashboard(
    contractName: string,
    constructorArgs: unknown[] = []
  ) {
    const endpoints = this.getApiEndpoints();

    const response = await fetch(endpoints.contracts.deploy, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractName,
        constructorArgs,
      }),
    });

    return response.json();
  }

  /**
   * Example of wallet operations for dashboard
   */
  async createWalletForDashboard(mnemonic?: string) {
    const endpoints = this.getApiEndpoints();

    const response = await fetch(endpoints.wallets.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mnemonic,
        name: `Wallet ${Date.now()}`,
        description: 'Created from dashboard',
      }),
    });

    return response.json();
  }

  /**
   * Example of node operations for dashboard
   */
  async startNodeForDashboard(config?: unknown) {
    const endpoints = this.getApiEndpoints();

    const response = await fetch(endpoints.node.start, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config,
        autoConnect: true,
        waitForReady: true,
        timeout: 30000,
      }),
    });

    return response.json();
  }

  /**
   * Get dashboard configuration
   */
  getDashboardConfig() {
    return {
      apiBaseUrl: this.baseUrl,
      refreshInterval: 5000, // 5 seconds
      maxRetries: 3,
      timeout: 30000, // 30 seconds
      features: {
        realTimeUpdates: true,
        contractDeployment: true,
        walletManagement: true,
        nodeControl: true,
        analytics: true,
        monitoring: true,
      },
      ui: {
        theme: 'dark',
        sidebarCollapsed: false,
        defaultTab: 'dashboard',
        notifications: {
          enabled: true,
          duration: 5000,
        },
      },
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    await this.apiServer.stop();
    console.log('✅ Dashboard integration shutdown');
  }
}

// Example usage
export async function exampleDashboardIntegration() {
  const integration = new DashboardIntegration(3001);

  try {
    // Initialize
    await integration.initialize();

    // Get configuration
    const config = integration.getDashboardConfig();
    console.log('Dashboard config:', config);

    // Get API endpoints
    const endpoints = integration.getApiEndpoints();
    console.log('Available endpoints:', Object.keys(endpoints));

    // Fetch initial data
    const data = await integration.fetchDashboardData();
    console.log('Dashboard data:', data);

    // Set up real-time updates
    const cleanup = await integration.subscribeToRealTimeUpdates((data) => {
      console.log('Real-time update:', data);
    });

    // Example operations
    // await integration.deployContractForDashboard('MyContract', []);
    // await integration.createWalletForDashboard();
    // await integration.startNodeForDashboard();

    // Cleanup after 30 seconds
    setTimeout(async () => {
      cleanup();
      await integration.shutdown();
    }, 30000);
  } catch (error) {
    console.error('Dashboard integration failed:', error);
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleDashboardIntegration().catch(console.error);
}
