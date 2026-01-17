# @conflux-devkit/frontend - Architecture Overview

## Package Purpose

This package provides a focused frontend application for managing local Conflux development nodes with integrated wallet authentication. It leverages the new modular architecture of Conflux DevKit.

## Key Design Decisions

### 1. Mantine UI Framework
**Why Mantine?**
- Complete component library with excellent TypeScript support
- Built-in accessibility (ARIA attributes, keyboard navigation)
- Beautiful default styling with easy customization
- Comprehensive hooks library (@mantine/hooks)
- Active development and strong community
- Better than building custom components with Tailwind CSS

### 2. Focused Scope
**Auth + DevNode Management Only**
- Authentication via wallet (ConnectKit + Wagmi)
- Local development node lifecycle (start/stop/restart)
- Mining configuration (auto/manual modes)
- Account management and faucet operations
- Real-time monitoring via WebSocket

**Out of Scope:**
- Contract deployment UI (see @conflux-devkit/frontend for full-featured UI)
- Transaction builder
- Block explorer
- Advanced analytics

### 3. State Management with Zustand
**Why Zustand?**
- Minimal boilerplate compared to Redux
- No Context Provider wrapper needed
- Built-in persistence middleware
- TypeScript-first design
- ~1KB bundle size
- Perfect for this focused application

### 4. Backend Integration
**Tight Integration with @conflux-devkit/backend**
- REST API for commands (start/stop/mine/faucet)
- WebSocket for real-time updates
- Development auth service for wallet-based auth
- Plugin system awareness (devnode plugin)

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        App.tsx                          │
│                   (Mantine AppShell)                    │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  AuthSection   │ │ DevNodePanel│ │  DevNodeStatus │
│                │ │              │ │                │
│ - ConnectKit   │ │ - Start/Stop │ │ - Core Chain  │
│ - User Profile │ │ - Mining     │ │ - eSpace      │
│ - Logout       │ │ - Restart    │ │ - Real-time   │
└────────────────┘ └──────────────┘ └────────────────┘
        │                 │                 │
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────┐
│                  AccountsTable                        │
│                                                       │
│  - Core + eSpace Addresses                           │
│  - Balances                                          │
│  - Faucet Buttons                                    │
└───────────────────────────────────────────────────────┘
```

## State Flow

### Auth Flow
```
User → ConnectKit → Wagmi → Sign Message → Backend Auth API
                                                ↓
                                           JWT Token
                                                ↓
                                         localStorage
                                                ↓
                                           authStore
```

### DevNode Flow
```
User Action → Component → devnodeStore → API Client → Backend
                              ↓
                         Update State
                              ↓
                       Re-render UI

WebSocket Event → wsClient → devnodeStore → Update State → Re-render
```

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP/WS
       │
┌──────▼──────────────────────────────────────┐
│         Frontend (Port 3000)                │
│                                             │
│  ┌────────────┐        ┌─────────────┐    │
│  │ authStore  │◄───────┤  apiClient  │    │
│  └────────────┘        └──────┬──────┘    │
│                               │            │
│  ┌────────────┐        ┌──────▼──────┐    │
│  │devnodeStore│◄───────┤  wsClient   │    │
│  └────────────┘        └─────────────┘    │
└──────┬──────────────────────────┬──────────┘
       │                          │
       │ REST                     │ WebSocket
       │                          │
┌──────▼──────────────────────────▼──────────┐
│      Backend (Ports 3001/3002)             │
│                                            │
│  ┌──────────┐  ┌─────────────────────┐   │
│  │   API    │  │   WebSocketServer   │   │
│  └────┬─────┘  └───────────┬─────────┘   │
│       │                    │              │
│  ┌────▼──────────┐    ┌────▼──────────┐  │
│  │ AuthService   │    │ PluginManager │  │
│  └───────────────┘    └────┬──────────┘  │
│                            │              │
│                       ┌────▼──────────┐  │
│                       │DevNodePlugin  │  │
│                       └────┬──────────┘  │
└────────────────────────────┼─────────────┘
                             │
                    ┌────────▼────────┐
                    │   @xcfx/node    │
                    │                 │
                    │ Local Dev Node  │
                    │ (Core + eSpace) │
                    └─────────────────┘
```

## Technology Stack

### Core Framework
- **React 18**: Latest React with Concurrent Features
- **TypeScript 5.9**: Full type safety
- **Vite 5**: Lightning-fast dev server and builds

### UI Framework
- **Mantine 7**: Complete component library
- **@tabler/icons-react**: Icon library
- **Mantine Hooks**: Useful React hooks
- **Mantine Notifications**: Toast notifications

### Blockchain Integration
- **Wagmi 2**: React hooks for Ethereum
- **Viem 2**: TypeScript Ethereum library
- **ConnectKit 1.8**: Wallet connection UI
- **@conflux-devkit/core**: Core blockchain clients

### State Management
- **Zustand 5**: Lightweight state management
- **TanStack Query 5**: Data fetching and caching

### HTTP & WebSocket
- **Axios**: HTTP client
- **Native WebSocket API**: Real-time updates

## Package Dependencies

### Internal Dependencies
```json
{
  "@conflux-devkit/core": "workspace:*",
  "@conflux-devkit/ui-headless": "workspace:*"
}
```

### External Dependencies
```json
{
  "@mantine/core": "^7.15.5",
  "@mantine/hooks": "^7.15.5",
  "@mantine/notifications": "^7.15.5",
  "@mantine/form": "^7.15.5",
  "@tabler/icons-react": "^3.29.0",
  "@tanstack/react-query": "^5.90.12",
  "axios": "^1.13.2",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.28.1",
  "zustand": "^5.0.3",
  "connectkit": "^1.8.2",
  "wagmi": "^2.12.20",
  "viem": "^2.43.3"
}
```

## File Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── AuthSection.tsx
│   │   ├── DevNodeControlPanel.tsx
│   │   ├── DevNodeStatus.tsx
│   │   └── AccountsTable.tsx
│   ├── config/             # App configuration
│   │   └── wagmi.ts
│   ├── hooks/              # Custom React hooks (future)
│   ├── services/           # External services
│   │   ├── api.ts
│   │   └── websocket.ts
│   ├── stores/             # Zustand stores
│   │   ├── authStore.ts
│   │   └── devnodeStore.ts
│   ├── types/              # TypeScript types
│   │   ├── auth.ts
│   │   └── devnode.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts       # Vite types
├── index.html              # HTML entry
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.cjs
├── README.md
└── ARCHITECTURE.md
```

## API Integration

### REST Endpoints (Port 3001)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/authenticate` | Wallet-based authentication |
| POST | `/api/auth/verify` | Verify JWT token |
| GET | `/api/devnode/status` | Get current node status |
| POST | `/api/devnode/start` | Start development node |
| POST | `/api/devnode/stop` | Stop development node |
| POST | `/api/devnode/restart` | Restart development node |
| POST | `/api/devnode/mining` | Set mining mode (auto/manual) |
| POST | `/api/devnode/mine` | Mine a single block |
| POST | `/api/devnode/faucet` | Request test tokens |
| GET | `/api/devnode/accounts` | List all accounts |

### WebSocket Events (Port 3002)

| Event | Direction | Data |
|-------|-----------|------|
| `devnode:status` | Server → Client | Node status update |
| `devnode:block` | Server → Client | New block mined |
| `devnode:transaction` | Server → Client | Transaction confirmed |
| `devnode:error` | Server → Client | Error occurred |
| `devnode:started` | Server → Client | Node started |
| `devnode:stopped` | Server → Client | Node stopped |

## Security Considerations

### Authentication
- JWT tokens stored in localStorage
- Token included in Authorization header
- Automatic token refresh on page load
- Logout on 401 responses

### API Communication
- CORS configured in backend
- Environment variables for API URLs
- Error handling for network failures
- Request/response interceptors

### WebSocket
- Automatic reconnection with exponential backoff
- Max 5 reconnection attempts
- Connection state management
- Event subscription cleanup

## Future Enhancements

### Potential Features
1. **Multi-Network Support**: Switch between local/testnet/mainnet
2. **Transaction Builder**: Build and send custom transactions
3. **Contract Browser**: Browse and interact with deployed contracts
4. **Log Viewer**: View node logs in real-time
5. **Snapshot Management**: Create and restore node snapshots
6. **Gas Optimization**: Analyze and optimize gas usage
7. **Network Analytics**: Charts for blocks, transactions, gas prices

### Performance Optimizations
1. **Code Splitting**: Lazy load routes and components
2. **Virtual Scrolling**: For large account lists
3. **Memoization**: React.memo for expensive components
4. **WebSocket Throttling**: Debounce rapid updates
5. **Image Optimization**: Optimize assets with Vite

### Developer Experience
1. **Storybook**: Component documentation
2. **Unit Tests**: Vitest + Testing Library
3. **E2E Tests**: Playwright
4. **CI/CD**: Automated builds and deployments
5. **Docker**: Containerized deployment

## Comparison with Original Frontend

### Original Frontend (@conflux-devkit/frontend v2.0.0)
- Broader scope (contracts, swaps, full dashboard)
- Tailwind CSS for styling
- Mixed concerns in components
- Not npm-publishable
- Tightly coupled to full DevKit

### New Frontend (@conflux-devkit/frontend v1.0.0)
- Focused scope (auth + devnode only)
- Mantine UI component library
- Clean separation of concerns
- Ready for npm publishing
- Modular architecture
- Better type safety
- WebSocket integration
- Professional UI/UX

## Contributing

When adding new features:

1. **Add Types First**: Define TypeScript interfaces in `src/types/`
2. **Update Store**: Add state and actions to appropriate store
3. **Create Component**: Build UI component with Mantine
4. **Update API Client**: Add new endpoints to `src/services/api.ts`
5. **Test Integration**: Ensure backend integration works
6. **Document**: Update README with new feature

## License

Apache-2.0
