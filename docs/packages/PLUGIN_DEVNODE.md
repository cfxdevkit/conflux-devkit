# @conflux-devkit/plugin-devnode

**Version:** 0.1.0  
**Status:** New Package  
**Type:** Development Plugin

## Purpose
Optional plugin for local Conflux node management. Provides ServerManager, account generation, and mining controls for development environments.

## Key Features
- **ServerManager**: Lifecycle control for @xcfx/node (start/stop/reset)
- **Account Generation**: BIP32/BIP39 HD wallet derivation
- **Dual Derivation Paths**: Generates both Core (m/44'/503') and eSpace (m/44'/60') addresses
- **Mining Controls**: Auto-mining with configurable intervals, manual block mining

## Exports
```typescript
// Server management
import { ServerManager, ServerConfig } from '@conflux-devkit/plugin-devnode/manager';

// Account generation
import { AccountGenerator, DerivedAccount } from '@conflux-devkit/plugin-devnode/accounts';

// Types
import { MiningStatus, NodeStatus } from '@conflux-devkit/plugin-devnode/types';
```

## Dependencies
- `@xcfx/node` - Local Conflux node binary
- `@conflux-devkit/core` - Core client abstractions
- `bip39`, `bip32`, `tiny-secp256k1` - HD wallet derivation

## Usage Example
```typescript
import { ServerManager } from '@conflux-devkit/plugin-devnode';

const server = new ServerManager({
  chainId: 2029,
  evmChainId: 2030,
  accountsCount: 10
});

await server.start();
const accounts = server.getAccounts();
await server.startAutoMining(1000); // Mine every 1s
```

## Note
This package is intended for **development only**. It should not be included in production builds.
