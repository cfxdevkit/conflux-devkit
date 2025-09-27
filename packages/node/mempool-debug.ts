#!/usr/bin/env node

/**
 * EVM Mempool Debug Test
 * Check if transactions are reaching the mempool
 */

import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 EVM Mempool Debug Test\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12537,
    jsonrpcHttpEthPort: 8545,
    jsonrpcWsPort: 12535,
    log: true, // Enable logging
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    const account0 = devkit.account(0);
    const evmWallet = account0.evm;

    console.log('🔗 Network Information:');
    console.log('  EVM Address:', account0.address.evm);
    console.log('  Chain ID:', evmWallet.chainId);

    const balance = await evmWallet.getBalance(account0.address.evm);
    console.log('  Balance:', balance, 'CFX');

    // Test basic connectivity
    const blockNumber = await evmWallet.getBlockNumber();
    console.log('  Block Number:', blockNumber.toString());

    const gasPrice = await evmWallet.getGasPrice();
    console.log('  Gas Price:', gasPrice.toString());

    // Try to submit a simple value transfer transaction
    console.log('\n💸 Testing simple transfer transaction...');

    try {
      // Create a simple transfer transaction
      const transferHash = await evmWallet.sendTransaction({
        to: '0x1000000000000000000000000000000000000001', // dummy address
        value: 1000000000000000n, // 0.001 CFX
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });

      console.log('✅ Transfer transaction submitted!');
      console.log('Transaction hash:', transferHash);

      // Check pending transactions using RPC calls
      console.log('\n🔍 Checking pending transactions...');

      try {
        // Try to get pending transactions via eth_pendingTransactions
        const publicClient = evmWallet.publicClient;

        // Check transaction status
        console.log('Checking transaction details...');
        const tx = await publicClient.getTransaction({ hash: transferHash });
        console.log('Transaction found in mempool:', {
          from: tx.from,
          to: tx.to,
          value: tx.value?.toString(),
          gas: tx.gas?.toString(),
          gasPrice: tx.gasPrice?.toString(),
        });

        // Try mining a few blocks to see if it gets included
        console.log('\n⛏️  Mining blocks to process transaction...');
        for (let i = 0; i < 3; i++) {
          await devkit.mine(1);
          console.log(`  Mined block ${i + 1}`);

          try {
            const receipt = await publicClient.getTransactionReceipt({ hash: transferHash });
            console.log(`✅ Transaction included in block ${i + 1}!`);
            console.log('Receipt:', {
              blockNumber: receipt.blockNumber?.toString(),
              gasUsed: receipt.gasUsed?.toString(),
              status: receipt.status,
            });
            return; // Success
          } catch (e) {
            console.log(`  Transaction not yet included...`);
          }
        }

        console.log('❌ Transfer transaction not mined after 3 blocks');

      } catch (e) {
        console.error('❌ Error checking transaction:', e);
      }

    } catch (error) {
      console.error('❌ Transfer transaction failed:', error);
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