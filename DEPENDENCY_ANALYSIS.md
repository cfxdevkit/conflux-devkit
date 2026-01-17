# Conflux DevKit - Dependency Analysis

## Package Dependency Tree

```
┌─────────────────────────────────────────────────────────────┐
│                     External Dependencies                    │
│  @xcfx/node, cive, viem, bip39, bip32, tiny-secp256k1       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    @conflux-devkit/core                      │
│                   (Foundation Package)                       │
│  • Chain configs & network selector                          │
│  • Core/eSpace client wrappers (cive/viem)                   │
│  • Unified types & interfaces                                │
│  • Address validators (isCoreAddress, isEspaceAddress)        │
│  Dependencies: cive, viem                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────────┬──────────────────┬──────────────────┐
                              ▼                  ▼                  ▼                  ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│ @conflux-devkit/     │  │ @conflux-devkit/ │  │ @conflux-    │  │ @conflux-devkit/ │
│   contracts          │  │   wallet         │  │   devkit/    │  │   ui-headless    │
│                      │  │                  │  │   node       │  │                  │
│ • Contract ABIs      │  │ • Session keys   │  │              │  │ • React hooks    │
│ • Deployer utils     │  │ • Tx batching    │  │ • Account    │  │ • Headless UI    │
│ • Interaction utils  │  │ • Wallet wrapper │  │   generation │  │   components     │
│                      │  │                  │  │ • Test utils │  │                  │
│ Deps: core, cive,    │  │ Deps: core,      │  │              │  │ Deps: core       │
│       viem           │  │       viem       │  │ Deps: core,  │  │ Peer: react,     │
└──────────────────────┘  └──────────────────┘  │ bip39,       │  │       react-dom  │
                                                │ bip32        │  └──────────────────┘
                                                │              │
                                                │ Peer: plugin-│
                                                │       devnode│
                                                └──────────────┘
                                                       │
                                                       ▼
                              ┌──────────────────────────────────────┐
                              │  @conflux-devkit/plugin-devnode      │
                              │  (Dev Node Plugin)                   │
                              │                                      │
                              │  • ServerManager wrapper for @xcfx   │
                              │  • Account generation & management   │
                              │  • Mining control (auto/manual)      │
                              │  • Genesis secrets setup             │
                              │                                      │
                              │  Deps: @xcfx/node, cive, viem,       │
                              │        bip39, bip32                  │
                              │  Peer: core                          │
                              └──────────────────────────────────────┘
                                                       │
                                                       ▼
                              ┌──────────────────────────────────────┐
                              │  @conflux-devkit/backend             │
                              │  (Backend Server)                    │
                              │                                      │
                              │  • DevKitCompat wrapper              │
                              │  • REST API routes                   │
                              │  • WebSocket server                  │
                              │  • Auth service                      │
                              │  • Faucet implementation             │
                              │                                      │
                              │  Deps: plugin-devnode, @conflux-     │
                              │        devkit/node, express, ws,     │
                              │        viem                          │
                              └──────────────────────────────────────┘
                                                       │
                                                       ▼
                              ┌──────────────────────────────────────┐
                              │  @conflux-devkit/frontend    │
                              │  (React Frontend)                    │
                              │                                      │
                              │  • DevNode control panel UI          │
                              │  • Account management UI             │
                              │  • Mining controls                   │
                              │  • Network selector UI               │
                              │                                      │
                              │  Deps: core, ui-headless, @mantine,  │
                              │        react, axios, zustand, wagmi  │
                              └──────────────────────────────────────┘
```

## Dependency Summary Table

| Package | Direct Dependencies | Purpose | Layer |
|---------|-------------------|---------|-------|
| **core** | `cive`, `viem` | Foundation - clients, types, config | Base |
| **contracts** | `core`, `cive`, `viem` | Contract deployment & interaction | App |
| **wallet** | `core`, `viem` | Wallet utilities & session keys | App |
| **node** | `core`, `bip39`, `bip32`, `viem` | Account generation, test utilities | Dev Tools |
| **ui-headless** | `core`, `react` (peer) | Headless React components | UI |
| **plugin-devnode** | `@xcfx/node`, `cive`, `viem`, `bip39`, `bip32`, `core` (peer) | Dev node wrapper & management | Dev Tools |
| **backend** | `plugin-devnode`, `node`, `express`, `ws`, `viem` | Backend API server | Service |
| **frontend** | `core`, `ui-headless`, `@mantine`, `react`, `axios` | Frontend UI | UI |

## Code Duplication Issues

### 🔴 **CRITICAL: Duplicate ServerManager Class**

**Files:**
- `packages/plugin-devnode/src/server-manager.ts` (1077 lines)
- `packages/node/src/server/index.ts` (1137 lines)

**Status:** ~95% identical code with minor configuration differences

**Differences:**
1. **Import paths:** 
   - plugin-devnode: imports from `./types.js`
   - node: imports from `../types/index.js`

2. **Default chain IDs:**
   - plugin-devnode: 2029/2030 (local)
   - node: 1029/1030 (mainnet IDs, likely incorrect)

3. **Mining configuration:**
   - plugin-devnode: Auto-starts mining with 500ms interval
   - node: Has mining config object but similar auto-start logic

4. **devPackTxImmediately:**
   - plugin-devnode: `false` (manual mining via testClient)
   - node: `true` (auto pack transactions)

**Impact:**
- Maintenance burden: bugs need to be fixed in 2 places
- Inconsistent behavior between packages
- 2000+ lines of duplicated code
- Different default behaviors can confuse users

### 🟡 **MODERATE: Similar Account Generation Logic**

**Files:**
- Both ServerManager implementations have nearly identical `generateAccountsSync()` methods
- Both generate mining accounts with dual derivation paths

**Duplication:** ~200 lines per file

### 🟡 **MODERATE: Faucet Logic Split**

**Files:**
- `packages/core/src/clients/core.ts` - `CoreWalletClient.faucet()` method
- `packages/backend/src/devkit-compat.ts` - `DevKitCompat.fundAccount()` wrapper
- `packages/backend/src/routes/devkit.ts` - Faucet endpoint handler

**Status:** Reasonable separation of concerns, but could be simplified

## Architecture Issues

### 1. **Unclear Package Responsibility**

**@conflux-devkit/node vs @conflux-devkit/plugin-devnode:**
- Both contain ServerManager
- `node` should be for account utilities and test helpers
- `plugin-devnode` should be the only one with ServerManager
- Currently: redundant and confusing

**Recommendation:** 
- Remove ServerManager from `@conflux-devkit/node`
- Keep only in `@conflux-devkit/plugin-devnode`
- Make `@conflux-devkit/node` focus on account generation utilities

### 2. **Backend Direct Dependency on plugin-devnode**

**Current:**
```
backend → plugin-devnode → @xcfx/node
```

**Issue:** 
- Backend tightly coupled to dev node implementation
- Plugin should be optional

**Recommendation:**
- Create abstraction layer in `core` for dev node interface
- Backend depends on interface, not implementation
- plugin-devnode becomes truly pluggable

### 3. **Circular Dependency Risk**

**Potential issue:**
```
plugin-devnode (peer) → core
backend → plugin-devnode
frontend → core
```

**Status:** Currently OK, but peer dependencies add complexity

### 4. **Missing Package: @conflux-devkit/cli**

**Observation:**
- No CLI package exists
- Backend runs as standalone server
- No easy way to start dev node without backend

**Recommendation:**
- Create `@conflux-devkit/cli` package
- Wrap backend startup logic
- Provide commands like `devkit start`, `devkit stop`, `devkit mine`

## Recommendations

### High Priority

1. **🔴 Eliminate ServerManager Duplication**
   ```
   Action: Remove ServerManager from @conflux-devkit/node
   Keep: Only in @conflux-devkit/plugin-devnode
   Refactor: Extract shared utilities to core if needed
   ```

2. **🟡 Standardize Chain IDs**
   ```
   Fix: plugin-devnode should use consistent local chain IDs
   Update: Documentation to clarify chain ID usage
   ```

3. **🟡 Consolidate Mining Logic**
   ```
   Action: Ensure both implementations use same mining approach
   Current: Both now use numTxs: 1 with 500ms interval ✓
   ```

### Medium Priority

4. **Create Abstraction for Dev Node**
   ```typescript
   // In @conflux-devkit/core
   export interface IDevNodeManager {
     start(config: ServerConfig): Promise<void>;
     stop(): Promise<void>;
     startMining(interval?: number): Promise<void>;
     // ... other methods
   }
   
   // plugin-devnode implements this
   export class ServerManager implements IDevNodeManager { ... }
   ```

5. **Add CLI Package**
   ```
   New package: @conflux-devkit/cli
   Commands: start, stop, mine, accounts, etc.
   Wraps: backend startup and control
   ```

### Low Priority

6. **Extract Common Utilities**
   ```
   Move to core:
   - Account generation utilities
   - Mnemonic handling
   - Address derivation helpers
   ```

7. **Improve Type Sharing**
   ```
   Ensure all packages use types from core
   Avoid type duplication across packages
   ```

## Positive Aspects ✅

1. **Good Separation at Core Level**
   - `@conflux-devkit/core` is clean, focused foundation
   - No circular dependencies at core level

2. **Proper Workspace Usage**
   - All packages use `workspace:*` for internal deps
   - Clean monorepo structure

3. **Recent Improvements**
   - Unified faucet with proper address validation
   - Address validators exported from core
   - Auto-mining with transaction packing

4. **Clear Frontend/Backend Split**
   - Frontend properly depends on backend via REST API
   - WebSocket for real-time updates

## Dependency Graph (Simplified)

```
External (cive, viem, @xcfx/node)
    ↓
Core (foundation)
    ↓
├─→ Contracts (ABIs, deploy)
├─→ Wallet (session keys)
├─→ Node (account utils) ──┐
├─→ UI Headless (React)     │
│                           │
└─→ Plugin DevNode ←────────┘
         ↓
    Backend (API)
         ↓
    Frontend (UI)
```

## Metrics

- **Total Packages:** 8 (core, contracts, wallet, node, ui-headless, plugin-devnode, backend, frontend)
- **Lines of Duplicated Code:** ~2000+ (ServerManager alone)
- **External Dependencies:** 6 major (cive, viem, @xcfx/node, bip39, bip32, tiny-secp256k1)
- **Workspace Dependencies:** 12 internal references
- **Dependency Depth:** 4 levels (External → Core → Plugin → Backend → Frontend)

## Next Steps

1. **Immediate:** Remove ServerManager from `@conflux-devkit/node`
2. **Short-term:** Create dev node interface in core
3. **Medium-term:** Add CLI package
4. **Long-term:** Extract common utilities, improve type sharing
