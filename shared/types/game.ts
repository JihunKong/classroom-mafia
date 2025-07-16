// shared/types/game.ts

import { GamePhase } from '../constants/phases';

export interface Player {
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
  // Role-specific states
  investigated?: string[]; // For police - who they've investigated
  shielded?: boolean; // For soldier - whether they've been protected
  blocked?: boolean; // For roles that can be blocked
  hasUsedAbility?: boolean; // For limited-use abilities
  curseTarget?: string; // For wizard
  stolenAbility?: string; // For thief
  isProtected?: boolean; // For doctor healing effects
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  phase: GamePhase;
  day: number;
  timeRemaining: number;
  phaseTimer?: ReturnType<typeof setTimeout>;
  isStarted: boolean;
  dayDuration?: number; // 커스텀 낮 시간 (초 단위, 기본값: 180)
  // Game state
  gameLog: string[];
  nightActions: Map<string, any>;
  actionSubmitted: Set<string>;
  nightVotes: Map<string, string[]>; // target -> voters
  // Voting state
  nominations: Map<string, string[]>; // candidate -> voters
  executionVotes: Map<string, 'yes' | 'no'>; // voter -> vote
  // Win condition
  winner?: 'mafia' | 'citizen' | 'neutral';
  winCondition?: string;
}

export interface GameAction {
  playerId: string;
  actionType: 'kill' | 'heal' | 'investigate' | 'roleBlock' | 'dummy' | 'publish' | 'curse' | 'steal' | 'swap' | 'revenge' | 'detectiveInvestigate' | 'channelDead' | 'wolfKill' | 'doubleVote';
  targetPlayerId?: string;
  targetPlayerIds?: string[]; // For actions that target multiple players
  message?: string; // For reporter actions
  metadata?: any; // Additional action-specific data
}

export interface VoteAction {
  playerId: string;
  targetPlayerId: string;
  voteType: 'nominate' | 'execution';
}

export interface GameEvent {
  type: 'player_death' | 'role_revealed' | 'action_result' | 'phase_change' | 'game_end';
  playerId?: string;
  data: any;
  timestamp: Date;
  message: string;
}

// Socket event interfaces
export interface SocketEvents {
  // Room events
  'room:create': (data: { playerName: string; maxPlayers: number; dayDuration?: number }) => void;
  'room:join': (data: { playerName: string; roomCode: string }) => void;
  'room:leave': () => void;
  
  // Game events
  'game:start': (data: { roomCode: string }) => void;
  'vote:cast': (data: { roomCode: string; targetPlayerId: string }) => void;
  'night:action': (data: { roomCode: string; actionType: string; targetPlayerId: string }) => void;
  
  // Dead chat events
  'deadChat:send': (data: { message: string }) => void;
  'deadChat:getHistory': () => void;
}

export interface ServerToClientEvents {
  // Room events
  'room:created': (data: { roomCode: string; players: Player[] }) => void;
  'room:joined': (data: { roomCode: string; players: Player[] }) => void;
  'room:playerUpdate': (data: { players: Player[] }) => void;
  
  // Game events
  'game:started': (data: { phase: GamePhase; day: number; message: string }) => void;
  'role:assigned': (data: { role: string; roleInfo: any }) => void;
  'phase:changed': (data: { phase: GamePhase; day: number; timeRemaining: number; message: string; alivePlayers?: Player[] }) => void;
  'phase:night': (data: { day: number; timeRemaining: number; message: string }) => void;
  'phase:day': (data: { day: number; timeRemaining: number; message: string; alivePlayers: Player[] }) => void;
  'phase:voting': (data: { timeRemaining: number; message: string; alivePlayers: Player[] }) => void;
  
  // Action events
  'night:actionAvailable': (data: { canAct: boolean; actionType: string; isDummy?: boolean }) => void;
  'night:actionConfirmed': (data: { message: string }) => void;
  'night:result': (data: { message: string; alivePlayers: Player[] }) => void;
  'vote:confirmed': (data: { message: string }) => void;
  'voting:result': (data: { message: string; alivePlayers: Player[] }) => void;
  'investigate:result': (data: { target: string; result: 'mafia' | 'citizen' }) => void;
  'mafia:voteStatus': (data: { message: string }) => void;
  
  // Game end
  'game:ended': (data: { winner: string; message: string; finalPlayers: Player[]; gameLog: string[] }) => void;
  
  // Dead chat events
  'deadChat:message': (data: any) => void;
  'deadChat:history': (data: any[]) => void;
  'deadChat:activated': (data: { message: string }) => void;
  'deadChat:playerJoined': (data: { playerId: string; playerName: string; role: any }) => void;
  'deadChat:revealed': (data: { messages: any[]; notification: string }) => void;
  
  // Error handling
  'error': (data: { message: string }) => void;
}

// Dead chat types
export interface DeadChatMessage {
  id: string;
  roomCode: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  role: {
    id: string;
    name: string;
    team: 'mafia' | 'citizen' | 'neutral';
  };
}

// Game statistics for analytics
export interface GameStats {
  roomCode: string;
  playerCount: number;
  duration: number; // in minutes
  winner: 'mafia' | 'citizen' | 'neutral';
  totalDays: number;
  playerActions: Map<string, number>; // player -> action count
  roles: string[];
  startTime: Date;
  endTime: Date;
}

// Error types
export type GameError = 
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'INVALID_PLAYER_COUNT'
  | 'GAME_ALREADY_STARTED'
  | 'PLAYER_NOT_FOUND'
  | 'INVALID_ACTION'
  | 'ACTION_NOT_ALLOWED'
  | 'PHASE_MISMATCH'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR';

export interface ErrorResponse {
  type: GameError;
  message: string;
  details?: any;
}