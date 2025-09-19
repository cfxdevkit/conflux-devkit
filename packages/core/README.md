# @conflux-devkit/core

> **Core types, utilities, and shared interfaces for Conflux DevKit**

[![npm version](https://img.shields.io/npm/v/@conflux-devkit/core)](https://www.npmjs.com/package/@conflux-devkit/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 Overview

The core package provides the foundational types, interfaces, and utilities that power the entire Conflux DevKit ecosystem. It defines the contract between all packages and ensures type safety across the platform.

## ✨ Features

- **🔧 Type Definitions**: Comprehensive TypeScript types for all blockchain operations
- **🌐 Network Management**: Unified network configuration for Core and EVM chains
- **💼 Wallet Interfaces**: Standardized wallet management interfaces
- **📦 Contract Types**: Complete contract orchestration and deployment types
- **🔄 API Utilities**: Response handling and error management utilities
- **🌍 Browser Conversion**: Safe data conversion for browser environments
- **📊 Normalization**: Data normalization and formatting utilities

## 📦 Installation

```bash
pnpm add @conflux-devkit/core
# or
npm install @conflux-devkit/core
# or
yarn add @conflux-devkit/core
```

## 🚀 Quick Start

```typescript
import {
  NetworkConfig,
  WalletInfo,
  ContractOrchestrator,
  BrowserWalletInfo,
  normalizeAddress,
  createApiResponse
} from '@conflux-devkit/core';

// Network configuration
const network: NetworkConfig = {
  name: 'Conflux Mainnet',
  chainId: 2029,
  evmChainId: 2030,
  rpcUrl: 'https://main.confluxrpc.com',
  currency: {
    name: 'Conflux',
    symbol: 'CFX',
    decimals: 18
  },
  isTestnet: false
};

// Wallet information
const wallet: WalletInfo = {
  address: '0x1234...',
  privateKey: '0xabcd...',
  mnemonic: 'word1 word2 word3...',
  balance: '1000000000000000000',
  balanceFormatted: '1.0 CFX'
};

// Contract orchestration
const contract: ContractOrchestrator = {
  name: 'MyContract',
  address: '0x5678...',
  abi: [...],
  bytecode: '0x...',
  methods: {
    read: ['getValue', 'getOwner'],
    write: ['setValue', 'transfer'],
    events: ['ValueChanged', 'OwnershipTransferred']
  },
  capabilities: {
    read: true,
    write: true,
    events: true
  }
};
```

## 📚 API Reference

### Network Management

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

#### `BrowserNetworkConfig`

```typescript
interface BrowserNetworkConfig {
  name: string;
  chainId: string;
  evmChainId?: string;
  rpcUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: string;
  };
  isTestnet: boolean;
  networkType: 'core' | 'evm';
}
```

### Wallet Management

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

#### `BrowserWalletInfo`

```typescript
interface BrowserWalletInfo {
  index: number;
  address: string;
  privateKey: string;
  mnemonic: string;
  balance: string;
  balanceFormatted: string;
  isMining: boolean;
}
```

### Contract Management

#### `ContractOrchestrator`

```typescript
interface ContractOrchestrator {
  name: string;
  address: string;
  abi: string;
  bytecode: string;
  deployedBytecode: string;
  chainType: 'core' | 'evm';
  networkId: string;
  chainId: string;
  evmChainId?: string;
  network: BrowserNetworkConfig;
  methods: {
    read: string[];
    write: string[];
    events: string[];
  };
  capabilities: {
    read: boolean;
    write: boolean;
    events: boolean;
  };
}
```

### RPC Clients

#### `CoreClient`

```typescript
interface CoreClient {
  getBalance(params: { address: string }): Promise<bigint>;
  getBlockNumber(): Promise<bigint>;
  getBlock(blockNumber: bigint): Promise<Block>;
  sendTransaction(tx: CoreTransactionRequest): Promise<`0x${string}`>;
  readContract(params: ReadContractParams): Promise<unknown>;
  writeContract(params: WriteContractParams): Promise<`0x${string}`>;
}
```

#### `EvmClient`

```typescript
interface EvmClient {
  getBalance(params: { address: `0x${string}` }): Promise<bigint>;
  getBlockNumber(): Promise<bigint>;
  getBlock(blockNumber: bigint): Promise<Block>;
  sendTransaction(tx: TransactionRequest): Promise<`0x${string}`>;
  readContract(params: ReadContractParams): Promise<unknown>;
  writeContract(params: WriteContractParams): Promise<`0x${string}`>;
}
```

### Utilities

#### Address Normalization

```typescript
import { normalizeAddress } from '@conflux-devkit/core';

const normalized = normalizeAddress('0x1234...'); // Returns normalized address
```

#### BigInt Normalization

```typescript
import {
  normalizeBigInt,
  normalizeBigIntFormatted,
} from '@conflux-devkit/core';

const normalized = normalizeBigInt('1000000000000000000'); // Returns bigint
const formatted = normalizeBigIntFormatted('1000000000000000000', 18); // Returns "1.0"
```

#### Browser Conversion

```typescript
import { toBrowserWalletInfo, toBrowserSafe } from '@conflux-devkit/core';

const browserWallet = toBrowserWalletInfo(walletInfo);
const safeData = toBrowserSafe(anyData);
```

#### API Response Creation

```typescript
import { createApiResponse, createErrorResponse } from '@conflux-devkit/core';

const successResponse = createApiResponse(data, 'Operation successful');
const errorResponse = createErrorResponse('Something went wrong', 500);
```

## 🔧 Configuration

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

### Import Configuration

```typescript
// Import specific utilities
import { normalizeAddress, createApiResponse } from '@conflux-devkit/core';

// Import types
import type { NetworkConfig, WalletInfo } from '@conflux-devkit/core';

// Import everything
import * as ConfluxCore from '@conflux-devkit/core';
```

## 🧪 Examples

### Network Configuration

```typescript
import { NetworkConfig } from '@conflux-devkit/core';

const networks: NetworkConfig[] = [
  {
    name: 'Conflux Mainnet Core',
    chainId: 2029,
    rpcUrl: 'https://main.confluxrpc.com',
    currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
    isTestnet: false,
  },
  {
    name: 'Conflux Mainnet EVM',
    chainId: 2029,
    evmChainId: 2030,
    rpcUrl: 'https://main.confluxrpc.com',
    currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
    isTestnet: false,
  },
];
```

### Contract Orchestration

```typescript
import { ContractOrchestrator } from '@conflux-devkit/core';

const createContractOrchestrator = (
  name: string,
  address: string,
  abi: any[]
): ContractOrchestrator => {
  return {
    name,
    address,
    abi: JSON.stringify(abi),
    bytecode: '0x...',
    deployedBytecode: '0x...',
    chainType: 'evm',
    networkId: '2030',
    chainId: '2030',
    evmChainId: '2030',
    network: {
      name: 'Conflux Mainnet EVM',
      chainId: '2030',
      evmChainId: '2030',
      rpcUrl: 'https://main.confluxrpc.com',
      currency: { name: 'Conflux', symbol: 'CFX', decimals: '18' },
      isTestnet: false,
      networkType: 'evm',
    },
    methods: {
      read: abi
        .filter(
          item => item.type === 'function' && item.stateMutability === 'view'
        )
        .map(item => item.name),
      write: abi
        .filter(
          item => item.type === 'function' && item.stateMutability !== 'view'
        )
        .map(item => item.name),
      events: abi.filter(item => item.type === 'event').map(item => item.name),
    },
    capabilities: {
      read: true,
      write: true,
      events: true,
    },
  };
};
```

## 🔗 Dependencies

- **TypeScript**: Type definitions and interfaces
- **No external runtime dependencies**: Pure TypeScript package

## 📊 Bundle Size

- **Minified**: ~15KB
- **Gzipped**: ~5KB
- **Tree-shakeable**: Import only what you need

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Part of the Conflux DevKit ecosystem** 🚀
