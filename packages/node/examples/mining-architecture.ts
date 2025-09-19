#!/usr/bin/env node

/**
 * DevKit API Example - Mining & Account Architecture
 *
 * This example demonstrates the DevKit account and mining architecture:
 * 1. Start node with DevKit's simplified API
 * 2. Show account structure and mining setup
 * 3. Start mining to fund the faucet system
 * 4. Use faucet to fund accounts on both chains
 * 5. Demonstrate account balance management
 *
 * Key Architecture:
 * - Genesis accounts: Auto-funded by @xcfx/node for development
 * - Mining account: Dedicated account separate from genesis, receives mining rewards
 * - Faucet system: Uses mining account to fund other accounts cross-chain
 * - DevKit API: Unified interface for all operations
 */

import { DevKit } from '../src/index.js';

async function main() {
  console.log('🚀 Starting DevKit API Mining & Architecture Example\n');

  // Create DevKit instance with custom configuration
  const devkit = new DevKit({
    chainId: 2029, // Core Space chain ID
    evmChainId: 2030, // eSpace chain ID
    jsonrpcHttpPort: 12537, // Core Space RPC port
    jsonrpcHttpEthPort: 8545, // eSpace RPC port (standard)
    jsonrpcWsPort: 12535, // WebSocket port
    log: false, // Disable verbose logging for cleaner output
    // Note: mnemonic will be auto-generated if not provided
  });

  try {
    // ===== STEP 1: Initialize and Start Node =====
    console.log('📦 Initializing DevKit...');
    console.log('🔧 Starting development node (this may take a moment)...');
    await devkit.start();
    console.log('✅ Node started successfully!\n');

    // Show node information
    const rpcUrls = devkit.getRpcUrls();
    console.log('🔍 Node Information:');
    console.log(`  Core RPC: ${rpcUrls.core}`);
    console.log(`  eSpace RPC: ${rpcUrls.evm}`);
    console.log(`  WebSocket: ${rpcUrls.ws}`);
    console.log(`  Status: Running\n`);

    // ===== STEP 2: Show Account Architecture =====
    console.log('👥 Account Architecture:');

    // Genesis accounts (auto-funded by @xcfx/node)
    console.log('📋 Genesis Accounts (showing first 3):');
    for (let i = 0; i < 3; i++) {
      const account = devkit.account(i);
      const balances = await account.getBalances();
      console.log(
        `  [${i}] Core: ${account.address.core} (${balances.core} CFX)`
      );
      console.log(
        `      eSpace: ${account.address.evm} (${balances.evm} CFX)\n`
      );
    }

    // Faucet balances
    const faucetBalances = await devkit.getFaucetBalances();
    console.log('⛏️  Faucet Account Balances:');
    console.log(`  Core: ${faucetBalances.coreBalance} CFX`);
    console.log(`  eSpace: ${faucetBalances.evmBalance} CFX\n`);

    // ===== STEP 3: Mining Status =====
    console.log('⛏️  Checking mining status...');
    const initialMiningStatus = await devkit.getMiningStatus();
    if (initialMiningStatus.isRunning) {
      console.log(
        '✅ Mining is already running - blocks generating automatically'
      );
    } else {
      console.log('🔥 Starting mining...');
      await devkit.startMining();
      console.log('✅ Mining started');
    }
    console.log('');

    // Wait for some mining rewards
    console.log('⏳ Waiting 5 seconds for mining rewards...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check updated faucet balances
    const updatedFaucetBalances = await devkit.getFaucetBalances();
    console.log('💰 Updated faucet balances after mining:');
    console.log(`  Core: ${updatedFaucetBalances.coreBalance} CFX`);
    console.log(`  eSpace: ${updatedFaucetBalances.evmBalance} CFX\n`);

    // ===== STEP 4: DevKit Account Management =====
    console.log('💼 DevKit Account Management Demo...\n');

    // Show how easy it is to access accounts
    const account0 = devkit.account(0);
    const account1 = devkit.account(1);

    console.log('✅ Account access with DevKit:');
    console.log(
      `  Account 0: ${account0.address.core} | ${account0.address.evm}`
    );
    console.log(
      `  Account 1: ${account1.address.core} | ${account1.address.evm}\n`
    );

    // ===== STEP 5: Faucet System Demo =====
    console.log('💧 Demonstrating DevKit faucet system...\n');

    // Fund account 1 from faucet using DevKit API
    console.log('� Funding account 1 via DevKit faucet...');

    // Fund Core Space
    const coreHash = await devkit.fundAccount(
      account1.address.core,
      '10',
      'core'
    );
    console.log(`  Core funding TX: ${coreHash}`);

    // Fund eSpace
    const evmHash = await devkit.fundAccount(account1.address.evm, '5', 'evm');
    console.log(`  eSpace funding TX: ${evmHash}\n`);

    // Check updated balances
    const account1Balances = await account1.getBalances();
    console.log('💰 Account 1 balances after funding:');
    console.log(`  Core: ${account1Balances.core} CFX`);
    console.log(`  eSpace: ${account1Balances.evm} CFX\n`);

    // ===== STEP 6: Show Mining Status =====
    const miningStatus = await devkit.getMiningStatus();
    console.log('⛏️  Mining Status:');
    console.log(`  Running: ${miningStatus.isRunning}`);
    console.log(`  Interval: ${miningStatus.interval}ms`);
    console.log(`  Blocks mined: ${miningStatus.blocksMined}`);
    console.log(
      `  Start time: ${miningStatus.startTime ? miningStatus.startTime.toLocaleString() : 'N/A'}`
    );

    console.log(
      '\n🎉 DevKit API mining & architecture example completed successfully!'
    );
    console.log('\n💡 Key DevKit Features Demonstrated:');
    console.log('  • Single devkit instance manages both chains');
    console.log('  • devkit.account(i) provides easy account access');
    console.log('  • Built-in faucet system with devkit.fundAccount()');
    console.log('  • Automatic mining with devkit.startMining()');
    console.log('  • Unified balance checking with account.getBalances()');
    console.log('  • Simple start/stop lifecycle management\n');

    console.log('🎉 DevKit Node example completed successfully!');
    console.log('\n💡 Key Takeaways:');
    console.log('  • Genesis accounts are auto-funded by @xcfx/node');
    console.log('  • Mining account is separate and receives mining rewards');
    console.log('  • Faucet system uses mining account to fund other accounts');
    console.log(
      '  • Wallet clients can be created for contract deployment and interaction'
    );
    console.log('  • Both chains support full development workflows\n');
  } catch (error) {
    console.error('❌ Error in example:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  } finally {
    // Cleanup
    console.log('🧹 Stopping development node...');
    await devkit.stop();
    console.log('✅ Node stopped cleanly');
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received terminate signal, shutting down...');
  process.exit(0);
});

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;
