#!/usr/bin/env node

/**
 * Simple EVM Deployment Test
 * Test EVM deployment with minimal contract to isolate the issue
 */

import { DevKit } from './src/index.js';

// Ultra-simple contract (just stores a value)
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

// Minimal bytecode for a contract that just stores a uint256
const SIMPLE_BYTECODE =
  '0x608060405234801561001057600080fd5b50604051602080610152833981016040525160005561013b806100346000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063209652551461003057806350a51b0a1461004c575b600080fd5b6100386100a3565b604051901515815260200160405180910390f35b6100536100a6565b604051901515815260200160405180910390f35b60005490565b60015490565b565b600080fdfe';

async function main() {
  console.log('🧪 Simple EVM Deployment Test\n');

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

    // Wait a bit for mining
    await new Promise(resolve => setTimeout(resolve, 3000));

    const account0 = devkit.account(0);
    console.log('Account 0 EVM address:', account0.address.evm);
    console.log('Account 0 EVM private key:', account0.evmPrivateKey);

    // Check balance
    const balance = await account0.getBalance('evm');
    console.log('Account 0 EVM balance:', balance, 'CFX\n');

    // Create EVM wallet directly for debugging
    const evmWallet = account0.evm;
    console.log('EVM wallet address:', evmWallet.getAddress());

    // Get network info
    const rpcUrls = devkit.getRpcUrls();
    console.log('EVM RPC URL:', rpcUrls.evm);

    // Test connection
    const blockNumber = await evmWallet.getBlockNumber();
    console.log('Current block number:', blockNumber.toString());

    const gasPrice = await evmWallet.getGasPrice();
    console.log('Gas price:', gasPrice.toString(), '\n');

    console.log('🚀 Attempting deployment...');
    const deployStart = Date.now();

    try {
      // Deploy with explicit timeout
      const deploymentPromise = evmWallet.deployContract(
        SIMPLE_ABI,
        SIMPLE_BYTECODE,
        [42n]
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Deployment timeout after 20 seconds')), 20000);
      });

      const contractAddress = await Promise.race([deploymentPromise, timeoutPromise]);
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

    } catch (error) {
      const deployTime = Date.now() - deployStart;
      console.error(`❌ Deployment failed after ${deployTime}ms`);
      console.error('Error:', error);

      if (error instanceof Error) {
        console.error('Message:', error.message);
        if (error.stack) {
          console.error('Stack:', error.stack.split('\n').slice(0, 10).join('\n'));
        }
      }
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