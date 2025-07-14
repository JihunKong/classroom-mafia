// server/src/types/GameState.ts

import { GamePhase } from '../shared/constants/phases';
import { Player } from '../shared/types/game';
import { AbilityState } from '../services/RoleService';

// Re-export Player properties to ensure TypeScript recognizes them
export type { Player } from '../shared/types/game';

export interface EnhancedPlayer extends Player {
  // Explicitly include base Player properties
  id: string;
  name: string;
  isHost: boolean;
  isAlive: boolean;
  role: string;
  roleInfo?: {
    name: string;
    team: 'mafia' | 'citizen' | 'neutral';
    description: string;
    ability?: any;
  };
  socketId?: string;
  

  // Role-specific state
  abilityState?: AbilityState;
  
  // Voting and action tracking
  hasVoted: boolean;
  hasActed: boolean;
  
  // Status effects
  isCursed: boolean;
  isBlocked: boolean;
  isProtected: boolean;
  
  // Role history
  originalRole?: string; // For role swapping tracking
  investigatedBy: string[]; // Who has investigated this player
  
  // Usage tracking
  abilitiesUsed: number;
  lastActionDay?: number;
}

export interface EnhancedRoom {
  code: string;
  hostId: string;
  players: EnhancedPlayer[];
  maxPlayers: number;
  
  // Game phase management
  phase: GamePhase;
  day: number;
  timeRemaining: number;
  phaseTimer?: NodeJS.Timeout;
  isStarted: boolean;
  lastPhaseChange?: number; // Timestamp for monitoring stuck phases
  
  // Enhanced voting system
  votes: Map<string, string>; // voter -> target
  voteWeights: Map<string, number>; // voter -> weight (for cheerleader)
  cursedPlayers: Set<string>; // Players who can't vote
  
  // Enhanced night actions
  nightActions: Map<string, any>;
  actionSubmitted: Set<string>;
  nightVotes: Map<string, string[]>; // target -> voters (mafia)
  
  // Ability results and delayed effects
  delayedEffects: DelayedEffect[];
  publicMessages: string[];
  privateMessages: Map<string, string[]>; // playerId -> messages
  
  // Game state tracking
  gameLog: string[];
  winner?: 'mafia' | 'citizen' | 'neutral';
  winCondition?: string;
  
  // Role-specific tracking
  publishedInformation: PublishedInfo[];
  stolenAbilities: Map<string, string>; // thief -> stolen ability
  swappedRoles: Array<{ day: number; player1: string; player2: string }>;
  
  // Death tracking for medium
  deadPlayers: { player: EnhancedPlayer; dayOfDeath: number; causeOfDeath: string }[];
}

export interface DelayedEffect {
  id: string;
  triggerPhase: GamePhase;
  triggerDay?: number;
  sourcePlayer: string;
  targetPlayers: string[];
  effectType: 'publish' | 'curse' | 'reveal' | 'protect' | 'kill';
  message: string;
  isPublic: boolean;
  data?: any;
}

export interface PublishedInfo {
  day: number;
  reporter: string;
  target: string;
  information: string;
  isRevealed: boolean;
}

export interface VoteResult {
  targetId: string;
  voteCount: number;
  voters: string[];
  isEliminated: boolean;
}

export interface NightActionResult {
  actorId: string;
  actionType: string;
  targetId?: string;
  success: boolean;
  message: string;
  publicMessage?: string;
  effects: ActionEffect[];
}

export interface ActionEffect {
  type: 'kill' | 'heal' | 'block' | 'investigate' | 'protect' | 'curse' | 'steal' | 'swap' | 'publish';
  targetId: string;
  success: boolean;
  message?: string;
  data?: any;
}

export interface WinCondition {
  team: 'mafia' | 'citizen' | 'neutral';
  condition: 'eliminate_all' | 'outnumber' | 'survive' | 'revenge';
  achieved: boolean;
  winners: string[];
  message: string;
}

// Helper functions for game state management
export class GameStateManager {
  
  static createEnhancedPlayer(basePlayer: Player): EnhancedPlayer {
    return {
      ...basePlayer,
      hasVoted: false,
      hasActed: false,
      isCursed: false,
      isBlocked: false,
      isProtected: false,
      investigatedBy: [],
      abilitiesUsed: 0
    };
  }

  static createEnhancedRoom(baseRoom: any): EnhancedRoom {
    return {
      ...baseRoom,
      players: baseRoom.players.map((p: Player) => this.createEnhancedPlayer(p)),
      votes: new Map(),
      voteWeights: new Map(),
      cursedPlayers: new Set(),
      delayedEffects: [],
      publicMessages: [],
      privateMessages: new Map(),
      publishedInformation: [],
      stolenAbilities: new Map(),
      swappedRoles: [],
      deadPlayers: []
    };
  }

  static getAlivePlayers(room: EnhancedRoom): EnhancedPlayer[] {
    return room.players.filter(p => p.isAlive);
  }

  static getPlayersWithAbilities(room: EnhancedRoom): EnhancedPlayer[] {
    return room.players.filter(p => {
      const role = p.role;
      return p.isAlive && (
        role === 'mafia' || role === 'doctor' || role === 'police' || 
        role === 'detective' || role === 'reporter' || role === 'bartender' ||
        role === 'wizard' || role === 'medium' || role === 'thief' ||
        role === 'werewolf' || role === 'illusionist'
      );
    });
  }

  static getTeamMembers(room: EnhancedRoom, team: 'mafia' | 'citizen' | 'neutral', roleService?: any): EnhancedPlayer[] {
    return room.players.filter(p => {
      const playerTeam = this.getPlayerTeam(p, room.code, roleService);
      return playerTeam === team;
    });
  }

  static getPlayerTeam(player: EnhancedPlayer, roomCode?: string, roleService?: any): 'mafia' | 'citizen' | 'neutral' {
    // Handle turncoat team switching via RoleService
    if (player.role === 'turncoat' && roomCode && roleService) {
      const state = roleService.getAbilityState(roomCode, player.id);
      if (state?.teamSwitched) {
        return 'mafia';
      }
    }

    // Standard team mapping
    const mafiaRoles = ['mafia', 'spy', 'werewolf', 'doubleAgent'];
    const neutralRoles = ['turncoat', 'terrorist', 'illusionist', 'ghost'];
    
    if (mafiaRoles.includes(player.role)) return 'mafia';
    if (neutralRoles.includes(player.role)) return 'neutral';
    return 'citizen';
  }

  static checkWinConditions(room: EnhancedRoom, roleService?: any): WinCondition | null {
    const alivePlayers = this.getAlivePlayers(room);
    const aliveMafia = alivePlayers.filter(p => this.getPlayerTeam(p, room.code, roleService) === 'mafia');
    const aliveCitizens = alivePlayers.filter(p => this.getPlayerTeam(p, room.code, roleService) === 'citizen');
    const aliveNeutrals = alivePlayers.filter(p => this.getPlayerTeam(p, room.code, roleService) === 'neutral');

    // Mafia wins if they equal or outnumber citizens
    if (aliveMafia.length >= aliveCitizens.length && aliveMafia.length > 0) {
      return {
        team: 'mafia',
        condition: 'outnumber',
        achieved: true,
        winners: aliveMafia.map(p => p.id),
        message: '마피아팀이 승리했습니다! 마피아가 시민과 같거나 더 많아졌습니다.'
      };
    }

    // Citizens win if all mafia are eliminated
    if (aliveMafia.length === 0) {
      return {
        team: 'citizen',
        condition: 'eliminate_all',
        achieved: true,
        winners: aliveCitizens.map(p => p.id),
        message: '시민팀이 승리했습니다! 모든 마피아가 제거되었습니다.'
      };
    }

    // Check neutral win conditions
    for (const neutral of aliveNeutrals) {
      if (neutral.role === 'turncoat') {
        // Turncoat wins if they're the last survivor
        if (alivePlayers.length === 1 && alivePlayers[0].id === neutral.id) {
          return {
            team: 'neutral',
            condition: 'survive',
            achieved: true,
            winners: [neutral.id],
            message: '변절자가 승리했습니다! 최후까지 생존했습니다.'
          };
        }
      }
    }

    return null;
  }

  static addDelayedEffect(room: EnhancedRoom, effect: Omit<DelayedEffect, 'id'>): void {
    const delayedEffect: DelayedEffect = {
      ...effect,
      id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    room.delayedEffects.push(delayedEffect);
  }

  static triggerDelayedEffects(room: EnhancedRoom, phase: GamePhase, day?: number): DelayedEffect[] {
    const triggeredEffects = room.delayedEffects.filter(effect => {
      return effect.triggerPhase === phase && 
             (!effect.triggerDay || effect.triggerDay === day);
    });

    // Remove triggered effects
    room.delayedEffects = room.delayedEffects.filter(effect => 
      !triggeredEffects.includes(effect)
    );

    return triggeredEffects;
  }

  static addPrivateMessage(room: EnhancedRoom, playerId: string, message: string): void {
    if (!room.privateMessages.has(playerId)) {
      room.privateMessages.set(playerId, []);
    }
    room.privateMessages.get(playerId)!.push(message);
  }

  static addPublicMessage(room: EnhancedRoom, message: string): void {
    room.publicMessages.push(message);
  }

  static resetDayState(room: EnhancedRoom): void {
    room.players.forEach(player => {
      player.hasVoted = false;
      player.hasActed = false;
      player.isBlocked = false;
      player.isProtected = false;
    });

    room.votes.clear();
    room.voteWeights.clear();
    room.cursedPlayers.clear();
    room.nightActions.clear();
    room.actionSubmitted.clear();
    room.nightVotes.clear();
    room.publicMessages = [];
    room.privateMessages.clear();
  }

  static recordDeath(room: EnhancedRoom, player: EnhancedPlayer, cause: string): void {
    room.deadPlayers.push({
      player: { ...player },
      dayOfDeath: room.day,
      causeOfDeath: cause
    });
  }
}