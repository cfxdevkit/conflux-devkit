# @conflux-devkit/wallet

**Version:** 0.1.0  
**Status:** New Package  
**Type:** Wallet Library

## Purpose
Advanced wallet abstractions for Conflux applications. Provides session key management, transaction batching, and embedded wallet support.

## Key Features
- **Session Keys**: Temporary keys for improved UX
- **Transaction Batching**: Combine multiple operations
- **Embedded Wallets**: In-app wallet creation (planned)
- **Multi-chain Support**: Works with both Core Space and eSpace

## Exports
```typescript
import { 
  SessionKeyManager,
  TransactionBatcher,
  WalletFactory 
} from '@conflux-devkit/wallet';
```

## Status
Package structure created with core utilities. Full implementation in progress.

## Planned Features
- Social login integration
- Hardware wallet support
- Account abstraction (ERC-4337)
