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
 * cfx-devkit CLI Entry Point
 *
 * This is the main entry point for the CLI binary.
 * Usage: cfx-devkit [command] [options]
 */

// Load environment variables
import 'dotenv/config';

import { program } from 'commander';
import { registerCommands } from './cli/index.js';

// Package version (will be replaced during build or read from package.json)
const VERSION = '0.1.0';

program
  .name('cfx-devkit')
  .description('Conflux DevKit - Local blockchain development environment')
  .version(VERSION, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText(
    'after',
    `
Examples:
  $ cfx-devkit setup          Run initial setup wizard
  $ cfx-devkit start          Start the development node
  $ cfx-devkit web            Start web mode (API + UI)
  $ cfx-devkit wallets        List wallets
  $ cfx-devkit accounts       List genesis accounts
  $ cfx-devkit status         Show current status

Documentation:
  https://github.com/cfxdevkit/conflux-devkit
`
  );

// Register all commands
registerCommands(program);

// Parse command line arguments
program.parse();
