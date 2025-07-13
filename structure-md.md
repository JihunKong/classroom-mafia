# 프로젝트 구조 상세 설명

## 전체 디렉토리 구조

```
korean-mafia-game/
├── client/                          # React 프론트엔드
│   ├── src/
│   │   ├── components/              # 재사용 가능한 UI 컴포넌트
│   │   │   ├── common/              # 공통 컴포넌트
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Timer.tsx
│   │   │   ├── game/                # 게임 관련 컴포넌트
│   │   │   │   ├── PlayerList.tsx
│   │   │   │   ├── RoleCard.tsx
│   │   │   │   ├── VoteButton.tsx
│   │   │   │   └── PhaseIndicator.tsx
│   │   │   └── layout/              # 레이아웃 컴포넌트
│   │   │       ├── MobileContainer.tsx
│   │   │       └── Header.tsx
│   │   ├── pages/                  # 페이지 컴포넌트 (라우팅)
│   │   │   ├── Home.tsx            # 메인 화면
│   │   │   ├── CreateRoom.tsx      # 방 생성 (방장)
│   │   │   ├── JoinRoom.tsx        # 방 참여
│   │   │   ├── WaitingRoom.tsx     # 대기실
│   │   │   ├── Game.tsx            # 게임 진행
│   │   │   └── GameResult.tsx      # 게임 결과
│   │   ├── hooks/                  # 커스텀 React 훅
│   │   │   ├── useSocket.ts        # Socket.io 연결 관리
│   │   │   ├── useGame.ts          # 게임 상태 관리
│   │   │   ├── useTimer.ts         # 타이머 로직
│   │   │   └── useTTS.ts           # TTS 기능
│   │   ├── store/                  # Redux 상태 관리
│   │   │   ├── index.ts            # Store 설정
│   │   │   ├── gameSlice.ts        # 게임 상태
│   │   │   ├── playerSlice.ts      # 플레이어 정보
│   │   │   └── uiSlice.ts          # UI 상태
│   │   ├── services/               # API 및 Socket 서비스
│   │   │   ├── socket.ts           # Socket.io 클라이언트
│   │   │   ├── gameService.ts      # 게임 관련 통신
│   │   │   └── api.ts              # HTTP API 통신
│   │   ├── types/                  # TypeScript 타입 정의
│   │   │   ├── game.types.ts       # 게임 관련 타입
│   │   │   ├── player.types.ts     # 플레이어 타입
│   │   │   └── socket.types.ts     # Socket 이벤트 타입
│   │   ├── utils/                  # 유틸리티 함수
│   │   │   ├── constants.ts        # 상수 정의
│   │   │   ├── helpers.ts          # 헬퍼 함수
│   │   │   └── roleBalance.ts      # 역할 밸런스 계산
│   │   ├── assets/                 # 정적 파일
│   │   │   ├── images/
│   │   │   └── sounds/
│   │   ├── styles/                 # 글로벌 스타일
│   │   │   └── globals.css
│   │   ├── App.tsx                 # 앱 진입점
│   │   ├── main.tsx                # React 진입점
│   │   └── vite-env.d.ts           # Vite 타입 정의
│   ├── public/                     # 정적 파일
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                         # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/            # HTTP 요청 핸들러
│   │   │   └── healthController.ts
│   │   ├── services/               # 비즈니스 로직
│   │   │   ├── gameService.ts     # 게임 로직
│   │   │   ├── roomService.ts     # 방 관리
│   │   │   └── roleService.ts     # 역할 관리
│   │   ├── models/                 # 데이터 모델
│   │   │   ├── Game.ts            # 게임 모델
│   │   │   ├── Player.ts          # 플레이어 모델
│   │   │   └── Room.ts            # 방 모델
│   │   ├── socket/                 # Socket.io 핸들러
│   │   │   ├── index.ts           # Socket 초기화
│   │   │   ├── roomHandlers.ts    # 방 관련 이벤트
│   │   │   ├── gameHandlers.ts    # 게임 진행 이벤트
│   │   │   └── middleware.ts      # Socket 미들웨어
│   │   ├── types/                  # TypeScript 타입
│   │   │   ├── game.types.ts
│   │   │   ├── socket.types.ts
│   │   │   └── index.ts
│   │   ├── utils/                  # 유틸리티 함수
│   │   │   ├── constants.ts       # 서버 상수
│   │   │   ├── validators.ts      # 유효성 검사
│   │   │   ├── roleBalance.ts     # 역할 밸런스
│   │   │   └── gameLogic.ts       # 게임 로직 헬퍼
│   │   ├── config/                 # 설정 파일
│   │   │   └── index.ts
│   │   └── app.ts                  # Express 앱 설정
│   ├── index.ts                    # 서버 진입점
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── shared/                         # 클라이언트/서버 공유
│   ├── types/                      # 공유 타입
│   │   ├── game.types.ts
│   │   ├── events.types.ts
│   │   └── roles.types.ts
│   ├── constants/                  # 공유 상수
│   │   ├── roles.ts               # 역할 정의
│   │   ├── phases.ts              # 게임 단계
│   │   └── timers.ts              # 타이머 설정
│   └── utils/                      # 공유 유틸리티
│       └── roleBalance.ts          # 역할 밸런스 로직
│
├── .gitignore
├── package.json                    # 루트 package.json
├── README.md
├── claude.md
├── structure.md
└── LICENSE
```

## 주요 파일 설명

### Client Side

#### `/client/src/components/game/PlayerList.tsx`
```typescript
// 살아있는 플레이어 목록을 표시하고 투표/액션 대상 선택 기능
interface PlayerListProps {
  players: Player[];
  onSelect?: (playerId: string) => void;
  selectable?: boolean;
  showVoteCount?: boolean;
}
```

#### `/client/src/hooks/useSocket.ts`
```typescript
// Socket.io 연결 관리 및 이벤트 핸들링
export const useSocket = () => {
  // 연결 상태 관리
  // 이벤트 리스너 등록/해제
  // 재연결 로직
};
```

#### `/client/src/store/gameSlice.ts`
```typescript
// Redux slice for game state
interface GameState {
  roomCode: string | null;
  phase: GamePhase;
  players: Player[];
  myRole: Role | null;
  timeLeft: number;
  // ...
}
```

### Server Side

#### `/server/src/services/gameService.ts`
```typescript
// 핵심 게임 로직
export class GameService {
  assignRoles(players: Player[], roleConfig: RoleConfig): void;
  processNightActions(actions: NightAction[]): NightResult;
  checkWinCondition(game: Game): WinCondition | null;
  // ...
}
```

#### `/server/src/socket/gameHandlers.ts`
```typescript
// Socket.io 게임 이벤트 핸들러
export const handleGameEvents = (io: Server, socket: Socket) => {
  socket.on('game:start', handleGameStart);
  socket.on('vote:nominate', handleNominate);
  socket.on('vote:execution', handleExecutionVote);
  socket.on('action:night', handleNightAction);
  // ...
};
```

### Shared

#### `/shared/constants/roles.ts`
```typescript
// 역할별 밸런스 설정
export const ROLE_DISTRIBUTIONS: Record<number, RoleConfig> = {
  6: { citizen: 4, mafia: 1, doctor: 1 },
  7: { citizen: 4, mafia: 2, doctor: 1 },
  8: { citizen: 5, mafia: 2, doctor: 1 },
  9: { citizen: 5, mafia: 2, doctor: 1, police: 1 },
  10: { citizen: 5, mafia: 3, doctor: 1, police: 1 },
  11: { citizen: 6, mafia: 3, doctor: 1, police: 1 },
  12: { citizen: 6, mafia: 3, doctor: 1, police: 1, reporter: 1 }
};

export const MIN_PLAYERS = 6;
export const MAX_PLAYERS = 12;
```

## 데이터 플로우

```
User Action (Client)
    ↓
Socket Event Emission
    ↓
Server Socket Handler
    ↓
Game Service Logic
    ↓
State Update
    ↓
Broadcast to Room
    ↓
Client State Update
    ↓
UI Re-render
```

## 주요 Socket 이벤트

### Client → Server
- `room:create` - 방 생성
- `room:join` - 방 참여
- `game:start` - 게임 시작
- `vote:nominate` - 투표 지목
- `vote:execution` - 처형 투표
- `action:night` - 밤 행동

### Server → Client
- `room:created` - 방 생성 완료
- `room:joined` - 방 참여 완료
- `game:started` - 게임 시작됨
- `game:phaseChanged` - 게임 단계 변경
- `game:ended` - 게임 종료

## 환경 변수

### Client (.env)
```
VITE_SERVER_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_TTS_ENABLED=true
```

### Server (.env)
```
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-secret-key
```

## 빌드 및 배포

### 개발 환경
```bash
# 루트 디렉토리에서
npm run dev
```

### 프로덕션 빌드
```bash
# 전체 빌드
npm run build

# 클라이언트만
npm run build:client

# 서버만
npm run build:server
```

### 배포 구조
- **Frontend**: Vercel 또는 Netlify에 `/client/dist` 배포
- **Backend**: Railway 또는 Render에 서버 배포
- **환경변수**: 각 플랫폼에서 설정