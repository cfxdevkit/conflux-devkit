#!/usr/bin/env node

import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import { ConfluxNode } from './ConfluxNode.js';
import { deployContract } from './ConfluxOperations.js';
import { ContractDeployer } from './ContractDeployer.js';
import { NodeManager } from './NodeManager.js';
import { TestRunner } from './TestRunner.js';
import type { WalletInfo } from './types.js';

const program = new Command();
const nodeManager = new NodeManager();
const contractDeployer = new ContractDeployer();
const testRunner = new TestRunner();

program
  .name('conflux-local-node')
  .description('Local Conflux node management for development and testing')
  .version('1.0.0');

// Start node command
program
  .command('start')
  .description('Start local Conflux node')
  .option('-p, --port <port>', 'RPC port for Core space', '12537')
  .option('-e, --eth-port <port>', 'RPC port for EVM space', '8545')
  .option('-i, --interval <ms>', 'Block generation interval in ms', '1000')
  .option('-c, --config <file>', 'Configuration file path')
  .option('-s, --silent', 'Run in silent mode', false)
  .option(
    '-w, --wallet-mode <mode>',
    'Wallet mode (mnemonic|privatekey)',
    'mnemonic'
  )
  .option('-m, --mnemonic <mnemonic>', 'Mnemonic phrase for wallet generation')
  .option('-k, --private-key <key>', 'Private key for single wallet mode')
  .option('--no-fund', "Don't fund wallets automatically", false)
  .option(
    '--wallet-count <count>',
    'Number of wallets to generate (mnemonic mode)',
    '10'
  )
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting Conflux node...'));
      await nodeManager.start({
        corePort: parseInt(options.port, 10),
        evmPort: parseInt(options.ethPort, 10),
        blockInterval: parseInt(options.interval, 10),
        silent: options.silent,
        walletMode: options.walletMode,
        mnemonic: options.mnemonic,
        privateKey: options.privateKey,
        fundWallets: !options.noFund,
        walletCount: parseInt(options.walletCount, 10),
      });
      console.log(chalk.green('✅ Node started successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to start node:'), error);
      process.exit(1);
    }
  });

// Stop node command
program
  .command('stop')
  .description('Stop local Conflux node')
  .action(async () => {
    try {
      console.log(chalk.blue('🛑 Stopping Conflux node...'));
      await nodeManager.stop();
      console.log(chalk.green('✅ Node stopped successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to stop node:'), error);
      process.exit(1);
    }
  });

// Development mode command
program
  .command('dev')
  .description('Start development environment with auto-reload')
  .option('-p, --port <port>', 'RPC port for Core space', '12537')
  .option('-e, --eth-port <port>', 'RPC port for EVM space', '8545')
  .option('-i, --interval <ms>', 'Block generation interval in ms', '1000')
  .option(
    '-w, --wallet-mode <mode>',
    'Wallet mode (mnemonic|privatekey)',
    'mnemonic'
  )
  .option('-m, --mnemonic <mnemonic>', 'Mnemonic phrase for wallet generation')
  .option('-k, --private-key <key>', 'Private key for single wallet mode')
  .option('--no-fund', "Don't fund wallets automatically", false)
  .option(
    '--wallet-count <count>',
    'Number of wallets to generate (mnemonic mode)',
    '10'
  )
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔧 Starting development environment...'));
      await nodeManager.startDev({
        corePort: parseInt(options.port, 10),
        evmPort: parseInt(options.ethPort, 10),
        blockInterval: parseInt(options.interval, 10),
        walletMode: options.walletMode,
        mnemonic: options.mnemonic,
        privateKey: options.privateKey,
        fundWallets: !options.noFund,
        walletCount: parseInt(options.walletCount, 10),
      });
    } catch (error) {
      console.error(chalk.red('❌ Failed to start dev environment:'), error);
      process.exit(1);
    }
  });

// Deploy contracts command
program
  .command('deploy')
  .description('Deploy contracts to local node')
  .option(
    '-n, --network <network>',
    'Network to deploy to (espace|core|both)',
    'both'
  )
  .option('-p, --port <port>', 'RPC port for Core space', '12537')
  .option('-e, --eth-port <port>', 'RPC port for EVM space', '8545')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📦 Deploying contracts...'));
      await contractDeployer.deploy({
        network: options.network,
        port: options.port,
        ethPort: options.ethPort,
      });
      console.log(chalk.green('✅ Contracts deployed successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to deploy contracts:'), error);
      process.exit(1);
    }
  });

// Test contracts command
program
  .command('test')
  .description('Run contract tests against local node')
  .option(
    '-n, --network <network>',
    'Network to test (espace|core|both)',
    'both'
  )
  .option('-p, --port <port>', 'RPC port for Core space', '12537')
  .option('-e, --eth-port <port>', 'RPC port for EVM space', '8545')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🧪 Running contract tests...'));
      await testRunner.runTests({
        network: options.network,
        port: options.port,
        ethPort: options.ethPort,
      });
      console.log(chalk.green('✅ Tests completed successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Tests failed:'), error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check node status')
  .action(async () => {
    try {
      const status = await nodeManager.getStatus();
      console.log(chalk.blue('📊 Node Status:'));
      console.log(
        JSON.stringify(
          status,
          (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value,
          2
        )
      );
    } catch (error) {
      console.error(chalk.red('❌ Failed to get status:'), error);
      process.exit(1);
    }
  });

// Wallets command
program
  .command('wallets')
  .description('Show wallet information')
  .option('-f, --format <format>', 'Output format (table|json)', 'table')
  .action(async (options) => {
    try {
      const status = await nodeManager.getStatus();

      if (!status.wallets || status.wallets.length === 0) {
        console.log(chalk.yellow('⚠️  No wallets found. Start the node first.'));
        return;
      }

      if (options.format === 'json') {
        console.log(
          JSON.stringify(
            {
              walletMode: status.walletMode,
              miningAddress: status.miningAddress,
              wallets: status.wallets,
            },
            (_key, value) =>
              typeof value === 'bigint' ? value.toString() : value,
            2
          )
        );
        return;
      }

      // Table format
      console.log(chalk.blue('🔑 Wallet Information:'));
      console.log(chalk.cyan(`Mode: ${status.walletMode}`));
      console.log(
        chalk.cyan(`Mining Address: ${status.miningAddress || 'N/A'}`)
      );
      console.log(chalk.cyan(`Total Wallets: ${status.wallets.length}`));
      console.log('');

      console.log(chalk.blue('📋 Wallets:'));
      status.wallets.forEach((wallet: WalletInfo, index: number) => {
        const isMining = wallet.isMining ? ' ⛏️' : '';
        const balance = wallet.balance ? ` (${wallet.balance} CFX)` : '';
        console.log(
          chalk.green(`${index}: ${wallet.address}${isMining}${balance}`)
        );
      });
    } catch (error) {
      console.error(chalk.red('❌ Failed to get wallet info:'), error);
      process.exit(1);
    }
  });

// Reset command
program
  .command('reset')
  .description('Reset local node data')
  .action(async () => {
    try {
      console.log(chalk.blue('🔄 Resetting node data...'));
      await nodeManager.reset();
      console.log(chalk.green('✅ Node data reset successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to reset node:'), error);
      process.exit(1);
    }
  });

// Execute script command
program
  .command('exec')
  .description('Execute a script with ephemeral node')
  .option('-s, --script <file>', 'Script file to execute')
  .option('-c, --core-port <port>', 'Core RPC port', '12537')
  .option('-e, --evm-port <port>', 'EVM RPC port', '8545')
  .option('-i, --interval <ms>', 'Block interval in ms', '1000')
  .option('-o, --output <file>', 'Output file for results')
  .action(async (options) => {
    try {
      if (!options.script) {
        console.error(chalk.red('❌ Script file is required'));
        process.exit(1);
      }

      const scriptPath = path.resolve(options.script);
      if (!(await fs.pathExists(scriptPath))) {
        console.error(chalk.red(`❌ Script file not found: ${scriptPath}`));
        process.exit(1);
      }

      console.log(chalk.blue('🚀 Executing script with ephemeral node...'));

      const node = new ConfluxNode();

      // Load and execute script
      const scriptModule = await import(scriptPath);
      const scriptFunction =
        scriptModule.default || scriptModule.main || scriptModule.execute;

      if (typeof scriptFunction !== 'function') {
        console.error(
          chalk.red(
            '❌ Script must export a function as default, main, or execute'
          )
        );
        process.exit(1);
      }

      const result = await node.executeScript(scriptFunction, {
        corePort: parseInt(options.corePort, 10),
        evmPort: parseInt(options.evmPort, 10),
        blockInterval: parseInt(options.interval, 10),
        silent: true,
      });

      if (result.success) {
        console.log(chalk.green('✅ Script executed successfully!'));
        console.log(chalk.blue(`⏱️  Duration: ${result.duration}ms`));

        if (result.data) {
          const output = JSON.stringify(
            result.data,
            (_key, value) =>
              typeof value === 'bigint' ? value.toString() : value,
            2
          );
          console.log(chalk.cyan('📊 Result:'));
          console.log(output);

          if (options.output) {
            await fs.writeFile(options.output, output);
            console.log(chalk.blue(`💾 Result saved to: ${options.output}`));
          }
        }
      } else {
        console.error(chalk.red('❌ Script execution failed:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Execution error:'), error);
      process.exit(1);
    }
  });

// Deploy single contract command
program
  .command('deploy-contract')
  .description('Deploy a single contract with ephemeral node')
  .requiredOption('-c, --contract <file>', 'Contract file (Solidity)')
  .option('-a, --abi <file>', 'ABI file (JSON)')
  .option('-n, --name <name>', 'Contract name', 'Contract')
  .option('-p, --core-port <port>', 'Core RPC port', '12537')
  .option('-e, --evm-port <port>', 'EVM RPC port', '8545')
  .option('-o, --output <file>', 'Output file for deployment info')
  .action(async (options) => {
    try {
      const contractPath = path.resolve(options.contract);
      if (!(await fs.pathExists(contractPath))) {
        console.error(chalk.red(`❌ Contract file not found: ${contractPath}`));
        process.exit(1);
      }

      const contractCode = await fs.readFile(contractPath, 'utf-8');

      // Simple ABI for basic contracts
      const abi = [
        {
          inputs: [],
          stateMutability: 'nonpayable',
          type: 'constructor',
        },
        {
          inputs: [],
          name: 'owner',
          outputs: [{ internalType: 'address', name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      console.log(chalk.blue('🚀 Deploying contract with ephemeral node...'));

      const result = await deployContract(contractCode, abi, [], {
        corePort: parseInt(options.corePort, 10),
        evmPort: parseInt(options.evmPort, 10),
        silent: true,
      });

      if (result.success && result.data) {
        console.log(chalk.green('✅ Contract deployed successfully!'));
        console.log(chalk.blue(`📍 Address: ${result.data.address}`));
        console.log(chalk.blue(`🔗 Tx Hash: ${result.data.txHash}`));
        console.log(chalk.blue(`⏱️  Duration: ${result.duration}ms`));

        const deploymentInfo = {
          name: options.name,
          address: result.data.address,
          txHash: result.data.txHash,
          timestamp: new Date().toISOString(),
          duration: result.duration,
        };

        if (options.output) {
          await fs.writeFile(
            options.output,
            JSON.stringify(
              deploymentInfo,
              (_key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
              2
            )
          );
          console.log(
            chalk.blue(`💾 Deployment info saved to: ${options.output}`)
          );
        }
      } else {
        console.error(
          chalk.red('❌ Contract deployment failed:'),
          result.error
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Deployment error:'), error);
      process.exit(1);
    }
  });

program.parse();
