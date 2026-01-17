# Lightweight development container for Conflux DevKit
FROM node:20-bookworm-slim

# Install system dependencies and common development utilities
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    ca-certificates \
    python3 \
    make \
    g++ \
    sudo \
    # Process management utilities
    procps \
    htop \
    # Network utilities
    net-tools \
    iputils-ping \
    dnsutils \
    # Text processing
    jq \
    vim-tiny \
    less \
    # File utilities
    tree \
    zip \
    unzip \
    # Debugging tools
    strace \
    lsof \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

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
    mkdir -p /home/node/.local/share/pnpm && \
    mkdir -p /workspace/node_modules && \
    mkdir -p /workspace/.conflux-dev && \
    chown -R node:node /home/node/.local && \
    chown -R node:node /workspace

# Configure pnpm global bin directory for node user
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

USER node

# Keep container running
CMD ["sleep", "infinity"]
