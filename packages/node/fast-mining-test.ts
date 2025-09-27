#!/usr/bin/env node

/**
 * Fast Mining EVM Test
 * Test EVM deployment with faster mining interval
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
  console.log('🧪 Fast Mining EVM Test\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12537,
    jsonrpcHttpEthPort: 8545,
    jsonrpcWsPort: 12535,
    log: false,
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Set faster mining interval: 500ms instead of 2000ms
    console.log('⚡ Setting mining interval to 500ms...');
    await devkit.setMiningInterval(500);
    console.log('✅ Mining interval updated\n');

    // Wait for a few blocks to be mined
    await new Promise(resolve => setTimeout(resolve, 2000));

    const account0 = devkit.account(0);
    console.log('Account 0 EVM address:', account0.address.evm);

    const evmWallet = account0.evm;
    const startBlock = await evmWallet.getBlockNumber();
    console.log('Starting block number:', startBlock.toString());

    console.log('\n🚀 Deploying contract with fast mining...');
    const deployStart = Date.now();

    try {
      const contractAddress = await evmWallet.deployContract(
        SIMPLE_ABI,
        SIMPLE_BYTECODE,
        [42n]
      );

      const deployTime = Date.now() - deployStart;
      console.log(`✅ Deployment successful in ${deployTime}ms`);
      console.log('Contract address:', contractAddress);

      // Test contract call
      console.log('\n🧪 Testing contract call...');
      const value = await evmWallet.callContract(
        contractAddress,
        SIMPLE_ABI,
        'getValue'
      );
      console.log('Contract getValue() result:', value);

      const endBlock = await evmWallet.getBlockNumber();
      console.log('Final block number:', endBlock.toString());
      console.log('Blocks mined during deployment:', (endBlock - startBlock).toString());

    } catch (error) {
      const deployTime = Date.now() - deployStart;
      console.error(`❌ Deployment failed after ${deployTime}ms`);
      console.error('Error:', error);
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