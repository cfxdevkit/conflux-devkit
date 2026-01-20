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
 * CLI Logger Utilities
 *
 * Provides colored console output and formatting helpers for the CLI.
 */

import chalk from 'chalk';

export const cliLogger = {
  info: (message: string) => console.log(chalk.blue('ℹ'), message),
  success: (message: string) => console.log(chalk.green('✓'), message),
  warn: (message: string) => console.log(chalk.yellow('⚠'), message),
  error: (message: string) => console.log(chalk.red('✖'), message),
  dim: (message: string) => console.log(chalk.dim(message)),

  // Box/banner display
  banner: (title: string, lines: string[]) => {
    const maxLen = Math.max(title.length, ...lines.map((l) => l.length)) + 4;
    const border = chalk.green('═'.repeat(maxLen));

    console.log('\n' + border);
    console.log(chalk.bold(`  ${title}`));
    console.log(border);
    for (const line of lines) {
      console.log(`  ${line}`);
    }
    console.log(border + '\n');
  },

  // Key-value display
  keyValue: (key: string, value: string) => {
    console.log(`  ${chalk.dim(key + ':')} ${chalk.cyan(value)}`);
  },

  // Section header
  section: (title: string) => {
    console.log('\n' + chalk.bold(title));
    console.log(chalk.dim('─'.repeat(40)));
  },

  // Newline
  newline: () => console.log(),
};

export { chalk };
