#!/bin/bash

# ============================================================================
# Conflux DevKit - Interactive Service Manager
# User-friendly interactive interface for service management
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVICE_MANAGER="$SCRIPT_DIR/service-manager.sh"

# Service information
declare -A SERVICE_INFO=(
    ["backend-api"]="Backend API Server (Port 3001)"
    ["backend-ws"]="WebSocket Server (Port 3002)"
    ["demo-frontend"]="Demo Frontend (Port 3000)"
    ["conflux-core"]="Conflux Core Node (Port 12537)"
    ["conflux-evm"]="Conflux EVM Node (Port 8545)"
)

declare -A SERVICE_URLS=(
    ["backend-api"]="http://localhost:3001/api"
    ["backend-ws"]="ws://localhost:3002"
    ["demo-frontend"]="http://localhost:3000"
    ["conflux-core"]="http://localhost:12537"
    ["conflux-evm"]="http://localhost:8545"
)

# Helper functions
print_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                    Conflux DevKit                        ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${WHITE}              Interactive Service Manager               ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_menu() {
    echo -e "${CYAN}Main Menu:${NC}"
    echo -e "${GREEN}  1.${NC} 🚀 Start Services (Development)"
    echo -e "${GREEN}  2.${NC} 🏭 Start Services (Production)"
    echo -e "${GREEN}  3.${NC} 🐳 Start Services (Docker)"
    echo -e "${GREEN}  4.${NC} 🛑 Stop Services"
    echo -e "${GREEN}  5.${NC} 🔄 Restart Services"
    echo -e "${GREEN}  6.${NC} 📊 Show Status"
    echo -e "${GREEN}  7.${NC} 📝 View Logs"
    echo -e "${GREEN}  8.${NC} 🔍 Health Check"
    echo -e "${GREEN}  9.${NC} 🧹 Cleanup"
    echo -e "${GREEN} 10.${NC} 🔧 Advanced Options"
    echo -e "${GREEN} 11.${NC} ❓ Help"
    echo -e "${GREEN}  0.${NC} 🚪 Exit"
    echo ""
}

print_advanced_menu() {
    echo -e "${CYAN}Advanced Options:${NC}"
    echo -e "${GREEN}  1.${NC} 🏗️  Build Packages"
    echo -e "${GREEN}  2.${NC} 🐳 Docker Profiles"
    echo -e "${GREEN}  3.${NC} 📊 Service Details"
    echo -e "${GREEN}  4.${NC} 🔧 Configuration"
    echo -e "${GREEN}  5.${NC} 📈 Performance Monitor"
    echo -e "${GREEN}  0.${NC} ⬅️  Back to Main Menu"
    echo ""
}

print_docker_profiles() {
    echo -e "${CYAN}Docker Profiles:${NC}"
    echo -e "${GREEN}  1.${NC} 🌐 Conflux Nodes (Core + EVM)"
    echo -e "${GREEN}  2.${NC} 🗄️  Database (PostgreSQL + MongoDB)"
    echo -e "${GREEN}  3.${NC} 🚀 Cache (Redis)"
    echo -e "${GREEN}  4.${NC} 🔀 Proxy (Nginx)"
    echo -e "${GREEN}  5.${NC} 🎯 All Services"
    echo -e "${GREEN}  0.${NC} ⬅️  Back to Advanced Menu"
    echo ""
}

print_service_details() {
    echo -e "${CYAN}Service Details:${NC}"
    echo ""
    for service in "${!SERVICE_INFO[@]}"; do
        local info="${SERVICE_INFO[$service]}"
        local url="${SERVICE_URLS[$service]}"
        echo -e "${GREEN}📦 $service:${NC}"
        echo -e "   ${BLUE}Description:${NC} $info"
        echo -e "   ${BLUE}URL:${NC} $url"
        echo ""
    done
}

wait_for_user() {
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read -r
}

show_status() {
    print_header
    echo -e "${CYAN}Service Status:${NC}"
    echo ""
    "$SERVICE_MANAGER" status
    echo ""
    wait_for_user
}

show_logs() {
    print_header
    echo -e "${CYAN}Service Logs:${NC}"
    echo ""
    echo -e "${GREEN}Select service to view logs:${NC}"
    echo -e "${GREEN}  1.${NC} All Services"
    echo -e "${GREEN}  2.${NC} Backend API"
    echo -e "${GREEN}  3.${NC} Backend WebSocket"
    echo -e "${GREEN}  4.${NC} Demo Frontend"
    echo -e "${GREEN}  0.${NC} Back to Main Menu"
    echo ""
    read -p "Enter your choice: " choice
    
    case $choice in
        1) "$SERVICE_MANAGER" logs ;;
        2) "$SERVICE_MANAGER" logs backend-api ;;
        3) "$SERVICE_MANAGER" logs backend-ws ;;
        4) "$SERVICE_MANAGER" logs demo-frontend ;;
        0) return ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
    
    wait_for_user
}

start_services() {
    print_header
    echo -e "${CYAN}Start Services:${NC}"
    echo ""
    echo -e "${GREEN}Select mode:${NC}"
    echo -e "${GREEN}  1.${NC} Development Mode"
    echo -e "${GREEN}  2.${NC} Production Mode"
    echo -e "${GREEN}  3.${NC} Docker Mode"
    echo -e "${GREEN}  0.${NC} Back to Main Menu"
    echo ""
    read -p "Enter your choice: " choice
    
    case $choice in
        1) 
            echo -e "${BLUE}Starting development services...${NC}"
            "$SERVICE_MANAGER" start:dev
            ;;
        2) 
            echo -e "${BLUE}Starting production services...${NC}"
            "$SERVICE_MANAGER" start:prod
            ;;
        3) 
            start_docker_services
            ;;
        0) 
            return
            ;;
        *) 
            echo -e "${RED}Invalid choice${NC}"
            wait_for_user
            ;;
    esac
    
    wait_for_user
}

start_docker_services() {
    print_header
    print_docker_profiles
    read -p "Enter your choice: " choice
    
    case $choice in
        1) "$SERVICE_MANAGER" start:docker conflux ;;
        2) "$SERVICE_MANAGER" start:docker database ;;
        3) "$SERVICE_MANAGER" start:docker cache ;;
        4) "$SERVICE_MANAGER" start:docker proxy ;;
        5) "$SERVICE_MANAGER" start:docker ;;
        0) return ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
    
    wait_for_user
}

stop_services() {
    print_header
    echo -e "${CYAN}Stop Services:${NC}"
    echo ""
    echo -e "${GREEN}Select mode:${NC}"
    echo -e "${GREEN}  1.${NC} Development Services"
    echo -e "${GREEN}  2.${NC} Production Services"
    echo -e "${GREEN}  3.${NC} Docker Services"
    echo -e "${GREEN}  4.${NC} All Services"
    echo -e "${GREEN}  0.${NC} Back to Main Menu"
    echo ""
    read -p "Enter your choice: " choice
    
    case $choice in
        1) "$SERVICE_MANAGER" stop:dev ;;
        2) "$SERVICE_MANAGER" stop:prod ;;
        3) "$SERVICE_MANAGER" stop:docker ;;
        4) 
            "$SERVICE_MANAGER" stop:dev
            "$SERVICE_MANAGER" stop:docker
            ;;
        0) return ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
    
    wait_for_user
}

restart_services() {
    print_header
    echo -e "${CYAN}Restart Services:${NC}"
    echo ""
    echo -e "${GREEN}Select mode:${NC}"
    echo -e "${GREEN}  1.${NC} Development Services"
    echo -e "${GREEN}  2.${NC} Production Services"
    echo -e "${GREEN}  3.${NC} Docker Services"
    echo -e "${GREEN}  0.${NC} Back to Main Menu"
    echo ""
    read -p "Enter your choice: " choice
    
    case $choice in
        1) "$SERVICE_MANAGER" restart:dev ;;
        2) "$SERVICE_MANAGER" restart:prod ;;
        3) "$SERVICE_MANAGER" restart:docker ;;
        0) return ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
    
    wait_for_user
}

show_help() {
    print_header
    echo -e "${CYAN}Help & Documentation:${NC}"
    echo ""
    echo -e "${GREEN}Service Manager Commands:${NC}"
    echo "  bash scripts/service-manager.sh start:dev    - Start development services"
    echo "  bash scripts/service-manager.sh start:prod   - Start production services"
    echo "  bash scripts/service-manager.sh start:docker - Start Docker services"
    echo "  bash scripts/service-manager.sh stop         - Stop services"
    echo "  bash scripts/service-manager.sh restart      - Restart services"
    echo "  bash scripts/service-manager.sh status       - Show service status"
    echo "  bash scripts/service-manager.sh logs         - Show service logs"
    echo "  bash scripts/service-manager.sh health       - Health check"
    echo "  bash scripts/service-manager.sh cleanup      - Clean up everything"
    echo ""
    echo -e "${GREEN}Service URLs:${NC}"
    for service in "${!SERVICE_URLS[@]}"; do
        local url="${SERVICE_URLS[$service]}"
        echo "  $service: $url"
    done
    echo ""
    echo -e "${GREEN}Quick Start:${NC}"
    echo "  1. Run 'pnpm install' to install dependencies"
    echo "  2. Run 'pnpm start' to start development services"
    echo "  3. Open http://localhost:3000 to view the demo"
    echo "  4. Use 'pnpm status' to check service health"
    echo ""
    wait_for_user
}

advanced_options() {
    while true; do
        print_header
        print_advanced_menu
        read -p "Enter your choice: " choice
        
        case $choice in
            1) 
                echo -e "${BLUE}Building packages...${NC}"
                "$SERVICE_MANAGER" build
                wait_for_user
                ;;
            2) 
                start_docker_services
                ;;
            3) 
                print_header
                print_service_details
                wait_for_user
                ;;
            4) 
                print_header
                echo -e "${CYAN}Configuration:${NC}"
                echo ""
                echo -e "${GREEN}Current Configuration:${NC}"
                echo "  Project Root: $PROJECT_ROOT"
                echo "  Service Manager: $SERVICE_MANAGER"
                echo "  Log Directory: $PROJECT_ROOT/logs"
                echo ""
                echo -e "${GREEN}Environment Variables:${NC}"
                echo "  NODE_ENV: ${NODE_ENV:-development}"
                echo "  PORT: ${PORT:-3001}"
                echo ""
                wait_for_user
                ;;
            5) 
                print_header
                echo -e "${CYAN}Performance Monitor:${NC}"
                echo ""
                echo -e "${GREEN}System Resources:${NC}"
                echo "  CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
                echo "  Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
                echo "  Disk Usage: $(df -h . | awk 'NR==2{printf "%s", $5}')"
                echo ""
                echo -e "${GREEN}Service Status:${NC}"
                "$SERVICE_MANAGER" status
                echo ""
                wait_for_user
                ;;
            0) 
                break
                ;;
            *) 
                echo -e "${RED}Invalid choice${NC}"
                wait_for_user
                ;;
        esac
    done
}

main_menu() {
    while true; do
        print_header
        print_menu
        read -p "Enter your choice: " choice
        
        case $choice in
            1) start_services ;;
            2) start_services ;;
            3) start_services ;;
            4) stop_services ;;
            5) restart_services ;;
            6) show_status ;;
            7) show_logs ;;
            8) 
                print_header
                echo -e "${CYAN}Health Check:${NC}"
                echo ""
                "$SERVICE_MANAGER" health
                wait_for_user
                ;;
            9) 
                print_header
                echo -e "${CYAN}Cleanup:${NC}"
                echo ""
                echo -e "${YELLOW}This will stop all services and clean up resources.${NC}"
                read -p "Are you sure? (y/N): " confirm
                if [[ $confirm =~ ^[Yy]$ ]]; then
                    "$SERVICE_MANAGER" cleanup
                fi
                wait_for_user
                ;;
            10) advanced_options ;;
            11) show_help ;;
            0) 
                print_header
                echo -e "${GREEN}Thank you for using Conflux DevKit!${NC}"
                echo -e "${BLUE}Goodbye! 👋${NC}"
                exit 0
                ;;
            *) 
                echo -e "${RED}Invalid choice. Please try again.${NC}"
                sleep 1
                ;;
        esac
    done
}

# Check if service manager exists
if [ ! -f "$SERVICE_MANAGER" ]; then
    echo -e "${RED}Error: Service manager not found at $SERVICE_MANAGER${NC}"
    exit 1
fi

# Make service manager executable
chmod +x "$SERVICE_MANAGER"

# Start the interactive menu
main_menu
