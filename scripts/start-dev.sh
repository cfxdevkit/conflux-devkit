#!/bin/bash

# Conflux DevKit Development Startup Script

echo "🚀 Starting Conflux DevKit Development Environment..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Build all packages
echo "🔨 Building packages..."
pnpm run build

# Start the development environment
echo "🌟 Starting development services..."
echo "   - DevKit Node: http://localhost:12537"
echo "   - API Server: http://localhost:3001"
echo "   - Showcase WebApp: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Start all services concurrently
pnpm run dev
