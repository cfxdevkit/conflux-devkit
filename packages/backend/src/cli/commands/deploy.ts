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
 * Deploy Command
 *
 * Deploy test contracts to verify node and client functionality.
 */

import type { Command } from 'commander';
import ora from 'ora';
import { createPublicClient, createWalletClient, http as viemHttp } from 'viem';
import { privateKeyToAccount as evmPrivateKeyToAccount } from 'viem/accounts';
import {
  http as coreHttp,
  createPublicClient as createCorePublicClient,
  createWalletClient as createCoreWalletClient,
} from 'cive';
import { privateKeyToAccount as corePrivateKeyToAccount } from 'cive/accounts';
import {
  getChainConfig,
  toCiveChain,
  toViemChain,
  isValidChainId,
  type SupportedChainId,
} from '@conflux-devkit/core/config';
import { getKeystoreService } from '../../services/keystore-service.js';
import {
  TEST_CONTRACTS,
  type TestContractName,
} from '../../contracts/index.js';
import {
  compileSolidity,
  getSolcVersion,
} from '../../services/solidity-compiler.js';
import { chalk, cliLogger, createTable } from '../utils/index.js';

// Default RPC URLs for local node
const DEFAULT_EVM_RPC = 'http://localhost:8545';
const DEFAULT_CORE_RPC = 'http://localhost:12537';

/**
 * Get Core chain definition for a given network ID
 */
function getCoreChain(networkId: number) {
  if (!isValidChainId(networkId)) {
    throw new Error(`Unsupported Core chain ID: ${networkId}`);
  }
  const chainConfig = getChainConfig(networkId as SupportedChainId);
  return toCiveChain(chainConfig);
}

/**
 * Get EVM chain definition for a given network ID
 */
function getEvmChain(networkId: number) {
  if (!isValidChainId(networkId)) {
    throw new Error(`Unsupported EVM chain ID: ${networkId}`);
  }
  const chainConfig = getChainConfig(networkId as SupportedChainId);
  return toViemChain(chainConfig);
}

/**
 * Deploy contract to eSpace
 */
async function deployToEvm(params: {
  abi: unknown[];
  bytecode: `0x${string}`;
  args: unknown[];
  privateKey: `0x${string}`;
  evmChainId: number;
  rpcUrl?: string;
}): Promise<{ address: string; transactionHash: string }> {
  const { abi, bytecode, args, privateKey, evmChainId, rpcUrl = DEFAULT_EVM_RPC } = params;

  const evmChain = getEvmChain(evmChainId);
  const account = evmPrivateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    transport: viemHttp(rpcUrl),
  });

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args,
    chain: evmChain,
  });

  const publicClient = createPublicClient({
    transport: viemHttp(rpcUrl),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    address: (receipt as { contractAddress?: string }).contractAddress || '',
    transactionHash: hash,
  };
}

/**
 * Deploy contract to Core Space
 */
async function deployToCore(params: {
  abi: unknown[];
  bytecode: `0x${string}`;
  args: unknown[];
  privateKey: `0x${string}`;
  chainId: number;
  rpcUrl?: string;
}): Promise<{ address: string; transactionHash: string }> {
  const { abi, bytecode, args, privateKey, chainId, rpcUrl = DEFAULT_CORE_RPC } = params;

  const coreChain = getCoreChain(chainId);
  const account = corePrivateKeyToAccount(privateKey, { networkId: chainId });
  const walletClient = createCoreWalletClient({
    account,
    chain: coreChain,
    transport: coreHttp(rpcUrl),
  });

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args,
  });

  const publicClient = createCorePublicClient({
    transport: coreHttp(rpcUrl),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress =
    (receipt as { contractAddress?: string }).contractAddress ||
    (receipt as { contractCreated?: string }).contractCreated ||
    '';

  return {
    address: contractAddress,
    transactionHash: hash,
  };
}

/**
 * Read from contract on eSpace
 */
async function readFromEvm(params: {
  address: `0x${string}`;
  abi: unknown[];
  functionName: string;
  args?: unknown[];
  rpcUrl?: string;
}): Promise<unknown> {
  const { address, abi, functionName, args = [], rpcUrl = DEFAULT_EVM_RPC } = params;

  const publicClient = createPublicClient({
    transport: viemHttp(rpcUrl),
  });

  return await publicClient.readContract({
    address,
    abi,
    functionName,
    args,
  });
}

/**
 * Read from contract on Core Space
 */
async function readFromCore(params: {
  address: string;
  abi: unknown[];
  functionName: string;
  args?: unknown[];
  rpcUrl?: string;
}): Promise<unknown> {
  const { address, abi, functionName, args = [], rpcUrl = DEFAULT_CORE_RPC } = params;

  const publicClient = createCorePublicClient({
    transport: coreHttp(rpcUrl),
  });

  // Core Space addresses have a special format (cfx:...), cast to any to bypass strict typing
  return await publicClient.readContract({
    address: address as any,
    abi,
    functionName,
    args,
  });
}

/**
 * Write to contract on eSpace
 */
async function writeToEvm(params: {
  address: `0x${string}`;
  abi: unknown[];
  functionName: string;
  args: unknown[];
  privateKey: `0x${string}`;
  evmChainId: number;
  rpcUrl?: string;
}): Promise<string> {
  const { address, abi, functionName, args, privateKey, evmChainId, rpcUrl = DEFAULT_EVM_RPC } = params;

  const evmChain = getEvmChain(evmChainId);
  const account = evmPrivateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    transport: viemHttp(rpcUrl),
  });

  return await walletClient.writeContract({
    address,
    abi,
    functionName,
    args,
    chain: evmChain,
  });
}

/**
 * Write to contract on Core Space
 */
async function writeToCore(params: {
  address: string;
  abi: unknown[];
  functionName: string;
  args: unknown[];
  privateKey: `0x${string}`;
  chainId: number;
  rpcUrl?: string;
}): Promise<string> {
  const { address, abi, functionName, args, privateKey, chainId, rpcUrl = DEFAULT_CORE_RPC } = params;

  const coreChain = getCoreChain(chainId);
  const account = corePrivateKeyToAccount(privateKey, { networkId: chainId });
  const walletClient = createCoreWalletClient({
    account,
    chain: coreChain,
    transport: coreHttp(rpcUrl),
  });

  // Core Space addresses have a special format (cfx:...), cast to any to bypass strict typing
  return await walletClient.writeContract({
    address: address as any,
    abi,
    functionName,
    args,
  });
}

export function registerDeployCommand(program: Command): void {
  const deploy = program
    .command('deploy')
    .description('Deploy test contracts to verify node functionality');

  // List available contracts
  deploy
    .command('list')
    .description('List available test contracts')
    .action(() => {
      cliLogger.section('Available Test Contracts');

      const table = createTable({
        head: ['Name', 'Description'],
      });

      for (const [name, contract] of Object.entries(TEST_CONTRACTS)) {
        table.push([chalk.cyan(name), contract.description]);
      }

      console.log(table.toString());
      cliLogger.newline();
      cliLogger.dim(`Solc version: ${getSolcVersion()}`);
      cliLogger.newline();
    });

  // Compile a contract
  deploy
    .command('compile <contract>')
    .description('Compile a test contract and show details')
    .action((contractName: string) => {
      const name = contractName as TestContractName;
      const contract = TEST_CONTRACTS[name];

      if (!contract) {
        cliLogger.error(`Unknown contract: ${contractName}`);
        cliLogger.dim(`Available: ${Object.keys(TEST_CONTRACTS).join(', ')}`);
        return;
      }

      const spinner = ora(`Compiling ${name}...`).start();

      try {
        const compiled = contract.getCompiled();
        spinner.succeed(`Compiled ${name}`);

        cliLogger.section('Contract Details');
        cliLogger.keyValue('Name', compiled.contractName);
        cliLogger.keyValue('Compiler', compiled.compilerVersion);
        cliLogger.keyValue('Bytecode Size', `${Math.floor(compiled.bytecode.length / 2)} bytes`);
        cliLogger.keyValue('ABI Functions', compiled.abi.length.toString());

        if (compiled.gasEstimates?.creation) {
          cliLogger.section('Gas Estimates');
          cliLogger.keyValue('Code Deposit', compiled.gasEstimates.creation.codeDepositCost);
          cliLogger.keyValue('Execution', compiled.gasEstimates.creation.executionCost);
          cliLogger.keyValue('Total', compiled.gasEstimates.creation.totalCost);
        }

        cliLogger.section('ABI');
        for (const item of compiled.abi) {
          const abiItem = item as { type: string; name?: string; inputs?: { type: string }[] };
          if (abiItem.type === 'function') {
            const inputs = abiItem.inputs?.map((i) => i.type).join(', ') || '';
            console.log(`  ${chalk.dim('•')} ${chalk.cyan(abiItem.name)}(${inputs})`);
          } else if (abiItem.type === 'event') {
            console.log(`  ${chalk.dim('⚡')} ${chalk.yellow(abiItem.name)}`);
          } else if (abiItem.type === 'constructor') {
            const inputs = abiItem.inputs?.map((i) => i.type).join(', ') || '';
            console.log(`  ${chalk.dim('🔨')} constructor(${inputs})`);
          }
        }

        cliLogger.newline();
      } catch (error) {
        spinner.fail('Compilation failed');
        cliLogger.error(error instanceof Error ? error.message : 'Unknown error');
      }
    });

  // Deploy a contract
  deploy
    .command('run <contract>')
    .description('Deploy a test contract to the running node')
    .option('-c, --chain <chain>', 'Target chain: evm or core', 'evm')
    .option('-a, --account <index>', 'Account index to deploy from', '0')
    .option('--args <args>', 'Constructor arguments (JSON array)', '[]')
    .action(async (contractName: string, options) => {
      const name = contractName as TestContractName;
      const contract = TEST_CONTRACTS[name];

      if (!contract) {
        cliLogger.error(`Unknown contract: ${contractName}`);
        cliLogger.dim(`Available: ${Object.keys(TEST_CONTRACTS).join(', ')}`);
        return;
      }

      const chain = options.chain as 'evm' | 'core';
      if (chain !== 'evm' && chain !== 'core') {
        cliLogger.error('Chain must be "evm" or "core"');
        return;
      }

      // Parse constructor args
      let constructorArgs: unknown[];
      try {
        constructorArgs = JSON.parse(options.args);
        if (!Array.isArray(constructorArgs)) {
          throw new Error('Args must be a JSON array');
        }
      } catch {
        cliLogger.error(`Invalid constructor args: ${options.args}`);
        cliLogger.dim('Provide a JSON array, e.g., --args \'[42]\'');
        return;
      }

      // Validate args for known contracts
      if (name === 'SimpleStorage' && constructorArgs.length === 0) {
        constructorArgs = [42]; // Default initial value
      } else if (name === 'TestToken' && constructorArgs.length === 0) {
        constructorArgs = ['Test Token', 'TEST', 1000000]; // Default token params
      }

      const spinner = ora('Initializing...').start();

      try {
        // Initialize keystore
        const keystore = getKeystoreService();
        await keystore.initialize();

        if (!(await keystore.isSetupCompleted())) {
          spinner.fail('Setup not completed');
          cliLogger.dim('Run: cfx-devkit setup');
          return;
        }

        if (keystore.isLocked()) {
          spinner.fail('Keystore is locked');
          cliLogger.dim('Unlock via web UI or API first');
          return;
        }

        // Get active wallet and derive accounts
        const mnemonic = await keystore.getActiveMnemonic();
        const accounts = await keystore.deriveGenesisAccounts(mnemonic.id);

        const accountIndex = parseInt(options.account, 10);
        if (accountIndex >= accounts.length) {
          spinner.fail(`Account index ${accountIndex} out of range (0-${accounts.length - 1})`);
          return;
        }

        const deployer = accounts[accountIndex];

        spinner.text = 'Compiling contract...';
        const compiled = contract.getCompiled();

        spinner.text = `Deploying ${name} to ${chain}...`;

        let result: { address: string; transactionHash: string };

        if (chain === 'evm') {
          result = await deployToEvm({
            abi: compiled.abi,
            bytecode: compiled.bytecode as `0x${string}`,
            args: constructorArgs,
            privateKey: deployer.evmPrivateKey as `0x${string}`,
            evmChainId: mnemonic.nodeConfig.evmChainId,
          });
        } else {
          result = await deployToCore({
            abi: compiled.abi,
            bytecode: compiled.bytecode as `0x${string}`,
            args: constructorArgs,
            privateKey: deployer.privateKey as `0x${string}`, // Core private key
            chainId: mnemonic.nodeConfig.chainId,
          });
        }

        spinner.succeed('Contract deployed!');

        cliLogger.section('Deployment Result');
        cliLogger.keyValue('Contract', name);
        cliLogger.keyValue('Chain', chain === 'evm' ? 'eSpace' : 'Core Space');
        cliLogger.keyValue('Address', chalk.green(result.address));
        cliLogger.keyValue('Transaction', result.transactionHash);
        cliLogger.keyValue('Deployer', chain === 'evm' ? deployer.evm : deployer.core);
        cliLogger.keyValue('Constructor Args', JSON.stringify(constructorArgs));

        cliLogger.newline();
        cliLogger.success('You can now interact with this contract!');
        cliLogger.newline();
      } catch (error) {
        spinner.fail('Deployment failed');
        cliLogger.error(error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof Error && error.message.includes('fetch')) {
          cliLogger.dim('Make sure the node is running: cfx-devkit start');
        }
      }
    });

  // Full test deployment (deploy + interact)
  deploy
    .command('test')
    .description('Run a full deployment and interaction test')
    .option('-c, --chain <chain>', 'Target chain: evm or core', 'evm')
    .action(async (options) => {
      const chain = options.chain as 'evm' | 'core';
      if (chain !== 'evm' && chain !== 'core') {
        cliLogger.error('Chain must be "evm" or "core"');
        return;
      }

      const spinner = ora('Starting deployment test...').start();

      try {
        // Initialize keystore
        const keystore = getKeystoreService();
        await keystore.initialize();

        if (!(await keystore.isSetupCompleted())) {
          spinner.fail('Setup not completed');
          cliLogger.dim('Run: cfx-devkit setup');
          return;
        }

        if (keystore.isLocked()) {
          spinner.fail('Keystore is locked');
          return;
        }

        // Get active wallet and derive accounts
        const mnemonic = await keystore.getActiveMnemonic();
        const accounts = await keystore.deriveGenesisAccounts(mnemonic.id);
        const deployer = accounts[0];

        spinner.text = 'Compiling SimpleStorage...';
        const simpleStorage = TEST_CONTRACTS.SimpleStorage.getCompiled();

        const initialValue = 42;
        spinner.text = `Deploying SimpleStorage with initial value ${initialValue}...`;

        let deployResult: { address: string; transactionHash: string };

        if (chain === 'evm') {
          deployResult = await deployToEvm({
            abi: simpleStorage.abi,
            bytecode: simpleStorage.bytecode as `0x${string}`,
            args: [initialValue],
            privateKey: deployer.evmPrivateKey as `0x${string}`,
            evmChainId: mnemonic.nodeConfig.evmChainId,
          });
        } else {
          deployResult = await deployToCore({
            abi: simpleStorage.abi,
            bytecode: simpleStorage.bytecode as `0x${string}`,
            args: [initialValue],
            privateKey: deployer.privateKey as `0x${string}`, // Core private key
            chainId: mnemonic.nodeConfig.chainId,
          });
        }

        spinner.succeed('SimpleStorage deployed');
        cliLogger.keyValue('Address', chalk.cyan(deployResult.address));

        // Read initial value
        spinner.start('Reading initial value...');

        let readResult: unknown;
        if (chain === 'evm') {
          readResult = await readFromEvm({
            address: deployResult.address as `0x${string}`,
            abi: simpleStorage.abi,
            functionName: 'get',
          });
        } else {
          readResult = await readFromCore({
            address: deployResult.address,
            abi: simpleStorage.abi,
            functionName: 'get',
          });
        }

        spinner.succeed(`Initial value: ${chalk.green(String(readResult))}`);

        // Write new value
        const newValue = 100;
        spinner.start(`Setting value to ${newValue}...`);

        let writeHash: string;
        if (chain === 'evm') {
          writeHash = await writeToEvm({
            address: deployResult.address as `0x${string}`,
            abi: simpleStorage.abi,
            functionName: 'set',
            args: [newValue],
            privateKey: deployer.evmPrivateKey as `0x${string}`,
            evmChainId: mnemonic.nodeConfig.evmChainId,
          });
        } else {
          writeHash = await writeToCore({
            address: deployResult.address,
            abi: simpleStorage.abi,
            functionName: 'set',
            args: [newValue],
            privateKey: deployer.privateKey as `0x${string}`, // Core private key
            chainId: mnemonic.nodeConfig.chainId,
          });
        }

        spinner.succeed(`Value set to ${newValue}`);
        cliLogger.keyValue('Transaction', writeHash);

        // Wait a moment for the transaction to be mined
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Read new value
        spinner.start('Reading updated value...');

        let updatedValue: unknown;
        if (chain === 'evm') {
          updatedValue = await readFromEvm({
            address: deployResult.address as `0x${string}`,
            abi: simpleStorage.abi,
            functionName: 'get',
          });
        } else {
          updatedValue = await readFromCore({
            address: deployResult.address,
            abi: simpleStorage.abi,
            functionName: 'get',
          });
        }

        spinner.succeed(`Updated value: ${chalk.green(String(updatedValue))}`);

        // Verify
        if (Number(updatedValue) === newValue) {
          cliLogger.newline();
          cliLogger.banner('Test Passed!', [
            `Chain: ${chalk.cyan(chain === 'evm' ? 'eSpace' : 'Core Space')}`,
            `Contract: ${chalk.cyan(deployResult.address)}`,
            `Initial: ${chalk.green(String(initialValue))}`,
            `Updated: ${chalk.green(String(newValue))}`,
            '',
            chalk.green('✓ Deploy works'),
            chalk.green('✓ Read works'),
            chalk.green('✓ Write works'),
          ]);
        } else {
          cliLogger.error(`Test failed: expected ${newValue}, got ${updatedValue}`);
        }
      } catch (error) {
        spinner.fail('Test failed');
        cliLogger.error(error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof Error) {
          console.error(chalk.dim(error.stack));
        }
        if (error instanceof Error && error.message.includes('fetch')) {
          cliLogger.dim('Make sure the node is running: cfx-devkit start');
        }
      }
    });

  // Compile custom Solidity
  deploy
    .command('compile-source <source>')
    .description('Compile custom Solidity source code')
    .option('-n, --name <name>', 'Contract name', 'CustomContract')
    .action((source: string, options) => {
      const spinner = ora('Compiling...').start();

      try {
        const result = compileSolidity({
          contractName: options.name,
          source,
        });

        if (!result.success) {
          spinner.fail('Compilation failed');
          for (const error of result.errors) {
            cliLogger.error(error.formattedMessage);
          }
          return;
        }

        spinner.succeed('Compilation successful');

        for (const warning of result.warnings) {
          cliLogger.warn(warning.message);
        }

        for (const contract of result.contracts) {
          cliLogger.section(`Contract: ${contract.contractName}`);
          cliLogger.keyValue('Bytecode Size', `${Math.floor(contract.bytecode.length / 2)} bytes`);
          cliLogger.keyValue('ABI Functions', contract.abi.length.toString());
        }

        cliLogger.newline();
      } catch (error) {
        spinner.fail('Compilation failed');
        cliLogger.error(error instanceof Error ? error.message : 'Unknown error');
      }
    });
}
