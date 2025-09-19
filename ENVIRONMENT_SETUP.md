# Environment Setup for Codespaces and Cursor

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Node Environment
NODE_ENV=development

# API Server Configuration
API_PORT=3001
API_HOST=0.0.0.0

# Showcase WebApp Configuration
VITE_API_URL=http://localhost:3001
VITE_APP_TITLE=Conflux DevKit Dashboard

# DevKit Node Configuration
DEVKIT_NODE_PORT=8080
DEVKIT_NODE_HOST=0.0.0.0

# Conflux Network Configuration
CONFLUX_NETWORK=testnet
CONFLUX_RPC_URL=https://test.confluxrpc.com
CONFLUX_CHAIN_ID=1

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Codespaces Configuration

The workspace is configured with:
- Node.js 20 with TypeScript support
- pnpm package manager
- Port forwarding for 3000, 3001, and 8080
- Auto-installation of dependencies on container creation

## Cursor Configuration

The workspace includes:
- TypeScript and React development extensions
- Biome for linting and formatting
- Turbo for monorepo management
- Vitest for testing
- Tailwind CSS support

## Quick Start

1. Open in Codespaces or Cursor
2. Run `pnpm install` to install dependencies
3. Copy `.env.template` to `.env.local` and configure
4. Run `pnpm run start:full-stack` to start all services
