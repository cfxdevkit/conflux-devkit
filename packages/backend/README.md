# @conflux-devkit/backend

A production-ready backend service for Conflux DevKit with clean API + WebSocket integration. Provides REST API, WebSocket server, and secure keystore management for dual-chain blockchain development.

## Features

- **Express REST API** - Clean RESTful endpoints for blockchain operations
- **WebSocket Server** - Real-time updates and event streaming
- **DevKit Integration** - Built on `@conflux-devkit/plugin-devnode` for dual-chain support
- **Initial Setup Wizard** - Mandatory setup flow for secure configuration
- **Multi-Admin Support** - Multiple admin addresses with equal rights
- **Keystore Management** - Encrypted storage for mnemonics and derived keys
- **Authentication** - Wallet signature-based auth for development and production
- **TypeScript** - Full type safety and excellent DX
- **CLI Support** - Can be used as a standalone service

## Installation

```bash
npm install @conflux-devkit/backend
# or
yarn add @conflux-devkit/backend
# or
pnpm add @conflux-devkit/backend
```

## Quick Start

### Initial Setup

When running for the first time, the backend requires initial setup. This can be done via:

1. **Web UI** - Visit the frontend and complete the setup wizard
2. **API** - Use the setup endpoints programmatically

```typescript
// Check setup status
const response = await fetch('/api/setup/status');
const { setupCompleted } = await response.json();

if (!setupCompleted) {
  // Complete setup with required data
  await fetch('/api/setup/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminAddress: '0x1234...', // First admin wallet address
      mnemonic: 'word1 word2 ...', // 12 or 24 word BIP-39 mnemonic
      mnemonicLabel: 'Production',
      nodeConfig: {
        accountsCount: 10,
        chainId: 2029,
        evmChainId: 2030,
      },
      encryption: {
        enabled: true,
        password: 'securePassword123',
      },
    }),
  });
}
```

### As a Library

```typescript
import { BackendServer, BackendServerConfig } from '@conflux-devkit/backend';

const config: BackendServerConfig = {
  port: 3001,
  wsPort: 3002,
  devkitConfig: {
    chainId: 2029,        // Core Space chain ID
    evmChainId: 2030,     // eSpace chain ID
    jsonrpcHttpPort: 12537,
    jsonrpcHttpEthPort: 8545,
    log: false,
  }
};

const server = new BackendServer(config);
await server.start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
```

### As a CLI Tool

```bash
# Install globally
npm install -g @conflux-devkit/backend

# Run with default configuration
conflux-devkit-backend

# Or run locally
npx @conflux-devkit/backend
```

### Using Individual Components

```typescript
import {
  DevKitWebSocketServer,
  DevelopmentAuthService,
  KeystoreService,
  createDevKitRoutes,
  createSetupRoutes,
  createWalletRoutes,
  createAdminRoutes,
  logger
} from '@conflux-devkit/backend';

// Use keystore service
const keystore = new KeystoreService();
const isSetup = await keystore.isSetupCompleted();

// Create custom routes
const app = express();
app.use('/api/setup', createSetupRoutes());
app.use('/api/wallet', createWalletRoutes(authService));
app.use('/api/admin', createAdminRoutes(authService));
```

## API Endpoints

### Setup Endpoints (Public)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/setup/status` | GET | Check if initial setup is completed |
| `/api/setup/generate-mnemonic` | POST | Generate a new BIP-39 mnemonic |
| `/api/setup/validate` | POST | Validate setup data before completion |
| `/api/setup/complete` | POST | Complete initial setup |

### Admin Endpoints (Requires Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/list` | GET | List all admin addresses |
| `/api/admin/add` | POST | Add a new admin address |
| `/api/admin/:address` | DELETE | Remove an admin address |
| `/api/admin/check/:address` | GET | Check if address is admin |

### Wallet Endpoints (Requires Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet/list` | GET | List all wallets (mnemonics) |
| `/api/wallet/status` | GET | Get current wallet status |
| `/api/wallet/add` | POST | Add a new mnemonic |
| `/api/wallet/switch/:id` | POST | Switch active mnemonic |
| `/api/wallet/:id` | DELETE | Delete a mnemonic |
| `/api/wallet/:id/accounts` | GET | Get derived accounts |
| `/api/wallet/:id/config` | GET | Get node configuration |
| `/api/wallet/:id/config` | PUT | Update node configuration |
| `/api/wallet/unlock` | POST | Unlock encrypted keystore |
| `/api/wallet/lock` | POST | Lock the keystore |

### DevKit Endpoints (Requires Auth + Setup)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devkit/status` | GET | Get DevKit status |
| `/api/devkit/node/start` | POST | Start the dev node |
| `/api/devkit/node/stop` | POST | Stop the dev node |
| `/api/devkit/accounts` | GET | Get all accounts |
| `/api/devkit/balance/:address` | GET | Get account balance |
| `/api/swap/*` | POST | Cross-chain swap operations |

## WebSocket Events

Real-time events via WebSocket:

| Event | Description |
|-------|-------------|
| `nodeStats` | Node status updates (block numbers, gas prices) |
| `newBlocks` | New block notifications with transactions |
| `devnode:block` | Individual block events |
| `devnode:error` | Error notifications |

## Keystore Schema (v2)

The backend uses a secure keystore format for storing mnemonics and configuration:

```typescript
interface KeystoreV2 {
  version: 2;
  encryptionEnabled: boolean;
  encryptionSalt?: string;
  adminAddresses: string[];
  mnemonics: MnemonicEntry[];
  activeIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface MnemonicEntry {
  id: string;
  label: string;
  encryptedMnemonic: string;
  isActive: boolean;
  isTestMnemonic?: boolean;
  createdAt: string;
  nodeConfig: NodeConfig;
}

interface NodeConfig {
  accountsCount: number;  // 1-20
  chainId: number;        // Default: 2029
  evmChainId: number;     // Default: 2030
  miningAuthor?: string;
}
```

## Security Features

### Encryption

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2-SHA256 (100,000 iterations)
- **Salt**: 32 bytes random
- **IV**: 12 bytes random per encryption

### Admin Management

- Multiple admin addresses supported
- All admins have equal rights
- Cannot remove the last admin
- Cannot remove yourself as admin

### Setup Requirements

- Admin address must be a valid Ethereum address
- Mnemonic must be a valid BIP-39 phrase (12 or 24 words)
- Password minimum 8 characters (12+ recommended)
- Account count: 1-20
- Chain IDs must be positive integers

## Configuration

### Environment Variables

```bash
PORT=3001                    # REST API port
WS_PORT=3002                 # WebSocket port
DEVKIT_KEYSTORE_PATH=...     # Custom keystore path (optional)
DEVKIT_DATA_DIR=...          # Custom data directory (optional)
```

### Resetting Configuration

From the monorepo root:

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

Or manually:

```bash
# Delete keystore (triggers setup wizard on next start)
rm ~/.devkit.keystore.json

# Delete all blockchain data
rm -rf ~/.conflux-dev
```

### DevKit Configuration

```typescript
interface DevKitConfig {
  chainId: number;              // Core Space chain ID
  evmChainId: number;           // eSpace chain ID
  jsonrpcHttpPort: number;      // Core HTTP RPC port
  jsonrpcHttpEthPort: number;   // eSpace HTTP RPC port
  jsonrpcWsPort?: number;       // Core WS RPC port
  jsonrpcWsEthPort?: number;    // eSpace WS RPC port
  log: boolean;                 // Enable logging
  accountsCount?: number;       // Genesis accounts (from keystore)
}
```

## Development

This package is part of the [Conflux DevKit](https://github.com/cfxdevkit/conflux-devkit) monorepo.

### Building

```bash
pnpm build    # Build the package
pnpm dev      # Development mode
pnpm start    # Start production server
```

### Testing

```bash
pnpm test         # Run tests
pnpm type-check   # Type checking
```

### File Structure

```
src/
├── auth/                    # Authentication services
│   ├── AuthService.ts
│   └── DevelopmentAuthService.ts
├── middleware/              # Express middleware
│   └── setup-check.ts       # Setup requirement check
├── routes/                  # API route handlers
│   ├── admin.ts             # Admin management
│   ├── devkit.ts            # DevKit operations
│   ├── setup.ts             # Initial setup
│   ├── swap.ts              # Cross-chain swaps
│   └── wallet.ts            # Wallet management
├── server/                  # Server implementations
│   ├── BackendServer.ts     # Main Express server
│   └── WebSocketServer.ts   # WebSocket server
├── services/                # Business logic
│   ├── keystore-service.ts  # Keystore management
│   ├── encryption-service.ts # Encryption utilities
│   └── setup-service.ts     # Setup flow
├── types/                   # TypeScript types
│   └── keystore.ts          # Keystore interfaces
├── utils/                   # Utilities
│   └── logger.ts            # Winston logger
├── devkit-compat.ts         # DevKit compatibility layer
├── devkit-manager.ts        # DevKit instance manager
└── index.ts                 # Package entry point
```

## Dependencies

- **@conflux-devkit/core** - Core blockchain clients
- **@conflux-devkit/plugin-devnode** - Local development node
- **@scure/bip39** - BIP-39 mnemonic handling
- **express** - Web framework
- **ws** - WebSocket implementation
- **helmet** - Security middleware
- **cors** - CORS middleware

## License

Apache-2.0
