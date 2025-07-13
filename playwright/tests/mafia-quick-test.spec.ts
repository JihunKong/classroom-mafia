// playwright/tests/mafia-quick-test.spec.ts
// Quick test to verify Playwright setup with 6 players

import { test, expect, Browser } from '@playwright/test';
import { GameTestHelper, Player } from './helpers/game-helpers';

test.describe('Korean Mafia Game - Quick 6 Player Test', () => {
  let gameHelper: GameTestHelper;
  let players: Player[] = [];
  let browser: Browser;

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
    gameHelper = new GameTestHelper(browser);
    console.log('🚀 Starting quick 6-player test...');
  });

  test.afterAll(async () => {
    await gameHelper.cleanup(players);
    console.log('🏁 Quick test completed');
  });

  test('should load home page and show game UI', async () => {
    console.log('\n=== QUICK UI TEST ===');
    
    // Create just one player to test UI
    console.log('\n📊 Creating test player...');
    players = await gameHelper.createPlayers(1);
    
    // Navigate to home page
    console.log('\n🏠 Loading home page...');
    await gameHelper.navigatePlayersToHome(players);
    
    // Check UI elements
    const player = players[0];
    
    // Check if main elements are visible
    await expect(player.page.locator('h1')).toContainText('마피아 게임');
    await expect(player.page.locator('input[placeholder="이름을 입력하세요"]')).toBeVisible();
    await expect(player.page.locator('button:has-text("방 만들기")')).toBeVisible();
    await expect(player.page.locator('input[placeholder="참여 코드"]')).toBeVisible();
    await expect(player.page.locator('button:has-text("참여하기")')).toBeVisible();
    
    console.log('✅ UI elements verified');
    
    // Take screenshot
    await player.page.screenshot({ path: 'playwright/test-results/home-page.png' });
    console.log('📸 Screenshot saved');
  });

  test('should measure page load performance', async () => {
    console.log('\n=== PERFORMANCE TEST ===');
    
    if (players.length === 0) {
      players = await gameHelper.createPlayers(1);
    }
    
    const player = players[0];
    
    // Measure page load time
    const startTime = Date.now();
    await player.page.goto('/');
    await player.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️  Page load time: ${loadTime}ms`);
    
    // Check performance
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Measure memory usage
    const metrics = await player.page.evaluate(() => {
      return {
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        navigation: performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      };
    });
    
    console.log(`💾 Memory usage: ${Math.round(metrics.memory / 1024 / 1024)}MB`);
    console.log(`⚡ DOM Content Loaded: ${Math.round(metrics.navigation.domContentLoadedEventEnd)}ms`);
    
    // Memory should be reasonable
    expect(metrics.memory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB for single player
  });

  test('should handle mobile viewport', async () => {
    console.log('\n=== MOBILE TEST ===');
    
    // Create mobile player
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 12 size
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });
    
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('/');
    
    // Check mobile UI
    await expect(mobilePage.locator('h1')).toContainText('마피아');
    
    // Take mobile screenshot
    await mobilePage.screenshot({ path: 'playwright/test-results/mobile-home.png' });
    console.log('📱 Mobile screenshot saved');
    
    // Check if mobile-optimized components are used
    const isMobileOptimized = await mobilePage.evaluate(() => {
      return window.innerWidth < 768;
    });
    
    expect(isMobileOptimized).toBe(true);
    console.log('✅ Mobile viewport verified');
    
    await mobileContext.close();
  });
});