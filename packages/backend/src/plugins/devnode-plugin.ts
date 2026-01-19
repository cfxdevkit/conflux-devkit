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
 * Dev Node Plugin
 *
 * Provides optional development node features:
 * - Start/stop local node
 * - Mining controls
 * - Fund accounts
 * - Dev settings
 *
 * This plugin is only loaded when using @conflux-devkit/plugin-devnode
 */

import { Router } from 'express';
import type { AuthenticatedRequest } from '../auth/AuthService.js';
import type { BackendPlugin, PluginContext } from './types.js';

export function createDevNodePlugin(): BackendPlugin {
  const router = Router();

  let context: PluginContext;

  // Node control routes
  router.post('/node/start', async (req: AuthenticatedRequest, res) => {
    try {
      const { mining = false } = req.body;

      // Check if devkit has startNode method
      if (typeof context.devkit.startNode !== 'function') {
        return res.status(501).json({
          error: 'Dev node not available',
          message:
            'Local development node is not configured. Install @conflux-devkit/plugin-devnode.',
        });
      }

      await context.devkit.startNode({ mining });

      res.json({
        success: true,
        message: 'Node started successfully',
        mining,
      });
    } catch (error) {
      context.logger.error('Failed to start node:', error);
      res.status(500).json({
        error: 'Failed to start node',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/node/stop', async (_req: AuthenticatedRequest, res) => {
    try {
      if (typeof context.devkit.stopNode !== 'function') {
        return res.status(501).json({
          error: 'Dev node not available',
        });
      }

      await context.devkit.stopNode();

      res.json({
        success: true,
        message: 'Node stopped successfully',
      });
    } catch (error) {
      context.logger.error('Failed to stop node:', error);
      res.status(500).json({
        error: 'Failed to stop node',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Mining control routes
  router.post('/mining/start', async (_req: AuthenticatedRequest, res) => {
    try {
      if (typeof context.devkit.startMining !== 'function') {
        return res.status(501).json({
          error: 'Mining not available',
        });
      }

      await context.devkit.startMining();

      res.json({
        success: true,
        message: 'Mining started',
      });
    } catch (error) {
      context.logger.error('Failed to start mining:', error);
      res.status(500).json({
        error: 'Failed to start mining',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/mining/stop', async (_req: AuthenticatedRequest, res) => {
    try {
      if (typeof context.devkit.stopMining !== 'function') {
        return res.status(501).json({
          error: 'Mining not available',
        });
      }

      await context.devkit.stopMining();

      res.json({
        success: true,
        message: 'Mining stopped',
      });
    } catch (error) {
      context.logger.error('Failed to stop mining:', error);
      res.status(500).json({
        error: 'Failed to stop mining',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/mining/mine', async (req: AuthenticatedRequest, res) => {
    try {
      const { blocks = 1 } = req.body;

      if (typeof context.devkit.mine !== 'function') {
        return res.status(501).json({
          error: 'Mining not available',
        });
      }

      await context.devkit.mine(blocks);

      res.json({
        success: true,
        blocksMined: blocks,
      });
    } catch (error) {
      context.logger.error('Failed to mine blocks:', error);
      res.status(500).json({
        error: 'Failed to mine blocks',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Fund account route
  router.post('/accounts/fund', async (req: AuthenticatedRequest, res) => {
    try {
      const { address, amount, chain } = req.body;

      if (!address || !amount || !chain) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['address', 'amount', 'chain'],
        });
      }

      if (typeof context.devkit.fundAccount !== 'function') {
        return res.status(501).json({
          error: 'Fund account not available',
          message: 'Only available with local development node',
        });
      }

      await context.devkit.fundAccount(address, amount, chain);

      res.json({
        success: true,
        address,
        amount,
        chain,
      });
    } catch (error) {
      context.logger.error('Failed to fund account:', error);
      res.status(500).json({
        error: 'Failed to fund account',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return {
    name: 'devnode',
    version: '0.1.0',
    description: 'Optional development node features for local testing',
    routes: [
      {
        path: '/api',
        router,
      },
    ],
    async onLoad(ctx: PluginContext) {
      context = ctx;
      ctx.logger.info('Dev node plugin loaded');
    },
    async onUnload() {
      context.logger.info('Dev node plugin unloaded');
    },
  };
}
