#!/bin/bash

# scripts/quick-test.sh
# Quick test runner for Korean Mafia game (without Docker)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if services are running
check_services() {
    print_status "Checking if services are running..."
    
    # Check server
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Server is running on port 3001"
    else
        print_error "Server is not running on port 3001"
        print_status "Start server with: npm run dev:server"
        exit 1
    fi
    
    # Check client
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_success "Client is running on port 5173"
    else
        print_error "Client is not running on port 5173"
        print_status "Start client with: npm run dev:client"
        exit 1
    fi
}

# Setup Playwright if needed
setup_playwright() {
    print_status "Setting up Playwright..."
    
    cd playwright
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing Playwright dependencies..."
        npm install --silent
    fi
    
    # Install browsers if needed
    if ! npx playwright --version > /dev/null 2>&1; then
        print_status "Installing Playwright browsers..."
        npx playwright install
    fi
    
    cd ..
    print_success "Playwright setup complete"
}

# Run tests
run_tests() {
    local test_type="${1:-6players}"
    
    print_status "Running quick test: $test_type"
    
    cd playwright
    
    case $test_type in
        "6players")
            print_status "Running quick 6-player test..."
            npx playwright test tests/mafia-20-players.spec.ts --project="Desktop Chrome" --workers=1
            ;;
        "performance")
            print_status "Running performance test..."
            npx playwright test tests/mafia-performance.spec.ts --project="Desktop Chrome" --workers=1
            ;;
        "mobile")
            print_status "Running mobile test..."
            npx playwright test tests/mafia-20-players.spec.ts --project="Mobile Chrome" --workers=1
            ;;
        "all")
            print_status "Running all tests..."
            npx playwright test --workers=2
            ;;
        *)
            print_error "Unknown test type: $test_type"
            print_status "Available types: 6players, performance, mobile, all"
            exit 1
            ;;
    esac
    
    cd ..
}

# Show test report
show_report() {
    print_status "Generating test report..."
    
    cd playwright
    npx playwright show-report
    cd ..
}

# Main function
main() {
    local command="${1:-6players}"
    
    case $command in
        "help"|"-h"|"--help")
            echo "🎭 Korean Mafia Game Quick Test Runner"
            echo
            echo "Usage: $0 [TEST_TYPE]"
            echo
            echo "Test Types:"
            echo "  6players    Quick test with 6 players (default)"
            echo "  performance Performance and load test"
            echo "  mobile      Mobile device testing"
            echo "  all         Run all test suites"
            echo "  report      Show test report"
            echo "  help        Show this help message"
            echo
            echo "Prerequisites:"
            echo "  - Server running on port 3001: npm run dev:server"
            echo "  - Client running on port 5173: npm run dev:client"
            echo
            ;;
        "report")
            show_report
            ;;
        *)
            echo "🎭 Starting Korean Mafia Game Quick Tests"
            echo "========================================"
            
            check_services
            setup_playwright
            run_tests "$command"
            
            print_success "Quick test completed! 🎉"
            print_status "To view detailed report, run: $0 report"
            ;;
    esac
}

main "$@"