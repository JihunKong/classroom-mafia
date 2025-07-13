# 🚀 Railway 환경변수 설정 가이드

Railway 대시보드에서 다음 환경변수를 설정해주세요:

## 필수 환경변수

```bash
# 서버 설정
PORT=3001
NODE_ENV=production

# 클라이언트 URL 설정
CLIENT_URL=https://classroom-mafia-production.up.railway.app
VITE_SERVER_URL=https://classroom-mafia-production.up.railway.app
VITE_SOCKET_URL=https://classroom-mafia-production.up.railway.app

# CORS 설정
CORS_ORIGIN=https://classroom-mafia-production.up.railway.app
```

## 선택적 환경변수

```bash
# 세션 비밀키 (랜덤 문자열 생성)
SESSION_SECRET=your-random-session-secret-here

# 선생님 대시보드 비밀번호
TEACHER_PASSWORD=secure-teacher-password

# Socket.IO 설정
SOCKET_PING_INTERVAL=25000
SOCKET_PING_TIMEOUT=60000
MAX_CONNECTIONS_PER_IP=30
```

## Railway에서 설정하는 방법

1. Railway 대시보드에서 프로젝트 선택
2. "Variables" 탭 클릭
3. "Add Variable" 버튼 클릭
4. 위의 환경변수를 하나씩 추가
5. 저장 후 자동으로 재배포됨

## 중요 사항

- `SESSION_SECRET`는 보안을 위해 랜덤한 긴 문자열로 설정하세요
- `TEACHER_PASSWORD`는 선생님 대시보드 접근용 비밀번호입니다
- 모든 URL은 `https://`로 시작해야 합니다 (Railway는 자동으로 HTTPS 제공)

## 배포 확인

환경변수 설정 후:
1. Railway 로그에서 "Server is running on port 3001" 확인
2. https://classroom-mafia-production.up.railway.app 접속
3. 게임 테스트 (방 만들기 → 참여 → 게임 시작)