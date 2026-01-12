# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Conflux DevKit is a professional TypeScript monorepo providing a complete development toolkit for building on the Conflux blockchain. It offers seamless dual-chain support for both Conflux Core Space (CFX native) and eSpace (EVM-compatible), making it easy to build cross-chain applications.

## Project Architecture

### Core Packages (Publishable on npm)

#### **@conflux-devkit/node** (v0.1.0)
The foundational library providing unified blockchain interaction capabilities:
- **Dual-Chain Clients**: Unified API wrapping Cive (Core Space) and Viem (eSpace)
- **DevKit Class**: Ergonomic high-level API for common operations
- **Account Management**: Automatic Core↔eSpace address mapping from single mnemonic
- **Local Node Management**: Built-in development node via @xcfx/node
- **Contract Operations**: Deploy and interact with contracts on both chains
- **Mining Controls**: Manual and auto-mining configuration for development
- **Faucet Operations**: Test token distribution for local development
- **TypeScript First**: Full type safety with comprehensive type exports

#### **@conflux-devkit/backend** (v0.1.0)
Production-ready backend services for web applications:
- **Express REST API**: RESTful endpoints for blockchain operations
- **WebSocket Server**: Real-time updates for node status, blocks, and balances
- **DevKit Integration**: Direct use of @conflux-devkit/node for all blockchain ops
- **Authentication**: Development auth service with wallet-based authentication
- **Cross-Chain Swap**: Integrated swap routes for token bridging
- **CLI Support**: Can run as standalone binary (conflux-devkit-backend)
- **Health Monitoring**: Built-in health checks and structured logging (Winston)

#### **@conflux-devkit/frontend** (v2.0.0)
Modern React application for developer interaction:
- **Wallet Integration**: ConnectKit + Wagmi for seamless wallet connection
- **Real-Time UI**: WebSocket-powered live updates
- **Contract Management**: Deploy and interact with contracts via UI
- **Account Dashboard**: View balances and transaction history
- **Dual-Chain UI**: Unified interface for Core Space and eSpace operations
- **Modern Stack**: React 18, TypeScript, Tailwind CSS, Vite

### Key Architecture Decisions

1. **Workspace Structure**: pnpm workspaces with Turbo for optimized builds
2. **Client Abstraction**: Thin wrappers over Cive (Core) and Viem (eSpace)
3. **Unified Accounts**: Single mnemonic generates both Core and eSpace keypairs
4. **Local Development**: Integrated @xcfx/node for instant local testnet
5. **Type Safety**: Strict TypeScript throughout with comprehensive exports
6. **Modular Exports**: Subpath exports for tree-shaking (types, clients, server)

## Essential Commands

### Development
```bash
# Install dependencies (run after cloning)
pnpm install

# Start all services in development mode
pnpm dev

# Start individual services
pnpm dev:node      # Node service only
pnpm dev:backend   # Backend API only
pnpm dev:frontend  # Frontend only
```

### Building and Testing
```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @conflux-devkit/node test
pnpm --filter @conflux-devkit/node test --run  # Single test run

# Type checking
pnpm type-check
pnpm --filter @conflux-devkit/backend type-check
pnpm --filter @conflux-devkit/frontend type-check
```

### Code Quality
```bash
# Lint and format (using Biome)
pnpm check:fix     # Fix all linting and formatting issues
pnpm lint:fix      # Fix linting only
pnpm format:fix    # Fix formatting only
```

### Service Management
```bash
# Production services
pnpm start         # Start all services
pnpm stop          # Stop all services
pnpm restart       # Restart all services
pnpm status        # Check service status

# PM2 management (preferred for production)
pnpm pm2:start
pnpm pm2:status
pnpm pm2:logs
pnpm pm2:restart
```

## Development Workflow

1. **Package Structure**: Each package in `packages/` has independent build/test scripts
2. **Dependencies**: Use `workspace:*` for internal package dependencies
3. **Turbo**: Build orchestration with proper dependency ordering via turbo.json
4. **Testing**: Vitest for unit tests, co-located with source files
5. **Code Style**: Biome for linting/formatting (config in biome.json)

## Package Release Status

### Release Readiness Checklist

**@conflux-devkit/node** ✅ Ready for v0.1.0 release:
- ✅ Proper package.json with publishConfig
- ✅ Export maps configured (main, types, subpaths)
- ✅ README.md present (needs enhancement)
- ✅ TypeScript build configuration (tsup)
- ✅ Repository, homepage, and bugs URLs configured
- ✅ Apache-2.0 license

**@conflux-devkit/backend** ✅ Ready for v0.1.0 release:
- ✅ Proper package.json with publishConfig
- ✅ CLI binary entry point configured
- ✅ Export maps for server and auth modules
- ✅ README.md present
- ✅ Dependencies on @conflux-devkit/node
- ✅ Repository URLs configured
- ✅ Apache-2.0 license

**@conflux-devkit/frontend** ⚠️ Needs review for v2.0.0:
- ⚠️ No publishConfig (private by default)
- ⚠️ No files field specified
- ⚠️ No repository/homepage URLs
- ⚠️ No README.md (should be added)
- ℹ️ May be intended for deployment rather than npm publish

### NPM Publishing

To publish packages:
```bash
# Ensure you're logged into npm
npm login

# Build all packages
pnpm build

# Publish from each package directory
cd packages/node && npm publish
cd packages/backend && npm publish
# Frontend may not be intended for npm publication
```

## Important Notes

- Uses pnpm workspaces with Turbo for monorepo management
- Package manager is pinned to pnpm@10.11.0 (see engines field)
- TypeScript strict mode throughout
- Apache 2.0 licensed with required license headers on source files
- Service management scripts handle PM2, Docker, and development modes