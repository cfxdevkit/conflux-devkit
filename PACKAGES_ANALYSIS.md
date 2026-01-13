# Conflux DevKit - Package Functionality Analysis

**Date:** 2026-01-13
**Version:** Based on current monorepo state
**Purpose:** Comprehensive analysis of all packages for planning future development work

---

## Table of Contents

1. [Overview](#overview)
2. [Package Details](#package-details)
   - [@conflux-devkit/node](#conflux-devkitnode-v010---core-library)
   - [@conflux-devkit/backend](#conflux-devkitbackend-v010---rest-api--websocket-server)
   - [@conflux-devkit/frontend](#conflux-devkitfrontend-v200---react-application)
3. [Architecture Relationships](#architecture-relationships)
4. [Key Capabilities Matrix](#key-capabilities-matrix)
5. [Export Patterns](#export-patterns)
6. [Future Work Considerations](#future-work-considerations)

---

## Overview

Conflux DevKit is a professional TypeScript monorepo providing a complete development toolkit for building on the Conflux blockchain. It offers seamless dual-chain support for both Conflux Core Space (CFX native) and eSpace (EVM-compatible), making it easy to build cross-chain applications.

### Monorepo Structure

```
conflux-devkit/
├── packages/
│   ├── node/        # Core TypeScript library (v0.1.0)
│   ├── backend/     # Express REST API + WebSocket (v0.1.0)
│   └── frontend/    # React application (v2.0.0)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Package Details

## @conflux-devkit/node (v0.1.0) - Core Library

### Primary Purpose
Foundational TypeScript library providing unified blockchain interaction capabilities for both Conflux Core Space and eSpace (EVM-compatible). This is the core package that all other packages depend on.

### Package Metadata
- **Location:** `/workspace/packages/node`
- **Main Entry:** `dist/index.js`
- **Types:** `dist/index.d.ts`
- **License:** Apache-2.0
- **Status:** ✅ Ready for npm publication

### Core Exports and Functionality

#### 1. DevKit Class (High-Level API)
The primary interface for all development operations. Provides ergonomic methods for common blockchain tasks.

**Account Management:**
```typescript
// Get account by index with full functionality
account(index: number): DevKitAccount

// Get all available accounts
getAccounts(): Promise<AccountInfo[]>

// Generate and add new account
addAccount(): Promise<AccountInfo>

// Get faucet account for distributing test funds
getFaucetAccount(): DevKitAccount

// Get faucet balances
getFaucetBalances(): Promise<{ core: bigint; evm: bigint }>
```

**DevKitAccount Class:**
```typescript
class DevKitAccount {
  // Get balance for specific chain or both
  getBalance(chain?: 'core' | 'evm'): Promise<bigint | { core: bigint; evm: bigint }>

  // Get balances for both chains simultaneously
  getBalances(): Promise<{ core: bigint; evm: bigint }>

  // Request test funds from faucet
  fundFromFaucet(amount: bigint, chain: 'core' | 'evm'): Promise<TransactionReceipt>

  // Transfer funds to another address
  transfer(to: string, amount: bigint, chain: 'core' | 'evm'): Promise<TransactionReceipt>

  // Direct access to wallet clients
  core: CoreWalletClient
  evm: EspaceWalletClient

  // Get addresses for both chains
  address: { core: string; evm: string }
}
```

**Node Lifecycle Management:**
```typescript
// Start development node
start(options?: {
  mining?: boolean;           // Auto-start mining
  waitForBlocks?: boolean;    // Wait for initial blocks
}): Promise<void>

// Stop the development node
stop(): Promise<void>

// Mining controls
startMining(): Promise<void>
stopMining(): Promise<void>
mine(blocks?: number): Promise<void>
getMiningStatus(): Promise<MiningStatus>
setMiningInterval(interval: number): Promise<void>
```

**Contract Operations:**
```typescript
// Deploy contract to one or both chains
deployContract(options: {
  abi: any[];
  bytecode: string;
  chain?: 'core' | 'evm' | 'both';
  constructorArgs?: any[];
  account?: number;
}): Promise<{ core?: Address; evm?: Address }>

// Execute contract read operations
readContract<T = any>(options: {
  address: string;
  abi: any[];
  functionName: string;
  args?: any[];
  chain: 'core' | 'evm';
}): Promise<T>

// Execute contract write operations
writeContract(options: {
  address: string;
  abi: any[];
  functionName: string;
  args?: any[];
  chain: 'core' | 'evm';
  account?: number;
  waitForReceipt?: boolean;
}): Promise<TransactionReceipt>
```

**Chain Management:**
```typescript
// Get chain status for both Core and eSpace
getStatus(): Promise<{
  core: { blockNumber: bigint; chainId: number };
  evm: { blockNumber: bigint; chainId: number };
}>

// Get RPC URLs for both chains
getRpcUrls(): { core: string; evm: string }

// Get current configuration
getConfig(): NodeConfig

// Get Ethereum standard derivation path address
getEthereumAdminAddress(): Promise<string>
```

#### 2. Client Classes (Dual-Chain Support)

**Core Space Clients (Cive-based):**

```typescript
// Public client for reading blockchain data
class CoreClient {
  getBalance(address: string): Promise<bigint>
  getBlockNumber(): Promise<bigint>
  getBlock(blockNumber?: bigint): Promise<Block>
  readContract(options: ReadContractOptions): Promise<any>
  getTransaction(hash: string): Promise<Transaction>
  getTransactionReceipt(hash: string): Promise<TransactionReceipt>
  // ... and more
}

// Wallet client for account operations
class CoreWalletClient {
  sendTransaction(options: TransactionOptions): Promise<string>
  deployContract(options: DeployOptions): Promise<Address>
  writeContract(options: WriteContractOptions): Promise<string>
  callContract(options: CallOptions): Promise<any>
  waitForTransaction(hash: string): Promise<TransactionReceipt>
}

// Test client for development utilities
class CoreTestClient {
  mine(blocks?: number): Promise<void>
  setGasPrice(price: bigint): Promise<void>
  impersonateAccount(address: string): Promise<void>
}
```

**eSpace Clients (Viem-based):**

```typescript
// Public client for eSpace (EVM-compatible)
class EspaceClient {
  getBalance(address: string): Promise<bigint>
  getBlockNumber(): Promise<bigint>
  getBlock(options?: GetBlockOptions): Promise<Block>
  readContract(options: ReadContractOptions): Promise<any>
  getTransaction(hash: string): Promise<Transaction>
  getTransactionReceipt(hash: string): Promise<TransactionReceipt>
  // Standard Ethereum JSON-RPC interface
}

// Wallet client for eSpace account operations
class EspaceWalletClient {
  sendTransaction(options: TransactionOptions): Promise<string>
  deployContract(options: DeployOptions): Promise<Address>
  writeContract(options: WriteContractOptions): Promise<string>
  callContract(options: CallOptions): Promise<any>
  waitForTransaction(hash: string): Promise<TransactionReceipt>
}

// Test client for eSpace development
class EspaceTestClient {
  mine(blocks?: number): Promise<void>
  setBalance(address: string, balance: bigint): Promise<void>
  impersonateAccount(address: string): Promise<void>
}
```

#### 3. ClientManager (Orchestration Layer)

```typescript
class ClientManager {
  // Initialize clients for both chains
  initialize(config: ClientConfig): Promise<void>

  // Get clients
  getCoreClient(): CoreClient
  getCoreWalletClient(account: Account): CoreWalletClient
  getEspaceClient(): EspaceClient
  getEspaceWalletClient(account: Account): EspaceWalletClient

  // Health monitoring
  checkHealth(): Promise<HealthStatus>
  startHealthChecks(interval: number): void
  stopHealthChecks(): void

  // Network switching
  switchNetwork(network: 'local' | 'testnet' | 'mainnet'): Promise<void>

  // Event system
  on(event: 'client:ready' | 'client:error' | 'client:health', handler: Function): void
  off(event: string, handler: Function): void
}
```

#### 4. ServerManager (Node Lifecycle)

```typescript
class ServerManager {
  // Start @xcfx/node instance
  start(config: NodeConfig): Promise<void>

  // Stop node
  stop(): Promise<void>

  // Check if running
  isRunning(): boolean

  // Account generation from mnemonic
  generateAccounts(mnemonic: string, count: number): Account[]

  // Faucet account management
  getFaucetAccount(): Account

  // Mining control
  startMining(interval?: number): Promise<void>
  stopMining(): Promise<void>
  mine(blocks?: number): Promise<void>

  // RPC port management
  getRpcPorts(): { core: number; evm: number }
}
```

#### 5. Chain Configuration

```typescript
// Supported chains with full configuration
const SUPPORTED_CHAINS = [
  // Core Space
  { id: 1029, name: 'Conflux Core Mainnet', type: 'core' },
  { id: 1, name: 'Conflux Core Testnet', type: 'core' },
  { id: 2029, name: 'Conflux Core Local', type: 'core' },

  // eSpace
  { id: 1030, name: 'Conflux eSpace Mainnet', type: 'evm' },
  { id: 71, name: 'Conflux eSpace Testnet', type: 'evm' },
  { id: 2030, name: 'Conflux eSpace Local', type: 'evm' },
];

// Chain configuration utilities
getChainConfig(chainId: SupportedChainId): ChainConfig
isMainnet(chainId: number): boolean
isTestnet(chainId: number): boolean
isLocal(chainId: number): boolean
isCoreSpace(chainId: number): boolean
isEspace(chainId: number): boolean
```

### Key Type Exports

```typescript
// Configuration types
export type ClientConfig = { /* ... */ }
export type WalletConfig = { /* ... */ }
export type TestConfig = { /* ... */ }
export type NodeConfig = { /* ... */ }

// Client types
export type ChainClient = CoreClient | EspaceClient
export type WalletClient = CoreWalletClient | EspaceWalletClient
export type TestClient = CoreTestClient | EspaceTestClient

// Transaction types
export type BaseTransaction = { /* ... */ }
export type TransactionReceipt = { /* ... */ }
export type TransactionOptions = { /* ... */ }

// Account types
export type Account = { /* ... */ }
export type AccountInfo = {
  index: number;
  coreAddress: string;
  evmAddress: string;
  coreBalance: bigint;
  evmBalance: bigint;
}

// Status types
export type MiningStatus = {
  isRunning: boolean;
  interval?: number;
  blockNumber: bigint;
}
export type HealthStatus = {
  healthy: boolean;
  core: boolean;
  evm: boolean;
  lastCheck: Date;
}

// Chain types
export type SupportedChainId = 1029 | 1 | 2029 | 1030 | 71 | 2030
export type ChainType = 'core' | 'evm'
```

### Dependencies

**Blockchain Libraries:**
- `cive` - Conflux Core Space client
- `viem` - Ethereum/eSpace client

**Account Generation:**
- `bip32` - HD wallet derivation
- `bip39` - Mnemonic generation
- `tiny-secp256k1` - Elliptic curve cryptography

**Node Management:**
- `@xcfx/node` - Local Conflux development node

**CLI Tools:**
- `commander` - Command-line interface
- `chalk` - Terminal colors
- `ora` - Loading spinners

### Export Structure

```typescript
// Default export (main entry point)
import { DevKit, DevKitAccount } from '@conflux-devkit/node';

// Subpath exports for tree-shaking
import { CoreClient, CoreWalletClient } from '@conflux-devkit/node/clients';
import type { AccountInfo, MiningStatus } from '@conflux-devkit/node/types';
import { ServerManager } from '@conflux-devkit/node/server';
```

### Usage Example

```typescript
import { DevKit } from '@conflux-devkit/node';

// Initialize DevKit
const devkit = new DevKit({
  chainId: 2029,        // Core Space local
  evmChainId: 2030,     // eSpace local
  jsonrpcHttpPort: 12537,
  jsonrpcHttpEthPort: 8545,
});

// Start local node
await devkit.start({ mining: true });

// Get account
const account = devkit.account(0);
const balances = await account.getBalances();
console.log('Balances:', balances);

// Deploy contract
const { core, evm } = await devkit.deployContract({
  abi: contractAbi,
  bytecode: contractBytecode,
  chain: 'both',
});

// Interact with contract
const result = await devkit.readContract({
  address: core,
  abi: contractAbi,
  functionName: 'getValue',
  chain: 'core',
});
```

---

## @conflux-devkit/backend (v0.1.0) - REST API & WebSocket Server

### Primary Purpose
Production-ready backend service providing REST API endpoints, WebSocket real-time updates, and wallet-based authentication. Acts as a service layer over @conflux-devkit/node.

### Package Metadata
- **Location:** `/workspace/packages/backend`
- **Main Entry:** `dist/index.js`
- **CLI Binary:** `conflux-devkit-backend`
- **License:** Apache-2.0
- **Status:** ✅ Ready for npm publication

### Package Structure

```typescript
// Main export
import { BackendServer } from '@conflux-devkit/backend';

// Specialized exports
import { createDevKitRouter } from '@conflux-devkit/backend/server';
import { DevelopmentAuthService } from '@conflux-devkit/backend/auth';
```

### Core Components

#### 1. BackendServer Class

```typescript
class BackendServer {
  constructor(config: BackendServerConfig);

  // Lifecycle
  start(): Promise<void>
  stop(): Promise<void>

  // Server instances
  getApp(): Express.Application
  getWsServer(): WebSocketServer

  // DevKit instance
  getDevKit(): DevKit
}

interface BackendServerConfig {
  port: number;                    // REST API port (default: 3001)
  wsPort: number;                  // WebSocket port (default: 3002)
  devkitConfig: {
    chainId: number;              // Core Space chain ID
    evmChainId: number;            // eSpace chain ID
    jsonrpcHttpPort: number;      // Core RPC port
    jsonrpcHttpEthPort: number;   // eSpace RPC port
    jsonrpcWsPort?: number;       // Core WS port (optional)
    jsonrpcWsEthPort?: number;    // eSpace WS port (optional)
    log: boolean;                 // Enable logging
    mnemonic?: string;             // Deployer mnemonic
  };
  corsOrigin?: string;             // CORS allowed origin
  logLevel?: string;               // Winston log level
}
```

**Middleware Stack:**
- Helmet (security headers)
- CORS (configurable origin)
- Compression
- JSON body parsing (10MB limit)
- URL-encoded parsing (10MB limit)
- Request logging (Morgan + Winston)

#### 2. REST API Endpoints

##### Status & Information

```typescript
// Public endpoints (no auth required)
GET /health
  Response: { status: 'ok', timestamp: string }

GET /status
  Response: {
    running: boolean,
    mining: boolean,
    chains: {
      core: { blockNumber: string, chainId: number },
      evm: { blockNumber: string, chainId: number }
    },
    accounts: number
  }

// Authenticated endpoints
GET /api/devkit/status
  Response: Same as /status with additional details

GET /api/devkit/network/current
  Response: { network: 'local' | 'testnet' | 'mainnet' }
```

##### Account Management

```typescript
GET /api/devkit/accounts
  Response: AccountInfo[]
  Description: List all accounts with addresses and balances

GET /api/devkit/accounts/:index
  Response: AccountInfo
  Description: Get specific account details

GET /api/devkit/accounts/:index/balance
  Response: { core: string, evm: string }
  Description: Get account balances for both chains

POST /api/devkit/accounts/:index/sign
  Body: { message: string }
  Response: { signature: string }
  Description: Sign message with account private key
```

##### Contract Operations

```typescript
POST /api/devkit/deploy
  Body: {
    abi: any[],
    bytecode: string,
    chain?: 'core' | 'evm' | 'both',
    constructorArgs?: any[],
    account?: number
  }
  Response: {
    core?: string,    // Core Space address if deployed
    evm?: string      // eSpace address if deployed
  }
  Description: Deploy contract to one or both chains

POST /api/devkit/contracts/read
  Body: {
    address: string,
    abi: any[],
    functionName: string,
    args?: any[],
    chain: 'core' | 'evm'
  }
  Response: { result: any }
  Description: Execute contract read operation

POST /api/devkit/contracts/write
  Body: {
    address: string,
    abi: any[],
    functionName: string,
    args?: any[],
    chain: 'core' | 'evm',
    account?: number,
    waitForReceipt?: boolean
  }
  Response: TransactionReceipt
  Description: Execute contract write transaction

GET /api/devkit/contracts/:address
  Query: { chain: 'core' | 'evm' }
  Response: { address: string, chain: string }
  Description: Get contract details
```

##### Transaction Management

```typescript
POST /api/devkit/transactions/send
  Body: {
    to: string,
    value: string,
    chain: 'core' | 'evm',
    account?: number,
    data?: string
  }
  Response: TransactionReceipt
  Description: Send transaction on specified chain
```

##### Node Control (Admin Only)

```typescript
POST /api/devkit/node/start
  Body: { mining?: boolean, waitForBlocks?: boolean }
  Response: { success: boolean }
  Description: Start development node
  Requires: Admin privileges

POST /api/devkit/node/stop
  Response: { success: boolean }
  Description: Stop development node
  Requires: Admin privileges

POST /api/devkit/node/dev-settings
  Body: { blockInterval?: number, packTxImmediately?: boolean }
  Response: { success: boolean }
  Description: Configure block interval and transaction packing
  Requires: Admin privileges
```

##### Mining Control

```typescript
POST /api/devkit/mining/start
  Body: { interval?: number }
  Response: { success: boolean }
  Description: Start mining with optional interval

POST /api/devkit/mining/stop
  Response: { success: boolean }
  Description: Stop mining

POST /api/devkit/mining/mine
  Body: { blocks?: number }
  Response: { success: boolean }
  Description: Mine specific number of blocks manually

POST /api/devkit/mining/interval
  Body: { interval: number }
  Response: { success: boolean }
  Description: Set mining interval in milliseconds

GET /api/devkit/mining/status
  Response: MiningStatus
  Description: Get current mining status
```

##### Network Switching

```typescript
POST /api/devkit/network/switch
  Body: { network: 'local' | 'testnet' | 'mainnet' }
  Response: { success: boolean, network: string }
  Description: Switch between different networks
```

#### 3. Swap Routes (GinsengSwap Integration)

```typescript
POST /api/swap/quote
  Body: {
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippage?: number
  }
  Response: {
    amountOut: string,
    priceImpact: string,
    route: string[]
  }
  Description: Get swap quote from GinsengSwap

GET /api/swap/test-balances
  Query: { address: string }
  Response: { [token: string]: string }
  Description: Get test token balances

GET /api/swap/balances
  Query: { address: string, tokens: string[] }
  Response: { [token: string]: string }
  Description: Get user token balances

POST /api/swap/execute
  Body: {
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOutMin: string,
    account?: number
  }
  Response: TransactionReceipt
  Description: Execute token swap
```

**GinsengSwap Contract Addresses:**
```typescript
const GINSENG_SWAP_ADDRESSES = {
  testnet: {
    factory: '0x...',
    router: '0x...',
    positionManager: '0x...',
    quoter: '0x...',
  },
  mainnet: {
    factory: '0x...',
    router: '0x...',
    positionManager: '0x...',
    quoter: '0x...',
  }
};
```

#### 4. Authentication System

**DevelopmentAuthService:**

```typescript
class DevelopmentAuthService {
  // Challenge generation
  generateChallenge(address: string): Promise<string>

  // Signature verification
  verifySignature(
    address: string,
    signature: string,
    challenge: string
  ): Promise<boolean>

  // Session management
  createSession(address: string): string  // Returns JWT token
  validateSession(token: string): { address: string, isAdmin: boolean } | null

  // Admin detection (first account is admin)
  isAdmin(address: string): Promise<boolean>
}
```

**Authentication Routes:**

```typescript
POST /api/auth/challenge
  Body: { address: string }
  Response: { challenge: string }
  Description: Request signing challenge for wallet auth

POST /api/auth/verify
  Body: { address: string, signature: string, challenge: string }
  Response: {
    token: string,
    address: string,
    isAdmin: boolean
  }
  Description: Verify signature and create session
```

**Authentication Middleware:**

```typescript
// Applied to all /api/devkit/* routes
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = authService.validateSession(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = session;
  next();
}

// Applied to admin-only routes
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
```

#### 5. WebSocket Server (Real-time Updates)

**Connection:**
```typescript
// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:3002');

// Message format
interface WebSocketMessage {
  type: 'nodeStats' | 'blockUpdate' | 'miningUpdate';
  data: any;
}
```

**Broadcast Events:**

```typescript
// Node statistics (broadcast every 2 seconds)
{
  type: 'nodeStats',
  data: {
    core: {
      blockNumber: string,
      chainId: number,
      latestBlock?: {
        hash: string,
        timestamp: number,
        transactions: number
      },
      gasPrice: string
    },
    evm: {
      blockNumber: string,
      chainId: number,
      latestBlock?: {
        hash: string,
        timestamp: number,
        transactions: number
      },
      gasPrice: string
    },
    mining: {
      isRunning: boolean,
      interval?: number
    },
    network: 'local' | 'testnet' | 'mainnet',
    timestamp: number
  }
}

// Block update (on new block)
{
  type: 'blockUpdate',
  data: {
    chain: 'core' | 'evm',
    blockNumber: string,
    block: Block
  }
}

// Mining status update
{
  type: 'miningUpdate',
  data: {
    isRunning: boolean,
    interval?: number
  }
}
```

**WebSocket Features:**
- Automatic reconnection with exponential backoff
- Connection health monitoring
- Client count tracking
- Graceful shutdown handling

### Key Features

**Lazy Node Startup:**
- Node starts on-demand when API is called
- Reduces resource usage when idle
- Automatic initialization on first request

**Network Flexibility:**
- Switch between local, testnet, and mainnet
- Preserve configuration across switches
- Network-specific contract addresses

**Security:**
- Helmet security headers
- CORS protection with configurable origin
- Wallet-based authentication
- Admin privilege system
- Request size limits

**Logging:**
- Winston structured logging
- Configurable log levels
- Request/response logging
- Error tracking

**Graceful Shutdown:**
- SIGINT/SIGTERM handlers
- Close WebSocket connections
- Stop DevKit node
- Close HTTP server

### Dependencies

**Web Framework:**
- `express` - HTTP server
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `compression` - Response compression
- `morgan` - HTTP request logging

**Blockchain:**
- `@conflux-devkit/node` - Core blockchain functionality
- `viem` - Ethereum utilities

**Authentication:**
- `jsonwebtoken` - JWT token generation
- `@types/jsonwebtoken` - TypeScript types

**Real-time:**
- `ws` - WebSocket server

**Logging:**
- `winston` - Structured logging

### Usage Example

```typescript
import { BackendServer } from '@conflux-devkit/backend';

// Create server instance
const server = new BackendServer({
  port: 3001,
  wsPort: 3002,
  devkitConfig: {
    chainId: 2029,
    evmChainId: 2030,
    jsonrpcHttpPort: 12537,
    jsonrpcHttpEthPort: 8545,
    log: true,
  },
  corsOrigin: 'http://localhost:5173',
  logLevel: 'info',
});

// Start server
await server.start();
console.log('Backend running on http://localhost:3001');
console.log('WebSocket running on ws://localhost:3002');

// Handle shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
```

**CLI Usage:**
```bash
# Run as standalone binary
npx conflux-devkit-backend \
  --port 3001 \
  --ws-port 3002 \
  --chain-id 2029 \
  --evm-chain-id 2030 \
  --log-level info
```

---

## @conflux-devkit/frontend (v2.0.0) - React Application

### Primary Purpose
Modern React application providing developer-friendly interface for wallet connection, account management, contract deployment/interaction, and real-time blockchain monitoring.

### Package Metadata
- **Location:** `/workspace/packages/frontend`
- **Build Tool:** Vite
- **Dev Server:** http://localhost:5173
- **License:** Apache-2.0
- **Status:** ⚠️ Not configured for npm publication (intended for deployment)

### Application Structure

```
packages/frontend/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Route pages
│   ├── services/         # API and WebSocket services
│   ├── stores/           # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Root component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── index.html           # HTML entry point
```

### Core Pages

#### 1. Dashboard (`/`)

**Primary Features:**
- Account selector with real-time balance display
- Chain status widget showing block numbers
- Node control panel (start/stop node, mining controls)
- Contract deployment interface
- Contract interaction forms
- Token swap widgets (GinsengSwap, Meson)
- Real-time blockchain statistics

**Key Components:**
```typescript
<Dashboard>
  <Header />
  <AccountSelector />
  <ChainStatusWidget />
  <NodeControlPanel />
  <ContractDeployment />
  <ContractInteraction />
  <GinsengSwapWidget />
  <MesonWidget />
</Dashboard>
```

#### 2. Accounts Page (`/accounts`)

**Features:**
- List all accounts with addresses and balances
- View Core Space (Base32) and eSpace (0x) addresses
- Request test funds from faucet
- Account details and transaction history
- Real-time balance updates

**Key Components:**
```typescript
<AccountsPage>
  <Header />
  <AccountsWidget>
    <AccountCard key={account.index} />
  </AccountsWidget>
</AccountsPage>
```

#### 3. Contracts Page (`/contracts`)

**Features:**
- Deploy contracts with ABI and bytecode input
- Interact with deployed contracts
- Contract method call interface
- Track deployed contract history
- Template support for common contracts

**Key Components:**
```typescript
<ContractsPage>
  <Header />
  <ContractDeployment />
  <ContractInteraction />
  <WalletMethods />
</ContractsPage>
```

### Key Components

#### Wallet & Authentication

**Header Component:**
```typescript
<Header>
  <Logo />
  <Navigation />
  <NetworkDropdown />
  <ConnectButton />  {/* ConnectKit integration */}
</Header>
```

**ConnectButton:**
- ConnectKit UI for wallet connection
- Support for MetaMask, WalletConnect, Coinbase Wallet, etc.
- Automatic connection state management
- Account switching detection

#### Core Widgets

**AccountSelector:**
```typescript
interface AccountSelectorProps {
  onAccountChange?: (index: number) => void;
}

// Features:
// - Dropdown to select account by index
// - Display current account addresses (Core + eSpace)
// - Show real-time balances
// - Quick copy address buttons
```

**ChainStatusWidget:**
```typescript
// Real-time display:
// - Core Space block number
// - eSpace block number
// - Network status (connected/disconnected)
// - Mining status indicator
// - Gas prices for both chains
// - WebSocket connection status
```

**NodeControlPanel:**
```typescript
// Controls:
// - Start/Stop Node button
// - Start/Stop Mining button
// - Mine Blocks button (specify count)
// - Set Mining Interval input
// - Mining status display
// - Admin-only controls
```

**AccountsWidget:**
```typescript
interface AccountsWidgetProps {
  showFaucet?: boolean;
}

// Features:
// - Grid/list view of all accounts
// - Balance display for each account
// - Faucet button to request test funds
// - Account details modal
// - Copy address buttons
```

**AccountCard:**
```typescript
interface AccountCardProps {
  account: AccountInfo;
  onFund?: (index: number, chain: 'core' | 'evm') => void;
}

// Display:
// - Account index
// - Core Space address (Base32)
// - eSpace address (0x)
// - Core balance (CFX)
// - eSpace balance (CFX)
// - Faucet request buttons
```

#### Contract Management

**ContractDeployment:**
```typescript
interface ContractDeploymentProps {
  onDeploy?: (addresses: { core?: string; evm?: string }) => void;
}

// Form fields:
// - ABI input (JSON textarea)
// - Bytecode input
// - Constructor arguments (dynamic based on ABI)
// - Chain selection (Core, eSpace, or Both)
// - Account selector
// - Deploy button

// Features:
// - ABI validation
// - Bytecode validation (0x prefix)
// - Dynamic constructor argument inputs
// - Deployment progress indicator
// - Success notification with addresses
```

**ContractInteraction:**
```typescript
interface ContractInteractionProps {
  initialAddress?: string;
  initialChain?: 'core' | 'evm';
}

// Form fields:
// - Contract address input
// - ABI input (JSON textarea)
// - Chain selection
// - Function selector (dropdown)
// - Function arguments (dynamic based on ABI)
// - Account selector (for write functions)
// - Call button

// Features:
// - Separate tabs for Read/Write functions
// - Dynamic argument inputs based on function ABI
// - Result display for read functions
// - Transaction receipt for write functions
// - Gas estimation
```

**WalletMethods:**
```typescript
// Example operations:
// - Sign message
// - Sign typed data
// - Send transaction
// - Personal sign
// - Each with code examples
```

#### Swap Widgets

**GinsengSwapWidget:**
```typescript
// Features:
// - Token selection (dropdown)
// - Amount input with balance display
// - Swap direction button
// - Slippage tolerance setting
// - Price impact warning
// - Swap quote display
// - Execute swap button
// - Transaction status
```

**MesonWidget:**
```typescript
// Features:
// - Cross-chain swap interface
// - Source/destination chain selection
// - Token selection
// - Amount input
// - Bridge quote
// - Execute bridge button
// - Transaction tracking
```

#### Utilities

**NetworkDropdown:**
```typescript
interface NetworkDropdownProps {
  value: 'local' | 'testnet' | 'mainnet';
  onChange: (network: string) => void;
}

// Options:
// - Local Development (Core: 2029, eSpace: 2030)
// - Testnet (Core: 1, eSpace: 71)
// - Mainnet (Core: 1029, eSpace: 1030)
```

**NetworkSelector:**
```typescript
// Similar to NetworkDropdown but with different styling
// Used in different contexts (header vs. settings)
```

**Toast:**
```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// Features:
// - Auto-dismiss after duration
// - Manual dismiss button
// - Stacking support for multiple toasts
// - Animated transitions
```

**UnifiedNodeDashboard:**
```typescript
// Consolidated view:
// - Node status
// - Chain statistics
// - Account overview
// - Recent transactions
// - Mining information
```

### Services

#### 1. DevKitApiService (HTTP Client)

```typescript
class DevKitApiService {
  private baseURL: string;
  private axios: AxiosInstance;

  // Configuration
  setAuthToken(token: string): void
  clearAuthToken(): void

  // Health
  checkHealth(): Promise<{ status: string, timestamp: string }>
  getStatus(): Promise<StatusResponse>

  // Accounts
  getAccounts(): Promise<AccountInfo[]>
  getAccount(index: number): Promise<AccountInfo>
  getAccountBalance(index: number): Promise<{ core: string, evm: string }>
  signMessage(index: number, message: string): Promise<{ signature: string }>

  // Contracts
  deployContract(options: DeployContractOptions): Promise<DeploymentResult>
  readContract(options: ReadContractOptions): Promise<{ result: any }>
  writeContract(options: WriteContractOptions): Promise<TransactionReceipt>
  getContract(address: string, chain: 'core' | 'evm'): Promise<ContractInfo>

  // Transactions
  sendTransaction(options: SendTransactionOptions): Promise<TransactionReceipt>

  // Node Control (Admin)
  startNode(options?: { mining?: boolean }): Promise<{ success: boolean }>
  stopNode(): Promise<{ success: boolean }>
  setDevSettings(settings: DevSettings): Promise<{ success: boolean }>

  // Mining
  startMining(interval?: number): Promise<{ success: boolean }>
  stopMining(): Promise<{ success: boolean }>
  mine(blocks?: number): Promise<{ success: boolean }>
  setMiningInterval(interval: number): Promise<{ success: boolean }>
  getMiningStatus(): Promise<MiningStatus>

  // Network
  getCurrentNetwork(): Promise<{ network: string }>
  switchNetwork(network: 'local' | 'testnet' | 'mainnet'): Promise<{ success: boolean }>

  // Swap (GinsengSwap)
  getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote>
  getTestBalances(address: string): Promise<Record<string, string>>
  getBalances(address: string, tokens: string[]): Promise<Record<string, string>>
  executeSwap(params: ExecuteSwapParams): Promise<TransactionReceipt>
}

// Singleton instance
export const apiService = new DevKitApiService(
  import.meta.env.VITE_API_URL || 'http://localhost:3001'
);
```

#### 2. DevKitApiServiceWithAuth (Auth Wrapper)

```typescript
class DevKitApiServiceWithAuth extends DevKitApiService {
  // Authentication
  requestChallenge(address: string): Promise<{ challenge: string }>

  verifySignature(params: {
    address: string,
    signature: string,
    challenge: string
  }): Promise<{
    token: string,
    address: string,
    isAdmin: boolean
  }>

  // Automatic token management
  login(address: string, signature: string, challenge: string): Promise<void>
  logout(): void
  isAuthenticated(): boolean

  // Safe request wrapper
  private async request<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 401) {
        this.logout();
        // Redirect to login or show auth modal
      }
      throw error;
    }
  }
}
```

#### 3. WebSocketService (Real-time Updates)

```typescript
interface WebSocketState {
  connected: boolean;
  nodeStats: NodeStats | null;
  latestBlock: {
    core: Block | null;
    evm: Block | null;
  };
  mining: MiningStatus | null;
  error: string | null;
}

// Zustand store
const useWebSocketStore = create<WebSocketState & {
  // Actions
  connect: (url: string) => void;
  disconnect: () => void;
  updateStats: (stats: NodeStats) => void;
  updateBlock: (chain: 'core' | 'evm', block: Block) => void;
  updateMining: (status: MiningStatus) => void;
  setError: (error: string | null) => void;
}>((set, get) => ({
  // Initial state
  connected: false,
  nodeStats: null,
  latestBlock: { core: null, evm: null },
  mining: null,
  error: null,

  // Implementation
  // ...
}));

// Hook for components
function useWebSocket() {
  const store = useWebSocketStore();

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
    store.connect(wsUrl);

    return () => store.disconnect();
  }, []);

  return store;
}

// Features:
// - Automatic reconnection with exponential backoff
// - Connection state tracking
// - TanStack Query cache invalidation on updates
// - Error handling and recovery
// - Heartbeat/ping-pong for connection health
```

### Stores (State Management)

#### authStore (Zustand)

```typescript
interface AuthState {
  // State
  isConnected: boolean;
  address: string | null;
  isAdmin: boolean;
  token: string | null;

  // Actions
  connect: (address: string, token: string, isAdmin: boolean) => void;
  disconnect: () => void;
  setAdmin: (isAdmin: boolean) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      isAdmin: false,
      token: null,

      connect: (address, token, isAdmin) => set({
        isConnected: true,
        address,
        token,
        isAdmin,
      }),

      disconnect: () => set({
        isConnected: false,
        address: null,
        token: null,
        isAdmin: false,
      }),

      setAdmin: (isAdmin) => set({ isAdmin }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### React Query Integration

```typescript
// Query keys
export const queryKeys = {
  accounts: ['accounts'] as const,
  account: (index: number) => ['account', index] as const,
  balance: (index: number) => ['balance', index] as const,
  status: ['status'] as const,
  network: ['network'] as const,
  miningStatus: ['mining-status'] as const,
  contract: (address: string, chain: string) => ['contract', address, chain] as const,
};

// Custom hooks
function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => apiService.getAccounts(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

function useAccount(index: number) {
  return useQuery({
    queryKey: queryKeys.account(index),
    queryFn: () => apiService.getAccount(index),
    enabled: index >= 0,
  });
}

function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: () => apiService.getStatus(),
    refetchInterval: 2000,
  });
}

// Mutations
function useDeployContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: DeployContractOptions) =>
      apiService.deployContract(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

function useStartMining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (interval?: number) => apiService.startMining(interval),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.miningStatus });
    },
  });
}
```

### UI Technologies

**Core Stack:**
- React 18 (with TypeScript)
- React Router v6 (client-side routing)
- Vite (build tool and dev server)
- Tailwind CSS (utility-first styling)

**State Management:**
- Zustand (lightweight state management)
- TanStack Query / React Query (server state caching)
- React Context (global configuration)

**Wallet Integration:**
- ConnectKit (wallet connection UI)
- Wagmi (React hooks for Ethereum)
- Ethers.js (message signing, transaction building)
- Viem (transaction utilities)

**HTTP & WebSocket:**
- Axios (HTTP client)
- WebSocket API (native browser)

**UI Components:**
- Lucide React (icon library)
- Custom Tailwind components

**Swap Integration:**
- @mesonfi/to (Meson cross-chain bridge widget)
- Custom GinsengSwap integration

### Environment Configuration

```bash
# .env file
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002

# Network RPC URLs (for wallet integration)
VITE_CORE_LOCAL_RPC=http://localhost:12537
VITE_ESPACE_LOCAL_RPC=http://localhost:8545
VITE_CORE_TESTNET_RPC=https://test.confluxrpc.com
VITE_ESPACE_TESTNET_RPC=https://evmtestnet.confluxrpc.com
VITE_CORE_MAINNET_RPC=https://main.confluxrpc.com
VITE_ESPACE_MAINNET_RPC=https://evm.confluxrpc.com
```

### Key Features

**Real-time Updates:**
- WebSocket connection for live blockchain data
- Automatic cache invalidation on updates
- Real-time block number display
- Mining status indicators
- Balance updates

**Wallet Integration:**
- Connect any EVM wallet (MetaMask, WalletConnect, etc.)
- Automatic account detection
- Network switching support
- Sign messages and transactions

**Dual-Chain UI:**
- Unified interface for Core Space and eSpace
- Side-by-side chain status display
- Cross-chain deployment support
- Address format conversion

**Development Focus:**
- Easy account management
- Faucet integration for test funds
- Quick contract deployment
- Interactive contract testing
- Mining controls

**Network Flexibility:**
- Switch between local, testnet, mainnet
- Network-specific configurations
- RPC endpoint management

**Admin Functions:**
- Node start/stop (admin only)
- Mining controls (admin only)
- Development settings (admin only)
- Admin badge display

### Build & Deployment

```bash
# Development
pnpm dev                    # Start dev server on port 5173

# Build
pnpm build                  # Build for production
pnpm preview                # Preview production build

# Type checking
pnpm type-check            # Run TypeScript type checking

# Linting
pnpm lint                  # Run linter
pnpm lint:fix              # Fix linting issues
```

**Build Output:**
- Static files in `dist/` directory
- Optimized for production
- Code splitting enabled
- Asset optimization

**Deployment Options:**
- Static hosting (Vercel, Netlify, Cloudflare Pages)
- Docker container
- Traditional web server (nginx, Apache)

---

## Architecture Relationships

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│         @conflux-devkit/frontend (React SPA)            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ UI Components (React + Tailwind)                │   │
│  │  - Dashboard, Accounts, Contracts pages         │   │
│  │  - Wallet connection (ConnectKit + Wagmi)       │   │
│  │  - Real-time widgets                            │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────────┐   │
│  │ Services & State Management                     │   │
│  │  - DevKitApiService (Axios HTTP)                │   │
│  │  - WebSocketService (Zustand)                   │   │
│  │  - TanStack Query (cache)                       │   │
│  │  - authStore (Zustand)                          │   │
│  └──────────────┬──────────────────────────────────┘   │
└─────────────────┼──────────────────────────────────────┘
                  │ HTTP REST API (port 3001)
                  │ WebSocket (port 3002)
                  │
┌─────────────────▼──────────────────────────────────────┐
│      @conflux-devkit/backend (Express Server)          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ REST API Routes                                 │   │
│  │  - /api/devkit/* (DevKit operations)            │   │
│  │  - /api/swap/* (GinsengSwap)                    │   │
│  │  - /api/auth/* (Authentication)                 │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────────┐   │
│  │ WebSocket Server                                │   │
│  │  - Real-time node statistics                    │   │
│  │  - Block updates broadcast                      │   │
│  │  - Mining status updates                        │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────────┐   │
│  │ Authentication & Security                       │   │
│  │  - DevelopmentAuthService (wallet-based)        │   │
│  │  - JWT token management                         │   │
│  │  - Middleware (CORS, Helmet, auth)              │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────────┐   │
│  │ DevKit Instance (singleton)                     │   │
│  │  - Manages blockchain interactions              │   │
│  │  - Controls local node                          │   │
│  └──────────────┬──────────────────────────────────┘   │
└─────────────────┼──────────────────────────────────────┘
                  │ DevKit API
                  │
┌─────────────────▼──────────────────────────────────────┐
│  @conflux-devkit/node (TypeScript Library)             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ DevKit Class (High-Level API)                   │   │
│  │  - Account management                           │   │
│  │  - Contract operations                          │   │
│  │  - Node lifecycle                               │   │
│  │  - Mining controls                              │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────────┐   │
│  │ Client Manager (Orchestration)                  │   │
│  │  - Health monitoring                            │   │
│  │  - Network switching                            │   │
│  │  - Event system                                 │   │
│  └────┬─────────────────────────────────────────┬──┘   │
│       │                                          │      │
│  ┌────▼─────────────────┐    ┌─────────────────▼───┐  │
│  │ Core Space Clients   │    │ eSpace Clients      │  │
│  │  - CoreClient        │    │  - EspaceClient     │  │
│  │  - CoreWalletClient  │    │  - EspaceWalletClient│ │
│  │  - CoreTestClient    │    │  - EspaceTestClient │  │
│  │  (Cive-based)        │    │  (Viem-based)       │  │
│  └────┬─────────────────┘    └─────────────────────┬─┘ │
│       │                                             │   │
│  ┌────▼─────────────────────────────────────────────▼─┐ │
│  │ Server Manager (Node Lifecycle)                    │ │
│  │  - @xcfx/node wrapper                              │ │
│  │  - Account generation (BIP32/BIP39)                │ │
│  │  - Mining control                                  │ │
│  │  - RPC port management                             │ │
│  └──────────────┬─────────────────────────────────────┘ │
└─────────────────┼──────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────┐
│      Blockchain Layer                                   │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │ Conflux Core Space   │    │ Conflux eSpace       │  │
│  │  - Native CFX        │    │  - EVM-compatible    │  │
│  │  - Base32 addresses  │    │  - 0x addresses      │  │
│  │  - Cive client       │    │  - Viem client       │  │
│  └──────────────────────┘    └──────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ @xcfx/node (Local Development Node)             │   │
│  │  - Instant local testnet                        │   │
│  │  - Configurable mining                          │   │
│  │  - Test account management                      │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

**User Action → API → Blockchain:**
```
User clicks "Deploy Contract"
  ↓
Frontend: ContractDeployment component
  ↓
Frontend: apiService.deployContract()
  ↓
HTTP POST /api/devkit/deploy
  ↓
Backend: DevKit routes handler
  ↓
Backend: devkit.deployContract()
  ↓
Node: DevKit.deployContract()
  ↓
Node: CoreWalletClient.deployContract() | EspaceWalletClient.deployContract()
  ↓
Node: Cive/Viem client sends transaction
  ↓
Blockchain: Contract deployed
  ↓
Node: Return transaction receipt
  ↓
Backend: Return deployment result
  ↓
Frontend: Update UI, invalidate cache
  ↓
WebSocket: Broadcast block update
  ↓
Frontend: Live update displayed
```

**Real-time Updates Flow:**
```
Blockchain: New block mined
  ↓
Node: Cive/Viem client detects new block
  ↓
Backend: WebSocket server polls for updates
  ↓
Backend: Broadcast nodeStats message
  ↓
Frontend: WebSocket receives message
  ↓
Frontend: Update Zustand store
  ↓
Frontend: Invalidate TanStack Query cache
  ↓
Frontend: Components re-render with new data
  ↓
UI: Block number updates, balances refresh
```

### Package Dependencies

```
@conflux-devkit/frontend
  ├── @conflux-devkit/backend (HTTP/WebSocket API)
  └── External: react, wagmi, connectkit, viem, axios

@conflux-devkit/backend
  ├── @conflux-devkit/node (workspace:*)
  └── External: express, ws, jsonwebtoken

@conflux-devkit/node
  └── External: cive, viem, @xcfx/node, bip32, bip39
```

### Network Communication

**HTTP REST API (Frontend ↔ Backend):**
- Port: 3001 (default)
- Protocol: HTTP/HTTPS
- Format: JSON
- Auth: JWT Bearer token

**WebSocket (Frontend ↔ Backend):**
- Port: 3002 (default)
- Protocol: WS/WSS
- Format: JSON messages
- Bidirectional communication

**RPC (Backend ↔ Blockchain):**
- Core Space HTTP RPC: 12537 (local), 80/443 (public)
- eSpace HTTP RPC: 8545 (local), 80/443 (public)
- Core Space WS RPC: Optional
- eSpace WS RPC: Optional

---

## Key Capabilities Matrix

| Capability | Node Package | Backend | Frontend | Details |
|------------|--------------|---------|----------|---------|
| **Account Management** | ✅ DevKit class | ✅ REST API | ✅ UI Pages | Create, fund, transfer, sign |
| **Dual-Chain Support** | ✅ Core/Espace clients | ✅ Routes | ✅ Selectors | Unified API for both chains |
| **Contract Deployment** | ✅ DevKit.deployContract() | ✅ POST /deploy | ✅ Component | Single or dual-chain deployment |
| **Contract Interaction** | ✅ read/writeContract | ✅ POST /read,/write | ✅ Component | Call contract methods |
| **Node Lifecycle** | ✅ ServerManager | ✅ POST /node/* | ✅ Panel | Start/stop local node |
| **Mining Control** | ✅ DevKit.mine() | ✅ POST /mining/* | ✅ Panel | Manual/auto mining |
| **Real-time Updates** | ✅ Events | ✅ WebSocket | ✅ WS service | Live blockchain stats |
| **Wallet Auth** | ✅ Account keys | ✅ Challenge/verify | ✅ ConnectKit | Signature-based auth |
| **Network Switching** | ✅ Chain config | ✅ POST /network/switch | ✅ Dropdown | Local/testnet/mainnet |
| **Faucet Support** | ✅ fundFromFaucet() | ✅ Integrated | ✅ Widget | Test token distribution |
| **Health Monitoring** | ✅ ClientManager | ✅ /health | ✅ Status display | Node health checks |
| **Transaction Management** | ✅ waitForTransaction | ✅ POST /send | ✅ Status tracking | Send and track txs |
| **Swap Integration** | ❌ N/A | ✅ GinsengSwap routes | ✅ Swap widgets | Token swaps |
| **Cross-chain Bridge** | ❌ N/A | ❌ N/A | ✅ Meson widget | Cross-chain transfers |
| **CLI Support** | ✅ Commander | ✅ Binary | ❌ N/A | Command-line interface |
| **Admin Controls** | ✅ All operations | ✅ Admin middleware | ✅ Admin UI | Privileged operations |
| **Logging** | ✅ Optional | ✅ Winston | ✅ Console | Structured logging |
| **TypeScript Support** | ✅ Full types | ✅ Full types | ✅ Full types | End-to-end type safety |

---

## Export Patterns

### @conflux-devkit/node

**Main Entry Point:**
```typescript
import { DevKit, DevKitAccount } from '@conflux-devkit/node';
```

**Subpath Exports (Tree-shaking):**
```typescript
// Clients
import {
  CoreClient,
  CoreWalletClient,
  EspaceClient,
  EspaceWalletClient
} from '@conflux-devkit/node/clients';

// Types
import type {
  AccountInfo,
  MiningStatus,
  NodeConfig,
  TransactionReceipt
} from '@conflux-devkit/node/types';

// Server utilities
import {
  ServerManager,
  ClientManager
} from '@conflux-devkit/node/server';
```

**package.json exports:**
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js"
    },
    "./clients": {
      "types": "./dist/clients/index.d.ts",
      "import": "./dist/clients/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.js"
    }
  }
}
```

### @conflux-devkit/backend

**Main Export:**
```typescript
import { BackendServer } from '@conflux-devkit/backend';
```

**Specialized Exports:**
```typescript
// Server utilities
import { createDevKitRouter, createSwapRouter } from '@conflux-devkit/backend/server';

// Authentication
import { DevelopmentAuthService } from '@conflux-devkit/backend/auth';
```

**CLI Binary:**
```bash
npx conflux-devkit-backend --port 3001 --ws-port 3002
```

**package.json exports:**
```json
{
  "bin": {
    "conflux-devkit-backend": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.js"
    },
    "./auth": {
      "types": "./dist/auth/index.d.ts",
      "import": "./dist/auth/index.js"
    }
  }
}
```

### @conflux-devkit/frontend

**Not Published to npm:**
- Frontend is a deployable application, not a library
- Built as static files for hosting
- No exports intended for consumption

**Build Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [static files]
```

**Deployment:**
```bash
# Build for production
pnpm build

# Deploy to static hosting
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - S3: aws s3 sync dist/ s3://bucket-name/
```

---

## Future Work Considerations

### Package Enhancement Opportunities

#### @conflux-devkit/node

**High Priority:**
1. **Enhanced Documentation**
   - Comprehensive API reference with examples
   - Tutorial for common use cases
   - Migration guide from raw Cive/Viem

2. **Testing Infrastructure**
   - More unit tests for core functionality
   - Integration tests for dual-chain operations
   - Mock server for testing without blockchain

3. **Developer Experience**
   - Better error messages with suggestions
   - Debug mode with verbose logging
   - Performance monitoring and metrics

4. **Feature Additions**
   - Batch transaction support
   - Transaction simulation before execution
   - Gas estimation helpers
   - Event subscription and filtering
   - Historical data queries

**Medium Priority:**
5. **Multi-Network Support**
   - Easy mainnet/testnet switching
   - Network configuration presets
   - Custom network definitions

6. **Advanced Account Management**
   - Hardware wallet support
   - Multi-sig wallet integration
   - Account import/export utilities

7. **Contract Tools**
   - Contract verification utilities
   - ABI management helpers
   - Contract upgrade patterns

**Low Priority:**
8. **Performance Optimization**
   - Connection pooling
   - Request caching
   - Parallel request optimization

#### @conflux-devkit/backend

**High Priority:**
1. **Production Readiness**
   - Rate limiting configuration
   - API key authentication option
   - Request validation middleware
   - Enhanced error handling

2. **Documentation**
   - API endpoint reference
   - WebSocket protocol documentation
   - Deployment guide
   - Configuration examples

3. **Monitoring & Observability**
   - Prometheus metrics endpoint
   - Request tracing
   - Performance monitoring
   - Error tracking integration

4. **Security Enhancements**
   - API key rotation
   - IP whitelisting
   - Request signing
   - HTTPS enforcement

**Medium Priority:**
5. **Feature Additions**
   - Webhook support for events
   - Transaction history endpoints
   - Block explorer API
   - Event log querying

6. **Scalability**
   - Redis session store
   - WebSocket clustering
   - Load balancer support
   - Horizontal scaling guide

7. **Developer Tools**
   - OpenAPI/Swagger documentation
   - Postman collection
   - SDK generation scripts

**Low Priority:**
8. **Advanced Features**
   - GraphQL API option
   - REST API versioning
   - Custom plugin system

#### @conflux-devkit/frontend

**High Priority:**
1. **User Experience**
   - Loading states and skeletons
   - Error boundary components
   - Offline mode support
   - Mobile responsive improvements

2. **Documentation**
   - Component documentation
   - Deployment guide
   - Configuration reference
   - Customization guide

3. **Testing**
   - Component unit tests
   - E2E tests with Playwright
   - Visual regression tests
   - Accessibility testing

4. **Feature Completions**
   - Transaction history page
   - Block explorer interface
   - Event log viewer
   - Advanced contract debugging

**Medium Priority:**
5. **Developer Experience**
   - Storybook for components
   - Component playground
   - Theme customization
   - Internationalization (i18n)

6. **Performance**
   - Code splitting optimization
   - Image optimization
   - Bundle size reduction
   - Lazy loading strategies

7. **Advanced Features**
   - Dark mode toggle
   - Custom RPC endpoints
   - Multi-account management
   - Batch operations UI

**Low Priority:**
8. **Integrations**
   - More DEX integrations
   - NFT marketplace support
   - Analytics dashboard
   - Social features

### Cross-Package Improvements

**High Priority:**
1. **Unified Error Handling**
   - Standard error codes across packages
   - Consistent error message format
   - Error recovery strategies

2. **Type Sharing**
   - Shared types package
   - Type generation from API schemas
   - OpenAPI type generation

3. **Configuration Management**
   - Unified configuration format
   - Environment-based configs
   - Configuration validation

**Medium Priority:**
4. **Development Tools**
   - Monorepo-wide testing script
   - Integrated debugging setup
   - Shared development utilities

5. **CI/CD Pipeline**
   - Automated testing on PR
   - Version bump automation
   - Release notes generation
   - Package publishing workflow

6. **Documentation Site**
   - Unified documentation portal
   - API reference
   - Tutorials and guides
   - Example projects

### Release Planning

**v0.2.0 (Next Minor Release):**
- [ ] Enhanced documentation for all packages
- [ ] Additional test coverage (>80%)
- [ ] Production-ready backend features
- [ ] Frontend E2E tests
- [ ] Performance optimizations

**v0.3.0:**
- [ ] Multi-network switching improvements
- [ ] Advanced contract tools
- [ ] WebSocket clustering support
- [ ] Mobile-optimized frontend

**v1.0.0 (Stable Release):**
- [ ] Complete API stability
- [ ] Comprehensive documentation
- [ ] Full test coverage
- [ ] Production deployment guide
- [ ] Security audit completed

### Community & Ecosystem

**Documentation:**
- [ ] Video tutorials
- [ ] Blog post series
- [ ] Example project repository
- [ ] Community cookbook

**Integration:**
- [ ] More DEX protocol support
- [ ] NFT tooling
- [ ] DeFi protocol templates
- [ ] DAO governance tools

**Developer Tools:**
- [ ] VSCode extension
- [ ] Browser devtools extension
- [ ] CLI enhancements
- [ ] Testing framework

---

## Appendix

### Useful Commands Reference

```bash
# Development
pnpm install              # Install dependencies
pnpm dev                  # Start all services
pnpm dev:node             # Start node only
pnpm dev:backend          # Start backend only
pnpm dev:frontend         # Start frontend only

# Building
pnpm build                # Build all packages
pnpm build --filter @conflux-devkit/node
pnpm build --filter @conflux-devkit/backend
pnpm build --filter @conflux-devkit/frontend

# Testing
pnpm test                 # Run all tests
pnpm test --run           # Single test run (no watch)
pnpm --filter @conflux-devkit/node test

# Code Quality
pnpm check:fix            # Fix linting and formatting
pnpm lint:fix             # Fix linting
pnpm format:fix           # Fix formatting
pnpm type-check           # TypeScript type checking

# Service Management
pnpm start                # Start all services (production)
pnpm stop                 # Stop all services
pnpm restart              # Restart all services
pnpm status               # Check service status

# PM2 (Production)
pnpm pm2:start            # Start with PM2
pnpm pm2:status           # Check PM2 status
pnpm pm2:logs             # View PM2 logs
pnpm pm2:restart          # Restart PM2 services
pnpm pm2:stop             # Stop PM2 services

# Publishing
cd packages/node && npm publish
cd packages/backend && npm publish
```

### Package Versions

| Package | Version | Status | NPM Ready |
|---------|---------|--------|-----------|
| @conflux-devkit/node | 0.1.0 | ✅ Stable | ✅ Yes |
| @conflux-devkit/backend | 0.1.0 | ✅ Stable | ✅ Yes |
| @conflux-devkit/frontend | 2.0.0 | ⚠️ Higher version | ❌ Not for npm |

### Key Technologies

**Node Package:**
- TypeScript, Node.js, Cive, Viem, BIP32/39, @xcfx/node

**Backend Package:**
- Express, WebSocket (ws), JWT, Winston, Axios

**Frontend Package:**
- React 18, Vite, Tailwind, Wagmi, ConnectKit, TanStack Query, Zustand

### Repository Information

- **License:** Apache-2.0
- **Repository:** https://github.com/conflux-dao/conflux-devkit
- **Issues:** https://github.com/conflux-dao/conflux-devkit/issues
- **Homepage:** https://github.com/conflux-dao/conflux-devkit#readme

---

**Document Version:** 1.0
**Last Updated:** 2026-01-13
**Maintainer:** Conflux DevKit Team
