// shared/constants/phases.ts

export type GamePhase = 
  | 'waiting'      // 대기실
  | 'starting'     // 게임 시작 중 (역할 배정)
  | 'day'          // 낮 - 토론
  | 'voting'       // 투표 - 마피아 지목
  | 'execution'    // 처형 투표
  | 'night'        // 밤 - 역할 행동
  | 'nightResult'  // 밤 결과 공개
  | 'ended';       // 게임 종료

export interface PhaseConfig {
  id: GamePhase;
  name: string;
  description: string;
  duration: number; // 초 단위
  allowedActions: string[];
  nextPhase: GamePhase | null;
  ttsMessage?: string;
}

// 페이즈별 설정
export const PHASE_CONFIGS: Record<GamePhase, PhaseConfig> = {
  waiting: {
    id: 'waiting',
    name: '대기실',
    description: '플레이어들이 입장하기를 기다리는 중',
    duration: 0, // 무제한
    allowedActions: ['leave', 'start'],
    nextPhase: 'starting',
  },
  starting: {
    id: 'starting',
    name: '게임 시작',
    description: '역할을 배정하는 중',
    duration: 5,
    allowedActions: [],
    nextPhase: 'day',
    ttsMessage: '게임이 시작됩니다. 각자의 역할을 확인해주세요.'
  },
  day: {
    id: 'day',
    name: '낮',
    description: '토론 시간',
    duration: 180, // 3분
    allowedActions: ['discuss'],
    nextPhase: 'voting',
    ttsMessage: '낮이 되었습니다. 지난 밤의 사건에 대해 토론해주세요.'
  },
  voting: {
    id: 'voting',
    name: '투표',
    description: '마피아로 의심되는 사람을 지목',
    duration: 60,
    allowedActions: ['nominate'],
    nextPhase: 'execution',
    ttsMessage: '투표 시간입니다. 마피아로 의심되는 사람을 지목해주세요.'
  },
  execution: {
    id: 'execution',
    name: '처형 투표',
    description: '지목된 사람의 처형 여부 결정',
    duration: 30,
    allowedActions: ['executionVote'],
    nextPhase: 'night',
    ttsMessage: '지목된 플레이어의 처형 여부를 투표해주세요.'
  },
  night: {
    id: 'night',
    name: '밤',
    description: '각 역할이 능력을 사용하는 시간',
    duration: 60,
    allowedActions: ['nightAction'],
    nextPhase: 'nightResult',
    ttsMessage: '밤이 되었습니다. 각자의 역할에 따라 행동해주세요.'
  },
  nightResult: {
    id: 'nightResult',
    name: '밤 결과',
    description: '밤 동안의 사건 공개',
    duration: 10,
    allowedActions: [],
    nextPhase: 'day',
    ttsMessage: '밤이 지나갔습니다.'
  },
  ended: {
    id: 'ended',
    name: '게임 종료',
    description: '게임이 종료되었습니다',
    duration: 0,
    allowedActions: ['rematch', 'leave'],
    nextPhase: null,
    ttsMessage: '게임이 종료되었습니다.'
  }
};

// 타이머 설정 (초 단위)
export const PHASE_TIMERS = {
  DAY_DISCUSSION: 180,      // 3분
  VOTING: 60,              // 1분
  EXECUTION_VOTE: 30,      // 30초
  NIGHT_ACTION: 60,        // 1분
  NIGHT_RESULT: 10,        // 10초
  ROLE_REVEAL: 5,          // 5초
} as const;

// 페이즈 전환 조건
export interface PhaseTransition {
  from: GamePhase;
  to: GamePhase;
  condition: (gameState: any) => boolean;
  onTransition?: (gameState: any) => void;
}

export const PHASE_TRANSITIONS: PhaseTransition[] = [
  {
    from: 'waiting',
    to: 'starting',
    condition: (gameState) => {
      return gameState.players.length >= 6 && gameState.isStarted;
    }
  },
  {
    from: 'starting',
    to: 'day',
    condition: () => true, // 자동 전환
    onTransition: (gameState) => {
      gameState.round = 1;
      gameState.dayNumber = 1;
    }
  },
  {
    from: 'day',
    to: 'voting',
    condition: (gameState) => {
      return gameState.timeLeft === 0 || gameState.skipRequested;
    }
  },
  {
    from: 'voting',
    to: 'execution',
    condition: (gameState) => {
      // 누군가 지목되었을 때만 처형 투표로
      const hasNomination = Object.values(gameState.nominations).some((votes: any) => votes > 0);
      return gameState.timeLeft === 0 || hasNomination;
    }
  },
  {
    from: 'voting',
    to: 'night',
    condition: (gameState) => {
      // 아무도 지목되지 않았을 때 바로 밤으로
      const hasNomination = Object.values(gameState.nominations).some((votes: any) => votes > 0);
      return gameState.timeLeft === 0 && !hasNomination;
    }
  },
  {
    from: 'execution',
    to: 'night',
    condition: (gameState) => {
      return gameState.timeLeft === 0 || gameState.executionComplete;
    }
  },
  {
    from: 'night',
    to: 'nightResult',
    condition: (gameState) => {
      // 모든 액션이 완료되었거나 시간이 끝났을 때
      const aliveWithActions = gameState.players.filter((p: any) => 
        p.isAlive && NIGHT_ACTION_ROLES.includes(p.role)
      );
      const actionsComplete = aliveWithActions.every((p: any) => 
        gameState.nightActions[p.id] !== undefined
      );
      return gameState.timeLeft === 0 || actionsComplete;
    }
  },
  {
    from: 'nightResult',
    to: 'ended',
    condition: (gameState) => {
      return gameState.winCondition !== null;
    }
  },
  {
    from: 'nightResult',
    to: 'day',
    condition: (gameState) => {
      return gameState.timeLeft === 0 && gameState.winCondition === null;
    },
    onTransition: (gameState) => {
      gameState.dayNumber += 1;
      gameState.round += 1;
    }
  }
];

// 밤에 행동하는 역할들
export const NIGHT_ACTION_ROLES = ['mafia', 'spy', 'werewolf', 'doubleAgent', 'doctor', 'police', 'detective', 'reporter', 'bartender', 'wizard', 'medium', 'thief', 'illusionist'];

// 낮에 행동하는 역할들  
export const DAY_ACTION_ROLES = ['cheerleader'];

// 죽을 때 행동하는 역할들
export const DEATH_ACTION_ROLES = ['terrorist', 'ghost'];

// 페이즈별 UI 설정
export const PHASE_UI_CONFIGS = {
  waiting: {
    backgroundColor: '#f3f4f6',
    icon: '⏳',
    showTimer: false,
    showPlayerList: true,
    showChat: true
  },
  starting: {
    backgroundColor: '#ddd6fe',
    icon: '🎭',
    showTimer: true,
    showPlayerList: false,
    showChat: false
  },
  day: {
    backgroundColor: '#fef3c7',
    icon: '☀️',
    showTimer: true,
    showPlayerList: true,
    showChat: true
  },
  voting: {
    backgroundColor: '#fed7aa',
    icon: '🗳️',
    showTimer: true,
    showPlayerList: true,
    showChat: false
  },
  execution: {
    backgroundColor: '#fecaca',
    icon: '⚖️',
    showTimer: true,
    showPlayerList: false,
    showChat: false
  },
  night: {
    backgroundColor: '#1e293b',
    icon: '🌙',
    showTimer: true,
    showPlayerList: true,
    showChat: false,
    darkMode: true
  },
  nightResult: {
    backgroundColor: '#475569',
    icon: '📰',
    showTimer: true,
    showPlayerList: true,
    showChat: false,
    darkMode: true
  },
  ended: {
    backgroundColor: '#e0e7ff',
    icon: '🏆',
    showTimer: false,
    showPlayerList: true,
    showChat: true
  }
} as const;

// TTS 메시지 템플릿
export const TTS_MESSAGES = {
  gameStart: '게임이 시작됩니다. 각자의 역할을 확인해주세요.',
  dayStart: (day: number, deaths: string[]) => {
    if (deaths.length === 0) {
      return `${day}일차 낮이 되었습니다. 지난 밤은 평화로웠습니다.`;
    }
    return `${day}일차 낮이 되었습니다. 지난 밤 ${deaths.join(', ')}님이 사망했습니다.`;
  },
  votingStart: '투표 시간입니다. 마피아로 의심되는 사람을 지목해주세요.',
  executionStart: (nominated: string) => 
    `${nominated}님이 마피아로 지목되었습니다. 처형에 찬성하시면 찬성을, 반대하시면 반대를 눌러주세요.`,
  executionResult: (executed: boolean, player: string) =>
    executed 
      ? `${player}님이 처형되었습니다.`
      : `${player}님이 처형을 면했습니다.`,
  nightStart: '밤이 되었습니다. 각자의 역할에 따라 행동해주세요.',
  playerDeath: (player: string) => `${player}님이 사망했습니다. 이제 사망자 채팅에 참여할 수 있습니다.`,
  gameEnd: (winners: string) => 
    `게임이 종료되었습니다. ${winners} 팀의 승리입니다!`
};