#!/bin/bash

# Start only the API Server

echo "🖥️ Starting Conflux DevKit API Server..."

cd packages/api-server
pnpm run dev
