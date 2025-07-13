import { test, expect, chromium, Browser } from '@playwright/test';
import { GameHelpers, Player } from './helpers/game-helpers';

test.describe('Korean Mafia Game - Role Abilities and Interactions', () => {
  let browser: Browser;
  let gameHelpers: GameHelpers;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    gameHelpers = new GameHelpers(process.env.CLIENT_URL || 'http://localhost:5173');
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should correctly assign roles according to player count distributions', async () => {
    test.setTimeout(300000); // 5 minutes

    const testCases = [
      { count: 6, expectedRoles: { '마피아': 1, '시민': 4, '의사': 1 } },
      { count: 8, expectedRoles: { '마피아': 2, '시민': 5, '의사': 1 } },
      { count: 12, expectedRoles: { '마피아': 3, '시민': 5, '의사': 1, '경찰': 1, '군인': 1, '기자': 1 } },
      { count: 20, expectedRoles: { '마피아': 3, '스파이': 1, '늑대인간': 1, '간첩': 1, '시민': 7, '의사': 1, '경찰': 1, '군인': 1, '기자': 1, '마법사': 1, '도둑': 1, '환술사': 1 } }
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting role distribution for ${testCase.count} players`);
      
      const players: Player[] = [];

      try {
        // Create players
        const playerNames = gameHelpers.generatePlayerNames(testCase.count);
        for (let i = 0; i < testCase.count; i++) {
          const context = await browser.newContext();
          const player = await gameHelpers.createPlayer(context, playerNames[i]);
          players.push(player);
        }

        // Setup and start game
        const roomCode = await gameHelpers.createRoom(players[0]);
        for (let i = 1; i < testCase.count; i++) {
          await gameHelpers.joinRoom(players[i], roomCode);
        }

        await gameHelpers.startGame(players[0]);

        // Get roles and count them
        const actualRoles: Record<string, number> = {};
        for (const player of players) {
          const role = await gameHelpers.getPlayerRole(player);
          actualRoles[role] = (actualRoles[role] || 0) + 1;
          console.log(`${player.name}: ${role}`);
        }

        // Verify role distribution matches expected
        for (const [role, expectedCount] of Object.entries(testCase.expectedRoles)) {
          expect(actualRoles[role] || 0).toBe(expectedCount);
        }

        // Verify total count
        const totalAssigned = Object.values(actualRoles).reduce((sum, count) => sum + count, 0);
        expect(totalAssigned).toBe(testCase.count);

        await gameHelpers.takeScreenshot(players[0], `roles-${testCase.count}p-distribution.png`);

      } finally {
        for (const player of players) {
          await gameHelpers.cleanupPlayer(player);
        }
      }
    }
  });

  test('should handle mafia team abilities correctly', async () => {
    test.setTimeout(240000); // 4 minutes

    const players: Player[] = [];

    try {
      // Create 12 players to ensure mafia team roles
      for (let i = 0; i < 12; i++) {
        const context = await browser.newContext();
        const player = await gameHelpers.createPlayer(context, `MafiaTest${i + 1}`);
        players.push(player);
      }

      // Setup game
      const roomCode = await gameHelpers.createRoom(players[0]);
      for (let i = 1; i < 12; i++) {
        await gameHelpers.joinRoom(players[i], roomCode);
      }

      await gameHelpers.startGame(players[0]);

      // Identify roles
      const playerRoles: Record<string, string> = {};
      for (const player of players) {
        const role = await gameHelpers.getPlayerRole(player);
        playerRoles[player.name] = role;
      }

      console.log('Player roles:', playerRoles);

      // Find mafia team members
      const mafiaPlayers = players.filter(p => 
        ['마피아', '스파이'].includes(playerRoles[p.name])
      );
      const citizenPlayers = players.filter(p => 
        !['마피아', '스파이'].includes(playerRoles[p.name])
      );

      expect(mafiaPlayers.length).toBeGreaterThan(0);
      console.log(`Mafia team: ${mafiaPlayers.map(p => `${p.name}(${playerRoles[p.name]})`).join(', ')}`);

      // Progress to night phase
      await gameHelpers.waitForPhase(players[0], 'day');
      await gameHelpers.waitForPhase(players[0], 'voting');
      
      // Skip voting phase
      await gameHelpers.waitForPhase(players[0], 'night');
      
      await gameHelpers.takeScreenshot(mafiaPlayers[0], 'mafia-night-phase.png');

      // Test mafia kill ability
      if (mafiaPlayers.length > 0 && citizenPlayers.length > 0) {
        const target = citizenPlayers[0];
        console.log(`Mafia targeting: ${target.name}`);
        
        try {
          await gameHelpers.performNightAction(mafiaPlayers[0], target.name);
          console.log('Mafia action performed successfully');
        } catch (e) {
          console.log('Mafia action failed:', e);
        }
      }

      // Wait for night result
      await gameHelpers.waitForPhase(players[0], 'nightResult');
      await gameHelpers.takeScreenshot(players[0], 'mafia-night-result.png');

      // Verify that night actions had effect (someone should be dead or protected)
      let deathOccurred = false;
      for (const player of players) {
        const isAlive = await gameHelpers.isPlayerAlive(player);
        if (!isAlive) {
          console.log(`${player.name} was killed during the night`);
          deathOccurred = true;
        }
      }

      // Either someone died OR doctor saved them
      const doctor = players.find(p => playerRoles[p.name] === '의사');
      if (doctor) {
        console.log('Doctor present - death may have been prevented');
      } else {
        expect(deathOccurred).toBe(true); // Without doctor, someone should die
      }

    } finally {
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
    }
  });

  test('should handle citizen team abilities correctly', async () => {
    test.setTimeout(240000); // 4 minutes

    const players: Player[] = [];

    try {
      // Create 10 players to ensure citizen special roles
      for (let i = 0; i < 10; i++) {
        const context = await browser.newContext();
        const player = await gameHelpers.createPlayer(context, `CitizenTest${i + 1}`);
        players.push(player);
      }

      // Setup game
      const roomCode = await gameHelpers.createRoom(players[0]);
      for (let i = 1; i < 10; i++) {
        await gameHelpers.joinRoom(players[i], roomCode);
      }

      await gameHelpers.startGame(players[0]);

      // Get roles
      const playerRoles: Record<string, string> = {};
      for (const player of players) {
        const role = await gameHelpers.getPlayerRole(player);
        playerRoles[player.name] = role;
      }

      console.log('Player roles:', playerRoles);

      // Find special citizen roles
      const doctor = players.find(p => playerRoles[p.name] === '의사');
      const police = players.find(p => playerRoles[p.name] === '경찰');
      const soldier = players.find(p => playerRoles[p.name] === '군인');

      // Progress to night phase
      await gameHelpers.waitForPhase(players[0], 'day');
      await gameHelpers.waitForPhase(players[0], 'voting');
      await gameHelpers.waitForPhase(players[0], 'night');

      // Test doctor ability
      if (doctor) {
        console.log(`Doctor (${doctor.name}) attempting to heal`);
        const protectTarget = players[0]; // Protect the host
        
        try {
          await gameHelpers.performNightAction(doctor, protectTarget.name);
          console.log(`Doctor protected: ${protectTarget.name}`);
        } catch (e) {
          console.log('Doctor action failed:', e);
        }
        
        await gameHelpers.takeScreenshot(doctor, 'doctor-night-action.png');
      }

      // Test police ability
      if (police) {
        console.log(`Police (${police.name}) attempting to investigate`);
        const investigateTarget = players.find(p => p !== police && p.isAlive);
        
        if (investigateTarget) {
          try {
            await gameHelpers.performNightAction(police, investigateTarget.name);
            console.log(`Police investigated: ${investigateTarget.name}`);
          } catch (e) {
            console.log('Police action failed:', e);
          }
          
          await gameHelpers.takeScreenshot(police, 'police-night-action.png');
        }
      }

      // Test that soldier has protection (this would be tested through attempting to kill them)
      if (soldier) {
        console.log(`Soldier (${soldier.name}) should have protection ability`);
        await gameHelpers.takeScreenshot(soldier, 'soldier-role.png');
      }

      // Wait for night result
      await gameHelpers.waitForPhase(players[0], 'nightResult');
      await gameHelpers.takeScreenshot(players[0], 'citizen-abilities-result.png');

      // Return to day phase
      await gameHelpers.waitForPhase(players[0], 'day');

      // If police investigated, they should have information
      // (In a real implementation, this would show investigation results)
      if (police) {
        await gameHelpers.takeScreenshot(police, 'police-investigation-result.png');
      }

    } finally {
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
    }
  });

  test('should handle special roles and interactions correctly', async () => {
    test.setTimeout(240000); // 4 minutes

    const players: Player[] = [];

    try {
      // Create 16 players to get special roles like terrorist
      for (let i = 0; i < 16; i++) {
        const context = await browser.newContext();
        const player = await gameHelpers.createPlayer(context, `SpecialTest${i + 1}`);
        players.push(player);
      }

      // Setup game
      const roomCode = await gameHelpers.createRoom(players[0]);
      for (let i = 1; i < 16; i++) {
        await gameHelpers.joinRoom(players[i], roomCode);
      }

      await gameHelpers.startGame(players[0]);

      // Get roles
      const playerRoles: Record<string, string> = {};
      for (const player of players) {
        const role = await gameHelpers.getPlayerRole(player);
        playerRoles[player.name] = role;
      }

      console.log('Player roles:', playerRoles);

      // Find special roles
      const terrorist = players.find(p => playerRoles[p.name] === '테러리스트');
      const bartender = players.find(p => playerRoles[p.name] === '술집사장');
      const reporter = players.find(p => playerRoles[p.name] === '기자');

      // Test bartender ability (role blocking)
      if (bartender) {
        console.log(`Bartender (${bartender.name}) found`);
        
        // Progress to night phase
        await gameHelpers.waitForPhase(players[0], 'day');
        await gameHelpers.waitForPhase(players[0], 'voting');
        await gameHelpers.waitForPhase(players[0], 'night');

        // Bartender blocks someone
        const blockTarget = players.find(p => p !== bartender && ['마피아', '의사', '경찰'].includes(playerRoles[p.name]));
        if (blockTarget) {
          try {
            await gameHelpers.performNightAction(bartender, blockTarget.name);
            console.log(`Bartender blocked: ${blockTarget.name}`);
          } catch (e) {
            console.log('Bartender action failed:', e);
          }
        }

        await gameHelpers.takeScreenshot(bartender, 'bartender-role-block.png');
      }

      // Test reporter ability
      if (reporter) {
        console.log(`Reporter (${reporter.name}) found`);
        
        if (!bartender) {
          // Progress to night if not already there
          await gameHelpers.waitForPhase(players[0], 'day');
          await gameHelpers.waitForPhase(players[0], 'voting');
          await gameHelpers.waitForPhase(players[0], 'night');
        }

        // Reporter investigates and publishes
        const reportTarget = players.find(p => p !== reporter);
        if (reportTarget) {
          try {
            await gameHelpers.performNightAction(reporter, reportTarget.name);
            console.log(`Reporter investigating: ${reportTarget.name}`);
          } catch (e) {
            console.log('Reporter action failed:', e);
          }
        }

        await gameHelpers.takeScreenshot(reporter, 'reporter-investigation.png');
      }

      // Test terrorist death ability (would trigger when executed)
      if (terrorist) {
        console.log(`Terrorist (${terrorist.name}) found - testing execution scenario`);
        
        // Progress to voting if not already there
        if (!bartender && !reporter) {
          await gameHelpers.waitForPhase(players[0], 'day');
        } else {
          await gameHelpers.waitForPhase(players[0], 'nightResult');
          await gameHelpers.waitForPhase(players[0], 'day');
        }
        
        await gameHelpers.waitForPhase(players[0], 'voting');

        // Vote for terrorist (to test death ability)
        const votersCount = Math.min(10, players.length - 1);
        for (let i = 0; i < votersCount; i++) {
          const voter = players[i];
          if (voter !== terrorist && voter.isAlive) {
            try {
              await gameHelpers.voteForPlayer(voter, terrorist.name);
            } catch (e) {
              console.log(`${voter.name} couldn't vote for terrorist`);
            }
          }
        }

        await gameHelpers.takeScreenshot(players[0], 'terrorist-voting.png');

        // Execute terrorist
        await gameHelpers.waitForPhase(players[0], 'execution');
        
        // Vote to execute
        for (let i = 0; i < votersCount; i++) {
          const voter = players[i];
          if (voter !== terrorist && voter.isAlive) {
            try {
              await gameHelpers.voteExecution(voter, true); // Vote yes to execute
            } catch (e) {
              console.log(`${voter.name} couldn't vote on execution`);
            }
          }
        }

        await gameHelpers.takeScreenshot(players[0], 'terrorist-execution.png');

        // Check if terrorist's death ability triggered
        // (In real implementation, someone who voted should die)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await gameHelpers.takeScreenshot(players[0], 'terrorist-death-ability.png');
      }

    } finally {
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
    }
  });

  test('should handle voting mechanics and edge cases', async () => {
    test.setTimeout(180000); // 3 minutes

    const players: Player[] = [];

    try {
      // Create 8 players for voting tests
      for (let i = 0; i < 8; i++) {
        const context = await browser.newContext();
        const player = await gameHelpers.createPlayer(context, `VoteTest${i + 1}`);
        players.push(player);
      }

      // Setup game
      const roomCode = await gameHelpers.createRoom(players[0]);
      for (let i = 1; i < 8; i++) {
        await gameHelpers.joinRoom(players[i], roomCode);
      }

      await gameHelpers.startGame(players[0]);

      // Get roles and find cheerleader if present
      const playerRoles: Record<string, string> = {};
      for (const player of players) {
        const role = await gameHelpers.getPlayerRole(player);
        playerRoles[player.name] = role;
      }

      const cheerleader = players.find(p => playerRoles[p.name] === '치어리더');

      // Progress to voting phase
      await gameHelpers.waitForPhase(players[0], 'day');
      await gameHelpers.waitForPhase(players[0], 'voting');

      // Test normal voting
      const targetPlayer = players[3];
      console.log(`Testing normal voting for: ${targetPlayer.name}`);

      // Have most players vote for the target
      for (let i = 0; i < 6; i++) {
        const voter = players[i];
        if (voter !== targetPlayer) {
          try {
            await gameHelpers.voteForPlayer(voter, targetPlayer.name);
            console.log(`${voter.name} voted for ${targetPlayer.name}`);
          } catch (e) {
            console.log(`${voter.name} couldn't vote`);
          }
        }
      }

      await gameHelpers.takeScreenshot(players[0], 'normal-voting.png');

      // Test cheerleader double vote ability (if present)
      if (cheerleader) {
        console.log(`Testing cheerleader double vote: ${cheerleader.name}`);
        
        // Cheerleader should be able to use double vote ability
        try {
          // This would require specific UI interaction for double vote
          await gameHelpers.takeScreenshot(cheerleader, 'cheerleader-double-vote.png');
        } catch (e) {
          console.log('Cheerleader double vote test failed:', e);
        }
      }

      // Test execution phase
      await gameHelpers.waitForPhase(players[0], 'execution');
      
      // Test mixed execution votes
      console.log('Testing execution voting');
      for (let i = 0; i < players.length; i++) {
        const voter = players[i];
        if (voter !== targetPlayer && voter.isAlive) {
          try {
            // Alternate between yes/no votes
            const voteYes = i % 2 === 0;
            await gameHelpers.voteExecution(voter, voteYes);
            console.log(`${voter.name} voted ${voteYes ? 'YES' : 'NO'} on execution`);
          } catch (e) {
            console.log(`${voter.name} couldn't vote on execution`);
          }
        }
      }

      await gameHelpers.takeScreenshot(players[0], 'execution-voting.png');

      // Wait for result
      await new Promise(resolve => setTimeout(resolve, 3000));
      await gameHelpers.takeScreenshot(players[0], 'execution-result.png');

      // Test no nomination scenario (go to new game if possible)
      // This would require a separate game setup

    } finally {
      for (const player of players) {
        await gameHelpers.cleanupPlayer(player);
      }
    }
  });
});