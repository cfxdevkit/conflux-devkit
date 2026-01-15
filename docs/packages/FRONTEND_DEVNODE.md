# @conflux-devkit/frontend-devnode

**Version:** 1.0.0  
**Status:** Updated Package  
**Type:** React Dashboard

## Purpose
Modern React dashboard for managing local Conflux development nodes. Provides a complete UI for node lifecycle, mining, accounts, and blockchain monitoring.

## Tech Stack
- **React 18** with TypeScript
- **Mantine UI 7** component library
- **Wagmi 2.12** wallet integration
- **Zustand** state management
- **Vite** build tooling

## Features

### DevNode Tab
- Node status display (running/stopped, chain IDs, RPC URLs)
- Start/Stop/Restart controls
- Configuration options (ports, account count)
- Mining controls (auto/manual with interval)

### Accounts Tab
- List of generated development accounts
- Core Space and eSpace addresses
- Live balance display
- Copy-to-clipboard functionality

### Deployments Tab
- Contract deployment interface (placeholder)

### Monitor Tab
- Real-time block streaming
- Transaction feed with filtering
- Address/contract filters for remote networks

### Navbar Controls
- **Network Dropdown**: Switch between local/testnet/mainnet
- **Faucet Button**: Quick access to test token distribution
- **Wallet Info**: Connected address with admin badge

## Network-Aware Features
| Feature | Local | Testnet | Mainnet |
|---------|-------|---------|---------|
| Node Control | ✅ | ❌ | ❌ |
| Mining | ✅ | ❌ | ❌ |
| Faucet | ✅ | ❌ | ❌ |
| Monitor | ✅ All | ✅ Filtered | ✅ Filtered |
| Deploy | ✅ | ✅ | ✅ |

## Running Locally
```bash
cd packages/frontend-devnode
pnpm install
pnpm dev
```

Requires backend running at `http://localhost:3001`.
