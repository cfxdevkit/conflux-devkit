#!/usr/bin/env node

/**
 * Test UI-style deployment with automatic mining
 */

import { DevKit } from './src/index.js';

const SIMPLE_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_value', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'getValue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const SIMPLE_BYTECODE =
  '0x608060405234801561001057600080fd5b50604051602080610152833981016040525160005561013b806100346000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063209652551461003057806350a51b0a1461004c575b600080fd5b6100386100a3565b604051901515815260200160405180910390f35b6100536100a6565b604051901515815260200160405180910390f35b60005490565b60015490565b565b600080fdfe';

async function main() {
  console.log('🧪 Test UI-style deployment with automatic mining\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12538, // Use different ports to avoid conflicts
    jsonrpcHttpEthPort: 8546,
    jsonrpcWsPort: 12537,
    log: false,
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Test Core deployment
    console.log('🔗 Testing Core deployment...');
    const coreStart = Date.now();
    try {
      const coreResult = await devkit.deployContract({
        abi: SIMPLE_ABI,
        bytecode: SIMPLE_BYTECODE,
        args: [42n],
        chain: 'core',
        account: 0,
      });
      const coreTime = Date.now() - coreStart;
      console.log(`✅ Core deployment successful in ${coreTime}ms: ${coreResult.core}\n`);
    } catch (error) {
      console.error('❌ Core deployment failed:', error);
    }

    // Test eSpace deployment
    console.log('🔗 Testing eSpace deployment...');
    const evmStart = Date.now();
    try {
      const evmResult = await devkit.deployContract({
        abi: SIMPLE_ABI,
        bytecode: SIMPLE_BYTECODE,
        args: [84n],
        chain: 'evm',
        account: 0,
      });
      const evmTime = Date.now() - evmStart;
      console.log(`✅ eSpace deployment successful in ${evmTime}ms: ${evmResult.evm}\n`);
    } catch (error) {
      console.error('❌ eSpace deployment failed:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🧹 Stopping node...');
    await devkit.stop();
    console.log('✅ Done');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;