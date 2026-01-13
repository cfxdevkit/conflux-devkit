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
 * Backend Plugin System Types
 *
 * Allows extending backend functionality with optional plugins
 */

import type { Router } from 'express';

export interface BackendPlugin {
  /** Plugin name */
  name: string;

  /** Plugin version */
  version: string;

  /** Plugin description */
  description?: string;

  /** Routes to register */
  routes?: {
    path: string;
    router: Router;
  }[];

  /** Services to register */
  services?: Record<string, any>;

  /** Initialize plugin */
  onLoad?(context: PluginContext): Promise<void>;

  /** Cleanup plugin */
  onUnload?(): Promise<void>;
}

export interface PluginContext {
  /** DevKit instance */
  devkit: any;

  /** Logger */
  logger: any;

  /** WebSocket server (if available) */
  wsServer?: any;
}

export interface PluginManager {
  /** Load a plugin */
  load(plugin: BackendPlugin): Promise<void>;

  /** Unload a plugin */
  unload(pluginName: string): Promise<void>;

  /** Get loaded plugin */
  get(pluginName: string): BackendPlugin | undefined;

  /** List all loaded plugins */
  list(): BackendPlugin[];

  /** Check if plugin is loaded */
  has(pluginName: string): boolean;
}
