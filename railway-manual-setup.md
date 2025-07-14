# 🚄 Railway 수동 설정 가이드

현재 상황: Railway CLI에 로그인되어 있음 (Korean_Teacher_K)

## 📋 사용 가능한 프로젝트:
- fabulous-passion
- miraculous-rebirth  
- exciting-appreciation

## 🎯 다음 단계 (터미널에서 실행):

### 옵션 1: 새 프로젝트 생성
```bash
railway init
# 프로젝트명: classroom-mafia
```

### 옵션 2: 기존 프로젝트 사용
```bash
railway link
# 원하는 프로젝트 선택 (예: fabulous-passion)
```

### 환경변수 설정
```bash
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set CLIENT_URL=https://classroom-mafia-production.up.railway.app
railway variables set VITE_SERVER_URL=https://classroom-mafia-production.up.railway.app
railway variables set VITE_SOCKET_URL=https://classroom-mafia-production.up.railway.app
railway variables set CORS_ORIGIN=https://classroom-mafia-production.up.railway.app
```

### 배포 실행
```bash
railway up
```

### 실시간 로그 확인
```bash
railway logs --follow
```

### 앱 열기
```bash
railway open
```

## 💡 참고사항
- Railway CLI는 대화형 모드가 필요한 명령들이 있어 터미널에서 직접 실행이 필요합니다
- GitHub 연동은 Railway 웹 대시보드에서 설정 가능합니다