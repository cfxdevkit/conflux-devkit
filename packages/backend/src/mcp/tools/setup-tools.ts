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

import { z } from 'zod';
import type { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import type { DevKitMcpContext } from '../state/session-context.js';
import { SetupService } from '../../services/setup-service.js';
import type { SetupData } from '../../types/keystore.js';

/**
 * Register setup-related MCP tools
 */
export function registerSetupTools(
  server: McpServer,
  context: DevKitMcpContext
): void {
  // Tool 1: setup_status - Check if setup is completed
  server.tool(
    'setup_status',
    'Check if initial DevKit setup is completed',
    {},
    async () => {
      const completed = await context.isSetupCompleted();

      if (!completed) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                completed: false,
              }),
            },
          ],
        };
      }

      // Get additional details if setup is completed
      const keystoreService = context.getKeystoreService();
      const isLocked = context.isKeystoreLocked();

      let walletsCount = 0;
      let encryptionEnabled = false;

      try {
        const mnemonics = await keystoreService.listMnemonics();
        walletsCount = mnemonics.length;
        encryptionEnabled = keystoreService.isEncryptionEnabled();
      } catch {
        // If keystore is locked, we can't get full details
        // Return basic status
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              completed: true,
              encryptionEnabled,
              isLocked,
              walletsCount,
            }),
          },
        ],
      };
    }
  );

  // Tool 2: setup_validate - Validate setup data without persisting
  server.tool(
    'setup_validate',
    'Validate setup data without persisting to disk',
    {
      adminAddress: z
        .string()
        .describe('Admin wallet address (Ethereum format)'),
      mnemonic: z.string().describe('BIP-39 mnemonic phrase'),
      mnemonicLabel: z.string().describe('User-friendly label for the wallet'),
      nodeConfig: z.object({
        accountsCount: z
          .number()
          .min(1)
          .max(20)
          .describe('Number of genesis accounts (1-20)'),
        chainId: z.number().describe('Core Space chain ID'),
        evmChainId: z.number().describe('eSpace chain ID'),
        miningAuthor: z
          .string()
          .optional()
          .describe(
            'Mining author address (optional, defaults to "auto")'
          ),
      }),
      encryption: z
        .object({
          enabled: z.boolean().describe('Enable encryption'),
          password: z
            .string()
            .optional()
            .describe('Encryption password (required if enabled=true)'),
        })
        .optional()
        .describe('Encryption settings'),
    },
    async (args) => {
      const setupData: SetupData = {
        adminAddress: args.adminAddress as string,
        mnemonic: args.mnemonic as string,
        mnemonicLabel: args.mnemonicLabel as string,
        nodeConfig: {
          accountsCount: args.nodeConfig.accountsCount as number,
          chainId: args.nodeConfig.chainId as number,
          evmChainId: args.nodeConfig.evmChainId as number,
          miningAuthor: args.nodeConfig.miningAuthor as string | undefined,
        },
        encryption: args.encryption
          ? {
              enabled: args.encryption.enabled as boolean,
              password: args.encryption.password as string | undefined,
            }
          : undefined,
      };

      const result = await SetupService.validateSetupData(setupData);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              valid: result.valid,
              errors: result.errors,
              warnings: result.warnings,
            }),
          },
        ],
      };
    }
  );

  // Tool 3: setup_complete - Complete initial setup
  server.tool(
    'setup_complete',
    'Complete initial DevKit setup with validated data',
    {
      adminAddress: z
        .string()
        .describe('Admin wallet address (Ethereum format)'),
      mnemonic: z.string().describe('BIP-39 mnemonic phrase'),
      mnemonicLabel: z.string().describe('User-friendly label for the wallet'),
      nodeConfig: z.object({
        accountsCount: z
          .number()
          .min(1)
          .max(20)
          .describe('Number of genesis accounts (1-20)'),
        chainId: z.number().describe('Core Space chain ID'),
        evmChainId: z.number().describe('eSpace chain ID'),
        miningAuthor: z
          .string()
          .optional()
          .describe(
            'Mining author address (optional, defaults to "auto")'
          ),
      }),
      encryption: z
        .object({
          enabled: z.boolean().describe('Enable encryption'),
          password: z
            .string()
            .optional()
            .describe('Encryption password (required if enabled=true)'),
        })
        .optional()
        .describe('Encryption settings'),
    },
    async (args) => {
      try {
        const setupData: SetupData = {
          adminAddress: args.adminAddress as string,
          mnemonic: args.mnemonic as string,
          mnemonicLabel: args.mnemonicLabel as string,
          nodeConfig: {
            accountsCount: args.nodeConfig.accountsCount as number,
            chainId: args.nodeConfig.chainId as number,
            evmChainId: args.nodeConfig.evmChainId as number,
            miningAuthor: args.nodeConfig.miningAuthor as string | undefined,
          },
          encryption: args.encryption
            ? {
                enabled: args.encryption.enabled as boolean,
                password: args.encryption.password as string | undefined,
              }
            : undefined,
        };

        // Validate before completing
        const validation = await SetupService.validateSetupData(setupData);
        if (!validation.valid) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Validation failed: ${validation.errors.join(', ')}`,
                }),
              },
            ],
          };
        }

        // Complete setup
        await context.completeSetup(setupData);

        // Get the created wallet ID
        const mnemonics = await context.listMnemonics();
        const walletId = mnemonics[0]?.id;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                walletId,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error ? error.message : 'Unknown error',
              }),
            },
          ],
        };
      }
    }
  );
}
