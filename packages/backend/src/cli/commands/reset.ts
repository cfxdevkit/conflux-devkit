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
 * Reset Command
 *
 * Reset DevKit configuration and/or blockchain data.
 */

import { existsSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { chalk, cliLogger } from '../utils/index.js';

const KEYSTORE_PATH = join(homedir(), '.devkit.keystore.json');
const DATA_DIR = process.env.DEVKIT_DATA_DIR || '/workspace/.conflux-dev';

export function registerResetCommand(program: Command): void {
  program
    .command('reset')
    .description('Reset DevKit configuration and/or data')
    .option('--config', 'Reset only configuration (keystore)')
    .option('--data', 'Reset only blockchain data')
    .option('-f, --force', 'Skip confirmation')
    .action(async (options) => {
      // Determine what to reset
      const resetConfig = options.config || (!options.config && !options.data);
      const resetData = options.data || (!options.config && !options.data);

      // Check what exists
      const keystoreExists = existsSync(KEYSTORE_PATH);
      const dataExists = existsSync(DATA_DIR);

      if (resetConfig && !keystoreExists && resetData && !dataExists) {
        cliLogger.dim('Nothing to reset. DevKit is already in a clean state.');
        return;
      }

      // Display what will be reset
      cliLogger.section('Reset DevKit');

      if (resetConfig) {
        if (keystoreExists) {
          console.log(`  ${chalk.yellow('•')} Configuration (keystore): ${KEYSTORE_PATH}`);
        } else {
          console.log(`  ${chalk.dim('•')} Configuration: Not found`);
        }
      }

      if (resetData) {
        if (dataExists) {
          console.log(`  ${chalk.yellow('•')} Blockchain data: ${DATA_DIR}`);
        } else {
          console.log(`  ${chalk.dim('•')} Blockchain data: Not found`);
        }
      }

      cliLogger.newline();

      // Confirmation
      if (!options.force) {
        cliLogger.warn('This action cannot be undone!');
        cliLogger.newline();

        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red('Are you sure you want to proceed?'),
            default: false,
          },
        ]);

        if (!confirmed) {
          cliLogger.dim('Reset cancelled.');
          return;
        }
      }

      // Perform reset
      const spinner = ora('Resetting...').start();

      try {
        if (resetConfig && keystoreExists) {
          rmSync(KEYSTORE_PATH, { force: true });
          spinner.text = 'Deleted keystore configuration';
        }

        if (resetData && dataExists) {
          rmSync(DATA_DIR, { recursive: true, force: true });
          spinner.text = 'Deleted blockchain data';
        }

        spinner.succeed('Reset completed');

        cliLogger.newline();

        if (resetConfig) {
          cliLogger.success('Configuration reset');
          cliLogger.dim('  Run `cfx-devkit setup` to configure again');
        }

        if (resetData) {
          cliLogger.success('Blockchain data deleted');
          cliLogger.dim('  Fresh blockchain state on next node start');
        }

        cliLogger.newline();
      } catch (error) {
        spinner.fail('Reset failed');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );

        // Provide manual instructions
        cliLogger.newline();
        cliLogger.dim('You can manually reset using:');
        if (resetConfig) {
          cliLogger.dim(`  rm ${KEYSTORE_PATH}`);
        }
        if (resetData) {
          cliLogger.dim(`  rm -rf ${DATA_DIR}`);
        }
      }
    });
}
