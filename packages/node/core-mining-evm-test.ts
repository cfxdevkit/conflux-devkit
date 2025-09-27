#!/usr/bin/env node

/**
 * Test if Core mining processes EVM transactions
 * Theory: EVM transactions should be included when Core blocks are mined
 */

import { createTestClient, http } from 'cive';
import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 Core Mining → EVM Test\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12542,
    jsonrpcHttpEthPort: 8550,
    jsonrpcWsPort: 12541,
    log: false,
  });

  let miningInterval: NodeJS.Timeout | null = null;

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Stop automatic mining
    console.log('⏹️ Stopping automatic mining...');
    await devkit.stopMining();
    console.log('✅ Automatic mining stopped\n');

    // Create Core test client only
    console.log('🔧 Creating Core test client...');
    const coreTestClient = createTestClient({
      transport: http('http://localhost:12542'),
    });
    console.log('✅ Core test client created\n');

    const account0 = devkit.account(0);

    // Submit an EVM transaction first (don't wait)
    console.log('📤 Submitting EVM transaction...');
    const evmHash = await account0.evm.sendTransaction({
      to: '0x1000000000000000000000000000000000000001',
      value: 1000000000000000n,
      gasLimit: 21000n,
      gasPrice: 1000000000n,
    });
    console.log(`EVM transaction submitted: ${evmHash}`);

    // Now manually mine Core blocks and see if EVM transaction gets included
    console.log('\n⛏️ Mining Core blocks to see if EVM transaction gets processed...');

    for (let i = 1; i <= 10; i++) {
      console.log(`Mining Core block ${i}...`);
      await coreTestClient.mine({ blocks: 1 });

      // Check if EVM transaction is confirmed
      try {
        const receipt = await account0.evm.publicClient.getTransactionReceipt({
          hash: evmHash as `0x${string}`
        });
        console.log(`✅ EVM transaction confirmed in Core block ${i}!`);
        console.log(`  Status: ${receipt.status}`);
        console.log(`  Block: ${receipt.blockNumber}`);
        console.log(`  Gas used: ${receipt.gasUsed}`);
        break;
      } catch (error) {
        console.log(`  EVM transaction not yet included...`);
      }

      // Wait a bit between blocks
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test EVM deployment with Core mining
    console.log('\n🔗 Testing EVM deployment with Core mining...');

    // Submit deployment (get hash but don't wait)
    console.log('📤 Submitting EVM deployment...');
    const deploymentStart = Date.now();

    try {
      // Get the internal client to submit without waiting
      const evmClient = account0.evm;
      const internalClient = evmClient.getInternalClient() as any;

      const deployHash = await internalClient.deployContract({
        account: evmClient['account'],
        chain: evmClient['chain'],
        abi: [
          {
            inputs: [{ internalType: 'uint256', name: '_value', type: 'uint256' }],
            stateMutability: 'nonpayable',
            type: 'constructor',
          },
        ],
        bytecode: '0x608060405234801561001057600080fd5b50604051602080610152833981016040525160005561013b806100346000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063209652551461003057806350a51b0a1461004c575b600080fd5b6100386100a3565b604051901515815260200160405180910390f35b6100536100a6565b604051901515815260200160405180910390f35b60005490565b60015490565b565b600080fdfe' as `0x${string}`,
        args: [42n],
      });

      console.log(`EVM deployment submitted: ${deployHash}`);

      // Mine Core blocks until deployment is confirmed
      for (let i = 1; i <= 10; i++) {
        console.log(`Mining Core block ${i} for deployment...`);
        await coreTestClient.mine({ blocks: 1 });

        try {
          const receipt = await evmClient.publicClient.getTransactionReceipt({
            hash: deployHash
          });
          const deployTime = Date.now() - deploymentStart;
          console.log(`✅ EVM deployment confirmed in ${deployTime}ms!`);
          console.log(`  Contract: ${receipt.contractAddress}`);
          console.log(`  Status: ${receipt.status}`);
          console.log(`  Block: ${receipt.blockNumber}`);
          break;
        } catch (error) {
          console.log(`  Deployment not yet included...`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error('❌ Failed to submit EVM deployment:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (miningInterval) {
      clearInterval(miningInterval);
    }
    console.log('\n🧹 Stopping node...');
    await devkit.stop();
    console.log('✅ Done');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;