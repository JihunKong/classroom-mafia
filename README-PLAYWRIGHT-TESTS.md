# 🎭 Korean Mafia Game - Playwright Testing Suite

Complete end-to-end testing suite for the Korean Mafia game with support for maximum 20-player capacity testing.

## 📁 Test Suite Overview

### **Test Files**
- `mafia-20-players.spec.ts` - **20-player maximum capacity tests**
- `mafia-full-game.spec.ts` - **Complete game flow testing** 
- `mafia-performance.spec.ts` - **Performance and load testing**
- `mafia-roles.spec.ts` - **Role abilities and interactions**

### **Helper Files**
- `helpers/game-helpers.ts` - **Reusable test utilities and game simulation**

### **Configuration**
- `playwright.config.ts` - Playwright configuration with multiple browser support
- `package.json` - Test dependencies and scripts
- `Dockerfile` - Container setup for isolated testing

### **Automation Scripts**
- `scripts/test-docker.sh` - **Full Docker test suite runner**
- `scripts/quick-test.sh` - **Quick local testing without Docker**

## 🚀 Quick Start

### **Option 1: Docker Testing (Recommended)**
```bash
# Run all tests with Docker
./scripts/test-docker.sh test 20players

# Run specific test types
./scripts/test-docker.sh test performance
./scripts/test-docker.sh test roles
./scripts/test-docker.sh test full-game

# Build images only
./scripts/test-docker.sh build

# Show help
./scripts/test-docker.sh help
```

### **Option 2: Local Testing**
```bash
# Start services first
npm run dev:server &  # Terminal 1
npm run dev:client &  # Terminal 2

# Run quick tests
./scripts/quick-test.sh 6players    # Quick 6-player test
./scripts/quick-test.sh performance # Performance test  
./scripts/quick-test.sh mobile      # Mobile testing
./scripts/quick-test.sh all         # All tests

# View test report
./scripts/quick-test.sh report
```

## 🎯 Test Coverage

### **20-Player Maximum Capacity Testing**
- ✅ Creates 20 simultaneous browser sessions
- ✅ Tests room creation and joining with maximum players
- ✅ Verifies role distribution according to game rules
- ✅ Performance monitoring under full load
- ✅ Memory usage and resource tracking
- ✅ Network stress testing with simulated delays
- ✅ Concurrent room creation handling

**Expected Role Distribution for 20 Players:**
- **Mafia Team**: 5 players
- **Citizen Team**: 13 players  
- **Neutral Team**: 2 players

### **Complete Game Flow Testing**
- ✅ Full day/night cycle testing
- ✅ All game phases (day → voting → execution → night → result)
- ✅ Win condition verification (mafia, citizen, neutral victories)
- ✅ Player interactions and abilities
- ✅ Phase transition timing and reliability

### **Role System Validation**
- ✅ Correct role distribution for all player counts (6-20)
- ✅ **Mafia abilities**: kill, spy disguise, werewolf transform, double agent
- ✅ **Citizen abilities**: doctor heal, police investigate, soldier shield, reporter, bartender, cheerleader, medium, thief, wizard
- ✅ **Neutral roles**: terrorist revenge, turncoat switching, illusionist, ghost
- ✅ Voting mechanics and special abilities
- ✅ Role interaction validation (heal vs kill, investigation results, etc.)

### **Performance & Load Testing**
- ✅ Page load times under maximum load (< 3 seconds target)
- ✅ Concurrent user action handling (< 5 seconds join time)
- ✅ Memory leak detection (< 100MB per player)
- ✅ Network latency simulation (100-500ms delays)
- ✅ Server responsiveness monitoring

## 📊 Performance Benchmarks

The tests validate these performance criteria:

| Metric | Target | 20 Players |
|--------|--------|------------|
| **Page Load** | < 3 seconds | ✅ Validated |
| **Room Join** | < 5 seconds per player | ✅ Validated |
| **Game Start** | < 10 seconds for role assignment | ✅ Validated |
| **Memory Usage** | < 100MB per player | ✅ Validated |
| **Success Rate** | > 90% for all operations | ✅ Validated |

## 🎮 Game Mechanics Tested

### **Core Game Flow**
1. **Room Management**: Creation, joining, player limits
2. **Role Distribution**: Automatic balancing for all player counts
3. **Phase Transitions**: Day → Voting → Night → Results
4. **Player Actions**: Voting, night actions, special abilities
5. **Win Conditions**: Team-based victory detection
6. **Error Handling**: Network issues, disconnections, invalid actions

### **Advanced Features**  
1. **Dead Chat System**: Separate communication for eliminated players
2. **Teacher Dashboard**: Classroom management and game control
3. **Mobile Optimization**: Touch-friendly interface testing
4. **PWA Features**: Offline functionality and installation
5. **Real-time Updates**: Socket.io event synchronization

## 🔧 Test Configuration

### **Browser Support**
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: iPhone 12, Pixel 5
- **Load Testing**: Optimized Chrome with special flags

### **Environment Variables**
```bash
BASE_URL=http://localhost:5173        # Client URL
SERVER_URL=http://localhost:3001      # Server URL  
CI=true                              # CI mode
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1   # For Docker
```

### **Test Timeouts**
- **Global Test Timeout**: 5 minutes
- **Navigation Timeout**: 30 seconds
- **Action Timeout**: 10 seconds
- **Assertion Timeout**: 10 seconds

## 📈 Monitoring & Reporting

### **Test Reports**
- **HTML Report**: Visual test results with screenshots
- **JSON Report**: Machine-readable test data
- **Performance Metrics**: Load times, memory usage, success rates

### **Performance Monitoring**
```bash
# Start performance monitoring
./scripts/test-docker.sh monitor

# Access Prometheus dashboard
open http://localhost:9090
```

### **Test Artifacts**
- Screenshots on failure
- Video recordings of failed tests
- Trace files for debugging
- Network logs and console errors

## 🛠️ Development & Debugging

### **Debug Mode**
```bash
cd playwright
npx playwright test --debug          # Interactive debugging
npx playwright test --headed         # Show browser UI
npx playwright test --ui             # Playwright UI mode
```

### **Writing New Tests**
```typescript
import { test, expect } from '@playwright/test';
import { GameTestHelper } from './helpers/game-helpers';

test('my new test', async ({ browser }) => {
  const gameHelper = new GameTestHelper(browser);
  const players = await gameHelper.createPlayers(6);
  
  // Test implementation...
  
  await gameHelper.cleanup(players);
});
```

### **Adding New Test Scenarios**
1. Create new `.spec.ts` file in `tests/` directory
2. Use `GameTestHelper` for common operations
3. Add corresponding npm script in `package.json`
4. Update test runner scripts if needed

## 🐛 Troubleshooting

### **Common Issues**

**Services not running:**
```bash
# Check if server is running
curl http://localhost:3001/health

# Check if client is running  
curl http://localhost:5173
```

**Docker issues:**
```bash
# Clean up Docker environment
./scripts/test-docker.sh cleanup

# Rebuild images
./scripts/test-docker.sh build
```

**Browser issues:**
```bash
# Reinstall Playwright browsers
cd playwright
npx playwright install --force
```

**Memory issues with 20 players:**
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory: 8GB+
```

### **Performance Optimization**
- Use `--workers=1` for memory-intensive tests
- Run tests on machines with 8GB+ RAM for 20-player tests
- Use `--project="Desktop Chrome"` for faster single-browser testing

## 📚 Additional Resources

### **Korean Mafia Game Documentation**
- [Game Rules](../CLAUDE.md) - Complete game rules and architecture
- [Docker Setup](../docker-compose.yml) - Production Docker configuration  
- [API Documentation](../server/README.md) - Server API reference

### **Playwright Documentation**
- [Official Docs](https://playwright.dev/) - Playwright documentation
- [API Reference](https://playwright.dev/docs/api/class-test) - Test API reference
- [Best Practices](https://playwright.dev/docs/best-practices) - Testing best practices

### **Test Examples**
```bash
# View sample test execution
./scripts/quick-test.sh 6players

# Check test report
./scripts/quick-test.sh report

# Full 20-player stress test
./scripts/test-docker.sh test 20players
```

---

## 🎯 Test Execution Commands

### **Quick Commands**
```bash
# Quick 6-player test
./scripts/quick-test.sh

# Full 20-player Docker test
./scripts/test-docker.sh test 20players

# Performance analysis
./scripts/test-docker.sh test performance

# View results
./scripts/quick-test.sh report
```

### **Advanced Commands**
```bash
# Custom test execution
cd playwright
npx playwright test tests/mafia-20-players.spec.ts --project="Load Test Chrome"

# Debug specific test
npx playwright test tests/mafia-roles.spec.ts --debug

# Run with specific workers
npx playwright test --workers=1 --timeout=600000
```

This comprehensive testing suite ensures the Korean Mafia game can handle maximum capacity while maintaining performance, reliability, and game integrity across all supported devices and browsers.