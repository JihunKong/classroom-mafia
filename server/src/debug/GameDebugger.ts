// server/src/debug/GameDebugger.ts

import { Room, Player } from '../shared/types/game';
import { createRoleArray, ROLES } from '../shared/constants/roles';
import { EnhancedRoom, GameStateManager } from '../types/GameState';
import { roleService } from '../services/RoleService';

export interface DebugScenario {
  name: string;
  playerCount: number;
  description: string;
  steps: DebugStep[];
  expectedOutcome?: string;
}

export interface DebugStep {
  phase: 'day' | 'night' | 'voting';
  actions: DebugAction[];
  expectedState?: Partial<DebugExpectedState>;
}

export interface DebugAction {
  playerId: string;
  actionType: string;
  targetId?: string;
  targetIds?: string[];
}

export interface DebugExpectedState {
  alivePlayers: string[];
  deadPlayers: string[];
  roleReveals?: Record<string, string>;
}

export class GameDebugger {
  private scenarios: Map<string, DebugScenario> = new Map();

  constructor() {
    this.initializeScenarios();
  }

  private initializeScenarios() {
    // 시나리오 1: 의사가 자신을 치료하는 경우
    this.scenarios.set('doctor-self-heal', {
      name: '의사 자가 치료',
      playerCount: 6,
      description: '의사가 마피아의 공격 대상이 되었을 때 자신을 치료하는 시나리오',
      steps: [
        {
          phase: 'night',
          actions: [
            { playerId: 'mafia1', actionType: 'kill', targetId: 'doctor1' },
            { playerId: 'doctor1', actionType: 'heal', targetId: 'doctor1' }
          ],
          expectedState: {
            alivePlayers: ['mafia1', 'citizen1', 'citizen2', 'citizen3', 'citizen4', 'doctor1'],
            deadPlayers: []
          }
        }
      ],
      expectedOutcome: '의사가 자신을 치료하여 생존'
    });

    // 시나리오 2: 스파이가 마피아 투표 확인
    this.scenarios.set('spy-mafia-vote', {
      name: '스파이 마피아 투표 참여',
      playerCount: 11,
      description: '스파이가 마피아 투표에 참여하고 정보를 확인하는 시나리오',
      steps: [
        {
          phase: 'night',
          actions: [
            { playerId: 'mafia1', actionType: 'kill', targetId: 'citizen1' },
            { playerId: 'mafia2', actionType: 'kill', targetId: 'citizen1' },
            { playerId: 'spy1', actionType: 'kill', targetId: 'citizen1' }
          ],
          expectedState: {
            alivePlayers: ['mafia1', 'mafia2', 'spy1', 'citizen2', 'citizen3', 'citizen4', 'citizen5', 'doctor1', 'police1', 'soldier1'],
            deadPlayers: ['citizen1']
          }
        }
      ],
      expectedOutcome: '스파이가 마피아 투표에 참여하여 citizen1 제거'
    });

    // 시나리오 3: 기자 발표
    this.scenarios.set('reporter-publish', {
      name: '기자 역할 공개',
      playerCount: 12,
      description: '기자가 밤에 조사한 정보를 다음날 낮에 공개하는 시나리오',
      steps: [
        {
          phase: 'night',
          actions: [
            { playerId: 'reporter1', actionType: 'publish', targetId: 'mafia1' }
          ]
        },
        {
          phase: 'day',
          actions: [],
          expectedState: {
            roleReveals: { 'mafia1': 'mafia' }
          }
        }
      ],
      expectedOutcome: '기자가 mafia1의 역할을 공개'
    });

    // 시나리오 4: 복잡한 16명 게임
    this.scenarios.set('complex-16-player', {
      name: '16명 복잡한 게임',
      playerCount: 16,
      description: '여러 특수 역할이 동시에 행동하는 복잡한 시나리오',
      steps: [
        {
          phase: 'night',
          actions: [
            { playerId: 'mafia1', actionType: 'kill', targetId: 'doctor1' },
            { playerId: 'mafia2', actionType: 'kill', targetId: 'doctor1' },
            { playerId: 'mafia3', actionType: 'kill', targetId: 'doctor1' },
            { playerId: 'spy1', actionType: 'kill', targetId: 'doctor1' },
            { playerId: 'doctor1', actionType: 'heal', targetId: 'doctor1' },
            { playerId: 'police1', actionType: 'investigate', targetId: 'spy1' },
            { playerId: 'reporter1', actionType: 'publish', targetId: 'mafia2' },
            { playerId: 'bartender1', actionType: 'roleBlock', targetId: 'terrorist1' }
          ],
          expectedState: {
            alivePlayers: ['mafia1', 'mafia2', 'mafia3', 'spy1', 'citizen1', 'citizen2', 'citizen3', 'citizen4', 'citizen5', 'citizen6', 'doctor1', 'police1', 'soldier1', 'reporter1', 'bartender1', 'terrorist1'],
            deadPlayers: []
          }
        }
      ],
      expectedOutcome: '의사가 자신을 치료하여 생존, 경찰이 스파이를 무고한 시민으로 확인'
    });
  }

  async runScenario(scenarioId: string): Promise<DebugResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    console.log(`Running scenario: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`Player count: ${scenario.playerCount}`);

    // Create mock game room
    const room = this.createMockRoom(scenario.playerCount);
    const results: StepResult[] = [];

    // Execute each step
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      console.log(`\nExecuting step ${i + 1} - Phase: ${step.phase}`);

      const stepResult = await this.executeStep(room, step);
      results.push(stepResult);

      if (!stepResult.success) {
        console.error(`Step ${i + 1} failed: ${stepResult.error}`);
        break;
      }
    }

    // Validate final outcome
    const success = results.every(r => r.success);
    
    return {
      scenarioId,
      success,
      results,
      finalState: this.getRoomState(room),
      message: success ? scenario.expectedOutcome || 'Scenario completed successfully' : 'Scenario failed'
    };
  }

  private createMockRoom(playerCount: number): EnhancedRoom {
    const roles = createRoleArray(playerCount);
    const players: Player[] = [];

    // Create players with roles
    roles.forEach((role, index) => {
      const roleCountByType = roles.slice(0, index + 1).filter(r => r === role).length;
      const playerId = `${role}${roleCountByType}`;
      
      players.push({
        id: playerId,
        name: `Player_${playerId}`,
        role: role,
        isAlive: true,
        isHost: index === 0
      });
    });

    const baseRoom: Room = {
      code: 'DEBUG',
      hostId: players[0].id,
      players,
      maxPlayers: playerCount,
      phase: 'day',
      day: 1,
      timeRemaining: 0,
      isStarted: true,
      votes: {},
      nightActions: {},
      gameLog: []
    };

    const room = GameStateManager.createEnhancedRoom(baseRoom);
    
    // Initialize role abilities
    roleService.initializePlayerAbilities('DEBUG', players);

    // Log initial setup
    console.log('\nInitial player setup:');
    players.forEach(p => {
      const roleInfo = ROLES[p.role];
      console.log(`${p.id}: ${roleInfo.name} (${roleInfo.team})`);
    });

    return room;
  }

  private async executeStep(room: EnhancedRoom, step: DebugStep): Promise<StepResult> {
    try {
      // Set phase
      room.phase = step.phase;

      // Execute actions
      for (const action of step.actions) {
        await this.executeAction(room, action);
      }

      // Process phase results
      if (step.phase === 'night') {
        await this.processNightActions(room);
      }

      // Validate expected state
      if (step.expectedState) {
        const validation = this.validateState(room, step.expectedState);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async executeAction(room: EnhancedRoom, action: DebugAction) {
    const actor = room.players.find(p => p.id === action.playerId);
    if (!actor || !actor.isAlive) {
      throw new Error(`Actor ${action.playerId} not found or dead`);
    }

    console.log(`${actor.id} (${ROLES[actor.role].name}) performs ${action.actionType} on ${action.targetId || 'N/A'}`);

    // Store night action
    if (room.phase === 'night') {
      room.nightActions.set(action.playerId, {
        playerId: action.playerId,
        actionType: action.actionType,
        targetPlayerId: action.targetId,
        targetPlayerIds: action.targetIds,
        timestamp: Date.now()
      });

      // Special handling for mafia/spy votes
      if ((actor.role === 'mafia' || actor.role === 'spy') && action.actionType === 'kill' && action.targetId) {
        const votes = room.nightVotes.get(action.targetId) || [];
        votes.push(action.playerId);
        room.nightVotes.set(action.targetId, votes);
      }
    }
  }

  private async processNightActions(room: EnhancedRoom) {
    console.log('\nProcessing night actions...');

    // Simple simulation of night action processing
    // In real game, this would use AbilityHandlers

    // Find mafia kill target
    let maxVotes = 0;
    let killTarget: string | null = null;

    room.nightVotes.forEach((voters, targetId) => {
      if (voters.length > maxVotes) {
        maxVotes = voters.length;
        killTarget = targetId;
      }
    });

    // Check for doctor heal
    let healTarget: string | null = null;
    room.nightActions.forEach((action, playerId) => {
      const player = room.players.find(p => p.id === playerId);
      if (player?.role === 'doctor' && action.actionType === 'heal') {
        healTarget = action.targetPlayerId || null;
      }
    });

    // Apply kill if not healed
    if (killTarget && killTarget !== healTarget) {
      const target = room.players.find(p => p.id === killTarget);
      if (target) {
        target.isAlive = false;
        console.log(`${target.id} was killed by mafia`);
      }
    } else if (killTarget === healTarget) {
      console.log(`${killTarget} was saved by doctor's heal`);
    }

    // Clear night state
    room.nightActions.clear();
    room.nightVotes.clear();
  }

  private validateState(room: EnhancedRoom, expected: Partial<DebugExpectedState>): { valid: boolean; error?: string } {
    // Validate alive players
    if (expected.alivePlayers) {
      const actualAlive = room.players.filter(p => p.isAlive).map(p => p.id).sort();
      const expectedAlive = expected.alivePlayers.sort();
      
      if (JSON.stringify(actualAlive) !== JSON.stringify(expectedAlive)) {
        return { 
          valid: false, 
          error: `Alive players mismatch. Expected: ${expectedAlive.join(', ')}, Actual: ${actualAlive.join(', ')}` 
        };
      }
    }

    // Validate dead players
    if (expected.deadPlayers) {
      const actualDead = room.players.filter(p => !p.isAlive).map(p => p.id).sort();
      const expectedDead = expected.deadPlayers.sort();
      
      if (JSON.stringify(actualDead) !== JSON.stringify(expectedDead)) {
        return { 
          valid: false, 
          error: `Dead players mismatch. Expected: ${expectedDead.join(', ')}, Actual: ${actualDead.join(', ')}` 
        };
      }
    }

    return { valid: true };
  }

  private getRoomState(room: EnhancedRoom): RoomState {
    return {
      phase: room.phase,
      day: room.day,
      alivePlayers: room.players.filter(p => p.isAlive).map(p => ({
        id: p.id,
        role: p.role,
        roleName: ROLES[p.role].name
      })),
      deadPlayers: room.players.filter(p => !p.isAlive).map(p => ({
        id: p.id,
        role: p.role,
        roleName: ROLES[p.role].name
      }))
    };
  }

  listScenarios(): ScenarioInfo[] {
    return Array.from(this.scenarios.entries()).map(([id, scenario]) => ({
      id,
      name: scenario.name,
      playerCount: scenario.playerCount,
      description: scenario.description
    }));
  }
}

// Types
interface DebugResult {
  scenarioId: string;
  success: boolean;
  results: StepResult[];
  finalState: RoomState;
  message: string;
}

interface StepResult {
  success: boolean;
  error?: string;
}

interface RoomState {
  phase: string;
  day: number;
  alivePlayers: Array<{ id: string; role: string; roleName: string }>;
  deadPlayers: Array<{ id: string; role: string; roleName: string }>;
}

interface ScenarioInfo {
  id: string;
  name: string;
  playerCount: number;
  description: string;
}

// Export singleton instance
export const gameDebugger = new GameDebugger();