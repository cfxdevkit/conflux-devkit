/**
 * Copyright 2025 Conflux DevKit
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

import { z } from 'zod';
import type { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import type { DevKitMcpContext } from '../state/session-context.js';

/**
 * Register node lifecycle management tools
 */
export function registerNodeTools(
  server: McpServer,
  context: DevKitMcpContext
): void {
  // Tool 1: node_start - Start the development node
  server.tool(
    'node_start',
    'Start the local development node with optional mining interval',
    {
      miningInterval: z
        .number()
        .optional()
        .describe('Mining interval in milliseconds (default 500)'),
    },
    async (args) => {
      try {
        const devkit = await context.getDevKit();

        // Start node
        await devkit.start();

        // Start mining with configured interval (default 500ms)
        const interval = (args.miningInterval as number | undefined) ?? 500;
        await devkit.startMining(interval);

        const rpcUrls = devkit.getRpcUrls();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                rpcUrls,
              }),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: errorMessage,
              }),
            },
          ],
        };
      }
    }
  );

  // Tool 2: node_stop - Stop the development node
  server.tool('node_stop', 'Stop the local development node', {}, async () => {
    try {
      const devkit = await context.getDevKit();
      await devkit.stop();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
            }),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: errorMessage,
            }),
          },
        ],
      };
    }
  });

  // Tool 3: node_status - Get node status
  server.tool(
    'node_status',
    'Get the current status of the development node',
    {},
    async () => {
      try {
        const devkit = await context.getDevKit();
        const status = await devkit.getStatus();
        const rpcUrls = devkit.getRpcUrls();

        const running = status.core.connected && status.evm.connected;

        // Get block numbers if node is running
        let coreBlockNumber: string | undefined;
        let evmBlockNumber: string | undefined;

        if (running) {
          try {
            // Dynamically import clients
            const cive = await import('cive');
            const viem = await import('viem');

            const coreClient = cive.createPublicClient({
              transport: cive.http(rpcUrls.core),
            });

            const evmClient = viem.createPublicClient({
              transport: viem.http(rpcUrls.evm),
            });

            const coreEpoch = await coreClient.getEpochNumber();
            const evmBlock = await evmClient.getBlockNumber();

            coreBlockNumber = coreEpoch.toString();
            evmBlockNumber = evmBlock.toString();
          } catch (error) {
            // Ignore errors getting block numbers
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                running,
                core: {
                  connected: status.core.connected,
                  blockNumber: coreBlockNumber,
                },
                evm: {
                  connected: status.evm.connected,
                  blockNumber: evmBlockNumber,
                },
                rpcUrls: running ? rpcUrls : undefined,
              }),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                running: false,
                error: errorMessage,
              }),
            },
          ],
        };
      }
    }
  );

  // Tool 4: node_restart - Restart the node
  server.tool(
    'node_restart',
    'Restart the development node with optional data clearing',
    {
      clearData: z
        .boolean()
        .optional()
        .describe('Clear blockchain data before restarting (default false)'),
    },
    async (args) => {
      try {
        const devkit = await context.getDevKit();

        // Stop the node
        await devkit.stop();

        // Optionally clear data
        if (args.clearData === true) {
          await devkit.clearData();
        }

        // Start the node again
        await devkit.start();
        await devkit.startMining(500);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
              }),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: errorMessage,
              }),
            },
          ],
        };
      }
    }
  );

  // Tool 5: node_clear_data - Clear node data
  server.tool(
    'node_clear_data',
    'Clear all blockchain data (node must be stopped first)',
    {},
    async () => {
      try {
        const devkit = await context.getDevKit();
        const dataDir = devkit.getDataDir();

        await devkit.clearData();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                deletedDir: dataDir,
              }),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: errorMessage,
              }),
            },
          ],
        };
      }
    }
  );

  // Tool 6: node_config - Get node configuration
  server.tool(
    'node_config',
    'Get the current node configuration',
    {},
    async () => {
      try {
        const devkit = await context.getDevKit();
        const config = devkit.getConfig();
        const rpcUrls = devkit.getRpcUrls();
        const dataDir = devkit.getDataDir();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                chainId: config.chainId,
                evmChainId: config.evmChainId,
                accountsCount: config.accountsCount ?? 10,
                rpcUrls,
                dataDir,
              }),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: errorMessage,
              }),
            },
          ],
        };
      }
    }
  );
}
