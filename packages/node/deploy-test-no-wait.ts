#!/usr/bin/env node

/**
 * EVM Deployment Test - No Wait
 * Test transaction submission without waiting for mining
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
  console.log('🧪 EVM Deployment Test - No Wait\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12537,
    jsonrpcHttpEthPort: 8545,
    jsonrpcWsPort: 12535,
    log: true, // Enable logging to see what's happening
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Wait for mining to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    const account0 = devkit.account(0);
    console.log('Account 0 EVM address:', account0.address.evm);

    const evmWallet = account0.evm;

    // Check network status
    console.log('Network status:');
    const blockNumber = await evmWallet.getBlockNumber();
    console.log('  Block number:', blockNumber.toString());
    const gasPrice = await evmWallet.getGasPrice();
    console.log('  Gas price:', gasPrice.toString());
    const balance = await evmWallet.getBalance(account0.address.evm);
    console.log('  Balance:', balance, 'CFX');
    console.log('  Chain ID:', evmWallet.chainId);

    // Try to submit deployment transaction without waiting
    console.log('\n🚀 Submitting deployment transaction...');

    try {
      // Get the internal wallet client to call deployContract directly
      const internalClient = evmWallet.getInternalClient();

      const hash = await internalClient.deployContract({
        account: evmWallet['account'], // Access private account
        chain: evmWallet['chain'], // Access private chain
        abi: SIMPLE_ABI,
        bytecode: SIMPLE_BYTECODE as `0x${string}`,
        args: [42n],
      });

      console.log('✅ Transaction submitted!');
      console.log('Transaction hash:', hash);

      // Try to get transaction details
      console.log('\n📋 Transaction details:');
      try {
        const tx = await evmWallet.publicClient.getTransaction({ hash });
        console.log('  From:', tx.from);
        console.log('  To:', tx.to || 'CONTRACT_CREATION');
        console.log('  Value:', tx.value?.toString() || '0');
        console.log('  Gas:', tx.gas?.toString());
        console.log('  Gas Price:', tx.gasPrice?.toString());
      } catch (txError) {
        console.log('  Could not fetch transaction details:', txError);
      }

      // Check if we can manually wait for a shorter time
      console.log('\n⏱️  Waiting 10 seconds for mining...');
      await new Promise(resolve => setTimeout(resolve, 10000));

      const newBlockNumber = await evmWallet.getBlockNumber();
      console.log('Block number after wait:', newBlockNumber.toString());

      if (newBlockNumber > blockNumber) {
        console.log('✅ Blocks are being mined!');
        try {
          const receipt = await evmWallet.publicClient.getTransactionReceipt({ hash });
          console.log('✅ Transaction mined!');
          console.log('Contract address:', receipt.contractAddress);
          console.log('Gas used:', receipt.gasUsed?.toString());
          console.log('Status:', receipt.status);
        } catch (receiptError) {
          console.log('❌ Transaction not yet mined:', receiptError);
        }
      } else {
        console.log('❌ No new blocks mined');
      }

    } catch (deployError) {
      console.error('❌ Deployment submission failed:', deployError);
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