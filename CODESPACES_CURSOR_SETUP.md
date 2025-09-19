# Codespaces & Cursor Setup Guide

## Overview
This workspace is fully configured for development in GitHub Codespaces and Cursor IDE with optimal TypeScript, React, and monorepo support.

## What's Configured

### 🐳 DevContainer (.devcontainer/)
- **Base Image**: TypeScript Node.js 20 on Debian
- **Features**: Git, GitHub CLI
- **Extensions**: TypeScript, React, Tailwind, Biome, Turbo, pnpm, Vitest
- **Port Forwarding**: 3000 (WebApp), 3001 (API), 8080 (DevKit Node)
- **Auto-install**: Dependencies installed on container creation

### ⚙️ VS Code/Cursor Settings (.vscode/)
- **TypeScript**: Auto-imports, relative paths, file move updates
- **Formatting**: Biome as default formatter with format-on-save
- **Code Actions**: Auto-organize imports, Biome quick fixes
- **File Exclusions**: node_modules, dist, .turbo, coverage
- **Monorepo Support**: ESLint, Turbo, pnpm auto-detection

### 🚀 Launch Configurations
- **Debug API Server**: Full TypeScript debugging with tsx loader
- **Debug Showcase WebApp**: Vite development server
- **Debug DevKit Node**: Node.js debugging with TypeScript

### 📋 Tasks
- **Install Dependencies**: `pnpm install`
- **Build All**: `pnpm run build`
- **Start Full Stack**: All services concurrently
- **Individual Services**: API Server, Showcase WebApp
- **Testing**: Run all tests with Vitest
- **Lint & Format**: Biome check and fix

### 🔧 Cursor Rules (.cursorrules)
- Project structure guidelines
- Code style preferences
- Testing best practices
- Monorepo workflow

## Quick Start

### In Codespaces:
1. Open repository in GitHub Codespaces
2. Wait for container build and dependency installation
3. Open ports 3000, 3001, 8080 when prompted
4. Run `pnpm run start:full-stack`

### In Cursor:
1. Open workspace folder
2. Install recommended extensions when prompted
3. Run `pnpm install` in terminal
4. Create `.env.local` from `ENVIRONMENT_SETUP.md`
5. Use F5 to debug or Ctrl+Shift+P → Tasks to run commands

## Development Workflow

### Available Commands:
```bash
# Install dependencies
pnpm install

# Development
pnpm run dev                    # All packages in watch mode
pnpm run start:full-stack       # API + WebApp concurrently
pnpm run start:api-server       # API server only
pnpm run start:showcase         # WebApp only

# Building
pnpm run build                  # Build all packages
pnpm run type-check            # TypeScript checking

# Testing
pnpm run test                  # Run all tests
pnpm run test:ui              # Vitest UI (in packages with UI)

# Code Quality
pnpm run check:fix            # Lint and format with Biome
pnpm run lint                 # Lint only
pnpm run format               # Format only
```

### Debugging:
- Use F5 or Debug panel to start debugging
- Breakpoints work in TypeScript source files
- Console output in integrated terminal

### Ports:
- **3000**: Showcase WebApp (React + Vite)
- **3001**: API Server (Express + TypeScript)
- **8080**: DevKit Node (Conflux blockchain node)

## Environment Variables

Create `.env.local` with:
```bash
NODE_ENV=development
API_PORT=3001
VITE_API_URL=http://localhost:3001
DEVKIT_NODE_PORT=8080
CONFLUX_NETWORK=testnet
CONFLUX_RPC_URL=https://test.confluxrpc.com
# ... see ENVIRONMENT_SETUP.md for full list
```

## Troubleshooting

### Common Issues:
1. **Port conflicts**: Check if ports 3000, 3001, 8080 are available
2. **Dependencies**: Run `pnpm install` if packages are missing
3. **TypeScript errors**: Run `pnpm run type-check` to verify
4. **Build issues**: Run `pnpm run build` to check compilation

### Reset Environment:
```bash
pnpm run clean          # Clean all dist folders
rm -rf node_modules     # Remove node_modules
pnpm install           # Reinstall dependencies
```

## Features Enabled

✅ **TypeScript**: Full IntelliSense, auto-imports, refactoring  
✅ **React**: JSX support, component snippets, debugging  
✅ **Monorepo**: Workspace navigation, cross-package references  
✅ **Testing**: Vitest integration, test discovery, debugging  
✅ **Linting**: Biome integration, real-time error checking  
✅ **Formatting**: Auto-format on save, consistent style  
✅ **Debugging**: Full TypeScript debugging support  
✅ **Port Forwarding**: Automatic port detection and forwarding  
✅ **Git Integration**: Built-in Git support with GitHub CLI  
