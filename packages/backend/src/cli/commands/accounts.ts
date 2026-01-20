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
 * Accounts Command
 *
 * List and display genesis accounts from the active wallet.
 */

import type { Command } from 'commander';
import ora from 'ora';
import { getKeystoreService } from '../../services/keystore-service.js';
import {
  chalk,
  cliLogger,
  createTable,
  formatAddress,
} from '../utils/index.js';

export function registerAccountsCommand(program: Command): void {
  program
    .command('accounts [index]')
    .description('List accounts from active wallet')
    .option('--show-private', 'Show private keys (use with caution)')
    .option('--json', 'Output as JSON')
    .action(async (index: string | undefined, options) => {
      const keystore = getKeystoreService();
      await keystore.initialize();

      if (!(await keystore.isSetupCompleted())) {
        cliLogger.warn('Setup not completed.');
        cliLogger.dim('Run: cfx-devkit setup');
        return;
      }

      // Check if locked
      if (keystore.isLocked()) {
        cliLogger.error('Keystore is locked.');
        cliLogger.dim('Unlock via web UI or API first.');
        return;
      }

      const spinner = ora('Loading accounts...').start();

      try {
        const mnemonic = await keystore.getActiveMnemonic();
        const accounts = await keystore.deriveGenesisAccounts(mnemonic.id);

        spinner.stop();

        if (index !== undefined) {
          // Show single account details
          const idx = parseInt(index, 10);
          const acc = accounts.find((a) => a.index === idx);

          if (!acc) {
            cliLogger.error(`Account #${index} not found`);
            cliLogger.dim(
              `Valid range: 0-${accounts.length - 1}`
            );
            return;
          }

          if (options.json) {
            const output: Record<string, unknown> = {
              index: acc.index,
              coreAddress: acc.core,
              evmAddress: acc.evm,
            };
            if (options.showPrivate) {
              output.privateKey = acc.privateKey;
            }
            console.log(JSON.stringify(output, null, 2));
            return;
          }

          cliLogger.section(`Account #${acc.index}`);
          cliLogger.keyValue('Core Address', acc.core);
          cliLogger.keyValue('eSpace Address', acc.evm);

          if (options.showPrivate) {
            cliLogger.newline();
            cliLogger.warn('Private Key (keep secret!):');
            console.log(chalk.yellow(`  ${acc.privateKey}`));
          }

          cliLogger.newline();
        } else {
          // List all accounts
          if (options.json) {
            const output = accounts.map((acc) => {
              const item: Record<string, unknown> = {
                index: acc.index,
                coreAddress: acc.core,
                evmAddress: acc.evm,
              };
              if (options.showPrivate) {
                item.privateKey = acc.privateKey;
              }
              return item;
            });
            console.log(JSON.stringify(output, null, 2));
            return;
          }

          cliLogger.section(`Accounts (Wallet: ${mnemonic.label})`);

          const headers = ['#', 'Core Address', 'eSpace Address'];
          if (options.showPrivate) {
            headers.push('Private Key');
          }

          const table = createTable({ head: headers });

          for (const acc of accounts) {
            const row = [
              acc.index.toString(),
              formatAddress(acc.core, 12, 8),
              acc.evm,
            ];
            if (options.showPrivate) {
              row.push(formatAddress(acc.privateKey, 10, 6));
            }
            table.push(row);
          }

          console.log(table.toString());

          cliLogger.newline();
          cliLogger.dim(`Total: ${accounts.length} accounts`);
          cliLogger.dim('Use `cfx-devkit accounts <index>` for full details');

          if (!options.showPrivate) {
            cliLogger.dim('Use --show-private to reveal private keys');
          }

          cliLogger.newline();
        }
      } catch (error) {
        spinner.fail('Failed to load accounts');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });

  // Faucet account subcommand
  program
    .command('faucet')
    .description('Show faucet/mining account information')
    .option('--show-private', 'Show private key')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const keystore = getKeystoreService();
      await keystore.initialize();

      if (!(await keystore.isSetupCompleted())) {
        cliLogger.warn('Setup not completed.');
        cliLogger.dim('Run: cfx-devkit setup');
        return;
      }

      if (keystore.isLocked()) {
        cliLogger.error('Keystore is locked.');
        return;
      }

      const spinner = ora('Loading faucet account...').start();

      try {
        const mnemonic = await keystore.getActiveMnemonic();
        const faucetAccount = await keystore.deriveFaucetAccount(mnemonic.id);

        spinner.stop();

        if (options.json) {
          const output: Record<string, unknown> = {
            coreAddress: faucetAccount.core,
            evmAddress: faucetAccount.evm,
            purpose: 'Mining rewards and faucet operations',
          };
          if (options.showPrivate) {
            output.privateKey = faucetAccount.privateKey;
          }
          console.log(JSON.stringify(output, null, 2));
          return;
        }

        cliLogger.section('Faucet / Mining Account');
        cliLogger.dim('This account receives all mining rewards and is used for faucet operations.\n');

        cliLogger.keyValue('Core Address', faucetAccount.core);
        cliLogger.keyValue('eSpace Address', faucetAccount.evm);

        if (options.showPrivate) {
          cliLogger.newline();
          cliLogger.warn('Private Key (keep secret!):');
          console.log(chalk.yellow(`  ${faucetAccount.privateKey}`));
        }

        cliLogger.newline();
      } catch (error) {
        spinner.fail('Failed to load faucet account');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
}
