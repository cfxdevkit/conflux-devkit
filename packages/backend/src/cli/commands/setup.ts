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
 * Setup Command
 *
 * Interactive setup wizard for first-time configuration.
 */

import type { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { getKeystoreService } from '../../services/keystore-service.js';
import { chalk, cliLogger } from '../utils/index.js';

export function registerSetupCommand(program: Command): void {
  program
    .command('setup')
    .description('Run interactive setup wizard')
    .option('--reset', 'Reset existing configuration and start fresh')
    .action(async (options) => {
      console.log(
        '\n' + chalk.bold.cyan('═══ Conflux DevKit Setup Wizard ═══') + '\n'
      );

      const keystore = getKeystoreService();
      await keystore.initialize();

      // Check if already setup
      if (await keystore.isSetupCompleted()) {
        if (!options.reset) {
          cliLogger.warn('Setup already completed.');
          cliLogger.newline();

          const { action } = await inquirer.prompt([
            {
              type: 'list',
              name: 'action',
              message: 'What would you like to do?',
              choices: [
                { name: 'View current status', value: 'status' },
                { name: 'Reset and start over', value: 'reset' },
                { name: 'Cancel', value: 'cancel' },
              ],
            },
          ]);

          if (action === 'status') {
            cliLogger.dim('Run: cfx-devkit status');
            return;
          }

          if (action === 'cancel') {
            cliLogger.dim('Setup cancelled.');
            return;
          }

          // action === 'reset' - continue with reset
        }

        // Confirm reset
        const { confirmReset } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmReset',
            message: chalk.red(
              'This will delete all wallets and configuration. Are you sure?'
            ),
            default: false,
          },
        ]);

        if (!confirmReset) {
          cliLogger.dim('Setup cancelled.');
          return;
        }

        // Reset is handled by deleting the keystore file
        cliLogger.warn(
          'Please delete ~/.devkit.keystore.json manually and run setup again.'
        );
        cliLogger.dim('  rm ~/.devkit.keystore.json');
        return;
      }

      // Step 1: Admin Address
      console.log(chalk.bold('\n📋 Step 1: Admin Address\n'));
      cliLogger.dim(
        'The admin address is used for authentication and access control.'
      );
      cliLogger.dim('This should be a wallet address you control.\n');

      const { adminAddress } = await inquirer.prompt([
        {
          type: 'input',
          name: 'adminAddress',
          message: 'Enter your admin wallet address (0x...):',
          validate: (input: string) => {
            if (!/^0x[a-fA-F0-9]{40}$/.test(input)) {
              return 'Invalid Ethereum address format (must be 0x followed by 40 hex characters)';
            }
            return true;
          },
        },
      ]);

      // Step 2: Wallet Setup
      console.log(chalk.bold('\n🔐 Step 2: Development Wallet\n'));
      cliLogger.dim('The development wallet provides genesis accounts for testing.');
      cliLogger.dim('Each account is pre-funded with test CFX.\n');

      const { walletMethod } = await inquirer.prompt([
        {
          type: 'list',
          name: 'walletMethod',
          message: 'How would you like to set up your development wallet?',
          choices: [
            {
              name: 'Generate new mnemonic (recommended for new projects)',
              value: 'generate',
            },
            {
              name: 'Import existing mnemonic (for existing projects)',
              value: 'import',
            },
          ],
        },
      ]);

      let mnemonic: string;
      if (walletMethod === 'generate') {
        mnemonic = generateMnemonic(); // 12 words (128 bits)
        console.log(
          chalk.yellow('\n⚠️  Save this mnemonic securely (for development use only):\n')
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
          process.exit(1);
        }
      } else {
        const { inputMnemonic } = await inquirer.prompt([
          {
            type: 'password',
            name: 'inputMnemonic',
            message: 'Enter your mnemonic phrase (12 or 24 words):',
            mask: '*',
            validate: (input: string) => {
              const trimmed = input.trim();
              if (!validateMnemonic(trimmed)) {
                return 'Invalid mnemonic phrase. Please check your words and try again.';
              }
              return true;
            },
          },
        ]);
        mnemonic = inputMnemonic.trim();
      }

      // Step 3: Wallet Label
      const { walletLabel } = await inquirer.prompt([
        {
          type: 'input',
          name: 'walletLabel',
          message: 'Enter a label for this wallet:',
          default: 'Development',
          validate: (input: string) =>
            input.trim().length > 0 || 'Label cannot be empty',
        },
      ]);

      // Step 4: Encryption (optional)
      console.log(chalk.bold('\n🔒 Step 3: Security (Optional)\n'));
      cliLogger.dim('Encryption protects your mnemonic at rest.');
      cliLogger.dim(
        'You will need to unlock with password when the keystore is encrypted.\n'
      );

      const { enableEncryption } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enableEncryption',
          message: 'Enable password encryption for your keystore?',
          default: false,
        },
      ]);

      let password: string | undefined;
      if (enableEncryption) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'password',
            message: 'Enter encryption password (min 8 characters):',
            mask: '*',
            validate: (input: string) =>
              input.length >= 8 || 'Password must be at least 8 characters',
          },
          {
            type: 'password',
            name: 'confirmPassword',
            message: 'Confirm password:',
            mask: '*',
          },
        ]);

        if (answers.password !== answers.confirmPassword) {
          cliLogger.error('Passwords do not match. Please try again.');
          process.exit(1);
        }
        password = answers.password;
      }

      // Step 5: Node Configuration
      console.log(chalk.bold('\n⚙️  Step 4: Node Configuration\n'));
      cliLogger.dim('Configure the local development node settings.\n');

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

      // Warn about chain ID conflicts
      if (nodeAnswers.chainId === 1 || nodeAnswers.evmChainId === 1) {
        cliLogger.warn('Using mainnet chain ID (1) for local development is not recommended.');
      }

      // Complete setup
      const spinner = ora('Completing setup...').start();

      try {
        await keystore.completeSetup({
          adminAddress,
          mnemonic,
          mnemonicLabel: walletLabel.trim(),
          nodeConfig: {
            accountsCount: nodeAnswers.accountsCount,
            chainId: nodeAnswers.chainId,
            evmChainId: nodeAnswers.evmChainId,
            miningAuthor: 'auto',
          },
          encryption: enableEncryption
            ? { enabled: true, password }
            : { enabled: false },
        });

        spinner.succeed('Setup completed successfully!');

        cliLogger.banner('Setup Complete', [
          `Admin:      ${chalk.cyan(adminAddress)}`,
          `Wallet:     ${chalk.cyan(walletLabel)}`,
          `Accounts:   ${chalk.cyan(nodeAnswers.accountsCount.toString())}`,
          `Chain IDs:  ${chalk.cyan(`Core: ${nodeAnswers.chainId}, eSpace: ${nodeAnswers.evmChainId}`)}`,
          `Encrypted:  ${chalk.cyan(enableEncryption ? 'Yes' : 'No')}`,
        ]);

        cliLogger.section('Next Steps');
        cliLogger.dim('  cfx-devkit start    Start the development node');
        cliLogger.dim('  cfx-devkit web      Start web mode (API + UI)');
        cliLogger.dim('  cfx-devkit status   View current configuration');
        cliLogger.newline();
      } catch (error) {
        spinner.fail('Setup failed');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });
}
