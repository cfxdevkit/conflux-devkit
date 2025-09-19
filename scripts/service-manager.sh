#!/bin/bash

# ============================================================================
# Conflux DevKit - Unified Service Manager
# Comprehensive service orchestration with PM2, Docker, and health monitoring
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="conflux-devkit"
LOG_DIR="./logs"
PID_FILE=".devkit-pids.json"
COMPOSE_FILE="docker-compose.devcontainer.yml"

# Service configuration
declare -A SERVICES=(
    ["backend-api"]="3001"
    ["backend-ws"]="3002"
    ["demo-frontend"]="3000"
    ["conflux-core"]="12537"
    ["conflux-evm"]="8545"
)

declare -A SERVICE_URLS=(
    ["backend-api"]="http://localhost:3001/api"
    ["backend-ws"]="ws://localhost:3002"
    ["demo-frontend"]="http://localhost:3000"
    ["conflux-core"]="http://localhost:12537"
    ["conflux-evm"]="http://localhost:8545"
)

# Helper functions
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

log_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Please install pnpm 8+"
        exit 1
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 is not installed. Installing globally..."
        npm install -g pm2
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        if docker info >/dev/null 2>&1; then
            log_success "Docker is available"
        else
            log_warning "Docker is installed but not running"
        fi
    else
        log_warning "Docker is not installed (optional for full setup)"
    fi
    
    log_success "Prerequisites check completed"
}

# Create necessary directories
setup_directories() {
    log_step "Setting up directories..."
    
    mkdir -p "$LOG_DIR"
    mkdir -p "./packages/devkit-backend/logs"
    mkdir -p "./packages/devkit-demo/logs"
    
    log_success "Directories created"
}

# Build all packages
build_packages() {
    log_step "Building packages..."
    
    # Build in dependency order
    log_info "Building devkit-node..."
    cd packages/devkit-node && pnpm run build && cd ../..
    
    log_info "Building devkit-backend..."
    cd packages/devkit-backend && pnpm run build && cd ../..
    
    log_info "Building devkit-frontend..."
    cd packages/devkit-frontend && pnpm run build && cd ../..
    
    log_info "Building devkit-demo..."
    cd packages/devkit-demo && pnpm run build && cd ../..
    
    log_success "All packages built successfully"
}

# Check if packages need rebuilding
needs_rebuild() {
    local force_rebuild="$1"
    
    if [ "$force_rebuild" = "true" ]; then
        return 0
    fi
    
    # Check if any source files are newer than dist files
    for package in devkit-node devkit-backend devkit-frontend devkit-demo; do
        if [ -d "packages/$package/src" ] && [ -d "packages/$package/dist" ]; then
            if find "packages/$package/src" -newer "packages/$package/dist" -type f | head -1 | grep -q .; then
                log_info "Package $package needs rebuilding (source files newer than dist)"
                return 0
            fi
        elif [ -d "packages/$package/src" ] && [ ! -d "packages/$package/dist" ]; then
            log_info "Package $package needs rebuilding (no dist directory)"
            return 0
        fi
    done
    
    return 1
}

# Check if port is in use
is_port_in_use() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Kill process on port gracefully
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ -n "$pid" ]; then
        log_warning "Stopping process $pid on port $port"
        # Try graceful shutdown first
        kill -TERM $pid 2>/dev/null || true
        sleep 2
        # Check if process is still running
        if kill -0 $pid 2>/dev/null; then
            log_warning "Process $pid still running, forcing kill"
            kill -9 $pid 2>/dev/null || true
        fi
        sleep 1
    fi
}

# Clean up ports
cleanup_ports() {
    log_step "Cleaning up ports..."
    
    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"
        if is_port_in_use $port; then
            kill_port $port
        fi
    done
    
    log_success "Port cleanup completed"
}

# Start services with PM2
start_pm2_services() {
    log_step "Starting services with PM2..."
    
    # Clean up any existing PM2 processes
    pm2 delete all 2>/dev/null || true
    
    # Start services
    pm2 start ecosystem.config.cjs
    
    # Wait for services to be ready
    sleep 5
    
    log_success "PM2 services started"
}

# Start services in production mode
start_production_services() {
    log_step "Starting production services..."
    
    # Clean up any existing PM2 processes
    pm2 delete all 2>/dev/null || true
    
    # Start production services
    pm2 start ecosystem.production.config.cjs --env production
    
    # Wait for services to be ready
    sleep 5
    
    log_success "Production services started"
}

# Start Docker services
start_docker_services() {
    local profile="$1"
    log_step "Starting Docker services${profile:+ with profile: $profile}..."
    
    if [ -n "$profile" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" --profile "$profile" up -d
    else
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    fi
    
    log_success "Docker services started"
}

# Stop PM2 services
stop_pm2_services() {
    log_step "Stopping PM2 services..."
    
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    log_success "PM2 services stopped"
}

# Graceful PM2 restart
restart_pm2_services() {
    log_step "Restarting PM2 services gracefully..."
    
    # Check if PM2 processes exist
    if pm2 list | grep -q "online\|stopped"; then
        log_info "Restarting existing PM2 processes..."
        pm2 restart all 2>/dev/null || {
            log_warning "PM2 restart failed, falling back to stop/start"
            pm2 stop all 2>/dev/null || true
            pm2 delete all 2>/dev/null || true
            pm2 start ecosystem.config.cjs
        }
    else
        log_info "No existing PM2 processes, starting fresh..."
        pm2 start ecosystem.config.cjs
    fi
    
    # Wait for services to be ready
    sleep 3
    
    log_success "PM2 services restarted"
}

# Stop Docker services
stop_docker_services() {
    log_step "Stopping Docker services..."
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down 2>/dev/null || true
    
    log_success "Docker services stopped"
}

# Graceful Docker restart
restart_docker_services() {
    local profile="$1"
    log_step "Restarting Docker services gracefully..."
    
    # Check if containers are running
    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps | grep -q "Up"; then
        log_info "Restarting existing Docker containers..."
        if [ -n "$profile" ]; then
            docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" --profile "$profile" restart 2>/dev/null || {
                log_warning "Docker restart failed, falling back to down/up"
                docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down 2>/dev/null || true
                docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" --profile "$profile" up -d
            }
        else
            docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" restart 2>/dev/null || {
                log_warning "Docker restart failed, falling back to down/up"
                docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down 2>/dev/null || true
                docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
            }
        fi
    else
        log_info "No running Docker containers, starting fresh..."
        start_docker_services "$profile"
    fi
    
    log_success "Docker services restarted"
}

# Health check
health_check() {
    log_step "Performing health checks..."
    
    local all_healthy=true
    
    for service in "${!SERVICE_URLS[@]}"; do
        local url="${SERVICE_URLS[$service]}"
        local port="${SERVICES[$service]}"
        
        if [[ "$service" == "backend-ws" ]]; then
            # WebSocket health check
            if is_port_in_use $port; then
                log_success "$service: 🟢 Healthy (Port $port)"
            else
                log_error "$service: 🔴 Unhealthy (Port $port)"
                all_healthy=false
            fi
        else
            # HTTP health check
            if curl -s -f "$url/health" >/dev/null 2>&1 || curl -s -f "$url" >/dev/null 2>&1; then
                log_success "$service: 🟢 Healthy ($url)"
            else
                log_error "$service: 🔴 Unhealthy ($url)"
                all_healthy=false
            fi
        fi
    done
    
    if $all_healthy; then
        log_success "All services are healthy!"
    else
        log_warning "Some services are unhealthy"
    fi
}

# Show service status
show_status() {
    log_header "Conflux DevKit Service Status"
    echo "=================================="
    
    # PM2 status
    log_info "PM2 Process Status:"
    pm2 status
    
    echo ""
    
    # Docker status (if available)
    if command -v docker &> /dev/null && docker info >/dev/null 2>&1; then
        log_info "Docker Container Status:"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps 2>/dev/null || log_warning "No Docker services running"
        echo ""
    fi
    
    # Health check
    health_check
    
    echo ""
    log_info "Service URLs:"
    for service in "${!SERVICE_URLS[@]}"; do
        local url="${SERVICE_URLS[$service]}"
        echo "  $service: $url"
    done
}

# Show logs
show_logs() {
    local service="$1"
    
    if [ -n "$service" ]; then
        log_info "Showing logs for $service:"
        pm2 logs "$service" --lines 50
    else
        log_info "Showing logs for all services:"
        pm2 logs --lines 50
    fi
}

# Clean up everything
cleanup_all() {
    log_step "Performing complete cleanup..."
    
    # Stop PM2 services
    stop_pm2_services
    
    # Stop Docker services
    stop_docker_services
    
    # Clean up ports
    cleanup_ports
    
    # Clean up logs
    rm -rf "$LOG_DIR"/* 2>/dev/null || true
    
    # Clean up PID file
    rm -f "$PID_FILE" 2>/dev/null || true
    
    log_success "Complete cleanup finished"
}

# Development mode
start_dev() {
    log_header "Starting Conflux DevKit in Development Mode"
    echo "=============================================="
    
    check_prerequisites
    setup_directories
    build_packages
    cleanup_ports
    start_pm2_services
    
    echo ""
    show_status
    
    echo ""
    log_info "Development commands:"
    echo "  $0 status     - Show service status"
    echo "  $0 logs       - Show service logs"
    echo "  $0 stop       - Stop all services"
    echo "  $0 restart    - Restart all services"
    echo "  $0 cleanup    - Clean up everything"
}

# Production mode
start_prod() {
    log_header "Starting Conflux DevKit in Production Mode"
    echo "=============================================="
    
    check_prerequisites
    setup_directories
    build_packages
    cleanup_ports
    start_production_services
    
    echo ""
    show_status
    
    echo ""
    log_info "Production commands:"
    echo "  $0 status     - Show service status"
    echo "  $0 logs       - Show service logs"
    echo "  $0 stop:prod - Stop production services"
    echo "  $0 restart:prod - Restart production services"
}

# Docker mode
start_docker() {
    local profile="$1"
    log_header "Starting Conflux DevKit with Docker${profile:+ (Profile: $profile)}"
    echo "=============================================="
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    start_docker_services "$profile"
    
    echo ""
    show_status
}

# Stop services
stop_services() {
    local mode="$1"
    
    case "$mode" in
        "prod"|"production")
            log_header "Stopping Production Services"
            stop_pm2_services
            ;;
        "docker")
            log_header "Stopping Docker Services"
            stop_docker_services
            ;;
        *)
            log_header "Stopping Development Services"
            stop_pm2_services
            stop_docker_services
            ;;
    esac
    
    log_success "Services stopped"
}

# Restart services
restart_services() {
    local mode="$1"
    local force_rebuild="${2:-false}"
    
    case "$mode" in
        "prod"|"production")
            log_header "Restarting Production Services"
            if needs_rebuild "$force_rebuild"; then
                log_info "Packages need rebuilding, performing full restart"
                stop_pm2_services
                build_packages
                start_production_services
            else
                log_info "Packages up to date, performing graceful restart"
                restart_pm2_services
            fi
            ;;
        "docker")
            log_header "Restarting Docker Services"
            restart_docker_services
            ;;
        *)
            log_header "Restarting Development Services"
            if needs_rebuild "$force_rebuild"; then
                log_info "Packages need rebuilding, performing full restart"
                stop_pm2_services
                build_packages
                start_pm2_services
            else
                log_info "Packages up to date, performing graceful restart"
                restart_pm2_services
            fi
            ;;
    esac
    
    echo ""
    show_status
}

# Show help
show_help() {
    echo "Conflux DevKit - Unified Service Manager"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start [MODE]        Start services (dev|prod|docker)"
    echo "  start:dev           Start in development mode (default)"
    echo "  start:prod          Start in production mode"
    echo "  start:docker [PROFILE] Start with Docker (optionally with profile)"
    echo "  stop [MODE]         Stop services (dev|prod|docker)"
    echo "  stop:dev            Stop development services"
    echo "  stop:prod           Stop production services"
    echo "  stop:docker         Stop Docker services"
    echo "  restart [MODE]      Restart services (dev|prod|docker)"
    echo "  restart:dev          Restart development services"
    echo "  restart:prod         Restart production services"
    echo "  restart:docker      Restart Docker services"
    echo "  restart:force       Force restart with rebuild"
    echo "  status              Show service status and health"
    echo "  logs [SERVICE]      Show logs (optionally for specific service)"
    echo "  health              Perform health check"
    echo "  cleanup             Clean up everything"
    echo "  build               Build all packages"
    echo "  help                Show this help message"
    echo ""
    echo "Docker Profiles:"
    echo "  conflux             Start Conflux nodes"
    echo "  cache               Start Redis cache"
    echo "  database            Start PostgreSQL and MongoDB"
    echo "  proxy               Start Nginx reverse proxy"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start in development mode"
    echo "  $0 start:prod              # Start in production mode"
    echo "  $0 start:docker conflux    # Start with Docker + Conflux nodes"
    echo "  $0 restart:prod           # Restart production services"
    echo "  $0 restart:force           # Force restart with rebuild"
    echo "  $0 logs backend-api       # Show backend API logs"
    echo "  $0 status                  # Show service status"
    echo "  $0 cleanup                 # Clean up everything"
    echo ""
    echo "Service URLs:"
    for service in "${!SERVICE_URLS[@]}"; do
        local url="${SERVICE_URLS[$service]}"
        echo "  $service: $url"
    done
}

# Main script logic
main() {
    case "${1:-help}" in
        start)
            case "${2:-dev}" in
                dev|development)
                    start_dev
                    ;;
                prod|production)
                    start_prod
                    ;;
                docker)
                    start_docker "$3"
                    ;;
                *)
                    log_error "Unknown start mode: $2"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        start:dev)
            start_dev
            ;;
        start:prod)
            start_prod
            ;;
        start:docker)
            start_docker "$2"
            ;;
        stop)
            stop_services "$2"
            ;;
        stop:dev)
            stop_services "dev"
            ;;
        stop:prod)
            stop_services "prod"
            ;;
        stop:docker)
            stop_services "docker"
            ;;
        restart)
            restart_services "$2"
            ;;
        restart:dev)
            restart_services "dev"
            ;;
        restart:prod)
            restart_services "prod"
            ;;
        restart:docker)
            restart_services "docker"
            ;;
        restart:force)
            restart_services "dev" "true"
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        health)
            health_check
            ;;
        cleanup)
            cleanup_all
            ;;
        build)
            build_packages
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
