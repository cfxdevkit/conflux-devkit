# @conflux-devkit/backend

A simplified backend service for Conflux DevKit with clean API + WebSocket integration. Provides ready-to-use REST API and WebSocket server with DevKit integration.

## Features

- **Express REST API** - Clean RESTful endpoints for blockchain operations
- **WebSocket Server** - Real-time updates and event streaming
- **DevKit Integration** - Built on `@conflux-devkit/node` for dual-chain support
- **Authentication** - Simple wallet-based auth for development
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
    mnemonic: 'your twelve word mnemonic phrase here...'
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
  AuthService,
  DevelopmentAuthService,
  createDevKitRoutes,
  logger
} from '@conflux-devkit/backend';

// Use WebSocket server standalone
const wsServer = new DevKitWebSocketServer(devkit, 3002);
await wsServer.start();

// Use auth service
const auth = new DevelopmentAuthService();

// Create custom routes
const router = express.Router();
router.use('/devkit', createDevKitRoutes(devkit, auth));
```

## API Endpoints

The backend provides these REST endpoints:

- `GET /api/devkit/status` - Get DevKit status
- `POST /api/devkit/accounts` - Create/manage accounts
- `POST /api/devkit/transactions` - Send transactions
- `GET /api/devkit/balance/:address` - Get account balance
- `POST /api/swap/*` - Cross-chain swap operations

## WebSocket Events

Real-time events via WebSocket:

- `devkit:status` - DevKit status updates
- `devkit:transaction` - Transaction confirmations
- `devkit:block` - New block notifications
- `devkit:error` - Error notifications

## Configuration

### Environment Variables

```bash
PORT=3001                           # REST API port
WS_PORT=3002                        # WebSocket port
HARDHAT_VAR_DEPLOYER_MNEMONIC=...   # Wallet mnemonic
```

### DevKit Configuration

```typescript
interface DevKitConfig {
  chainId: number;              // Core Space chain ID
  evmChainId: number;          // eSpace chain ID
  jsonrpcHttpPort: number;     // Core HTTP RPC port
  jsonrpcHttpEthPort: number;  // eSpace HTTP RPC port
  jsonrpcWsPort?: number;      // Core WS RPC port
  jsonrpcWsEthPort?: number;   // eSpace WS RPC port
  log: boolean;                // Enable logging
  mnemonic?: string;           // Wallet mnemonic
}
```

## Development

This package is part of the [Conflux DevKit](https://github.com/conflux-devkit/conflux-devkit) monorepo.

### Building

```bash
npm run build    # Build the package
npm run dev      # Development mode
npm run start    # Start production server
```

### Testing

```bash
npm test         # Run tests
```

## Dependencies

- **@conflux-devkit/node** - Core DevKit functionality
- **express** - Web framework
- **ws** - WebSocket implementation
- **helmet** - Security middleware
- **cors** - CORS middleware

## License

Apache-2.0