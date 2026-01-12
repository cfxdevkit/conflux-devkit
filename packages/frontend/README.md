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

# @conflux-devkit/frontend

Modern React frontend application for Conflux blockchain development. Provides a user-friendly interface for interacting with the Conflux DevKit backend, managing accounts, deploying contracts, and monitoring blockchain activity in real-time.

## Features

- 💼 **Account Management** - View addresses, balances, and private keys for development accounts
- 📝 **Contract Deployment** - Deploy smart contracts through an intuitive UI
- 🔧 **Contract Interaction** - Call read and write functions on deployed contracts
- 📊 **Real-Time Monitoring** - Live blockchain updates via WebSocket connection
- 🔄 **Dual-Chain Support** - Seamless switching between Conflux Core Space and eSpace
- 🔌 **Wallet Integration** - Connect MetaMask, Fluent Wallet, and other web3 wallets
- 🎨 **Modern UI** - Clean, responsive design built with Tailwind CSS
- ⚡ **Fast Development** - Vite for instant hot module replacement

## Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety and IntelliSense support
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ConnectKit** - Beautiful wallet connection UI
- **Wagmi** - React hooks for Ethereum (eSpace compatible)
- **React Query** - Powerful data fetching and caching
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icon library

## Installation

```bash
# From the monorepo root
pnpm install

# Or in the frontend directory
cd packages/frontend
pnpm install
```

## Development

### Start the Frontend

```bash
# From monorepo root
pnpm dev:frontend

# Or from frontend directory
cd packages/frontend
pnpm dev
```

The application will be available at [http://localhost:3003](http://localhost:3003)

### Prerequisites

The frontend requires the backend service to be running:

```bash
# Start the backend (from monorepo root)
pnpm dev:backend
```

This starts:
- REST API at `http://localhost:3001`
- WebSocket server at `ws://localhost:3002`

## Configuration

### Environment Variables

Create a `.env` file in the `packages/frontend` directory:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3001

# WebSocket URL
VITE_WS_URL=ws://localhost:3002

# Chain Configuration
VITE_CORE_CHAIN_ID=2029
VITE_EVM_CHAIN_ID=2030
```

### Wagmi Configuration

The frontend uses Wagmi for eSpace wallet connections. Configuration is in [src/config/wagmi.ts](./src/config/wagmi.ts):

```typescript
import { createConfig } from 'wagmi';
import { confluxESpace } from 'wagmi/chains';

export const config = createConfig({
  chains: [confluxESpace],
  // ... additional configuration
});
```

## Features Overview

### Account Dashboard

View and manage development accounts:
- See both Core Space (cfx:...) and eSpace (0x...) addresses
- Check balances on both chains
- Copy addresses and private keys for development use
- Request test tokens from faucet

### Contract Deployment

Deploy smart contracts with ease:
1. Enter contract ABI (JSON format)
2. Provide bytecode (hex string)
3. Select target chain (Core Space or eSpace)
4. Add constructor arguments if needed
5. Deploy with one click

### Contract Interaction

Interact with deployed contracts:
- **Read Functions**: Call view/pure functions without gas
- **Write Functions**: Send transactions to modify state
- **Event Logs**: View emitted events (planned feature)
- **Transaction History**: Track all interactions

### Real-Time Updates

WebSocket integration provides:
- Live node status updates
- New block notifications
- Balance changes
- Transaction confirmations

### Wallet Connection

Connect external wallets via ConnectKit:
- MetaMask
- Fluent Wallet
- WalletConnect
- Coinbase Wallet
- And more...

## Project Structure

```
packages/frontend/
├── src/
│   ├── components/     # React components
│   ├── config/         # Configuration files (Wagmi, etc.)
│   ├── contracts/      # Contract ABIs and addresses
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API and WebSocket services
│   ├── stores/         # Zustand state stores
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json
```

## Building for Production

```bash
# Build the frontend
pnpm build

# Preview production build
pnpm preview
```

The build output will be in the `dist` directory and can be served by any static file server.

## Integration with Backend

The frontend communicates with the backend via:

### REST API

```typescript
import axios from 'axios';

// Get accounts
const accounts = await axios.get('http://localhost:3001/api/devkit/accounts');

// Request test tokens
await axios.post('http://localhost:3001/api/devkit/faucet', {
  address: 'cfx:...',
  amount: '100',
});
```

### WebSocket

```typescript
const ws = new WebSocket('ws://localhost:3002');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'node_status':
      console.log('Node status:', data.status);
      break;
    case 'block_mined':
      console.log('New block:', data.blockNumber);
      break;
    case 'balance_changed':
      console.log('Balance update:', data.address, data.balance);
      break;
  }
};
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm clean` | Remove build artifacts |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

This package is part of the [Conflux DevKit](https://github.com/conflux-devkit/conflux-devkit) monorepo. See the main repository for contribution guidelines.

## License

Apache-2.0

Copyright 2025 Conflux DevKit Team

See [LICENSE](../../LICENSE) for the full license text.
