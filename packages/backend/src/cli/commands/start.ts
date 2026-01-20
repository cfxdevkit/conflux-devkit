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
 * Start Command
 *
 * Starts the local Conflux development node in foreground mode.
 */

import type { Command } from 'commander';
import ora from 'ora';
import { DevKitCompat } from '../../devkit-compat.js';
import { getKeystoreService } from '../../services/keystore-service.js';
import { chalk, cliLogger } from '../utils/index.js';

export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('Start the local development node')
    .option('-m, --mining', 'Enable auto-mining (default: true)', true)
    .option('-i, --interval <ms>', 'Mining interval in milliseconds', '500')
    .option('--no-mining', 'Disable auto-mining')
    .action(async (options) => {
      const spinner = ora('Starting Conflux DevKit node...').start();

      try {
        // Initialize keystore
        const keystore = getKeystoreService();
        await keystore.initialize();

        // Check setup
        if (!(await keystore.isSetupCompleted())) {
          spinner.fail('Setup not completed');
          cliLogger.newline();
          cliLogger.warn('Run setup wizard first:');
          cliLogger.dim('  cfx-devkit setup');
          cliLogger.newline();
          process.exit(1);
        }

        // Check if locked
        if (keystore.isLocked()) {
          spinner.fail('Keystore is locked');
          cliLogger.newline();
          cliLogger.warn('Please unlock via web UI or API first');
          cliLogger.newline();
          process.exit(1);
        }

        // Get active mnemonic config
        const mnemonic = await keystore.getActiveMnemonic();
        const decrypted = await keystore.getDecryptedMnemonic(mnemonic.id);
        const dataDir = await keystore.getDataDir();

        spinner.text = `Starting node with wallet "${mnemonic.label}"...`;

        // Create DevKit instance
        const devkit = new DevKitCompat({
          chainId: mnemonic.nodeConfig.chainId,
          evmChainId: mnemonic.nodeConfig.evmChainId,
          jsonrpcHttpPort: 12537,
          jsonrpcHttpEthPort: 8545,
          jsonrpcWsPort: 12535,
          jsonrpcWsEthPort: 8546,
          log: false,
          mnemonic: decrypted,
          dataDir,
          accountsCount: mnemonic.nodeConfig.accountsCount,
          miningAuthor:
            mnemonic.nodeConfig.miningAuthor === 'auto'
              ? undefined
              : mnemonic.nodeConfig.miningAuthor,
        });

        // Start node
        await devkit.start();
        spinner.succeed('Node started successfully');

        // Display info
        cliLogger.banner('Conflux DevKit Node Running', [
          `Wallet:     ${chalk.cyan(mnemonic.label)}`,
          `Core RPC:   ${chalk.cyan('http://localhost:12537')}`,
          `eSpace RPC: ${chalk.cyan('http://localhost:8545')}`,
          `Chain IDs:  ${chalk.cyan(`Core: ${mnemonic.nodeConfig.chainId}, eSpace: ${mnemonic.nodeConfig.evmChainId}`)}`,
          `Accounts:   ${chalk.cyan(mnemonic.nodeConfig.accountsCount.toString())}`,
          `Data Dir:   ${chalk.cyan(dataDir)}`,
        ]);

        // Start mining if enabled
        if (options.mining) {
          const interval = parseInt(options.interval, 10);
          await devkit.startMining(interval);
          cliLogger.success(`Auto-mining enabled (${interval}ms interval)`);
        } else {
          cliLogger.dim('Auto-mining disabled. Use manual mining.');
        }

        cliLogger.newline();
        cliLogger.dim('Press Ctrl+C to stop the node');
        cliLogger.newline();

        // Graceful shutdown handler
        const shutdown = async () => {
          cliLogger.newline();
          const stopSpinner = ora('Stopping node...').start();
          try {
            await devkit.stop();
            stopSpinner.succeed('Node stopped');
          } catch {
            stopSpinner.warn('Node may not have stopped cleanly');
          }
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        // Keep process alive
        await new Promise(() => {
          // This promise never resolves - keeps the process running
        });
      } catch (error) {
        spinner.fail('Failed to start node');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });
}
