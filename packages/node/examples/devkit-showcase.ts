#!/usr/bin/env node

/**
 * DevKit API Complete Showcase
 *
 * This comprehensive example demonstrates all DevKit functionality:
 * 1. Node lifecycle management (start/stop)
 * 2. Account management and balance queries
 * 3. Mining system with status monitoring
 * 4. Faucet system for account funding
 * 5. Contract deployment on both chains
 * 6. Contract interaction (read/write operations)
 * 7. Cross-chain development workflow
 * 8. Error handling and cleanup
 */

import { DevKit } from '../src/index.js';

// Simple storage contract for testing
const SIMPLE_STORAGE_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'initialValue', type: 'uint256' },
    ],
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
  {
    inputs: [{ internalType: 'uint256', name: 'newValue', type: 'uint256' }],
    name: 'setValue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getName',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'increment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const SIMPLE_STORAGE_BYTECODE =
  '0x608060405234801561001057600080fd5b5060405161081138038061081183398101604081905261002f9161005b565b600161003b83826101b5565b5060005550610274565b634e487b7160e01b600052604160045260246000fd5b6000806040838503121561006e57600080fd5b82516001600160401b038082111561008557600080fd5b818501915085601f83011261009957600080fd5b8151818111156100ab576100ab610045565b604051601f8201601f19908116603f011681019083821181831017156100d3576100d3610045565b816040528281526020935088848487010111156100ef57600080fd5b600091505b8282101561011157848201840151818301850152908301906100f4565b6000928101840192909252509401519395939450505050565b600181811c9082168061013e57607f821691505b60208210810361015e57634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156101b0576000816000526020600020601f850160051c8101602086101561018d5750805b601f850160051c820191505b818110156101ac57828155600101610199565b5050505b505050565b81516001600160401b038111156101ce576101ce610045565b6101e2816101dc845461012a565b84610164565b602080601f83116001811461021757600084156101ff5750858301515b600019600386901b1c1916600185901b1785556101ac565b600085815260208120601f198616915b8281101561024657888601518255948401946001909101908401610227565b50858210156102645787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b61058e806102836000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c806317d7de7c1461006757806320965255146100855780632baeceb71461009657806355241077146100a0578063c47f0027146100b3578063d09de08a146100c6575b600080fd5b61006f6100ce565b60405161007c919061029c565b60405180910390f35b60005460405190815260200161007c565b61009e610160565b005b61009e6100ae3660046102eb565b610206565b61009e6100c136600461031a565b610244565b61009e61028a565b6060600180546100dd906103cb565b80601f0160208091040260200160405190810160405280929190318152602001828054610109906103cb565b80156101565780601f1061012b57610100808354040283529160200191610156565b820191906000526020600020905b81548152906001019060200180831161013957829003601f168201915b5050505050905090565b60008054116101b55760405162461bcd60e51b815260206004820152601860248201527f56616c75652063616e6e6f74206265206e656761746976650000000000000000604482015260640160405180910390fd5b60016000808282546101c7919061041b565b909155505060005460405190815233907fc53a6612a7428e1fc89cb87169d69d64eaefe94f5b45d43f80f1ad9d7065d2c89060200160405180910390a2565b600081905560405181815233907fc53a6612a7428e1fc89cb87169d69d64eaefe94f5b45d43f80f1ad9d7065d2c8906020015b60405180910390a250565b60016102508282610485565b50336001600160a01b03167f1e3652b21ef1bd2c76130610ad0be2b8ab01fbea80964c84c54473bf090dc8a482604051610239919061029c565b60016000808282546101c79190610545565b60006020808352835180602085015260005b818110156102ca578581018301518582016040015282016102ae565b506000604082860101526040601f19601f8301168501019250505092915050565b6000602082840312156102fd57600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b60006020828403121561032c57600080fd5b813567ffffffffffffffff8082111561034457600080fd5b818401915084601f83011261035857600080fd5b81358181111561036a5761036a610304565b604051601f8201601f19908116603f0116810190838211818310171561039257610392610304565b816040528281528760208487010111156103ab57600080fd5b826020860160208301376000928101602001929092525095945050505050565b600181811c908216806103df57607f821691505b6020821081036103ff57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8181038181111561042e5761042e610405565b92915050565b601f821115610480576000816000526020600020601f850160051c8101602086101561045d5750805b601f850160051c820191505b8181101561047c57828155600101610469565b5050505b505050565b815167ffffffffffffffff81111561049f5761049f610304565b6104b3816104ad84546103cb565b84610434565b602080601f8311600181146104e857600084156104d05750858301515b600019600386901b1c1916600185901b17855561047c565b600085815260208120601f198616915b82811015610517578886015182559484019460019091019084016104f8565b50858210156105355787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b8082018082111561042e5761042e61040556fea2646970667358221220e76a1d0387570e7ecb1490c3202309a750d4f14927c3bdc60d8395e314c99cc764736f6c63430008180033';

async function main() {
  console.log('🎯 DevKit API Complete Showcase\n');
  console.log('This example demonstrates all DevKit functionality:\n');

  // Create DevKit instance
  const devkit = new DevKit({
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12537,
    jsonrpcHttpEthPort: 8545,
    jsonrpcWsPort: 12535,
    log: false,
  });

  try {
    // ===== SECTION 1: Node Lifecycle Management =====
    console.log('🔧 SECTION 1: Node Lifecycle Management');
    console.log('=====================================\n');

    console.log('📦 Starting DevKit node...');
    await devkit.start();
    console.log('✅ Node started successfully\n');

    // Show node information
    const rpcUrls = devkit.getRpcUrls();
    console.log('🔍 Node Information:');
    console.log(`  Core RPC: ${rpcUrls.core}`);
    console.log(`  eSpace RPC: ${rpcUrls.evm}`);
    console.log(`  WebSocket: ${rpcUrls.ws}\n`);

    // ===== SECTION 2: Account Management =====
    console.log('👥 SECTION 2: Account Management');
    console.log('===============================\n');

    // Access accounts easily
    const account0 = devkit.account(0);
    const account1 = devkit.account(1);
    const account2 = devkit.account(2);

    console.log('📋 Account Information:');
    console.log(`  Account 0 Core: ${account0.address.core}`);
    console.log(`  Account 0 eSpace: ${account0.address.evm}`);
    console.log(`  Account 1 Core: ${account1.address.core}`);
    console.log(`  Account 1 eSpace: ${account1.address.evm}\n`);

    // Check initial balances
    const balances0 = await account0.getBalances();
    const balances1 = await account1.getBalances();

    console.log('💰 Initial Account Balances:');
    console.log(
      `  Account 0 - Core: ${balances0.core} CFX, eSpace: ${balances0.evm} CFX`
    );
    console.log(
      `  Account 1 - Core: ${balances1.core} CFX, eSpace: ${balances1.evm} CFX\n`
    );

    // ===== SECTION 3: Mining System =====
    console.log('⛏️  SECTION 3: Mining System');
    console.log('===========================\n');

    // Check mining status (DevKit starts mining automatically)
    console.log('🔥 Checking mining status...');
    const initialMiningStatus = await devkit.getMiningStatus();
    if (initialMiningStatus.isRunning) {
      console.log('✅ Mining is already running automatically');
    } else {
      console.log('🔥 Starting mining...');
      await devkit.startMining();
      console.log('✅ Mining started');
    }
    console.log('');

    // Check mining status
    let miningStatus = await devkit.getMiningStatus();
    console.log('📊 Mining Status:');
    console.log(`  Running: ${miningStatus.isRunning}`);
    console.log(`  Interval: ${miningStatus.interval}ms`);
    console.log(`  Blocks mined: ${miningStatus.blocksMined}`);
    console.log(`  Start time: ${miningStatus.startTime?.toLocaleString()}\n`);

    // Wait for some blocks to be mined
    console.log('⏳ Waiting 5 seconds for mining...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check updated mining status
    miningStatus = await devkit.getMiningStatus();
    console.log(
      `📈 Blocks mined after 5 seconds: ${miningStatus.blocksMined}\n`
    );

    // ===== SECTION 4: Faucet System =====
    console.log('💧 SECTION 4: Faucet System');
    console.log('==========================\n');

    // Check faucet balances
    const faucetBalances = await devkit.getFaucetBalances();
    console.log('🏦 Faucet Balances:');
    console.log(`  Core: ${faucetBalances.coreBalance} CFX`);
    console.log(`  eSpace: ${faucetBalances.evmBalance} CFX\n`);

    // Fund accounts using faucet
    console.log('💰 Funding accounts from faucet...');

    const coreHash1 = await devkit.fundAccount(
      account1.address.core,
      '50',
      'core'
    );
    const evmHash1 = await devkit.fundAccount(
      account1.address.evm,
      '25',
      'evm'
    );

    console.log(`  Account 1 Core funding TX: ${coreHash1}`);
    console.log(`  Account 1 eSpace funding TX: ${evmHash1}\n`);

    // Fund account 2 as well
    const coreHash2 = await devkit.fundAccount(
      account2.address.core,
      '30',
      'core'
    );
    const evmHash2 = await devkit.fundAccount(
      account2.address.evm,
      '15',
      'evm'
    );

    console.log(`  Account 2 Core funding TX: ${coreHash2}`);
    console.log(`  Account 2 eSpace funding TX: ${evmHash2}\n`);

    // Check updated balances
    const updatedBalances1 = await account1.getBalances();
    const updatedBalances2 = await account2.getBalances();

    console.log('💸 Updated Account Balances After Funding:');
    console.log(
      `  Account 1 - Core: ${updatedBalances1.core} CFX, eSpace: ${updatedBalances1.evm} CFX`
    );
    console.log(
      `  Account 2 - Core: ${updatedBalances2.core} CFX, eSpace: ${updatedBalances2.evm} CFX\n`
    );

    // ===== SECTION 5: Contract Deployment =====
    console.log('🚀 SECTION 5: Contract Deployment');
    console.log('=================================\n');

    // Deploy SimpleStorage contract to Core Space
    console.log('📝 Deploying SimpleStorage contract to Core Space...');
    const coreContractResult = await devkit.deployContract({
      abi: SIMPLE_STORAGE_ABI,
      bytecode: SIMPLE_STORAGE_BYTECODE,
      args: ['CoreContract', 42n], // name, initial value
      chain: 'core',
      account: 0,
    });
    console.log(
      `✅ Core Space contract deployed at: ${coreContractResult.core}\n`
    );

    // Deploy SimpleStorage contract to eSpace
    console.log('📝 Deploying SimpleStorage contract to eSpace...');
    const evmContractResult = await devkit.deployContract({
      abi: SIMPLE_STORAGE_ABI,
      bytecode: SIMPLE_STORAGE_BYTECODE,
      args: ['eSpaceContract', 100n], // name, different initial value
      chain: 'evm',
      account: 0,
    });
    console.log(`✅ eSpace contract deployed at: ${evmContractResult.evm}\n`);

    // ===== SECTION 6: Contract Interaction =====
    console.log('🎮 SECTION 6: Contract Interaction');
    console.log('=================================\n');

    // Read initial values
    console.log('📖 Reading initial contract values...');

    const coreInitialValue = await devkit.readContract({
      address: coreContractResult.core || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'getValue',
      chain: 'core',
    });

    const evmInitialValue = await devkit.readContract({
      address: evmContractResult.evm || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'getValue',
      chain: 'evm',
    });

    console.log(`  Core Space storage: ${coreInitialValue}`);
    console.log(`  eSpace storage: ${evmInitialValue}\n`);

    // Write operations - increment values
    console.log('✏️  Incrementing storage values...');

    const coreIncrementTx = await devkit.writeContract({
      address: coreContractResult.core || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'increment',
      args: [],
      chain: 'core',
      account: 1, // Use account 1
    });

    const evmIncrementTx = await devkit.writeContract({
      address: evmContractResult.evm || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'increment',
      args: [],
      chain: 'evm',
      account: 1, // Use account 1
    });

    console.log(`  Core increment TX: ${coreIncrementTx}`);
    console.log(`  eSpace increment TX: ${evmIncrementTx}\n`);

    // Read updated values
    console.log('📖 Reading updated contract values...');

    const coreUpdatedValue = await devkit.readContract({
      address: coreContractResult.core || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'getValue',
      chain: 'core',
    });

    const evmUpdatedValue = await devkit.readContract({
      address: evmContractResult.evm || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'getValue',
      chain: 'evm',
    });

    console.log(
      `  Core Space storage: ${coreUpdatedValue} (was ${coreInitialValue})`
    );
    console.log(
      `  eSpace storage: ${evmUpdatedValue} (was ${evmInitialValue})\n`
    );

    // Set custom values
    console.log('🎯 Setting custom storage values...');

    const coreSetTx = await devkit.writeContract({
      address: coreContractResult.core || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'setValue',
      args: [999n],
      chain: 'core',
      account: 2, // Use account 2
    });

    const evmSetTx = await devkit.writeContract({
      address: evmContractResult.evm || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'setValue',
      args: [777n],
      chain: 'evm',
      account: 2, // Use account 2
    });

    console.log(`  Core set TX: ${coreSetTx}`);
    console.log(`  eSpace set TX: ${evmSetTx}\n`);

    // Final values
    const coreFinalValue = await devkit.readContract({
      address: coreContractResult.core || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'getValue',
      chain: 'core',
    });

    const evmFinalValue = await devkit.readContract({
      address: evmContractResult.evm || '',
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'getValue',
      chain: 'evm',
    });

    console.log('🏁 Final contract values:');
    console.log(`  Core Space storage: ${coreFinalValue}`);
    console.log(`  eSpace storage: ${evmFinalValue}\n`);

    // ===== SECTION 7: Cross-Chain Summary =====
    console.log('🌉 SECTION 7: Cross-Chain Summary');
    console.log('=================================\n');

    console.log('📊 DevKit Showcase Summary:');
    console.log(
      `  • Node: Running on ports ${rpcUrls.core.split(':')[2]} (Core) and ${rpcUrls.evm.split(':')[2]} (eSpace)`
    );
    console.log(`  • Mining: ${miningStatus.blocksMined} blocks mined`);
    console.log(`  • Accounts: 3 accounts managed, 2 funded from faucet`);
    console.log(
      `  • Contracts: 2 deployed (Core: ${coreContractResult.core}, eSpace: ${evmContractResult.evm})`
    );
    console.log(
      `  • Transactions: Multiple read/write operations across both chains`
    );
    console.log(
      `  • Final Values: Core=${coreFinalValue}, eSpace=${evmFinalValue}\n`
    );

    console.log('🎉 DevKit API Showcase completed successfully!\n');

    console.log('💡 DevKit Features Demonstrated:');
    console.log('  ✅ Simple node lifecycle management');
    console.log('  ✅ Easy account access with devkit.account(index)');
    console.log('  ✅ Automatic mining with configurable intervals');
    console.log('  ✅ Built-in faucet system for account funding');
    console.log('  ✅ Unified contract deployment across chains');
    console.log('  ✅ Chain-agnostic contract interaction');
    console.log('  ✅ Cross-chain development workflow');
    console.log('  ✅ Comprehensive balance management');
    console.log('  ✅ Error handling and cleanup\n');
  } catch (error) {
    console.error('❌ Error in DevKit showcase:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    // Cleanup
    console.log('🧹 Stopping DevKit node...');
    await devkit.stop();
    console.log('✅ DevKit stopped cleanly');
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received terminate signal, shutting down...');
  process.exit(0);
});

// Run the showcase
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;
