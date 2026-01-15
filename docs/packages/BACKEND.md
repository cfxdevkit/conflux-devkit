# @conflux-devkit/backend

**Version:** 0.1.0  
**Status:** Updated Package  
**Type:** REST API Server

## Purpose
Backend services providing REST API and WebSocket server for DevKit operations. Acts as the bridge between frontend applications and the Conflux blockchain.

## Key Features
- **REST API**: 23+ endpoints for node control, accounts, mining, faucet, contracts
- **WebSocket Server**: Real-time block and transaction streaming
- **Network Capabilities**: Automatic feature gating based on network type
- **RPC Proxy**: Proxies RPC calls to avoid CORS issues
- **Wallet Authentication**: Signature-based auth with admin roles

## API Endpoints

### Node Control
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devkit/status` | GET | Node status, chains, mining info |
| `/api/devkit/node/start` | POST | Start local node |
| `/api/devkit/node/stop` | POST | Stop local node |
| `/api/devkit/node/reset` | POST | Reset node state |

### Accounts & Faucet
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devkit/accounts` | GET | List all accounts |
| `/api/devkit/accounts/:index/balance` | GET | Get account balance |
| `/api/devkit/faucet` | POST | Fund address with test CFX |

### Mining
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devkit/mining/start` | POST | Start auto-mining |
| `/api/devkit/mining/stop` | POST | Stop auto-mining |
| `/api/devkit/mining/mine` | POST | Mine blocks manually |

### Network
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devkit/network/switch` | POST | Switch network (local/testnet/mainnet) |
| `/api/devkit/network/current` | GET | Get current network & capabilities |

## Network Capabilities
```typescript
interface NetworkCapabilities {
  canMine: boolean;        // Local only
  canUseFaucet: boolean;   // Local only
  canControlNode: boolean; // Local only
  canDeploy: boolean;      // All networks (requires wallet on remote)
  canMonitor: boolean;     // All networks
  requiresWallet: boolean; // True for testnet/mainnet
}
```

## WebSocket Events
- `nodeStats` - Block numbers, gas prices, mining status
- `devnode:block` - New block notifications
- `network-switched` - Network change notifications
