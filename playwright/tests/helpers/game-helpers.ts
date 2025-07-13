// playwright/tests/helpers/game-helpers.ts
// Reusable helper functions for Korean Mafia game testing

import { Page, Browser, BrowserContext, expect } from '@playwright/test';

export interface Player {
  page: Page;
  context: BrowserContext;
  name: string;
  index: number;
  role?: string;
  team?: string;
  isAlive?: boolean;
}

export interface GameRoom {
  roomCode: string;
  host: Player;
  players: Player[];
}

export class GameTestHelper {
  private browser: Browser;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  // Create multiple players with unique browser contexts
  async createPlayers(count: number): Promise<Player[]> {
    const players: Player[] = [];
    console.log(`🎭 Creating ${count} players...`);

    for (let i = 0; i < count; i++) {
      const context = await this.browser.newContext({
        // Each player gets a unique session
        storageState: undefined
      });
      
      const page = await context.newPage();
      
      // Korean names for more authentic testing
      const koreanNames = [
        '김민수', '이영희', '박철수', '최유진', '정다영', '강호준', '윤서연', '임태현',
        '한지민', '조현우', '신아름', '홍승기', '문소영', '백준혁', '송미경', '류정호',
        '안혜진', '장성민', '오수정', '권기탁'
      ];
      
      const player: Player = {
        page,
        context,
        name: koreanNames[i] || `플레이어${i + 1}`,
        index: i,
        isAlive: true
      };
      
      players.push(player);
      console.log(`  ✅ Created player ${i + 1}: ${player.name}`);
    }

    return players;
  }

  // Navigate all players to home page
  async navigatePlayersToHome(players: Player[]): Promise<void> {
    console.log('🏠 Navigating all players to home page...');
    
    await Promise.all(players.map(async (player, index) => {
      try {
        await player.page.goto('/', { waitUntil: 'networkidle' });
        await expect(player.page.locator('h1')).toContainText('마피아 게임');
        console.log(`  ✅ Player ${index + 1} (${player.name}) loaded home page`);
      } catch (error) {
        console.error(`  ❌ Player ${index + 1} failed to load: ${error}`);
        throw error;
      }
    }));
  }

  // Create a game room with host
  async createGameRoom(host: Player): Promise<string> {
    console.log(`🏗️  Creating game room with host: ${host.name}`);
    
    // Enter player name
    await host.page.fill('input[placeholder="이름을 입력하세요"]', host.name);
    
    // Create room
    await host.page.click('button:has-text("방 만들기")');
    
    // Wait for room creation and get room code
    await expect(host.page.locator('text=대기실')).toBeVisible();
    const roomCodeElement = await host.page.locator('text=참여 코드:').locator('+ span');
    const roomCode = await roomCodeElement.textContent();
    
    console.log(`  ✅ Room created with code: ${roomCode}`);
    return roomCode!;
  }

  // Join players to an existing room
  async joinPlayersToRoom(players: Player[], roomCode: string): Promise<void> {
    console.log(`🚪 Joining ${players.length} players to room ${roomCode}...`);
    
    await Promise.all(players.map(async (player, index) => {
      try {
        // Enter player name
        await player.page.fill('input[placeholder="이름을 입력하세요"]', player.name);
        
        // Enter room code
        await player.page.fill('input[placeholder="참여 코드"]', roomCode);
        
        // Join room
        await player.page.click('button:has-text("참여하기")');
        
        // Wait for waiting room
        await expect(player.page.locator('text=대기실')).toBeVisible();
        
        console.log(`  ✅ Player ${index + 1} (${player.name}) joined room`);
      } catch (error) {
        console.error(`  ❌ Player ${index + 1} failed to join: ${error}`);
        throw error;
      }
    }));
  }

  // Start the game
  async startGame(host: Player): Promise<void> {
    console.log('🎮 Starting game...');
    
    // Wait for minimum players and start button
    await expect(host.page.locator('button:has-text("게임 시작하기")')).toBeVisible();
    await host.page.click('button:has-text("게임 시작하기")');
    
    console.log('  ✅ Game started successfully');
  }

  // Wait for role assignment for all players
  async waitForRoleAssignment(players: Player[]): Promise<void> {
    console.log('🎭 Waiting for role assignments...');
    
    await Promise.all(players.map(async (player, index) => {
      try {
        // Wait for game screen to load
        await expect(player.page.locator('text=내 역할')).toBeVisible({ timeout: 30000 });
        
        // Try to get role information if visible
        try {
          const roleElement = await player.page.locator('.role-card, [data-testid="role-card"]').first();
          if (await roleElement.isVisible()) {
            const roleText = await roleElement.textContent();
            console.log(`  ✅ Player ${index + 1} (${player.name}): Role assigned`);
          }
        } catch {
          // Role might not be immediately visible, that's ok
        }
        
      } catch (error) {
        console.error(`  ❌ Player ${index + 1} role assignment failed: ${error}`);
        throw error;
      }
    }));
  }

  // Get current game phase
  async getCurrentPhase(player: Player): Promise<string> {
    try {
      const phaseElement = await player.page.locator('.phase-indicator, [data-testid="phase"]').first();
      const phaseText = await phaseElement.textContent();
      return phaseText?.toLowerCase().includes('밤') ? 'night' :
             phaseText?.toLowerCase().includes('낮') ? 'day' :
             phaseText?.toLowerCase().includes('투표') ? 'voting' : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // Simulate voting phase
  async simulateVoting(players: Player[]): Promise<void> {
    console.log('🗳️  Simulating voting phase...');
    
    for (const player of players) {
      try {
        // Check if player can vote
        const voteButton = player.page.locator('button:has-text("투표하기")');
        if (await voteButton.isVisible()) {
          // Select a random target (not self)
          const targets = await player.page.locator('input[type="radio"][name="target"]').all();
          if (targets.length > 1) {
            const randomTarget = targets[Math.floor(Math.random() * targets.length)];
            await randomTarget.check();
            await voteButton.click();
            console.log(`  ✅ ${player.name} voted`);
          }
        }
      } catch (error) {
        console.log(`  ⚠️  ${player.name} couldn't vote: ${error}`);
      }
    }
  }

  // Simulate night actions
  async simulateNightActions(players: Player[]): Promise<void> {
    console.log('🌙 Simulating night actions...');
    
    for (const player of players) {
      try {
        // Check for night action availability
        const actionButton = player.page.locator('button:has-text("행동하기"), button:has-text("공격하기"), button:has-text("치료하기"), button:has-text("조사하기")').first();
        
        if (await actionButton.isVisible()) {
          // Select a random target
          const targets = await player.page.locator('input[type="radio"][name="target"]').all();
          if (targets.length > 0) {
            const randomTarget = targets[Math.floor(Math.random() * targets.length)];
            await randomTarget.check();
            await actionButton.click();
            console.log(`  ✅ ${player.name} performed night action`);
          }
        }
      } catch (error) {
        console.log(`  ⚠️  ${player.name} couldn't perform night action: ${error}`);
      }
    }
  }

  // Wait for game to end and get results
  async waitForGameEnd(players: Player[], timeoutMs: number = 600000): Promise<string> {
    console.log('🏁 Waiting for game to end...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      for (const player of players) {
        try {
          // Check if game ended
          if (await player.page.locator('text=게임 종료').isVisible()) {
            const winnerElement = await player.page.locator('text=승리').first();
            const winner = await winnerElement.textContent();
            console.log(`  🎉 Game ended! Winner: ${winner}`);
            return winner || 'unknown';
          }
        } catch {
          // Continue checking
        }
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Game did not end within timeout');
  }

  // Performance monitoring
  async measurePerformance(player: Player): Promise<{
    loadTime: number;
    memoryUsage: number;
    networkRequests: number;
  }> {
    const startTime = Date.now();
    
    // Measure page load
    await player.page.reload({ waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Get memory usage
    const memoryUsage = await player.page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Count network requests
    let networkRequests = 0;
    player.page.on('request', () => networkRequests++);
    
    return { loadTime, memoryUsage, networkRequests };
  }

  // Clean up all player contexts
  async cleanup(players: Player[]): Promise<void> {
    console.log('🧹 Cleaning up player contexts...');
    
    await Promise.all(players.map(async (player) => {
      try {
        await player.context.close();
      } catch (error) {
        console.error(`Failed to close context for ${player.name}: ${error}`);
      }
    }));
    
    console.log('  ✅ All contexts cleaned up');
  }

  // Role distribution validation
  validateRoleDistribution(playerCount: number): {
    expectedRoles: { [key: string]: number };
    expectedTeams: { mafia: number; citizen: number; neutral: number };
  } {
    // Based on the role distribution system in the game
    const distributions: { [key: number]: any } = {
      6: { mafia: 2, citizen: 4, neutral: 0 },
      7: { mafia: 2, citizen: 4, neutral: 1 },
      8: { mafia: 2, citizen: 5, neutral: 1 },
      9: { mafia: 2, citizen: 6, neutral: 1 },
      10: { mafia: 3, citizen: 6, neutral: 1 },
      11: { mafia: 3, citizen: 7, neutral: 1 },
      12: { mafia: 3, citizen: 8, neutral: 1 },
      13: { mafia: 3, citizen: 8, neutral: 2 },
      14: { mafia: 4, citizen: 8, neutral: 2 },
      15: { mafia: 4, citizen: 9, neutral: 2 },
      16: { mafia: 4, citizen: 10, neutral: 2 },
      17: { mafia: 4, citizen: 11, neutral: 2 },
      18: { mafia: 5, citizen: 11, neutral: 2 },
      19: { mafia: 5, citizen: 12, neutral: 2 },
      20: { mafia: 5, citizen: 13, neutral: 2 }
    };

    return {
      expectedRoles: {}, // Specific roles depend on the game's role selection algorithm
      expectedTeams: distributions[playerCount] || { mafia: 0, citizen: 0, neutral: 0 }
    };
  }
}

// Utility functions
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getRandomKoreanName = (index: number): string => {
  const names = [
    '김민수', '이영희', '박철수', '최유진', '정다영', '강호준', '윤서연', '임태현',
    '한지민', '조현우', '신아름', '홍승기', '문소영', '백준혁', '송미경', '류정호',
    '안혜진', '장성민', '오수정', '권기탁'
  ];
  return names[index] || `플레이어${index + 1}`;
};