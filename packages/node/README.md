# @conflux-devkit/node

A fresh Conflux Development Kit Node with clean implementation and unified dual-chain support (Conflux Core and eSpace).

## Features

- **Dual-Chain Support**: Unified interface for both Conflux Core and eSpace
- **Modern Architecture**: Built with TypeScript and modern tooling
- **Extensible Design**: Clean abstractions for easy customization
- **Developer-Friendly**: Rich TypeScript types and excellent DX

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
import { ConfluxDevKit } from '@conflux-devkit/node';

// Initialize the devkit
const devkit = new ConfluxDevKit({
  // Configuration options
});

// Use dual-chain clients
const coreClient = devkit.core;
const evmClient = devkit.evm;
```

## API Reference

### Main Exports

- `ConfluxDevKit` - Main devkit class
- `CoreClient` - Conflux Core client
- `EvmClient` - eSpace (EVM) client
- Types and interfaces from `@conflux-devkit/node/types`

### Sub-exports

- `@conflux-devkit/node/types` - TypeScript type definitions
- `@conflux-devkit/node/clients` - Client implementations
- `@conflux-devkit/node/server` - Server utilities

## Development

This package is part of the [Conflux DevKit](https://github.com/conflux-devkit/conflux-devkit) monorepo.

## License

Apache-2.0