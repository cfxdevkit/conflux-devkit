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
import { DevKitCompat as DevKitCompatClass } from '../devkit-compat.js';
import { createDevKitRoutes } from '../routes/devkit.js';
import { createSwapRoutes } from '../routes/swap.js';
import { logger } from '../utils/logger.js';
import { DevKitWebSocketServer } from './WebSocketServer.js';

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
      // Initialize DevKit compatibility layer
      logger.info(
        'Initializing DevKit instance (node will start on-demand)...'
      );
      // Sanitize sensitive values before logging (do not print mnemonic)
      const safeDevKitConfig: BackendServerConfig['devkitConfig'] = {
        ...this.config.devkitConfig,
      };
      if (safeDevKitConfig.mnemonic) {
        // redact full mnemonic value
        safeDevKitConfig.mnemonic = '[REDACTED]';
      }
      logger.info('DevKit config:', JSON.stringify(safeDevKitConfig, null, 2));
      this.devkit = new DevKitCompatClass(this.config.devkitConfig);
      // Note: Not calling devkit.start() here - UI will control node startup
      logger.success('DevKit instance created (node stopped by default)');

      // Initialize auth service
      this.authService = new DevelopmentAuthService(this.devkit);
      await this.authService.initialize();

      // Setup routes
      this.setupRoutes();

      // Start WebSocket server
      logger.info(`Starting WebSocket server on port ${this.config.wsPort}...`);
      this.wsServer = new DevKitWebSocketServer(
        this.config.wsPort,
        this.devkit
      );
      this.wsServer.startNodeStatsUpdates();
      logger.success(`WebSocket server started on port ${this.config.wsPort}`);

      // Start HTTP server
      logger.info(`Starting HTTP server on port ${this.config.port}...`);
      this.server = this.app.listen(this.config.port, () => {
        logger.success(`Backend server started on port ${this.config.port}`);
        logger.info('Available endpoints:');
        logger.info(`  - HTTP API: http://localhost:${this.config.port}`);
        logger.info(`  - WebSocket: ws://localhost:${this.config.wsPort}`);
        logger.info(`  - Health: http://localhost:${this.config.port}/health`);
      });
    } catch (error) {
      logger.error('Failed to start backend server:', error);
      throw error;
    }
  }

  private setupRoutes() {
    if (!this.devkit || !this.authService) {
      throw new Error(
        'DevKit and AuthService must be initialized before setting up routes'
      );
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
          res
            .status(401)
            .json({
              error: result?.error || 'Invalid signature or expired challenge',
            });
        }
      } catch (error) {
        logger.error('Failed to verify signature:', error);
        res.status(500).json({ error: 'Failed to verify signature' });
      }
    });

    // Apply authentication middleware to protected routes
    this.app.use('/api/devkit', this.authService.requireAuth);

    // DevKit API routes
    this.app.use('/api/devkit', createDevKitRoutes(this.devkit, this.wsServer));

    // Swap API routes (requires auth)
    this.app.use('/api/swap', this.authService.requireAuth);
    this.app.use('/api/swap', createSwapRoutes(this.devkit));

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
        const { createPublicClient, http, formatEther, formatUnits } = await import('viem');
        const publicClient = createPublicClient({
          chain: {
            id: 1030, // Conflux eSpace testnet
            name: 'Conflux eSpace Testnet',
            nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
            rpcUrls: { default: { http: ['https://evmtestnet.confluxrpc.com'] } },
          },
          transport: http('https://evmtestnet.confluxrpc.com'),
        });

        // Token addresses
        const TOKENS = {
          USDT: { address: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355' as `0x${string}`, decimals: 18 },
          USDC: { address: '0xfbef97434ffd0587e5a1c88efd5f7bdc405ba6fa' as `0x${string}`, decimals: 18 },
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
        const usdtFormatted = formatUnits(usdtBalance as bigint, TOKENS.USDT.decimals);
        const usdcFormatted = formatUnits(usdcBalance as bigint, TOKENS.USDC.decimals);

        logger.info('📊 Testnet balances fetched successfully:', {
          address: testAddress,
          CFX: cfxFormatted,
          USDT: usdtFormatted,
          USDC: usdcFormatted
        });

        res.json({
          success: true,
          address: testAddress,
          balances: {
            CFX: cfxFormatted,
            USDT: usdtFormatted,
            USDC: usdcFormatted
          },
          testnet: 'https://evmtestnet.confluxrpc.com'
        });

      } catch (error) {
        logger.error('Test balance error:', error);
        res.status(500).json({
          error: 'Failed to test balances',
          details: error instanceof Error ? error.message : 'Unknown error'
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
    if (this.devkit) {
      try {
        await this.devkit.stop();
        logger.info('DevKit stopped');
      } catch {
        // DevKit might already be stopped, which is fine
        logger.info('DevKit was already stopped');
      }
    }

    logger.success('Backend server shutdown complete');
  }
}
