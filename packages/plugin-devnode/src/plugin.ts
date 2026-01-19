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
 * DevNode Plugin - Optional @xcfx/node integration for local development
 *
 * This plugin extends DevKit with local node functionality:
 * - Local node lifecycle (start/stop)
 * - Mining controls (start/stop/mine)
 * - Faucet operations (fund accounts)
 * - Development-only features
 *
 * Usage:
 * ```typescript
 * import { DevKit } from '@conflux-devkit/node';
 * import { devNodePlugin } from '@conflux-devkit/plugin-devnode';
 *
 * // Production: Just use DevKit
 * const devkit = new DevKit({ coreRpc: '...', evmRpc: '...' });
 *
 * // Development: Use plugin for local node
 * const devkitWithNode = devNodePlugin.extendDevKit(new DevKit());
 * await devkitWithNode.startNode();
 * ```
 */

import { ServerManager } from './server-manager.js';
import type {
  AccountInfo,
  FaucetBalances,
  MiningStatus,
  NodeConfig,
  StartOptions,
} from './types.js';

/**
 * Base DevKit interface (subset needed for plugin)
 */
export interface BaseDevKit {
  getConfig(): NodeConfig;
  getRpcUrls(): { core: string; evm: string };
}

/**
 * Extended DevKit with local node capabilities
 */
export class DevKitWithDevNode {
  private server: ServerManager;
  private baseDevKit: BaseDevKit;

  constructor(baseDevKit: BaseDevKit, config: NodeConfig) {
    this.baseDevKit = baseDevKit;
    this.server = new ServerManager(config);
  }

  // Delegate to base DevKit
  getConfig(): NodeConfig {
    return this.baseDevKit.getConfig();
  }

  getRpcUrls(): { core: string; evm: string } {
    return this.baseDevKit.getRpcUrls();
  }

  // Node lifecycle methods
  async startNode(options: Partial<StartOptions> = {}): Promise<void> {
    await this.server.start();

    // Start mining if requested (default: true)
    if (options.mining !== false) {
      await this.server.startMining();
    }
  }

  async stopNode(): Promise<void> {
    await this.server.stop();
  }

  // Mining methods
  async startMining(): Promise<void> {
    await this.server.startMining();
  }

  async stopMining(): Promise<void> {
    await this.server.stopMining();
  }

  async mine(blocks: number = 1): Promise<void> {
    await this.server.mine(blocks);
  }

  getMiningStatus(): MiningStatus {
    return this.server.getMiningStatus();
  }

  async setMiningInterval(interval: number): Promise<void> {
    await this.server.setMiningInterval(interval);
  }

  // Faucet methods
  async getFaucetBalances(): Promise<FaucetBalances> {
    return await this.server.getFaucetBalances();
  }

  getFaucetAccount(): AccountInfo {
    return this.server.getFaucetAccount();
  }

  async fundAccount(
    address: string,
    amount: string,
    chain: 'core' | 'evm'
  ): Promise<string> {
    if (chain === 'core') {
      return await this.server.fundCoreAccount(address, amount);
    } else {
      return await this.server.fundEvmAccount(address, amount);
    }
  }

  // Account methods
  async addAccount(): Promise<AccountInfo> {
    return await this.server.addAccount();
  }

  getAccounts(): AccountInfo[] {
    return this.server.getAccounts();
  }

  // Utility methods
  getEthereumAdminAddress(): string {
    return this.server.getEthereumAdminAddress();
  }

  getServerStatus(): string {
    return this.server.getStatus();
  }

  isNodeRunning(): boolean {
    return this.server.isRunning();
  }
}

/**
 * Plugin interface
 */
export interface DevNodePlugin {
  name: 'devnode';
  version: string;
  extendDevKit(devkit: BaseDevKit, config: NodeConfig): DevKitWithDevNode;
}

/**
 * Default plugin export
 */
export const devNodePlugin: DevNodePlugin = {
  name: 'devnode',
  version: '0.1.0',

  extendDevKit(devkit: BaseDevKit, config: NodeConfig): DevKitWithDevNode {
    return new DevKitWithDevNode(devkit, config);
  },
};
