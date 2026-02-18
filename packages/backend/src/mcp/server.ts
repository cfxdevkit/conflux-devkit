/**
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

import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DevKitMcpContext } from './state/session-context.js';
import { getKeystoreService } from '../services/keystore-service.js';
import {
  registerSetupTools,
  registerNodeTools,
  registerAccountTools,
} from './tools/index.js';

/**
 * MCP server for Conflux DevKit
 * Provides tools and resources for blockchain development
 */
export class McpDevKitServer {
  private server: McpServer;
  private context: DevKitMcpContext;

  constructor() {
    this.server = new McpServer({
      name: 'conflux-devkit',
      version: '1.0.0',
    });

    // Initialize context with keystore service
    const keystoreService = getKeystoreService();
    this.context = new DevKitMcpContext(keystoreService);
  }

  /**
   * Register all MCP tools
   */
  private registerTools(): void {
    registerSetupTools(this.server, this.context);
    registerNodeTools(this.server, this.context);
    registerAccountTools(this.server, this.context);
  }

  /**
   * Register all MCP resources
   * Placeholder for resource registration
   */
  private registerResources(): void {
    // Resource registration will be implemented here
    // Will include blockchain state and configuration resources
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    // Initialize context (load keystore)
    await this.context.initialize();

    // Register tools and resources
    this.registerTools();
    this.registerResources();

    // Connect via stdio transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Conflux DevKit MCP Server started');
  }
}

/**
 * Factory function to create and start the MCP server
 */
export async function createMcpServer(): Promise<McpDevKitServer> {
  const server = new McpDevKitServer();
  await server.start();
  return server;
}
