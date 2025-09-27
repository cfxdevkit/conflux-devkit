#!/usr/bin/env node

/**
 * Debug mining status and deployment
 */

import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 Debug mining status\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12539, // Use different ports
    jsonrpcHttpEthPort: 8547,
    jsonrpcWsPort: 12538,
    log: false,
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Check initial mining status
    console.log('Initial mining status:', devkit.server.getMiningStatus());

    // Stop mining manually
    console.log('\n⏹️ Stopping mining...');
    await devkit.stopMining();
    console.log('Mining status after stop:', devkit.server.getMiningStatus());

    // Start mining manually
    console.log('\n▶️ Starting mining with 500ms interval...');
    await devkit.startMining(500);
    console.log('Mining status after start:', devkit.server.getMiningStatus());

    // Wait a bit and check again
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Mining status after 2 seconds:', devkit.server.getMiningStatus());

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🧹 Stopping node...');
    await devkit.stop();
    console.log('✅ Done');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;