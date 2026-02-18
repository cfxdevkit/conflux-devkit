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

import { z } from 'zod';
import type { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import type { DevKitMcpContext } from '../state/session-context.js';
import {
  SetupNotCompletedError,
  NodeNotRunningError,
} from '../state/session-context.js';

/**
 * Register account management tools
 */
export function registerAccountTools(
  server: McpServer,
  context: DevKitMcpContext
): void {
  // Tool 1: account_list - List all genesis accounts
  server.tool(
    'account_list',
    'List all genesis accounts with their Core and eSpace addresses',
    {},
    async () => {
      try {
        // Check setup
        if (!(await context.isSetupCompleted())) {
          throw new SetupNotCompletedError();
        }

        // Get genesis accounts
        const accounts = await context.getGenesisAccounts();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                accounts: accounts.map((acc) => ({
                  index: acc.index,
                  coreAddress: acc.core,
                  evmAddress: acc.evm,
                })),
                count: accounts.length,
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
              text: JSON.stringify({ error: errorMessage }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 2: account_get - Get account by index
  server.tool(
    'account_get',
    'Get a specific genesis account by index',
    {
      index: z.number().int().min(0).describe('Account index (0-based)'),
    },
    async (args) => {
      try {
        const index = args.index as number;

        // Check setup
        if (!(await context.isSetupCompleted())) {
          throw new SetupNotCompletedError();
        }

        // Get genesis accounts
        const accounts = await context.getGenesisAccounts();

        // Find account by index
        const account = accounts.find((acc) => acc.index === index);

        if (!account) {
          throw new Error(
            `Account index ${index} not found. Valid range: 0-${accounts.length - 1}`
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                account: {
                  index: account.index,
                  coreAddress: account.core,
                  evmAddress: account.evm,
                },
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
              text: JSON.stringify({ error: errorMessage }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 3: account_balance - Check account balance
  server.tool(
    'account_balance',
    'Check the balance of an account on Core or eSpace',
    {
      address: z.string().describe('Account address (Core or EVM format)'),
      chain: z.enum(['core', 'evm']).describe('Which chain to check balance on'),
    },
    async (args) => {
      try {
        const address = args.address as string;
        const chain = args.chain as 'core' | 'evm';

        // Check setup and node running
        if (!(await context.isSetupCompleted())) {
          throw new SetupNotCompletedError();
        }
        if (!(await context.isNodeRunning())) {
          throw new NodeNotRunningError();
        }

        // Get devkit instance
        const devkit = await context.getDevKit();

        // Get accounts to find the matching account
        const accounts = devkit.getAccounts();
        const account = accounts.find(
          (acc) => acc.address.core === address || acc.address.evm === address
        );

        if (!account) {
          throw new Error(`Account with address ${address} not found`);
        }

        // Get balance using account wrapper
        const devkitAccount = devkit.account(account.index);
        const balance = await devkitAccount.getBalance(chain);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                balance,
                formatted: `${balance} ${chain === 'core' ? 'CFX' : 'ETH'}`,
                chain,
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
              text: JSON.stringify({ error: errorMessage }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 4: account_fund - Fund account from faucet
  server.tool(
    'account_fund',
    'Fund an account from the genesis faucet',
    {
      address: z.string().describe('Account address to fund'),
      amount: z.string().describe('Amount to fund (in CFX or ETH)'),
    },
    async (args) => {
      try {
        const address = args.address as string;
        const amount = args.amount as string;

        // Check setup and node running
        if (!(await context.isSetupCompleted())) {
          throw new SetupNotCompletedError();
        }
        if (!(await context.isNodeRunning())) {
          throw new NodeNotRunningError();
        }

        // Get devkit instance
        const devkit = await context.getDevKit();

        // Fund account from faucet
        const txHash = await devkit.fundAccount(address, amount);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                txHash,
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
          isError: true,
        };
      }
    }
  );

  // Tool 5: account_transfer - Transfer funds between accounts
  server.tool(
    'account_transfer',
    'Transfer funds from one account to another',
    {
      fromIndex: z.number().int().min(0).describe('Source account index'),
      to: z.string().describe('Destination address'),
      amount: z.string().describe('Amount to transfer (in CFX or ETH)'),
      chain: z.enum(['core', 'evm']).describe('Which chain to transfer on'),
    },
    async (args) => {
      try {
        const fromIndex = args.fromIndex as number;
        const to = args.to as string;
        const amount = args.amount as string;
        const chain = args.chain as 'core' | 'evm';

        // Check setup and node running
        if (!(await context.isSetupCompleted())) {
          throw new SetupNotCompletedError();
        }
        if (!(await context.isNodeRunning())) {
          throw new NodeNotRunningError();
        }

        // Get devkit instance
        const devkit = await context.getDevKit();

        // Get account by index
        const account = devkit.account(fromIndex);

        // Transfer funds
        const txHash = await account.transfer(to, amount, chain);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                txHash,
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
          isError: true,
        };
      }
    }
  );

  // Tool 6: account_faucet - Get faucet account info
  server.tool(
    'account_faucet',
    'Get the genesis faucet account information',
    {},
    async () => {
      try {
        // Check setup
        if (!(await context.isSetupCompleted())) {
          throw new SetupNotCompletedError();
        }

        // Get faucet account
        const faucet = await context.getFaucetAccount();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                coreAddress: faucet.core,
                evmAddress: faucet.evm,
                index: faucet.index,
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
              text: JSON.stringify({ error: errorMessage }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
