// playwright/tests/mafia-20-players-ui.spec.ts
// Test 20-player UI capacity without server

import { test, expect, Browser } from '@playwright/test';
import { GameTestHelper, Player } from './helpers/game-helpers';

test.describe('Korean Mafia Game - 20 Players UI Capacity Test', () => {
  let gameHelper: GameTestHelper;
  let players: Player[] = [];
  let browser: Browser;

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
    gameHelper = new GameTestHelper(browser);
    console.log('🚀 Starting 20-player UI capacity test...');
  });

  test.afterAll(async () => {
    await gameHelper.cleanup(players);
    console.log('🏁 20-player UI test completed');
  });

  test('should handle 20 concurrent browser sessions', async () => {
    console.log('\n=== 20 PLAYER UI CAPACITY TEST ===');
    
    // Step 1: Create 20 players
    console.log('\n📊 Creating 20 browser sessions...');
    const startTime = Date.now();
    players = await gameHelper.createPlayers(20);
    const creationTime = Date.now() - startTime;
    
    expect(players).toHaveLength(20);
    console.log(`⏱️  Created 20 sessions in ${creationTime}ms (avg: ${Math.round(creationTime/20)}ms per session)`);
    
    // Step 2: Navigate all players to home page
    console.log('\n🏠 Loading home page for all 20 players...');
    const navStartTime = Date.now();
    
    // Navigate in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      await Promise.all(batch.map(async (player, index) => {
        try {
          await player.page.goto('/', { waitUntil: 'domcontentloaded' });
          console.log(`  ✅ Player ${i + index + 1} (${player.name}) loaded`);
        } catch (error) {
          console.error(`  ❌ Player ${i + index + 1} failed: ${error}`);
        }
      }));
    }
    
    const navigationTime = Date.now() - navStartTime;
    console.log(`⏱️  Navigation completed in ${navigationTime}ms (avg: ${Math.round(navigationTime/20)}ms per player)`);
    
    // Step 3: Verify all players can see the UI
    console.log('\n✅ Verifying UI elements for all players...');
    let successCount = 0;
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      try {
        // Check if key elements are visible
        const hasTitle = await player.page.locator('h1').isVisible();
        const hasNameInput = await player.page.locator('input[placeholder="이름을 입력하세요"]').isVisible();
        
        if (hasTitle && hasNameInput) {
          successCount++;
        }
      } catch (error) {
        console.error(`  ❌ Verification failed for Player ${i + 1}`);
      }
    }
    
    console.log(`  ✅ ${successCount}/20 players successfully loaded the UI`);
    expect(successCount).toBeGreaterThanOrEqual(18); // Allow 10% failure rate
    
    // Step 4: Measure memory usage across all sessions
    console.log('\n📈 Measuring memory usage...');
    const memoryUsages: number[] = [];
    
    // Sample 5 players for memory measurement
    const sampleIndices = [0, 4, 9, 14, 19];
    for (const index of sampleIndices) {
      const player = players[index];
      try {
        const memory = await player.page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });
        memoryUsages.push(memory);
        console.log(`  📊 Player ${index + 1} (${player.name}): ${Math.round(memory / 1024 / 1024)}MB`);
      } catch (error) {
        console.error(`  ❌ Memory measurement failed for Player ${index + 1}`);
      }
    }
    
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    console.log(`  📊 Average memory usage: ${Math.round(avgMemory / 1024 / 1024)}MB`);
    
    // Step 5: Simulate concurrent interactions
    console.log('\n🎮 Simulating concurrent user interactions...');
    
    // Each player types their name
    const interactionStartTime = Date.now();
    await Promise.all(players.slice(0, 10).map(async (player, index) => {
      try {
        await player.page.fill('input[placeholder="이름을 입력하세요"]', player.name);
        console.log(`  ✅ Player ${index + 1} entered name`);
      } catch (error) {
        console.error(`  ❌ Player ${index + 1} interaction failed`);
      }
    }));
    
    const interactionTime = Date.now() - interactionStartTime;
    console.log(`⏱️  Interactions completed in ${interactionTime}ms`);
    
    // Step 6: Take screenshots of some players
    console.log('\n📸 Taking screenshots...');
    for (let i = 0; i < 3; i++) {
      try {
        await players[i].page.screenshot({ 
          path: `playwright/test-results/20-players-ui-player${i + 1}.png` 
        });
        console.log(`  📸 Screenshot saved for Player ${i + 1}`);
      } catch (error) {
        console.error(`  ❌ Screenshot failed for Player ${i + 1}`);
      }
    }
    
    // Summary
    console.log('\n🎉 20-Player UI Test Summary:');
    console.log(`  - Session creation: ${creationTime}ms`);
    console.log(`  - Navigation time: ${navigationTime}ms`);
    console.log(`  - Success rate: ${(successCount/20*100).toFixed(1)}%`);
    console.log(`  - Avg memory: ${Math.round(avgMemory / 1024 / 1024)}MB`);
    console.log(`  - Total test time: ${Date.now() - startTime}ms`);
  });

  test('should handle rapid player joining simulation', async () => {
    console.log('\n=== RAPID JOINING SIMULATION ===');
    
    // Create 10 players for rapid joining test
    const rapidPlayers = await gameHelper.createPlayers(10);
    
    // Simulate rapid navigation
    console.log('🚀 Simulating rapid player joining...');
    const joinStartTime = Date.now();
    
    // All players navigate at once
    await Promise.all(rapidPlayers.map(async (player, index) => {
      const delay = index * 100; // 100ms between each player
      await new Promise(resolve => setTimeout(resolve, delay));
      await player.page.goto('/');
      console.log(`  ✅ Player ${index + 1} joined after ${delay}ms delay`);
    }));
    
    const totalJoinTime = Date.now() - joinStartTime;
    console.log(`⏱️  All players joined in ${totalJoinTime}ms`);
    
    // Verify all loaded successfully
    const loadedCount = await Promise.all(rapidPlayers.map(async (player) => {
      try {
        return await player.page.locator('h1').isVisible();
      } catch {
        return false;
      }
    })).then(results => results.filter(Boolean).length);
    
    console.log(`✅ ${loadedCount}/10 players loaded successfully`);
    expect(loadedCount).toBeGreaterThanOrEqual(9); // 90% success rate
    
    // Cleanup rapid test players
    await gameHelper.cleanup(rapidPlayers);
  });
});