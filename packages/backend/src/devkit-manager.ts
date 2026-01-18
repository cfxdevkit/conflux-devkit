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
 */

import type { DevKitCompat, DevKitConfig } from './devkit-compat.js';
import { DevKitCompat as DevKitCompatClass } from './devkit-compat.js';
import { getKeystoreService } from './services/keystore-service.js';
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
  private nodeWasRunning: boolean = false;
  private nodeWasMining: boolean = false;
  private updateCallback?: (newDevKit: DevKitCompat) => void;

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
   * Initialize DevKit with current active mnemonic from keystore
   */
  async initialize(): Promise<void> {
    const keystore = getKeystoreService();
    const mnemonic = await keystore.getActiveMnemonic();
    const dataDir = await keystore.getDataDir();

    const devkitConfig: DevKitConfig = {
      ...this.baseConfig,
      mnemonic,
      dataDir,
    };

    logger.info('Initializing DevKit with wallet:', keystore.getActiveLabel());
    logger.info('Data directory:', dataDir);

    this.devkit = new DevKitCompatClass(devkitConfig);
  }

  /**
   * Get current DevKit instance
   */
  getDevKit(): DevKitCompat {
    if (!this.devkit) {
      throw new Error('DevKit not initialized. Call initialize() first.');
    }
    return this.devkit;
  }

  /**
   * Switch to a different mnemonic
   * This will stop the node, recreate DevKit with new config, and optionally restart
   */
  async switchMnemonic(index: number): Promise<{
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

    logger.info(`Switching to mnemonic index ${index}...`);
    logger.info(`Node status BEFORE switch - Running: ${wasRunning}, Mining: ${wasMining}`);

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

    // Update keystore active index
    await keystore.setActiveMnemonic(index);
    const activeLabel = keystore.getActiveLabel();

    // Get new mnemonic and data directory
    const newMnemonic = await keystore.getActiveMnemonic();
    const newDataDir = await keystore.getDataDir();

    logger.info(`Switched to wallet: ${activeLabel}`);
    logger.info(`New data directory: ${newDataDir}`);

    // Create new DevKit instance with updated config
    const newConfig: DevKitConfig = {
      ...this.baseConfig,
      mnemonic: newMnemonic,
      dataDir: newDataDir,
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
        throw new Error(`Failed to restart node: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      nodeRestarted,
      activeLabel,
      dataDir: newDataDir,
    };
  }

  /**
   * Add a new mnemonic and optionally switch to it
   */
  async addMnemonic(options: {
    mnemonic?: string;
    label?: string;
    setActive?: boolean;
  }): Promise<{
    index: number;
    label: string;
    switchedTo: boolean;
  }> {
    const keystore = getKeystoreService();
    const result = await keystore.addMnemonic(options);

    let switchedTo = false;

    // If setActive was requested, switch to the new mnemonic
    if (options.setActive) {
      logger.info(`Switching to newly added wallet: ${result.label}`);
      await this.switchMnemonic(result.index);
      switchedTo = true;
    }

    return {
      index: result.index,
      label: result.label,
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
      return status.core.status === 'running' || status.evm.status === 'running';
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
    activeIndex: number;
    activeLabel: string;
    dataDir: string;
    walletCount: number;
  }> {
    const keystore = getKeystoreService();

    return {
      activeIndex: keystore.getActiveIndex(),
      activeLabel: keystore.getActiveLabel(),
      dataDir: await keystore.getDataDir(),
      walletCount: keystore.getEntries().length,
    };
  }
}
