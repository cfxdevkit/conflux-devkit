// Orchestrated Express server setup - Uses the new service architecture

import { createInternalError } from '@conflux-devkit/core';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import {
  getServiceOrchestrator,
  type ServiceHealth,
} from '../services/ServiceOrchestrator';
import { healthRoutes } from './routes/health';
import { orchestratedContractRoutes } from './routes/orchestrated-contract';
import { orchestratedNodeRoutes } from './routes/orchestrated-node';
import { orchestratedWalletRoutes } from './routes/orchestrated-wallet';
import { systemRoutes } from './routes/system';

export class OrchestratedApiServer {
  private app: express.Application;
  private port: number;
  private orchestrator = getServiceOrchestrator();

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS middleware
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
          'http://localhost:3001',
        ],
        credentials: true,
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.use('/api/health', healthRoutes);

    // Orchestrated API routes
    this.app.use('/api/contracts', orchestratedContractRoutes);
    this.app.use('/api/wallets', orchestratedWalletRoutes);
    this.app.use('/api/node', orchestratedNodeRoutes);
    this.app.use('/api/system', systemRoutes);

    // Root route
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Conflux DevKit Orchestrated API Server',
        version: '1.0.0',
        status: 'running',
        architecture: 'Microservices with State Orchestration',
        services: [
          'Contract Orchestration Service',
          'Wallet Orchestration Service',
          'Node Orchestration Service',
          'State Integration Service',
        ],
        endpoints: {
          contracts: '/api/contracts',
          wallets: '/api/wallets',
          node: '/api/node',
          system: '/api/system',
          health: '/api/health',
        },
        documentation: '/api/system/docs',
        timestamp: new Date().toISOString(),
      });
    });

    // API documentation redirect
    this.app.get('/docs', (_req, res) => {
      res.redirect('/api/system/docs');
    });

    // 404 handler
    this.app.use('*', (_req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
          availableEndpoints: [
            '/api/contracts',
            '/api/wallets',
            '/api/node',
            '/api/system',
            '/api/health',
          ],
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use(
      (
        error: Error,
        req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        console.error('API Error:', error);

        const internalError = createInternalError('Internal server error', {
          error: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
        });

        res.status(500).json({
          success: false,
          error: {
            code: internalError.code,
            message: internalError.message,
            timestamp: internalError.timestamp,
          },
        });
      }
    );
  }

  /**
   * Initialize the server and services
   */
  async initialize(): Promise<void> {
    try {
      // Initialize the service orchestrator
      await this.orchestrator.initialize({
        autoStart: true,
        autoConnect: true,
        monitoring: {
          enabled: true,
          interval: 5000,
        },
        caching: {
          enabled: true,
          ttl: 300000, // 5 minutes
        },
        rateLimiting: {
          enabled: true,
          maxRequests: 1000,
          windowMs: 900000, // 15 minutes
        },
      });

      console.log('✅ Service orchestrator initialized');
    } catch (error) {
      console.error('❌ Failed to initialize service orchestrator:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.app.listen(this.port, () => {
          console.log(
            `🚀 Orchestrated API Server running on port ${this.port}`
          );
          console.log(
            `📊 Health check: http://localhost:${this.port}/api/health`
          );
          console.log(
            `📚 API docs: http://localhost:${this.port}/api/system/docs`
          );
          console.log(
            `🔗 System status: http://localhost:${this.port}/api/system/status`
          );
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server and cleanup
   */
  async stop(): Promise<void> {
    try {
      // Destroy the service orchestrator
      await this.orchestrator.destroy();
      console.log('✅ Service orchestrator destroyed');
    } catch (error) {
      console.error('❌ Failed to destroy service orchestrator:', error);
    }
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get service orchestrator instance
   */
  getOrchestrator() {
    return this.orchestrator;
  }

  /**
   * Get server health status
   */
  async getHealthStatus(): Promise<{
    server: 'running' | 'stopped';
    services: ServiceHealth;
    uptime: number;
  }> {
    try {
      const health = await this.orchestrator.getServiceHealth();
      const metrics = await this.orchestrator.getServiceMetrics();

      return {
        server: 'running',
        services: health,
        uptime: metrics.uptime,
      };
    } catch (_error) {
      return {
        server: 'stopped',
        services: {
          state: 'unhealthy',
          contracts: 'unhealthy',
          wallets: 'unhealthy',
          node: 'unhealthy',
          overall: 'unhealthy',
          lastCheck: new Date().toISOString(),
        },
        uptime: 0,
      };
    }
  }
}
