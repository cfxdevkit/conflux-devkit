#!/bin/bash

# ============================================================================
# Conflux DevKit - Simple DevContainer Setup Script
# Optimized for Microsoft devcontainer base images
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a devcontainer
check_devcontainer() {
    if [ -n "$CODESPACES" ] || [ -n "$REMOTE_CONTAINERS" ]; then
        log_info "Running in devcontainer environment"
        return 0
    else
        log_warning "Not running in devcontainer environment"
        return 1
    fi
}

# Install pnpm if not available
install_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        log_info "Installing pnpm..."
        npm install -g pnpm@latest
        log_success "pnpm installed"
    else
        log_info "pnpm already available"
    fi
}

# Install PM2 if not available
install_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2..."
        npm install -g pm2@latest
        log_success "PM2 installed"
    else
        log_info "PM2 already available"
    fi
}

# Install project dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    pnpm install
    log_success "Dependencies installed"
}

# Build packages
build_packages() {
    log_info "Building all packages..."
    pnpm run build
    log_success "Packages built"
}

# Setup development environment
setup_dev_environment() {
    log_info "Setting up development environment..."
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p ssl
    
    # Set up environment variables
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        cat > .env << EOF
# Conflux DevKit Development Environment
NODE_ENV=development
PORT=3001
STATE_SERVER_URL=ws://localhost:3002
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3002

# Docker Services
DOCKER_COMPOSE_FILE=docker-compose.devcontainer.yml
DOCKER_PROJECT_NAME=conflux-devkit

# Database (if using)
POSTGRES_DB=conflux_devkit
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379

# Conflux Nodes
CONFLUX_CORE_RPC=http://localhost:12537
CONFLUX_EVM_RPC=http://localhost:8545
EOF
        log_success ".env file created"
    else
        log_info ".env file already exists"
    fi
}

# Test Docker functionality
test_docker() {
    log_info "Testing Docker functionality..."
    
    if command -v docker &> /dev/null; then
        if docker info >/dev/null 2>&1; then
            log_success "Docker is working correctly"
            
            # Test with hello-world
            if docker run --rm hello-world >/dev/null 2>&1; then
                log_success "Docker hello-world test passed"
            else
                log_warning "Docker hello-world test failed, but Docker daemon is running"
            fi
        else
            log_error "Docker daemon is not running"
            log_info "Try running: sudo service docker start"
            return 1
        fi
    else
        log_error "Docker is not installed"
        return 1
    fi
}

# Setup Docker services (optional)
setup_docker_services() {
    log_info "Setting up Docker services..."
    
    # Test Docker first
    if ! test_docker; then
        log_warning "Docker is not available, skipping Docker services setup"
        return 0
    fi
    
    # Make scripts executable
    chmod +x scripts/docker-services.sh
    
    log_success "Docker services setup complete"
    log_info "You can now use: pnpm run docker:start"
}

# Verify setup
verify_setup() {
    log_info "Verifying setup..."
    
    # Check if pnpm is available
    if command -v pnpm &> /dev/null; then
        log_success "pnpm is available"
    else
        log_error "pnpm is not available"
    fi
    
    # Check if PM2 is available
    if command -v pm2 &> /dev/null; then
        log_success "PM2 is available"
    else
        log_error "PM2 is not available"
    fi
    
    # Check if packages are built
    if [ -d "packages/api-server/dist" ] && [ -d "packages/state-server/dist" ]; then
        log_success "Packages are built"
    else
        log_warning "Packages may not be built"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null && docker info >/dev/null 2>&1; then
        log_success "Docker is working"
    else
        log_warning "Docker is not available"
    fi
    
    log_success "Setup verification complete"
}

# Main setup function
main() {
    log_info "Setting up Conflux DevKit development environment..."
    
    # Check if we're in a devcontainer
    if ! check_devcontainer; then
        log_warning "This script is designed for devcontainer environments"
    fi
    
    # Install tools
    install_pnpm
    install_pm2
    
    # Install dependencies
    install_dependencies
    
    # Build packages
    build_packages
    
    # Setup development environment
    setup_dev_environment
    
    # Setup Docker services
    setup_docker_services
    
    # Verify setup
    verify_setup
    
    log_success "DevContainer setup complete!"
    echo ""
    echo "Available commands:"
    echo "  pnpm run dev              - Start development servers"
    echo "  pnpm run docker:start     - Start Docker services (if Docker is available)"
    echo "  pnpm run docker:stop      - Stop Docker services"
    echo "  pnpm run docker:status    - Show service status"
    echo "  pnpm run docker:logs      - Show service logs"
    echo ""
    echo "VS Code Tasks:"
    echo "  Ctrl+Shift+P -> Tasks: Run Task -> Docker: Start All Services"
    echo ""
    echo "If Docker is not working, try:"
    echo "  sudo service docker start"
    echo "  or rebuild the devcontainer"
}

# Run main function
main "$@"
