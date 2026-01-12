# Lightweight development container for Conflux DevKit
FROM node:20-bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally via corepack (as root to cache it)
RUN corepack enable && \
    corepack prepare pnpm@10.11.0 --activate && \
    corepack install -g pnpm@10.11.0

# Set working directory
WORKDIR /workspace

# Configure git safe directory
RUN git config --global --add safe.directory /workspace

# Initialize pnpm store directory with correct ownership
RUN mkdir -p /home/node/.local/share/pnpm/store && \
    chown -R node:node /home/node/.local/share/pnpm

# Pre-create workspace directories with correct ownership
RUN mkdir -p /workspace/node_modules && \
    chown -R node:node /workspace

USER node

# Keep container running
CMD ["sleep", "infinity"]
