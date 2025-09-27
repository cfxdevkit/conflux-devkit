#!/usr/bin/env node

/**
 * Test automatic mining with generateEmptyLocalNodeBlocks fix
 */

import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 Auto Mining Fix Test\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12539,
    jsonrpcHttpEthPort: 8547,
    jsonrpcWsPort: 12538,
    log: false,
    mining: {
      enabled: true,
      autoStart: false, // Start manually to avoid conflicts
      interval: 500, // 0.5 seconds
    }
  });

  try {
    console.log('📦 Starting node with automatic mining...');
    await devkit.start(); // Mining starts automatically by default
    console.log('✅ Node and mining started\n');

    const account0 = devkit.account(0);

    // Test EVM deployment with automatic mining
    console.log('🔗 Testing EVM deployment with automatic mining...');
    const deployStart = Date.now();

    const result = await devkit.deployContract({
      abi: [
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
      ],
      bytecode: '0x608060405234801561001057600080fd5b50604051602080610152833981016040525160005561013b806100346000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063209652551461003057806350a51b0a1461004c575b600080fd5b6100386100a3565b604051901515815260200160405180910390f35b6100536100a6565b604051901515815260200160405180910390f35b60005490565b60015490565b565b600080fdfe',
      args: [42n],
      chain: 'evm',
      account: 0,
    });

    const deployTime = Date.now() - deployStart;
    console.log(`✅ EVM deployment successful in ${deployTime}ms!`);
    console.log(`   Contract: ${result.evm}`);

    // Test Core deployment for comparison
    console.log('\n🔗 Testing Core deployment...');
    const coreStart = Date.now();

    const coreResult = await devkit.deployContract({
      abi: [
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
      ],
      bytecode: '0x608060405234801561001057600080fd5b50604051602080610152833981016040525160005561013b806100346000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063209652551461003030806050a51b0a1461004c575b600080fd5b6100386100a3565b604051901515815260200160405180910390f35b6100536100a6565b604051901515815260200160405180910390f35b60005490565b60015490565b565b600080fdfe',
      args: [84n],
      chain: 'core',
      account: 0,
    });

    const coreTime = Date.now() - coreStart;
    console.log(`✅ Core deployment successful in ${coreTime}ms!`);
    console.log(`   Contract: ${coreResult.core}`);

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