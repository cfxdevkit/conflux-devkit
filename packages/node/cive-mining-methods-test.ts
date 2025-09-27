#!/usr/bin/env node

/**
 * Test different cive mining methods to process EVM deployments
 */

import { DevKit } from './src/index.js';

async function main() {
  console.log('🧪 Cive Mining Methods Test\n');

  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12544,
    jsonrpcHttpEthPort: 8552,
    jsonrpcWsPort: 12543,
    log: false,
  });

  try {
    console.log('📦 Starting node...');
    await devkit.start();
    console.log('✅ Node started\n');

    // Stop automatic mining
    console.log('⏹️ Stopping automatic mining...');
    await devkit.stopMining();
    console.log('✅ Automatic mining stopped\n');

    const account0 = devkit.account(0);

    // Submit EVM deployment first
    console.log('📤 Submitting EVM deployment...');
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

    // Get access to the test client that DevKit uses internally
    const serverTestClient = devkit.server['testClient'];
    if (!serverTestClient) {
      console.error('❌ No test client available');
      return;
    }

    console.log('\n⛏️ Testing different mining methods...\n');

    // Method 1: Regular mine with blocks
    console.log('1️⃣ Testing mine({ blocks: 1 })...');
    await serverTestClient.mine({ blocks: 1 });
    console.log('   Mined 1 block');

    try {
      const receipt = await evmClient.publicClient.getTransactionReceipt({
        hash: deployHash as `0x${string}`
      });
      console.log('   ✅ Deployment confirmed with mine({ blocks: 1 })!');
      console.log(`   Contract: ${receipt.contractAddress}`);
      return; // Success!
    } catch (e) {
      console.log('   ❌ Not confirmed yet');
    }

    // Method 2: Mine with transaction count
    console.log('\n2️⃣ Testing mine({ numTxs: 10, blockSizeLimit: 100000 })...');
    await serverTestClient.mine({ numTxs: 10, blockSizeLimit: 100000 });
    console.log('   Mined block with transaction focus');

    try {
      const receipt = await evmClient.publicClient.getTransactionReceipt({
        hash: deployHash as `0x${string}`
      });
      console.log('   ✅ Deployment confirmed with transaction-focused mining!');
      console.log(`   Contract: ${receipt.contractAddress}`);
      return; // Success!
    } catch (e) {
      console.log('   ❌ Not confirmed yet');
    }

    // Method 3: generateEmptyLocalNodeBlocks
    console.log('\n3️⃣ Testing generateEmptyLocalNodeBlocks({ numBlocks: 3 })...');
    const { generateEmptyLocalNodeBlocks } = await import('cive');
    await generateEmptyLocalNodeBlocks(serverTestClient, { numBlocks: 3 });
    console.log('   Generated 3 empty blocks');

    try {
      const receipt = await evmClient.publicClient.getTransactionReceipt({
        hash: deployHash as `0x${string}`
      });
      console.log('   ✅ Deployment confirmed with empty blocks!');
      console.log(`   Contract: ${receipt.contractAddress}`);
      return; // Success!
    } catch (e) {
      console.log('   ❌ Not confirmed yet');
    }

    // Method 4: generateLocalNodeBlock with specific parameters
    console.log('\n4️⃣ Testing generateLocalNodeBlock({ numTxs: 100, blockSizeLimit: 1000000 })...');
    const { generateLocalNodeBlock } = await import('cive');
    await generateLocalNodeBlock(serverTestClient, { numTxs: 100, blockSizeLimit: 1000000 });
    console.log('   Generated block with high transaction capacity');

    try {
      const receipt = await evmClient.publicClient.getTransactionReceipt({
        hash: deployHash as `0x${string}`
      });
      console.log('   ✅ Deployment confirmed with high-capacity block!');
      console.log(`   Contract: ${receipt.contractAddress}`);
      return; // Success!
    } catch (e) {
      console.log('   ❌ Not confirmed yet');
    }

    // Method 5: Multiple smaller blocks rapidly
    console.log('\n5️⃣ Testing rapid small blocks...');
    for (let i = 0; i < 5; i++) {
      await serverTestClient.mine({ blocks: 1 });
      console.log(`   Rapid block ${i + 1}`);

      try {
        const receipt = await evmClient.publicClient.getTransactionReceipt({
          hash: deployHash as `0x${string}`
        });
        console.log(`   ✅ Deployment confirmed in rapid block ${i + 1}!`);
        console.log(`   Contract: ${receipt.contractAddress}`);
        return; // Success!
      } catch (e) {
        // Continue
      }
    }
    console.log('   ❌ Not confirmed after 5 rapid blocks');

    // Method 6: Clear transaction pool and try again
    console.log('\n6️⃣ Testing clearTxpool() and mine...');
    const { clearTxpool } = await import('cive');
    await clearTxpool(serverTestClient);
    console.log('   Transaction pool cleared');

    // Re-submit the deployment
    console.log('   Re-submitting deployment...');
    const newDeployHash = await internalClient.deployContract({
      account: evmClient['account'],
      chain: evmClient['chain'],
      abi: [
        {
          inputs: [{ internalType: 'uint256', name: '_value', type: 'uint256' }],
          stateMutability: 'nonpayable',
          type: 'constructor',
        },
      ],
      bytecode: '0x608060405234801561001057600080fd5b50604051602080610152833981016040525160005561013b806100346000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063209652551461003057806050a51b0a1461004c575b600080fd5b6100386100a3565b604051901515815260200160405180910390f35b6100536100a6565b604051901515815260200160405180910390f35b60005490565b60015490565b565b600080fdfe' as `0x${string}`,
      args: [84n], // Different arg to get different hash
    });
    console.log(`   New deployment hash: ${newDeployHash}`);

    await serverTestClient.mine({ blocks: 1 });
    console.log('   Mined block after txpool clear');

    try {
      const receipt = await evmClient.publicClient.getTransactionReceipt({
        hash: newDeployHash as `0x${string}`
      });
      console.log('   ✅ Deployment confirmed after txpool clear!');
      console.log(`   Contract: ${receipt.contractAddress}`);
      return; // Success!
    } catch (e) {
      console.log('   ❌ Still not confirmed');
    }

    console.log('\n❌ None of the mining methods worked for EVM deployment');

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