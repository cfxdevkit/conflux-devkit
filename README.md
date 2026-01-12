<!--
Copyright 2025 Conflux DevKit Team

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Conflux DevKit

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/cfxdevkit/conflux-devkit)

A comprehensive development toolkit for building applications on the Conflux blockchain ecosystem, supporting both Core Space and eSpace (EVM-compatible).

## 🚀 Overview

Conflux DevKit is a professional-grade monorepo that provides a unified development experience for Conflux blockchain applications. It includes a complete stack with node management, smart contract development, backend services, and a modern frontend interface.

## 📦 Architecture

### Core Packages

#### **[@conflux-devkit/node](./packages/node/)** - Core Development Library
The foundational TypeScript library for Conflux blockchain development:
- **Dual-Chain Clients**: Unified interface wrapping Cive (Core Space) and Viem (eSpace)
- **DevKit API**: High-level ergonomic API for common blockchain operations
- **Account Management**: Automatic Core↔eSpace address mapping from a single mnemonic
- **Local Node**: Integrated @xcfx/node for instant local development blockchain
- **Smart Contracts**: Deploy and interact with contracts on both chains
- **Mining Controls**: Configure manual/auto-mining for development workflows
- **Type-Safe**: Comprehensive TypeScript types with full IntelliSense support

#### **[@conflux-devkit/backend](./packages/backend/)** - Backend Services
Production-ready backend with APIs for web3 applications:
- **REST API**: Express server with endpoints for blockchain operations
- **WebSocket Server**: Real-time streaming of node status, blocks, and balances
- **Authentication**: Wallet-based auth service for secure access
- **Cross-Chain Swap**: Integrated routes for token bridging between chains
- **CLI Tool**: Run as standalone service with `conflux-devkit-backend` command
- **Monitoring**: Health checks, structured logging (Winston), and error handling
- **CORS & Security**: Helmet security headers and configurable CORS

#### **[@conflux-devkit/frontend](./packages/frontend/)** - Developer Dashboard
Modern React application for blockchain interaction:
- **Wallet Integration**: ConnectKit + Wagmi for MetaMask, Fluent, and more
- **Live Updates**: WebSocket-powered real-time blockchain data
- **Contract Interface**: Deploy contracts and call functions through UI
- **Account Dashboard**: View balances, addresses, and transaction history
- **Dual-Chain UI**: Switch between Core Space and eSpace seamlessly
- **Modern Stack**: React 18, TypeScript, Vite, Tailwind CSS, React Query

### Key Features

- 🔗 **Dual-Chain Support**: Seamless integration with Conflux Core Space and eSpace
- 🎯 **Unified API**: Single interface for accounts, transactions, and contracts
- 🏗️ **Development Node**: Built-in local Conflux blockchain for instant testing
- ⚡ **Real-time Updates**: WebSocket streaming for live blockchain data
- 🛠️ **Modern Stack**: TypeScript, React, Express, Viem, Cive
- 🔐 **Type Safety**: Full TypeScript coverage with strict mode
- 📦 **Modular Design**: Use packages independently or together
- 🚀 **Developer Experience**: Hot reload, comprehensive docs, example code

## 🛠️ Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/cfxdevkit/conflux-devkit.git
cd conflux-devkit

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start all services in development mode (backend + frontend)
pnpm dev

# Or start individual services
pnpm dev:node      # Node service only
pnpm dev:backend   # Backend API only (http://localhost:3001)
pnpm dev:frontend  # Frontend only (http://localhost:3000)
```

The stack will be available at:
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3002

### 🎮 Try the Demo

For a complete walkthrough of running the full stack locally, see the **[Demo Guide](./DEMO.md)**.

The demo showcases:
- ✅ Starting local Conflux Core Space and eSpace nodes
- ✅ Managing accounts and checking balances on both chains
- ✅ Deploying and interacting with smart contracts
- ✅ Real-time blockchain updates via WebSocket
- ✅ Full integration of all three packages

### Production

```bash
# Build for production
pnpm build

# Start production services
pnpm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Development Node Configuration
HARDHAT_VAR_DEPLOYER_MNEMONIC="your twelve word mnemonic phrase here"

# Backend Configuration
PORT=3001
WS_PORT=3002

# Frontend Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002
```

### Network Configuration

The DevKit supports multiple networks:

- **Local**: Development node (default)
- **Testnet**: Conflux testnet
- **Mainnet**: Conflux mainnet

## 📚 Package Documentation

### @conflux-devkit/node

The core library providing unified access to Conflux blockchain functionality.

#### Installation

```bash
npm install @conflux-devkit/node
# or
pnpm add @conflux-devkit/node
```

#### Quick Example

```typescript
import { DevKit } from '@conflux-devkit/node';

// Initialize DevKit with local development node
const devkit = new DevKit({
  chainId: 2029,      // Core Space testnet chain ID
  evmChainId: 2030,   // eSpace testnet chain ID
  mnemonic: 'test test test test test test test test test test test junk',
  autoStart: true,    // Automatically start local node
});

// Wait for node to be ready
await devkit.start();

// Get first account (accounts are derived from mnemonic)
const account = devkit.account(0);
console.log('Core Space address:', account.address.core);
console.log('eSpace address:', account.address.evm);

// Check balances on both chains
const balances = await account.getBalance();
console.log('Core balance:', balances.core);
console.log('EVM balance:', balances.evm);

// Deploy a contract to eSpace (EVM-compatible)
const contract = await account.deploy({
  chain: 'evm',
  abi: contractAbi,
  bytecode: contractBytecode,
  args: [arg1, arg2],
});

// Interact with contract
const result = await contract.read('getValue');
await contract.write('setValue', [newValue]);

// Send test tokens via faucet
await devkit.faucet(account.address.core, '100');
```

#### Advanced Features

```typescript
// Manual mining control
await devkit.mine(); // Mine a single block

// Get node status
const status = await devkit.status();
console.log('Mining mode:', status.mining);
console.log('Block number:', status.blockNumber);

// Access low-level clients directly
const coreClient = devkit.clients.core;      // Cive client for Core Space
const espaceClient = devkit.clients.evm;     // Viem client for eSpace

// Multi-chain operations
const accounts = devkit.accounts(); // Get all accounts
for (const acc of accounts) {
  console.log(`Account ${acc.index}:`, acc.address);
}
```

### @conflux-devkit/backend

REST API and WebSocket backend for frontend integration.

#### Installation

```bash
npm install @conflux-devkit/backend
# or
pnpm add @conflux-devkit/backend
```

#### Quick Start

```typescript
import { BackendServer } from '@conflux-devkit/backend';

const server = new BackendServer({
  port: 3001,
  wsPort: 3002,
  devkitConfig: {
    chainId: 2029,
    evmChainId: 2030,
    mnemonic: process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC,
  },
});

await server.start();
console.log('Backend running on http://localhost:3001');
console.log('WebSocket running on ws://localhost:3002');
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/devkit/status` | Get node status and health |
| `POST` | `/api/devkit/start` | Start local development node |
| `POST` | `/api/devkit/stop` | Stop local development node |
| `GET` | `/api/devkit/accounts` | List all accounts with addresses |
| `POST` | `/api/devkit/faucet` | Request test tokens for address |
| `GET` | `/api/devkit/balance/:address` | Get balance for specific address |
| `POST` | `/api/devkit/mine` | Mine a block manually |
| `POST` | `/api/swap/*` | Cross-chain token swap operations |

#### WebSocket Events

```typescript
// Client-side WebSocket connection
const ws = new WebSocket('ws://localhost:3002');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  switch(event.type) {
    case 'node_status':
      console.log('Node status:', event.data);
      break;
    case 'block_mined':
      console.log('New block:', event.data.blockNumber);
      break;
    case 'balance_changed':
      console.log('Balance update:', event.data);
      break;
  }
});
```

### @conflux-devkit/frontend

Modern React frontend with developer-friendly interface.

#### Features

- 💼 **Account Management**: View addresses, balances, and private keys
- 📝 **Contract Deployment**: Deploy contracts with ABI and bytecode
- 🔧 **Contract Interaction**: Call read/write functions through UI
- 📊 **Real-Time Monitoring**: Live updates via WebSocket connection
- 🔄 **Chain Switching**: Toggle between Core Space and eSpace
- 🔌 **Wallet Integration**: Connect MetaMask, Fluent, and other wallets
- 🎨 **Modern UI**: Responsive design with Tailwind CSS

#### Development

```bash
cd packages/frontend
pnpm dev
# Open http://localhost:3003
```

The frontend connects to the backend at `http://localhost:3001` and WebSocket at `ws://localhost:3002` (configurable via environment variables).

## 🔗 Use Cases & Capabilities

### Smart Contract Development

Develop and deploy contracts on both chains with unified tooling:

```typescript
import { DevKit } from '@conflux-devkit/node';

const devkit = new DevKit({ autoStart: true });
await devkit.start();

const account = devkit.account(0);

// Deploy to eSpace (EVM-compatible)
const evmContract = await account.deploy({
  chain: 'evm',
  abi: MyContractAbi,
  bytecode: MyContractBytecode,
  args: [initialValue],
});

// Deploy to Core Space
const coreContract = await account.deploy({
  chain: 'core',
  abi: MyContractAbi,
  bytecode: MyContractBytecode,
  args: [initialValue],
});

// Interact with contracts
const value = await evmContract.read('getValue');
await evmContract.write('setValue', [newValue]);
```

### Cross-Chain Development

Build applications that span both Conflux Core Space and eSpace:

```typescript
// Single account with addresses on both chains
const account = devkit.account(0);
console.log('Core address:', account.address.core);  // cfx:...
console.log('eSpace address:', account.address.evm);  // 0x...

// Check balances across chains
const balances = await account.getBalance();
console.log('Core CFX:', balances.core);
console.log('eSpace CFX:', balances.evm);

// Transfer between chains using the swap API
// (requires backend integration)
```

### Local Development Environment

Set up instant local blockchain for testing:

```typescript
const devkit = new DevKit({
  chainId: 2029,        // Local Core Space
  evmChainId: 2030,     // Local eSpace
  autoStart: true,      // Auto-start node
  mining: {
    auto: false,        // Manual mining for precise control
  },
});

// Manual block mining
await devkit.mine();

// Fund accounts instantly
await devkit.faucet(address, '1000');
```

### Integration Testing

Use DevKit in your test suites:

```typescript
import { DevKit } from '@conflux-devkit/node';
import { describe, it, beforeAll, afterAll } from 'vitest';

let devkit: DevKit;

beforeAll(async () => {
  devkit = new DevKit({ autoStart: true });
  await devkit.start();
});

afterAll(async () => {
  await devkit.stop();
});

it('should deploy and interact with contract', async () => {
  const account = devkit.account(0);
  const contract = await account.deploy({
    chain: 'evm',
    abi: MyAbi,
    bytecode: MyBytecode,
  });

  await contract.write('setValue', [42]);
  const value = await contract.read('getValue');
  expect(value).toBe(42n);
});
```

### Backend API Integration

Build web3 applications with REST and WebSocket APIs:

```typescript
// Server setup
import { BackendServer } from '@conflux-devkit/backend';

const server = new BackendServer({
  port: 3001,
  wsPort: 3002,
  devkitConfig: { /* ... */ },
});

await server.start();

// Frontend integration
fetch('http://localhost:3001/api/devkit/accounts')
  .then(res => res.json())
  .then(accounts => console.log(accounts));

// WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:3002');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Blockchain update:', data);
};
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific package tests
pnpm --filter @conflux-devkit/node test
```

## 🔄 Service Management

### Using PM2 (Recommended for Production)

```bash
# Start all services
pnpm pm2:start

# View status
pnpm pm2:status

# View logs
pnpm pm2:logs

# Restart services
pnpm pm2:restart

# Stop services
pnpm pm2:stop
```

### Using Scripts

```bash
# Start services
pnpm start

# Stop services
pnpm stop

# Restart services
pnpm restart

# Check service status
pnpm status

# View service health
pnpm health
```

## 🐳 Docker Support

```bash
# Build Docker image
pnpm docker:build

# Run with Docker Compose
docker-compose up -d

# For development
docker-compose -f docker-compose.dev.yml up -d
```

## 📊 Monitoring and Logging

- **Health Checks**: Built-in health monitoring endpoints
- **Structured Logging**: Winston-based logging with configurable levels
- **Metrics**: Service performance and blockchain metrics
- **WebSocket**: Real-time status updates

## 🛡️ Security

- **Environment Variables**: Secure configuration management
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express
- **Input Validation**: Request validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `pnpm test`
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure all linting passes: `pnpm lint`

## 📄 License

Copyright 2025 Conflux DevKit Team

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this project except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See [LICENSE](LICENSE) file for the full license text.

## 🆘 Support

- **Issues**: Report bugs and request features on GitHub Issues
- **Documentation**: Additional docs in the `/docs` directory
- **Community**: Join the Conflux developer community
- **Contributing**: See our contribution guidelines below

## 🤝 Contributing

We welcome contributions from the community! Please read our contribution guidelines:

1. **Fork the repository** and create your feature branch
2. **Follow the coding standards** and ensure all tests pass
3. **Add proper license headers** to new source files
4. **Write clear commit messages** following conventional commits
5. **Submit a pull request** with a detailed description

### Code of Conduct

This project adheres to the Contributor Covenant code of conduct. By participating, you are expected to uphold this code.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/conflux-devkit.git
cd conflux-devkit

# Install dependencies
pnpm install

# Run development environment
pnpm dev

# Run tests
pnpm test

# Check code quality
pnpm lint && pnpm type-check
```

## 🗺️ Roadmap

- [ ] Enhanced contract templates and scaffolding
- [ ] Additional wallet integrations (MetaMask, WalletConnect)
- [ ] Mobile SDK support for React Native
- [ ] Advanced debugging and profiling tools
- [ ] Mainnet deployment automation and CI/CD
- [ ] Performance optimization and monitoring suite
- [ ] Multi-language bindings (Python, Go, Rust)

## 📚 Documentation

- **API Reference**: Comprehensive API documentation
- **Tutorials**: Step-by-step guides for common tasks
- **Examples**: Sample projects and code snippets
- **Architecture**: Technical deep-dive into the system design

## 🏆 Acknowledgments

This project builds upon the excellent work of:

- The Conflux Foundation and Core Team
- The broader Ethereum and Web3 development community
- Open source contributors and maintainers

---

**Built with ❤️ by the Conflux DevKit Team**

*Empowering developers to build the future of decentralized applications on Conflux.*