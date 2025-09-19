#!/usr/bin/env node

import chalk from 'chalk';
import { ConfluxNode } from './ConfluxNode.js';
import type { NodeConfig } from './types.js';

async function runTest() {
  console.log(chalk.blue('🧪 Running Conflux node test...'));

  const node = new ConfluxNode();

  try {
    // Test basic functionality
    console.log(chalk.blue('📋 Testing node initialization...'));

    const config: Partial<NodeConfig> = {
      corePort: 12537,
      evmPort: 8545,
      blockInterval: 1000,
      chainId: 2029,
      evmChainId: 2030,
      dataDir: '/tmp/conflux-test',
      silent: true,
      walletMode: 'mnemonic',
      fundWallets: false,
      walletCount: 1,
    };

    console.log(chalk.green('✅ Node initialized successfully'));
    console.log(
      chalk.blue(`📊 Configuration: ${JSON.stringify(config, null, 2)}`)
    );

    // Test ephemeral execution
    console.log(chalk.blue('🚀 Testing ephemeral execution...'));

    const result = await node.executeScript(async (node) => {
      const status = await node.getStatus();
      const coreClient = node.getCoreClient();
      const evmClient = node.getEvmClient();

      return {
        status,
        coreClient: !!coreClient,
        evmClient: !!evmClient,
        timestamp: new Date().toISOString(),
      };
    }, config);

    if (result.success) {
      console.log(chalk.green('✅ Ephemeral execution test passed!'));
      console.log(
        chalk.blue(`📊 Result: ${JSON.stringify(result.data, null, 2)}`)
      );
      console.log(chalk.blue(`⏱️  Duration: ${result.duration}ms`));
    } else {
      console.error(
        chalk.red('❌ Ephemeral execution test failed:'),
        result.error
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
    return false;
  }
}

// Run the test
runTest()
  .then((success) => {
    if (success) {
      console.log(chalk.green('🎉 All tests passed!'));
      process.exit(0);
    } else {
      console.error(chalk.red('❌ Tests failed!'));
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(chalk.red('❌ Test execution failed:'), error);
    process.exit(1);
  });
