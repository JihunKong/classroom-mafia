# 한국형 마피아 게임 - 프로젝트 파일 구조

## 📁 루트 디렉토리 파일

### package.json
- 루트 패키지 설정
- 전체 프로젝트 스크립트 관리
- concurrently를 사용한 동시 실행

### README.md
- 프로젝트 소개 및 문서
- 설치 방법, 실행 방법
- 역할 설명 및 게임 규칙

### claude.md
- Claude Code 개발 가이드라인
- 코딩 컨벤션 및 구현 규칙
- 개발 단계별 작업 목록

### structure.md
- 상세 프로젝트 구조 설명
- 디렉토리별 역할 설명
- 주요 파일 용도 설명

### .gitignore
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

### .env.example
```
# Client
VITE_SERVER_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# Server
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## 📁 /client (프론트엔드)

### /client/package.json
- React 18, TypeScript
- Vite, Tailwind CSS
- Socket.io-client, Redux Toolkit

### /client/tsconfig.json
- TypeScript 설정
- React JSX 지원
- 경로 별칭 설정

### /client/vite.config.ts
- Vite 빌드 설정
- 개발 서버 프록시 설정

### /client/tailwind.config.js
- Tailwind CSS 설정
- 커스텀 색상 테마

### /client/index.html
- React 앱 진입점
- 모바일 뷰포트 설정

### /client/src/main.tsx
- React 앱 초기화
- Redux Provider 설정

### /client/src/App.tsx
- 라우팅 설정
- 전역 레이아웃

### /client/src/styles/globals.css
- Tailwind CSS imports
- 전역 스타일

## 📁 /client/src/components

### /components/common/
- Button.tsx - 재사용 가능한 버튼
- Input.tsx - 입력 컴포넌트
- Modal.tsx - 모달 컴포넌트
- Timer.tsx - 타이머 표시

### /components/game/
- RoleCard.tsx - 역할 카드 표시
- PlayerList.tsx - 플레이어 목록
- VoteButton.tsx - 투표 버튼
- PhaseIndicator.tsx - 게임 단계 표시
- DeadChat.tsx - 사망자 채팅

### /components/layout/
- MobileContainer.tsx - 모바일 컨테이너
- Header.tsx - 상단 헤더

## 📁 /client/src/pages

### Home.tsx
- 메인 화면
- 방 만들기/참여하기 버튼

### CreateRoom.tsx
- 방 생성 화면
- 인원수 설정
- 역할 커스터마이징

### JoinRoom.tsx
- 방 참여 화면
- 4자리 코드 입력
- 이름 입력

### WaitingRoom.tsx
- 대기실
- 참가자 목록
- 게임 시작 버튼

### Game.tsx
- 메인 게임 화면
- 역할별 행동
- 투표 시스템
- 데드챗 통합

### GameResult.tsx
- 게임 결과 화면
- 승리팀 표시
- 전체 역할 공개

## 📁 /client/src/hooks

### useSocket.ts
- Socket.io 연결 관리
- 재연결 로직

### useGame.ts
- 게임 상태 관리
- 액션 디스패치

### useTimer.ts
- 타이머 로직
- 카운트다운 관리

### useTTS.ts
- TTS 기능
- 음성 안내

## 📁 /client/src/store

### index.ts
- Redux store 설정

### gameSlice.ts
- 게임 상태 slice

### playerSlice.ts
- 플레이어 정보 slice

### uiSlice.ts
- UI 상태 slice

## 📁 /client/src/services

### socket.ts
- Socket.io 클라이언트 초기화

### gameService.ts
- 게임 관련 API 통신

### api.ts
- HTTP 요청 유틸리티

## 📁 /client/src/types

### game.types.ts
- 게임 관련 타입 정의

### player.types.ts
- 플레이어 타입 정의

### socket.types.ts
- Socket 이벤트 타입

## 📁 /client/src/utils

### constants.ts
- 클라이언트 상수

### helpers.ts
- 헬퍼 함수

### roleBalance.ts
- 역할 밸런스 계산

## 📁 /client/src/assets/images/roles

### /mafia-team/
- mafia.png
- spy.png
- werewolf.png
- double_agent.png

### /citizen-team/
- citizen.png
- police.png
- doctor.png
- soldier.png
- reporter.png
- detective.png
- bartender.png
- cheerleader.png
- wizard.png
- medium.png
- thief.png

### /neutral-team/
- turncoat.png
- terrorist.png
- illusionist.png
- ghost.png

### /ui/
- day_phase.png
- night_phase.png
- vote_icon.png
- death_icon.png
- default_role.png

## 📁 /server (백엔드)

### /server/package.json
- Node.js, Express, TypeScript
- Socket.io
- 기타 서버 의존성

### /server/tsconfig.json
- TypeScript 서버 설정

### /server/index.ts
- 서버 진입점
- Express 앱 시작
- Socket.io 초기화

### /server/src/app.ts
- Express 앱 설정
- 미들웨어 설정
- CORS 설정

## 📁 /server/src/controllers

### healthController.ts
- 헬스체크 엔드포인트

## 📁 /server/src/services

### gameService.ts
- 게임 로직
- 역할 배정
- 승리 조건 체크

### roomService.ts
- 방 생성/삭제
- 플레이어 입장/퇴장

### roleService.ts
- 역할별 행동 처리
- 능력 사용 검증

## 📁 /server/src/models

### Game.ts
- 게임 데이터 모델

### Player.ts
- 플레이어 데이터 모델

### Room.ts
- 방 데이터 모델

## 📁 /server/src/socket

### index.ts
- Socket.io 서버 초기화

### roomHandlers.ts
- 방 관련 이벤트 핸들러

### gameHandlers.ts
- 게임 진행 이벤트 핸들러

### deadChatHandlers.ts
- 데드챗 이벤트 핸들러

### middleware.ts
- Socket 미들웨어

## 📁 /server/src/types

### game.types.ts
- 서버 게임 타입

### socket.types.ts
- Socket 이벤트 타입

## 📁 /server/src/utils

### constants.ts
- 서버 상수

### validators.ts
- 입력 검증

### roleBalance.ts
- 역할 밸런스 로직

### gameLogic.ts
- 게임 진행 헬퍼

## 📁 /server/src/config

### index.ts
- 환경 변수 설정
- 서버 설정

## 📁 /shared (공유 코드)

### /shared/types/
- game.types.ts - 공유 게임 타입
- events.types.ts - Socket 이벤트 타입
- roles.types.ts - 역할 타입

### /shared/constants/
- roles.ts - 역할 정의 및 밸런스
- phases.ts - 게임 단계 정의
- timers.ts - 타이머 설정

### /shared/utils/
- roleBalance.ts - 역할 밸런스 계산 로직

## 🚀 프로젝트 시작 순서

1. **루트 디렉토리 파일 생성**
   - package.json
   - README.md
   - claude.md
   - structure.md

2. **client 디렉토리 구조 생성**
   - 기본 설정 파일들
   - src 하위 디렉토리들
   - assets/images 구조

3. **server 디렉토리 구조 생성**
   - 기본 설정 파일들
   - src 하위 디렉토리들

4. **shared 디렉토리 생성**
   - 공유 타입 및 상수

5. **의존성 설치**
   ```bash
   npm run install:all
   ```

6. **개발 서버 실행**
   ```bash
   npm run dev
   ```

## 📝 주요 구현 순서

1. **기본 서버 설정**
   - Express + Socket.io 설정
   - 기본 라우팅

2. **방 시스템**
   - 방 생성/참여
   - 플레이어 관리

3. **게임 로직**
   - 역할 배정
   - 페이즈 전환
   - 투표 시스템

4. **클라이언트 UI**
   - 기본 화면들
   - 게임 진행 화면

5. **특수 기능**
   - 역할별 능력
   - 데드챗
   - TTS

6. **최적화 및 테스트**
   - 성능 최적화
   - 버그 수정
   - 사용자 테스트