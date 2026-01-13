# Phase 1 Migration Guide: Core Package & Plugin System

## Overview

Phase 1 of the Conflux DevKit refactoring introduces a modular architecture that separates production-ready blockchain functionality from development tooling. This enables:

✅ Production deployments without dev dependencies
✅ Better tree-shaking and smaller bundles
✅ Clear separation between core and dev tooling
✅ Optional local development features via plugin system

## Breaking Changes

### @conflux-devkit/node (v0.1.0 → v0.2.0)

**BREAKING**: Package is now a thin wrapper that re-exports from `@conflux-devkit/core`. Local development features (start, stop, mine) have been moved to `@conflux-devkit/plugin-devnode`.

#### What Changed

1. **Removed Direct Implementation**
   - The package no longer contains blockchain client implementations
   - All functionality now comes from `@conflux-devkit/core`
   - DevKit class has been completely removed from this package

2. **Removed Dependencies**
   - `@xcfx/node` - moved to optional peer dependency `@conflux-devkit/plugin-devnode`
   - `cive`, `viem` - moved to `@conflux-devkit/core`
   - `winston` - moved to packages that need logging

3. **Simplified Exports**
   - Removed subpath exports (`/types`, `/clients`, `/server`)
   - Single entry point: `@conflux-devkit/node`

4. **New Peer Dependency**
   - Added optional peer dependency: `@conflux-devkit/plugin-devnode`

## New Package Structure

```
@conflux-devkit/core            # NEW: Production-ready blockchain clients
@conflux-devkit/node            # REFACTORED: Wrapper around core package
@conflux-devkit/plugin-devnode  # NEW: Optional local development plugin
```

## Migration Scenarios

### Scenario 1: Production Code (No Local Node)

**Before (v0.1.0):**
```typescript
import { DevKit } from '@conflux-devkit/node';

const devkit = new DevKit({
  coreRpc: 'https://test.confluxrpc.com',
  evmRpc: 'https://evmtestnet.confluxrpc.com'
});

// Use devkit for blockchain operations
const balance = await devkit.getBalance('cfx:...');
```

**After (v0.2.0):**
```typescript
// Option 1: Use core package directly (recommended for production)
import { ClientManager } from '@conflux-devkit/core';

const manager = new ClientManager({
  coreRpc: 'https://test.confluxrpc.com',
  evmRpc: 'https://evmtestnet.confluxrpc.com'
});

// Use manager for blockchain operations
const coreClient = manager.getCoreClient();
const balance = await coreClient.publicClient.getBalance({ address: 'cfx:...' });

// Option 2: Continue using node package (for compatibility)
import { ClientManager } from '@conflux-devkit/node';

// Same API as Option 1
const manager = new ClientManager({
  coreRpc: 'https://test.confluxrpc.com',
  evmRpc: 'https://evmtestnet.confluxrpc.com'
});
```

**Benefits:**
- Smaller bundle size (no @xcfx/node dependency)
- Faster installation
- Better tree-shaking

### Scenario 2: Development Code (With Local Node)

**Before (v0.1.0):**
```typescript
import { DevKit } from '@conflux-devkit/node';

const devkit = new DevKit();

// Start local development node
await devkit.start();

// Mine blocks
await devkit.mine(10);

// Fund accounts
await devkit.fundAccount('cfx:...', '1000', 'core');

// Use blockchain operations
const balance = await devkit.getBalance('cfx:...');

// Stop node when done
await devkit.stop();
```

**After (v0.2.0):**
```typescript
import { ClientManager } from '@conflux-devkit/core';
import { devNodePlugin } from '@conflux-devkit/plugin-devnode';

// Create base manager
const baseManager = new ClientManager();

// Extend with dev node plugin
const devkit = devNodePlugin.extendDevKit(baseManager, {
  chainId: 2029,
  evmChainId: 2030,
  accounts: 10
});

// Start local development node
await devkit.startNode();

// Mine blocks
await devkit.mine(10);

// Fund accounts
await devkit.fundAccount('cfx:...', '1000', 'core');

// Use blockchain operations (inherited from ClientManager)
const coreClient = devkit.getCoreClient();
const balance = await coreClient.publicClient.getBalance({ address: 'cfx:...' });

// Stop node when done
await devkit.stopNode();
```

**Benefits:**
- Clear separation between blockchain operations and dev tooling
- Dev dependencies only loaded when needed
- Can conditionally load plugin based on environment

### Scenario 3: Conditional Plugin Loading (Recommended)

```typescript
import { ClientManager } from '@conflux-devkit/core';

// Production: Use remote RPC
let manager = new ClientManager({
  coreRpc: process.env.CORE_RPC,
  evmRpc: process.env.EVM_RPC
});

// Development: Extend with local node plugin
if (process.env.NODE_ENV === 'development') {
  const { devNodePlugin } = await import('@conflux-devkit/plugin-devnode');

  manager = devNodePlugin.extendDevKit(manager, {
    chainId: 2029,
    evmChainId: 2030,
    accounts: 10
  });

  await (manager as any).startNode();
}

// Use same API in both environments
const coreClient = manager.getCoreClient();
```

**Benefits:**
- Single codebase for dev and production
- Dev dependencies not bundled in production
- Type-safe with proper typing

## API Changes

### Removed from @conflux-devkit/node

The following methods are no longer available in the base package:

- `start()` - moved to plugin as `startNode()`
- `stop()` - moved to plugin as `stopNode()`
- `mine()` - moved to plugin
- `startMining()` - moved to plugin
- `stopMining()` - moved to plugin
- `fundAccount()` - moved to plugin
- `getFaucetAccount()` - moved to plugin

### Available in @conflux-devkit/core (and by extension, @conflux-devkit/node)

All blockchain operations remain available:

- Client management (`getCoreClient()`, `getEvmClient()`)
- RPC operations (via Cive and Viem clients)
- Account management
- Transaction operations
- Contract deployment and interaction

### New in @conflux-devkit/plugin-devnode

Plugin-specific methods (available when using `devNodePlugin.extendDevKit()`):

- `startNode(options?: StartOptions)` - Start local development node
- `stopNode()` - Stop local node
- `mine(blocks?: number)` - Mine blocks manually
- `startMining()` - Start auto-mining
- `stopMining()` - Stop auto-mining
- `fundAccount(address, amount, chain)` - Fund test accounts
- `getFaucetAccount()` - Get faucet account info
- `getNodeStatus()` - Get node status and mining info

## Package Installation

### Production

```bash
# Core package (recommended)
pnpm add @conflux-devkit/core

# Or node package (for compatibility)
pnpm add @conflux-devkit/node
```

### Development

```bash
# Add plugin as dev dependency
pnpm add -D @conflux-devkit/plugin-devnode

# Plugin will automatically install @xcfx/node as dependency
```

## Type Imports

**Before (v0.1.0):**
```typescript
import type {
  AccountInfo,
  NodeConfig,
  ServerConfig
} from '@conflux-devkit/node/types';

import type {
  CoreClient,
  EspaceClient
} from '@conflux-devkit/node/clients';
```

**After (v0.2.0):**
```typescript
// All types available from main export
import type {
  AccountInfo,
  NodeConfig,
  ServerConfig,
  CoreClient,
  EspaceClient,
  ChainStatus,
  MiningStatus
} from '@conflux-devkit/node';

// Or from core package
import type {
  AccountInfo,
  NodeConfig,
  ServerConfig
} from '@conflux-devkit/core';
```

## Testing Considerations

### Unit Tests (No Local Node)

```typescript
import { describe, it, expect } from 'vitest';
import { ClientManager } from '@conflux-devkit/core';

describe('Blockchain operations', () => {
  it('should connect to RPC', async () => {
    const manager = new ClientManager({
      coreRpc: 'https://test.confluxrpc.com',
      evmRpc: 'https://evmtestnet.confluxrpc.com'
    });

    const status = await manager.getStatus();
    expect(status.core.connected).toBe(true);
  });
});
```

### Integration Tests (With Local Node)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ClientManager } from '@conflux-devkit/core';
import { devNodePlugin } from '@conflux-devkit/plugin-devnode';

describe('Local node integration', () => {
  let devkit: any;

  beforeAll(async () => {
    const manager = new ClientManager();
    devkit = devNodePlugin.extendDevKit(manager);
    await devkit.startNode();
  });

  afterAll(async () => {
    await devkit.stopNode();
  });

  it('should mine blocks', async () => {
    await devkit.mine(10);
    const status = await devkit.getNodeStatus();
    expect(status.mining.blocksMined).toBeGreaterThanOrEqual(10);
  });
});
```

## Bundle Size Comparison

### Before (v0.1.0)
```
@conflux-devkit/node: ~2.5 MB
  ├─ @xcfx/node: ~1.8 MB
  ├─ cive: ~350 KB
  ├─ viem: ~300 KB
  └─ winston: ~50 KB
```

### After (v0.2.0)

**Production (core only):**
```
@conflux-devkit/core: ~700 KB
  ├─ cive: ~350 KB
  └─ viem: ~300 KB
```

**Development (core + plugin):**
```
@conflux-devkit/core: ~700 KB
@conflux-devkit/plugin-devnode: ~1.9 MB (dev only)
  └─ @xcfx/node: ~1.8 MB
```

**Savings:** ~72% reduction in production bundle size

## Troubleshooting

### Error: Cannot find module '@conflux-devkit/core'

**Solution:** Install dependencies after updating package.json

```bash
pnpm install
```

### Error: DevKit methods (start, stop, mine) not found

**Solution:** Methods moved to plugin. Either:

1. Use the plugin:
```typescript
import { devNodePlugin } from '@conflux-devkit/plugin-devnode';
const devkit = devNodePlugin.extendDevKit(manager);
await devkit.startNode(); // was: start()
```

2. Or switch to remote RPC for production:
```typescript
const manager = new ClientManager({
  coreRpc: 'https://test.confluxrpc.com',
  evmRpc: 'https://evmtestnet.confluxrpc.com'
});
```

### TypeScript errors about missing types

**Solution:** Remove subpath imports

```typescript
// Before (will fail)
import { AccountInfo } from '@conflux-devkit/node/types';

// After (works)
import { AccountInfo } from '@conflux-devkit/node';
// or
import { AccountInfo } from '@conflux-devkit/core';
```

### Plugin TypeScript errors

**Solution:** Use type assertion when using plugin methods

```typescript
import type { DevKitWithDevNode } from '@conflux-devkit/plugin-devnode';

const devkit = devNodePlugin.extendDevKit(manager) as DevKitWithDevNode;
await devkit.startNode(); // Now type-safe
```

## Gradual Migration Strategy

You can migrate gradually using this approach:

### Step 1: Update Dependencies (No Code Changes)

```json
{
  "dependencies": {
    "@conflux-devkit/node": "^0.2.0"
  },
  "devDependencies": {
    "@conflux-devkit/plugin-devnode": "^0.1.0"
  }
}
```

### Step 2: Update Development Code

Replace DevKit usage in test files and development scripts:

```typescript
// tests/setup.ts
import { devNodePlugin } from '@conflux-devkit/plugin-devnode';
import { ClientManager } from '@conflux-devkit/node';

export const setupDevNode = async () => {
  const manager = new ClientManager();
  const devkit = devNodePlugin.extendDevKit(manager);
  await devkit.startNode();
  return devkit;
};
```

### Step 3: Update Production Code

Replace DevKit with ClientManager in production code:

```typescript
// src/blockchain.ts
import { ClientManager } from '@conflux-devkit/node';

export const createBlockchainClient = () => {
  return new ClientManager({
    coreRpc: process.env.CORE_RPC,
    evmRpc: process.env.EVM_RPC
  });
};
```

### Step 4: Remove Subpath Imports

Update all type imports to use main export:

```bash
# Find all subpath imports
grep -r "@conflux-devkit/node/" src/

# Replace with main import
# @conflux-devkit/node/types → @conflux-devkit/node
# @conflux-devkit/node/clients → @conflux-devkit/node
```

## Next Steps

After completing Phase 1 migration:

- **Phase 2**: Backend services refactoring (wallet, contracts packages)
- **Phase 3**: Frontend UI headless components
- **Phase 4**: Phaser gaming integration package

## Support

If you encounter issues during migration:

1. Check this guide for common troubleshooting steps
2. Review the [API documentation](./docs/api.md)
3. Open an issue on [GitHub](https://github.com/conflux-devkit/conflux-devkit/issues)

## Summary

Phase 1 introduces a cleaner, more modular architecture:

- ✅ **@conflux-devkit/core**: Production-ready blockchain clients (NEW)
- ✅ **@conflux-devkit/node**: Thin wrapper for compatibility (REFACTORED)
- ✅ **@conflux-devkit/plugin-devnode**: Optional development tooling (NEW)

This sets the foundation for future enhancements while maintaining backward compatibility where possible.
