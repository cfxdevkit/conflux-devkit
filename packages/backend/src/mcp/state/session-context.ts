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
 * DevKit MCP Session Context
 *
 * Provides a unified interface for MCP tools to access backend services:
 * - KeystoreService: Wallet and key management
 * - DevKitCompat: Node lifecycle and blockchain operations
 * - Error handling with custom error classes
 */

import type {
  DerivedAccount,
  MnemonicSummary,
  NodeConfig,
  SetupData,
} from '../../types/keystore.js';
import { DevKitCompat, type DevKitConfig } from '../../devkit-compat.js';
import {
  KeystoreService,
  KeystoreLockedError,
} from '../../services/keystore-service.js';

/**
 * Custom error for when setup is not completed
 */
export class SetupNotCompletedError extends Error {
  constructor(message: string = 'Setup not completed. Run setup first.') {
    super(message);
    this.name = 'SetupNotCompletedError';
  }
}

/**
 * Custom error for when node is not running
 */
export class NodeNotRunningError extends Error {
  constructor(message: string = 'Node is not running. Start the node first.') {
    super(message);
    this.name = 'NodeNotRunningError';
  }
}

/**
 * DevKit MCP Context
 *
 * Session wrapper that provides MCP tools access to:
 * - Keystore service (wallet management)
 * - DevKit instance (blockchain operations)
 * - Status checks (setup, node running, keystore locked)
 */
export class DevKitMcpContext {
  private keystoreService: KeystoreService;
  private devkitInstance: DevKitCompat | null = null;

  constructor(keystoreService: KeystoreService) {
    this.keystoreService = keystoreService;
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize the context by loading the keystore
   */
  async initialize(): Promise<void> {
    await this.keystoreService.initialize();
  }

  // ===== KEYSTORE ACCESS =====

  /**
   * Get the keystore service instance
   */
  getKeystoreService(): KeystoreService {
    return this.keystoreService;
  }

  // ===== DEVKIT INSTANCE MANAGEMENT =====

  /**
   * Get or create DevKitCompat instance based on active wallet configuration
   * Creates a new instance if config changed or none exists
   */
  async getDevKit(): Promise<DevKitCompat> {
    // Check if setup completed
    if (!(await this.isSetupCompleted())) {
      throw new SetupNotCompletedError();
    }

    // Get active mnemonic and its config
    const activeMnemonic = await this.keystoreService.getActiveMnemonic();
    const nodeConfig = activeMnemonic.nodeConfig;

    // Get decrypted mnemonic (may throw KeystoreLockedError)
    const mnemonic = await this.keystoreService.getDecryptedMnemonic(
      activeMnemonic.id
    );

    // Get data directory for this mnemonic
    const dataDir = await this.keystoreService.getDataDir();

    // Create DevKit config
    const devkitConfig: DevKitConfig = {
      chainId: nodeConfig.chainId,
      evmChainId: nodeConfig.evmChainId,
      accountsCount: nodeConfig.accountsCount,
      miningAuthor: nodeConfig.miningAuthor === 'auto' ? undefined : nodeConfig.miningAuthor,
      jsonrpcHttpPort: 12537,
      jsonrpcHttpEthPort: 12538,
      log: false,
      mnemonic,
      dataDir,
    };

    // Create new DevKit instance if none exists or config changed
    if (!this.devkitInstance) {
      this.devkitInstance = new DevKitCompat(devkitConfig);
    } else {
      // Check if config changed - recreate instance if needed
      const currentConfig = this.devkitInstance.getConfig();
      const configChanged =
        currentConfig.chainId !== devkitConfig.chainId ||
        currentConfig.evmChainId !== devkitConfig.evmChainId ||
        currentConfig.accountsCount !== devkitConfig.accountsCount ||
        currentConfig.miningAuthor !== devkitConfig.miningAuthor ||
        currentConfig.dataDir !== devkitConfig.dataDir;

      if (configChanged) {
        // Stop old instance if running
        try {
          await this.devkitInstance.stop();
        } catch (error) {
          // Ignore errors on stop
        }
        this.devkitInstance = new DevKitCompat(devkitConfig);
      }
    }

    return this.devkitInstance;
  }

  // ===== STATUS CHECKS =====

  /**
   * Check if initial setup is completed
   */
  async isSetupCompleted(): Promise<boolean> {
    return await this.keystoreService.isSetupCompleted();
  }

  /**
   * Check if node is running
   */
  async isNodeRunning(): Promise<boolean> {
    if (!this.devkitInstance) {
      return false;
    }

    const status = await this.devkitInstance.getStatus();
    return status.core.connected && status.evm.connected;
  }

  /**
   * Check if keystore is locked (encrypted and no password in memory)
   */
  isKeystoreLocked(): boolean {
    return this.keystoreService.isLocked();
  }

  // ===== CONVENIENCE METHODS =====

  /**
   * Complete initial setup
   */
  async completeSetup(data: SetupData): Promise<void> {
    await this.keystoreService.completeSetup(data);
  }

  /**
   * Get active mnemonic's node configuration
   */
  async getActiveNodeConfig(): Promise<NodeConfig> {
    const active = await this.keystoreService.getActiveMnemonic();
    return active.nodeConfig;
  }

  /**
   * Get all mnemonics (summary)
   */
  async listMnemonics(): Promise<MnemonicSummary[]> {
    return await this.keystoreService.listMnemonics();
  }

  /**
   * Get genesis accounts for active mnemonic
   */
  async getGenesisAccounts(): Promise<DerivedAccount[]> {
    const active = await this.keystoreService.getActiveMnemonic();
    return await this.keystoreService.deriveGenesisAccounts(active.id);
  }

  /**
   * Get faucet account for active mnemonic
   */
  async getFaucetAccount(): Promise<DerivedAccount> {
    const active = await this.keystoreService.getActiveMnemonic();
    return await this.keystoreService.deriveFaucetAccount(active.id);
  }

  /**
   * Unlock keystore with password
   */
  async unlockKeystore(password: string): Promise<void> {
    await this.keystoreService.unlockKeystore(password);
  }

  /**
   * Lock keystore (clear password from memory)
   */
  async lockKeystore(): Promise<void> {
    await this.keystoreService.lockKeystore();
  }
}

// Re-export error classes for convenience
export { KeystoreLockedError };
