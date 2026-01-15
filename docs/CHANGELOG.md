# Conflux DevKit - Changelog

## Week of January 9-15, 2026

### Summary
Major refactoring of the monorepo architecture, creating a modular package structure with clear separation of concerns. Added comprehensive DevNode management frontend with real-time monitoring.

### Integration Goals
This work consolidates functionality from two repositories:
- **conflux-box**: Frontend UI, real-time updates, contract deployment interface
- **devkit-connector**: Local node management, wallet tools, CLI interface

The unified codebase will serve as the foundation for:
- **MCP Server**: AI-assisted blockchain development tools
- **Plugin System**: Extensible architecture for modular functionality

---

## DevContainer Improvements

The devcontainer has been **completely rewritten** for improved usability:
- Streamlined setup process with automatic dependency installation
- Pre-configured development environment (Node 20, pnpm)
- Port forwarding for all services (frontend, backend, WebSocket)
- Works seamlessly with GitHub Codespaces
- Docker support for consistent cross-platform development

---

## New Packages Created

### @conflux-devkit/core (v0.1.0)
Foundation package providing blockchain client abstractions.
- Unified Core Space (Cive) and eSpace (Viem) client wrappers
- Chain configuration and network selector utilities
- Type-safe interfaces for dual-chain interactions

### @conflux-devkit/plugin-devnode (v0.1.0)
Optional development plugin for local node management.
- ServerManager for @xcfx/node lifecycle control
- BIP32/BIP39 account generation with dual derivation paths
- Mining controls (auto/manual modes)

### @conflux-devkit/wallet (v0.1.0)
Advanced wallet abstractions for Conflux applications.
- Session key management
- Transaction batching utilities
- Embedded wallet support (planned)

### @conflux-devkit/contracts (v0.1.0)
Contract deployment and interaction utilities.
- Standard ABI management (ERC20, ERC721, ERC1155)
- Deploy/read/write contract helpers
- Type-safe contract interaction patterns

### @conflux-devkit/ui-headless (v1.0.0)
Headless React components for Conflux applications.
- Render props pattern for full customization
- Hooks for blockchain operations
- Tailwind CSS compatible

---

## Updated Packages

### @conflux-devkit/backend (v0.1.0)
Complete rewrite with modular architecture.
- **New**: Network capabilities system (local/testnet/mainnet)
- **New**: WebSocket real-time updates for block data
- **New**: RPC proxy endpoints to avoid CORS issues
- **New**: Signature-based wallet authentication
- **Updated**: 23+ REST API endpoints for DevNode control

### @conflux-devkit/frontend-devnode (v1.0.0)
Modern React dashboard for DevNode management.
- **Stack**: React 18, Mantine UI 7, Wagmi 2.12, Zustand
- **Features**:
  - Wallet authentication with admin roles
  - Node lifecycle control (start/stop/reset)
  - Mining controls (auto/manual with configurable interval)
  - Real-time blockchain monitor with block/transaction streaming
  - Faucet with auto-detect for Core/eSpace addresses
  - Network switching (local/testnet/mainnet)
  - Tabbed interface: DevNode, Accounts, Deployments, Monitor

---

## Removed Packages

### @conflux-devkit/node
Removed as redundant - was only re-exporting @conflux-devkit/core.
Functionality moved to @conflux-devkit/plugin-devnode.

---

## Infrastructure Updates

- Docker and DevContainer support for consistent development environment
- Turbo monorepo build system with proper package references
- pnpm workspace with optimized dependency management
