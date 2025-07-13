import { test, expect, chromium, Browser } from '@playwright/test';
import { GameHelpers, Player } from './helpers/game-helpers';

test.describe('Korean Mafia Game - Performance Tests', () => {
  let browser: Browser;
  let gameHelpers: GameHelpers;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    gameHelpers = new GameHelpers(process.env.CLIENT_URL || 'http://localhost:5173');
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should maintain good performance with maximum players', async () => {
    test.setTimeout(240000); // 4 minutes

    const players: Player[] = [];

    try {
      // Create 20 players with performance monitoring
      console.log('Creating 20 players for performance test...');
      
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 }
        });
        const player = await gameHelpers.createPlayer(context, `Player${i + 1}`);
        players.push(player);
      }

      const setupTime = Date.now() - startTime;
      console.log(`Player setup time: ${setupTime}ms`);
      expect(setupTime).toBeLessThan(30000); // Should complete in under 30 seconds

      // Host creates room and measure room creation time
      const roomCreateStart = Date.now();
      const roomCode = await gameHelpers.createRoom(players[0]);
      const roomCreateTime = Date.now() - roomCreateStart;
      
      console.log(`Room creation time: ${roomCreateTime}ms`);
      expect(roomCreateTime).toBeLessThan(5000); // Should create room in under 5 seconds

      // Measure join performance
      const joinStart = Date.now();
      const joinPromises = players.slice(1).map(async (player, index) => {
        const playerJoinStart = Date.now();
        await gameHelpers.joinRoom(player, roomCode);
        const playerJoinTime = Date.now() - playerJoinStart;
        
        return {
          player: player.name,
          joinTime: playerJoinTime,
          index: index + 1
        };
      });

      const joinResults = await Promise.all(joinPromises);
      const totalJoinTime = Date.now() - joinStart;
      const avgJoinTime = joinResults.reduce((sum, r) => sum + r.joinTime, 0) / joinResults.length;

      console.log(`Total join time: ${totalJoinTime}ms`);
      console.log(`Average join time: ${avgJoinTime}ms`);
      
      expect(totalJoinTime).toBeLessThan(60000); // All joins in under 1 minute
      expect(avgJoinTime).toBeLessThan(5000); // Average join under 5 seconds

      // Test game start performance
      const gameStartTime = Date.now();
      await gameHelpers.startGame(players[0]);
      const gameStartDuration = Date.now() - gameStartTime;
      
      console.log(`Game start time: ${gameStartDuration}ms`);
      expect(gameStartDuration).toBeLessThan(10000); // Game should start in under 10 seconds

      // Measure role assignment time
      const roleAssignStart = Date.now();
      const rolePromises = players.map(async (player) => {
        const roleStart = Date.now();
        const role = await gameHelpers.getPlayerRole(player);
        const roleTime = Date.now() - roleStart;
        return { player: player.name, role, roleTime };
      });

      const roleResults = await Promise.all(rolePromises);
      const roleAssignDuration = Date.now() - roleAssignStart;
      const avgRoleTime = roleResults.reduce((sum, r) => sum + r.roleTime, 0) / roleResults.length;

      console.log(`Role assignment total time: ${roleAssignDuration}ms`);
      console.log(`Average role display time: ${avgRoleTime}ms`);
      
      expect(roleAssignDuration).toBeLessThan(15000); // Role assignment in under 15 seconds
      expect(avgRoleTime).toBeLessThan(3000); // Each role display under 3 seconds

      // Test phase transition performance
      await gameHelpers.waitForPhase(players[0], 'day');
      
      const phaseTransitionStart = Date.now();
      await gameHelpers.waitForPhase(players[0], 'voting');
      const phaseTransitionTime = Date.now() - phaseTransitionStart;
      
      console.log(`Phase transition time: ${phaseTransitionTime}ms`);
      expect(phaseTransitionTime).toBeLessThan(180000); // Phase transition in under 3 minutes (timer)

      // Collect detailed performance metrics
      const performanceMetrics = await Promise.all(
        players.slice(0, 5).map(async (player, index) => {
          const metrics = await gameHelpers.getPerformanceMetrics(player);
          return {
            playerIndex: index,
            ...metrics
          };
        })
      );

      // Analyze performance metrics
      const avgPageLoadTime = performanceMetrics.reduce((sum, m) => sum + m.pageLoadTime, 0) / performanceMetrics.length;
      const avgDomContentLoaded = performanceMetrics.reduce((sum, m) => sum + m.domContentLoadedEventEnd, 0) / performanceMetrics.length;
      const avgResourceCount = performanceMetrics.reduce((sum, m) => sum + m.resourceCount, 0) / performanceMetrics.length;
      const totalResourceSize = performanceMetrics.reduce((sum, m) => sum + m.totalResourceSize, 0) / performanceMetrics.length;

      console.log('\nPerformance Metrics:');
      console.log(`Average page load time: ${avgPageLoadTime.toFixed(2)}ms`);
      console.log(`Average DOM content loaded: ${avgDomContentLoaded.toFixed(2)}ms`);
      console.log(`Average resource count: ${avgResourceCount.toFixed(0)}`);
      console.log(`Average total resource size: ${(totalResourceSize / 1024).toFixed(2)}KB`);

      // Performance assertions
      expect(avgPageLoadTime).toBeLessThan(3000); // Page load under 3 seconds
      expect(avgDomContentLoaded).toBeLessThan(2000); // DOM ready under 2 seconds
      expect(avgResourceCount).toBeLessThan(100); // Reasonable resource count
      expect(totalResourceSize).toBeLessThan(5 * 1024 * 1024); // Under 5MB total

    } finally {
      // Cleanup
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
    }
  });

  test('should handle concurrent user actions efficiently', async () => {
    test.setTimeout(180000); // 3 minutes

    const players: Player[] = [];

    try {
      // Create 12 players for concurrent action testing
      for (let i = 0; i < 12; i++) {
        const context = await browser.newContext();
        const player = await gameHelpers.createPlayer(context, `ConcurrentPlayer${i + 1}`);
        players.push(player);
      }

      // Setup game
      const roomCode = await gameHelpers.createRoom(players[0]);
      await Promise.all(
        players.slice(1).map(player => gameHelpers.joinRoom(player, roomCode))
      );

      await gameHelpers.startGame(players[0]);

      // Get roles
      await Promise.all(
        players.map(player => gameHelpers.getPlayerRole(player))
      );

      // Wait for voting phase
      await gameHelpers.waitForPhase(players[0], 'day');
      await gameHelpers.waitForPhase(players[0], 'voting');

      // Test concurrent voting
      console.log('Testing concurrent voting...');
      const targetPlayer = players[5];
      
      const votingStart = Date.now();
      const concurrentVotes = players.slice(0, 10).map(async (player, index) => {
        const voteStart = Date.now();
        try {
          await gameHelpers.voteForPlayer(player, targetPlayer.name);
          const voteTime = Date.now() - voteStart;
          return { success: true, voteTime, player: player.name };
        } catch (e) {
          const voteTime = Date.now() - voteStart;
          return { success: false, voteTime, player: player.name, error: e };
        }
      });

      const voteResults = await Promise.all(concurrentVotes);
      const votingDuration = Date.now() - votingStart;

      console.log(`Concurrent voting completed in: ${votingDuration}ms`);
      
      const successfulVotes = voteResults.filter(r => r.success);
      const avgVoteTime = voteResults.reduce((sum, r) => sum + r.voteTime, 0) / voteResults.length;

      console.log(`Successful votes: ${successfulVotes.length}/${voteResults.length}`);
      console.log(`Average vote time: ${avgVoteTime}ms`);

      expect(successfulVotes.length).toBeGreaterThan(8); // At least 80% success rate
      expect(avgVoteTime).toBeLessThan(2000); // Average vote under 2 seconds
      expect(votingDuration).toBeLessThan(10000); // All votes in under 10 seconds

      // Test server responsiveness during high load
      const responsivenessBefore = Date.now();
      const testRequest = await players[0].page?.goto(players[0].page.url());
      const responsivenessAfter = Date.now();
      const responsivenessTime = responsivenessAfter - responsivenessBefore;

      console.log(`Server responsiveness during load: ${responsivenessTime}ms`);
      expect(responsivenessTime).toBeLessThan(3000); // Should remain responsive

    } finally {
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
    }
  });

  test('should maintain memory usage within acceptable limits', async () => {
    test.setTimeout(300000); // 5 minutes

    const players: Player[] = [];
    const memoryCheckpoints: any[] = [];

    try {
      // Memory test with 15 players
      for (let i = 0; i < 15; i++) {
        const context = await browser.newContext();
        const player = await gameHelpers.createPlayer(context, `MemoryPlayer${i + 1}`);
        players.push(player);

        // Check memory usage every 5 players
        if ((i + 1) % 5 === 0) {
          const memoryUsage = await player.page?.evaluate(() => {
            return {
              usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
              totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
              jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0,
            };
          });

          memoryCheckpoints.push({
            playerCount: i + 1,
            ...memoryUsage,
            timestamp: Date.now()
          });

          console.log(`Memory usage with ${i + 1} players:`, memoryUsage);
        }
      }

      // Setup and run game
      const roomCode = await gameHelpers.createRoom(players[0]);
      await Promise.all(
        players.slice(1).map(player => gameHelpers.joinRoom(player, roomCode))
      );

      // Memory check after all joins
      const postJoinMemory = await players[0].page?.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
          totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
        };
      });
      
      memoryCheckpoints.push({
        phase: 'post-join',
        ...postJoinMemory,
        timestamp: Date.now()
      });

      await gameHelpers.startGame(players[0]);

      // Memory check after game start
      const postStartMemory = await players[0].page?.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
          totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
        };
      });

      memoryCheckpoints.push({
        phase: 'post-start',
        ...postStartMemory,
        timestamp: Date.now()
      });

      // Analyze memory growth
      const initialMemory = memoryCheckpoints[0].usedJSHeapSize;
      const finalMemory = memoryCheckpoints[memoryCheckpoints.length - 1].usedJSHeapSize;
      const memoryGrowth = finalMemory - initialMemory;
      const memoryGrowthPercent = (memoryGrowth / initialMemory) * 100;

      console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB (${memoryGrowthPercent.toFixed(2)}%)`);

      // Memory should not grow excessively
      expect(memoryGrowthPercent).toBeLessThan(200); // Less than 200% growth
      expect(finalMemory).toBeLessThan(100 * 1024 * 1024); // Less than 100MB total

      // Check for memory leaks by forcing garbage collection and checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const gcMemory = await players[0].page?.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
        return {
          usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        };
      });

      if (gcMemory) {
        const memoryDrop = finalMemory - gcMemory.usedJSHeapSize;
        console.log(`Memory after GC: ${(gcMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB (freed: ${(memoryDrop / 1024 / 1024).toFixed(2)}MB)`);
      }

    } finally {
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
    }
  });

  test('should handle network latency gracefully', async () => {
    test.setTimeout(240000); // 4 minutes

    const players: Player[] = [];

    try {
      // Create players with simulated network conditions
      for (let i = 0; i < 8; i++) {
        const context = await browser.newContext({
          // Simulate slow network for some players
          ...(i % 2 === 0 ? {} : {
            offline: false,
            downloadThroughput: 1000 * 1024, // 1MB/s
            uploadThroughput: 500 * 1024,    // 500KB/s
            latency: 100 // 100ms latency
          })
        });
        
        const player = await gameHelpers.createPlayer(context, `NetPlayer${i + 1}`);
        players.push(player);
      }

      // Test room creation and joining under network constraints
      const networkTestStart = Date.now();
      
      const roomCode = await gameHelpers.createRoom(players[0]);
      
      const joinPromises = players.slice(1).map(async (player, index) => {
        const joinStart = Date.now();
        await gameHelpers.joinRoom(player, roomCode);
        const joinTime = Date.now() - joinStart;
        
        return {
          player: player.name,
          joinTime,
          hasLatency: index % 2 === 0 // Every other player has simulated latency
        };
      });

      const joinResults = await Promise.all(joinPromises);
      const networkTestDuration = Date.now() - networkTestStart;

      console.log(`Network test completed in: ${networkTestDuration}ms`);

      // Analyze latency impact
      const normalPlayers = joinResults.filter(r => !r.hasLatency);
      const latencyPlayers = joinResults.filter(r => r.hasLatency);
      
      const avgNormalJoinTime = normalPlayers.reduce((sum, r) => sum + r.joinTime, 0) / normalPlayers.length;
      const avgLatencyJoinTime = latencyPlayers.reduce((sum, r) => sum + r.joinTime, 0) / latencyPlayers.length;

      console.log(`Average join time (normal): ${avgNormalJoinTime}ms`);
      console.log(`Average join time (with latency): ${avgLatencyJoinTime}ms`);

      // All players should still be able to join despite network conditions
      expect(joinResults.length).toBe(7);
      expect(avgLatencyJoinTime).toBeLessThan(avgNormalJoinTime * 3); // Latency shouldn't cause more than 3x delay

      // Test game functionality under network stress
      await gameHelpers.startGame(players[0]);
      
      // All players should receive role assignments
      const rolePromises = players.map(async (player) => {
        try {
          const role = await gameHelpers.getPlayerRole(player);
          return { player: player.name, role, success: true };
        } catch (e) {
          return { player: player.name, role: null, success: false };
        }
      });

      const roleResults = await Promise.all(rolePromises);
      const successfulRoles = roleResults.filter(r => r.success);

      console.log(`Successful role assignments: ${successfulRoles.length}/${roleResults.length}`);
      expect(successfulRoles.length).toBe(players.length); // All should succeed

    } finally {
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
    }
  });
});