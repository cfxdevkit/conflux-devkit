#!/usr/bin/env node

/**
 * Verify that mining is actually processing transactions
 */

import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 Verify mining is processing transactions\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12540, // Use different ports
    jsonrpcHttpEthPort: 8548,
    jsonrpcWsPort: 12539,
    log: false,
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Check mining status
    console.log('Mining status:', devkit.server.getMiningStatus());

    const account0 = devkit.account(0);

    // Test simple Core transfer (should be fast)
    console.log('💸 Testing Core transfer...');
    try {
      const hash = await account0.core.sendTransaction({
        to: 'net2029:aam2bpncpnsr50h32s0ugrn5swc1k6zbdy3a0y16be',
        value: 1000000000000000n, // 0.001 CFX
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });
      console.log('Core transaction hash:', hash);

      // Try to wait for confirmation
      console.log('Waiting for Core transaction...');
      const coreReceipt = await account0.core.waitForTransaction(hash);
      console.log('✅ Core transaction confirmed!');
      console.log('Core receipt status:', coreReceipt.status);
    } catch (error) {
      console.error('❌ Core transfer failed:', error);
    }

    // Test simple EVM transfer (should also be fast)
    console.log('\n💸 Testing EVM transfer...');
    try {
      const hash = await account0.evm.sendTransaction({
        to: '0x1000000000000000000000000000000000000001',
        value: 1000000000000000n, // 0.001 CFX
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });
      console.log('EVM transaction hash:', hash);

      // Try to wait for confirmation
      console.log('Waiting for EVM transaction...');
      const evmReceipt = await account0.evm.waitForTransaction(hash);
      console.log('✅ EVM transaction confirmed!');
      console.log('EVM receipt status:', evmReceipt.status);
    } catch (error) {
      console.error('❌ EVM transfer failed:', error);
    }

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