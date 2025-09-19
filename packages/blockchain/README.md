# @conflux-devkit/blockchain

> **Blockchain interactions, wallet management, and network utilities for Conflux DevKit**

[![npm version](https://img.shields.io/npm/v/@conflux-devkit/blockchain)](https://www.npmjs.com/package/@conflux-devkit/blockchain)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 Overview

The blockchain package provides comprehensive blockchain interaction capabilities for both Conflux Core and EVM-compatible chains. It includes wallet management, RPC clients, contract deployment, and network management utilities.

## ✨ Features

- **🔗 Dual Chain Support**: Seamless support for both Conflux Core and EVM chains
- **💼 Wallet Management**: BIP39/BIP32 compliant wallet generation and management
- **🌐 Network Management**: Unified network configuration and switching
- **📦 Contract Management**: Complete contract deployment and interaction tools
- **🔌 RPC Clients**: Production-ready RPC clients for blockchain interactions
- **🛠️ Transaction Management**: Comprehensive transaction handling and utilities
- **🔒 Security**: Secure key management and transaction signing

## 📦 Installation

```bash
pnpm add @conflux-devkit/blockchain
# or
npm install @conflux-devkit/blockchain
# or
yarn add @conflux-devkit/blockchain
```

## 🚀 Quick Start

```typescript
import {
  WalletManager,
  EvmClient,
  CoreClient,
  networkManager,
  ContractManager
} from '@conflux-devkit/blockchain';

// Create a wallet
const walletManager = new WalletManager();
const wallet = walletManager.generateWallet();
console.log('Wallet created:', wallet.address);

// Connect to network
const network = networkManager.getNetwork('2030'); // EVM Mainnet
const evmClient = new EvmClient(network, wallet.privateKey);

// Get balance
const balance = await evmClient.getBalance({ address: wallet.address });
console.log('Balance:', balance.toString());

// Deploy a contract
const contractManager = new ContractManager();
const deployment = await contractManager.deployContract({
  name: 'MyContract',
  bytecode: '0x...',
  abi: [...],
  args: []
});
console.log('Contract deployed:', deployment.address);
```

## 📚 API Reference

### Wallet Management

#### `WalletManager`

```typescript
class WalletManager {
  // Generate a new wallet
  generateWallet(): WalletInfo;

  // Import wallet from mnemonic
  importWalletFromMnemonic(mnemonic: string): WalletInfo;

  // Import wallet from private key
  importWalletFromPrivateKey(privateKey: string): WalletInfo;

  // Get network configuration
  static getNetworkConfig(networkId: string): NetworkConfig;
}
```

#### `WalletInfo`

```typescript
interface WalletInfo {
  address: string;
  privateKey: string;
  mnemonic: string;
  balance: string;
  balanceFormatted: string;
}
```

### Network Management

#### `networkManager`

```typescript
// Get network by ID
const network = networkManager.getNetwork('2030'); // EVM Mainnet
const coreNetwork = networkManager.getNetwork('2029'); // Core Mainnet

// Get all available networks
const networks = networkManager.getAllNetworks();

// Get local networks
const localEVM = networkManager.getLocalNetwork('evm');
const localCore = networkManager.getLocalNetwork('core');
```

#### `NetworkConfig`

```typescript
interface NetworkConfig {
  name: string;
  chainId: number;
  evmChainId?: number;
  rpcUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}
```

### RPC Clients

#### `EvmClient`

```typescript
class EvmClient implements IEvmClient {
  constructor(network: NetworkConfig, privateKey?: `0x${string}`);

  // Get account balance
  getBalance(params: { address: `0x${string}` }): Promise<bigint>;

  // Get current block number
  getBlockNumber(): Promise<bigint>;

  // Get block by number
  getBlock(blockNumber: bigint): Promise<Block>;

  // Send transaction
  sendTransaction(tx: TransactionRequest): Promise<`0x${string}`>;

  // Read contract
  readContract(params: ReadContractParams): Promise<unknown>;

  // Write contract
  writeContract(params: WriteContractParams): Promise<`0x${string}`>;

  // Static factory methods
  static createFromNetworkId(networkId: string): EvmClient;
  static createLocal(): EvmClient;
  static createTestnet(): EvmClient;
}
```

#### `CoreClient`

```typescript
class CoreClient implements ICoreClient {
  constructor(network: NetworkConfig);

  // Get account balance
  getBalance(params: { address: string }): Promise<bigint>;

  // Get current block number
  getBlockNumber(): Promise<bigint>;

  // Get block by number
  getBlock(blockNumber: bigint): Promise<Block>;

  // Send transaction
  sendTransaction(tx: CoreTransactionRequest): Promise<`0x${string}`>;

  // Read contract
  readContract(params: ReadContractParams): Promise<unknown>;

  // Write contract
  writeContract(params: WriteContractParams): Promise<`0x${string}`>;

  // Static factory methods
  static createFromNetworkId(networkId: string): CoreClient;
  static createLocal(): CoreClient;
  static createTestnet(): CoreClient;
}
```

### Contract Management

#### `ContractManager`

```typescript
class ContractManager {
  // Deploy contract
  deployContract(config: ContractDeploymentConfig): Promise<DeploymentResult>;

  // Call contract method
  callContractMethod(params: ContractCallParams): Promise<ContractCallResult>;

  // Get contract code
  getContractCode(address: string): Promise<string>;

  // Get network configuration
  static getNetworkConfig(networkId: string): NetworkConfig;
}
```

#### `ContractDeploymentConfig`

```typescript
interface ContractDeploymentConfig {
  name: string;
  bytecode: `0x${string}`;
  abi: AbiItem[];
  args?: unknown[];
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
}
```

### Transaction Management

#### `TransactionManager`

```typescript
class TransactionManager {
  // Send transaction
  sendTransaction(tx: TransactionRequest): Promise<`0x${string}`>;

  // Wait for transaction
  waitForTransaction(hash: `0x${string}`): Promise<TransactionReceipt>;

  // Get transaction receipt
  getTransactionReceipt(hash: `0x${string}`): Promise<TransactionReceipt>;
}
```

## 🌐 Supported Networks

| Network              | Chain ID | EVM Chain ID | Type | Status       |
| -------------------- | -------- | ------------ | ---- | ------------ |
| Conflux Mainnet Core | 2029     | -            | Core | ✅ Supported |
| Conflux Mainnet EVM  | -        | 2030         | EVM  | ✅ Supported |
| Conflux Testnet Core | 2029     | -            | Core | ✅ Supported |
| Conflux Testnet EVM  | -        | 2030         | EVM  | ✅ Supported |
| Local Core           | 2029     | -            | Core | ✅ Supported |
| Local EVM            | -        | 2030         | EVM  | ✅ Supported |

## 🧪 Examples

### Wallet Creation and Management

```typescript
import { WalletManager } from '@conflux-devkit/blockchain';

const walletManager = new WalletManager();

// Generate new wallet
const newWallet = walletManager.generateWallet();
console.log('New wallet:', newWallet.address);

// Import from mnemonic
const importedWallet = walletManager.importWalletFromMnemonic(
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
);
console.log('Imported wallet:', importedWallet.address);

// Import from private key
const privateKeyWallet = walletManager.importWalletFromPrivateKey(
  '0x1234567890abcdef...'
);
console.log('Private key wallet:', privateKeyWallet.address);
```

### Network Operations

```typescript
import { networkManager, EvmClient } from '@conflux-devkit/blockchain';

// Get network configuration
const network = networkManager.getNetwork('2030'); // EVM Mainnet
console.log('Network:', network.name);

// Create EVM client
const evmClient = EvmClient.createFromNetworkId('2030');

// Get balance
const balance = await evmClient.getBalance({
  address: '0x1234567890abcdef...',
});
console.log('Balance:', balance.toString());
```

### Contract Deployment

```typescript
import { ContractManager } from '@conflux-devkit/blockchain';

const contractManager = new ContractManager();

// Deploy contract
const deployment = await contractManager.deployContract({
  name: 'MyToken',
  bytecode: '0x608060405234801561001057600080fd5b50...',
  abi: [
    {
      type: 'constructor',
      inputs: [{ name: 'initialSupply', type: 'uint256' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'totalSupply',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
  ],
  args: [1000000], // initialSupply
});

console.log('Contract deployed at:', deployment.address);
console.log('Transaction hash:', deployment.transactionHash);
```

### Contract Interaction

```typescript
import { ContractManager } from '@conflux-devkit/blockchain';

const contractManager = new ContractManager();

// Call read function
const totalSupply = await contractManager.callContractMethod({
  contractAddress: '0x1234567890abcdef...',
  methodName: 'totalSupply',
  args: [],
});

console.log('Total supply:', totalSupply);

// Call write function
const txHash = await contractManager.callContractMethod({
  contractAddress: '0x1234567890abcdef...',
  methodName: 'transfer',
  args: ['0x9876543210fedcba...', 1000],
  value: 0n,
});

console.log('Transfer transaction:', txHash);
```

## 🔧 Configuration

### Environment Variables

```bash
# RPC URLs
CONFLUX_RPC_URL=https://main.confluxrpc.com
CONFLUX_EVM_RPC_URL=https://main.confluxrpc.com

# Network IDs
CONFLUX_CORE_CHAIN_ID=2029
CONFLUX_EVM_CHAIN_ID=2030
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 🔗 Dependencies

- **viem**: EVM interactions and utilities
- **@xcfx/node**: Conflux Core interactions
- **bip32**: HD wallet key derivation
- **bip39**: Mnemonic generation and validation
- **tiny-secp256k1**: Cryptographic operations

## 📊 Bundle Size

- **Minified**: ~45KB
- **Gzipped**: ~15KB
- **Tree-shakeable**: Import only what you need

## 🚨 Security Notes

- **Private Keys**: Never expose private keys in client-side code
- **Mnemonic Phrases**: Store mnemonic phrases securely
- **Network Security**: Always verify network configurations
- **Transaction Validation**: Validate all transaction parameters

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Part of the Conflux DevKit ecosystem** 🚀
