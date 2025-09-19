# Conflux DevKit Showcase Application

This is the main showcase application that provides a complete workspace management dashboard for the Conflux DevKit ecosystem.

## Features

- **Workspace Status Monitoring**: Real-time health checks of all devkit services
- **Node Management**: Start/stop/restart Conflux node with status monitoring
- **Wallet Management**: Multi-address system (internal EVM/Core + browser wallet)
- **Network Management**: Localhost, testnet, and mainnet switching
- **Contract Management**: Deploy contracts and interact with them
- **Operation Logging**: Centralized logging for all devkit operations

## Architecture

The application is built using:

- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Zustand** for state management
- **@conflux-devkit/state-*** packages for integration

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
src/
├── components/           # React components
│   ├── layout/          # Layout components
│   ├── widgets/         # Dashboard widgets
│   ├── contracts/       # Contract management components
│   ├── logs/           # Logging components
│   └── common/         # Shared components
├── hooks/              # Custom React hooks
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # CSS styles
└── pages/              # Page components
```

## Implementation Status

### ✅ Completed
- Project structure and configuration
- Core layout components (Header, Sidebar, Footer)
- Workspace status widget
- Node management widget
- Type definitions for all major entities
- Basic dashboard page

### 🚧 In Progress
- Wallet management widget
- Network management widget
- Contract management components
- Hardhat integration
- Operation logging system

### 📋 Planned
- Real API integration with devkit services
- WebSocket connection for real-time updates
- Contract business logic integration
- Event monitoring system
- Advanced error handling
- Unit and integration tests

## Integration with DevKit

This application integrates with the following DevKit packages:

- `@conflux-devkit/state-ui` - UI state management
- `@conflux-devkit/state-client` - Client-side business logic
- `@conflux-devkit/state-server` - Server-side operations
- `@conflux-devkit/core` - Core functionality
- `@conflux-devkit/types` - Shared type definitions

## Configuration

The application can be configured through environment variables:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
VITE_NODE_RPC_URL=http://localhost:12537
```

## Design System

The application follows the Conflux design system with:

- **Colors**: Conflux blue palette with semantic colors
- **Typography**: Inter for UI, JetBrains Mono for code
- **Components**: Consistent spacing and styling
- **Icons**: Emoji-based icons for better accessibility

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for all new code
3. Follow the established naming conventions
4. Add tests for new functionality
5. Update documentation as needed

## License

MIT License - see LICENSE file for details