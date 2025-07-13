#!/bin/bash

# scripts/test-docker.sh
# Comprehensive Docker test runner for Korean Mafia game

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Clean up existing containers and networks
cleanup() {
    print_status "Cleaning up existing containers..."
    
    docker-compose -f docker-compose.test.yml down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove any dangling images
    docker image prune -f > /dev/null 2>&1 || true
    
    print_success "Cleanup completed"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build server
    print_status "Building server image..."
    docker build -t korean-mafia-server:test ./server
    
    # Build client
    print_status "Building client image..."
    docker build -t korean-mafia-client:test ./client
    
    # Build Playwright test runner
    print_status "Building Playwright test image..."
    cd playwright
    npm install --silent > /dev/null 2>&1 || true
    docker build -t korean-mafia-playwright:test .
    cd ..
    
    print_success "All images built successfully"
}

# Start services
start_services() {
    print_status "Starting test services..."
    
    # Start server and client
    docker-compose -f docker-compose.test.yml up -d mafia-server-test mafia-client-test
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.test.yml ps | grep -q "healthy"; then
            server_health=$(docker inspect --format='{{.State.Health.Status}}' mafia-server-test 2>/dev/null || echo "unknown")
            client_health=$(docker inspect --format='{{.State.Health.Status}}' mafia-client-test 2>/dev/null || echo "unknown")
            
            if [ "$server_health" = "healthy" ] && [ "$client_health" = "healthy" ]; then
                print_success "All services are healthy"
                return 0
            fi
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Services failed to start within timeout"
    docker-compose -f docker-compose.test.yml logs
    exit 1
}

# Run specific test suite
run_tests() {
    local test_type="${1:-all}"
    
    print_status "Running tests: $test_type"
    
    case $test_type in
        "20players")
            print_status "Running 20-player maximum capacity tests..."
            docker run --rm \
                --network mafia-game_mafia-test-network \
                -e BASE_URL=http://mafia-client-test \
                -e SERVER_URL=http://mafia-server-test:3001 \
                -v "$(pwd)/playwright/test-results:/app/test-results" \
                -v "$(pwd)/playwright/playwright-report:/app/playwright-report" \
                korean-mafia-playwright:test npm run test:20players
            ;;
        "performance")
            print_status "Running performance tests..."
            docker run --rm \
                --network mafia-game_mafia-test-network \
                -e BASE_URL=http://mafia-client-test \
                -e SERVER_URL=http://mafia-server-test:3001 \
                -v "$(pwd)/playwright/test-results:/app/test-results" \
                -v "$(pwd)/playwright/playwright-report:/app/playwright-report" \
                korean-mafia-playwright:test npm run test:performance
            ;;
        "roles")
            print_status "Running role system tests..."
            docker run --rm \
                --network mafia-game_mafia-test-network \
                -e BASE_URL=http://mafia-client-test \
                -e SERVER_URL=http://mafia-server-test:3001 \
                -v "$(pwd)/playwright/test-results:/app/test-results" \
                -v "$(pwd)/playwright/playwright-report:/app/playwright-report" \
                korean-mafia-playwright:test npm run test:roles
            ;;
        "full-game")
            print_status "Running full game flow tests..."
            docker run --rm \
                --network mafia-game_mafia-test-network \
                -e BASE_URL=http://mafia-client-test \
                -e SERVER_URL=http://mafia-server-test:3001 \
                -v "$(pwd)/playwright/test-results:/app/test-results" \
                -v "$(pwd)/playwright/playwright-report:/app/playwright-report" \
                korean-mafia-playwright:test npm run test:full-game
            ;;
        "all")
            print_status "Running all test suites..."
            docker run --rm \
                --network mafia-game_mafia-test-network \
                -e BASE_URL=http://mafia-client-test \
                -e SERVER_URL=http://mafia-server-test:3001 \
                -v "$(pwd)/playwright/test-results:/app/test-results" \
                -v "$(pwd)/playwright/playwright-report:/app/playwright-report" \
                korean-mafia-playwright:test npm run test
            ;;
        *)
            print_error "Unknown test type: $test_type"
            print_status "Available test types: 20players, performance, roles, full-game, all"
            exit 1
            ;;
    esac
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    if [ -d "./playwright/playwright-report" ]; then
        print_success "Test report generated at: ./playwright/playwright-report/index.html"
        print_status "To view the report, run: npx playwright show-report ./playwright/playwright-report"
    else
        print_warning "No test report found"
    fi
    
    if [ -d "./playwright/test-results" ]; then
        print_success "Test results available at: ./playwright/test-results"
    fi
}

# Show logs from services
show_logs() {
    print_status "Showing service logs..."
    docker-compose -f docker-compose.test.yml logs --tail=50
}

# Monitor performance during tests
monitor_performance() {
    print_status "Starting performance monitoring..."
    docker-compose -f docker-compose.test.yml up -d performance-monitor
    print_status "Performance monitoring available at: http://localhost:9090"
}

# Main function
main() {
    local command="${1:-help}"
    local test_type="${2:-all}"
    
    case $command in
        "help"|"-h"|"--help")
            echo "🎭 Korean Mafia Game Docker Test Runner"
            echo
            echo "Usage: $0 [COMMAND] [TEST_TYPE]"
            echo
            echo "Commands:"
            echo "  test        Run tests (default)"
            echo "  build       Build Docker images only"
            echo "  cleanup     Clean up containers and images"
            echo "  logs        Show service logs"
            echo "  monitor     Start performance monitoring"
            echo "  help        Show this help message"
            echo
            echo "Test Types:"
            echo "  all         Run all test suites (default)"
            echo "  20players   Run 20-player capacity tests"
            echo "  performance Run performance and load tests"
            echo "  roles       Run role system tests"
            echo "  full-game   Run complete game flow tests"
            echo
            echo "Examples:"
            echo "  $0 test 20players    # Run 20-player tests"
            echo "  $0 test performance  # Run performance tests"
            echo "  $0 build            # Build images only"
            echo "  $0 cleanup          # Clean up everything"
            ;;
        "build"|"--build-only")
            check_docker
            cleanup
            build_images
            ;;
        "cleanup")
            check_docker
            cleanup
            print_success "Cleanup completed"
            ;;
        "logs")
            show_logs
            ;;
        "monitor")
            check_docker
            monitor_performance
            ;;
        "test"|"")
            echo "🎭 Starting Korean Mafia Game Docker Tests"
            echo "=========================================="
            
            check_docker
            cleanup
            build_images
            start_services
            
            # Run the tests
            if run_tests "$test_type"; then
                print_success "All tests completed successfully! 🎉"
            else
                print_error "Some tests failed"
                show_logs
                exit 1
            fi
            
            generate_report
            
            # Keep services running for manual testing if needed
            print_status "Services are still running for manual testing:"
            print_status "  - Client: http://localhost:5173"
            print_status "  - Server: http://localhost:3001"
            print_status "  - Performance Monitor: http://localhost:9090"
            print_status ""
            print_status "To stop services, run: docker-compose -f docker-compose.test.yml down"
            ;;
        *)
            print_error "Unknown command: $command"
            print_status "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"