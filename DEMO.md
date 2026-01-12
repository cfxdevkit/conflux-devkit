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

# Conflux DevKit - Local Demo Guide

This guide walks you through running the complete Conflux DevKit stack locally, demonstrating the integration of all three packages: `@conflux-devkit/node`, `@conflux-devkit/backend`, and `@conflux-devkit/frontend`.

## Overview

The demo showcases:
- **Backend Service**: Using `@conflux-devkit/backend` with `@conflux-devkit/node` integration
- **Frontend Application**: React UI connecting to backend REST API and WebSocket
- **Local Blockchain**: Instant local Conflux Core Space and eSpace nodes
- **Account Management**: View addresses, balances, and manage accounts
- **Contract Operations**: Deploy and interact with smart contracts
- **Real-Time Updates**: WebSocket streaming of blockchain events

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher
- **Git**: For cloning the repository

## Quick Start

### 1. Install Dependencies

```bash
# Clone the repository (if not already done)
git clone https://github.com/cfxdevkit/conflux-devkit.git
cd conflux-devkit

# Install all dependencies
pnpm install
```

### 2. Build All Packages

```bash
# Build the entire monorepo
pnpm build
```

This builds:
- `@conflux-devkit/node` → Core library with blockchain clients
- `@conflux-devkit/backend` → REST API + WebSocket server
- `@conflux-devkit/frontend` → React application

### 3. Configure Environment (Optional)

Create a `.env` file in the root directory:

```bash
# Deployer mnemonic (optional - uses test mnemonic by default)
HARDHAT_VAR_DEPLOYER_MNEMONIC="your twelve word mnemonic phrase here"

# Backend ports (optional - defaults shown)
PORT=3001
WS_PORT=3002

# Frontend proxy is configured in vite.config.ts
```

**Note**: If you don't provide a mnemonic, the demo will use a standard test mnemonic. This is fine for local development but should never be used in production.

### 4. Start the Full Stack

#### Option A: Start All Services Together

```bash
# Start backend and frontend concurrently
pnpm dev
```

This starts:
- **Backend**: `http://localhost:3001` (REST API)
- **WebSocket**: `ws://localhost:3002` (Real-time updates)
- **Frontend**: `http://localhost:3000` (React UI)

#### Option B: Start Services Individually

In separate terminal windows:

```bash
# Terminal 1 - Start Backend
pnpm dev:backend

# Terminal 2 - Start Frontend
pnpm dev:frontend
```

### 5. Access the Demo

Open your browser and navigate to:

**Frontend UI**: [http://localhost:3000](http://localhost:3000)

The frontend will automatically connect to the backend API and WebSocket server.

## Demo Features

### 1. Dashboard

The main dashboard displays:
- **Node Status**: View Core Space and eSpace node status
- **Node Controls**: Start/stop the local blockchain node
- **Mining Controls**: Configure auto-mining or mine blocks manually
- **Network Selection**: Switch between local, testnet, and mainnet
- **Real-Time Updates**: Live blockchain data via WebSocket

### 2. Accounts Page

Manage development accounts:
- View all accounts derived from the mnemonic
- See both Core Space (`cfx:...`) and eSpace (`0x...`) addresses
- Check balances on both chains
- Copy addresses and private keys for development
- Request test tokens from the faucet

### 3. Contracts Page

Deploy and interact with smart contracts:
- **Deploy Contracts**: Input ABI, bytecode, and constructor args
- **Select Chain**: Deploy to Core Space or eSpace
- **Interact**: Call read/write functions on deployed contracts
- **Contract History**: View previously deployed contracts

### 4. Cross-Chain Features

The demo showcases dual-chain capabilities:
- Single account with addresses on both chains
- View balances across Core Space and eSpace
- Deploy contracts to either chain
- Unified API for both chains

## Architecture Overview

### Backend Service

Located in `packages/backend/`, the backend:

```typescript
import { BackendServer } from '@conflux-devkit/backend';

const server = new BackendServer({
  port: 3001,
  wsPort: 3002,
  devkitConfig: {
    chainId: 2029,        // Core Space local
    evmChainId: 2030,     // eSpace local
    mnemonic: process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC,
  },
});

await server.start();
```

**Key Features**:
- Express REST API with routes for all blockchain operations
- WebSocket server for real-time blockchain events
- Development authentication service
- Direct integration with `@conflux-devkit/node`

### Frontend Application

Located in `packages/frontend/`, the React app:

**Tech Stack**:
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- React Query for data fetching
- Zustand for state management
- ConnectKit + Wagmi for wallet integration

**API Integration**:
```typescript
// REST API calls
const status = await DevKitApiService.getDevKitStatus();
const accounts = await DevKitApiService.getAllAccounts();

// WebSocket connection
const ws = new WebSocket('ws://localhost:3002');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

### DevKit Core

Located in `packages/node/`, the core library provides:

```typescript
import { DevKit } from '@conflux-devkit/node';

const devkit = new DevKit({
  chainId: 2029,
  evmChainId: 2030,
  autoStart: true,
});

// Start local node
await devkit.start();

// Get accounts
const account = devkit.account(0);
console.log('Core:', account.address.core);
console.log('EVM:', account.address.evm);

// Deploy contract
const contract = await account.deploy({
  chain: 'evm',
  abi: contractAbi,
  bytecode: contractBytecode,
});
```

## API Endpoints

The backend exposes these REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/status` | Public status (unauthenticated) |
| `GET` | `/api/devkit/status` | DevKit status with node info |
| `GET` | `/api/devkit/accounts` | List all accounts |
| `GET` | `/api/devkit/accounts/:index` | Get specific account |
| `GET` | `/api/devkit/accounts/:index/balance` | Get account balance |
| `POST` | `/api/devkit/deploy` | Deploy contract |
| `POST` | `/api/devkit/node/start` | Start local node |
| `POST` | `/api/devkit/node/stop` | Stop local node |
| `POST` | `/api/devkit/mining/start` | Start auto-mining |
| `POST` | `/api/devkit/mining/stop` | Stop auto-mining |
| `POST` | `/api/devkit/mining/mine` | Mine blocks manually |
| `POST` | `/api/devkit/transactions/send` | Send transaction |
| `POST` | `/api/devkit/contracts/read` | Read contract function |
| `POST` | `/api/devkit/contracts/write` | Write contract function |

## WebSocket Events

The WebSocket server streams these events:

```javascript
{
  "type": "node_status",
  "data": {
    "core": { "status": "running", "blockNumber": 123 },
    "evm": { "status": "running", "blockNumber": 456 }
  }
}

{
  "type": "block_mined",
  "data": {
    "chain": "core",
    "blockNumber": 124,
    "timestamp": "2025-01-12T16:45:00Z"
  }
}

{
  "type": "balance_changed",
  "data": {
    "address": "cfx:...",
    "balance": "1000.5",
    "chain": "core"
  }
}
```

## Testing the Integration

### 1. Test Backend Directly

```bash
# Check health
curl http://localhost:3001/api/health

# Get status
curl http://localhost:3001/api/status

# Start the node
curl -X POST http://localhost:3001/api/devkit/node/start

# Get accounts
curl http://localhost:3001/api/devkit/accounts
```

### 2. Test WebSocket

```javascript
// In browser console or Node.js
const ws = new WebSocket('ws://localhost:3002');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

### 3. Use the Frontend

1. Open [http://localhost:3000](http://localhost:3000)
2. Connect your wallet (MetaMask, Fluent, etc.)
3. Navigate to Dashboard → Start the node
4. Go to Accounts → View your development accounts
5. Try Contracts → Deploy a simple contract

## Troubleshooting

### Backend Won't Start

**Issue**: Port already in use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

**Issue**: DevKit node fails to start

```bash
# Check if Conflux node ports are available
lsof -i :12537  # Core Space HTTP
lsof -i :8545   # eSpace HTTP

# Stop any conflicting processes
```

### Frontend Can't Connect

**Issue**: CORS errors

The Vite dev server has a proxy configured. Ensure:
- Backend is running on port 3001
- Frontend is running on port 3000
- Check `packages/frontend/vite.config.ts`

**Issue**: WebSocket connection fails

Check:
- WebSocket server is running on port 3002
- Browser console for connection errors
- Firewall settings

### Build Errors

```bash
# Clean and rebuild
pnpm clean
pnpm build

# Check for TypeScript errors
pnpm type-check
```

## Production Deployment

For production deployment:

### Backend

```bash
# Build
cd packages/backend
pnpm build

# Start with PM2
pm2 start dist/index.js --name conflux-devkit-backend

# Or use systemd service
```

### Frontend

```bash
# Build
cd packages/frontend
pnpm build

# The dist/ folder contains static files
# Deploy to any static hosting:
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - GitHub Pages
# - Any CDN or web server
```

## Next Steps

- Explore the [conflux-box](https://github.com/cfxdevkit/conflux-box) repository for a standalone demo
- Read the [API documentation](./README.md#package-documentation)
- Check individual package READMEs:
  - [@conflux-devkit/node](./packages/node/README.md)
  - [@conflux-devkit/backend](./packages/backend/README.md)
  - [@conflux-devkit/frontend](./packages/frontend/README.md)

## Resources

- **Conflux Documentation**: https://doc.confluxnetwork.org/
- **Conflux Scan**: https://confluxscan.io/
- **Community Discord**: https://discord.gg/conflux

## License

Apache-2.0

Copyright 2025 Conflux DevKit Team

---

**Happy Building! 🚀**
