# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a TypeScript monorepo for Conflux blockchain development with dual-chain support (Core Space + eSpace). The project provides a unified development experience through three main packages:

- **@conflux-devkit/node** - Core library for blockchain interaction and local node management
- **@conflux-devkit/backend** - REST API + WebSocket backend services
- **@conflux-devkit/frontend** - React frontend with wallet integration (ConnectKit/Wagmi)

The architecture supports both Conflux Core Space and EVM-compatible eSpace through unified APIs and account management.

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

## Key Architecture Points

### DevKit Core (@conflux-devkit/node)
- Unified dual-chain support through single DevKit class
- Account abstraction with Core Space + eSpace address mapping
- Local development node management via @xcfx/node
- Built on Cive (Core Space) and Viem (eSpace) clients

### Backend Services (@conflux-devkit/backend)
- Express REST API for node management and blockchain operations
- WebSocket server for real-time updates (node status, blocks, balances)
- Direct integration with @conflux-devkit/node package

### Frontend (@conflux-devkit/frontend)
- React with TypeScript and Tailwind CSS
- Wallet integration via ConnectKit and Wagmi
- Real-time data via WebSocket connection to backend
- Dual-chain UI supporting both Core Space and eSpace

## Important Notes

- Uses pnpm workspaces with Turbo for monorepo management
- Package manager is pinned to pnpm@10.11.0 (see engines field)
- TypeScript strict mode throughout
- Apache 2.0 licensed with required license headers on source files
- Service management scripts handle PM2, Docker, and development modes