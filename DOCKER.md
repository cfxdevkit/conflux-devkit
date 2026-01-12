# Docker Setup for Conflux DevKit

This guide explains how to use Docker and DevContainers with Conflux DevKit.

## Quick Start

### Option 1: DevContainer (Recommended for VS Code)

Open this repository in VS Code with the Dev Containers extension:

1. Install [VS Code](https://code.visualstudio.com/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the repository in VS Code
3. Press `F1` → "Dev Containers: Reopen in Container"
4. Wait for the container to build and start
5. Run `pnpm dev` to start all services

The DevContainer provides:
- Node.js 20 with pnpm 10.11.0
- All required system dependencies
- VS Code extensions (Biome, Tailwind, Docker, etc.)
- Automatic dependency installation
- Port forwarding for all services

### Option 2: Docker Compose (Production Stack)

Run the full stack with Docker Compose:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3002
- **eSpace RPC**: http://localhost:8545
- **Core Space RPC**: http://localhost:12537

### Option 3: Development Compose

For development with hot reload:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Enter the container
docker-compose -f docker-compose.dev.yml exec devkit bash

# Inside container
pnpm install
pnpm build
pnpm dev
```

## Architecture

### Multi-Stage Dockerfile

The main `Dockerfile` uses multi-stage builds for optimal image sizes:

1. **base** - Node.js 20 with pnpm
2. **deps** - Install all dependencies
3. **builder** - Build all packages
4. **backend** - Production backend image (~200MB)
5. **frontend** - Nginx-served frontend (~50MB)

### DevContainer

`.devcontainer/Dockerfile` provides a lightweight development environment:
- Based on `node:20-bookworm-slim`
- Includes git, curl, Python, make, g++
- pnpm 10.11.0 pre-installed
- Optimized for fast rebuilds

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Mnemonic for development accounts
HARDHAT_VAR_DEPLOYER_MNEMONIC="your twelve word mnemonic here"

# API URLs (for frontend)
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3002

# Node environment
NODE_ENV=development
```

## Port Mapping

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Backend API | 3001 | Express REST API |
| WebSocket | 3002 | Real-time updates |
| eSpace RPC | 8545 | EVM-compatible RPC |
| Core Space RPC | 12537 | Conflux native RPC |

## Development Workflow

### Using DevContainer

1. Open in VS Code Dev Container
2. Wait for automatic `pnpm install` and `pnpm build`
3. Run `pnpm dev` to start development servers
4. Edit code - changes are reflected immediately
5. Commit and push as normal

### Using Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop all
docker-compose down

# Remove volumes
docker-compose down -v
```

## Building for Production

### Build Individual Services

```bash
# Backend only
docker build --target backend -t conflux-devkit-backend .

# Frontend only
docker build --target frontend -t conflux-devkit-frontend .
```

### Multi-Platform Builds

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 \
  --target backend -t conflux-devkit-backend .
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Dependencies Not Installing

```bash
# Clear pnpm cache
docker-compose exec devkit pnpm store prune

# Reinstall
docker-compose exec devkit pnpm install --force
```

### DevContainer Rebuilding is Slow

The DevContainer caches dependencies in named volumes:
- `node_modules` - Shared node modules
- `pnpm-store` - pnpm package cache

To clear cache:
```bash
docker volume rm conflux-devkit_node_modules conflux-devkit_pnpm-store
```

## VS Code Integration

The DevContainer includes these extensions:
- **Biome** - Linting and formatting
- **Tailwind CSS IntelliSense** - Tailwind autocompletion
- **Docker** - Docker management
- **GitHub Copilot** - AI assistance

Settings are configured in `.devcontainer/devcontainer.json`.

## GitHub Codespaces

This repository is Codespaces-ready:

1. Click "Code" → "Codespaces" → "Create codespace on main"
2. Wait for environment to build
3. Run `pnpm dev` when ready
4. Ports are automatically forwarded

## Best Practices

### Development

- Use DevContainer for consistent environment
- Keep `.env` file out of git (already in .gitignore)
- Use volumes for dependencies to speed up rebuilds
- Run `pnpm build` before testing production images

### Production

- Always use multi-stage builds
- Set `NODE_ENV=production`
- Use health checks in docker-compose
- Monitor container logs
- Use Docker secrets for sensitive data

### CI/CD

```yaml
# Example GitHub Actions workflow
- name: Build Docker images
  run: |
    docker build --target backend -t backend .
    docker build --target frontend -t frontend .

- name: Test backend
  run: docker run backend npm test

- name: Push to registry
  run: |
    docker push registry/backend:latest
    docker push registry/frontend:latest
```

## Resource Limits

Recommended Docker resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

## Security Notes

- Never commit `.env` files
- Use Docker secrets for production
- Keep base images updated
- Scan images for vulnerabilities: `docker scan conflux-devkit-backend`
- Run containers as non-root user (already configured)

## Related Documentation

- [Main README](./README.md) - Project overview
- [DEMO Guide](./DEMO.md) - Local development walkthrough
- [CLAUDE.md](./CLAUDE.md) - Development guide

## Support

For Docker-related issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Ensure ports are available
4. Try rebuilding: `docker-compose build --no-cache`

---

**Happy Dockerizing! 🐳**
