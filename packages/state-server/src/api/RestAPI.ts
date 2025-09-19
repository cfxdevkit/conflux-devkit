// ============================================================================
// REST API Implementation
// ============================================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { z } from 'zod';
import { useServerStore } from '../services/StateService';
import {
  ConnectionRequestSchema,
  NodeRequestSchema,
  WalletCreateRequestSchema,
  WalletImportRequestSchema,
  ContractDeployRequestSchema,
  ContractCallRequestSchema,
  NetworkSwitchRequestSchema,
  APIResponse,
} from '../types';

// ============================================================================
// API Server Class
// ============================================================================

export class RestAPIServer {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Connection routes
    this.app.post('/api/connect', this.handleConnect.bind(this));
    this.app.post('/api/disconnect', this.handleDisconnect.bind(this));

    // Node routes
    this.app.get('/api/node/status', this.handleGetNodeStatus.bind(this));
    this.app.post('/api/node/start', this.handleStartNode.bind(this));
    this.app.post('/api/node/stop', this.handleStopNode.bind(this));
    this.app.post('/api/node/restart', this.handleRestartNode.bind(this));

    // Wallet routes
    this.app.get('/api/wallets', this.handleGetWallets.bind(this));
    this.app.post('/api/wallets', this.handleCreateWallet.bind(this));
    this.app.post('/api/wallets/import', this.handleImportWallet.bind(this));
    this.app.put(
      '/api/wallets/:address/select',
      this.handleSelectWallet.bind(this)
    );
    this.app.get(
      '/api/wallets/:address/balance',
      this.handleGetWalletBalance.bind(this)
    );
    this.app.delete(
      '/api/wallets/:address',
      this.handleRemoveWallet.bind(this)
    );

    // Contract routes
    this.app.get('/api/contracts', this.handleGetContracts.bind(this));
    this.app.post('/api/contracts', this.handleDeployContract.bind(this));
    this.app.put(
      '/api/contracts/:address/select',
      this.handleSelectContract.bind(this)
    );
    this.app.post(
      '/api/contracts/:address/call',
      this.handleCallContract.bind(this)
    );
    this.app.delete(
      '/api/contracts/:address',
      this.handleRemoveContract.bind(this)
    );

    // Network routes
    this.app.get('/api/networks', this.handleGetNetworks.bind(this));
    this.app.post('/api/networks/switch', this.handleSwitchNetwork.bind(this));

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  // ====================================================================
  // Connection Handlers
  // ====================================================================

  private async handleConnect(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const body = ConnectionRequestSchema.parse(req.body);
      const store = useServerStore.getState();

      await store.connect(body.config);

      const response: APIResponse = {
        success: true,
        data: {
          isConnected: store.isConnected,
          network: store.currentNetwork,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleDisconnect(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const store = useServerStore.getState();
      await store.disconnect();

      const response: APIResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ====================================================================
  // Node Handlers
  // ====================================================================

  private async handleGetNodeStatus(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const store = useServerStore.getState();

      const response: APIResponse = {
        success: true,
        data: {
          status: store.node.status,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleStartNode(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const body = NodeRequestSchema.parse(req.body);
      const store = useServerStore.getState();

      await store.startNode(body.config);

      const response: APIResponse = {
        success: true,
        data: {
          status: store.node.status,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleStopNode(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const store = useServerStore.getState();
      await store.stopNode();

      const response: APIResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleRestartNode(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const body = NodeRequestSchema.parse(req.body);
      const store = useServerStore.getState();

      await store.restartNode(body.config);

      const response: APIResponse = {
        success: true,
        data: {
          status: store.node.status,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ====================================================================
  // Wallet Handlers
  // ====================================================================

  private async handleGetWallets(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const store = useServerStore.getState();
      const wallets = Array.from(store.wallets.wallets.values());

      const response: APIResponse = {
        success: true,
        data: {
          wallets,
          activeWallet: store.wallets.activeWallet,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleCreateWallet(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const body = WalletCreateRequestSchema.parse(req.body);
      const store = useServerStore.getState();

      const wallet = await store.createWallet(body.mnemonic);

      const response: APIResponse = {
        success: true,
        data: { wallet },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleImportWallet(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const body = WalletImportRequestSchema.parse(req.body);
      const store = useServerStore.getState();

      const wallet = await store.importWallet(body.privateKey);

      const response: APIResponse = {
        success: true,
        data: { wallet },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleSelectWallet(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { address } = req.params;
      const store = useServerStore.getState();

      store.selectWallet(address);

      const response: APIResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleGetWalletBalance(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { address } = req.params;
      const store = useServerStore.getState();

      await store.refreshWalletBalance(address);
      const wallet = store.wallets.wallets.get(address);

      const response: APIResponse = {
        success: true,
        data: {
          balance: wallet?.balance || '0',
          balanceFormatted: wallet?.balanceFormatted || '0.000000 CFX',
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleRemoveWallet(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { address } = req.params;
      const store = useServerStore.getState();

      store.removeWallet(address);

      const response: APIResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ====================================================================
  // Contract Handlers
  // ====================================================================

  private async handleGetContracts(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const store = useServerStore.getState();
      const contracts = Array.from(store.contracts.contracts.values());

      const response: APIResponse = {
        success: true,
        data: {
          contracts,
          activeContract: store.contracts.activeContract,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleDeployContract(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const body = ContractDeployRequestSchema.parse(req.body);
      const store = useServerStore.getState();

      const contract = await store.deployContract(body.contractName, body.args);

      const response: APIResponse = {
        success: true,
        data: { contract },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleSelectContract(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { address } = req.params;
      const store = useServerStore.getState();

      store.selectContract(address);

      const response: APIResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleCallContract(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { address } = req.params;
      const body = ContractCallRequestSchema.parse(req.body);
      const store = useServerStore.getState();

      const result = await store.callContractMethod(body);

      const response: APIResponse = {
        success: true,
        data: { result },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleRemoveContract(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { address } = req.params;
      const store = useServerStore.getState();

      store.removeContract(address);

      const response: APIResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ====================================================================
  // Network Handlers
  // ====================================================================

  private async handleGetNetworks(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const store = useServerStore.getState();

      const response: APIResponse = {
        success: true,
        data: {
          networks: store.networks.available,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleSwitchNetwork(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const body = NetworkSwitchRequestSchema.parse(req.body);
      const store = useServerStore.getState();

      await store.switchNetwork(body.networkId);

      const response: APIResponse = {
        success: true,
        data: {
          network: store.currentNetwork,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ====================================================================
  // Error Handling
  // ====================================================================

  private handleError(error: unknown, res: express.Response): void {
    console.error('API Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    const statusCode =
      error instanceof Error && 'status' in error ? (error as any).status : 500;

    const response: APIResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(response);
  }

  private errorHandler(
    error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {
    this.handleError(error, res);
  }

  // ====================================================================
  // Server Management
  // ====================================================================

  public start(): Promise<void> {
    return new Promise(resolve => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 REST API Server running on port ${this.port}`);
        console.log(`📡 Health check: http://localhost:${this.port}/health`);
        console.log(`🔗 API Base URL: http://localhost:${this.port}/api`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 REST API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
