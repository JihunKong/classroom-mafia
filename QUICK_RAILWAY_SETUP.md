# ⚡ Railway 빠른 배포 가이드

## 🎯 목표
`https://classroom-mafia-production.up.railway.app`에서 Korean Mafia Game 실행

## 📋 Railway 웹 대시보드 단계별 가이드

### 1️⃣ **새 프로젝트 생성**
1. https://railway.app/dashboard 접속
2. "New Project" → "Deploy from GitHub repo"
3. `JihunKong/classroom-mafia` 선택

### 2️⃣ **환경변수 한 번에 설정**
"Variables" 탭에서 다음을 복사하여 붙여넣기:

```
PORT=3001
NODE_ENV=production
CLIENT_URL=https://classroom-mafia-production.up.railway.app
VITE_SERVER_URL=https://classroom-mafia-production.up.railway.app
VITE_SOCKET_URL=https://classroom-mafia-production.up.railway.app
CORS_ORIGIN=https://classroom-mafia-production.up.railway.app
```

### 3️⃣ **빌드 설정 확인**
"Settings" → "Build" 탭에서:
- ✅ Build Command: `npm run install:all && npm run build`
- ✅ Start Command: `cd server && node dist/index.js`

### 4️⃣ **커스텀 도메인 설정**
"Settings" → "Domains" 탭에서:
- "Custom Domain" 클릭
- `classroom-mafia-production.up.railway.app` 입력

### 5️⃣ **배포 시작**
- 자동으로 배포가 시작됩니다
- "Deployments" 탭에서 진행 상황 확인

## 🔍 배포 성공 확인

### 로그에서 확인할 메시지:
```
✅ "Server is running on port 3001"
✅ "Socket.IO settings:"
✅ "- Max connections per IP: 30"
```

### 브라우저 테스트:
1. https://classroom-mafia-production.up.railway.app 접속
2. "마피아 게임" 제목 확인
3. "방 만들기" 버튼 클릭 테스트

## 🚨 문제 해결

### 빌드 실패 시:
- "Deployments" → 실패한 배포 → "View Logs" 확인
- 주로 환경변수 누락이나 빌드 명령어 오류

### 앱 접속 안 될 시:
- 도메인 설정 재확인
- 환경변수 URL들이 정확한지 확인
- 포트 3001 설정 확인

## 🎮 배포 완료 후

Korean Mafia Game이 성공적으로 배포되면:
- ✅ 20명 동시 접속 가능
- ✅ 실시간 게임 진행
- ✅ 모바일 최적화 UI
- ✅ 18가지 역할 시스템

교실에서 바로 사용할 수 있습니다!