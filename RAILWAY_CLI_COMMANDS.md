# 🚄 Railway CLI 완전 가이드

Railway CLI를 사용하면 터미널에서 직접 배포를 관리할 수 있습니다.

## 🔧 초기 설정

### 1. 로그인
```bash
railway login
```
- 브라우저가 열리며 GitHub 계정으로 로그인

### 2. 프로젝트 연결
```bash
railway link
```
- 계정: `JihunKong` 선택
- 프로젝트: `classroom-mafia` 선택

## ⚙️ 환경변수 관리

### 일괄 설정
```bash
railway variables set \
  PORT=3001 \
  NODE_ENV=production \
  CLIENT_URL=https://classroom-mafia-production.up.railway.app \
  VITE_SERVER_URL=https://classroom-mafia-production.up.railway.app \
  VITE_SOCKET_URL=https://classroom-mafia-production.up.railway.app \
  CORS_ORIGIN=https://classroom-mafia-production.up.railway.app
```

### 개별 설정
```bash
railway variables set SESSION_SECRET=your-random-secret
railway variables set TEACHER_PASSWORD=secure-password
```

### 환경변수 확인
```bash
railway variables          # 모든 환경변수 보기
railway variables get PORT  # 특정 변수 확인
```

## 🚀 배포 관리

### 즉시 배포
```bash
railway up
```

### GitHub에서 자동 배포
```bash
railway redeploy  # 강제 재배포
```

### 배포 상태 확인
```bash
railway status    # 프로젝트 상태
railway domain    # 도메인 정보
```

## 📊 로그 및 모니터링

### 실시간 로그
```bash
railway logs --follow
```

### 최근 로그
```bash
railway logs --tail 100
```

### 특정 서비스 로그
```bash
railway logs --service web
```

## 🔧 고급 기능

### 컨테이너 쉘 접속
```bash
railway shell
```

### 로컬에서 Railway 환경변수 사용
```bash
railway run npm start
```

### 프로젝트 정보
```bash
railway whoami     # 현재 사용자
railway projects   # 프로젝트 목록
```

## 🎯 Korean Mafia Game 배포 워크플로우

### 완전 자동 배포
```bash
# 1. 로그인 및 연결
railway login
railway link

# 2. 환경변수 설정
railway variables set PORT=3001 NODE_ENV=production CLIENT_URL=https://classroom-mafia-production.up.railway.app VITE_SERVER_URL=https://classroom-mafia-production.up.railway.app VITE_SOCKET_URL=https://classroom-mafia-production.up.railway.app CORS_ORIGIN=https://classroom-mafia-production.up.railway.app

# 3. 배포 및 로그 확인
railway up
railway logs --follow

# 4. 앱 열기
railway open
```

### 문제 해결
```bash
# 재배포
railway redeploy

# 로그 확인
railway logs --tail 200

# 환경변수 재설정
railway variables unset CLIENT_URL
railway variables set CLIENT_URL=https://classroom-mafia-production.up.railway.app
```

## 💡 팁

- `railway logs --follow`로 실시간 배포 상황 모니터링
- 환경변수 변경 시 자동으로 재배포됨
- `railway open`으로 바로 앱 접속 가능
- GitHub 푸시 시 자동 배포 트리거됨