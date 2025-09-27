#!/usr/bin/env node

/**
 * External Mining Test
 * Test manual mining on both Core and EVM chains without changing the workspace
 */

import { createTestClient, http } from 'cive';
import { createTestClient as createEvmTestClient, http as evmHttp } from 'viem';
import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 External Mining Test - Manual mining for both chains\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12541, // Use different ports to avoid conflicts
    jsonrpcHttpEthPort: 8549,
    jsonrpcWsPort: 12540,
    log: false,
  });

  let miningInterval: NodeJS.Timeout | null = null;

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Stop the automatic mining to test manual mining
    console.log('⏹️ Stopping automatic mining...');
    await devkit.stopMining();
    console.log('✅ Automatic mining stopped\n');

    // Create test clients for both chains
    console.log('🔧 Creating test clients...');
    const coreTestClient = createTestClient({
      transport: http('http://localhost:12541'), // Core RPC
    });

    const evmTestClient = createEvmTestClient({
      mode: 'anvil', // or 'hardhat'
      transport: evmHttp('http://localhost:8549'), // EVM RPC
    });
    console.log('✅ Test clients created\n');

    // Start manual mining for both chains
    console.log('⛏️ Starting manual mining for both chains...');
    let blockCount = 0;

    miningInterval = setInterval(async () => {
      blockCount++;
      try {
        // Mine Core blocks
        await coreTestClient.mine({ blocks: 1 });
        console.log(`📦 Core block ${blockCount} mined`);

        // Try to mine EVM blocks
        try {
          await evmTestClient.mine({ blocks: 1 });
          console.log(`🔷 EVM block ${blockCount} mined`);
        } catch (evmError) {
          console.log(`⚠️ EVM mining failed:`, (evmError as Error).message);
        }
      } catch (error) {
        console.error(`❌ Mining error:`, error);
      }
    }, 1000); // Mine every 1 second

    console.log('✅ Manual mining started\n');

    // Wait a bit for mining to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    const account0 = devkit.account(0);

    // Test Core deployment
    console.log('🔗 Testing Core deployment with manual mining...');
    try {
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
        bytecode: '0x608060405234801561001057600080fd5b50604051602080610152833981016040525160005561013b806100346000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063209652551461003057806350a51b0a1461004c575b600080fd5b6100386100a3565b604051901515815260200160405180910390f35b6100536100a6565b604051901515815260200160405180910390f35b60005490565b60015490565b565b600080fdfe',
        args: [42n],
        chain: 'core',
        account: 0,
      });
      const coreTime = Date.now() - coreStart;
      console.log(`✅ Core deployment successful in ${coreTime}ms: ${coreResult.core}\n`);
    } catch (error) {
      console.error('❌ Core deployment failed:', error);
    }

    // Test EVM deployment
    console.log('🔗 Testing EVM deployment with manual mining...');
    try {
      const evmStart = Date.now();
      const evmResult = await devkit.deployContract({
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
        args: [84n],
        chain: 'evm',
        account: 0,
      });
      const evmTime = Date.now() - evmStart;
      console.log(`✅ EVM deployment successful in ${evmTime}ms: ${evmResult.evm}\n`);
    } catch (error) {
      console.error('❌ EVM deployment failed:', error);
    }

    // Test simple transactions
    console.log('💸 Testing simple transfers with manual mining...');
    try {
      const coreHash = await account0.core.sendTransaction({
        to: 'net2029:aam2bpncpnsr50h32s0ugrn5swc1k6zbdy3a0y16be',
        value: 1000000000000000n,
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });
      console.log(`Core transfer hash: ${coreHash}`);

      const evmHash = await account0.evm.sendTransaction({
        to: '0x1000000000000000000000000000000000000001',
        value: 1000000000000000n,
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });
      console.log(`EVM transfer hash: ${evmHash}`);

      // Wait for confirmations
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const coreReceipt = await account0.core.waitForTransaction(coreHash);
        console.log('✅ Core transfer confirmed');
      } catch (error) {
        console.log('❌ Core transfer not confirmed');
      }

      try {
        const evmReceipt = await account0.evm.waitForTransaction(evmHash);
        console.log('✅ EVM transfer confirmed');
      } catch (error) {
        console.log('❌ EVM transfer not confirmed');
      }

    } catch (error) {
      console.error('❌ Transfer test failed:', error);
    }

    // Let mining run for a bit more
    console.log('\n⏳ Letting manual mining run for 10 more seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (miningInterval) {
      clearInterval(miningInterval);
      console.log('⏹️ Manual mining stopped');
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