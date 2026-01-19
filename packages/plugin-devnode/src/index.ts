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
 * Conflux DevKit - DevNode Plugin
 *
 * Optional plugin that adds @xcfx/node local development features to DevKit.
 * This plugin should only be used in development environments.
 *
 * Features:
 * - Local Conflux node (Core + eSpace)
 * - Mining controls
 * - Faucet operations
 * - Development-only utilities
 *
 * @packageDocumentation
 */

export type { BaseDevKit, DevNodePlugin } from './plugin.js';
// Main plugin exports
export { DevKitWithDevNode, devNodePlugin } from './plugin.js';

// Server Manager (for advanced usage)
export { ServerManager } from './server-manager.js';

// Types
export type {
  AccountInfo,
  ChainBalances,
  FaucetBalances,
  MiningStatus,
  NodeConfig,
  ServerConfig,
  ServerStatus,
  StartOptions,
} from './types.js';

// Version
export const VERSION = '0.1.0';
