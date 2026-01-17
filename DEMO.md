# Conflux DevKit - Quick Start

## Prerequisites
- Node.js 18+
- pnpm 8+
- Docker (optional)

## Quick Start

### 1. Install & Build
```bash
pnpm install
pnpm build
```

### 2. Start the Stack
```bash
# Start both backend and frontend
pnpm dev

# Or start individually:
# Terminal 1: Backend
pnpm dev:backend

# Terminal 2: Frontend
pnpm dev:frontend
```

### 3. Open Dashboard
Navigate to http://localhost:5173

## Features

1. **Connect Wallet** - MetaMask or WalletConnect
2. **Start Node** - Launch local Conflux node
3. **Use Faucet** - Fund addresses with test CFX
4. **Monitor** - Real-time block/transaction streaming
5. **Switch Networks** - Local, Testnet, or Mainnet

## Additional Setup
- Docker: See [DOCKER.md](DOCKER.md)
- DevContainer: See [DEVCONTAINER_SETUP.md](DEVCONTAINER_SETUP.md)
