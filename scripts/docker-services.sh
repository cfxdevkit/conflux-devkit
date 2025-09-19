#!/bin/bash

# ============================================================================
# Conflux DevKit - Docker Service Management Script
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.devcontainer.yml"
PROJECT_NAME="conflux-devkit"

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

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Start services
start_services() {
    local profile="$1"
    log_info "Starting services with profile: $profile"
    
    if [ -n "$profile" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" --profile "$profile" up -d
    else
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    fi
    
    log_success "Services started successfully"
    show_status
}

# Stop services
stop_services() {
    log_info "Stopping all services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
    log_success "Services stopped"
}

# Restart services
restart_services() {
    local profile="$1"
    log_info "Restarting services..."
    stop_services
    start_services "$profile"
}

# Show status
show_status() {
    log_info "Service Status:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
}

# Show logs
show_logs() {
    local service="$1"
    if [ -n "$service" ]; then
        log_info "Showing logs for $service:"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f "$service"
    else
        log_info "Showing logs for all services:"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f
    fi
}

# Clean up
cleanup() {
    log_info "Cleaning up containers and volumes..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v --remove-orphans
    docker system prune -f
    log_success "Cleanup completed"
}

# Show help
show_help() {
    echo "Conflux DevKit Docker Service Management"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start [PROFILE]     Start services (optionally with profile)"
    echo "  stop                Stop all services"
    echo "  restart [PROFILE]   Restart services (optionally with profile)"
    echo "  status              Show service status"
    echo "  logs [SERVICE]      Show logs (optionally for specific service)"
    echo "  cleanup             Clean up containers and volumes"
    echo "  help                Show this help message"
    echo ""
    echo "Profiles:"
    echo "  conflux             Start Conflux nodes"
    echo "  cache               Start Redis cache"
    echo "  database            Start PostgreSQL and MongoDB"
    echo "  proxy               Start Nginx reverse proxy"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 start conflux           # Start with Conflux nodes"
    echo "  $0 start cache,database    # Start with cache and database"
    echo "  $0 logs api-server         # Show logs for API server"
    echo "  $0 status                  # Show service status"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        start)
            start_services "$2"
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services "$2"
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        cleanup)
            cleanup
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

