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
 * Web Command
 *
 * Starts the DevKit in web mode - backend API server with optional frontend.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import type { Command } from 'commander';
import ora from 'ora';
import { BackendServer } from '../../server/BackendServer.js';
import { getKeystoreService } from '../../services/keystore-service.js';
import { chalk, cliLogger } from '../utils/index.js';

export function registerWebCommand(program: Command): void {
  program
    .command('web')
    .description('Start web mode (backend API + optional frontend)')
    .option('-p, --port <port>', 'Backend API port', '3001')
    .option('-w, --ws-port <port>', 'WebSocket port', '3002')
    .option('--no-frontend', 'Skip starting frontend dev server')
    .option('--frontend-port <port>', 'Frontend dev server port', '5173')
    .action(async (options) => {
      const spinner = ora('Starting Conflux DevKit web mode...').start();

      let frontendProcess: ChildProcess | null = null;
      let server: BackendServer | null = null;

      try {
        // Initialize keystore
        const keystore = getKeystoreService();
        await keystore.initialize();

        // Default config for when setup is not completed
        let devkitConfig: {
          chainId: number;
          evmChainId: number;
          jsonrpcHttpPort: number;
          jsonrpcHttpEthPort: number;
          jsonrpcWsPort: number;
          jsonrpcWsEthPort: number;
          log: boolean;
          mnemonic?: string;
          dataDir?: string;
        } = {
          chainId: 2029,
          evmChainId: 2030,
          jsonrpcHttpPort: 12537,
          jsonrpcHttpEthPort: 8545,
          jsonrpcWsPort: 12535,
          jsonrpcWsEthPort: 8546,
          log: false,
        };

        const setupCompleted = await keystore.isSetupCompleted();

        // If setup completed and not locked, load active wallet config
        if (setupCompleted && !keystore.isLocked()) {
          const mnemonic = await keystore.getActiveMnemonic();
          const decrypted = await keystore.getDecryptedMnemonic(mnemonic.id);
          const dataDir = await keystore.getDataDir();

          devkitConfig = {
            ...devkitConfig,
            chainId: mnemonic.nodeConfig.chainId,
            evmChainId: mnemonic.nodeConfig.evmChainId,
            mnemonic: decrypted,
            dataDir,
          };

          spinner.text = `Loading wallet "${mnemonic.label}"...`;
        }

        // Start backend server
        spinner.text = 'Starting backend server...';

        server = new BackendServer({
          port: parseInt(options.port, 10),
          wsPort: parseInt(options.wsPort, 10),
          devkitConfig,
        });

        await server.start();
        spinner.succeed('Backend server started');

        // Start frontend if enabled
        if (options.frontend) {
          spinner.start('Starting frontend dev server...');

          // Find workspace root (go up from packages/backend)
          const workspaceRoot = process.cwd().includes('packages/backend')
            ? process.cwd().replace(/\/packages\/backend.*$/, '')
            : process.cwd();

          frontendProcess = spawn(
            'pnpm',
            ['--filter', '@conflux-devkit/frontend', 'dev'],
            {
              cwd: workspaceRoot,
              stdio: 'pipe',
              shell: true,
              env: {
                ...process.env,
                FORCE_COLOR: '1',
              },
            }
          );

          // Wait for frontend to initialize (look for ready message or timeout)
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              resolve();
            }, 5000);

            frontendProcess?.stdout?.on('data', (data: Buffer) => {
              const output = data.toString();
              if (
                output.includes('Local:') ||
                output.includes('ready in') ||
                output.includes('VITE')
              ) {
                clearTimeout(timeout);
                resolve();
              }
            });

            frontendProcess?.on('error', () => {
              clearTimeout(timeout);
              resolve();
            });
          });

          spinner.succeed('Frontend dev server started');
        }

        // Display info
        const infoLines = [
          `Backend API:  ${chalk.cyan(`http://localhost:${options.port}`)}`,
          `WebSocket:    ${chalk.cyan(`ws://localhost:${options.wsPort}`)}`,
          `Health:       ${chalk.cyan(`http://localhost:${options.port}/health`)}`,
        ];

        if (options.frontend) {
          infoLines.push(
            `Frontend:     ${chalk.cyan(`http://localhost:${options.frontendPort}`)}`
          );
        }

        if (!setupCompleted) {
          infoLines.push('');
          infoLines.push(chalk.yellow('⚠ Setup not completed'));
          infoLines.push(
            chalk.dim(`  Visit http://localhost:${options.frontendPort} to complete setup`)
          );
        }

        cliLogger.banner('Conflux DevKit Web Mode', infoLines);

        cliLogger.dim('Press Ctrl+C to stop all services');
        cliLogger.newline();

        // Graceful shutdown handler
        const shutdown = async () => {
          cliLogger.newline();
          const stopSpinner = ora('Stopping services...').start();

          try {
            // Kill frontend process
            if (frontendProcess) {
              frontendProcess.kill('SIGTERM');
              // Give it a moment to clean up
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            // Stop backend server
            if (server) {
              await server.stop();
            }

            stopSpinner.succeed('All services stopped');
          } catch {
            stopSpinner.warn('Services may not have stopped cleanly');
          }

          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        // Forward frontend output (optional, for debugging)
        if (frontendProcess) {
          frontendProcess.stdout?.on('data', (data: Buffer) => {
            const lines = data.toString().trim().split('\n');
            for (const line of lines) {
              if (line.trim()) {
                console.log(chalk.dim('[frontend]'), line);
              }
            }
          });

          frontendProcess.stderr?.on('data', (data: Buffer) => {
            const lines = data.toString().trim().split('\n');
            for (const line of lines) {
              if (line.trim()) {
                console.log(chalk.red('[frontend]'), line);
              }
            }
          });
        }

        // Keep process alive
        await new Promise(() => {
          // This promise never resolves - keeps the process running
        });
      } catch (error) {
        spinner.fail('Failed to start web mode');
        cliLogger.error(
          error instanceof Error ? error.message : 'Unknown error'
        );

        // Cleanup on error
        if (frontendProcess) {
          frontendProcess.kill('SIGTERM');
        }

        process.exit(1);
      }
    });
}
