# Use Microsoft's official Node.js devcontainer image
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install additional system dependencies including OpenSSL 3.0
RUN apt-get update && apt-get install -y \
    # OpenSSL libraries (Bullseye has OpenSSL 1.1.1, Node.js uses OpenSSL 3.0+)
    libssl1.1 \
    libssl-dev \
    openssl \
    # Development utilities
    jq \
    vim \
    nano \
    htop \
    tree \
    unzip \
    zip \
    tar \
    gzip \
    bzip2 \
    xz-utils \
    # Network utilities
    net-tools \
    iputils-ping \
    telnet \
    netcat-openbsd \
    traceroute \
    tcpdump \
    # Process utilities
    procps \
    psmisc \
    lsof \
    strace \
    ltrace \
    # System monitoring and debugging
    iotop \
    sysstat \
    # File and text utilities
    file \
    less \
    grep \
    sed \
    gawk \
    findutils \
    coreutils \
    util-linux \
    # Additional debugging tools
    gdb \
    valgrind \
    # Network debugging
    tcpflow \
    ngrep \
    # Database and storage tools
    sqlite3 \
    # Additional libraries that might be needed
    libc6-dev \
    libstdc++6 \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspaces/conflux-devkit

# Install global Node.js tools
RUN npm install -g \
    pnpm@latest \
    pm2 \
    tsx \
    typescript \
    @types/node \
    nodemon \
    concurrently \
    @biomejs/biome \
    vitest

# Set environment variables
ENV NODE_ENV=development
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Expose ports
EXPOSE 3000 3001 3002 12537 8545

# Default command
CMD ["bash"]