#!/bin/bash

# Rebuild DevContainer Script
# This script helps rebuild the devcontainer with the new Debian Bookworm image

echo "🔄 Rebuilding DevContainer with Debian Bookworm (OpenSSL 3.0 support)..."

# Check if we're in a devcontainer
if [ -n "$REMOTE_CONTAINERS" ] || [ -n "$CODESPACES" ]; then
    echo "⚠️  You're currently inside a devcontainer."
    echo "   Please run this script from your host machine or VS Code command palette."
    echo ""
    echo "   To rebuild from VS Code:"
    echo "   1. Open Command Palette (Ctrl+Shift+P)"
    echo "   2. Run 'Dev Containers: Rebuild Container'"
    echo "   3. Or run 'Dev Containers: Rebuild and Reopen in Container'"
    exit 1
fi

# Check if .devcontainer directory exists
if [ ! -d ".devcontainer" ]; then
    echo "❌ .devcontainer directory not found!"
    echo "   Please run this script from the project root directory."
    exit 1
fi

# Check if devcontainer.json exists
if [ ! -f ".devcontainer/devcontainer.json" ]; then
    echo "❌ .devcontainer/devcontainer.json not found!"
    exit 1
fi

echo "✅ DevContainer configuration found"
echo "📋 Current configuration:"
echo "   Image: mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm"
echo "   OpenSSL: 3.0 (included by default)"
echo "   Node.js: 20"
echo "   Debian: Bookworm (12)"
echo ""

echo "🚀 To rebuild your devcontainer:"
echo ""
echo "   Option 1 - VS Code Command Palette:"
echo "   1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)"
echo "   2. Run 'Dev Containers: Rebuild Container'"
echo "   3. Wait for the rebuild to complete"
echo ""
echo "   Option 2 - VS Code Command Palette (Alternative):"
echo "   1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)"
echo "   2. Run 'Dev Containers: Rebuild and Reopen in Container'"
echo "   3. This will rebuild and automatically reopen"
echo ""
echo "   Option 3 - GitHub Codespaces:"
echo "   1. Go to your Codespace settings"
echo "   2. Click 'Rebuild' or 'Rebuild and restart'"
echo ""

echo "🔧 After rebuilding, test XCFX mode:"
echo "   cd packages/devkit-node"
echo "   node dist/cli/unified.js start --mode xcfx --silent"
echo ""

echo "✅ DevContainer is ready for rebuild with OpenSSL 3.0 support!"









