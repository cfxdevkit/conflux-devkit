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
 * DevKit Manager
 *
 * Manages the DevKit instance lifecycle and handles mnemonic switching.
 * When the active mnemonic changes, this manager:
 * 1. Stops the current node (if running)
 * 2. Creates a new DevKitCompat instance with updated config
 * 3. Restarts the node with the new mnemonic and data directory
 *
 * This ensures each mnemonic has its own isolated blockchain state.
 *
 * V2 Updates:
 * - Requires initial setup completion before initialization
 * - Uses per-mnemonic node configuration from keystore
 * - Supports encryption/decryption of mnemonic data
 * - Validates setup status on startup
 */

import type { DevKitCompat, DevKitConfig } from './devkit-compat.js';
import { DevKitCompat as DevKitCompatClass } from './devkit-compat.js';
import { getKeystoreService } from './services/keystore-service.js';
import type { AddMnemonicData } from './types/keystore.js';
import { logger } from './utils/logger.js';

export interface DevKitManagerConfig {
  chainId: number;
  evmChainId: number;
  jsonrpcHttpPort: number;
  jsonrpcHttpEthPort: number;
  jsonrpcWsPort?: number;
  jsonrpcWsEthPort?: number;
  log: boolean;
}

export class DevKitManager {
  private devkit: DevKitCompat | null = null;
  private baseConfig: DevKitManagerConfig;
  private updateCallback?: (newDevKit: DevKitCompat) => void;
  private setupCompleted: boolean = false;

  constructor(config: DevKitManagerConfig) {
    this.baseConfig = config;
  }

  /**
   * Register a callback to be notified when devkit instance is recreated
   * This is used by BackendServer to update references in WebSocketServer, etc.
   */
  onDevKitUpdate(callback: (newDevKit: DevKitCompat) => void): void {
    this.updateCallback = callback;
  }

  /**
   * Check if setup is completed
   */
  async isSetupCompleted(): Promise<boolean> {
    const keystore = getKeystoreService();
    return await keystore.isSetupCompleted();
  }

  /**
   * Check if DevKit is ready (setup completed and initialized)
   */
  isReady(): boolean {
    return this.setupCompleted && this.devkit !== null;
  }

  /**
   * Initialize DevKit with current active mnemonic from keystore
   * Requires setup to be completed first
   */
  async initialize(): Promise<void> {
    const keystore = getKeystoreService();

    // Check if setup is completed
    this.setupCompleted = await keystore.isSetupCompleted();

    if (!this.setupCompleted) {
      logger.warn('⚠️  Setup not completed - DevKit cannot initialize');
      logger.info('Complete setup via:');
      logger.info('  • Web UI: http://localhost:3000/setup');
      logger.info('  • API: POST /api/setup/complete');
      return;
    }

    // Get active mnemonic and its configuration
    const mnemonicEntry = await keystore.getActiveMnemonic();
    const nodeConfig = mnemonicEntry.nodeConfig;

    // Decrypt mnemonic if encrypted
    const mnemonic = await keystore.getDecryptedMnemonic(mnemonicEntry.id);

    // Get data directory for this mnemonic
    const dataDir = await keystore.getDataDir();

    // Create DevKit config using node configuration from mnemonic
    const devkitConfig: DevKitConfig = {
      chainId: nodeConfig.chainId,
      evmChainId: nodeConfig.evmChainId,
      jsonrpcHttpPort: this.baseConfig.jsonrpcHttpPort,
      jsonrpcHttpEthPort: this.baseConfig.jsonrpcHttpEthPort,
      jsonrpcWsPort: this.baseConfig.jsonrpcWsPort,
      jsonrpcWsEthPort: this.baseConfig.jsonrpcWsEthPort,
      log: this.baseConfig.log,
      mnemonic,
      dataDir,
      accountsCount: nodeConfig.accountsCount,
      miningAuthor:
        nodeConfig.miningAuthor === 'auto'
          ? undefined
          : nodeConfig.miningAuthor,
    };

    logger.info('✅ Setup completed - Initializing DevKit');
    logger.info(`Wallet: ${mnemonicEntry.label} (${mnemonicEntry.id})`);
    logger.info(`Data directory: ${dataDir}`);
    logger.info(
      `Chain ID: ${nodeConfig.chainId} (Core), ${nodeConfig.evmChainId} (eSpace)`
    );
    logger.info(`Genesis accounts: ${nodeConfig.accountsCount}`);

    this.devkit = new DevKitCompatClass(devkitConfig);
    logger.success('DevKit initialized successfully');
  }

  /**
   * Get current DevKit instance
   * @throws Error if setup not completed or DevKit not initialized
   */
  getDevKit(): DevKitCompat {
    if (!this.setupCompleted) {
      throw new Error(
        'Setup not completed. Complete initial setup before using DevKit.'
      );
    }
    if (!this.devkit) {
      throw new Error('DevKit not initialized. Call initialize() first.');
    }
    return this.devkit;
  }

  /**
   * Switch to a different mnemonic (by ID)
   * This will stop the node, recreate DevKit with new config, and optionally restart
   */
  async switchMnemonic(mnemonicId: string): Promise<{
    success: boolean;
    nodeRestarted: boolean;
    activeLabel: string;
    dataDir: string;
  }> {
    const keystore = getKeystoreService();

    // Check if node is currently running BEFORE any changes
    // IMPORTANT: Must check before creating new instance, as new instance will have stopped status
    const wasRunning = this.devkit ? await this.isNodeRunning() : false;
    const wasMining = wasRunning && (await this.isMining());

    logger.info(`Switching to mnemonic: ${mnemonicId}...`);
    logger.info(
      `Node status BEFORE switch - Running: ${wasRunning}, Mining: ${wasMining}`
    );

    // Stop node if running
    if (wasRunning && this.devkit) {
      logger.info('Stopping node before mnemonic switch...');
      try {
        await this.devkit.stop();
        logger.success('Node stopped successfully');
      } catch (error) {
        logger.warn('Failed to stop node gracefully:', error);
        // Continue anyway - we'll create new instance
      }
    }

    // Switch active mnemonic in keystore
    await keystore.switchActiveMnemonic(mnemonicId);

    // Get new mnemonic entry and configuration
    const mnemonicEntry = await keystore.getActiveMnemonic();
    const nodeConfig = mnemonicEntry.nodeConfig;

    // Decrypt mnemonic
    const mnemonic = await keystore.getDecryptedMnemonic(mnemonicId);

    // Get data directory for this mnemonic
    const newDataDir = await keystore.getDataDir();

    logger.info(`Switched to wallet: ${mnemonicEntry.label}`);
    logger.info(`New data directory: ${newDataDir}`);
    logger.info(
      `Chain ID: ${nodeConfig.chainId} (Core), ${nodeConfig.evmChainId} (eSpace)`
    );

    // Create new DevKit instance with updated config from mnemonic's node config
    const newConfig: DevKitConfig = {
      chainId: nodeConfig.chainId,
      evmChainId: nodeConfig.evmChainId,
      jsonrpcHttpPort: this.baseConfig.jsonrpcHttpPort,
      jsonrpcHttpEthPort: this.baseConfig.jsonrpcHttpEthPort,
      jsonrpcWsPort: this.baseConfig.jsonrpcWsPort,
      jsonrpcWsEthPort: this.baseConfig.jsonrpcWsEthPort,
      log: this.baseConfig.log,
      mnemonic,
      dataDir: newDataDir,
      accountsCount: nodeConfig.accountsCount,
      miningAuthor:
        nodeConfig.miningAuthor === 'auto'
          ? undefined
          : nodeConfig.miningAuthor,
    };

    this.devkit = new DevKitCompatClass(newConfig);
    logger.success('DevKit instance recreated with new wallet');

    // Notify listeners that devkit instance was updated
    if (this.updateCallback) {
      this.updateCallback(this.devkit);
      logger.info('DevKit instance reference updated in dependent services');
    }

    let nodeRestarted = false;

    // Restart node if it was running before
    if (wasRunning) {
      logger.info('Restarting node with new wallet configuration...');
      try {
        await this.devkit.start({
          configChanged: true, // Clear data on config change
        });
        logger.success('Node restarted successfully');

        // Note: Node automatically starts mining on startup (see ServerManager.start line 178)
        // So we don't need to explicitly restore mining state - it's already running
        if (wasMining) {
          logger.info('Mining automatically restored by node startup');
        }

        nodeRestarted = true;
      } catch (error) {
        logger.error('Failed to restart node:', error);
        throw new Error(
          `Failed to restart node: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      success: true,
      nodeRestarted,
      activeLabel: mnemonicEntry.label,
      dataDir: newDataDir,
    };
  }

  /**
   * Add a new mnemonic and optionally switch to it
   */
  async addMnemonic(data: AddMnemonicData): Promise<{
    id: string;
    label: string;
    switchedTo: boolean;
  }> {
    const keystore = getKeystoreService();
    const mnemonicEntry = await keystore.addMnemonic(data);

    let switchedTo = false;

    // If setActive was requested, switch to the new mnemonic
    if (data.setAsActive) {
      logger.info(`Switching to newly added wallet: ${mnemonicEntry.label}`);
      await this.switchMnemonic(mnemonicEntry.id);
      switchedTo = true;
    }

    return {
      id: mnemonicEntry.id,
      label: mnemonicEntry.label,
      switchedTo,
    };
  }

  /**
   * Check if node is currently running
   */
  async isNodeRunning(): Promise<boolean> {
    if (!this.devkit) {
      return false;
    }

    try {
      const status = await this.devkit.getStatus();
      return (
        status.core.status === 'running' || status.evm.status === 'running'
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if mining is active
   */
  async isMining(): Promise<boolean> {
    if (!this.devkit) {
      return false;
    }

    try {
      const status = this.devkit.getMiningStatus();
      return status.isRunning;
    } catch {
      return false;
    }
  }

  /**
   * Get current wallet status
   */
  async getWalletStatus(): Promise<{
    activeId: string;
    activeLabel: string;
    dataDir: string;
    walletCount: number;
  }> {
    const keystore = getKeystoreService();
    const activeMnemonic = await keystore.getActiveMnemonic();
    const mnemonics = await keystore.listMnemonics();

    return {
      activeId: activeMnemonic.id,
      activeLabel: activeMnemonic.label,
      dataDir: await keystore.getDataDir(),
      walletCount: mnemonics.length,
    };
  }

  /**
   * Reinitialize DevKit after setup completion
   * This allows hot-reloading without requiring a server restart
   * @returns true if reinitialization was successful, false if already initialized or setup not completed
   */
  async reinitialize(): Promise<boolean> {
    const keystore = getKeystoreService();

    // Re-check setup status
    this.setupCompleted = await keystore.isSetupCompleted();

    if (!this.setupCompleted) {
      logger.warn('Cannot reinitialize - setup not completed');
      return false;
    }

    // If already initialized, skip
    if (this.devkit !== null) {
      logger.info('DevKit already initialized');
      return true;
    }

    logger.info('🔄 Reinitializing DevKit after setup completion...');

    // Get active mnemonic and its configuration
    const mnemonicEntry = await keystore.getActiveMnemonic();
    const nodeConfig = mnemonicEntry.nodeConfig;

    // Decrypt mnemonic if encrypted
    const mnemonic = await keystore.getDecryptedMnemonic(mnemonicEntry.id);

    // Get data directory for this mnemonic
    const dataDir = await keystore.getDataDir();

    // Create DevKit config using node configuration from mnemonic
    const devkitConfig: DevKitConfig = {
      chainId: nodeConfig.chainId,
      evmChainId: nodeConfig.evmChainId,
      jsonrpcHttpPort: this.baseConfig.jsonrpcHttpPort,
      jsonrpcHttpEthPort: this.baseConfig.jsonrpcHttpEthPort,
      jsonrpcWsPort: this.baseConfig.jsonrpcWsPort,
      jsonrpcWsEthPort: this.baseConfig.jsonrpcWsEthPort,
      log: this.baseConfig.log,
      mnemonic,
      dataDir,
      accountsCount: nodeConfig.accountsCount,
      miningAuthor:
        nodeConfig.miningAuthor === 'auto'
          ? undefined
          : nodeConfig.miningAuthor,
    };

    logger.info(`Wallet: ${mnemonicEntry.label} (${mnemonicEntry.id})`);
    logger.info(`Data directory: ${dataDir}`);
    logger.info(
      `Chain ID: ${nodeConfig.chainId} (Core), ${nodeConfig.evmChainId} (eSpace)`
    );
    logger.info(`Genesis accounts: ${nodeConfig.accountsCount}`);

    this.devkit = new DevKitCompatClass(devkitConfig);
    logger.success('✅ DevKit reinitialized successfully after setup');

    // Notify listeners that devkit instance was created
    if (this.updateCallback) {
      this.updateCallback(this.devkit);
      logger.info('DevKit instance reference updated in dependent services');
    }

    return true;
  }

  /**
   * Get the DevKit instance (nullable version for setup routes)
   */
  getDevKitOrNull(): DevKitCompat | null {
    return this.devkit;
  }
}
