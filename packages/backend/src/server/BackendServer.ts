/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Main Backend Server
 *
 * Combines Express REST API and WebSocket server
 * with DevKit integration
 */

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { DevelopmentAuthService } from '../auth/DevelopmentAuthService.js';
import type { DevKitCompat } from '../devkit-compat.js';
import { DevKitManager } from '../devkit-manager.js';
import { createSetupCheckMiddleware } from '../middleware/setup-check.js';
import { createAdminRoutes } from '../routes/admin.js';
import { createContractRoutes } from '../routes/contracts.js';
import { createDevKitRoutes } from '../routes/devkit.js';
import { createSetupRoutes } from '../routes/setup.js';
import { createSwapRoutes } from '../routes/swap.js';
import { createWalletRoutes } from '../routes/wallet.js';
import { logger } from '../utils/logger.js';
import { initializeContractStorage } from '../services/contract-storage-service.js';
import { getKeystoreService } from '../services/keystore-service.js';
import {
  DevKitWebSocketServer,
  setWebSocketServerInstance,
} from './WebSocketServer.js';

export interface BackendServerConfig {
  port: number;
  wsPort: number;
  devkitConfig: {
    chainId: number;
    evmChainId: number;
    jsonrpcHttpPort: number;
    jsonrpcHttpEthPort: number;
    jsonrpcWsPort?: number;
    jsonrpcWsEthPort?: number;
    log: boolean;
    mnemonic?: string;
    dataDir?: string;
  };
}

export class BackendServer {
  private app: express.Application;
  private server?: any;
  private wsServer?: DevKitWebSocketServer;
  private devkitManager?: DevKitManager;
  private devkit?: DevKitCompat;
  private authService?: DevelopmentAuthService;
  private config: BackendServerConfig;

  constructor(config: BackendServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // Security and optimization middleware
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      })
    );
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  async start() {
    try {
      // Initialize DevKit Manager
      logger.info('Initializing DevKit Manager (node will start on-demand)...');

      this.devkitManager = new DevKitManager({
        chainId: this.config.devkitConfig.chainId,
        evmChainId: this.config.devkitConfig.evmChainId,
        jsonrpcHttpPort: this.config.devkitConfig.jsonrpcHttpPort,
        jsonrpcHttpEthPort: this.config.devkitConfig.jsonrpcHttpEthPort,
        jsonrpcWsPort: this.config.devkitConfig.jsonrpcWsPort,
        jsonrpcWsEthPort: this.config.devkitConfig.jsonrpcWsEthPort,
        log: this.config.devkitConfig.log,
      });

      await this.devkitManager.initialize();

      // Check if setup is completed - server starts in either case
      const setupCompleted = await this.devkitManager.isSetupCompleted();

      if (setupCompleted && this.devkitManager.isReady()) {
        this.devkit = this.devkitManager.getDevKit();

        // Register callback to update devkit reference when wallet is switched
        this.devkitManager.onDevKitUpdate((newDevKit) => {
          logger.info('Updating DevKit reference in BackendServer...');
          this.devkit = newDevKit;

          // Update WebSocket server reference
          if (this.wsServer) {
            this.wsServer.updateDevKit(newDevKit);
          }

          // Update auth service reference
          if (this.authService) {
            this.authService.updateDevKit(newDevKit);
          }
        });

        const walletStatus = await this.devkitManager.getWalletStatus();
        logger.success(
          `DevKit instance created with wallet: ${walletStatus.activeLabel}`
        );
        logger.info(`Data directory: ${walletStatus.dataDir}`);

        // Initialize contract storage with wallet's data directory (defaults to local network)
        const keystore = getKeystoreService();
        const walletDataDir = await keystore.getDataDir();
        await initializeContractStorage('local', walletDataDir);
        logger.info('Contract storage initialized for local network');

        // Initialize auth service with DevKit
        this.authService = new DevelopmentAuthService(this.devkit);
        await this.authService.initialize();

        // Start WebSocket server with DevKit
        logger.info(`Starting WebSocket server on port ${this.config.wsPort}...`);
        this.wsServer = new DevKitWebSocketServer(
          this.config.wsPort,
          this.devkit
        );
        setWebSocketServerInstance(this.wsServer);
        this.wsServer.startNodeStatsUpdates();
        logger.success(`WebSocket server started on port ${this.config.wsPort}`);
      } else {
        logger.warn('⚠️  Setup not completed - Starting in setup mode');
        logger.info('Complete setup via:');
        logger.info('  • Web UI: http://localhost:5173');
        logger.info('  • API: POST /api/setup/complete');

        // Initialize auth service without DevKit (limited functionality)
        this.authService = new DevelopmentAuthService(undefined);
        await this.authService.initialize();

        // Start WebSocket server without DevKit (limited functionality)
        logger.info(`Starting WebSocket server on port ${this.config.wsPort}...`);
        this.wsServer = new DevKitWebSocketServer(
          this.config.wsPort,
          undefined
        );
        setWebSocketServerInstance(this.wsServer);
        logger.success(`WebSocket server started on port ${this.config.wsPort} (setup mode)`);
      }

      // Setup routes (works in both modes - protected routes check setup status)
      this.setupRoutes();

      // Start HTTP server
      logger.info(`Starting HTTP server on port ${this.config.port}...`);
      this.server = this.app.listen(this.config.port, () => {
        logger.success(`Backend server started on port ${this.config.port}`);
        logger.info('Available endpoints:');
        logger.info(`  - HTTP API: http://localhost:${this.config.port}`);
        logger.info(`  - WebSocket: ws://localhost:${this.config.wsPort}`);
        logger.info(`  - Health: http://localhost:${this.config.port}/health`);
        if (!setupCompleted) {
          logger.info(`  - Setup: POST http://localhost:${this.config.port}/api/setup/complete`);
        }
      });
    } catch (error) {
      logger.error('Failed to start backend server:', error);
      throw error;
    }
  }

  private setupRoutes() {
    if (!this.authService) {
      throw new Error('AuthService must be initialized before setting up routes');
    }

    // Public authentication routes (no auth required)
    this.app.post('/api/auth/challenge', (req, res) => {
      const { address } = req.body;

      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: 'Invalid wallet address' });
      }

      try {
        const challenge = this.authService?.generateChallenge(address);
        if (!challenge) {
          return res
            .status(500)
            .json({ error: 'Failed to generate challenge' });
        }
        res.json({
          message: challenge.message,
          nonce: challenge.nonce,
        });
      } catch (error) {
        logger.error('Failed to generate challenge:', error);
        res.status(500).json({ error: 'Failed to generate challenge' });
      }
    });

    this.app.post('/api/auth/verify', async (req, res) => {
      const { address, signature } = req.body;

      if (!address || !signature) {
        return res
          .status(400)
          .json({ error: 'Address and signature are required' });
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: 'Invalid wallet address' });
      }

      if (!/^0x[a-fA-F0-9]+$/.test(signature)) {
        return res.status(400).json({ error: 'Invalid signature format' });
      }

      try {
        const result = await this.authService?.verifyAndCreateSession(
          address,
          signature
        );

        if (result?.success && result.sessionId) {
          const user = this.authService?.validateSession(result.sessionId);
          res.json({
            sessionId: result.sessionId,
            address: user?.address,
            isAdmin: user?.isAdmin || false,
          });
        } else {
          res.status(401).json({
            error: result?.error || 'Invalid signature or expired challenge',
          });
        }
      } catch (error) {
        logger.error('Failed to verify signature:', error);
        res.status(500).json({ error: 'Failed to verify signature' });
      }
    });

    // Setup routes (public - no auth required for initial setup)
    // Pass reinitialization callback for hot-reload after setup completion
    this.app.use(
      '/api/setup',
      createSetupRoutes({
        onSetupComplete: () => this.reinitializeAfterSetup(),
      })
    );

    // Admin routes (requires admin auth + setup completed)
    this.app.use(
      '/api/admin',
      createSetupCheckMiddleware(),
      createAdminRoutes(this.authService)
    );

    // Wallet routes (requires admin auth + setup completed)
    this.app.use(
      '/api/wallet',
      createSetupCheckMiddleware(),
      createWalletRoutes(this.authService)
    );

    // Apply authentication middleware to protected routes
    this.app.use('/api/devkit', this.authService.requireAuth);

    // Apply setup check middleware to devkit routes
    this.app.use('/api/devkit', createSetupCheckMiddleware());

    // DevKit API routes (pass devkitManager for mnemonic switching support)
    // Use getter function to always get fresh devkit instance (important after wallet switch)
    this.app.use(
      '/api/devkit',
      createDevKitRoutes(() => this.devkit!, this.wsServer, this.devkitManager)
    );

    // Swap API routes (requires auth + setup)
    this.app.use('/api/swap', this.authService.requireAuth);
    this.app.use('/api/swap', createSetupCheckMiddleware());
    // Use getter function to always get fresh devkit instance
    this.app.use(
      '/api/swap',
      createSwapRoutes(() => this.devkit!)
    );

    // Contract deployment API routes (requires auth + setup)
    this.app.use('/api/contracts', this.authService.requireAuth);
    this.app.use('/api/contracts', createSetupCheckMiddleware());
    this.app.use('/api/contracts', createContractRoutes());

    // Public routes (no auth required)
    this.app.get('/api/status', async (_req, res) => {
      let devkitStatus = null;
      if (this.devkit) {
        try {
          devkitStatus = await this.devkit.getStatus();
        } catch (_error) {
          // DevKit instance exists but node is stopped - this is expected
          devkitStatus = {
            core: { connected: false, status: 'stopped' },
            evm: { connected: false, status: 'stopped' },
          };
        }
      }

      res.json({
        server: 'Conflux DevKit Backend Core',
        version: '2.0.0',
        devkit: devkitStatus,
        websocket: {
          port: this.config.wsPort,
          connected: this.wsServer ? 'active' : 'inactive',
        },
      });
    });

    // Development helper endpoint
    this.app.get('/api/dev/session', (_req, res) => {
      const sessionId = this.authService?.getDevelopmentSession();
      if (sessionId) {
        const user = this.authService?.validateSession(sessionId);
        res.json({
          sessionId,
          address: user?.address,
          isAdmin: user?.isAdmin,
          environment: 'development',
        });
      } else {
        res.status(404).json({
          error: 'No development session available',
          environment: process.env.NODE_ENV,
        });
      }
    });

    // Public test endpoint for balance checking
    this.app.get('/api/test-balances', async (_req, res) => {
      try {
        const testAddress = '0xbc621b293C3A35078d3520deC246e70DE40BbA15';

        // Create viem client to read testnet data
        const { createPublicClient, http, formatEther, formatUnits } =
          await import('viem');
        const publicClient = createPublicClient({
          chain: {
            id: 1030, // Conflux eSpace testnet
            name: 'Conflux eSpace Testnet',
            nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://evmtestnet.confluxrpc.com'] },
            },
          },
          transport: http('https://evmtestnet.confluxrpc.com'),
        });

        // Token addresses
        const TOKENS = {
          USDT: {
            address:
              '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355' as `0x${string}`,
            decimals: 18,
          },
          USDC: {
            address:
              '0xfbef97434ffd0587e5a1c88efd5f7bdc405ba6fa' as `0x${string}`,
            decimals: 18,
          },
        };

        // ERC20 ABI for balanceOf
        const ERC20_ABI = [
          {
            inputs: [{ name: 'owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
        ];

        logger.info('🧪 Testing testnet connection and balance fetching...');

        // Get token balances using contract calls
        const [cfxBalance, usdtBalance, usdcBalance] = await Promise.all([
          publicClient.getBalance({ address: testAddress }),
          publicClient.readContract({
            address: TOKENS.USDT.address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [testAddress],
          }),
          publicClient.readContract({
            address: TOKENS.USDC.address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [testAddress],
          }),
        ]);

        // Format token balances (from wei to human readable)
        const cfxFormatted = formatEther(cfxBalance);
        const usdtFormatted = formatUnits(
          usdtBalance as bigint,
          TOKENS.USDT.decimals
        );
        const usdcFormatted = formatUnits(
          usdcBalance as bigint,
          TOKENS.USDC.decimals
        );

        logger.info('📊 Testnet balances fetched successfully:', {
          address: testAddress,
          CFX: cfxFormatted,
          USDT: usdtFormatted,
          USDC: usdcFormatted,
        });

        res.json({
          success: true,
          address: testAddress,
          balances: {
            CFX: cfxFormatted,
            USDT: usdtFormatted,
            USDC: usdcFormatted,
          },
          testnet: 'https://evmtestnet.confluxrpc.com',
        });
      } catch (error) {
        logger.error('Test balance error:', error);
        res.status(500).json({
          error: 'Failed to test balances',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Error handling middleware
    this.app.use((err: any, _req: any, res: any, _nextt: any) => {
      logger.error('Express error:', err);
      res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: err.message }),
      });
    });

    // 404 handler
    this.app.use((req: any, res: any) => {
      res.status(404).json({
        error: 'Not found',
        path: req.originalUrl,
      });
    });
  }

  async stop() {
    logger.info('Shutting down backend server...');

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
      logger.info('WebSocket server closed');
    }

    // Close HTTP server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    // Stop DevKit (if it was started)
    if (this.devkitManager) {
      const isRunning = await this.devkitManager.isNodeRunning();
      if (isRunning && this.devkit) {
        try {
          await this.devkit.stop();
          logger.info('DevKit stopped');
        } catch {
          // DevKit might already be stopped, which is fine
          logger.info('DevKit was already stopped');
        }
      }
    }

    logger.success('Backend server shutdown complete');
  }

  /**
   * Get DevKit Manager instance (for route handlers)
   */
  getDevKitManager(): DevKitManager | undefined {
    return this.devkitManager;
  }

  /**
   * Reinitialize DevKit and dependent services after setup completion
   * This allows hot-reload without requiring a server restart
   */
  async reinitializeAfterSetup(): Promise<boolean> {
    if (!this.devkitManager) {
      logger.error('DevKitManager not available');
      return false;
    }

    logger.info('🔄 Reinitializing services after setup completion...');

    // Reinitialize DevKit via manager
    const success = await this.devkitManager.reinitialize();
    if (!success) {
      logger.error('Failed to reinitialize DevKitManager');
      return false;
    }

    // Get the new DevKit instance
    this.devkit = this.devkitManager.getDevKitOrNull() || undefined;

    if (!this.devkit) {
      logger.error('DevKit instance not available after reinitialization');
      return false;
    }

    // Register callback for future wallet switches
    this.devkitManager.onDevKitUpdate((newDevKit) => {
      logger.info('Updating DevKit reference in BackendServer...');
      this.devkit = newDevKit;

      if (this.wsServer) {
        this.wsServer.updateDevKit(newDevKit);
      }

      if (this.authService) {
        this.authService.updateDevKit(newDevKit);
      }
    });

    // Update WebSocket server with DevKit
    if (this.wsServer) {
      this.wsServer.updateDevKit(this.devkit);
      this.wsServer.startNodeStatsUpdates();
      logger.info('WebSocket server updated with DevKit');
    }

    // Update auth service with DevKit
    if (this.authService) {
      this.authService.updateDevKit(this.devkit);
      await this.authService.refreshAdminAddresses();
      logger.info('Auth service updated with DevKit');
    }

    const walletStatus = await this.devkitManager.getWalletStatus();
    logger.success(`✅ Services reinitialized with wallet: ${walletStatus.activeLabel}`);
    logger.info(`Data directory: ${walletStatus.dataDir}`);

    return true;
  }
}
