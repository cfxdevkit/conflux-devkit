#!/bin/bash

# Start only the DevKit Node

echo "🔗 Starting Conflux DevKit Node..."

cd packages/devkit-node
pnpm run dev
