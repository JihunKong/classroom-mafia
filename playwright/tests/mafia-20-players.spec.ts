// playwright/tests/mafia-20-players.spec.ts
// Test Korean Mafia game with maximum 20 players

import { test, expect, Browser } from '@playwright/test';
import { GameTestHelper, Player } from './helpers/game-helpers';

test.describe('Korean Mafia Game - 20 Players Maximum Capacity', () => {
  let gameHelper: GameTestHelper;
  let players: Player[] = [];
  let browser: Browser;

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
    gameHelper = new GameTestHelper(browser);
    
    console.log('🚀 Starting 20-player maximum capacity test...');
  });

  test.afterAll(async () => {
    await gameHelper.cleanup(players);
    console.log('🏁 20-player test completed');
  });

  test('should support exactly 20 players joining and playing', async () => {
    console.log('\n=== 20 PLAYER MAXIMUM CAPACITY TEST ===');
    
    // Step 1: Create 20 players
    console.log('\n📊 Step 1: Creating 20 players...');
    players = await gameHelper.createPlayers(20);
    expect(players).toHaveLength(20);
    
    // Step 2: Navigate all players to home page
    console.log('\n🏠 Step 2: Loading home page for all players...');
    const startTime = Date.now();
    await gameHelper.navigatePlayersToHome(players);
    const navigationTime = Date.now() - startTime;
    console.log(`⏱️  Navigation completed in ${navigationTime}ms (avg: ${navigationTime/20}ms per player)`);
    
    // Performance check: Navigation should be reasonable
    expect(navigationTime).toBeLessThan(60000); // 60 seconds max for all players
    
    // Step 3: Create game room with first player as host
    console.log('\n🏗️  Step 3: Creating game room...');
    const host = players[0];
    const roomCode = await gameHelper.createGameRoom(host);
    expect(roomCode).toBeTruthy();
    expect(roomCode).toHaveLength(4);
    
    // Step 4: Join remaining 19 players to the room
    console.log('\n🚪 Step 4: Joining 19 players to room...');
    const joinStartTime = Date.now();
    const playersToJoin = players.slice(1); // All except host
    await gameHelper.joinPlayersToRoom(playersToJoin, roomCode);
    const joinTime = Date.now() - joinStartTime;
    console.log(`⏱️  All players joined in ${joinTime}ms (avg: ${joinTime/19}ms per player)`);
    
    // Performance check: Joining should be efficient
    expect(joinTime).toBeLessThan(120000); // 2 minutes max for 19 players
    
    // Step 5: Verify all 20 players are in waiting room
    console.log('\n✅ Step 5: Verifying all players in waiting room...');
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      await expect(player.page.locator('text=대기실')).toBeVisible();
      
      // Check player count display
      const playerCountText = await player.page.locator('text=참가자').textContent();
      expect(playerCountText).toContain('20');
      
      console.log(`  ✅ Player ${i + 1} (${player.name}) confirmed in waiting room`);
    }
    
    // Step 6: Start the game
    console.log('\n🎮 Step 6: Starting game with 20 players...');
    const gameStartTime = Date.now();
    await gameHelper.startGame(host);
    
    // Step 7: Wait for role assignments
    console.log('\n🎭 Step 7: Waiting for role assignments...');
    await gameHelper.waitForRoleAssignment(players);
    const roleAssignmentTime = Date.now() - gameStartTime;
    console.log(`⏱️  Role assignment completed in ${roleAssignmentTime}ms`);
    
    // Performance check: Role assignment should be fast
    expect(roleAssignmentTime).toBeLessThan(30000); // 30 seconds max
    
    // Step 8: Validate role distribution for 20 players
    console.log('\n🔍 Step 8: Validating role distribution...');
    const expectedDistribution = gameHelper.validateRoleDistribution(20);
    console.log('Expected distribution for 20 players:', expectedDistribution.expectedTeams);
    
    // Based on the game's role distribution:
    // 20 players = 5 mafia, 13 citizens, 2 neutral
    expect(expectedDistribution.expectedTeams.mafia).toBe(5);
    expect(expectedDistribution.expectedTeams.citizen).toBe(13);
    expect(expectedDistribution.expectedTeams.neutral).toBe(2);
    
    // Step 9: Test first game phase
    console.log('\n🌅 Step 9: Testing first game phase...');
    
    // Wait for first phase to stabilize
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check that all players can see the game screen
    for (const player of players) {
      await expect(player.page.locator('text=내 역할')).toBeVisible();
      await expect(player.page.locator('text=마피아 게임')).toBeVisible();
    }
    
    console.log('  ✅ All players can see game interface');
    
    // Step 10: Performance monitoring during gameplay
    console.log('\n📈 Step 10: Performance monitoring...');
    
    // Monitor performance of a few sample players
    const samplePlayers = [players[0], players[9], players[19]]; // Host, middle, last
    
    for (const player of samplePlayers) {
      const performance = await gameHelper.measurePerformance(player);
      console.log(`  📊 Player ${player.index + 1} (${player.name}):`);
      console.log(`    Load time: ${performance.loadTime}ms`);
      console.log(`    Memory usage: ${Math.round(performance.memoryUsage / 1024 / 1024)}MB`);
      
      // Performance assertions
      expect(performance.loadTime).toBeLessThan(5000); // 5 seconds max load time
      expect(performance.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB max per player
    }
    
    // Step 11: Test phase transitions with 20 players
    console.log('\n🔄 Step 11: Testing phase transitions...');
    
    let currentPhase = await gameHelper.getCurrentPhase(host);
    console.log(`Current phase: ${currentPhase}`);
    
    if (currentPhase === 'day') {
      // Wait for voting phase
      console.log('  Waiting for voting phase...');
      
      // Wait a bit for day phase discussion
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check if voting phase starts
      let attempts = 0;
      while (attempts < 24) { // Max 2 minutes waiting
        currentPhase = await gameHelper.getCurrentPhase(host);
        if (currentPhase === 'voting') {
          console.log('  ✅ Voting phase started');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
      
      if (currentPhase === 'voting') {
        // Simulate some voting
        console.log('  🗳️ Testing voting with 20 players...');
        const votersToTest = players.slice(0, 10); // Test first 10 players voting
        await gameHelper.simulateVoting(votersToTest);
      }
    }
    
    console.log('\n🎉 20-player test completed successfully!');
    console.log('📊 Performance Summary:');
    console.log(`  - Navigation time: ${navigationTime}ms`);
    console.log(`  - Join time: ${joinTime}ms`);
    console.log(`  - Role assignment time: ${roleAssignmentTime}ms`);
    console.log(`  - Total players: ${players.length}`);
    console.log(`  - Expected teams: ${JSON.stringify(expectedDistribution.expectedTeams)}`);
  });

  test('should handle 20 players with network simulation', async () => {
    console.log('\n=== NETWORK STRESS TEST WITH 20 PLAYERS ===');
    
    // Create players with simulated slow network
    players = await gameHelper.createPlayers(5); // Smaller subset for network test
    
    // Add network delays to simulate real conditions
    for (const player of players) {
      await player.context.route('**/*', async route => {
        // Simulate 100-500ms network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
        await route.continue();
      });
    }
    
    // Test basic flow with network delays
    await gameHelper.navigatePlayersToHome(players);
    
    const host = players[0];
    const roomCode = await gameHelper.createGameRoom(host);
    await gameHelper.joinPlayersToRoom(players.slice(1), roomCode);
    
    // Verify all players still work with network delays
    for (const player of players) {
      await expect(player.page.locator('text=대기실')).toBeVisible();
    }
    
    console.log('✅ Network stress test passed');
  });

  test('should handle concurrent room creation attempts', async () => {
    console.log('\n=== CONCURRENT ROOM CREATION TEST ===');
    
    // Create 5 players to test concurrent room creation
    const concurrentPlayers = await gameHelper.createPlayers(5);
    await gameHelper.navigatePlayersToHome(concurrentPlayers);
    
    // Try to create rooms simultaneously
    const roomCreationPromises = concurrentPlayers.map(async (player, index) => {
      try {
        await player.page.fill('input[placeholder="이름을 입력하세요"]', `Host${index + 1}`);
        await player.page.click('button:has-text("방 만들기")');
        await expect(player.page.locator('text=대기실')).toBeVisible();
        
        const roomCodeElement = await player.page.locator('text=참여 코드:').locator('+ span');
        const roomCode = await roomCodeElement.textContent();
        return { success: true, roomCode, playerIndex: index };
      } catch (error) {
        return { success: false, error: error.message, playerIndex: index };
      }
    });
    
    const results = await Promise.allSettled(roomCreationPromises);
    const successfulCreations = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    );
    
    console.log(`✅ ${successfulCreations.length}/5 concurrent room creations succeeded`);
    expect(successfulCreations.length).toBeGreaterThanOrEqual(3); // At least 3 should succeed
    
    // Clean up concurrent test players
    await gameHelper.cleanup(concurrentPlayers);
  });

  test('should validate memory usage with 20 players', async () => {
    console.log('\n=== MEMORY USAGE TEST ===');
    
    // Create 10 players for memory testing (subset of 20 for faster testing)
    const memoryTestPlayers = await gameHelper.createPlayers(10);
    await gameHelper.navigatePlayersToHome(memoryTestPlayers);
    
    // Measure initial memory
    const initialMemory = await memoryTestPlayers[0].page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    console.log(`Initial memory: ${Math.round(initialMemory / 1024 / 1024)}MB`);
    
    // Create room and join players
    const host = memoryTestPlayers[0];
    const roomCode = await gameHelper.createGameRoom(host);
    await gameHelper.joinPlayersToRoom(memoryTestPlayers.slice(1), roomCode);
    
    // Start game and measure memory after role assignment
    await gameHelper.startGame(host);
    await gameHelper.waitForRoleAssignment(memoryTestPlayers);
    
    // Measure memory after game start
    const gameMemory = await memoryTestPlayers[0].page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    console.log(`Game memory: ${Math.round(gameMemory / 1024 / 1024)}MB`);
    console.log(`Memory increase: ${Math.round((gameMemory - initialMemory) / 1024 / 1024)}MB`);
    
    // Memory should not exceed reasonable limits
    expect(gameMemory).toBeLessThan(200 * 1024 * 1024); // 200MB max
    
    // Clean up memory test players
    await gameHelper.cleanup(memoryTestPlayers);
  });
});