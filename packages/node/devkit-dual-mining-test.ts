#!/usr/bin/env node

/**
 * Test DevKit's internal mining for both chains
 * Use the same mining client that DevKit uses internally
 */

import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 DevKit Dual Mining Test\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12543,
    jsonrpcHttpEthPort: 8551,
    jsonrpcWsPort: 12542,
    log: false,
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Stop automatic mining to test manual
    console.log('⏹️ Stopping automatic mining...');
    await devkit.stopMining();
    console.log('✅ Automatic mining stopped\n');

    const account0 = devkit.account(0);

    // Submit EVM transaction first
    console.log('📤 Submitting EVM transaction...');
    const evmHash = await account0.evm.sendTransaction({
      to: '0x1000000000000000000000000000000000000001',
      value: 1000000000000000n,
      gasLimit: 21000n,
      gasPrice: 1000000000n,
    });
    console.log(`EVM transaction hash: ${evmHash}`);

    // Submit Core transaction for comparison
    console.log('📤 Submitting Core transaction...');
    const coreHash = await account0.core.sendTransaction({
      to: 'net2029:aam2bpncpnsr50h32s0ugrn5swc1k6zbdy3a0y16be',
      value: 1000000000000000n,
      gasLimit: 21000n,
      gasPrice: 1000000000n,
    });
    console.log(`Core transaction hash: ${coreHash}`);

    // Now mine blocks using DevKit's own mine method
    console.log('\n⛏️ Mining blocks using DevKit.mine()...');

    for (let i = 1; i <= 10; i++) {
      console.log(`Mining block ${i}...`);
      await devkit.mine(1);

      // Check Core transaction
      try {
        const coreReceipt = await account0.core.publicClient.getTransactionReceipt({
          hash: coreHash as `0x${string}`
        });
        console.log(`✅ Core transaction confirmed in block ${i}!`);
      } catch (e) {
        console.log(`  Core transaction not yet included...`);
      }

      // Check EVM transaction
      try {
        const evmReceipt = await account0.evm.publicClient.getTransactionReceipt({
          hash: evmHash as `0x${string}`
        });
        console.log(`✅ EVM transaction confirmed in block ${i}!`);
        console.log(`  Status: ${evmReceipt.status}`);
        console.log(`  Block: ${evmReceipt.blockNumber}`);
        break;
      } catch (e) {
        console.log(`  EVM transaction not yet included...`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test deployment with manual mining
    console.log('\n🔗 Testing EVM deployment with DevKit mining...');

    // Submit deployment without waiting
    console.log('📤 Submitting EVM deployment...');
    const evmClient = account0.evm;
    const internalClient = evmClient.getInternalClient() as any;

    let deployHash: string;
    try {
      deployHash = await internalClient.deployContract({
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
      console.log(`EVM deployment hash: ${deployHash}`);
    } catch (error) {
      console.error('❌ Failed to submit deployment:', error);
      return;
    }

    // Mine blocks until deployment is confirmed
    console.log('⛏️ Mining blocks for deployment...');
    for (let i = 1; i <= 10; i++) {
      console.log(`Mining block ${i} for deployment...`);
      await devkit.mine(1);

      try {
        const receipt = await evmClient.publicClient.getTransactionReceipt({
          hash: deployHash as `0x${string}`
        });
        console.log(`✅ EVM deployment confirmed in block ${i}!`);
        console.log(`  Contract: ${receipt.contractAddress}`);
        console.log(`  Status: ${receipt.status}`);
        break;
      } catch (e) {
        console.log(`  Deployment not yet included...`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Try rapid mining to see if that helps
    console.log('\n🚀 Trying rapid mining (5 blocks quickly)...');
    await devkit.mine(5);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const receipt = await evmClient.publicClient.getTransactionReceipt({
        hash: deployHash as `0x${string}`
      });
      console.log(`✅ EVM deployment confirmed with rapid mining!`);
      console.log(`  Contract: ${receipt.contractAddress}`);
    } catch (e) {
      console.log(`❌ EVM deployment still not confirmed after rapid mining`);
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