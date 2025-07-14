// server/src/utils/GameValidator.ts

import { EnhancedRoom, EnhancedPlayer } from '../types/GameState';
import { ROLES } from '../shared/constants/roles';
import { ErrorHandler, ErrorType, GameError } from './ErrorHandler';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixableIssues: string[];
}

export class GameValidator {
  private errorHandler: ErrorHandler;

  constructor(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler;
  }

  // Comprehensive room validation
  async validateRoom(room: EnhancedRoom): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fixableIssues: []
    };

    // Basic structure validation
    this.validateRoomStructure(room, result);
    
    // Player validation
    this.validatePlayers(room, result);
    
    // Game state validation
    this.validateGameState(room, result);
    
    // Phase-specific validation
    this.validatePhaseState(room, result);
    
    // Role distribution validation
    this.validateRoleDistribution(room, result);

    result.isValid = result.errors.length === 0;

    // Log validation results
    if (!result.isValid) {
      await this.errorHandler.handleError({
        type: ErrorType.INVALID_ROOM_STATE,
        message: `Room validation failed: ${result.errors.join(', ')}`,
        roomCode: room.code,
        details: { errors: result.errors, warnings: result.warnings },
        timestamp: new Date(),
        severity: 'medium'
      });
    }

    return result;
  }

  // Validate basic room structure
  private validateRoomStructure(room: EnhancedRoom, result: ValidationResult): void {
    if (!room.code || typeof room.code !== 'string' || room.code.length !== 4) {
      result.errors.push('Invalid room code');
    }

    if (!room.hostId || typeof room.hostId !== 'string') {
      result.errors.push('Invalid host ID');
    }

    if (!Array.isArray(room.players)) {
      result.errors.push('Players must be an array');
      room.players = []; // Auto-fix
      result.fixableIssues.push('Reset players array');
    }

    if (typeof room.maxPlayers !== 'number' || room.maxPlayers < 6 || room.maxPlayers > 20) {
      result.errors.push('Invalid max players count');
    }

    if (typeof room.day !== 'number' || room.day < 0) {
      result.warnings.push('Invalid day count');
      room.day = Math.max(0, room.day); // Auto-fix
      result.fixableIssues.push('Reset day counter');
    }
  }

  // Validate all players in the room
  private validatePlayers(room: EnhancedRoom, result: ValidationResult): void {
    const playerIds = new Set<string>();
    const playerNames = new Set<string>();

    room.players.forEach((player, index) => {
      // Check for duplicate IDs
      if (playerIds.has(player.id)) {
        result.errors.push(`Duplicate player ID: ${player.id}`);
      }
      playerIds.add(player.id);

      // Check for duplicate names
      if (playerNames.has(player.name)) {
        result.warnings.push(`Duplicate player name: ${player.name}`);
      }
      playerNames.add(player.name);

      // Validate individual player
      this.validatePlayer(player, index, result);
    });

    // Check player count limits
    if (room.players.length > room.maxPlayers) {
      result.errors.push(`Too many players: ${room.players.length}/${room.maxPlayers}`);
    }

    // Check for host existence
    const hostExists = room.players.some(p => p.id === room.hostId);
    if (room.players.length > 0 && !hostExists) {
      result.warnings.push('Host not found in players list');
    }
  }

  // Validate individual player
  private validatePlayer(player: EnhancedPlayer, index: number, result: ValidationResult): void {
    if (!player.id || typeof player.id !== 'string') {
      result.errors.push(`Player ${index}: Invalid ID`);
    }

    if (!player.name || typeof player.name !== 'string' || player.name.trim().length === 0) {
      result.errors.push(`Player ${index}: Invalid name`);
    }

    if (typeof player.isAlive !== 'boolean') {
      result.warnings.push(`Player ${index}: Invalid isAlive status`);
      player.isAlive = true; // Auto-fix
      result.fixableIssues.push(`Reset isAlive for player ${index}`);
    }

    if (player.role && !ROLES[player.role]) {
      result.errors.push(`Player ${index}: Invalid role ${player.role}`);
    }

    // Validate enhanced player properties
    if (typeof player.hasVoted !== 'boolean') {
      player.hasVoted = false;
      result.fixableIssues.push(`Reset hasVoted for player ${index}`);
    }

    if (typeof player.hasActed !== 'boolean') {
      player.hasActed = false;
      result.fixableIssues.push(`Reset hasActed for player ${index}`);
    }
  }

  // Validate game state consistency
  private validateGameState(room: EnhancedRoom, result: ValidationResult): void {
    const validPhases = ['waiting', 'starting', 'night', 'day', 'voting', 'ended'];
    if (!validPhases.includes(room.phase)) {
      result.errors.push(`Invalid game phase: ${room.phase}`);
    }

    // Validate Maps and Sets
    if (!(room.nightActions instanceof Map)) {
      room.nightActions = new Map();
      result.fixableIssues.push('Reset nightActions Map');
    }

    if (!(room.votes instanceof Map)) {
      room.votes = new Map();
      result.fixableIssues.push('Reset votes Map');
    }

    if (!(room.actionSubmitted instanceof Set)) {
      room.actionSubmitted = new Set();
      result.fixableIssues.push('Reset actionSubmitted Set');
    }

    // Validate timer state
    if (room.timeRemaining < 0) {
      result.warnings.push('Negative time remaining');
      room.timeRemaining = 0;
      result.fixableIssues.push('Reset time remaining');
    }
  }

  // Validate phase-specific state
  private validatePhaseState(room: EnhancedRoom, result: ValidationResult): void {
    switch (room.phase) {
      case 'waiting':
        if (room.isStarted) {
          result.warnings.push('Game marked as started but in waiting phase');
        }
        break;

      case 'night':
        if (!room.isStarted) {
          result.errors.push('Night phase without game started');
        }
        // Check if all alive players have acted
        const alivePlayers = room.players.filter(p => p.isAlive);
        const actedPlayers = Array.from(room.actionSubmitted);
        if (alivePlayers.length > 0 && actedPlayers.length > alivePlayers.length) {
          result.warnings.push('More actions than alive players');
        }
        break;

      case 'voting':
        if (!room.isStarted) {
          result.errors.push('Voting phase without game started');
        }
        // Validate votes
        Array.from(room.votes.entries()).forEach(([voterId, targetId]) => {
          const voter = room.players.find(p => p.id === voterId);
          const target = room.players.find(p => p.id === targetId);
          
          if (!voter) {
            result.warnings.push(`Vote from non-existent player: ${voterId}`);
          } else if (!voter.isAlive) {
            // Allow ghost votes
            if (voter.role !== 'ghost') {
              result.warnings.push(`Vote from dead non-ghost player: ${voter.name}`);
            }
          }
          
          if (!target) {
            result.warnings.push(`Vote for non-existent player: ${targetId}`);
          }
        });
        break;

      case 'ended':
        if (!room.winner) {
          result.warnings.push('Game ended without winner declaration');
        }
        break;
    }
  }

  // Validate role distribution
  private validateRoleDistribution(room: EnhancedRoom, result: ValidationResult): void {
    if (!room.isStarted) return; // Skip if game hasn't started

    const roleCounts = new Map<string, number>();
    const alivePlayers = room.players.filter(p => p.isAlive);
    
    room.players.forEach(player => {
      if (player.role) {
        roleCounts.set(player.role, (roleCounts.get(player.role) || 0) + 1);
      }
    });

    // Check for minimum viable game state
    const mafiaCount = Array.from(roleCounts.entries())
      .filter(([role]) => ROLES[role]?.team === 'mafia')
      .reduce((sum, [, count]) => sum + count, 0);
    
    const citizenCount = Array.from(roleCounts.entries())
      .filter(([role]) => ROLES[role]?.team === 'citizen')
      .reduce((sum, [, count]) => sum + count, 0);

    if (alivePlayers.length > 0) {
      const aliveMafia = alivePlayers.filter(p => ROLES[p.role]?.team === 'mafia').length;
      const aliveCitizens = alivePlayers.filter(p => ROLES[p.role]?.team === 'citizen').length;

      if (aliveMafia === 0 && aliveCitizens > 0 && room.phase !== 'ended') {
        result.warnings.push('No alive mafia but game not ended');
      }

      if (aliveMafia >= aliveCitizens && room.phase !== 'ended') {
        result.warnings.push('Mafia equals/outnumbers citizens but game not ended');
      }
    }
  }

  // Validate action consistency
  validateAction(
    room: EnhancedRoom, 
    playerId: string, 
    action: any
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fixableIssues: []
    };

    // Find player
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      result.errors.push('Player not found');
      return result;
    }

    // Check if player is alive (except for ghost voting)
    if (!player.isAlive && !(player.role === 'ghost' && room.phase === 'voting')) {
      result.errors.push('Dead player cannot perform actions');
      return result;
    }

    // Check if action already submitted
    if (room.actionSubmitted.has(playerId)) {
      result.errors.push('Player already acted this phase');
      return result;
    }

    // Phase-specific validation
    switch (room.phase) {
      case 'night':
        this.validateNightAction(player, action, result);
        break;
      case 'voting':
        this.validateVoteAction(player, action, room, result);
        break;
      default:
        result.errors.push(`Actions not allowed in ${room.phase} phase`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Validate night actions
  private validateNightAction(player: EnhancedPlayer, action: any, result: ValidationResult): void {
    const role = ROLES[player.role];
    
    if (!role?.ability || role.ability.phase !== 'night') {
      if (action.actionType !== 'dummy') {
        result.errors.push('Player role cannot perform night actions');
      }
      return;
    }

    if (!action.actionType) {
      result.errors.push('Missing action type');
      return;
    }

    // Validate action type matches role
    if (action.actionType !== role.ability.action && action.actionType !== 'dummy') {
      result.errors.push(`Action type ${action.actionType} not valid for role ${player.role}`);
    }

    // Validate target if required
    if (action.targetPlayerId && action.targetPlayerId === player.id) {
      // Some roles can target themselves (like doctor)
      if (!['doctor', 'medium'].includes(player.role)) {
        result.errors.push('Cannot target yourself');
      }
    }
  }

  // Validate vote actions
  private validateVoteAction(player: EnhancedPlayer, action: any, room: EnhancedRoom, result: ValidationResult): void {
    if (!action.targetPlayerId) {
      result.errors.push('Vote must have target');
      return;
    }

    const target = room.players.find(p => p.id === action.targetPlayerId);
    if (!target) {
      result.errors.push('Vote target not found');
      return;
    }

    if (!target.isAlive) {
      result.errors.push('Cannot vote for dead player');
      return;
    }

    if (player.id === action.targetPlayerId) {
      result.errors.push('Cannot vote for yourself');
      return;
    }

    // Check if player is cursed
    if (room.cursedPlayers?.has(player.id) && player.isAlive) {
      result.errors.push('Player is cursed and cannot vote');
      return;
    }
  }

  // Auto-fix fixable issues
  async autoFixRoom(room: EnhancedRoom): Promise<boolean> {
    try {
      const validation = await this.validateRoom(room);
      
      if (validation.fixableIssues.length > 0) {
        console.log(`Auto-fixing room ${room.code}:`, validation.fixableIssues);
        
        // Re-validate after fixes
        const revalidation = await this.validateRoom(room);
        return revalidation.isValid;
      }
      
      return validation.isValid;
    } catch (error) {
      console.error(`Auto-fix failed for room ${room.code}:`, error);
      return false;
    }
  }
}