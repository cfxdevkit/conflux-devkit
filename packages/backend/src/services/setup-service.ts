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

import { validateMnemonic as coreValidateMnemonic } from '@conflux-devkit/core/wallet';
import { isAddress } from 'viem';
import type { SetupData, ValidationResult } from '../types/keystore';
import { logger } from '../utils/logger';
import { EncryptionService } from './encryption-service';

/**
 * Service for handling initial setup flow
 */
export class SetupService {
  /**
   * Known chain IDs to check for conflicts
   */
  private static readonly KNOWN_CHAIN_IDS: Record<number, string> = {
    1: 'Ethereum Mainnet',
    1029: 'Conflux Core Space Mainnet',
    1030: 'Conflux eSpace Mainnet',
    71: 'Conflux Core Space Testnet',
    11155111: 'Ethereum Sepolia Testnet',
    5: 'Ethereum Goerli Testnet (deprecated)',
    11: 'Optimism Mainnet',
    10: 'Optimism Mainnet',
    137: 'Polygon Mainnet',
    42161: 'Arbitrum One',
    8453: 'Base Mainnet',
  };

  /**
   * Validate setup data before persisting
   */
  static async validateSetupData(data: SetupData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate admin address
    if (!data.adminAddress || !isAddress(data.adminAddress)) {
      errors.push('Invalid admin address format');
    }

    // Validate mnemonic
    if (!data.mnemonic) {
      errors.push('Mnemonic is required');
    } else if (!coreValidateMnemonic(data.mnemonic).valid) {
      errors.push('Invalid BIP-39 mnemonic phrase');
    }

    // Validate mnemonic label
    if (!data.mnemonicLabel || data.mnemonicLabel.trim().length === 0) {
      errors.push('Mnemonic label is required');
    } else if (data.mnemonicLabel.length > 50) {
      errors.push('Mnemonic label must be 50 characters or less');
    }

    // Validate node config
    if (!data.nodeConfig) {
      errors.push('Node configuration is required');
    } else {
      const { accountsCount, chainId, evmChainId } = data.nodeConfig;

      // Validate accounts count
      if (
        typeof accountsCount !== 'number' ||
        accountsCount < 1 ||
        accountsCount > 20
      ) {
        errors.push('Account count must be between 1 and 20');
      }

      // Validate chain IDs
      if (typeof chainId !== 'number' || chainId < 1) {
        errors.push('Invalid Core Space chain ID');
      }

      if (typeof evmChainId !== 'number' || evmChainId < 1) {
        errors.push('Invalid eSpace chain ID');
      }

      // Check for chain ID conflicts
      const chainIdWarnings = SetupService.checkChainIdConflicts(
        chainId,
        evmChainId
      );
      warnings.push(...chainIdWarnings);

      // Validate mining author if provided
      if (
        data.nodeConfig.miningAuthor &&
        data.nodeConfig.miningAuthor !== 'auto' &&
        !isAddress(data.nodeConfig.miningAuthor)
      ) {
        errors.push('Invalid mining author address');
      }
    }

    // Validate encryption settings
    if (data.encryption?.enabled) {
      if (!data.encryption.password) {
        errors.push(
          'Encryption password is required when encryption is enabled'
        );
      } else {
        const passwordValidation = EncryptionService.validatePasswordStrength(
          data.encryption.password
        );
        if (!passwordValidation.valid) {
          errors.push(...passwordValidation.errors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Check for chain ID conflicts with known networks
   */
  private static checkChainIdConflicts(
    chainId: number,
    evmChainId: number
  ): string[] {
    const warnings: string[] = [];

    if (SetupService.KNOWN_CHAIN_IDS[chainId]) {
      warnings.push(
        `Chain ID ${chainId} conflicts with ${SetupService.KNOWN_CHAIN_IDS[chainId]}`
      );
    }

    if (SetupService.KNOWN_CHAIN_IDS[evmChainId]) {
      warnings.push(
        `EVM Chain ID ${evmChainId} conflicts with ${SetupService.KNOWN_CHAIN_IDS[evmChainId]}`
      );
    }

    return warnings;
  }

  /**
   * Validate mnemonic format
   */
  static validateMnemonic(mnemonic: string): boolean {
    return coreValidateMnemonic(mnemonic).valid;
  }

  /**
   * Validate Ethereum address format
   */
  static validateAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * Log setup completion
   */
  static logSetupComplete(data: {
    adminAddress: string;
    mnemonicLabel: string;
    mnemonicId: string;
    dataDir: string;
    encryptionEnabled: boolean;
  }): void {
    logger.success('✅ Initial setup completed successfully!');
    logger.info(`Admin address: ${data.adminAddress}`);
    logger.info(`Wallet: ${data.mnemonicLabel} (${data.mnemonicId})`);
    logger.info(`Data directory: ${data.dataDir}`);
    logger.info(
      `Encryption: ${data.encryptionEnabled ? 'Enabled' : 'Disabled'}`
    );
  }

  /**
   * Log setup required warning
   */
  static logSetupRequired(): void {
    logger.warn('⚠️  Initial setup required');
    logger.info('Complete setup via web UI or CLI:');
    logger.info('  Web UI: http://localhost:3000');
    logger.info('  CLI: conflux-devkit setup');
  }
}
