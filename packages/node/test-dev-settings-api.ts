#!/usr/bin/env node

/**
 * Test the dev settings API endpoint manually
 */

import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 Testing Dev Settings API\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12536,
    jsonrpcHttpEthPort: 8544,
    jsonrpcWsPort: 12535,
    log: false,
  });

  try {
    console.log('📦 Starting DevKit to test API...');

    // Test 1: Update settings when node is stopped (should work)
    console.log('\n1️⃣ Testing updateDevSettings when node is stopped...');
    try {
      await devkit.updateDevSettings({
        devBlockIntervalMs: 500,
        devPackTxImmediately: true,
      });
      console.log('✅ Successfully updated dev settings when stopped');
    } catch (error) {
      console.log('❌ Failed to update dev settings when stopped:', error.message);
    }

    // Start the node
    console.log('\n📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started');

    // Test 2: Update settings when node is running (should fail)
    console.log('\n2️⃣ Testing updateDevSettings when node is running...');
    try {
      await devkit.updateDevSettings({
        devBlockIntervalMs: 1000,
        devPackTxImmediately: false,
      });
      console.log('❌ Unexpectedly succeeded to update dev settings when running');
    } catch (error) {
      console.log('✅ Correctly failed to update dev settings when running:', error.message);
    }

    // Stop the node
    console.log('\n⏹️ Stopping node...');
    await devkit.stop();
    console.log('✅ Node stopped');

    // Test 3: Update settings when node is stopped again (should work)
    console.log('\n3️⃣ Testing updateDevSettings when node is stopped again...');
    try {
      await devkit.updateDevSettings({
        devBlockIntervalMs: undefined, // Disable auto block generation
        devPackTxImmediately: true,
      });
      console.log('✅ Successfully updated dev settings when stopped again');
    } catch (error) {
      console.log('❌ Failed to update dev settings when stopped again:', error.message);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;