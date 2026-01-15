# CLI Implementation Plan & Architecture Review

## Table of Contents
1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Package Responsibilities](#package-responsibilities)
3. [Backend API Completeness](#backend-api-completeness)
4. [CLI Implementation Plan](#cli-implementation-plan)
5. [Modularity Recommendations](#modularity-recommendations)

---

## Current Architecture Analysis

### Package Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FOUNDATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   @conflux-devkit/core                                                       │
│   ├── cive (Core Space client)                                              │
│   ├── viem (EVM/eSpace client)                                              │
│   └── Exports: ClientManager, ChainConfig, NetworkSelector                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               PLUGIN LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   @conflux-devkit/plugin-devnode        @conflux-devkit/wallet               │
│   ├── @xcfx/node (local node)           └── Wallet utilities                 │
│   ├── Account generation (BIP32/39)                                          │
│   └── Mining controls                   @conflux-devkit/contracts            │
│                                         └── Contract ABIs & tooling          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   @conflux-devkit/backend                                                    │
│   ├── Express REST API (23+ endpoints)                                       │
│   ├── WebSocket server (real-time updates)                                   │
│   ├── Authentication (wallet signature + sessions)                           │
│   └── DevKitCompat (bridges backend to plugin-devnode)                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PRESENTATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   @conflux-devkit/frontend-devnode      @conflux-devkit/ui-headless          │
│   ├── React + Mantine UI                ├── Headless React components        │
│   ├── Wagmi (wallet connection)         ├── Render props pattern             │
│   ├── WebSocket client                  └── Hooks for blockchain ops         │
│   └── Zustand state management                                               │
│                                                                              │
│   @conflux-devkit/cli (PROPOSED)                                             │
│   ├── Ink (React for CLI)                                                    │
│   ├── HTTP client to backend API                                             │
│   └── Shared hooks/logic where possible                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Issues & Observations

#### 1. **Separation of Concerns**
- ✅ **Good**: Clear layering between core/plugin/service/presentation
- ⚠️ **Issue**: `frontend-devnode` has some business logic that should be in backend
- ⚠️ **Issue**: `ui-headless` hooks make direct RPC calls instead of going through backend

#### 2. **Backend as Single Source of Truth**
- ✅ **Good**: Most operations go through `/api/devkit/*` endpoints
- ⚠️ **Issue**: Frontend sometimes bypasses backend for monitoring (direct RPC calls)
- ⚠️ **Issue**: Some UI state is derived locally instead of from backend

#### 3. **Package `@conflux-devkit/node`**
- ~~⚠️ **Redundant**: Currently just re-exports `@conflux-devkit/core`~~
- ✅ **REMOVED**: Package deleted as it was redundant

---

## Package Responsibilities

### Current Responsibilities

| Package | Responsibility | Dependencies |
|---------|---------------|--------------|
| `core` | Blockchain clients, chain config, network management | cive, viem |
| ~~`node`~~ | ~~(Redundant) Re-exports core~~ | ~~(REMOVED)~~ |
| `plugin-devnode` | ServerManager, account generation, mining | core, @xcfx/node |
| `wallet` | Wallet utilities | (minimal) |
| `contracts` | ABI management, contract interaction helpers | core |
| `backend` | REST API, WebSocket, auth, DevKitCompat | plugin-devnode |
| `frontend-devnode` | React dashboard UI | backend (via HTTP/WS) |
| `ui-headless` | Reusable headless React components | (direct RPC) |

### Recommended Responsibilities

| Package | Should Handle | Should NOT Handle |
|---------|--------------|-------------------|
| `core` | Client creation, chain config, types | Node lifecycle, accounts |
| `plugin-devnode` | Local node management, accounts, mining | HTTP API |
| `backend` | ALL blockchain operations via API | Direct node management |
| `frontend-*` | UI rendering only | Direct RPC calls |
| `cli` | CLI rendering only | Direct RPC calls |

---

## Backend API Completeness

### Current Endpoints (23+)

```
STATUS & INFO
├── GET  /status                 ✅ Node status, chain info, mining status
├── GET  /node/info              ✅ Node configuration
└── POST /rpc/:chain             ✅ RPC proxy (Core/EVM)

ACCOUNTS
├── GET  /accounts               ✅ List all accounts + faucet
├── GET  /accounts/:index        ✅ Get account by index
├── GET  /accounts/:index/balance ✅ Get account balance
└── GET  /balance/address/:address ✅ Get balance by address

FAUCET
└── POST /faucet                 ✅ Fund address from faucet

NODE CONTROL
├── POST /node/start             ✅ Start dev node
├── POST /node/stop              ✅ Stop dev node
├── POST /node/reset             ✅ Reset node (optional clear data)
└── POST /node/clear-data        ✅ Clear blockchain data

MINING
├── POST /mining/start           ✅ Start auto-mining
├── POST /mining/stop            ✅ Stop auto-mining
├── POST /mining/interval        ✅ Set mining interval
└── POST /mining/mine            ✅ Mine blocks manually

CONTRACTS
├── POST /contracts/read         ✅ Read contract (call)
├── POST /contracts/write        ✅ Write contract (send tx)
└── GET  /contracts/:address     ✅ Get contract info

TRANSACTIONS
├── POST /transactions/send      ✅ Send transaction
└── POST /deploy                 ✅ Deploy contract

NETWORK
├── POST /network/switch         ✅ Switch network (local/testnet/mainnet)
└── GET  /network/current        ✅ Get current network
```

### Missing Endpoints for CLI Parity

```
MONITORING (needed for CLI)
├── GET  /blocks                 ❌ List recent blocks
├── GET  /blocks/:number         ❌ Get block by number
├── GET  /transactions           ❌ List recent transactions
└── GET  /transactions/:hash     ❌ Get transaction by hash

ADVANCED OPERATIONS (nice-to-have)
├── POST /accounts/generate      ❌ Generate new accounts
├── GET  /logs                   ❌ Get event logs
├── POST /simulate               ❌ Simulate transaction
└── GET  /gas/estimate           ❌ Estimate gas for operation
```

---

## CLI Implementation Plan

### Technology Choice: Ink

**Why Ink?**
1. **React-based** - Familiar component model, can share mental models with frontend
2. **Flexbox layout** - Same layout concepts as web
3. **Hooks support** - Can potentially share hooks logic
4. **Well-maintained** - Used by Claude Code, GitHub Copilot CLI, Cloudflare Wrangler
5. **Rich ecosystem** - ink-table, ink-spinner, ink-select-input, etc.

### CLI Package Structure

```
packages/cli/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── src/
    ├── index.tsx              # Entry point, command parsing
    ├── app.tsx                # Main Ink app component
    │
    ├── api/                   # Backend API client
    │   ├── client.ts          # HTTP client (axios/fetch)
    │   └── types.ts           # API response types
    │
    ├── commands/              # Command implementations
    │   ├── status.tsx         # cfx status
    │   ├── node/
    │   │   ├── start.tsx      # cfx node start
    │   │   ├── stop.tsx       # cfx node stop
    │   │   └── reset.tsx      # cfx node reset
    │   ├── accounts/
    │   │   ├── list.tsx       # cfx accounts list
    │   │   └── balance.tsx    # cfx accounts balance
    │   ├── mining/
    │   │   ├── start.tsx      # cfx mine start
    │   │   ├── stop.tsx       # cfx mine stop
    │   │   └── manual.tsx     # cfx mine <count>
    │   ├── faucet.tsx         # cfx faucet <address> <amount>
    │   ├── deploy.tsx         # cfx deploy <contract>
    │   └── monitor.tsx        # cfx monitor (live block watcher)
    │
    ├── components/            # Reusable Ink components
    │   ├── StatusBadge.tsx    # Running/Stopped indicator
    │   ├── Table.tsx          # Data table (wraps ink-table)
    │   ├── Spinner.tsx        # Loading spinner
    │   ├── Error.tsx          # Error display
    │   ├── Success.tsx        # Success message
    │   └── NetworkBadge.tsx   # Network indicator
    │
    ├── hooks/                 # CLI-specific hooks
    │   ├── useStatus.ts       # Poll node status
    │   ├── useAccounts.ts     # Fetch accounts
    │   └── useBlocks.ts       # Subscribe to blocks
    │
    └── utils/
        ├── config.ts          # CLI configuration
        └── format.ts          # Output formatting
```

### CLI Commands

```bash
# Network Management (affects all other commands)
cfx network                   # Show current network + capabilities
cfx network switch <local|testnet|mainnet>
cfx network info              # Detailed network configuration

# Node Management (LOCAL ONLY)
cfx node start [--port 12537] [--accounts 10]
cfx node stop
cfx node reset [--clear-data]
cfx node status

# Account Operations (LOCAL: all accounts, REMOTE: connected wallet only)
cfx accounts list
cfx accounts balance [index|address]
cfx accounts export [index]   # LOCAL ONLY

# Mining Control (LOCAL ONLY)
cfx mine start [--interval 1000]
cfx mine stop
cfx mine [count]              # Mine specific number of blocks

# Faucet (LOCAL ONLY)
cfx faucet <address> [amount] [--chain core|evm]

# Contract Operations (ALL NETWORKS)
cfx deploy <contract.json> [--args ...]
cfx call <address> <method> [args...]
cfx send <address> <method> [args...] [--value 0]

# Monitoring (ALL NETWORKS - with filtering on remote)
cfx monitor                   # Live block/transaction viewer
cfx monitor --address <addr>  # Filter by address (required on testnet/mainnet)
cfx monitor --contract <addr> # Filter by contract
cfx logs [--address] [--topic]

# Transactions (ALL NETWORKS)
cfx tx send <to> <value> [--from index]
cfx tx <hash>                 # Get transaction details

# General
cfx status                    # Quick status overview
cfx --version
cfx --help
```

### Network-Dependent Behavior

The CLI must respect network capabilities, mirroring the frontend behavior:

| Feature | Local | Testnet | Mainnet |
|---------|-------|---------|---------|
| Node Control | ✅ | ❌ | ❌ |
| Mining | ✅ | ❌ | ❌ |
| Faucet | ✅ | ❌ | ❌ |
| Deploy | ✅ | ✅ (wallet) | ✅ (wallet) |
| Monitor | ✅ (all) | ✅ (filtered) | ✅ (filtered) |
| Accounts | ✅ (devnode) | ❌ | ❌ |

**Network Capabilities Object** (returned by backend):
```typescript
interface NetworkCapabilities {
  canMine: boolean;
  canUseFaucet: boolean;
  canControlNode: boolean;
  canResetNode: boolean;
  canDeploy: boolean;
  canMonitor: boolean;
  requiresWallet: boolean;
}
```

### CLI Capability Checking Pattern

Every CLI command that depends on network capabilities should:

1. **Fetch current network status** before execution
2. **Check relevant capability** for the operation
3. **Show helpful error** if capability is false
4. **Gracefully handle 403 errors** from backend (fallback)

Example implementation pattern:

```typescript
// src/commands/mining/start.tsx
import { useStatus } from '../../hooks/useStatus';
import { Error } from '../../components/Error';

export function MineStartCommand() {
  const { status, loading, error } = useStatus();

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  // Check capability BEFORE attempting operation
  if (!status.capabilities.canMine) {
    return (
      <Error 
        message={`Mining is only available on local network`}
        hint={`Current network: ${status.network}. Use 'cfx network switch local' to enable mining.`}
      />
    );
  }

  // Proceed with mining...
}
```

**Error messages for each LOCAL ONLY operation:**

| Operation | Error Message |
|-----------|--------------|
| `cfx node start` | "Node control is only available on local network" |
| `cfx mine start` | "Mining is only available on local network" |
| `cfx faucet` | "Faucet is only available on local network" |
| `cfx accounts export` | "Account export is only available on local network" |

### Implementation Phases

#### Phase 1: Foundation (Week 1)
- [ ] Create `@conflux-devkit/cli` package
- [ ] Set up Ink with TypeScript
- [ ] Create API client for backend communication
- [ ] Implement basic commands: `status`, `node start/stop`

#### Phase 2: Core Commands (Week 2)
- [ ] `accounts list`, `accounts balance`
- [ ] `mine start/stop`, `mine <count>`
- [ ] `faucet`
- [ ] Error handling and loading states

#### Phase 3: Advanced Commands (Week 3)
- [ ] `deploy`, `call`, `send`
- [ ] `tx` commands
- [ ] `network switch`
- [ ] Interactive mode with live updates

#### Phase 4: Monitoring (Week 4)
- [ ] `monitor` - live block viewer
- [ ] `logs` - event log streaming
- [ ] WebSocket integration for real-time data

### Dependencies

```json
{
  "dependencies": {
    "ink": "^6.0.0",
    "ink-spinner": "^5.0.0",
    "ink-table": "^3.1.0",
    "ink-select-input": "^6.0.0",
    "ink-text-input": "^6.0.0",
    "react": "^18.0.0",
    "commander": "^12.0.0",
    "axios": "^1.7.0",
    "chalk": "^5.0.0"
  },
  "devDependencies": {
    "ink-testing-library": "^4.0.0",
    "@types/react": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Modularity Recommendations

### 1. Create Shared SDK Package

**Problem**: Both frontend and CLI need to communicate with backend API.

**Solution**: Create `@conflux-devkit/sdk` for shared API client logic.

```
packages/sdk/
├── src/
│   ├── client.ts        # Base API client
│   ├── endpoints/       # Typed endpoint wrappers
│   │   ├── status.ts
│   │   ├── accounts.ts
│   │   ├── mining.ts
│   │   └── ...
│   └── types.ts         # Shared API types
```

### 2. Consolidate UI Logic

**Problem**: `ui-headless` hooks make direct RPC calls.

**Solution**: Refactor `ui-headless` to use SDK/backend API instead of direct RPC.

### 3. Remove or Repurpose `@conflux-devkit/node`

**Problem**: Currently just re-exports core.

**Options**:
1. **Remove**: Delete package, let consumers use `core` directly
2. **Repurpose**: Make it a high-level SDK combining core + plugin-devnode

### 4. Backend Monitoring Endpoints

**Required for CLI**: Add endpoints for:
- `GET /blocks?limit=10` - Recent blocks
- `GET /blocks/:number` - Block details
- `GET /transactions/:hash` - Transaction details
- WebSocket channel for block subscriptions

### 5. Package Versioning Strategy

```
Tier 1 (Stable - frequent releases):
  - @conflux-devkit/core
  - @conflux-devkit/backend
  - @conflux-devkit/cli

Tier 2 (Semi-stable):
  - @conflux-devkit/plugin-devnode
  - @conflux-devkit/sdk (new)

Tier 3 (Application-level):
  - @conflux-devkit/frontend-devnode (internal/deployment)
  - @conflux-devkit/ui-headless
```

---

## Summary

### Immediate Actions
1. ✅ Backend API is comprehensive enough for CLI MVP
2. 🔧 Add block/transaction listing endpoints for monitoring
3. 📦 Create `@conflux-devkit/cli` package with Ink
4. 🔄 Consider creating `@conflux-devkit/sdk` for shared API client

### Architecture Principles
1. **Backend is the gateway** - All blockchain operations go through backend
2. **Thin clients** - Frontend and CLI are just UI layers
3. **Shared types** - API types should be in a shared location
4. **React everywhere** - Ink enables React mental model in CLI

### CLI Priority
The CLI should provide the same functionality as the web dashboard:
1. Node lifecycle management ✅
2. Account management ✅
3. Mining control ✅
4. Faucet operations ✅
5. Blockchain monitoring (needs backend endpoints)

---

*Document created: Architecture review and CLI implementation plan for Conflux DevKit*
