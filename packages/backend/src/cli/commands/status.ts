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
 * Status Command
 *
 * Shows current DevKit status including setup state, active wallet, and node info.
 */

import type { Command } from 'commander';
import ora from 'ora';
import { getKeystoreService } from '../../services/keystore-service.js';
import {
  chalk,
  cliLogger,
  createTable,
  formatBool,
  formatStatus,
} from '../utils/index.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .alias('info')
    .description('Show DevKit status and configuration')
    .action(async () => {
      const spinner = ora('Loading status...').start();

      try {
        const keystore = getKeystoreService();
        await keystore.initialize();

        const setupCompleted = await keystore.isSetupCompleted();

        spinner.stop();

        // Header
        console.log(
          '\n' + chalk.bold.cyan('═══ Conflux DevKit Status ═══') + '\n'
        );

        // Setup Status
        cliLogger.section('Setup');
        cliLogger.keyValue('Completed', formatBool(setupCompleted));

        if (!setupCompleted) {
          console.log();
          cliLogger.warn('Initial setup not completed');
          cliLogger.dim('Run: cfx-devkit setup');
          console.log();
          return;
        }

        // Encryption Status
        const isEncrypted = keystore.isEncrypted();
        const isLocked = keystore.isLocked();
        cliLogger.keyValue('Encrypted', formatBool(isEncrypted));
        if (isEncrypted) {
          cliLogger.keyValue('Locked', formatBool(isLocked));
        }

        // Active Wallet
        cliLogger.section('Active Wallet');
        const activeMnemonic = await keystore.getActiveMnemonic();
        cliLogger.keyValue('Label', activeMnemonic.label);
        cliLogger.keyValue('ID', activeMnemonic.id);
        cliLogger.keyValue('Type', activeMnemonic.type);
        cliLogger.keyValue(
          'Created',
          new Date(activeMnemonic.createdAt).toLocaleDateString()
        );

        // Node Configuration
        cliLogger.section('Node Configuration');
        const nodeConfig = activeMnemonic.nodeConfig;
        cliLogger.keyValue('Chain ID (Core)', nodeConfig.chainId.toString());
        cliLogger.keyValue('Chain ID (eSpace)', nodeConfig.evmChainId.toString());
        cliLogger.keyValue('Accounts', nodeConfig.accountsCount.toString());
        cliLogger.keyValue(
          'Mining Author',
          nodeConfig.miningAuthor === 'auto' ? 'Auto (faucet)' : nodeConfig.miningAuthor || 'Not set'
        );

        // Data Directory
        const dataDir = await keystore.getDataDir();
        cliLogger.keyValue('Data Directory', dataDir);

        // Wallet List Summary
        cliLogger.section('Wallets');
        const mnemonics = await keystore.listMnemonics();

        const table = createTable({
          head: ['', 'Label', 'Type', 'Accounts', 'Chain IDs'],
        });

        for (const m of mnemonics) {
          table.push([
            formatStatus(m.isActive),
            m.label,
            m.type,
            m.nodeConfig.accountsCount.toString(),
            `${m.nodeConfig.chainId}/${m.nodeConfig.evmChainId}`,
          ]);
        }

        console.log(table.toString());

        // Admin Addresses
        cliLogger.section('Admins');
        const admins = await keystore.getAdminAddresses();
        for (const admin of admins) {
          console.log(`  ${chalk.dim('•')} ${chalk.cyan(admin)}`);
        }

        // Quick Commands
        cliLogger.section('Quick Commands');
        cliLogger.dim('  cfx-devkit start      Start the development node');
        cliLogger.dim('  cfx-devkit web        Start web mode (API + UI)');
        cliLogger.dim('  cfx-devkit wallets    Manage wallets');
        cliLogger.dim('  cfx-devkit accounts   View genesis accounts');

        console.log();
      } catch (error) {
        spinner.fail('Failed to load status');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });
}
