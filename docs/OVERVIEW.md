# Conflux DevKit - Package Overview

**Repository:** cfxdevkit/conflux-devkit  
**Report Date:** January 15, 2026  
**Period:** January 9-15, 2026

---

## Executive Summary

Complete refactoring of the Conflux DevKit monorepo into a modular package architecture. Created 5 new packages, significantly updated 2 existing packages, and removed 1 redundant package. Added comprehensive DevNode management frontend with real-time blockchain monitoring.

---

## Project Vision

This refactoring integrates functionality from two separate repositories into a unified codebase:

| Repository | Features Integrated |
|------------|--------------------|
| [conflux-box](https://github.com/cfxdevkit/conflux-box) | Modern Mantine UI, real-time WebSocket updates, account management, contract deployment interface |
| [devkit-connector](https://github.com/cfxdevkit/devkit-connector) | Local node management, dual-space support, wallet tools, CLI interface |

This consolidation streamlines the developer experience and serves as the foundation for:

1. **MCP Server**: Model Context Protocol server for AI-assisted blockchain development
2. **Plugin System**: Extensible architecture to integrate functionality currently scattered across multiple repositories

---

## Package Status

| Package | Version | Status | Description |
|---------|---------|--------|-------------|
| `@conflux-devkit/core` | 0.1.0 | **NEW** | Foundation blockchain client library |
| `@conflux-devkit/plugin-devnode` | 0.1.0 | **NEW** | Local node management plugin |
| `@conflux-devkit/wallet` | 0.1.0 | **NEW** | Advanced wallet abstractions |
| `@conflux-devkit/contracts` | 0.1.0 | **NEW** | Contract deployment utilities |
| `@conflux-devkit/ui-headless` | 1.0.0 | **NEW** | Headless React components |
| `@conflux-devkit/backend` | 0.1.0 | **UPDATED** | REST API & WebSocket server |
| `@conflux-devkit/frontend` | 1.0.0 | **UPDATED** | React DevNode dashboard |
| `@conflux-devkit/node` | - | **REMOVED** | Was redundant re-export |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│    frontend (Dashboard)          ui-headless (Components)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│                    backend (REST + WS)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PLUGIN LAYER                            │
│   plugin-devnode     wallet     contracts                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FOUNDATION LAYER                          │
│                         core                                 │
│              (cive + viem client wrappers)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Deliverables This Week

1. **Modular Architecture**: Clear separation of concerns with proper dependency hierarchy
2. **Network Capabilities System**: Automatic feature gating for local/testnet/mainnet
3. **Real-time Monitoring**: WebSocket-based block and transaction streaming
4. **Modern Frontend**: React 18 + Mantine UI dashboard with wallet integration
5. **Developer Experience**: Docker + DevContainer support for consistent environments

---

## Future Roadmap

- **MCP Server**: Model Context Protocol integration for AI-powered development workflows
- **Plugin Architecture**: Modular system to extend DevKit capabilities
- **CLI Tools**: Command-line interface for headless operations
- **AI Integration**: Automated contract deployment, testing, and monitoring pipelines

---

## Documentation

See individual package documentation in `/docs/packages/`:
- [CORE.md](packages/CORE.md)
- [PLUGIN_DEVNODE.md](packages/PLUGIN_DEVNODE.md)
- [BACKEND.md](packages/BACKEND.md)
- [FRONTEND.md](packages/FRONTEND.md)
- [WALLET.md](packages/WALLET.md)
- [CONTRACTS.md](packages/CONTRACTS.md)
- [UI_HEADLESS.md](packages/UI_HEADLESS.md)

---

## Commit Summary

47 commits during the reporting period covering:
- Package creation and structure
- Backend API development
- Frontend UI implementation
- Bug fixes and optimizations
- Docker/DevContainer infrastructure
