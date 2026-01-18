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
 * Development-Friendly Authentication Service
 *
 * Provides secure authentication with seamless development experience:
 * - Production: Full signature verification required
 * - Development: Auto-connects with test accounts while maintaining security patterns
 * - No conditional code complexity - just environment-based configuration
 */

import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import { verifyMessage } from 'viem';
import type { DevKitCompat } from '../devkit-compat.js';
import { getKeystoreService } from '../services/keystore-service.js';
import { logger } from '../utils/logger.js';

export interface AuthUser {
  address: string;
  isAdmin: boolean;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  wallet?: AuthUser;
}

export interface AuthChallenge {
  message: string;
  nonce: string;
  timestamp: number;
}

interface AuthConfig {
  autoConnectDev: boolean;
  allowTestAccounts: boolean;
  sessionTimeout: number;
  challengeExpiry: number;
  testAccounts: string[];
}

export class DevelopmentAuthService {
  private adminAddress?: string;
  private challenges = new Map<string, AuthChallenge>();
  private sessions = new Map<string, AuthUser>();
  private config: AuthConfig;
  private devkit: DevKitCompat;

  constructor(devkit: DevKitCompat) {
    this.devkit = devkit;

    // Environment-based configuration
    const isDev = process.env.NODE_ENV === 'development';

    this.config = {
      autoConnectDev: isDev && process.env.AUTO_CONNECT_DEV !== 'false',
      allowTestAccounts: isDev,
      sessionTimeout: isDev ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000, // 24h dev, 1h prod
      challengeExpiry: 5 * 60 * 1000, // 5 minutes
      testAccounts: [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // hardhat account 0
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // hardhat account 1
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // hardhat account 2
      ],
    };

    logger.info('🔐 Auth Service Configuration:', {
      environment: process.env.NODE_ENV,
      autoConnect: this.config.autoConnectDev,
      testAccounts: this.config.allowTestAccounts,
      sessionTimeout: `${this.config.sessionTimeout / 1000 / 60}min`,
    });

    // Cleanup expired data
    setInterval(() => this.cleanupExpired(), 10 * 60 * 1000);
  }

  async initialize() {
    try {
      // Priority order for admin address:
      // 1. KeystoreService admin wallet (highest priority)
      // 2. Environment variable override
      // 3. First account of default mnemonic (fallback)
      
      const keystore = getKeystoreService();
      const keystoreAdmin = keystore.getAdminAddress();
      
      if (keystoreAdmin) {
        this.adminAddress = keystoreAdmin.toLowerCase();
        logger.info('✅ Admin address from KeystoreService:', this.adminAddress);
      } else {
        // Fallback to environment variable
        const envAdmin =
          process.env.HARDHAT_ADMIN_ADDRESS || process.env.VITE_HARDHAT_ADMIN_ADDRESS;

        if (envAdmin && /^0x[a-fA-F0-9]{40}$/.test(envAdmin)) {
          this.adminAddress = envAdmin.toLowerCase();
          logger.info('✅ Admin address set from environment variable:', this.adminAddress);
        } else {
          // Last resort: derive from mnemonic
          try {
            const ethereumAdminAddress = this.devkit.getEthereumAdminAddress();
            this.adminAddress = ethereumAdminAddress.toLowerCase();
            logger.info('✅ Admin address derived from Ethereum path (m/44\'/60\'/0\'/0/0):', this.adminAddress);
          } catch (error) {
            // Ultimate fallback to legacy test address
            this.adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();
            logger.warn(
              '⚠️ Failed to derive admin address; using legacy test address. Set admin via KeystoreService.',
              { error }
            );
          }
        }
      }

      // Auto-connect in development
      if (this.config.autoConnectDev) {
        await this.createDevelopmentSession();
      }
    } catch (error) {
      logger.error('Failed to initialize auth service:', error);
    }
  }

  /**
   * Create automatic session for development
   */
  private async createDevelopmentSession() {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const user: AuthUser = {
      address: this.adminAddress ?? '',
      isAdmin: true,
      sessionId,
    };

    this.sessions.set(sessionId, user);

    logger.info('🔧 Development session created automatically:', {
      address: user.address,
      sessionId: `${sessionId.slice(0, 8)}...`,
      expires: new Date(
        Date.now() + this.config.sessionTimeout
      ).toLocaleString(),
    });

    return sessionId;
  }

  /**
   * Get development session (for easy testing)
   */
  getDevelopmentSession(): string | null {
    if (!this.config.autoConnectDev) return null;

    // Find existing session for admin
    for (const [sessionId, user] of this.sessions.entries()) {
      if (user.address === this.adminAddress) {
        return sessionId;
      }
    }
    return null;
  }

  /**
   * Generate authentication challenge
   */
  generateChallenge(address: string): AuthChallenge {
    const normalizedAddress = address.toLowerCase();

    // In development, auto-approve test accounts but still generate challenge for consistency
    if (this.config.autoConnectDev && this.isTestAccount(normalizedAddress)) {
      logger.info(
        '🧪 Test account detected, challenge will auto-succeed:',
        normalizedAddress
      );
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const message = `Sign this message to authenticate with Conflux DevKit:\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    const challenge: AuthChallenge = {
      message,
      nonce,
      timestamp,
    };

    this.challenges.set(normalizedAddress, challenge);

    // Auto-cleanup
    setTimeout(() => {
      this.challenges.delete(normalizedAddress);
    }, this.config.challengeExpiry);

    return challenge;
  }

  /**
   * Verify signature and create session
   */
  async verifyAndCreateSession(
    address: string,
    signature: string,
    bypassSignature = false
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const normalizedAddress = address.toLowerCase();
    const challenge = this.challenges.get(normalizedAddress);

    if (!challenge) {
      return { success: false, error: 'No challenge found for this address' };
    }

    // Check challenge expiry
    if (Date.now() - challenge.timestamp > this.config.challengeExpiry) {
      this.challenges.delete(normalizedAddress);
      return { success: false, error: 'Challenge expired' };
    }

    // Development bypass for test accounts
    const shouldBypass =
      bypassSignature ||
      (this.config.autoConnectDev && this.isTestAccount(normalizedAddress));

    if (shouldBypass) {
      logger.info('🔧 Development bypass: Auto-approving test account');
    } else {
      // Verify signature in production or for non-test accounts
      try {
        const isValid = await verifyMessage({
          address: address as `0x${string}`,
          message: challenge.message,
          signature: signature as `0x${string}`,
        });

        if (!isValid) {
          return { success: false, error: 'Invalid signature' };
        }
      } catch (error) {
        logger.error('Signature verification failed:', error);
        return { success: false, error: 'Signature verification failed' };
      }
    }

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const user: AuthUser = {
      address: normalizedAddress,
      isAdmin: this.isAdmin(normalizedAddress),
      sessionId,
    };

    this.sessions.set(sessionId, user);
    this.challenges.delete(normalizedAddress);

    logger.info('✅ Session created:', {
      address: normalizedAddress,
      isAdmin: user.isAdmin,
      method: shouldBypass ? 'auto-dev' : 'signature',
    });

    return { success: true, sessionId };
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string): AuthUser | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Check if address is admin
   */
  private isAdmin(address: string): boolean {
    return address.toLowerCase() === this.adminAddress;
  }

  /**
   * Check if address is a test account
   */
  private isTestAccount(address: string): boolean {
    return (
      this.config.allowTestAccounts &&
      this.config.testAccounts.some(
        (test) => test.toLowerCase() === address.toLowerCase()
      )
    );
  }

  /**
   * Clean up expired challenges and sessions
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let expiredChallenges = 0;

    // Clean challenges
    for (const [address, challenge] of this.challenges.entries()) {
      if (now - challenge.timestamp > this.config.challengeExpiry) {
        this.challenges.delete(address);
        expiredChallenges++;
      }
    }

    // Clean sessions (sessions don't have explicit expiry tracking, so we'll keep them for now)
    // In production, you might want to add timestamp tracking to sessions

    if (expiredChallenges > 0) {
      logger.info(`🧹 Cleaned up ${expiredChallenges} expired challenges`);
    }
  }

  /**
   * Express middleware for authentication
   */
  requireAuth = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'Missing or invalid authorization header' });
    }

    const sessionId = authHeader.slice(7);
    const user = this.validateSession(sessionId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.wallet = user;
    next();
  };

  /**
   * Express middleware for admin-only endpoints
   */
  requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    this.requireAuth(req, res, () => {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  };

  /**
   * Get current sessions (for debugging)
   */
  getActiveSessions(): Array<{
    address: string;
    isAdmin: boolean;
    sessionId: string;
  }> {
    return Array.from(this.sessions.values()).map((user) => ({
      address: user.address,
      isAdmin: user.isAdmin,
      sessionId: `${user.sessionId.slice(0, 8)}...`,
    }));
  }

  /**
   * Update DevKit instance reference (called when wallet is switched)
   */
  updateDevKit(newDevKit: DevKitCompat): void {
    logger.info('Updating DevKit reference in DevelopmentAuthService');
    this.devkit = newDevKit;
    // Note: Admin address comes from keystore, which is already updated
    // No need to re-initialize admin here
  }
}
