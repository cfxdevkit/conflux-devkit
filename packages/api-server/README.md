# @conflux-devkit/api-server

> **RESTful API server for Conflux DevKit applications**

[![npm version](https://img.shields.io/npm/v/@conflux-devkit/api-server)](https://www.npmjs.com/package/@conflux-devkit/api-server)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 Overview

The API server provides a comprehensive RESTful API for Conflux DevKit applications. It integrates with the state management system to provide real-time blockchain data, wallet operations, contract management, and node control through HTTP endpoints.

## ✨ Features

- **🔌 RESTful API**: Complete REST API for all DevKit operations
- **📊 Real-time Data**: Live blockchain data and state updates
- **💼 Wallet Management**: Wallet creation, import, and management APIs
- **📦 Contract Operations**: Contract deployment and interaction APIs
- **🌐 Network Management**: Multi-network support and switching
- **🖥️ Node Control**: Node start, stop, and status management
- **🔒 Security**: Rate limiting, CORS, and security headers
- **📱 State Integration**: Direct integration with Zustand state store

## 📦 Installation

```bash
pnpm add @conflux-devkit/api-server
# or
npm install @conflux-devkit/api-server
# or
yarn add @conflux-devkit/api-server
```

## 🚀 Quick Start

```typescript
import { createApiServer } from '@conflux-devkit/api-server';

// Create and start API server
const server = createApiServer({
  port: 3001,
  cors: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
  },
});

server.start().then(() => {
  console.log('API server running on port 3001');
});
```

## 📚 API Reference

### Base URL

```
http://localhost:3001/api
```

### Authentication

All endpoints require proper authentication. Include the API key in the request headers:

```http
Authorization: Bearer YOUR_API_KEY
```

### Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
}
```

### Endpoints

#### System Health

```http
GET /api/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}
```

#### Wallet Management

##### Create Wallet

```http
POST /api/wallets
Content-Type: application/json

{
  "mnemonic": "optional mnemonic phrase"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890abcdef...",
    "privateKey": "0x...",
    "mnemonic": "word1 word2 word3...",
    "balance": "0",
    "balanceFormatted": "0.0 CFX"
  }
}
```

##### Import Wallet

```http
POST /api/wallets/import
Content-Type: application/json

{
  "privateKey": "0x1234567890abcdef..."
}
```

##### Get Wallet Info

```http
GET /api/wallets/{address}
```

##### Get All Wallets

```http
GET /api/wallets
```

##### Refresh Wallet Balance

```http
POST /api/wallets/{address}/refresh
```

##### Send Transaction

```http
POST /api/wallets/{address}/send
Content-Type: application/json

{
  "to": "0x9876543210fedcba...",
  "value": "1000000000000000000",
  "privateKey": "0x..."
}
```

#### Contract Management

##### Deploy Contract

```http
POST /api/contracts
Content-Type: application/json

{
  "name": "MyContract",
  "bytecode": "0x608060405234801561001057600080fd5b50...",
  "abi": [...],
  "args": [1000000]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "name": "MyContract",
    "address": "0x5678901234abcdef...",
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "gasUsed": "1000000"
  }
}
```

##### Get Contract Info

```http
GET /api/contracts/{address}
```

##### Get All Contracts

```http
GET /api/contracts
```

##### Call Contract Method

```http
POST /api/contracts/{address}/call
Content-Type: application/json

{
  "methodName": "totalSupply",
  "args": [],
  "privateKey": "0x..."
}
```

##### Send Contract Transaction

```http
POST /api/contracts/{address}/send
Content-Type: application/json

{
  "methodName": "transfer",
  "args": ["0x9876543210fedcba...", 1000],
  "privateKey": "0x...",
  "value": "0"
}
```

#### Node Management

##### Get Node Status

```http
GET /api/node/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "running": true,
    "chainId": "2029",
    "evmChainId": "2030",
    "blockNumber": "12345",
    "peerCount": "5",
    "uptime": "3600"
  }
}
```

##### Start Node

```http
POST /api/node/start
Content-Type: application/json

{
  "chainId": 2029,
  "evmChainId": 2030,
  "corePort": 12537,
  "evmPort": 8545
}
```

##### Stop Node

```http
POST /api/node/stop
```

##### Restart Node

```http
POST /api/node/restart
Content-Type: application/json

{
  "chainId": 2029,
  "evmChainId": 2030
}
```

#### Network Management

##### Get Current Network

```http
GET /api/network/current
```

##### Switch Network

```http
POST /api/network/switch
Content-Type: application/json

{
  "networkId": "2030"
}
```

##### Get Available Networks

```http
GET /api/network/available
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "Conflux Mainnet EVM",
      "chainId": "2030",
      "evmChainId": "2030",
      "rpcUrl": "https://main.confluxrpc.com",
      "isTestnet": false
    }
  ]
}
```

#### State Management

##### Get App State

```http
GET /api/state
```

##### Get Wallet State

```http
GET /api/state/wallets
```

##### Get Contract State

```http
GET /api/state/contracts
```

##### Get Node State

```http
GET /api/state/node
```

##### Get Network State

```http
GET /api/state/network
```

## 🧪 Examples

### JavaScript/TypeScript

```typescript
// Create wallet
const response = await fetch('http://localhost:3001/api/wallets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    mnemonic:
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  }),
});

const wallet = await response.json();
console.log('Wallet created:', wallet.data.address);

// Deploy contract
const contractResponse = await fetch('http://localhost:3001/api/contracts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    name: 'MyToken',
    bytecode: '0x608060405234801561001057600080fd5b50...',
    abi: [
      {
        type: 'constructor',
        inputs: [{ name: 'initialSupply', type: 'uint256' }],
        stateMutability: 'nonpayable',
      },
    ],
    args: [1000000],
  }),
});

const contract = await contractResponse.json();
console.log('Contract deployed:', contract.data.address);
```

### cURL

```bash
# Create wallet
curl -X POST http://localhost:3001/api/wallets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"mnemonic": "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"}'

# Get wallet info
curl -X GET http://localhost:3001/api/wallets/0x1234567890abcdef... \
  -H "Authorization: Bearer YOUR_API_KEY"

# Deploy contract
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "name": "MyToken",
    "bytecode": "0x608060405234801561001057600080fd5b50...",
    "abi": [{"type": "constructor", "inputs": [{"name": "initialSupply", "type": "uint256"}], "stateMutability": "nonpayable"}],
    "args": [1000000]
  }'
```

### Python

```python
import requests

# Create wallet
response = requests.post(
    'http://localhost:3001/api/wallets',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'mnemonic': 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    }
)

wallet = response.json()
print(f'Wallet created: {wallet["data"]["address"]}')

# Deploy contract
contract_response = requests.post(
    'http://localhost:3001/api/contracts',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'name': 'MyToken',
        'bytecode': '0x608060405234801561001057600080fd5b50...',
        'abi': [
            {
                'type': 'constructor',
                'inputs': [{'name': 'initialSupply', 'type': 'uint256'}],
                'stateMutability': 'nonpayable'
            }
        ],
        'args': [1000000]
    }
)

contract = contract_response.json()
print(f'Contract deployed: {contract["data"]["address"]}')
```

## 🔧 Configuration

### Server Configuration

```typescript
import { createApiServer } from '@conflux-devkit/api-server';

const server = createApiServer({
  port: 3001,
  host: 'localhost',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  },
  helmet: {
    contentSecurityPolicy: false,
  },
});
```

### Environment Variables

```bash
# Server configuration
PORT=3001
HOST=localhost
NODE_ENV=production

# API configuration
API_KEY=your-secret-api-key
CORS_ORIGIN=http://localhost:3000,http://localhost:3002

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# Blockchain configuration
CONFLUX_RPC_URL=https://main.confluxrpc.com
CONFLUX_EVM_RPC_URL=https://main.confluxrpc.com
```

## 🔗 Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **@conflux-devkit/core**: Core types and utilities
- **@conflux-devkit/state**: State management integration

## 📊 Bundle Size

- **Minified**: ~25KB
- **Gzipped**: ~8KB
- **Tree-shakeable**: Import only what you need

## 🚨 Security Notes

- **API Keys**: Always use secure API keys
- **Rate Limiting**: Configure appropriate rate limits
- **CORS**: Configure CORS properly for production
- **Input Validation**: Validate all input parameters
- **Error Handling**: Don't expose sensitive error information

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Part of the Conflux DevKit ecosystem** 🚀
