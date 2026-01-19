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

import type { NextFunction, Request, Response } from 'express';
import { getKeystoreService } from '../services/keystore-service';
import { logger } from '../utils/logger';

/**
 * Middleware to check if initial setup is completed
 * Blocks node-related endpoints if setup not done
 */
export async function requireSetup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const keystoreService = getKeystoreService();
    const setupCompleted = await keystoreService.isSetupCompleted();

    if (!setupCompleted) {
      logger.warn(`Setup required for endpoint: ${req.path}`);
      res.status(503).json({
        error: 'Setup required',
        message:
          'Initial setup must be completed before accessing this endpoint',
        setupEndpoint: '/api/setup/status',
        docsUrl: 'https://github.com/conflux-fans/conflux-devkit#setup',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Setup check failed:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check setup status',
    });
  }
}

/**
 * List of endpoints that should be accessible before setup
 */
export const SETUP_EXEMPT_ROUTES = [
  // Health & meta
  '/health',
  '/api/version',

  // Setup endpoints
  '/api/setup/status',
  '/api/setup/validate',
  '/api/setup/complete',

  // Auth endpoints (needed for setup)
  '/api/auth/challenge',
  '/api/auth/verify',
  '/api/auth/session',
  '/api/auth/logout',

  // Development endpoints
  '/api/dev/session',
];

/**
 * Check if a route path is exempt from setup check
 */
export function isSetupExemptRoute(path: string): boolean {
  return SETUP_EXEMPT_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Middleware factory to apply setup check selectively
 */
export function createSetupCheckMiddleware() {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Allow exempt routes
    if (isSetupExemptRoute(req.path)) {
      next();
      return;
    }

    // Check setup for all other routes
    await requireSetup(req, res, next);
  };
}
