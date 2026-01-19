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
 * Admin Management API Routes
 *
 * Handles admin operations (requires authentication):
 * 1. GET /api/admin/list - List all admin addresses
 * 2. POST /api/admin/add - Add a new admin address
 * 3. DELETE /api/admin/:address - Remove an admin address
 * 4. GET /api/admin/check/:address - Check if an address is admin
 */

import { Router } from 'express';
import type {
  AuthenticatedRequest,
  DevelopmentAuthService,
} from '../auth/DevelopmentAuthService.js';
import { getKeystoreService } from '../services/keystore-service.js';
import { logger } from '../utils/logger.js';

export function createAdminRoutes(authService: DevelopmentAuthService): Router {
  const router = Router();

  /**
   * GET /api/admin/list
   * List all admin addresses
   * Requires: Admin authentication
   */
  router.get('/list', authService.requireAdmin, async (req, res) => {
    try {
      const keystoreService = getKeystoreService();
      const admins = await keystoreService.getAdminAddresses();

      res.json({
        admins,
        count: admins.length,
        currentAdmin: (req as AuthenticatedRequest).wallet?.address,
      });
    } catch (error) {
      logger.error('Failed to list admins:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list admin addresses',
      });
    }
  });

  /**
   * POST /api/admin/add
   * Add a new admin address
   * Requires: Admin authentication
   * Body: { address: string }
   */
  router.post('/add', authService.requireAdmin, async (req, res) => {
    try {
      const { address } = req.body;

      if (!address) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Address is required',
        });
        return;
      }

      if (!isValidEthereumAddress(address)) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid address format (must be 0x... hex address)',
        });
        return;
      }

      const keystoreService = getKeystoreService();
      await keystoreService.addAdminAddress(address);

      // Refresh auth service admin cache
      await authService.refreshAdminAddresses();

      logger.info(
        `Admin added: ${address} by ${(req as AuthenticatedRequest).wallet?.address}`
      );

      res.json({
        success: true,
        message: 'Admin address added successfully',
        address,
      });
    } catch (error) {
      logger.error('Failed to add admin:', error);

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to add admin',
      });
    }
  });

  /**
   * DELETE /api/admin/:address
   * Remove an admin address
   * Requires: Admin authentication
   */
  router.delete('/:address', authService.requireAdmin, async (req, res) => {
    try {
      const address = req.params.address as string;
      const currentAdmin = (req as AuthenticatedRequest).wallet?.address;

      if (!address) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Address parameter is required',
        });
        return;
      }

      if (!isValidEthereumAddress(address)) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid address format',
        });
        return;
      }

      const keystoreService = getKeystoreService();
      await keystoreService.removeAdminAddress(address, currentAdmin!);

      // Refresh auth service admin cache
      await authService.refreshAdminAddresses();

      logger.info(`Admin removed: ${address} by ${currentAdmin}`);

      res.json({
        success: true,
        message: 'Admin address removed successfully',
        address,
      });
    } catch (error) {
      logger.error('Failed to remove admin:', error);

      if (error instanceof Error) {
        if (error.message.includes('Cannot remove your own')) {
          res.status(403).json({
            error: 'Forbidden',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('Cannot remove the last')) {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Not found',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to remove admin',
      });
    }
  });

  /**
   * GET /api/admin/check/:address
   * Check if an address is admin
   * Public endpoint (no auth required)
   */
  router.get('/check/:address', async (req, res) => {
    try {
      const address = req.params.address as string;

      if (!address) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Address parameter is required',
        });
        return;
      }

      if (!isValidEthereumAddress(address)) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid address format',
        });
        return;
      }

      const keystoreService = getKeystoreService();
      const isAdmin = keystoreService.isAdmin(address);

      res.json({
        address,
        isAdmin,
      });
    } catch (error) {
      logger.error('Failed to check admin status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check admin status',
      });
    }
  });

  return router;
}

/**
 * Check if a string is a valid Ethereum address
 */
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
