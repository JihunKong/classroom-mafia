// server/src/utils/ErrorHandler.ts

import { Server } from 'socket.io';
import { EnhancedRoom, EnhancedPlayer } from '../types/GameState';

export enum ErrorType {
  SOCKET_DISCONNECTION = 'SOCKET_DISCONNECTION',
  INVALID_ROOM_STATE = 'INVALID_ROOM_STATE',
  CORRUPTED_GAME_DATA = 'CORRUPTED_GAME_DATA',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  INVALID_ACTION = 'INVALID_ACTION',
  PHASE_MISMATCH = 'PHASE_MISMATCH',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

export interface GameError {
  type: ErrorType;
  message: string;
  roomCode?: string;
  playerId?: string;
  details?: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'graceful_degradation' | 'room_cleanup' | 'player_reconnect';
  description: string;
  execute: () => Promise<boolean>;
}

export class ErrorHandler {
  private io: Server;
  private rooms: Map<string, EnhancedRoom>;
  private errorLog: GameError[] = [];
  private maxErrorLogSize = 1000;
  private reconnectionAttempts: Map<string, number> = new Map();
  private readonly maxReconnectionAttempts = 3;

  constructor(io: Server, rooms: Map<string, EnhancedRoom>) {
    this.io = io;
    this.rooms = rooms;
  }

  // Log and handle errors with automatic recovery attempts
  async handleError(error: GameError): Promise<boolean> {
    // Add to error log
    this.errorLog.push(error);
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog.shift();
    }

    console.error(`[${error.severity.toUpperCase()}] ${error.type}:`, {
      message: error.message,
      roomCode: error.roomCode,
      playerId: error.playerId,
      timestamp: error.timestamp
    });

    // Attempt recovery based on error type
    const recoveryActions = this.getRecoveryActions(error);
    
    for (const action of recoveryActions) {
      try {
        console.log(`Attempting recovery: ${action.description}`);
        const success = await action.execute();
        if (success) {
          console.log(`Recovery successful: ${action.description}`);
          return true;
        }
      } catch (recoveryError) {
        console.error(`Recovery action failed: ${action.description}`, recoveryError);
      }
    }

    // If all recovery attempts fail, notify affected users
    this.notifyErrorToUsers(error);
    return false;
  }

  // Get appropriate recovery actions based on error type
  private getRecoveryActions(error: GameError): RecoveryAction[] {
    switch (error.type) {
      case ErrorType.SOCKET_DISCONNECTION:
        return this.getDisconnectionRecoveryActions(error);
      
      case ErrorType.INVALID_ROOM_STATE:
        return this.getRoomStateRecoveryActions(error);
      
      case ErrorType.CORRUPTED_GAME_DATA:
        return this.getDataCorruptionRecoveryActions(error);
      
      case ErrorType.INVALID_ACTION:
        return this.getInvalidActionRecoveryActions(error);
      
      case ErrorType.PHASE_MISMATCH:
        return this.getPhaseMismatchRecoveryActions(error);
      
      default:
        return this.getGenericRecoveryActions(error);
    }
  }

  // Socket disconnection recovery
  private getDisconnectionRecoveryActions(error: GameError): RecoveryAction[] {
    return [
      {
        type: 'player_reconnect',
        description: 'Attempt to maintain player state for reconnection',
        execute: async () => {
          if (!error.playerId || !error.roomCode) return false;
          
          const room = this.rooms.get(error.roomCode);
          if (!room) return false;
          
          const player = room.players.find(p => p.id === error.playerId);
          if (!player) return false;
          
          // Mark player as temporarily disconnected
          player.socketId = undefined;
          
          // Set reconnection window (5 minutes)
          setTimeout(() => {
            this.handlePlayerReconnectionTimeout(error.roomCode!, error.playerId!);
          }, 300000);
          
          return true;
        }
      },
      {
        type: 'graceful_degradation',
        description: 'Continue game with AI substitute',
        execute: async () => {
          // For now, just mark as disconnected
          // Future: Implement AI substitute behavior
          return this.markPlayerAsDisconnected(error.roomCode!, error.playerId!);
        }
      }
    ];
  }

  // Room state validation and recovery
  private getRoomStateRecoveryActions(error: GameError): RecoveryAction[] {
    return [
      {
        type: 'retry',
        description: 'Validate and repair room state',
        execute: async () => {
          if (!error.roomCode) return false;
          return this.validateAndRepairRoomState(error.roomCode);
        }
      },
      {
        type: 'room_cleanup',
        description: 'Reset room to safe state',
        execute: async () => {
          if (!error.roomCode) return false;
          return this.resetRoomToSafeState(error.roomCode);
        }
      }
    ];
  }

  // Data corruption recovery
  private getDataCorruptionRecoveryActions(error: GameError): RecoveryAction[] {
    return [
      {
        type: 'fallback',
        description: 'Restore from backup state',
        execute: async () => {
          if (!error.roomCode) return false;
          return this.restoreFromBackup(error.roomCode);
        }
      },
      {
        type: 'room_cleanup',
        description: 'Terminate corrupted game safely',
        execute: async () => {
          if (!error.roomCode) return false;
          return this.terminateGameSafely(error.roomCode, 'Data corruption detected');
        }
      }
    ];
  }

  // Invalid action recovery
  private getInvalidActionRecoveryActions(error: GameError): RecoveryAction[] {
    return [
      {
        type: 'graceful_degradation',
        description: 'Ignore invalid action and continue',
        execute: async () => {
          // Log the invalid action but continue game
          if (error.playerId && error.roomCode) {
            this.io.to(error.playerId).emit('action:rejected', {
              message: 'Invalid action rejected. Game continues.',
              reason: error.message
            });
          }
          return true;
        }
      }
    ];
  }

  // Phase mismatch recovery
  private getPhaseMismatchRecoveryActions(error: GameError): RecoveryAction[] {
    return [
      {
        type: 'retry',
        description: 'Synchronize game phase',
        execute: async () => {
          if (!error.roomCode) return false;
          return this.synchronizeGamePhase(error.roomCode);
        }
      }
    ];
  }

  // Generic recovery actions
  private getGenericRecoveryActions(error: GameError): RecoveryAction[] {
    return [
      {
        type: 'graceful_degradation',
        description: 'Continue with limited functionality',
        execute: async () => {
          console.log(`Continuing with graceful degradation for error: ${error.type}`);
          return true;
        }
      }
    ];
  }

  // Validate and repair room state
  private async validateAndRepairRoomState(roomCode: string): Promise<boolean> {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    try {
      // Check for required properties
      if (!room.players || !Array.isArray(room.players)) {
        room.players = [];
      }

      if (!room.nightActions) {
        room.nightActions = new Map();
      }

      if (!room.votes) {
        room.votes = new Map();
      }

      // Validate player states
      room.players.forEach(player => {
        if (typeof player.isAlive !== 'boolean') {
          player.isAlive = true;
        }
        if (!player.role) {
          player.role = 'citizen'; // Default role
        }
      });

      // Validate phase
      const validPhases = ['waiting', 'starting', 'night', 'day', 'voting', 'ended'];
      if (!validPhases.includes(room.phase)) {
        room.phase = 'waiting';
      }

      console.log(`Room state validated and repaired: ${roomCode}`);
      return true;
    } catch (error) {
      console.error(`Failed to repair room state: ${roomCode}`, error);
      return false;
    }
  }

  // Reset room to safe state
  private async resetRoomToSafeState(roomCode: string): Promise<boolean> {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    try {
      // Clear active timers
      if (room.phaseTimer) {
        clearTimeout(room.phaseTimer);
        room.phaseTimer = undefined;
      }

      // Reset to waiting phase
      room.phase = 'waiting';
      room.isStarted = false;
      room.day = 0;
      room.timeRemaining = 0;

      // Clear action states
      room.nightActions.clear();
      room.votes.clear();
      room.actionSubmitted.clear();

      // Notify players
      this.io.to(roomCode).emit('game:reset', {
        message: 'Game has been reset due to technical issues. Please restart.',
        reason: 'Room state recovery'
      });

      console.log(`Room reset to safe state: ${roomCode}`);
      return true;
    } catch (error) {
      console.error(`Failed to reset room to safe state: ${roomCode}`, error);
      return false;
    }
  }

  // Handle player reconnection timeout
  private handlePlayerReconnectionTimeout(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.socketId) return; // Player already reconnected

    // Mark as permanently disconnected
    this.markPlayerAsDisconnected(roomCode, playerId);
  }

  // Mark player as disconnected
  private markPlayerAsDisconnected(roomCode: string, playerId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    // For active games, continue with AI or skip player
    if (room.isStarted && player.isAlive) {
      // Submit dummy action if in night phase
      if (room.phase === 'night' && !room.actionSubmitted.has(playerId)) {
        room.actionSubmitted.add(playerId);
      }
    }

    // Notify other players
    this.io.to(roomCode).emit('player:disconnected', {
      message: `${player.name}이(가) 연결이 끊어졌습니다.`,
      playerId: playerId,
      playerName: player.name
    });

    return true;
  }

  // Restore from backup (placeholder for future implementation)
  private async restoreFromBackup(roomCode: string): Promise<boolean> {
    // Future: Implement state backup and restoration
    console.log(`Backup restoration not yet implemented for room: ${roomCode}`);
    return false;
  }

  // Terminate game safely
  private async terminateGameSafely(roomCode: string, reason: string): Promise<boolean> {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    try {
      // Clear timers
      if (room.phaseTimer) {
        clearTimeout(room.phaseTimer);
      }

      // Notify players
      this.io.to(roomCode).emit('game:terminated', {
        message: '기술적 문제로 인해 게임이 종료되었습니다.',
        reason: reason,
        timestamp: new Date().toISOString()
      });

      // Clean up room
      setTimeout(() => {
        this.rooms.delete(roomCode);
      }, 30000); // 30 second grace period

      console.log(`Game terminated safely: ${roomCode}, reason: ${reason}`);
      return true;
    } catch (error) {
      console.error(`Failed to terminate game safely: ${roomCode}`, error);
      return false;
    }
  }

  // Synchronize game phase
  private async synchronizeGamePhase(roomCode: string): Promise<boolean> {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    try {
      // Broadcast current game state to all players
      this.io.to(roomCode).emit('game:stateSync', {
        phase: room.phase,
        day: room.day,
        timeRemaining: room.timeRemaining,
        alivePlayers: room.players.filter(p => p.isAlive),
        message: 'Game state synchronized'
      });

      console.log(`Game phase synchronized: ${roomCode}`);
      return true;
    } catch (error) {
      console.error(`Failed to synchronize game phase: ${roomCode}`, error);
      return false;
    }
  }

  // Notify users about errors
  private notifyErrorToUsers(error: GameError): void {
    if (error.roomCode) {
      this.io.to(error.roomCode).emit('system:error', {
        type: 'technical_difficulty',
        message: '일시적인 기술적 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        canRetry: true
      });
    } else if (error.playerId) {
      this.io.to(error.playerId).emit('system:error', {
        type: 'connection_issue',
        message: '연결에 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.',
        canRetry: true
      });
    }
  }

  // Get error statistics
  getErrorStats(): any {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByType: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      recentErrors: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  // Clear old errors
  clearOldErrors(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.errorLog = this.errorLog.filter(error => error.timestamp > cutoff);
  }
}