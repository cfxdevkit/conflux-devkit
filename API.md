# Conflux DevKit API Documentation

<!--
Copyright 2025 Conflux DevKit Team

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

This document provides comprehensive documentation for the Conflux DevKit REST API and WebSocket interface.

## Base URL

- **Development**: `http://localhost:3001`
- **WebSocket**: `ws://localhost:3002`

## Authentication

Most endpoints require authentication via wallet connection. The admin user is determined by the first account (index 0) from the DevKit mnemonic.

### Headers

```http
Authorization: Bearer <wallet-signature>
X-Wallet-Address: <wallet-address>
```

## REST API Endpoints

### Node Management

#### Get Node Status
```http
GET /api/devkit/status
```

Returns the current status of the Conflux development node.

**Response:**
```json
{
  "status": "running",
  "running": true,
  "mining": {
    "isRunning": true,
    "interval": 1000,
    "blocksMined": 42
  },
  "chains": {
    "core": {
      "connected": true,
      "status": "running",
      "blockNumber": 42
    },
    "evm": {
      "connected": true,
      "status": "running",
      "blockNumber": 42
    }
  },
  "accounts": 10,
  "rpcUrls": {
    "core": "http://localhost:12537",
    "evm": "http://localhost:8545"
  },
  "timestamp": "2023-01-01T00:00:00.000Z",
  "config": {
    "chainId": 1029,
    "evmChainId": 1030,
    "ports": {
      "jsonrpcHttp": 12537,
      "jsonrpcHttpEth": 8545,
      "jsonrpcWs": 12535
    }
  }
}
```

#### Start Node
```http
POST /api/devkit/node/start
```

**Requires**: Admin access

Starts the Conflux development node.

**Response:**
```json
{
  "message": "Node started successfully",
  "status": {
    "core": {"status": "running"},
    "evm": {"status": "running"}
  }
}
```

#### Stop Node
```http
POST /api/devkit/node/stop
```

**Requires**: Admin access

Stops the Conflux development node.

**Response:**
```json
{
  "message": "Node stopped successfully",
  "status": {
    "core": {"status": "stopped"},
    "evm": {"status": "stopped"}
  }
}
```

### Mining Control

#### Start Mining
```http
POST /api/devkit/mining/start
```

**Requires**: Admin access, running node

Starts automatic block mining.

**Response:**
```json
{
  "message": "Mining started successfully",
  "status": {
    "isRunning": true,
    "interval": 1000,
    "blocksMined": 0
  }
}
```

#### Stop Mining
```http
POST /api/devkit/mining/stop
```

**Requires**: Admin access

Stops automatic block mining.

**Response:**
```json
{
  "message": "Mining stopped successfully",
  "status": {
    "isRunning": false,
    "interval": 1000,
    "blocksMined": 42
  }
}
```

#### Set Mining Interval
```http
POST /api/devkit/mining/interval
```

**Requires**: Admin access

**Body:**
```json
{
  "interval": 1000
}
```

Sets the automatic mining interval in milliseconds (minimum 100ms).

**Response:**
```json
{
  "message": "Mining interval updated successfully",
  "status": {
    "isRunning": true,
    "interval": 1000,
    "blocksMined": 42
  }
}
```

#### Mine Blocks
```http
POST /api/devkit/mining/mine
```

**Requires**: Admin access

**Body:**
```json
{
  "blocks": 5
}
```

Mines a specific number of blocks (1-100).

**Response:**
```json
{
  "message": "Mined 5 blocks successfully",
  "blocks": 5,
  "status": {
    "isRunning": false,
    "interval": 1000,
    "blocksMined": 47
  }
}
```

### Account Management

#### List All Accounts
```http
GET /api/devkit/accounts
```

**Requires**: Authentication

Returns all available accounts with their addresses.

**Response:**
```json
{
  "accounts": [
    {
      "index": 0,
      "addresses": {
        "core": "cfx:aak2rra2njvd77ezwjvx04kkds9fzagfe6ku8scz91",
        "evm": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      },
      "isAdmin": true
    }
  ],
  "total": 10,
  "faucetAccount": {
    "addresses": {
      "core": "cfx:aak2rra2njvd77ezwjvx04kkds9fzagfe6ku8scz91",
      "evm": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    }
  }
}
```

#### Get Account Information
```http
GET /api/devkit/accounts/:index
```

**Requires**: Authentication

Returns information about a specific account (index 0-9).

**Response:**
```json
{
  "index": 0,
  "addresses": {
    "core": "cfx:aak2rra2njvd77ezwjvx04kkds9fzagfe6ku8scz91",
    "evm": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  "isAdmin": true
}
```

#### Get Account Balance
```http
GET /api/devkit/accounts/:index/balance
```

**Requires**: Authentication

Returns the balance for both Core Space and eSpace for the specified account.

**Response:**
```json
{
  "index": 0,
  "balances": {
    "core": "10000000000000000000000",
    "evm": "10000000000000000000000"
  },
  "network": "local",
  "config": {
    "chainId": 71,
    "rpcUrl": "http://localhost:12537",
    "coreRpcUrl": "http://localhost:12539"
  }
}
```

### Transaction Operations

#### Send Transaction
```http
POST /api/devkit/transactions/send
```

**Requires**: Authentication

**Body:**
```json
{
  "accountIndex": 0,
  "to": "0x742d35Cc6634C0532925a3b8D72Dc6d4C2f5e",
  "value": "1000000000000000000",
  "chain": "core"
}
```

Sends a transaction from the specified account.

**Response:**
```json
{
  "transactionHash": "0x...",
  "from": "cfx:aak2rra2njvd77ezwjvx04kkds9fzagfe6ku8scz91",
  "to": "cfx:...",
  "value": "1000000000000000000",
  "chain": "core"
}
```

#### Sign Message
```http
POST /api/devkit/accounts/:index/sign
```

**Requires**: Authentication

**Body:**
```json
{
  "message": "Hello, Conflux!",
  "chain": "core"
}
```

Signs a message with the specified account's private key.

**Response:**
```json
{
  "signature": "0x...",
  "message": "Hello, Conflux!",
  "address": "cfx:aak2rra2njvd77ezwjvx04kkds9fzagfe6ku8scz91",
  "chain": "core",
  "accountIndex": 0
}
```

### Contract Operations

#### Deploy Contract
```http
POST /api/devkit/deploy
```

**Requires**: Authentication

**Body:**
```json
{
  "abi": [...],
  "bytecode": "0x608060405234801561001057600080fd5b50...",
  "args": ["arg1", "arg2"],
  "accountIndex": 0,
  "chain": "core"
}
```

Deploys a smart contract to the specified chain.

**Response:**
```json
{
  "address": "cfx:...",
  "chain": "core",
  "deployer": "cfx:aak2rra2njvd77ezwjvx04kkds9fzagfe6ku8scz91"
}
```

#### Get Contract Information
```http
GET /api/devkit/contracts/:address?chain=core
```

Returns basic information about a deployed contract.

**Response:**
```json
{
  "address": "cfx:...",
  "chain": "core"
}
```

### Network Management

#### Switch Network
```http
POST /api/devkit/network/switch
```

**Body:**
```json
{
  "network": "testnet"
}
```

Switches between networks: `local`, `testnet`, `mainnet`.

**Response:**
```json
{
  "message": "Switched to testnet network",
  "network": "testnet",
  "config": {
    "chainId": 71,
    "rpcUrl": "https://evmtestnet.confluxrpc.com",
    "coreRpcUrl": "https://test.confluxrpc.com"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### Get Current Network
```http
GET /api/devkit/network/current
```

Returns the currently selected network.

**Response:**
```json
{
  "network": "local",
  "config": {
    "chainId": 71,
    "rpcUrl": "http://localhost:12537",
    "coreRpcUrl": "http://localhost:12539"
  }
}
```

## WebSocket Interface

The WebSocket server provides real-time updates for various DevKit events.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3002');
```

### Event Types

#### Node Status Updates
```json
{
  "type": "node-status",
  "data": {
    "status": "running",
    "mining": {
      "isRunning": true,
      "interval": 1000,
      "blocksMined": 42
    },
    "chains": {
      "core": {"status": "running"},
      "evm": {"status": "running"}
    }
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### Block Mined
```json
{
  "type": "block-mined",
  "data": {
    "blockNumber": 43,
    "chain": "core",
    "miner": "cfx:..."
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### Network Switched
```json
{
  "type": "network-switched",
  "data": {
    "network": "testnet",
    "config": {
      "chainId": 71,
      "rpcUrl": "https://evmtestnet.confluxrpc.com"
    }
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### Balance Changed
```json
{
  "type": "balance-changed",
  "data": {
    "address": "cfx:...",
    "chain": "core",
    "oldBalance": "1000000000000000000",
    "newBalance": "2000000000000000000"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API implements basic rate limiting to prevent abuse:

- **General endpoints**: 100 requests per minute
- **Mining operations**: 10 requests per minute
- **Node control**: 5 requests per minute

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/devkit',
  headers: {
    'Authorization': 'Bearer <wallet-signature>',
    'X-Wallet-Address': '<wallet-address>'
  }
});

// Get node status
const status = await api.get('/status');

// Start mining
const miningResult = await api.post('/mining/start');

// Deploy contract
const deployment = await api.post('/deploy', {
  abi: contractAbi,
  bytecode: contractBytecode,
  args: ['constructor', 'args'],
  chain: 'core'
});
```

### WebSocket Client

```typescript
const ws = new WebSocket('ws://localhost:3002');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'node-status':
      console.log('Node status updated:', message.data);
      break;
    case 'block-mined':
      console.log('New block mined:', message.data);
      break;
    case 'network-switched':
      console.log('Network changed:', message.data);
      break;
  }
};
```

## Security Considerations

1. **Authentication**: Always verify wallet signatures for authenticated endpoints
2. **Admin Access**: Node control operations require admin privileges
3. **Input Validation**: All inputs are validated and sanitized
4. **CORS**: Configured for development environments
5. **Rate Limiting**: Prevents API abuse
6. **Environment Variables**: Sensitive configuration via environment variables

## Development Notes

- The API is designed for development and testing environments
- For production use, implement additional security measures
- Monitor rate limiting and adjust as needed
- Log all critical operations for debugging
- Use HTTPS in production environments