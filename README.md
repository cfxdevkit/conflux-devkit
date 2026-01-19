<!--
Copyright 2025 Conflux DevKit Team
SPDX-License-Identifier: Apache-2.0
-->

# Conflux DevKit

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/cfxdevkit/conflux-devkit)

A comprehensive development toolkit for building applications on Conflux blockchain, supporting both Core Space and eSpace.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@conflux-devkit/core](./packages/core/) | 0.1.0 | Foundation blockchain client library |
| [@conflux-devkit/plugin-devnode](./packages/plugin-devnode/) | 0.1.0 | Local development node plugin |
| [@conflux-devkit/backend](./packages/backend/) | 0.1.0 | REST API & WebSocket server |
| [@conflux-devkit/frontend](./packages/frontend/) | 1.0.0 | React DevNode dashboard |
| [@conflux-devkit/wallet](./packages/wallet/) | 0.1.0 | Wallet abstractions |
| [@conflux-devkit/contracts](./packages/contracts/) | 0.1.0 | Contract utilities |
| [@conflux-devkit/ui-headless](./packages/ui-headless/) | 1.0.0 | Headless React components |

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development (backend + frontend)
pnpm dev

# Or start individually:
pnpm dev:backend   # Terminal 1
pnpm dev:frontend  # Terminal 2
```

Open http://localhost:5173 to access the dashboard.

### First-Time Setup

On first run, you'll see a Setup Wizard that guides you through:
1. **Connect Wallet** - Set up admin address
2. **Mnemonic** - Generate or import a BIP-39 recovery phrase
3. **Configuration** - Set number of accounts, chain IDs
4. **Security** - Optional encryption for your keystore

### Reset Configuration

```bash
# Check current DevKit status
pnpm devkit:status

# Delete keystore only (re-run setup wizard)
pnpm devkit:reset:config

# Delete blockchain data only (keep config)
pnpm devkit:reset:data

# Full reset - delete both keystore and blockchain data
pnpm devkit:reset
```

## Features

- 🔗 **Dual-Chain**: Core Space + eSpace support
- 🏗️ **Local Node**: Built-in Conflux development blockchain
- ⚡ **Real-time**: WebSocket streaming for live updates
- 🔐 **Type-Safe**: Full TypeScript coverage
- 📦 **Modular**: Use packages independently

## Documentation

- [Quick Start Demo](./DEMO.md)
- [Docker Setup](./DOCKER.md)
- [DevContainer Setup](./DEVCONTAINER_SETUP.md)
- [Package Documentation](./docs/)

## Architecture

```
┌─────────────────────────────────────────────┐
│            PRESENTATION LAYER               │
│      frontend          ui-headless          │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│             SERVICE LAYER                   │
│                backend                      │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│             PLUGIN LAYER                    │
│  plugin-devnode   wallet   contracts        │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│           FOUNDATION LAYER                  │
│                 core                        │
└─────────────────────────────────────────────┘
```

## License

Apache License 2.0 - see [LICENSE](./LICENSE)
