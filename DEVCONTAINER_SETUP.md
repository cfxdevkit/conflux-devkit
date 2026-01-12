# DevContainer Setup Guide

## Quick Start

The DevContainer is now configured and ready to use with VS Code.

### Prerequisites

1. **Docker** installed and running
2. **VS Code** with the "Dev Containers" extension installed

### Open in DevContainer

1. Open this repository in VS Code
2. Press `F1` or `Ctrl+Shift+P`
3. Type: "Dev Containers: Reopen in Container"
4. Wait for the container to build and start
5. Dependencies will be installed automatically via `pnpm install`

## What's Included

### Development Environment

- **Node.js 20** (Bookworm Slim base)
- **pnpm 10.11.0** (pre-installed via corepack)
- **Git**, curl, Python3, make, g++ (for native dependencies)
- **Automatic dependency installation** on container creation

### VS Code Extensions

Pre-installed extensions:
- Biome (linting & formatting)
- Tailwind CSS IntelliSense
- Docker
- YAML
- GitHub Copilot

### Port Forwarding

Automatically forwarded ports:
- `3000` - Frontend (React)
- `3001` - Backend API (Express)
- `3002` - WebSocket (Real-time)
- `8545` - eSpace RPC (EVM)
- `12537` - Core Space RPC (Conflux)

## File Structure

```
.devcontainer/
├── Dockerfile         # Lightweight dev container image
└── devcontainer.json  # VS Code configuration

docker-compose.dev.yml # Docker Compose for DevContainer
```

## Key Features

### Volume Mounts

- **Source code**: `.:/workspace:cached` (live sync)
- **node_modules**: Named volume for fast access
- **pnpm store**: Named volume for package caching

### User Permissions

Container runs as `node` user (non-root) with proper permissions for:
- `/workspace` directory
- `/home/node/.local/share/pnpm/store` (pnpm cache)

## Troubleshooting

### Build Issues

If you encounter network issues during build:

```bash
# Build manually first
docker compose -f docker-compose.dev.yml build

# Then reopen in VS Code
```

### Permission Issues

If you get permission errors:

```bash
# Fix ownership in the container
docker compose -f docker-compose.dev.yml exec devkit bash
sudo chown -R node:node /workspace
```

### Dependency Install Fails

```bash
# Inside the container
pnpm store prune
pnpm install --force
```

### Clear Everything and Start Fresh

```bash
# Stop and remove containers
docker compose -f docker-compose.dev.yml down -v

# Rebuild
docker compose -f docker-compose.dev.yml build --no-cache

# Reopen in VS Code
```

## Development Workflow

### 1. Start DevContainer

Open in VS Code and reopen in container (automatic setup).

### 2. Verify Setup

```bash
# Check Node version
node --version  # Should show v20.x

# Check pnpm version
pnpm --version  # Should show 10.11.0

# Verify dependencies
ls -la node_modules
```

### 3. Start Development

```bash
# Build all packages
pnpm build

# Start development servers
pnpm dev

# Or start individual services
pnpm dev:backend
pnpm dev:frontend
```

### 4. Access Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3002

## Alternative: Manual Docker Compose

If you prefer not to use VS Code DevContainer:

```bash
# Start container
docker compose -f docker-compose.dev.yml up -d

# Enter container
docker compose -f docker-compose.dev.yml exec devkit bash

# Inside container
pnpm install
pnpm build
pnpm dev
```

## Configuration

### Environment Variables

Create `.env` file in the root:

```bash
HARDHAT_VAR_DEPLOYER_MNEMONIC="your test mnemonic here"
NODE_ENV=development
```

### VS Code Settings

Settings are pre-configured in `devcontainer.json`:
- Format on save (Biome)
- TypeScript IntelliSense
- Auto-organize imports

## Network Configuration

The DevContainer uses a custom Docker network:
- Network name: `conflux-devkit_devkit-network`
- Driver: bridge
- Allows communication between services

## Performance Tips

### Fast Rebuilds

The container uses named volumes for:
- `node_modules` - Persists between rebuilds
- `pnpm-store` - Caches downloaded packages

### Memory Usage

Typical resource usage:
- RAM: ~500MB idle, ~1.5GB during build
- CPU: Low idle, high during build/compilation
- Disk: ~2GB for container + volumes

## Security Notes

- Container runs as non-root user (`node`)
- Source code mounted read-write for development
- Production builds should use separate Dockerfile
- Never commit `.env` files with real secrets

## Related Documentation

- [DOCKER.md](./DOCKER.md) - Full Docker documentation
- [README.md](./README.md) - Project overview
- [DEMO.md](./DEMO.md) - Local development guide

---

**Happy DevContainer Development! 🐳**
