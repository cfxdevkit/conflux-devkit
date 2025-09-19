#!/bin/bash

# ============================================================================
# Conflux DevKit - Docker Test Script
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

# Test Docker installation
test_docker_installation() {
    log_info "Testing Docker installation..."
    
    if command -v docker &> /dev/null; then
        log_success "Docker is installed"
        docker --version
    else
        log_error "Docker is not installed"
        return 1
    fi
}

# Test Docker daemon
test_docker_daemon() {
    log_info "Testing Docker daemon..."
    
    if docker info >/dev/null 2>&1; then
        log_success "Docker daemon is running"
    else
        log_error "Docker daemon is not running"
        log_info "Try: sudo service docker start"
        return 1
    fi
}

# Test Docker execution
test_docker_execution() {
    log_info "Testing Docker container execution..."
    
    if docker run --rm hello-world >/dev/null 2>&1; then
        log_success "Docker container execution works"
    else
        log_warning "Docker container execution failed, but daemon is running"
        log_info "This might be a permission issue"
    fi
}

# Test Docker Compose
test_docker_compose() {
    log_info "Testing Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose is available"
        docker-compose --version
    else
        log_warning "Docker Compose is not available"
    fi
}

# Test our Docker services
test_our_services() {
    log_info "Testing our Docker services..."
    
    if [ -f "docker-compose.devcontainer.yml" ]; then
        log_success "Docker Compose file exists"
        
        # Test syntax
        if docker-compose -f docker-compose.devcontainer.yml config >/dev/null 2>&1; then
            log_success "Docker Compose file syntax is valid"
        else
            log_error "Docker Compose file has syntax errors"
        fi
    else
        log_error "Docker Compose file not found"
    fi
}

# Test our scripts
test_our_scripts() {
    log_info "Testing our Docker management scripts..."
    
    if [ -f "scripts/docker-services.sh" ]; then
        log_success "Docker services script exists"
        
        if [ -x "scripts/docker-services.sh" ]; then
            log_success "Docker services script is executable"
        else
            log_warning "Docker services script is not executable"
            log_info "Run: chmod +x scripts/docker-services.sh"
        fi
    else
        log_error "Docker services script not found"
    fi
}

# Main test function
main() {
    log_info "Testing Docker setup for Conflux DevKit..."
    echo ""
    
    # Run tests
    test_docker_installation
    echo ""
    
    test_docker_daemon
    echo ""
    
    test_docker_execution
    echo ""
    
    test_docker_compose
    echo ""
    
    test_our_services
    echo ""
    
    test_our_scripts
    echo ""
    
    log_info "Docker test complete!"
    echo ""
    echo "If all tests passed, you can use:"
    echo "  pnpm run docker:start     - Start services"
    echo "  pnpm run docker:status    - Check status"
    echo "  pnpm run docker:logs      - View logs"
    echo ""
    echo "If tests failed, check DOCKER_TROUBLESHOOTING.md for solutions"
}

# Run main function
main "$@"
