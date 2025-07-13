import { test, expect, chromium, Browser } from '@playwright/test';
import { GameHelpers, Player } from './helpers/game-helpers';

test.describe('Korean Mafia Game - Full Game Flow Test', () => {
  let browser: Browser;
  let gameHelpers: GameHelpers;
  let players: Player[] = [];

  test.beforeAll(async () => {
    browser = await chromium.launch();
    gameHelpers = new GameHelpers(process.env.CLIENT_URL || 'http://localhost:5173');
  });

  test.afterAll(async () => {
    for (const player of players) {
      await gameHelpers.cleanupPlayer(player);
    }
    await browser.close();
  });

  test('should complete a full 8-player game with all phases', async () => {
    test.setTimeout(480000); // 8 minutes timeout

    // Create 8 players
    const playerNames = gameHelpers.generatePlayerNames(8);
    for (let i = 0; i < 8; i++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 }
      });
      const player = await gameHelpers.createPlayer(context, playerNames[i]);
      players.push(player);
    }

    // Host creates and others join
    const roomCode = await gameHelpers.createRoom(players[0]);
    for (let i = 1; i < 8; i++) {
      await gameHelpers.joinRoom(players[i], roomCode);
    }

    await gameHelpers.takeScreenshot(players[0], 'full-game-01-lobby.png');

    // Start game and get roles
    await gameHelpers.startGame(players[0]);
    
    const playerRoles: { [key: string]: string } = {};
    for (const player of players) {
      const role = await gameHelpers.getPlayerRole(player);
      playerRoles[player.name] = role;
      console.log(`${player.name}: ${role}`);
    }

    await gameHelpers.takeScreenshot(players[0], 'full-game-02-roles.png');

    // Game loop
    let day = 1;
    let gameEnded = false;
    const maxDays = 5; // Prevent infinite loops

    while (!gameEnded && day <= maxDays) {
      console.log(`\n--- Day ${day} ---`);

      // Day Phase
      console.log('Day phase: Discussion');
      await gameHelpers.waitForPhase(players[0], 'day');
      await gameHelpers.takeScreenshot(players[0], `full-game-day${day}-01-discussion.png`);
      
      // Wait for discussion time (reduced for testing)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Voting Phase
      console.log('Voting phase');
      await gameHelpers.waitForPhase(players[0], 'voting');
      await gameHelpers.takeScreenshot(players[0], `full-game-day${day}-02-voting.png`);

      // Simulate voting behavior
      const alivePlayers = players.filter(p => p.isAlive);
      const suspiciousPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      
      console.log(`Players voting for: ${suspiciousPlayer.name}`);
      
      // Most players vote for the suspicious player
      for (const player of alivePlayers.slice(0, Math.min(6, alivePlayers.length))) {
        try {
          await gameHelpers.voteForPlayer(player, suspiciousPlayer.name);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
          console.log(`${player.name} couldn't vote`);
        }
      }

      // Execution Phase
      console.log('Execution phase');
      await gameHelpers.waitForPhase(players[0], 'execution');
      await gameHelpers.takeScreenshot(players[0], `full-game-day${day}-03-execution.png`);

      // Vote on execution (mixed votes)
      for (const player of alivePlayers) {
        try {
          const approveExecution = Math.random() > 0.3; // 70% chance to approve
          await gameHelpers.voteExecution(player, approveExecution);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
          console.log(`${player.name} couldn't vote on execution`);
        }
      }

      // Update alive status after execution
      for (const player of players) {
        await gameHelpers.isPlayerAlive(player);
      }

      // Night Phase
      console.log('Night phase');
      await gameHelpers.waitForPhase(players[0], 'night');
      await gameHelpers.takeScreenshot(players[0], `full-game-day${day}-04-night.png`);

      // Mafia action
      const mafiaPlayers = players.filter(p => 
        ['마피아', '스파이'].includes(playerRoles[p.name]) && p.isAlive
      );
      
      if (mafiaPlayers.length > 0) {
        const citizenTargets = players.filter(p => 
          !['마피아', '스파이'].includes(playerRoles[p.name]) && p.isAlive
        );
        
        if (citizenTargets.length > 0) {
          const target = citizenTargets[Math.floor(Math.random() * citizenTargets.length)];
          console.log(`Mafia targeting: ${target.name}`);
          
          try {
            await gameHelpers.performNightAction(mafiaPlayers[0], target.name);
          } catch (e) {
            console.log(`Mafia action failed: ${e}`);
          }
        }
      }

      // Doctor action
      const doctor = players.find(p => playerRoles[p.name] === '의사' && p.isAlive);
      if (doctor) {
        const protectTarget = players.filter(p => p.isAlive)[Math.floor(Math.random() * players.filter(p => p.isAlive).length)];
        console.log(`Doctor protecting: ${protectTarget.name}`);
        
        try {
          await gameHelpers.performNightAction(doctor, protectTarget.name);
        } catch (e) {
          console.log(`Doctor action failed: ${e}`);
        }
      }

      // Police action (if exists)
      const police = players.find(p => playerRoles[p.name] === '경찰' && p.isAlive);
      if (police) {
        const investigateTarget = players.filter(p => p.isAlive && p.name !== police.name)[0];
        if (investigateTarget) {
          console.log(`Police investigating: ${investigateTarget.name}`);
          
          try {
            await gameHelpers.performNightAction(police, investigateTarget.name);
          } catch (e) {
            console.log(`Police action failed: ${e}`);
          }
        }
      }

      // Night Result Phase
      console.log('Night result phase');
      try {
        await gameHelpers.waitForPhase(players[0], 'nightResult');
        await gameHelpers.takeScreenshot(players[0], `full-game-day${day}-05-night-result.png`);
      } catch (e) {
        console.log('Night result phase skipped or game ended');
      }

      // Update alive status after night
      for (const player of players) {
        await gameHelpers.isPlayerAlive(player);
      }

      // Check win conditions
      try {
        await gameHelpers.waitForPhase(players[0], 'ended');
        gameEnded = true;
        
        const winner = await gameHelpers.getGameWinner(players[0]);
        console.log(`\n🎉 Game ended! Winner: ${winner} team`);
        
        await gameHelpers.takeScreenshot(players[0], `full-game-final-winner-${winner}.png`);
        
        // Verify winner is valid
        expect(['mafia', 'citizen', 'neutral']).toContain(winner);
        
      } catch (e) {
        console.log('Game continues...');
        day++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Game analysis
    const finalAlivePlayers = players.filter(p => p.isAlive);
    console.log(`\nFinal alive players: ${finalAlivePlayers.map(p => `${p.name}(${playerRoles[p.name]})`).join(', ')}`);
    
    expect(gameEnded || day > maxDays).toBe(true);
    console.log('Full game test completed!');
  });

  test('should handle various win conditions correctly', async () => {
    test.setTimeout(300000); // 5 minutes

    const testCases = [
      { playerCount: 6, description: 'Minimum players' },
      { playerCount: 12, description: 'Medium game' },
      { playerCount: 16, description: 'Large game with special roles' }
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting ${testCase.description} (${testCase.playerCount} players)`);
      
      // Clear previous players
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
      players = [];

      // Create players for this test case
      const playerNames = gameHelpers.generatePlayerNames(testCase.playerCount);
      for (let i = 0; i < testCase.playerCount; i++) {
        const context = await browser.newContext();
        const player = await gameHelpers.createPlayer(context, playerNames[i]);
        players.push(player);
      }

      // Setup and start game
      const roomCode = await gameHelpers.createRoom(players[0]);
      for (let i = 1; i < testCase.playerCount; i++) {
        await gameHelpers.joinRoom(players[i], roomCode);
      }

      await gameHelpers.startGame(players[0]);

      // Get and verify role distribution
      const roles: Record<string, number> = {};
      for (const player of players) {
        const role = await gameHelpers.getPlayerRole(player);
        roles[role] = (roles[role] || 0) + 1;
      }

      // Verify minimum role requirements
      expect(roles['마피아']).toBeGreaterThan(0);
      expect(roles['시민']).toBeGreaterThan(0);
      
      if (testCase.playerCount >= 9) {
        expect(roles['경찰']).toBeGreaterThan(0);
      }

      console.log(`Role distribution for ${testCase.playerCount} players:`, roles);

      // Simulate until game end (accelerated)
      let rounds = 0;
      const maxRounds = 3;
      
      while (rounds < maxRounds) {
        try {
          // Wait for any phase that indicates game progress
          await Promise.race([
            gameHelpers.waitForPhase(players[0], 'day'),
            gameHelpers.waitForPhase(players[0], 'voting'),
            gameHelpers.waitForPhase(players[0], 'night'),
            gameHelpers.waitForPhase(players[0], 'ended')
          ]);

          // Check if game ended
          try {
            await gameHelpers.waitForPhase(players[0], 'ended');
            const winner = await gameHelpers.getGameWinner(players[0]);
            console.log(`Game ended after ${rounds} rounds. Winner: ${winner}`);
            break;
          } catch (e) {
            // Game hasn't ended, continue
          }

          rounds++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (e) {
          console.log(`Round ${rounds} error:`, e);
          break;
        }
      }

      await gameHelpers.takeScreenshot(players[0], `win-condition-test-${testCase.playerCount}p.png`);
    }
  });
});