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
 * Signature-based wallet authentication service
 *
 * Implements challenge-response authentication where users must sign
 * a message to prove wallet ownership. No private keys reach the frontend.
 */

import type { DevKitCompat } from '../devkit-compat.js';
import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { verifyMessage } from 'viem';
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

export class AuthService {
  private devkit: DevKitCompat;
  private adminAddress?: string;
  private challenges = new Map<string, AuthChallenge>();
  private sessions = new Map<string, AuthUser>();
  private readonly CHALLENGE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private readonly SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor(devkit: DevKitCompat) {
    this.devkit = devkit;

    // Cleanup expired challenges and sessions every 10 minutes
    setInterval(
      () => {
        this.cleanupExpired();
      },
      10 * 60 * 1000
    );
  }

  async initialize() {
    try {
      // IMPORTANT: For authentication, we need to use the Ethereum-derived address
      // that wallets (MetaMask, etc.) actually connect with, not the Conflux-derived address.

      // Prefer explicit override via environment variables
      const envAdmin =
        process.env.HARDHAT_ADMIN_ADDRESS || process.env.VITE_HARDHAT_ADMIN_ADDRESS;

      // If provided, use the env override
      if (envAdmin && /^0x[a-fA-F0-9]{40}$/.test(envAdmin)) {
        this.adminAddress = envAdmin.toLowerCase();
        logger.info('✅ Admin address set from environment variable:', this.adminAddress);
      } else {
        // Use the proper Ethereum-derived admin address from mnemonic
        // This uses the standard Ethereum derivation path: m/44'/60'/0'/0/0
        try {
          const ethereumAdminAddress = this.devkit.getEthereumAdminAddress();
          this.adminAddress = ethereumAdminAddress;
          logger.info('✅ Admin address derived from Ethereum path (m/44\'/60\'/0\'/0/0):', this.adminAddress);
        } catch (error) {
          // Fallback to legacy test address (deprecated)
          this.adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();
          logger.warn(
            '⚠️ Failed to derive Ethereum admin address from mnemonic; using legacy test address. Set HARDHAT_ADMIN_ADDRESS to override.',
            { error }
          );
        }
      }
    } catch (error) {
      logger.error('Failed to initialize admin address:', error);
    }
  }

  /**
   * Generate authentication challenge for wallet address
   */
  generateChallenge(address: string): AuthChallenge {
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const message = `Sign this message to authenticate with Conflux DevKit:\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    const challenge: AuthChallenge = {
      message,
      nonce,
      timestamp,
    };

    this.challenges.set(address.toLowerCase(), challenge);

    // Auto-cleanup challenge after expiry
    setTimeout(() => {
      this.challenges.delete(address.toLowerCase());
    }, this.CHALLENGE_EXPIRY);

    return challenge;
  }

  /**
   * Verify signature and create session
   */
  async verifySignature(
    address: string,
    signature: string
  ): Promise<string | null> {
    const challenge = this.challenges.get(address.toLowerCase());

    if (!challenge) {
      logger.warn('No challenge found for address:', address);
      return null;
    }

    // Check if challenge is expired
    if (Date.now() - challenge.timestamp > this.CHALLENGE_EXPIRY) {
      this.challenges.delete(address.toLowerCase());
      logger.warn('Challenge expired for address:', address);
      return null;
    }

    try {
      // Verify signature using viem
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message: challenge.message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        logger.warn('Invalid signature for address:', address);
        return null;
      }

      // Create session
      const sessionId = crypto.randomBytes(32).toString('hex');
      const user: AuthUser = {
        address: address.toLowerCase(),
        isAdmin: address.toLowerCase() === this.adminAddress,
        sessionId,
      };

      this.sessions.set(sessionId, user);
      this.challenges.delete(address.toLowerCase());

      // Auto-cleanup session after expiry
      setTimeout(() => {
        this.sessions.delete(sessionId);
      }, this.SESSION_EXPIRY);

      logger.info('Authentication successful for address:', address, {
        isAdmin: user.isAdmin,
      });
      return sessionId;
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return null;
    }
  }

  /**
   * Get user by session ID
   */
  getSession(sessionId: string): AuthUser | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Cleanup expired challenges and sessions
   */
  private cleanupExpired() {
    const now = Date.now();

    // Cleanup expired challenges
    for (const [address, challenge] of this.challenges.entries()) {
      if (now - challenge.timestamp > this.CHALLENGE_EXPIRY) {
        this.challenges.delete(address);
      }
    }

    logger.info('Cleaned up expired challenges and sessions');
  }

  /**
   * Middleware to authenticate requests using session ID or legacy wallet format
   * Format: "Bearer <sessionId>" or "Bearer wallet:<address>"
   */
  authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Support legacy wallet address format for backward compatibility
    if (token.startsWith('wallet:')) {
      const address = token.replace('wallet:', '').toLowerCase();

      if (!address || !this.isValidAddress(address)) {
        return res.status(401).json({ error: 'Invalid wallet address' });
      }

      req.wallet = {
        address,
        isAdmin: address === this.adminAddress,
        sessionId: 'legacy',
      };

      logger.info('Legacy wallet authenticated:', {
        address,
        isAdmin: req.wallet.isAdmin,
      });
      return next();
    }

    // New session-based authentication
    const user = this.getSession(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.wallet = user;
    logger.info('Session authenticated:', {
      address: user.address,
      isAdmin: user.isAdmin,
    });
    next();
  };

  /**
   * Middleware to require admin access
   */
  requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.wallet?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  /**
   * Basic address validation
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
