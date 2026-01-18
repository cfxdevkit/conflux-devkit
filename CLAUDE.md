# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Conflux DevKit is a professional TypeScript monorepo providing a complete development toolkit for building on the Conflux blockchain. It offers seamless dual-chain support for both Conflux Core Space (CFX native) and eSpace (EVM-compatible), making it easy to build cross-chain applications.

## Project Architecture

### Layered Architecture

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

### Core Packages (Publishable on npm)

#### **@conflux-devkit/core** (v0.1.0) - Foundation Layer
The base library providing blockchain client abstractions:
- **ClientManager**: Orchestration layer managing both chains simultaneously
- **CoreClient/EspaceClient**: Thin wrappers over Cive (Core Space) and Viem (eSpace)
- **Chain Configuration**: Network definitions (local/testnet/mainnet) for both chains
- **Type System**: Foundation types exported for all packages to use
- **Subpath Exports**: `/clients`, `/types`, `/config`, `/utils` for tree-shaking

Key architectural pattern: Core package has NO dev node dependencies - it's pure client abstraction suitable for production use.

#### **@conflux-devkit/plugin-devnode** (v0.1.0) - Plugin Layer
Optional plugin for local development features:
- **Local Node**: Wraps @xcfx/node for integrated dev blockchain
- **Account Management**: BIP39/BIP32 HD wallet generation (Core ↔ eSpace address mapping)
- **Mining Controls**: Manual and auto-mining configuration
- **Faucet Operations**: Test token distribution

This package is intentionally separated from core - applications don't need it in production.

#### **@conflux-devkit/backend** (v0.1.0) - Service Layer
Production-ready backend services:
- **Express REST API**: `/api/devkit/*` endpoints for blockchain operations
- **WebSocket Server**: Real-time streaming architecture (see Real-Time Streaming section)
- **DevKit Compatibility**: Legacy DevKit class wrapper in `devkit-compat.ts`
- **CLI Binary**: Can run as standalone binary (`conflux-devkit-backend`)
- **Subpath Exports**: `/server`, `/auth`, `/services`, `/plugins`

#### **@conflux-devkit/frontend** (v1.0.0) - Presentation Layer
Modern React application:
- **Wallet Integration**: ConnectKit + Wagmi for Web3 wallets
- **Real-Time UI**: WebSocket client consuming backend streams
- **Component Libraries**: Mantine UI components
- **State Management**: Zustand + TanStack Query
- **Dev Server**: Vite dev server on port 5173, backend proxied

#### **@conflux-devkit/wallet** (v0.1.0) - Plugin Layer
Advanced wallet abstractions (session keys, batching, embedded wallets) - currently in development.

#### **@conflux-devkit/contracts** (v0.1.0) - Plugin Layer
Contract deployment and interaction utilities with standard ABIs (ERC20, ERC721, ERC1155).

#### **@conflux-devkit/ui-headless** (v1.0.0) - Presentation Layer
Headless React components and hooks for building custom UIs. Can be styled with Tailwind CSS.

### Key Architecture Decisions

1. **Workspace Structure**: pnpm workspaces with Turbo for build orchestration
2. **Client Abstraction**: Thin wrappers over Cive (Core) and Viem (eSpace), not complete reimplementation
3. **Plugin Pattern**: Optional features like dev node are separate packages with peer dependencies
4. **Real-Time Architecture**: WebSocket-based streaming for blocks/transactions (500ms polling backend → real-time WebSocket → frontend)
5. **Type Safety**: Strict TypeScript with comprehensive type exports from foundation layer
6. **Modular Exports**: Subpath exports pattern (`@conflux-devkit/core/clients`) for optimal tree-shaking
7. **Monorepo Tooling**: Turbo for task orchestration, Biome for linting/formatting (not ESLint/Prettier)

## Essential Commands

### Development
```bash
# Install dependencies (run after cloning or pulling package.json changes)
pnpm install

# Start all services (backend on :3001, frontend on :5173)
pnpm dev

# Start individual services
pnpm dev:backend   # Backend API + WebSocket server
pnpm dev:frontend  # Vite dev server

# Build all packages (required before testing/type-checking)
pnpm build
```

### Testing
```bash
# Run all tests (requires build first)
pnpm test

# Run specific package tests
pnpm --filter @conflux-devkit/core test
pnpm --filter @conflux-devkit/plugin-devnode test

# Run tests in watch mode (useful during development)
pnpm --filter @conflux-devkit/core test:watch

# Run single test (no watch mode)
pnpm --filter @conflux-devkit/core test --run
```

### Code Quality
```bash
# Lint and format (using Biome, not ESLint/Prettier)
pnpm check:fix     # Fix all linting and formatting issues (recommended)
pnpm lint:fix      # Fix linting only
pnpm format:fix    # Fix formatting only

# Type checking (runs tsc --noEmit)
pnpm type-check
pnpm --filter @conflux-devkit/backend type-check
```

### Building
```bash
# Build all packages (uses Turbo task orchestration)
pnpm build

# Build specific package
pnpm --filter @conflux-devkit/core build

# Watch mode for development
pnpm --filter @conflux-devkit/core build:watch
```

### Cleanup and Reset
```bash
# Clean build artifacts
pnpm clean        # Clean dist/ directories
pnpm clean:cache  # Clean Turbo and build tool caches
pnpm clean:builds # Remove all dist/, .next/, build/ directories

# Full reset (when dependency issues occur)
pnpm reset        # clean:all + install + build
```

### Utilities
```bash
# Check/kill ports (when services don't start)
pnpm ports:check  # Check if ports 3000-3002 are in use
pnpm ports:kill   # Kill processes on those ports

# Get session token (for testing authenticated endpoints)
pnpm session:token
```

## Development Workflow

### Package Structure
Each package in `packages/` follows this pattern:
- `src/` - TypeScript source files
- `dist/` - Build output (generated, not committed)
- `package.json` - Package metadata and scripts
- `tsup.config.ts` - Build configuration (for library packages)
- `tsconfig.json` - TypeScript configuration extending workspace root

### Dependency Management
- **Internal Dependencies**: Always use `workspace:*` protocol (e.g., `"@conflux-devkit/core": "workspace:*"`)
- **Peer Dependencies**: Used for optional plugins (e.g., plugin-devnode has core as peer dependency)
- **External Dependencies**: Cive (Core Space), Viem (eSpace), @xcfx/node (local dev node)

### Build Orchestration (Turbo)
Build tasks run in dependency order automatically:
1. `core` builds first (foundation layer)
2. `plugin-devnode`, `wallet`, `contracts`, `ui-headless` build next (depend on core)
3. `backend` builds after plugins (depends on plugin-devnode)
4. `frontend` builds last (depends on core, ui-headless, and backend for types)

See [turbo.json](/workspace/turbo.json) for task dependency configuration.

### Testing Strategy
- **Framework**: Vitest (not Jest) with coverage via @vitest/coverage-v8
- **Location**: Tests co-located with source files (e.g., `src/clients/manager.test.ts`)
- **Run Tests**: Always run `pnpm build` before `pnpm test` (tests may import built artifacts)
- **Coverage**: `pnpm --filter <package> test:coverage`

### Code Style (Biome)
- **Formatter**: 2-space indentation, 80 char line width, single quotes, semicolons always
- **Linter**: Recommended rules + custom overrides for TypeScript strictness
- **Config**: [biome.json](/workspace/biome.json) at workspace root
- **Auto-fix**: `pnpm check:fix` runs both linting and formatting fixes

## Real-Time Streaming Architecture

The DevKit uses a WebSocket-based real-time streaming architecture for blockchain monitoring, eliminating the previous HTTP polling gaps.

### Backend (WebSocketServer)
**Location:** [packages/backend/src/server/WebSocketServer.ts](/workspace/packages/backend/src/server/WebSocketServer.ts)

**Key Features:**
- **500ms Polling Loop**: Matches mining interval for smooth streaming
- **Dual-Chain Monitoring**: Tracks both Core Space epochs and eSpace blocks
- **Deduplication**: Uses `lastCoreEpoch` and `lastEvmBlock` to avoid re-broadcasting
- **Transaction Filtering**: Only broadcasts blocks containing transactions
- **Event Types**: `newBlocks` (block/transaction data) and `nodeStats` (mining status, gas prices)

**WebSocket Message Format:**
```typescript
{
  type: 'newBlocks',
  data: {
    blocks: [{ blockNumber, timestamp, chainType, transactionCount, transactions }],
    currentCoreEpoch: number,
    currentEvmBlock: number
  },
  timestamp: string
}
```

### Frontend (BlockchainMonitor)
**Location:** [packages/frontend/src/components/BlockchainMonitor.tsx](/workspace/packages/frontend/src/components/BlockchainMonitor.tsx)

**Architecture:**
- **No HTTP Polling**: Removed all REST API calls for block fetching
- **WebSocket Subscription**: Listens to `newBlocks` events for real-time updates
- **Auto-pruning**: Keeps last 1000 blocks in memory to prevent unbounded growth
- **Dual Subscription**: `newBlocks` for data, `nodeStats` for metrics

**Benefits:**
- **Zero Gap Updates**: 500ms updates vs previous 5-30 second polling
- **No Data Loss**: All blocks captured vs previous "last 5 blocks" limitation
- **Better UX**: Smooth, continuous updates with immediate transaction feedback

See [REALTIME_STREAMING.md](/workspace/REALTIME_STREAMING.md) for complete architecture details.

## Package Release Status

### Ready for npm Publishing

**@conflux-devkit/core** ✅ v0.1.0
- Proper publishConfig and export maps
- Foundation package with no dev dependencies
- Repository URLs configured

**@conflux-devkit/plugin-devnode** ✅ v0.1.0
- Peer dependency on @conflux-devkit/core
- Wraps @xcfx/node for local development

**@conflux-devkit/backend** ✅ v0.1.0
- CLI binary entry point configured
- Export maps for server and auth modules

**@conflux-devkit/wallet** ✅ v0.1.0
- Advanced wallet abstractions
- Session keys, batching, embedded wallets

**@conflux-devkit/contracts** ✅ v0.1.0
- Contract utilities with standard ABIs

**@conflux-devkit/ui-headless** ✅ v1.0.0
- Headless React components
- Peer dependency on React 18

**@conflux-devkit/frontend** ⚠️ v1.0.0
- No publishConfig (likely intended for deployment, not npm)
- Missing files field and repository URLs
- May remain private package

### Publishing Workflow
```bash
# Ensure you're logged into npm
npm login

# Build all packages
pnpm build

# Publish from each package directory
cd packages/core && npm publish
cd packages/plugin-devnode && npm publish
cd packages/backend && npm publish
# etc.
```

## Important Notes

- **Package Manager**: Pinned to pnpm@10.11.0 (see engines field in root package.json)
- **Node Version**: Requires Node.js >=18.0.0
- **TypeScript**: Strict mode enabled throughout (5.9.3)
- **License**: Apache 2.0 with required license headers on all source files
- **Git Branch**: Main branch is `dev` (not `main` or `master`)