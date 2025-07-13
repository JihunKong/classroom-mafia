#!/bin/bash

# Korean Mafia Game - Docker Development Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_message "Docker is not running. Please start Docker first." "$RED"
        exit 1
    fi
}

# Main script
case "$1" in
    "up")
        print_message "Starting development environment..." "$GREEN"
        check_docker
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
        ;;
    "up-d")
        print_message "Starting development environment in detached mode..." "$GREEN"
        check_docker
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        print_message "Development environment started. View logs with: ./scripts/docker-dev.sh logs" "$GREEN"
        ;;
    "down")
        print_message "Stopping development environment..." "$YELLOW"
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
        ;;
    "restart")
        print_message "Restarting development environment..." "$YELLOW"
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart
        ;;
    "build")
        print_message "Building development images..." "$GREEN"
        check_docker
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
        ;;
    "rebuild")
        print_message "Rebuilding development images (no cache)..." "$GREEN"
        check_docker
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
        ;;
    "logs")
        if [ -z "$2" ]; then
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
        else
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$2"
        fi
        ;;
    "shell")
        if [ -z "$2" ]; then
            print_message "Please specify a service: client or server" "$RED"
            exit 1
        fi
        print_message "Opening shell in $2 container..." "$GREEN"
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec "$2" sh
        ;;
    "clean")
        print_message "Cleaning up Docker resources..." "$YELLOW"
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
        docker system prune -f
        print_message "Cleanup complete!" "$GREEN"
        ;;
    *)
        print_message "Korean Mafia Game - Docker Development Commands" "$GREEN"
        echo ""
        echo "Usage: ./scripts/docker-dev.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  up          Start development environment"
        echo "  up-d        Start development environment in detached mode"
        echo "  down        Stop development environment"
        echo "  restart     Restart all services"
        echo "  build       Build development images"
        echo "  rebuild     Rebuild images without cache"
        echo "  logs        View logs (optional: specify service)"
        echo "  shell       Open shell in container (requires service name)"
        echo "  clean       Clean up Docker resources"
        echo ""
        echo "Examples:"
        echo "  ./scripts/docker-dev.sh up"
        echo "  ./scripts/docker-dev.sh logs client"
        echo "  ./scripts/docker-dev.sh shell server"
        ;;
esac