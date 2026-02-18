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
 * Setup API Routes
 *
 * Handles initial setup workflow:
 * 1. GET /api/setup/status - Check if setup is completed
 * 2. POST /api/setup/validate - Validate setup data before completion
 * 3. POST /api/setup/complete - Complete initial setup
 * 4. POST /api/setup/generate-mnemonic - Generate a new BIP-39 mnemonic
 */

import {
  generateMnemonic as coreGenerateMnemonic,
  validateMnemonic as coreValidateMnemonic,
} from '@conflux-devkit/core/wallet';
import { Router } from 'express';
import { getKeystoreService } from '../services/keystore-service.js';
import type { SetupData, ValidationResult } from '../types/keystore.js';
import { logger } from '../utils/logger.js';

export interface SetupRoutesOptions {
  onSetupComplete?: () => Promise<boolean>;
}

export function createSetupRoutes(options: SetupRoutesOptions = {}): Router {
  const router = Router();

  /**
   * GET /api/setup/status
   * Check if initial setup is completed
   */
  router.get('/status', async (_req, res) => {
    try {
      const keystoreService = getKeystoreService();
      const setupCompleted = await keystoreService.isSetupCompleted();

      if (setupCompleted) {
        const mnemonics = await keystoreService.listMnemonics();
        const admins = await keystoreService.getAdminAddresses();
        const isLocked = keystoreService.isLocked();
        const isEncrypted = keystoreService.isEncryptionEnabled();

        res.json({
          setupCompleted: true,
          status: {
            mnemonicsCount: mnemonics.length,
            adminsCount: admins.length,
            isLocked,
            isEncrypted,
            activeMnemonic: mnemonics.find((m) => m.isActive)?.label,
          },
        });
      } else {
        res.json({
          setupCompleted: false,
          message: 'Initial setup required',
          setupEndpoint: '/api/setup/complete',
          generateMnemonicEndpoint: '/api/setup/generate-mnemonic',
        });
      }
    } catch (error) {
      logger.error('Failed to get setup status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get setup status',
      });
    }
  });

  /**
   * POST /api/setup/generate-mnemonic
   * Generate a new BIP-39 mnemonic phrase
   */
  router.post('/generate-mnemonic', (_req, res) => {
    try {
      const mnemonic = coreGenerateMnemonic(128); // 12 words
      res.json({
        mnemonic,
        wordCount: 12,
        warning:
          'Store this mnemonic securely. It cannot be recovered if lost.',
      });
    } catch (error) {
      logger.error('Failed to generate mnemonic:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate mnemonic',
      });
    }
  });

  /**
   * POST /api/setup/validate
   * Validate setup data before completion
   */
  router.post('/validate', async (req, res) => {
    try {
      const data = req.body as Partial<SetupData>;
      const result = validateSetupData(data);

      res.json(result);
    } catch (error) {
      logger.error('Failed to validate setup data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to validate setup data',
      });
    }
  });

  /**
   * POST /api/setup/complete
   * Complete the initial setup
   */
  router.post('/complete', async (req, res) => {
    try {
      const keystoreService = getKeystoreService();

      // Check if already set up
      const setupCompleted = await keystoreService.isSetupCompleted();
      if (setupCompleted) {
        res.status(400).json({
          error: 'Setup already completed',
          message:
            'Initial setup has already been completed. Use /api/wallet/add to add additional mnemonics.',
        });
        return;
      }

      // Validate input
      const data = req.body as Partial<SetupData>;
      const validation = validateSetupData(data);

      if (!validation.valid) {
        res.status(400).json({
          error: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        });
        return;
      }

      // Complete setup
      const setupData: SetupData = {
        adminAddress: data.adminAddress!,
        mnemonic: data.mnemonic!,
        mnemonicLabel: data.mnemonicLabel || 'Default Wallet',
        nodeConfig: {
          accountsCount: data.nodeConfig?.accountsCount || 10,
          chainId: data.nodeConfig?.chainId || 2029,
          evmChainId: data.nodeConfig?.evmChainId || 2030,
          miningAuthor: data.nodeConfig?.miningAuthor,
        },
        encryption: data.encryption,
      };

      await keystoreService.completeSetup(setupData);

      logger.info('Setup completed successfully');

      // Try to reinitialize DevKit without requiring restart
      let reinitialized = false;
      if (options.onSetupComplete) {
        try {
          reinitialized = await options.onSetupComplete();
          if (reinitialized) {
            logger.success('✅ DevKit reinitialized automatically - no restart required!');
          }
        } catch (error) {
          logger.warn('Failed to auto-reinitialize DevKit:', error);
        }
      }

      if (!reinitialized) {
        logger.warn('⚠️  Server restart required to initialize DevKit with new configuration');
      }

      res.json({
        success: true,
        message: reinitialized
          ? 'Setup completed and DevKit initialized successfully'
          : 'Setup completed - restart required to initialize DevKit',
        requiresRestart: !reinitialized,
        reinitialized,
        setupData: {
          adminAddress: setupData.adminAddress,
          mnemonicLabel: setupData.mnemonicLabel,
          nodeConfig: setupData.nodeConfig,
          encryptionEnabled: setupData.encryption?.enabled || false,
        },
      });
    } catch (error) {
      logger.error('Failed to complete setup:', error);
      res.status(500).json({
        error: 'Setup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

/**
 * Validate setup data
 */
function validateSetupData(data: Partial<SetupData>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Admin address validation
  if (!data.adminAddress) {
    errors.push('Admin address is required');
  } else if (!isValidEthereumAddress(data.adminAddress)) {
    errors.push('Invalid admin address format (must be 0x... hex address)');
  }

  // Mnemonic validation
  if (!data.mnemonic) {
    errors.push('Mnemonic phrase is required');
  } else {
    const words = data.mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      errors.push('Mnemonic must be 12 or 24 words');
    } else if (!coreValidateMnemonic(data.mnemonic).valid) {
      errors.push('Invalid mnemonic phrase');
    }
  }

  // Node config validation
  if (data.nodeConfig) {
    const { accountsCount, chainId, evmChainId } = data.nodeConfig;

    if (accountsCount !== undefined) {
      if (
        !Number.isInteger(accountsCount) ||
        accountsCount < 1 ||
        accountsCount > 20
      ) {
        errors.push('accountsCount must be an integer between 1 and 20');
      }
    }

    if (chainId !== undefined) {
      if (!Number.isInteger(chainId) || chainId <= 0) {
        errors.push('chainId must be a positive integer');
      }
    }

    if (evmChainId !== undefined) {
      if (!Number.isInteger(evmChainId) || evmChainId <= 0) {
        errors.push('evmChainId must be a positive integer');
      }
    }

    if (data.nodeConfig.miningAuthor) {
      if (
        data.nodeConfig.miningAuthor !== 'auto' &&
        !isValidEthereumAddress(data.nodeConfig.miningAuthor)
      ) {
        errors.push('miningAuthor must be "auto" or a valid Ethereum address');
      }
    }
  }

  // Encryption validation
  if (data.encryption?.enabled) {
    if (!data.encryption.password) {
      errors.push('Password is required when encryption is enabled');
    } else if (data.encryption.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    } else if (data.encryption.password.length < 12) {
      warnings.push(
        'Consider using a password of 12 or more characters for better security'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Check if a string is a valid Ethereum address
 */
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
