# 🚄 fabulous-passion 프로젝트 배포 가이드

현재 `fabulous-passion` 프로젝트를 사용하여 Korean Mafia Game을 배포합니다.

## 📋 터미널에서 순서대로 실행:

### 1️⃣ 프로젝트 연결
```bash
railway link fabulous-passion
```

### 2️⃣ 환경변수 설정
```bash
railway variables set PORT=3001
railway variables set NODE_ENV=production
```

### 3️⃣ 배포 실행
```bash
railway up
```

### 4️⃣ 도메인 확인 (중요!)
```bash
railway domain
```
→ 실제 앱 URL이 표시됩니다 (예: `https://fabulous-passion-production.up.railway.app`)

### 5️⃣ 도메인 기반 환경변수 업데이트
실제 도메인을 확인한 후:
```bash
railway variables set CLIENT_URL=https://[실제-도메인]
railway variables set VITE_SERVER_URL=https://[실제-도메인]
railway variables set VITE_SOCKET_URL=https://[실제-도메인]
railway variables set CORS_ORIGIN=https://[실제-도메인]
```

### 6️⃣ 재배포 (환경변수 적용)
```bash
railway redeploy
```

### 7️⃣ 실시간 로그 확인
```bash
railway logs --follow
```

### 8️⃣ 앱 열기
```bash
railway open
```

## 🎯 예상 결과

- ✅ Korean Mafia Game이 Railway에 배포됨
- ✅ 실제 도메인 URL 획득
- ✅ 20명 동시 접속 가능한 마피아 게임 서비스

## 📝 배포 후 확인사항

1. 홈페이지 로딩 확인
2. "방 만들기" 기능 테스트
3. 다른 기기에서 참여 코드로 입장 테스트
4. 6명 이상 모여서 게임 시작 테스트

Railway CLI를 통해 직접 배포 과정을 모니터링할 수 있습니다!