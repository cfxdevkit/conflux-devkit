# @conflux-devkit/wallet

Advanced wallet abstraction features for Conflux blockchain applications, including session keys, transaction batching, and embedded wallet management.

## Installation

```bash
npm install @conflux-devkit/wallet
# or
pnpm add @conflux-devkit/wallet
```

## Features

- **Session Keys**: Temporary delegated signing with granular permissions
- **Transaction Batching**: Efficient multi-transaction execution
- **Embedded Wallets**: Server-side wallet custody for seamless UX
- **Permission Management**: Fine-grained control over session key capabilities
- **Multi-Chain Support**: Works with both Conflux Core Space and eSpace

## Usage

### Session Key Management

Session keys allow you to create temporary signing keys with limited permissions, perfect for gaming or automated operations.

```typescript
import { SessionKeyManager } from '@conflux-devkit/wallet';

const manager = new SessionKeyManager();

// Generate a session key with permissions
const sessionKey = manager.generateSessionKey(parentAddress, {
  ttl: 3600, // 1 hour
  chain: 'evm',
  permissions: {
    maxValue: 1000000000000000000n, // 1 CFX max per transaction
    contracts: ['0xContractAddress'], // Only interact with specific contracts
    operations: ['0x12345678'], // Only specific function signatures
  },
});

// Sign transactions with the session key
const signedTx = await manager.signWithSessionKey(sessionKey.id, {
  to: '0xRecipient',
  value: 500000000000000000n, // 0.5 CFX
  chain: 'evm',
});

// List active session keys
const activeKeys = manager.listActiveSessionKeys(parentAddress);

// Revoke a session key
manager.revokeSessionKey(sessionKey.id);

// Clean up expired keys
const removed = manager.cleanupExpired();
```

### Transaction Batching

Batch multiple transactions for efficient execution and reduced overhead.

```typescript
import { TransactionBatcher } from '@conflux-devkit/wallet';

const batcher = new TransactionBatcher({
  maxBatchSize: 10,
  autoExecuteTimeout: 5000, // Auto-execute after 5 seconds
});

// Add transactions to batch
const txId1 = batcher.addTransaction({
  to: '0xRecipient1',
  value: 1000n,
  chain: 'evm',
});

const txId2 = batcher.addTransaction({
  to: '0xRecipient2',
  value: 2000n,
  chain: 'evm',
});

// Get pending transactions
const pending = batcher.getPendingTransactions('evm');

// Get batch statistics
const stats = batcher.getBatchStats('evm');
console.log(`Total value: ${stats.totalValue}`);
console.log(`Average gas: ${stats.avgGasLimit}`);

// Execute batch manually
const result = await batcher.executeBatch('evm');
console.log(`Success: ${result.successCount}/${result.successCount + result.failureCount}`);

// Or provide custom signer
const customResult = await batcher.executeBatch('evm', async (tx) => {
  // Custom signing logic
  return '0xtxhash';
});

// Clear batch
batcher.clearBatch('evm');
```

### Embedded Wallet Management

Server-side wallet custody for seamless user experience.

```typescript
import { EmbeddedWalletManager } from '@conflux-devkit/wallet';

const walletManager = new EmbeddedWalletManager();

// Create wallet for user
const wallet = await walletManager.createWallet('user-id-123');
console.log(`Wallet address: ${wallet.address}`);

// Sign transaction on behalf of user
const signedTx = await walletManager.signTransaction('user-id-123', {
  to: '0xRecipient',
  value: 1000000000000000000n,
  chain: 'evm',
});

// Export wallet (encrypted)
const encrypted = await walletManager.exportWallet('user-id-123', 'user-password');

// List user wallets
const wallets = walletManager.listWallets('user-id-123');
```

## API Reference

### SessionKeyManager

#### Methods

- `generateSessionKey(parentAddress: string, options: SessionKeyOptions): SessionKey`
- `getSessionKey(id: string): SessionKey | undefined`
- `revokeSessionKey(id: string): void`
- `listSessionKeys(parentAddress: string): SessionKey[]`
- `listActiveSessionKeys(parentAddress: string): SessionKey[]`
- `signWithSessionKey(id: string, transaction: Transaction): Promise<SignedTransaction>`
- `cleanupExpired(): number`
- `getStats(): SessionKeyStats`

#### Types

```typescript
interface SessionKeyOptions {
  ttl?: number; // Time to live in seconds (default: 3600)
  permissions?: SessionKeyPermissions;
  chain: 'core' | 'evm';
}

interface SessionKeyPermissions {
  maxValue?: bigint; // Maximum transaction value
  contracts?: string[]; // Whitelisted contract addresses
  operations?: string[]; // Whitelisted function signatures
}

interface SessionKey {
  id: string;
  privateKey: string;
  address: string;
  parentAddress: string;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  permissions?: SessionKeyPermissions;
  chain: 'core' | 'evm';
}
```

### TransactionBatcher

#### Methods

- `addTransaction(tx: Transaction): string`
- `removeTransaction(txId: string, chain: ChainType): boolean`
- `getPendingTransactions(chain: ChainType): PendingTransaction[]`
- `getBatchStats(chain: ChainType): BatchStats`
- `executeBatch(chain: ChainType, customSigner?: SignerFunction): Promise<BatchResult>`
- `clearBatch(chain?: ChainType): void`
- `getOptions(): BatcherOptions`
- `updateOptions(options: Partial<BatcherOptions>): void`

#### Types

```typescript
interface BatcherOptions {
  maxBatchSize: number; // Maximum transactions per batch
  autoExecuteTimeout?: number; // Auto-execute after N milliseconds (0 to disable)
}

interface Transaction {
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  chain: 'core' | 'evm';
}

interface BatchResult {
  batchId: string;
  transactionHashes: string[];
  successCount: number;
  failureCount: number;
  executedAt: Date;
  chain: 'core' | 'evm';
}
```

### EmbeddedWalletManager

#### Methods

- `createWallet(userId: string): Promise<EmbeddedWallet>`
- `getWallet(userId: string): EmbeddedWallet | undefined`
- `listWallets(userId: string): EmbeddedWallet[]`
- `signTransaction(userId: string, transaction: Transaction): Promise<string>`
- `exportWallet(userId: string, password: string): Promise<string>`
- `importWallet(userId: string, encrypted: string, password: string): Promise<EmbeddedWallet>`
- `deleteWallet(userId: string): boolean`

## Testing

```bash
pnpm test
```

See [test files](./src/) for comprehensive usage examples.

## License

Apache-2.0

## Related Packages

- [@conflux-devkit/core](../core) - Core blockchain clients
- [@conflux-devkit/contracts](../contracts) - Contract deployment and interaction
- [@conflux-devkit/ui-headless](../ui-headless) - React components
