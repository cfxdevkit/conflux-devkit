# @conflux-devkit/frontend-devnode

Modern React frontend for Conflux DevKit with a focus on **authentication** and **local development node management**. Built with Mantine UI for a beautiful, professional interface.

## Features

### Authentication
- **Wallet-Based Auth**: ConnectKit integration for seamless wallet connection
- **Multi-Chain Support**: Connect with Conflux Core, eSpace, and Ethereum networks
- **Session Management**: Persistent authentication with token-based auth
- **Development Auth Service**: Integration with `@conflux-devkit/backend` auth

### DevNode Management
- **Node Lifecycle Control**: Start, stop, and restart local development nodes
- **Mining Configuration**: Toggle between auto and manual mining modes
- **Real-Time Status**: Live updates via WebSocket for node status and blocks
- **Dual-Chain Monitoring**: Monitor both Core Space and eSpace simultaneously
- **Account Management**: View and manage test accounts with balances
- **Faucet Operations**: Request test tokens for development accounts

### Modern Stack
- **React 18**: Latest React with TypeScript
- **Mantine UI**: Beautiful, accessible component library
- **Vite**: Lightning-fast development and builds
- **Zustand**: Lightweight state management
- **TanStack Query**: Powerful data fetching and caching
- **ConnectKit + Wagmi**: Best-in-class wallet integration

## Installation

```bash
# From monorepo root
pnpm install

# Or install individually
cd packages/frontend-devnode
pnpm install
```

## Quick Start

### 1. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get a WalletConnect Project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com)

### 2. Start the Backend

The frontend requires the backend API to be running:

```bash
# From monorepo root
pnpm dev:backend

# Or start all services
pnpm dev
```

### 3. Start the Frontend

```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm preview
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Architecture

### Project Structure

```
src/
├── components/          # React components
│   ├── AuthSection.tsx           # Wallet connection UI
│   ├── DevNodeControlPanel.tsx   # Node start/stop/restart controls
│   ├── DevNodeStatus.tsx         # Real-time node status display
│   └── AccountsTable.tsx         # Account list with faucet
├── config/             # Configuration
│   └── wagmi.ts                  # Wagmi + ConnectKit setup
├── services/           # External services
│   ├── api.ts                    # REST API client
│   └── websocket.ts              # WebSocket client
├── stores/             # State management
│   ├── authStore.ts              # Authentication state
│   └── devnodeStore.ts           # DevNode state
├── types/              # TypeScript types
│   ├── auth.ts
│   └── devnode.ts
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

### State Management

The app uses **Zustand** for state management with two main stores:

#### Auth Store (`authStore.ts`)
- User authentication state
- Login/logout actions
- Token persistence
- Auth verification

#### DevNode Store (`devnodeStore.ts`)
- Node status and configuration
- Account management
- Mining controls
- Faucet operations

### API Integration

#### REST API (`services/api.ts`)
Communicates with `@conflux-devkit/backend`:

- `POST /api/auth/authenticate` - Wallet authentication
- `GET /api/devnode/status` - Get node status
- `POST /api/devnode/start` - Start development node
- `POST /api/devnode/stop` - Stop development node
- `POST /api/devnode/mining` - Configure mining mode
- `POST /api/devnode/faucet` - Request test tokens
- `GET /api/devnode/accounts` - List accounts

#### WebSocket (`services/websocket.ts`)
Real-time updates for:

- `devnode:status` - Node status changes
- `devnode:block` - New block notifications
- `devnode:transaction` - Transaction updates
- `devnode:error` - Error notifications
- `devnode:started` - Node started event
- `devnode:stopped` - Node stopped event

## Components

### AuthSection

Wallet connection interface using ConnectKit:

```tsx
import { AuthSection } from '@/components/AuthSection';

<AuthSection />
```

Features:
- ConnectKit button for wallet connection
- User profile display when connected
- Disconnect functionality

### DevNodeControlPanel

Main control panel for node management:

```tsx
import { DevNodeControlPanel } from '@/components/DevNodeControlPanel';

<DevNodeControlPanel />
```

Features:
- Start/Stop/Restart buttons
- Auto/Manual mining toggle
- Block time configuration
- Manual mine block button

### DevNodeStatus

Real-time status display for both chains:

```tsx
import { DevNodeStatus } from '@/components/DevNodeStatus';

<DevNodeStatus />
```

Shows:
- Core Space: Chain ID, block number, gas price, RPC URL
- eSpace: Chain ID, block number, gas price, RPC URL

### AccountsTable

Development accounts with balances and faucet:

```tsx
import { AccountsTable } from '@/components/AccountsTable';

<AccountsTable />
```

Features:
- Lists all development accounts
- Shows both Core and eSpace addresses
- Displays balances for both chains
- Copy address buttons
- Faucet request buttons

## Development

### Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm type-check

# Linting and formatting (Biome)
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:fix
pnpm check:fix
```

### Adding New Features

1. **New Component**: Add to `src/components/`
2. **New Store**: Add to `src/stores/` using Zustand
3. **New API Endpoint**: Update `src/services/api.ts`
4. **New WebSocket Event**: Update `src/services/websocket.ts`
5. **New Type**: Add to `src/types/`

## Integration with Backend

This frontend is designed to work with `@conflux-devkit/backend`:

```typescript
// Backend should expose these endpoints
GET  /api/devnode/status
POST /api/devnode/start
POST /api/devnode/stop
POST /api/devnode/restart
POST /api/devnode/mining
POST /api/devnode/mine
POST /api/devnode/faucet
GET  /api/devnode/accounts
POST /api/auth/authenticate
POST /api/auth/verify
```

And WebSocket events on port 3002:
- `devnode:status`
- `devnode:block`
- `devnode:transaction`
- `devnode:error`

## Customization

### Theming

Mantine theme is configured in [src/main.tsx](src/main.tsx:36-40):

```tsx
<MantineProvider
  theme={{
    primaryColor: 'blue',
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  }}
>
```

### Network Configuration

Add or modify chains in [src/config/wagmi.ts](src/config/wagmi.ts:139-164):

```typescript
export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [
      confluxLocalCore,
      confluxLocalESpace,
      // Add more chains here
    ],
    // ... rest of config
  })
);
```

## Deployment

### Docker

```bash
# Build
docker build -t conflux-devkit-frontend .

# Run
docker run -p 3000:3000 conflux-devkit-frontend
```

### Static Hosting

```bash
# Build
pnpm build

# Deploy dist/ directory to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - GitHub Pages
```

## Dependencies

### Core
- `react` ^18.3.1
- `react-dom` ^18.3.1
- `vite` ^5.4.21
- `typescript` ^5.9.3

### UI & Styling
- `@mantine/core` ^7.15.5
- `@mantine/hooks` ^7.15.5
- `@mantine/notifications` ^7.15.5
- `@mantine/form` ^7.15.5
- `@tabler/icons-react` ^3.29.0

### Blockchain
- `wagmi` ^2.12.20
- `viem` ^2.43.3
- `connectkit` ^1.8.2
- `@conflux-devkit/core` workspace:*
- `@conflux-devkit/ui-headless` workspace:*

### State & Data
- `zustand` ^5.0.3
- `@tanstack/react-query` ^5.90.12
- `axios` ^1.13.2

## Troubleshooting

### WebSocket Connection Issues

If WebSocket fails to connect:

1. Ensure backend is running on port 3002
2. Check CORS settings in backend
3. Verify `VITE_WS_URL` in `.env`

### Wallet Connection Issues

If wallet connection fails:

1. Check `VITE_WALLETCONNECT_PROJECT_ID` is set
2. Ensure wallet extension is installed
3. Try different browser if issues persist

### API Errors

If API requests fail:

1. Ensure backend is running on port 3001
2. Check backend logs for errors
3. Verify `VITE_API_URL` in `.env`

## Contributing

This package is part of the [Conflux DevKit](https://github.com/cfxdevkit/conflux-devkit) monorepo.

## License

Apache-2.0

## Links

- [GitHub Repository](https://github.com/cfxdevkit/conflux-devkit)
- [Documentation](https://github.com/cfxdevkit/conflux-devkit#readme)
- [Issues](https://github.com/cfxdevkit/conflux-devkit/issues)
- [Conflux Network](https://confluxnetwork.org/)
