#!/usr/bin/env node

/**
 * Manual Mining EVM Test
 * Test EVM deployment with manual block mining
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
  '0x608060405234801561001057600080fd5b50604051602080610152833981016040525160005561013b806100346000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063209652551461003030756100a3565b60005490565b565b600080fdfe';

async function main() {
  console.log('🧪 Manual Mining EVM Test\n');

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

    // Stop automatic mining
    console.log('⏹️  Stopping automatic mining...');
    await devkit.stopMining();
    console.log('✅ Automatic mining stopped\n');

    const account0 = devkit.account(0);
    console.log('Account 0 EVM address:', account0.address.evm);

    const evmWallet = account0.evm;

    // Mine a few blocks manually first
    console.log('⛏️  Mining 3 blocks manually...');
    await devkit.mine(3);

    const startBlock = await evmWallet.getBlockNumber();
    console.log('Starting block number:', startBlock.toString());

    console.log('\n🚀 Submitting deployment transaction...');

    try {
      // Submit transaction without waiting (to get hash)
      const internalClient = evmWallet.getInternalClient();

      const hash = await internalClient.deployContract({
        account: evmWallet['account'],
        chain: evmWallet['chain'],
        abi: SIMPLE_ABI,
        bytecode: SIMPLE_BYTECODE as `0x${string}`,
        args: [42n],
      });

      console.log('✅ Transaction submitted!');
      console.log('Transaction hash:', hash);

      // Now mine blocks to include the transaction
      console.log('\n⛏️  Mining blocks to process transaction...');
      for (let i = 0; i < 5; i++) {
        await devkit.mine(1);
        console.log(`  Mined block ${i + 1}`);

        // Check if transaction is included
        try {
          const receipt = await evmWallet.publicClient.getTransactionReceipt({ hash });
          console.log(`✅ Transaction mined in block ${i + 1}!`);
          console.log('Contract address:', receipt.contractAddress);
          console.log('Gas used:', receipt.gasUsed?.toString());
          console.log('Status:', receipt.status);

          // Test contract call
          console.log('\n🧪 Testing contract call...');
          const value = await evmWallet.callContract(
            receipt.contractAddress!,
            SIMPLE_ABI,
            'getValue'
          );
          console.log('Contract getValue() result:', value);

          return; // Success, exit early
        } catch (e) {
          // Transaction not yet mined, continue
          console.log(`  Transaction not yet included...`);
        }
      }

      console.log('❌ Transaction not mined after 5 blocks');

    } catch (error) {
      console.error('❌ Deployment submission failed:', error);
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