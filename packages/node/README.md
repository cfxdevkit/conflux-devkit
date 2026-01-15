# @conflux-devkit/node

> **Note:** This package is a lightweight wrapper that re-exports `@conflux-devkit/core`.  
> For local development with `@xcfx/node`, use `@conflux-devkit/plugin-devnode`.

## Purpose

This package provides a convenient production-ready entry point for Conflux blockchain interaction by re-exporting the entire `@conflux-devkit/core` package. It exists to maintain backwards compatibility and provide a familiar package name for users.

## Installation

```bash
npm install @conflux-devkit/node
# or
yarn add @conflux-devkit/node
# or
pnpm add @conflux-devkit/node
```

## Quick Start

```typescript
// Everything is re-exported from @conflux-devkit/core
import { CoreClient, EspaceClient, createCoreClient } from '@conflux-devkit/node';

// Create a Core Space client
const coreClient = await createCoreClient({
  chainId: 1029, // Conflux Core Mainnet
  rpcUrl: 'https://main.confluxrpc.com',
});

// Use the client
const balance = await coreClient.publicClient.getBalance(address);
```

## What's Included

All exports from `@conflux-devkit/core`:
- Chain clients (Core Space & eSpace)
- Network configuration
- Type definitions
- Utility functions

## For Local Development

If you need local development node functionality with `@xcfx/node`:

```bash
npm install @conflux-devkit/plugin-devnode
```

See [@conflux-devkit/plugin-devnode](../plugin-devnode/README.md) for local development node features.

## Migration Guide

If you were using the old `@conflux-devkit/node` with ServerManager:

**Before:**
```typescript
import { ServerManager } from '@conflux-devkit/node';
```

**After:**
```typescript
import { ServerManager } from '@conflux-devkit/plugin-devnode';
```

## License

Apache-2.0

## Development

This package is part of the [Conflux DevKit](https://github.com/conflux-devkit/conflux-devkit) monorepo.

## License

Apache-2.0