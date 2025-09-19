#!/bin/bash

# ============================================================================
# Conflux DevKit - DevContainer Setup Script
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

# Install dependencies
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

# Setup Docker services
setup_docker_services() {
    log_info "Setting up Docker services..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not available. Please ensure Docker-in-Docker is properly configured."
        return 1
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Start basic services
    log_info "Starting basic services..."
    pnpm run docker:start
    
    log_success "Docker services setup complete"
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

# Verify setup
verify_setup() {
    log_info "Verifying setup..."
    
    # Check if services are running
    if pnpm run docker:status > /dev/null 2>&1; then
        log_success "Docker services are running"
    else
        log_warning "Docker services are not running"
    fi
    
    # Check if packages are built
    if [ -d "packages/api-server/dist" ] && [ -d "packages/state-server/dist" ]; then
        log_success "Packages are built"
    else
        log_warning "Packages may not be built"
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
    echo "  pnpm run docker:start     - Start Docker services"
    echo "  pnpm run docker:stop      - Stop Docker services"
    echo "  pnpm run docker:status    - Show service status"
    echo "  pnpm run docker:logs      - Show service logs"
    echo "  pnpm run dev              - Start development servers"
    echo ""
    echo "VS Code Tasks:"
    echo "  Ctrl+Shift+P -> Tasks: Run Task -> Docker: Start All Services"
    echo ""
}

# Run main function
main "$@"

