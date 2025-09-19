#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate contract configuration for the devkit
 * This script creates a shared contract configuration that can be used across packages
 */

const contractConfig = {
  networks: {
    local: {
      name: 'Local Development',
      rpcUrl: 'http://localhost:12537',
      chainId: 2030,
      currency: {
        name: 'Conflux',
        symbol: 'CFX',
        decimals: 18,
      },
    },
    testnet: {
      name: 'Conflux Testnet',
      rpcUrl: 'https://test.confluxrpc.com',
      chainId: 1,
      currency: {
        name: 'Conflux',
        symbol: 'CFX',
        decimals: 18,
      },
    },
    mainnet: {
      name: 'Conflux Mainnet',
      rpcUrl: 'https://main.confluxrpc.com',
      chainId: 1029,
      currency: {
        name: 'Conflux',
        symbol: 'CFX',
        decimals: 18,
      },
    },
  },
  contracts: {
    // Add contract configurations here as they are deployed
    // Example:
    // Counter: {
    //   address: '0x...',
    //   abi: [...],
    //   networks: ['local', 'testnet']
    // }
  },
  generatedAt: new Date().toISOString(),
};

// Write the configuration files
const outputDir = path.join(__dirname, '..', 'shared');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write JSON file
fs.writeFileSync(
  path.join(outputDir, 'contract-config.json'),
  JSON.stringify(contractConfig, null, 2)
);

// Write JavaScript module
fs.writeFileSync(
  path.join(outputDir, 'contract-config.js'),
  `module.exports = ${JSON.stringify(contractConfig, null, 2)};`
);

// Write TypeScript declaration
fs.writeFileSync(
  path.join(outputDir, 'contract-config.d.ts'),
  `export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ContractConfig {
  address: string;
  abi: any[];
  networks: string[];
}

export interface ContractConfiguration {
  networks: Record<string, NetworkConfig>;
  contracts: Record<string, ContractConfig>;
  generatedAt: string;
}

declare const contractConfig: ContractConfiguration;
export default contractConfig;
`
);

// Write ES module
fs.writeFileSync(
  path.join(outputDir, 'contract-config.mjs'),
  `export default ${JSON.stringify(contractConfig, null, 2)};`
);

console.log('✅ Contract configuration generated successfully');
console.log(`📁 Output directory: ${outputDir}`);
console.log('📄 Generated files:');
console.log('  - contract-config.json');
console.log('  - contract-config.js');
console.log('  - contract-config.d.ts');
console.log('  - contract-config.mjs');
