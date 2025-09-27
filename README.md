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

- **[@conflux-devkit/node](./packages/node/)** - Core library for Conflux blockchain interaction
- **[@conflux-devkit/backend](./packages/backend/)** - REST API and WebSocket backend services
- **[@conflux-devkit/frontend](./packages/frontend/)** - Modern React frontend application

### Key Features

- **Dual-Chain Support**: Seamless integration with both Conflux Core Space and eSpace
- **Unified API**: Single interface for managing accounts, transactions, and contracts
- **Development Node**: Built-in local Conflux node for testing
- **Real-time Updates**: WebSocket-based live data streaming
- **Modern Stack**: TypeScript, React, Express, Viem, and Hardhat integration
- **Developer Experience**: Hot reloading, type safety, and comprehensive tooling

## 🛠️ Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd conflux-devkit

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Or start individual services
pnpm dev:node      # Node service only
pnpm dev:backend   # Backend API only
pnpm dev:frontend  # Frontend only
```

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

```typescript
import { DevKit } from '@conflux-devkit/node';

// Initialize DevKit
const devkit = new DevKit({
  chainId: 1029,      // Core Space chain ID
  evmChainId: 1030,   // eSpace chain ID
});

// Start local development node
await devkit.start();

// Get account
const account = devkit.account(0);
console.log('Core address:', account.address.core);
console.log('EVM address:', account.address.evm);

// Deploy contract
const contract = await account.deploy({
  abi: contractAbi,
  bytecode: contractBytecode,
  args: [arg1, arg2],
});
```

### @conflux-devkit/backend

REST API and WebSocket backend for frontend integration.

**API Endpoints:**
- `GET /api/devkit/status` - Get node status
- `POST /api/devkit/start` - Start development node
- `POST /api/devkit/stop` - Stop development node
- `GET /api/devkit/accounts` - List accounts
- `POST /api/devkit/faucet` - Request test tokens

**WebSocket Events:**
- `node_status` - Node status updates
- `block_mined` - New block notifications
- `balance_changed` - Account balance updates

### @conflux-devkit/frontend

Modern React frontend with:
- Account management interface
- Contract deployment and interaction
- Real-time node monitoring
- Dual-chain support
- Wallet integration (ConnectKit/Wagmi)

## 🔗 Smart Contract Development

The DevKit provides built-in support for deploying and interacting with smart contracts on both Conflux Core Space and eSpace through the frontend interface and backend APIs. Contract development tools are integrated into the main packages.

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