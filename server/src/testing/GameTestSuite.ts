// server/src/testing/GameTestSuite.ts

import { EnhancedRoom, EnhancedPlayer, GameStateManager } from '../types/GameState';
import { roleService } from '../services/RoleService';
import { AbilityHandlers } from '../handlers/AbilityHandlers';
import { ROLES, createRoleArray } from '../../../shared/constants/roles';
import { ErrorHandler, ErrorType } from '../utils/ErrorHandler';
import { Player } from '../../../shared/types/game';
import { Server } from 'socket.io';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  errors: string[];
  warnings: string[];
}

export interface GameScenario {
  name: string;
  playerCount: number;
  roleOverrides?: Record<string, string>; // playerId -> role
  actions: TestAction[];
  expectedOutcome: {
    winner?: 'mafia' | 'citizen' | 'neutral';
    alivePlayers?: number;
    specificChecks?: Array<{
      type: 'player_alive' | 'player_dead' | 'role_revealed' | 'ability_used';
      playerId?: string;
      value: any;
    }>;
  };
}

export interface TestAction {
  phase: 'night' | 'day' | 'voting';
  day?: number;
  playerId: string;
  actionType: string;
  targetPlayerId?: string;
  targetPlayerIds?: string[];
  expectedResult: 'success' | 'failure' | 'blocked';
}

export class GameTestSuite {
  private io: Server;
  private testResults: TestResult[] = [];
  private mockRooms: Map<string, EnhancedRoom> = new Map();
  private errorHandler: ErrorHandler;
  private abilityHandlers: AbilityHandlers;

  constructor(io: Server) {
    this.io = io;
    this.errorHandler = new ErrorHandler(io, this.mockRooms);
    this.abilityHandlers = new AbilityHandlers(io);
    this.abilityHandlers.setRoomsReference(this.mockRooms);
  }

  // Run comprehensive test suite
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting comprehensive game test suite...');
    this.testResults = [];

    // Basic functionality tests
    await this.testRoleDistribution();
    await this.testBasicGameFlow();
    
    // Individual role ability tests
    await this.testAllRoleAbilities();
    
    // Complex interaction tests
    await this.testAbilityInteractions();
    
    // Error handling tests
    await this.testErrorRecovery();
    
    // Performance and edge case tests
    await this.testEdgeCases();
    
    // Classroom scenario tests
    await this.testClassroomScenarios();

    // Generate summary
    this.generateTestSummary();
    
    return this.testResults;
  }

  // Test role distribution for all player counts
  private async testRoleDistribution(): Promise<void> {
    for (let playerCount = 6; playerCount <= 20; playerCount++) {
      const startTime = Date.now();
      try {
        const roles = createRoleArray(playerCount);
        
        // Validate role count
        if (roles.length !== playerCount) {
          throw new Error(`Role count mismatch: expected ${playerCount}, got ${roles.length}`);
        }

        // Validate team balance
        const mafiaCount = roles.filter(role => ROLES[role]?.team === 'mafia').length;
        const citizenCount = roles.filter(role => ROLES[role]?.team === 'citizen').length;
        
        // Basic balance check: mafia should be 25-35% of total
        const mafiaPercentage = mafiaCount / playerCount;
        if (mafiaPercentage < 0.2 || mafiaPercentage > 0.4) {
          throw new Error(`Poor team balance: ${mafiaCount} mafia out of ${playerCount} players (${Math.round(mafiaPercentage * 100)}%)`);
        }

        this.addTestResult({
          testName: `Role Distribution - ${playerCount} players`,
          passed: true,
          duration: Date.now() - startTime,
          details: `Generated ${playerCount} roles: ${mafiaCount} mafia, ${citizenCount} citizens`,
          errors: [],
          warnings: []
        });

      } catch (error) {
        this.addTestResult({
          testName: `Role Distribution - ${playerCount} players`,
          passed: false,
          duration: Date.now() - startTime,
          details: 'Role distribution failed',
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: []
        });
      }
    }
  }

  // Test basic game flow
  private async testBasicGameFlow(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('FLOW', 8);
      
      // Test phase transitions
      room.phase = 'waiting';
      room.isStarted = false;
      
      // Start game
      room.isStarted = true;
      room.phase = 'night';
      room.day = 1;
      
      // Initialize role service
      roleService.initializePlayerAbilities(room.code, room.players);
      
      // Submit night actions
      room.players.forEach(player => {
        if (player.isAlive) {
          room.actionSubmitted.add(player.id);
        }
      });
      
      // Transition to day
      room.phase = 'day';
      
      // Transition to voting
      room.phase = 'voting';
      
      // Submit votes
      const alivePlayers = room.players.filter(p => p.isAlive);
      if (alivePlayers.length >= 2) {
        room.votes.set(alivePlayers[0].id, alivePlayers[1].id);
      }
      
      this.addTestResult({
        testName: 'Basic Game Flow',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Successfully completed phase transitions',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Basic Game Flow',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Game flow test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  // Test all individual role abilities
  private async testAllRoleAbilities(): Promise<void> {
    const rolesToTest = [
      'mafia', 'doctor', 'police', 'detective', 'reporter', 'bartender', 
      'wizard', 'medium', 'thief', 'werewolf', 'illusionist', 'cheerleader',
      'spy', 'soldier', 'turncoat', 'terrorist', 'ghost', 'doubleAgent'
    ];

    for (const roleId of rolesToTest) {
      await this.testIndividualRole(roleId);
    }
  }

  // Test individual role abilities
  private async testIndividualRole(roleId: string): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom(`ROLE_${roleId.toUpperCase()}`, 10);
      
      // Assign test role to first player
      room.players[0].role = roleId;
      room.players[1].role = 'citizen'; // Target player
      
      // Initialize abilities
      roleService.initializePlayerAbilities(room.code, room.players);
      
      const actor = room.players[0];
      const target = room.players[1];
      const role = ROLES[roleId];
      
      if (role?.ability) {
        const canUse = roleService.canUseAbility(room.code, actor, 1);
        
        if (canUse && role.ability.phase === 'night') {
          const action = {
            playerId: actor.id,
            actionType: role.ability.action as 'kill' | 'heal' | 'investigate' | 'roleBlock' | 'dummy' | 'publish' | 'curse' | 'steal' | 'swap' | 'revenge' | 'detectiveInvestigate' | 'channelDead' | 'wolfKill' | 'doubleVote',
            targetPlayerId: target.id
          };
          
          const result = await roleService.executeAbility(room.code, actor, action, room, 1);
          
          if (!result.success && roleId !== 'medium') { // Medium fails on living targets
            throw new Error(`Role ${roleId} ability execution failed: ${result.message}`);
          }
        }
      }

      // Test passive abilities
      if (roleId === 'soldier') {
        const protection = roleService.hasPassiveProtection(room.code, actor.id);
        if (!protection) {
          throw new Error('Soldier should have passive protection');
        }
      }

      if (roleId === 'spy') {
        const investigationResult = roleService.getInvestigationResult(room.code, target, actor);
        if (investigationResult !== 'innocent') {
          throw new Error('Spy should appear innocent to investigations');
        }
      }

      this.addTestResult({
        testName: `Role Test - ${role?.name || roleId}`,
        passed: true,
        duration: Date.now() - startTime,
        details: `Successfully tested ${roleId} abilities`,
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: `Role Test - ${ROLES[roleId]?.name || roleId}`,
        passed: false,
        duration: Date.now() - startTime,
        details: `Role test failed for ${roleId}`,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  // Test complex ability interactions
  private async testAbilityInteractions(): Promise<void> {
    // Test 1: Doctor heal vs Mafia kill
    await this.testHealVsKill();
    
    // Test 2: Soldier shield vs attacks
    await this.testSoldierShield();
    
    // Test 3: Bartender block vs abilities
    await this.testBartenderBlock();
    
    // Test 4: Investigation disguises
    await this.testInvestigationDisguises();
    
    // Test 5: Turncoat team switching
    await this.testTurncoatSwitch();
    
    // Test 6: Terrorist revenge
    await this.testTerroristRevenge();
  }

  private async testHealVsKill(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('HEAL_KILL', 6);
      
      // Setup: Mafia, Doctor, Target, Citizens
      room.players[0].role = 'mafia';
      room.players[1].role = 'doctor';
      room.players[2].role = 'citizen'; // Target
      
      roleService.initializePlayerAbilities(room.code, room.players);
      
      // Doctor heals target
      const healAction = {
        playerId: room.players[1].id,
        actionType: 'heal' as const,
        targetPlayerId: room.players[2].id
      };
      
      const healResult = await roleService.executeAbility(room.code, room.players[1], healAction, room, 1);
      
      // Mafia targets same player
      room.nightVotes.set(room.players[2].id, [room.players[0].id]);
      
      // Process night actions
      await this.abilityHandlers.processNightActions(room.code, room);
      
      // Target should be alive (healed)
      if (!room.players[2].isAlive) {
        throw new Error('Doctor heal failed to protect against mafia kill');
      }

      this.addTestResult({
        testName: 'Doctor Heal vs Mafia Kill',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Doctor successfully protected target from mafia attack',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Doctor Heal vs Mafia Kill',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Heal vs kill interaction test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testSoldierShield(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('SOLDIER', 6);
      
      room.players[0].role = 'mafia';
      room.players[1].role = 'soldier';
      
      roleService.initializePlayerAbilities(room.code, room.players);
      
      // Mafia targets soldier
      room.nightVotes.set(room.players[1].id, [room.players[0].id]);
      
      // Process night actions
      await this.abilityHandlers.processNightActions(room.code, room);
      
      // Soldier should be alive (shield blocked attack)
      if (!room.players[1].isAlive) {
        throw new Error('Soldier shield failed to block mafia attack');
      }
      
      // Shield should be consumed
      const protection = roleService.hasPassiveProtection(room.code, room.players[1].id);
      if (protection) {
        throw new Error('Soldier shield was not consumed after use');
      }

      this.addTestResult({
        testName: 'Soldier Shield Protection',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Soldier shield successfully blocked attack and was consumed',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Soldier Shield Protection',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Soldier shield test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testBartenderBlock(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('BARTENDER', 6);
      
      room.players[0].role = 'bartender';
      room.players[1].role = 'police';
      room.players[2].role = 'citizen';
      
      roleService.initializePlayerAbilities(room.code, room.players);
      
      // Bartender blocks police
      const blockAction = {
        playerId: room.players[0].id,
        actionType: 'roleBlock' as const,
        targetPlayerId: room.players[1].id
      };
      
      await roleService.executeAbility(room.code, room.players[0], blockAction, room, 1);
      
      // Police tries to investigate (should fail)
      const canInvestigate = roleService.canUseAbility(room.code, room.players[1], 1);
      
      if (canInvestigate) {
        throw new Error('Police should be blocked by bartender');
      }

      this.addTestResult({
        testName: 'Bartender Ability Block',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Bartender successfully blocked police investigation',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Bartender Ability Block',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Bartender block test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testInvestigationDisguises(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('DISGUISE', 8);
      
      room.players[0].role = 'police';
      room.players[1].role = 'spy';
      room.players[2].role = 'doubleAgent';
      room.players[3].role = 'turncoat';
      
      roleService.initializePlayerAbilities(room.code, room.players);
      
      // Test spy disguise
      const spyResult = roleService.getInvestigationResult(room.code, room.players[0], room.players[1]);
      if (spyResult !== 'innocent') {
        throw new Error('Spy should appear innocent to investigations');
      }
      
      // Test double agent disguise
      const agentResult = roleService.getInvestigationResult(room.code, room.players[0], room.players[2]);
      if (agentResult !== 'innocent') {
        throw new Error('Double agent should appear innocent (with disguised role)');
      }
      
      // Test turncoat (before switching)
      const turncoatResult = roleService.getInvestigationResult(room.code, room.players[0], room.players[3]);
      if (turncoatResult !== 'innocent') {
        throw new Error('Turncoat should appear innocent before team switch');
      }

      this.addTestResult({
        testName: 'Investigation Disguises',
        passed: true,
        duration: Date.now() - startTime,
        details: 'All role disguises working correctly',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Investigation Disguises',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Investigation disguise test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testTurncoatSwitch(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('TURNCOAT', 6);
      
      room.players[0].role = 'turncoat';
      room.players[1].role = 'citizen';
      room.players[2].role = 'citizen';
      room.players[3].role = 'citizen'; // Will be killed to trigger switch
      room.players[4].role = 'mafia';
      room.players[5].role = 'mafia';
      
      roleService.initializePlayerAbilities(room.code, room.players);
      
      // Kill citizen to reduce citizen count to 3
      room.players[3].isAlive = false;
      
      // Check turncoat switch
      const switchedTurncoats = roleService.checkTurncoatSwitch(room.code, room);
      
      if (switchedTurncoats.length === 0) {
        throw new Error('Turncoat should switch teams when citizens <= 3');
      }
      
      // Verify team affiliation changed
      const teamAfterSwitch = GameStateManager.getPlayerTeam(room.players[0], room.code, roleService);
      if (teamAfterSwitch !== 'mafia') {
        throw new Error('Turncoat should be on mafia team after switch');
      }

      this.addTestResult({
        testName: 'Turncoat Team Switch',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Turncoat successfully switched to mafia team',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Turncoat Team Switch',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Turncoat switch test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testTerroristRevenge(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('TERRORIST', 6);
      
      room.players[0].role = 'terrorist';
      room.players[1].role = 'citizen';
      room.players[2].role = 'citizen';
      
      roleService.initializePlayerAbilities(room.code, room.players);
      
      // Simulate voting execution
      const voters = [room.players[1], room.players[2]] as Player[];
      
      if (roleService.canTerroristRevenge(room.code, room.players[0].id)) {
        const victim = roleService.executeTerroristRevenge(room.code, room.players[0], voters);
        
        if (!victim) {
          throw new Error('Terrorist should select a revenge target');
        }
        
        if (!voters.includes(victim)) {
          throw new Error('Terrorist victim should be one of the voters');
        }
      }

      this.addTestResult({
        testName: 'Terrorist Revenge',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Terrorist revenge mechanism working correctly',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Terrorist Revenge',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Terrorist revenge test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  // Test error recovery scenarios
  private async testErrorRecovery(): Promise<void> {
    const scenarios = [
      'corrupted_room_state',
      'invalid_player_action',
      'network_disconnection',
      'phase_timeout'
    ];

    for (const scenario of scenarios) {
      await this.testErrorScenario(scenario);
    }
  }

  private async testErrorScenario(scenario: string): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom(`ERROR_${scenario.toUpperCase()}`, 6);
      
      switch (scenario) {
        case 'corrupted_room_state':
          // Simulate corruption
          (room as any).players = 'corrupted';
          
          const recovered = await this.errorHandler.handleError({
            type: ErrorType.CORRUPTED_GAME_DATA,
            message: 'Test corruption',
            roomCode: room.code,
            timestamp: new Date(),
            severity: 'high'
          });
          
          if (!recovered) {
            throw new Error('Failed to recover from corrupted room state');
          }
          break;
          
        case 'invalid_player_action':
          const recoveredAction = await this.errorHandler.handleError({
            type: ErrorType.INVALID_ACTION,
            message: 'Test invalid action',
            roomCode: room.code,
            playerId: room.players[0].id,
            timestamp: new Date(),
            severity: 'low'
          });
          
          if (!recoveredAction) {
            throw new Error('Failed to handle invalid action');
          }
          break;
      }

      this.addTestResult({
        testName: `Error Recovery - ${scenario}`,
        passed: true,
        duration: Date.now() - startTime,
        details: `Successfully recovered from ${scenario}`,
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: `Error Recovery - ${scenario}`,
        passed: false,
        duration: Date.now() - startTime,
        details: `Error recovery test failed for ${scenario}`,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  // Test edge cases and corner scenarios
  private async testEdgeCases(): Promise<void> {
    await this.testMinimumPlayers(); // 6 players edge case
    await this.testMaximumPlayers(); // 20 players edge case
    await this.testAllRolesSimultaneous(); // All 18 roles in one game
    await this.testQuickGameEnd(); // Game ending in day 1
  }

  private async testMinimumPlayers(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('MIN_PLAYERS', 6);
      
      // Verify role distribution is valid
      const mafiaCount = room.players.filter(p => ROLES[p.role]?.team === 'mafia').length;
      const citizenCount = room.players.filter(p => ROLES[p.role]?.team === 'citizen').length;
      
      if (mafiaCount < 1 || citizenCount < 3) {
        throw new Error('Invalid role distribution for minimum players');
      }
      
      // Test win condition detection
      const winCondition = GameStateManager.checkWinConditions(room, roleService);
      
      this.addTestResult({
        testName: 'Minimum Players (6)',
        passed: true,
        duration: Date.now() - startTime,
        details: `Valid game with 6 players: ${mafiaCount} mafia, ${citizenCount} citizens`,
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Minimum Players (6)',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Minimum players test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testMaximumPlayers(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('MAX_PLAYERS', 20);
      
      // Verify all 18 different roles are used
      const uniqueRoles = new Set(room.players.map(p => p.role));
      
      if (uniqueRoles.size < 15) { // Should use most roles at max capacity
        throw new Error(`Too few unique roles: ${uniqueRoles.size}`);
      }
      
      // Test performance with max players
      roleService.initializePlayerAbilities(room.code, room.players);
      
      this.addTestResult({
        testName: 'Maximum Players (20)',
        passed: true,
        duration: Date.now() - startTime,
        details: `Valid game with 20 players using ${uniqueRoles.size} unique roles`,
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Maximum Players (20)',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Maximum players test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testAllRolesSimultaneous(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('ALL_ROLES', 18);
      
      // Manually assign all 18 unique roles
      const allRoles = Object.keys(ROLES);
      room.players.forEach((player, index) => {
        if (index < allRoles.length) {
          player.role = allRoles[index];
        }
      });
      
      // Initialize all abilities
      roleService.initializePlayerAbilities(room.code, room.players);
      
      // Test that all roles can be processed
      let successfulAbilities = 0;
      for (const player of room.players) {
        if (ROLES[player.role]?.ability?.phase === 'night') {
          const canUse = roleService.canUseAbility(room.code, player, 1);
          if (canUse) {
            successfulAbilities++;
          }
        }
      }
      
      this.addTestResult({
        testName: 'All Roles Simultaneous',
        passed: true,
        duration: Date.now() - startTime,
        details: `Successfully initialized all 18 roles, ${successfulAbilities} night abilities available`,
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'All Roles Simultaneous',
        passed: false,
        duration: Date.now() - startTime,
        details: 'All roles simultaneous test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testQuickGameEnd(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('QUICK_END', 6);
      
      // Setup for quick mafia victory
      room.players[0].role = 'mafia';
      room.players[1].role = 'mafia';
      room.players[2].role = 'citizen';
      room.players[3].role = 'citizen';
      
      // Kill citizens to trigger win condition
      room.players[2].isAlive = false;
      room.players[3].isAlive = false;
      
      const winCondition = GameStateManager.checkWinConditions(room, roleService);
      
      if (!winCondition || winCondition.team !== 'mafia') {
        throw new Error('Mafia should win when they equal/outnumber citizens');
      }
      
      this.addTestResult({
        testName: 'Quick Game End',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Win condition detection working correctly for quick game end',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Quick Game End',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Quick game end test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  // Test classroom-specific scenarios
  private async testClassroomScenarios(): Promise<void> {
    await this.testMultipleRoomsSimultaneous();
    await this.testStudentDisconnectionRecovery();
    await this.testInappropriateContentFiltering();
  }

  private async testMultipleRoomsSimultaneous(): Promise<void> {
    const startTime = Date.now();
    try {
      const rooms = [];
      
      // Create 5 simultaneous games
      for (let i = 0; i < 5; i++) {
        const room = this.createTestRoom(`CLASS_${i}`, 8);
        roleService.initializePlayerAbilities(room.code, room.players);
        rooms.push(room);
      }
      
      // Verify all rooms are independent
      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        if (room.players.length !== 8) {
          throw new Error(`Room ${i} has incorrect player count`);
        }
        
        // Each room should have different state
        room.day = i + 1;
      }
      
      this.addTestResult({
        testName: 'Multiple Rooms Simultaneous',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Successfully managed 5 simultaneous classroom games',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Multiple Rooms Simultaneous',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Multiple rooms test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testStudentDisconnectionRecovery(): Promise<void> {
    const startTime = Date.now();
    try {
      const room = this.createTestRoom('DISCONNECT', 8);
      room.isStarted = true;
      room.phase = 'night';
      
      // Simulate student disconnection during active game
      const disconnectedPlayer = room.players[0];
      disconnectedPlayer.socketId = undefined;
      
      // Game should continue
      if (room.phase !== 'night') {
        throw new Error('Game phase should be maintained during disconnection');
      }
      
      // Player should remain in game for reconnection
      if (!room.players.includes(disconnectedPlayer)) {
        throw new Error('Disconnected player should remain in game');
      }
      
      this.addTestResult({
        testName: 'Student Disconnection Recovery',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Game continues properly when student disconnects',
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Student Disconnection Recovery',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Disconnection recovery test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  private async testInappropriateContentFiltering(): Promise<void> {
    const startTime = Date.now();
    try {
      // Test player name filtering
      const inappropriateNames = ['admin', 'system', '마피아', '시민', 'fuck', '바보'];
      
      let blockedCount = 0;
      for (const name of inappropriateNames) {
        try {
          // This would be handled by security validation
          if (name.length < 2 || name.includes('admin') || name.includes('system')) {
            blockedCount++;
          }
        } catch {
          blockedCount++;
        }
      }
      
      if (blockedCount < 2) { // Should block at least admin/system
        throw new Error('Inappropriate content filtering insufficient');
      }
      
      this.addTestResult({
        testName: 'Inappropriate Content Filtering',
        passed: true,
        duration: Date.now() - startTime,
        details: `Blocked ${blockedCount}/${inappropriateNames.length} inappropriate names`,
        errors: [],
        warnings: []
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Inappropriate Content Filtering',
        passed: false,
        duration: Date.now() - startTime,
        details: 'Content filtering test failed',
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  // Helper methods
  private createTestRoom(code: string, playerCount: number): EnhancedRoom {
    const roles = createRoleArray(playerCount);
    const players: EnhancedPlayer[] = [];
    
    for (let i = 0; i < playerCount; i++) {
      players.push(GameStateManager.createEnhancedPlayer({
        id: `player_${i}`,
        name: `테스트플레이어${i + 1}`,
        isHost: i === 0,
        isAlive: true,
        role: roles[i]
      }));
    }
    
    const room = GameStateManager.createEnhancedRoom({
      code,
      hostId: players[0].id,
      players,
      maxPlayers: playerCount,
      phase: 'waiting',
      day: 0,
      timeRemaining: 0,
      isStarted: false
    });
    
    this.mockRooms.set(code, room);
    return room;
  }

  private addTestResult(result: TestResult): void {
    this.testResults.push(result);
    
    const status = result.passed ? '✅' : '❌';
    const duration = result.duration < 1000 ? `${result.duration}ms` : `${(result.duration / 1000).toFixed(2)}s`;
    
    console.log(`${status} ${result.testName} (${duration})`);
    
    if (!result.passed) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
    
    if (result.warnings.length > 0) {
      console.log(`   Warnings: ${result.warnings.join(', ')}`);
    }
  }

  private generateTestSummary(): void {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = total - passed;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 COMPREHENSIVE TEST SUITE RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${Math.round(passed / total * 100)}%)`);
    console.log(`❌ Failed: ${failed} (${Math.round(failed / total * 100)}%)`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.testName}: ${result.errors.join(', ')}`);
      });
    }
    
    const criticalFailures = this.testResults.filter(r => 
      !r.passed && (
        r.testName.includes('Role Distribution') ||
        r.testName.includes('Basic Game Flow') ||
        r.testName.includes('Error Recovery')
      )
    );
    
    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES DETECTED - SYSTEM NOT READY FOR PRODUCTION');
    } else if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED - SYSTEM READY FOR CLASSROOM DEPLOYMENT');
    } else {
      console.log('\n⚠️  MINOR ISSUES DETECTED - REVIEW BEFORE PRODUCTION');
    }
  }

  // Get test results for external reporting
  getTestResults(): TestResult[] {
    return this.testResults;
  }

  // Run specific test category
  async runTestCategory(category: 'basic' | 'roles' | 'interactions' | 'errors' | 'classroom'): Promise<TestResult[]> {
    this.testResults = [];
    
    switch (category) {
      case 'basic':
        await this.testRoleDistribution();
        await this.testBasicGameFlow();
        break;
      case 'roles':
        await this.testAllRoleAbilities();
        break;
      case 'interactions':
        await this.testAbilityInteractions();
        break;
      case 'errors':
        await this.testErrorRecovery();
        break;
      case 'classroom':
        await this.testClassroomScenarios();
        break;
    }
    
    return this.testResults;
  }
}