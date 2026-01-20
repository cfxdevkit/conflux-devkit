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
 * Admin Command
 *
 * Manage admin addresses for access control.
 */

import type { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { getKeystoreService } from '../../services/keystore-service.js';
import { chalk, cliLogger } from '../utils/index.js';

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

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function registerAdminCommand(program: Command): void {
  const admin = program
    .command('admin')
    .description('Manage admin addresses');

  // List admins (default action)
  admin
    .command('list', { isDefault: true })
    .description('List all admin addresses')
    .action(async () => {
      if (!(await ensureSetup())) return;

      const keystore = getKeystoreService();
      const admins = await keystore.getAdminAddresses();

      cliLogger.section('Admin Addresses');

      if (admins.length === 0) {
        cliLogger.dim('No admin addresses configured.');
        return;
      }

      for (let i = 0; i < admins.length; i++) {
        console.log(`  ${chalk.dim(`${i + 1}.`)} ${chalk.cyan(admins[i])}`);
      }

      cliLogger.newline();
      cliLogger.dim(`Total: ${admins.length} admin(s)`);
      cliLogger.newline();
    });

  // Add admin
  admin
    .command('add [address]')
    .description('Add an admin address')
    .action(async (address?: string) => {
      if (!(await ensureSetup())) return;

      // Get address if not provided
      let adminAddress = address;
      if (!adminAddress) {
        const { inputAddress } = await inquirer.prompt([
          {
            type: 'input',
            name: 'inputAddress',
            message: 'Enter admin address (0x...):',
            validate: (input: string) => {
              if (!isValidAddress(input)) {
                return 'Invalid Ethereum address format';
              }
              return true;
            },
          },
        ]);
        adminAddress = inputAddress;
      } else if (!isValidAddress(adminAddress)) {
        cliLogger.error('Invalid address format. Must be 0x followed by 40 hex characters.');
        return;
      }

      const keystore = getKeystoreService();

      // Check if already exists
      const admins = await keystore.getAdminAddresses();
      if (admins.some((a) => a.toLowerCase() === adminAddress!.toLowerCase())) {
        cliLogger.warn('Address is already an admin.');
        return;
      }

      const spinner = ora('Adding admin address...').start();

      try {
        await keystore.addAdminAddress(adminAddress!);
        spinner.succeed(`Admin address added: ${adminAddress}`);
      } catch (error) {
        spinner.fail('Failed to add admin address');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });

  // Remove admin
  admin
    .command('remove <address>')
    .description('Remove an admin address')
    .option('-f, --force', 'Skip confirmation')
    .action(async (address: string, options) => {
      if (!(await ensureSetup())) return;

      if (!isValidAddress(address)) {
        cliLogger.error('Invalid address format.');
        return;
      }

      const keystore = getKeystoreService();
      const admins = await keystore.getAdminAddresses();

      // Check if exists
      const normalizedAddress = address.toLowerCase();
      const exists = admins.some((a) => a.toLowerCase() === normalizedAddress);

      if (!exists) {
        cliLogger.error('Address is not an admin.');
        return;
      }

      // Cannot remove last admin
      if (admins.length === 1) {
        cliLogger.error('Cannot remove the last admin address.');
        cliLogger.dim('Add another admin first before removing this one.');
        return;
      }

      // Confirm removal
      if (!options.force) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: `Remove admin address ${address}?`,
            default: false,
          },
        ]);

        if (!confirmed) {
          cliLogger.dim('Removal cancelled.');
          return;
        }
      }

      const spinner = ora('Removing admin address...').start();

      try {
        // Find the exact address (case may differ)
        const exactAddress = admins.find(
          (a) => a.toLowerCase() === normalizedAddress
        );

        // Note: removeAdminAddress requires the current admin address for validation
        // In CLI context, we don't have a "current user", so we pass the address being removed
        // This will fail if trying to remove self, which is the expected behavior
        await keystore.removeAdminAddress(exactAddress!, exactAddress!);
        spinner.succeed(`Admin address removed: ${exactAddress}`);
      } catch (error) {
        spinner.fail('Failed to remove admin address');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });

  // Check if address is admin
  admin
    .command('check <address>')
    .description('Check if an address is an admin')
    .action(async (address: string) => {
      if (!(await ensureSetup())) return;

      if (!isValidAddress(address)) {
        cliLogger.error('Invalid address format.');
        return;
      }

      const keystore = getKeystoreService();
      const isAdmin = keystore.isAdmin(address);

      cliLogger.newline();
      cliLogger.keyValue('Address', address);
      cliLogger.keyValue('Is Admin', isAdmin ? chalk.green('Yes') : chalk.red('No'));
      cliLogger.newline();
    });
}
