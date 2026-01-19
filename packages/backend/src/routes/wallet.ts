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
 * Wallet/Mnemonic Management API Routes
 *
 * Handles wallet and mnemonic operations:
 * 1. GET /api/wallet/list - List all mnemonics (without sensitive data)
 * 2. GET /api/wallet/active - Get active mnemonic details
 * 3. POST /api/wallet/add - Add a new mnemonic
 * 4. POST /api/wallet/switch/:id - Switch active mnemonic
 * 5. DELETE /api/wallet/:id - Delete a mnemonic
 * 6. GET /api/wallet/:id/accounts - Get derived accounts for a mnemonic
 * 7. GET /api/wallet/:id/config - Get node config for a mnemonic
 * 8. PUT /api/wallet/:id/config - Update node config (if allowed)
 * 9. POST /api/wallet/unlock - Unlock encrypted keystore
 * 10. POST /api/wallet/lock - Lock keystore
 */

import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { Router } from 'express';
import type {
  AuthenticatedRequest,
  DevelopmentAuthService,
} from '../auth/DevelopmentAuthService.js';
import { getKeystoreService } from '../services/keystore-service.js';
import type { AddMnemonicData } from '../types/keystore.js';
import { logger } from '../utils/logger.js';

export function createWalletRoutes(
  authService: DevelopmentAuthService
): Router {
  const router = Router();

  /**
   * GET /api/wallet/list
   * List all mnemonics (summary only, no sensitive data)
   * Requires: Admin authentication
   */
  router.get('/list', authService.requireAdmin, async (_req, res) => {
    try {
      const keystoreService = getKeystoreService();
      const mnemonics = await keystoreService.listMnemonics();
      const isLocked = keystoreService.isLocked();
      const isEncrypted = keystoreService.isEncryptionEnabled();

      res.json({
        mnemonics,
        count: mnemonics.length,
        isLocked,
        isEncrypted,
      });
    } catch (error) {
      logger.error('Failed to list mnemonics:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list mnemonics',
      });
    }
  });

  /**
   * GET /api/wallet/active
   * Get active mnemonic details
   * Requires: Admin authentication
   */
  router.get('/active', authService.requireAdmin, async (_req, res) => {
    try {
      const keystoreService = getKeystoreService();
      const active = await keystoreService.getActiveMnemonic();
      const isLocked = keystoreService.isLocked();

      res.json({
        id: active.id,
        label: active.label,
        type: active.type,
        createdAt: active.createdAt,
        nodeConfig: active.nodeConfig,
        isLocked,
      });
    } catch (error) {
      logger.error('Failed to get active mnemonic:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get active mnemonic',
      });
    }
  });

  /**
   * POST /api/wallet/add
   * Add a new mnemonic
   * Requires: Admin authentication
   * Body: { mnemonic, label, nodeConfig, setAsActive? }
   */
  router.post('/add', authService.requireAdmin, async (req, res) => {
    try {
      const keystoreService = getKeystoreService();

      // Check if keystore is locked
      if (keystoreService.isLocked()) {
        res.status(403).json({
          error: 'Keystore locked',
          message: 'Unlock the keystore before adding a new mnemonic',
        });
        return;
      }

      const { mnemonic, label, nodeConfig, setAsActive } = req.body;

      // Validate mnemonic
      if (!mnemonic) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Mnemonic is required',
        });
        return;
      }

      if (!validateMnemonic(mnemonic, wordlist)) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid mnemonic phrase',
        });
        return;
      }

      // Validate label
      if (!label || typeof label !== 'string') {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Label is required',
        });
        return;
      }

      // Validate node config
      if (!nodeConfig) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Node configuration is required',
        });
        return;
      }

      const { accountsCount, chainId, evmChainId } = nodeConfig;

      if (!accountsCount || accountsCount < 1 || accountsCount > 20) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'accountsCount must be between 1 and 20',
        });
        return;
      }

      const data: AddMnemonicData = {
        mnemonic,
        label,
        nodeConfig: {
          accountsCount,
          chainId: chainId || 2029,
          evmChainId: evmChainId || 2030,
          miningAuthor: nodeConfig.miningAuthor,
        },
        setAsActive: setAsActive === true,
      };

      const entry = await keystoreService.addMnemonic(data);

      logger.info(`Mnemonic added: ${label}`);

      res.json({
        success: true,
        message: 'Mnemonic added successfully',
        mnemonic: {
          id: entry.id,
          label: entry.label,
          nodeConfig: entry.nodeConfig,
          createdAt: entry.createdAt,
        },
      });
    } catch (error) {
      logger.error('Failed to add mnemonic:', error);

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to add mnemonic',
      });
    }
  });

  /**
   * POST /api/wallet/switch/:id
   * Switch active mnemonic
   * Requires: Admin authentication
   */
  router.post('/switch/:id', authService.requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Mnemonic ID is required',
        });
        return;
      }

      const keystoreService = getKeystoreService();
      await keystoreService.switchActiveMnemonic(id);

      const active = await keystoreService.getActiveMnemonic();

      logger.info(`Switched to mnemonic: ${active.label}`);

      res.json({
        success: true,
        message: 'Active mnemonic switched',
        active: {
          id: active.id,
          label: active.label,
          nodeConfig: active.nodeConfig,
        },
      });
    } catch (error) {
      logger.error('Failed to switch mnemonic:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to switch mnemonic',
      });
    }
  });

  /**
   * DELETE /api/wallet/:id
   * Delete a mnemonic
   * Requires: Admin authentication
   * Query: deleteData=true to also delete blockchain data
   */
  router.delete('/:id', authService.requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const deleteData = req.query.deleteData === 'true';

      if (!id) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Mnemonic ID is required',
        });
        return;
      }

      const keystoreService = getKeystoreService();

      // Check if keystore is locked
      if (keystoreService.isLocked()) {
        res.status(403).json({
          error: 'Keystore locked',
          message: 'Unlock the keystore before deleting a mnemonic',
        });
        return;
      }

      await keystoreService.deleteMnemonic(id, deleteData);

      logger.info(`Mnemonic deleted: ${id} (deleteData: ${deleteData})`);

      res.json({
        success: true,
        message: deleteData
          ? 'Mnemonic and associated data deleted'
          : 'Mnemonic deleted (data preserved)',
      });
    } catch (error) {
      logger.error('Failed to delete mnemonic:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('Cannot delete active')) {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('node is running')) {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to delete mnemonic',
      });
    }
  });

  /**
   * GET /api/wallet/:id/accounts
   * Get derived accounts for a mnemonic
   * Requires: Admin authentication
   */
  router.get('/:id/accounts', authService.requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Mnemonic ID is required',
        });
        return;
      }

      const keystoreService = getKeystoreService();

      // Check if keystore is locked
      if (keystoreService.isLocked()) {
        res.status(403).json({
          error: 'Keystore locked',
          message: 'Unlock the keystore to view accounts',
        });
        return;
      }

      const accounts = await keystoreService.deriveGenesisAccounts(id);

      res.json({
        accounts: accounts.map(
          (acc: { index: number; core: string; evm: string }) => ({
            index: acc.index,
            core: acc.core,
            evm: acc.evm,
            // Note: private key not exposed via API for security
          })
        ),
        count: accounts.length,
      });
    } catch (error) {
      logger.error('Failed to get accounts:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to get accounts',
      });
    }
  });

  /**
   * GET /api/wallet/:id/config
   * Get node configuration for a mnemonic
   * Requires: Admin authentication
   */
  router.get('/:id/config', authService.requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Mnemonic ID is required',
        });
        return;
      }

      const keystoreService = getKeystoreService();
      const config = await keystoreService.getNodeConfig(id);
      const canModify = await keystoreService.canModifyNodeConfig(id);

      res.json({
        config,
        canModify: canModify.canModify,
        modificationInfo: canModify.canModify
          ? undefined
          : {
              reason: canModify.reason,
              dataDir: canModify.dataDir,
            },
      });
    } catch (error) {
      logger.error('Failed to get node config:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to get node config',
      });
    }
  });

  /**
   * PUT /api/wallet/:id/config
   * Update node configuration for a mnemonic
   * Requires: Admin authentication
   * Note: Only allowed if no blockchain data exists
   */
  router.put('/:id/config', authService.requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Mnemonic ID is required',
        });
        return;
      }

      const keystoreService = getKeystoreService();

      // Check if modification is allowed
      const canModify = await keystoreService.canModifyNodeConfig(id);
      if (!canModify.canModify) {
        res.status(409).json({
          error: 'Configuration locked',
          message: canModify.reason,
          dataDir: canModify.dataDir,
        });
        return;
      }

      // Validate updates
      if (updates.accountsCount !== undefined) {
        if (updates.accountsCount < 1 || updates.accountsCount > 20) {
          res.status(400).json({
            error: 'Validation failed',
            message: 'accountsCount must be between 1 and 20',
          });
          return;
        }
      }

      await keystoreService.updateNodeConfig(id, updates);

      const newConfig = await keystoreService.getNodeConfig(id);

      logger.info(`Node config updated for mnemonic: ${id}`);

      res.json({
        success: true,
        message: 'Node configuration updated',
        config: newConfig,
      });
    } catch (error) {
      logger.error('Failed to update node config:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update node config',
      });
    }
  });

  /**
   * POST /api/wallet/unlock
   * Unlock encrypted keystore
   * Requires: Admin authentication
   * Body: { password: string }
   */
  router.post('/unlock', authService.requireAdmin, async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Password is required',
        });
        return;
      }

      const keystoreService = getKeystoreService();

      if (!keystoreService.isEncryptionEnabled()) {
        res.status(400).json({
          error: 'Not encrypted',
          message: 'Keystore is not encrypted',
        });
        return;
      }

      if (!keystoreService.isLocked()) {
        res.status(400).json({
          error: 'Already unlocked',
          message: 'Keystore is already unlocked',
        });
        return;
      }

      await keystoreService.unlockKeystore(password);

      logger.info('Keystore unlocked');

      res.json({
        success: true,
        message: 'Keystore unlocked successfully',
      });
    } catch (error) {
      logger.error('Failed to unlock keystore:', error);

      if (
        error instanceof Error &&
        error.message.includes('Invalid password')
      ) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid password',
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to unlock keystore',
      });
    }
  });

  /**
   * POST /api/wallet/lock
   * Lock the keystore
   * Requires: Admin authentication
   */
  router.post('/lock', authService.requireAdmin, async (_req, res) => {
    try {
      const keystoreService = getKeystoreService();

      if (!keystoreService.isEncryptionEnabled()) {
        res.status(400).json({
          error: 'Not encrypted',
          message: 'Keystore is not encrypted and cannot be locked',
        });
        return;
      }

      keystoreService.lockKeystore();

      logger.info('Keystore locked');

      res.json({
        success: true,
        message: 'Keystore locked successfully',
      });
    } catch (error) {
      logger.error('Failed to lock keystore:', error);
      res.status(500).json({
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to lock keystore',
      });
    }
  });

  /**
   * POST /api/wallet/generate-mnemonic
   * Generate a new BIP-39 mnemonic (convenience endpoint)
   * Requires: Admin authentication
   */
  router.post('/generate-mnemonic', authService.requireAdmin, (_req, res) => {
    try {
      const mnemonic = generateMnemonic(wordlist, 128); // 12 words
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

  return router;
}
