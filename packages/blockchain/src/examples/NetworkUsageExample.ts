// Example showing streamlined network configuration usage
// Demonstrates how to use the centralized 6 Conflux network states

import { networkManager } from '../network';
import { CoreClient } from '../rpc/CoreClient';
import { EvmClient } from '../rpc/EvmClient';
import { WalletManager } from '../wallet/WalletManager';

/**
 * Example: Using centralized network configuration
 */
export async function networkUsageExample() {
  console.log('🌐 Conflux Network Configuration Example');
  console.log('=====================================');

  // 1. List all available networks
  console.log('\n📋 Available Networks:');
  const allNetworks = networkManager.getAllNetworks();
  for (const network of allNetworks) {
    const info = networkManager.getNetworkDisplayInfo(network);
    console.log(
      `- ${info.id}: ${info.name} (${info.type}) - ${info.environment}`
    );
  }

  // 2. Get specific network types
  console.log('\n🔗 Core Networks:');
  const coreNetworks = networkManager.getCoreNetworks();
  coreNetworks.forEach((network) => {
    console.log(`- ${network.name}: ${network.rpcUrl}`);
  });

  console.log('\n⚡ EVM Networks:');
  const evmNetworks = networkManager.getEvmNetworks();
  evmNetworks.forEach((network) => {
    console.log(`- ${network.name}: ${network.rpcUrl}`);
  });

  // 3. Create clients using static factory methods
  console.log('\n🚀 Creating Clients:');

  // EVM Client examples
  try {
    const evmLocal = EvmClient.createLocal();
    console.log('✅ EVM Local client created');

    const _evmTestnet = EvmClient.createTestnet();
    console.log('✅ EVM Testnet client created');

    const _evmMainnet = EvmClient.createMainnet();
    console.log('✅ EVM Mainnet client created');

    // Test basic functionality
    const blockNumber = await evmLocal.getBlockNumber();
    console.log(`📦 Local block number: ${blockNumber}`);
  } catch (error) {
    console.error('❌ EVM Client error:', error);
  }

  // Core Client examples
  try {
    const coreLocal = CoreClient.createLocal();
    console.log('✅ Core Local client created');

    const _coreTestnet = CoreClient.createTestnet();
    console.log('✅ Core Testnet client created');

    const _coreMainnet = CoreClient.createMainnet();
    console.log('✅ Core Mainnet client created');

    // Test basic functionality
    const blockNumber = await coreLocal.getBlockNumber();
    console.log(`📦 Local Core block number: ${blockNumber}`);
  } catch (error) {
    console.error('❌ Core Client error:', error);
  }

  // 4. Wallet Manager examples
  console.log('\n👛 Wallet Manager:');
  try {
    const walletManager = WalletManager.createLocal();
    console.log('✅ Local wallet manager created');

    // Generate a test wallet
    const testMnemonic =
      'test test test test test test test test test test test junk';
    const network =
      networkManager.getLocalNetwork('evm') ||
      networkManager.getMainnetNetwork('evm');
    if (!network) {
      throw new Error('No EVM network available');
    }
    const wallet = await walletManager.generateWallet(testMnemonic, 0, network);
    console.log(`🔑 Generated wallet: ${wallet.address}`);
  } catch (error) {
    console.error('❌ Wallet Manager error:', error);
  }

  // 5. Network validation
  console.log('\n✅ Network Validation:');
  for (const network of allNetworks) {
    const validation = networkManager.validateNetwork(network);
    const status = validation.isValid ? '✅' : '❌';
    console.log(
      `${status} ${network.name}: ${validation.isValid ? 'Valid' : validation.errors.join(', ')}`
    );
  }

  // 6. Network lookup examples
  console.log('\n🔍 Network Lookup Examples:');

  const networkById = networkManager.getNetwork('evm-mainnet');
  if (networkById) {
    console.log(`Found by ID: ${networkById.name}`);
  }

  const networkByChainId = networkManager.getNetworkByChainId(2029);
  if (networkByChainId) {
    console.log(`Found by Chain ID 2029: ${networkByChainId.name}`);
  }

  const networkByEvmChainId = networkManager.getNetworkByEvmChainId(2030);
  if (networkByEvmChainId) {
    console.log(`Found by EVM Chain ID 2030: ${networkByEvmChainId.name}`);
  }

  const networkByName = networkManager.getNetworkByName(
    'Conflux eSpace Mainnet'
  );
  if (networkByName) {
    console.log(`Found by name: ${networkByName.name}`);
  }
}

/**
 * Example: Environment-specific client creation
 */
export function createClientForEnvironment(
  environment: 'local' | 'testnet' | 'mainnet',
  type: 'evm' | 'core'
) {
  console.log(`\n🎯 Creating ${type.toUpperCase()} client for ${environment}:`);

  try {
    if (type === 'evm') {
      switch (environment) {
        case 'local':
          return EvmClient.createLocal();
        case 'testnet':
          return EvmClient.createTestnet();
        case 'mainnet':
          return EvmClient.createMainnet();
      }
    } else {
      switch (environment) {
        case 'local':
          return CoreClient.createLocal();
        case 'testnet':
          return CoreClient.createTestnet();
        case 'mainnet':
          return CoreClient.createMainnet();
      }
    }
  } catch (error) {
    console.error(
      `❌ Failed to create ${type} client for ${environment}:`,
      error
    );
    return null;
  }
}

/**
 * Example: Network configuration comparison
 */
export function compareNetworkConfigurations() {
  console.log('\n📊 Network Configuration Comparison:');
  console.log('====================================');

  const networks = [
    { id: 'evm-local', name: 'EVM Local' },
    { id: 'evm-testnet', name: 'EVM Testnet' },
    { id: 'evm-mainnet', name: 'EVM Mainnet' },
    { id: 'core-local', name: 'Core Local' },
    { id: 'core-testnet', name: 'Core Testnet' },
    { id: 'core-mainnet', name: 'Core Mainnet' },
  ];

  console.log(
    '| Network | Type | Environment | Chain ID | EVM Chain ID | RPC URL |'
  );
  console.log(
    '|---------|------|-------------|----------|--------------|---------|'
  );

  for (const { id, name } of networks) {
    const network = networkManager.getNetwork(id);
    if (network) {
      const info = networkManager.getNetworkDisplayInfo(network);
      console.log(
        `| ${name} | ${info.type} | ${info.environment} | ${info.chainId} | ${info.evmChainId || 'N/A'} | ${info.rpcUrl} |`
      );
    }
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  networkUsageExample()
    .then(() => {
      console.log('\n✅ Network usage example completed successfully!');
    })
    .catch((error) => {
      console.error('\n❌ Network usage example failed:', error);
    });
}
