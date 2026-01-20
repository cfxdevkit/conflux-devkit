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
 * Wallets Command
 *
 * Manage development wallets (list, add, switch, delete).
 */

import type { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { getKeystoreService } from '../../services/keystore-service.js';
import {
  chalk,
  cliLogger,
  createTable,
  formatStatus,
} from '../utils/index.js';

async function ensureSetup(): Promise<boolean> {
  const keystore = getKeystoreService();
  await keystore.initialize();

  if (!(await keystore.isSetupCompleted())) {
    cliLogger.warn('Setup not completed.');
    cliLogger.dim('Run: cfx-devkit setup');
    return false;
  }
  return true;
}

export function registerWalletsCommand(program: Command): void {
  const wallets = program
    .command('wallets')
    .description('Manage development wallets');

  // List wallets (default action)
  wallets
    .command('list', { isDefault: true })
    .description('List all wallets')
    .action(async () => {
      if (!(await ensureSetup())) return;

      const keystore = getKeystoreService();
      const mnemonics = await keystore.listMnemonics();

      cliLogger.section('Wallets');

      const table = createTable({
        head: ['', 'ID', 'Label', 'Type', 'Accounts', 'Chain IDs', 'Created'],
      });

      for (const m of mnemonics) {
        table.push([
          formatStatus(m.isActive),
          m.id.slice(0, 8) + '...',
          m.label,
          m.type,
          m.nodeConfig.accountsCount.toString(),
          `${m.nodeConfig.chainId}/${m.nodeConfig.evmChainId}`,
          new Date(m.createdAt).toLocaleDateString(),
        ]);
      }

      console.log(table.toString());
      cliLogger.newline();
      cliLogger.dim(`Total: ${mnemonics.length} wallet(s)`);
      cliLogger.dim('● = Active wallet');
      cliLogger.newline();
    });

  // Add wallet
  wallets
    .command('add')
    .description('Add a new wallet')
    .option('-g, --generate', 'Generate new mnemonic')
    .option('-i, --import', 'Import existing mnemonic')
    .option('-l, --label <label>', 'Wallet label')
    .option('-a, --activate', 'Set as active wallet after adding')
    .action(async (options) => {
      if (!(await ensureSetup())) return;

      const keystore = getKeystoreService();

      // Determine method
      let method = options.generate ? 'generate' : options.import ? 'import' : null;

      if (!method) {
        const { walletMethod } = await inquirer.prompt([
          {
            type: 'list',
            name: 'walletMethod',
            message: 'How would you like to add the wallet?',
            choices: [
              { name: 'Generate new mnemonic', value: 'generate' },
              { name: 'Import existing mnemonic', value: 'import' },
            ],
          },
        ]);
        method = walletMethod;
      }

      // Get mnemonic
      let mnemonic: string;
      if (method === 'generate') {
        mnemonic = generateMnemonic();
        console.log(
          chalk.yellow('\n⚠️  Save this mnemonic securely:\n')
        );
        console.log(chalk.cyan(`  ${mnemonic}\n`));

        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: 'I have saved the mnemonic phrase',
            default: false,
          },
        ]);

        if (!confirmed) {
          cliLogger.warn('Please save your mnemonic before continuing.');
          return;
        }
      } else {
        const { inputMnemonic } = await inquirer.prompt([
          {
            type: 'password',
            name: 'inputMnemonic',
            message: 'Enter your mnemonic phrase:',
            mask: '*',
            validate: (input: string) => {
              if (!validateMnemonic(input.trim())) {
                return 'Invalid mnemonic phrase';
              }
              return true;
            },
          },
        ]);
        mnemonic = inputMnemonic.trim();
      }

      // Get label
      let label = options.label;
      if (!label) {
        const { walletLabel } = await inquirer.prompt([
          {
            type: 'input',
            name: 'walletLabel',
            message: 'Enter a label for this wallet:',
            default: `Wallet ${Date.now().toString().slice(-4)}`,
            validate: (input: string) =>
              input.trim().length > 0 || 'Label cannot be empty',
          },
        ]);
        label = walletLabel;
      }

      // Get node configuration
      cliLogger.section('Node Configuration');

      const nodeAnswers = await inquirer.prompt([
        {
          type: 'number',
          name: 'accountsCount',
          message: 'Number of genesis accounts (1-20):',
          default: 10,
          validate: (input: number) =>
            (input >= 1 && input <= 20) || 'Must be between 1 and 20',
        },
        {
          type: 'number',
          name: 'chainId',
          message: 'Core Space Chain ID:',
          default: 2029,
        },
        {
          type: 'number',
          name: 'evmChainId',
          message: 'eSpace Chain ID:',
          default: 2030,
        },
      ]);

      // Activate?
      let setAsActive = options.activate;
      if (setAsActive === undefined) {
        const { activate } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'activate',
            message: 'Set as active wallet?',
            default: false,
          },
        ]);
        setAsActive = activate;
      }

      // Add wallet
      const spinner = ora('Adding wallet...').start();

      try {
        const entry = await keystore.addMnemonic({
          mnemonic,
          label: label.trim(),
          nodeConfig: {
            accountsCount: nodeAnswers.accountsCount,
            chainId: nodeAnswers.chainId,
            evmChainId: nodeAnswers.evmChainId,
            miningAuthor: 'auto',
          },
          setAsActive,
        });

        spinner.succeed(`Wallet "${entry.label}" added successfully`);

        if (setAsActive) {
          cliLogger.success('Set as active wallet');
        }

        cliLogger.newline();
        cliLogger.keyValue('ID', entry.id);
        cliLogger.keyValue('Label', entry.label);
        cliLogger.newline();
      } catch (error) {
        spinner.fail('Failed to add wallet');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });

  // Switch wallet
  wallets
    .command('switch <id>')
    .description('Switch active wallet')
    .action(async (id: string) => {
      if (!(await ensureSetup())) return;

      const keystore = getKeystoreService();

      // Find wallet by ID (partial match)
      const mnemonics = await keystore.listMnemonics();
      const matches = mnemonics.filter(
        (m) => m.id.startsWith(id) || m.id === id
      );

      if (matches.length === 0) {
        cliLogger.error(`No wallet found matching "${id}"`);
        cliLogger.dim('Use `cfx-devkit wallets` to list available wallets');
        return;
      }

      if (matches.length > 1) {
        cliLogger.error(`Multiple wallets match "${id}". Please be more specific.`);
        for (const m of matches) {
          cliLogger.dim(`  ${m.id} - ${m.label}`);
        }
        return;
      }

      const wallet = matches[0];

      if (wallet.isActive) {
        cliLogger.warn(`Wallet "${wallet.label}" is already active`);
        return;
      }

      const spinner = ora(`Switching to wallet "${wallet.label}"...`).start();

      try {
        await keystore.switchActiveMnemonic(wallet.id);
        spinner.succeed(`Switched to wallet "${wallet.label}"`);

        cliLogger.newline();
        cliLogger.warn('Note: If the node is running, restart it to use the new wallet:');
        cliLogger.dim('  cfx-devkit start');
        cliLogger.newline();
      } catch (error) {
        spinner.fail('Failed to switch wallet');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });

  // Delete wallet
  wallets
    .command('delete <id>')
    .description('Delete a wallet')
    .option('-f, --force', 'Skip confirmation')
    .option('--delete-data', 'Also delete blockchain data')
    .action(async (id: string, options) => {
      if (!(await ensureSetup())) return;

      const keystore = getKeystoreService();

      // Find wallet
      const mnemonics = await keystore.listMnemonics();
      const matches = mnemonics.filter(
        (m) => m.id.startsWith(id) || m.id === id
      );

      if (matches.length === 0) {
        cliLogger.error(`No wallet found matching "${id}"`);
        return;
      }

      if (matches.length > 1) {
        cliLogger.error(`Multiple wallets match "${id}". Please be more specific.`);
        return;
      }

      const wallet = matches[0];

      // Cannot delete active wallet
      if (wallet.isActive) {
        cliLogger.error('Cannot delete the active wallet.');
        cliLogger.dim('Switch to another wallet first:');
        cliLogger.dim(`  cfx-devkit wallets switch <other-wallet-id>`);
        return;
      }

      // Cannot delete last wallet
      if (mnemonics.length === 1) {
        cliLogger.error('Cannot delete the last wallet.');
        return;
      }

      // Confirm deletion
      if (!options.force) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: `Delete wallet "${wallet.label}" (${wallet.id})?`,
            default: false,
          },
        ]);

        if (!confirmed) {
          cliLogger.dim('Deletion cancelled.');
          return;
        }
      }

      const spinner = ora(`Deleting wallet "${wallet.label}"...`).start();

      try {
        await keystore.deleteMnemonic(wallet.id, options.deleteData ?? false);
        spinner.succeed(`Wallet "${wallet.label}" deleted`);
      } catch (error) {
        spinner.fail('Failed to delete wallet');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });

  // Show wallet details
  wallets
    .command('show <id>')
    .description('Show wallet details')
    .action(async (id: string) => {
      if (!(await ensureSetup())) return;

      const keystore = getKeystoreService();

      // Find wallet
      const mnemonics = await keystore.listMnemonics();
      const matches = mnemonics.filter(
        (m) => m.id.startsWith(id) || m.id === id
      );

      if (matches.length === 0) {
        cliLogger.error(`No wallet found matching "${id}"`);
        return;
      }

      if (matches.length > 1) {
        cliLogger.error(`Multiple wallets match "${id}". Please be more specific.`);
        return;
      }

      const wallet = matches[0];

      cliLogger.section(`Wallet: ${wallet.label}`);
      cliLogger.keyValue('ID', wallet.id);
      cliLogger.keyValue('Type', wallet.type);
      cliLogger.keyValue('Active', wallet.isActive ? 'Yes' : 'No');
      cliLogger.keyValue('Created', new Date(wallet.createdAt).toLocaleString());

      cliLogger.section('Node Configuration');
      cliLogger.keyValue('Chain ID (Core)', wallet.nodeConfig.chainId.toString());
      cliLogger.keyValue('Chain ID (eSpace)', wallet.nodeConfig.evmChainId.toString());
      cliLogger.keyValue('Accounts', wallet.nodeConfig.accountsCount.toString());
      cliLogger.keyValue(
        'Mining Author',
        wallet.nodeConfig.miningAuthor === 'auto'
          ? 'Auto (faucet account)'
          : wallet.nodeConfig.miningAuthor || 'Not set'
      );

      cliLogger.newline();
    });
}
