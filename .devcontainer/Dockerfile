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
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Configure sudo for node user
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/node && \
    chmod 0440 /etc/sudoers.d/node

# Install pnpm globally via corepack (as root to cache it)
RUN corepack enable && \
    corepack prepare pnpm@10.11.0 --activate && \
    corepack install -g pnpm@10.11.0

# Set working directory
WORKDIR /workspace

# Configure git safe directory
RUN git config --global --add safe.directory /workspace

# Initialize directories with correct ownership
# - pnpm store directory
# - .local directory (needed for Conflux node data)
# - workspace directories
RUN mkdir -p /home/node/.local/share/pnpm/store && \
    mkdir -p /workspace/node_modules && \
    mkdir -p /workspace/.conflux-dev && \
    chown -R node:node /home/node/.local && \
    chown -R node:node /workspace

USER node

# Keep container running
CMD ["sleep", "infinity"]
