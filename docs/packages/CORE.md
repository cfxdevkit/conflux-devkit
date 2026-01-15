# @conflux-devkit/core

**Version:** 0.1.0  
**Status:** New Package  
**Type:** Foundation Library

## Purpose
Core blockchain client library providing unified abstractions for Conflux's dual-chain architecture (Core Space + eSpace).

## Key Features
- **Dual-chain clients**: Unified API for both Core Space (Cive) and eSpace (Viem)
- **Chain configuration**: Pre-configured settings for local, testnet, and mainnet
- **Network selector**: Easy switching between networks
- **Type-safe interfaces**: Full TypeScript support

## Exports
```typescript
// Clients
import { CoreClient, EspaceClient, ClientManager } from '@conflux-devkit/core/clients';

// Configuration
import { chainConfigs, NetworkSelector } from '@conflux-devkit/core/config';

// Types
import { ChainConfig, NetworkType } from '@conflux-devkit/core/types';

// Utilities
import { isCoreAddress, isEspaceAddress } from '@conflux-devkit/core/utils';
```

## Dependencies
- `cive` - Core Space client library
- `viem` - EVM-compatible client library

## Usage Example
```typescript
import { ClientManager, chainConfigs } from '@conflux-devkit/core';

const manager = new ClientManager(chainConfigs.local);
const coreClient = manager.getCoreClient();
const espaceClient = manager.getEspaceClient();
```
