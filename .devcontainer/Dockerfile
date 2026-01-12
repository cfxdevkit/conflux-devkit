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

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Set working directory
WORKDIR /workspace

# Configure git safe directory
RUN git config --global --add safe.directory /workspace

# Set up node user
RUN chown -R node:node /workspace

# Initialize pnpm store directory with correct ownership
RUN mkdir -p /home/node/.local/share/pnpm/store && \
    chown -R node:node /home/node/.local/share/pnpm

USER node

# Keep container running
CMD ["sleep", "infinity"]
