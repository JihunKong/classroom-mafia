#!/bin/bash

# Korean Mafia Game - Docker Production Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to load environment variables
load_env() {
    if [ -f .env.production ]; then
        print_message "Loading production environment variables..." "$BLUE"
        export $(cat .env.production | grep -v '^#' | xargs)
    fi
}

# Main script
case "$1" in
    "build")
        print_message "Building production images..." "$GREEN"
        check_docker
        load_env
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
        print_message "Build complete!" "$GREEN"
        ;;
    "up")
        print_message "Starting production environment..." "$GREEN"
        check_docker
        load_env
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        print_message "Production environment started!" "$GREEN"
        print_message "Client: http://localhost" "$BLUE"
        print_message "Server: http://localhost:3001" "$BLUE"
        ;;
    "down")
        print_message "Stopping production environment..." "$YELLOW"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
        ;;
    "restart")
        print_message "Restarting production environment..." "$YELLOW"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
        ;;
    "logs")
        if [ -z "$2" ]; then
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
        else
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f "$2"
        fi
        ;;
    "status")
        print_message "Production environment status:" "$BLUE"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
        ;;
    "backup")
        print_message "Creating backup..." "$GREEN"
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T server tar czf - /app > "$BACKUP_DIR/server_backup.tar.gz"
        print_message "Backup created in $BACKUP_DIR" "$GREEN"
        ;;
    "deploy")
        print_message "Deploying production environment..." "$GREEN"
        check_docker
        load_env
        
        # Pull latest changes
        if command -v git &> /dev/null; then
            print_message "Pulling latest changes..." "$BLUE"
            git pull
        fi
        
        # Build and deploy
        print_message "Building images..." "$BLUE"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
        
        print_message "Stopping old containers..." "$BLUE"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
        
        print_message "Starting new containers..." "$BLUE"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        
        print_message "Deployment complete!" "$GREEN"
        ;;
    "health")
        print_message "Checking health status..." "$BLUE"
        
        # Check client health
        CLIENT_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")
        if [ "$CLIENT_HEALTH" = "200" ]; then
            print_message "✓ Client is healthy" "$GREEN"
        else
            print_message "✗ Client is unhealthy (HTTP $CLIENT_HEALTH)" "$RED"
        fi
        
        # Check server health
        SERVER_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "000")
        if [ "$SERVER_HEALTH" = "200" ]; then
            print_message "✓ Server is healthy" "$GREEN"
        else
            print_message "✗ Server is unhealthy (HTTP $SERVER_HEALTH)" "$RED"
        fi
        ;;
    *)
        print_message "Korean Mafia Game - Docker Production Commands" "$GREEN"
        echo ""
        echo "Usage: ./scripts/docker-prod.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  build       Build production images"
        echo "  up          Start production environment"
        echo "  down        Stop production environment"
        echo "  restart     Restart all services"
        echo "  logs        View logs (optional: specify service)"
        echo "  status      Show container status"
        echo "  backup      Create backup of application data"
        echo "  deploy      Full deployment (pull, build, restart)"
        echo "  health      Check health status of services"
        echo ""
        echo "Examples:"
        echo "  ./scripts/docker-prod.sh build"
        echo "  ./scripts/docker-prod.sh up"
        echo "  ./scripts/docker-prod.sh logs server"
        ;;
esac