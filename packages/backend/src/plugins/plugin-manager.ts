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
 * Plugin Manager Implementation
 *
 * Manages loading, unloading, and lifecycle of backend plugins
 */

import { logger } from '../utils/logger.js';
import type {
  BackendPlugin,
  PluginManager as IPluginManager,
  PluginContext,
} from './types.js';

export class PluginManager implements IPluginManager {
  private plugins: Map<string, BackendPlugin> = new Map();

  constructor(private context: PluginContext) {}

  async load(plugin: BackendPlugin): Promise<void> {
    try {
      if (this.plugins.has(plugin.name)) {
        throw new Error(`Plugin '${plugin.name}' is already loaded`);
      }

      logger.info(`Loading plugin: ${plugin.name} v${plugin.version}`);

      // Call onLoad if provided
      if (plugin.onLoad) {
        await plugin.onLoad(this.context);
      }

      // Store plugin
      this.plugins.set(plugin.name, plugin);

      logger.info(`Plugin loaded successfully: ${plugin.name}`);
    } catch (error) {
      logger.error(`Failed to load plugin '${plugin.name}':`, error);
      throw error;
    }
  }

  async unload(pluginName: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginName);

      if (!plugin) {
        throw new Error(`Plugin '${pluginName}' is not loaded`);
      }

      logger.info(`Unloading plugin: ${pluginName}`);

      // Call onUnload if provided
      if (plugin.onUnload) {
        await plugin.onUnload();
      }

      // Remove plugin
      this.plugins.delete(pluginName);

      logger.info(`Plugin unloaded successfully: ${pluginName}`);
    } catch (error) {
      logger.error(`Failed to unload plugin '${pluginName}':`, error);
      throw error;
    }
  }

  get(pluginName: string): BackendPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  list(): BackendPlugin[] {
    return Array.from(this.plugins.values());
  }

  has(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * Get all routes from loaded plugins
   */
  getAllRoutes() {
    const routes: { path: string; router: any }[] = [];

    for (const plugin of this.plugins.values()) {
      if (plugin.routes) {
        routes.push(...plugin.routes);
      }
    }

    return routes;
  }

  /**
   * Get all services from loaded plugins
   */
  getAllServices() {
    const services: Record<string, any> = {};

    for (const plugin of this.plugins.values()) {
      if (plugin.services) {
        Object.assign(services, plugin.services);
      }
    }

    return services;
  }
}
