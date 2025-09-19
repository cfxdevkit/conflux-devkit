# DevKit Accounts & Wallets API Report

## Current Backend API Endpoints

### 1. Account Information
- **GET** `/api/devkit/accounts/:index` - Get account details for a specific index (0-9)
  ```json
  {
    "index": 0,
    "addresses": {
      "core": "cfx:type.user:aak...",
      "evm": "0x1234..."
    },
    "isAdmin": true
  }
  ```

### 2. Account Balance
- **GET** `/api/devkit/accounts/:index/balance` - Get balances for both chains
  ```json
  {
    "index": 0,
    "balances": {
      "core": "1000000000000000000000000",
      "evm": "1000000000000000000000000"
    }
  }
  ```
  - Returns zero balances with error message when node is stopped
  - Handles graceful errors instead of 500 responses

### 3. Transfer/Send Transaction
- **POST** `/api/devkit/transactions/send` - Send transaction from account
  ```json
  // Request
  {
    "accountIndex": 0,
    "to": "cfx:type.user:aak...",
    "value": "1000000000000000000", // in Drip (1 CFX = 10^18 Drip)
    "chain": "core" // "core" or "evm"
  }
  
  // Response
  {
    "transactionHash": "0x...",
    "from": "cfx:type.user:aak...",
    "to": "cfx:type.user:aak...",
    "value": "1000000000000000000",
    "chain": "core"
  }
  ```

## Account Structure & Derivation

### Mnemonic-Based Generation
- **Base Derivation Path**: `m/44'/503'/0'/0/{index}` (BIP32 standard for Conflux)
- **Accounts**: 0-9 (10 accounts generated from single mnemonic)
- **Mining Account**: `m/44'/503'/1'/0/0` (separate from genesis accounts)

### Account Properties
Each account contains:
- `index`: Account index (0-9)
- `privateKey`: Hex-encoded private key
- `coreAddress`: Conflux Core Space address (cfx:...)
- `evmAddress`: Conflux eSpace address (0x...)
- `mnemonic`: BIP39 mnemonic phrase
- `path`: BIP32 derivation path

### Account Methods Available
From DevKitAccount class:
- `getBalance(chain?: 'core' | 'evm')`: Get balance for specific or both chains
- `getBalances()`: Get balances for both chains
- `transfer(to, amount, chain)`: Transfer funds
- `fundFromFaucet(amount, chain)`: Fund from faucet
- `core`: Core Space wallet client
- `evm`: eSpace wallet client

### Wallet Client Methods
Core Space (via cive):
- `sendTransaction()`: Send raw transaction
- `signMessage()`: Sign arbitrary message
- `signTransaction()`: Sign transaction
- `writeContract()`: Write to smart contract
- `readContract()`: Read from smart contract

eSpace (via viem):
- `sendTransaction()`: Send raw transaction  
- `signMessage()`: Sign arbitrary message
- `signTransaction()`: Sign transaction
- `writeContract()`: Write to smart contract
- `readContract()`: Read from smart contract

## Missing API Endpoints (Recommendations)

### 1. List All Accounts
- **GET** `/api/devkit/accounts` - Get all accounts summary
  ```json
  {
    "accounts": [
      {
        "index": 0,
        "addresses": { "core": "cfx:...", "evm": "0x..." },
        "isAdmin": true
      }
      // ... more accounts
    ],
    "total": 10,
    "mnemonic": "word1 word2...", // for admin only
    "faucetAccount": {
      "addresses": { "core": "cfx:...", "evm": "0x..." }
    }
  }
  ```

### 2. Sign Message
- **POST** `/api/devkit/accounts/:index/sign` - Sign arbitrary message
  ```json
  // Request
  {
    "message": "Hello World",
    "chain": "core" // "core" or "evm"
  }
  
  // Response  
  {
    "signature": "0x...",
    "message": "Hello World",
    "address": "cfx:...",
    "chain": "core"
  }
  ```

### 3. Contract Interaction
- **POST** `/api/devkit/accounts/:index/contract/write` - Write to contract
- **POST** `/api/devkit/accounts/:index/contract/read` - Read from contract

### 4. Faucet Operations
- **POST** `/api/devkit/faucet/fund` - Fund account from faucet
- **GET** `/api/devkit/faucet/balance` - Get faucet balance

## UI Requirements Analysis

### Wallet Selection Widget Components Needed:

1. **AccountsList Component**
   - Display all 10 accounts grouped by mnemonic index
   - Show both Core and eSpace addresses (shortened format)
   - Visual indicator for admin account
   - Selection state management

2. **AccountCard Component** 
   - Core address: `cfx:type.user:aak...7abc` → `cfx:...7abc`
   - eSpace address: `0x1234...7890` → `0x12...90`
   - Balance display for both chains
   - Selection checkbox/radio button
   - Copy address buttons

3. **WalletMethods Panel**
   - Transfer funds form
   - Sign message form  
   - Balance refresh button
   - Network indicator (shows current network from header)

4. **BalanceDisplay Component**
   - Real-time balance updates via WebSocket
   - Format large numbers (CFX format)
   - Loading states
   - Error handling for node offline

### State Management Structure:
```typescript
interface AccountState {
  accounts: DevKitAccount[]
  selectedAccount: number | null
  balances: { [index: number]: { core: string, evm: string } }
  loading: boolean
  error: string | null
}
```

### Widget Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Account Selection                                       │
├─────────────────────────────────────────────────────────┤
│ ○ Account 0  cfx:...abc  0x12...90  [100 CFX] [50 CFX] │
│ ○ Account 1  cfx:...def  0x34...12  [200 CFX] [75 CFX] │
│ ● Account 2  cfx:...ghi  0x56...34  [150 CFX] [25 CFX] │ ← Selected
│ ○ Account 3  cfx:...jkl  0x78...56  [300 CFX] [80 CFX] │
│ ...                                                     │
├─────────────────────────────────────────────────────────┤
│ Wallet Methods for Account 2                           │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│ │ Transfer    │ │ Sign Message│ │ Contract Interaction│ │
│ └─────────────┘ └─────────────┘ └─────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Balance: Core Space: 150.000 CFX | eSpace: 25.000 CFX  │
└─────────────────────────────────────────────────────────┘
```