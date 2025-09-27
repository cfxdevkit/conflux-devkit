#!/usr/bin/env node

/**
 * Test DevKit mining with generateEmptyLocalNodeBlocks fix
 */

import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 DevKit Mining Fix Test\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12540,
    jsonrpcHttpEthPort: 8548,
    jsonrpcWsPort: 12539,
    log: false,
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Let automatic mining run briefly to initialize testClient
    console.log('⏳ Letting automatic mining run briefly...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stop automatic mining
    console.log('⏹️ Stopping automatic mining...');
    await devkit.stopMining();
    console.log('✅ Automatic mining stopped\n');

    const account0 = devkit.account(0);

    // Submit EVM deployment WITHOUT waiting for it
    console.log('📤 Submitting EVM deployment (no wait)...');
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
    console.log(`EVM deployment hash: ${deployHash}`);

    // Now mine 3 blocks using DevKit's mine method (which now uses generateEmptyLocalNodeBlocks)
    console.log('\n⛏️ Mining 3 blocks using DevKit.mine()...');
    await devkit.mine(3);

    // Check if deployment is confirmed
    try {
      const receipt = await evmClient.publicClient.getTransactionReceipt({
        hash: deployHash as `0x${string}`
      });
      console.log('✅ EVM deployment confirmed with DevKit mining!');
      console.log(`   Contract: ${receipt.contractAddress}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   Block: ${receipt.blockNumber}`);
    } catch (e) {
      console.log('❌ Deployment not confirmed');
      console.log('Trying more blocks...');

      // Try 5 more blocks
      await devkit.mine(5);

      try {
        const receipt = await evmClient.publicClient.getTransactionReceipt({
          hash: deployHash as `0x${string}`
        });
        console.log('✅ EVM deployment confirmed after additional mining!');
        console.log(`   Contract: ${receipt.contractAddress}`);
      } catch (e2) {
        console.log('❌ Still not confirmed after 8 total blocks');
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