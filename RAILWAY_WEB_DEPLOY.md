# 🌐 Railway 웹 대시보드 배포 가이드

CLI에서 대화형 모드 문제가 발생하여 웹 대시보드를 통한 배포를 안내합니다.

## 🚀 Railway 웹 배포 단계

### 1️⃣ Railway 대시보드 접속
- https://railway.app/dashboard 접속
- Korean_Teacher_K 계정으로 로그인 확인

### 2️⃣ 새 프로젝트 생성
- "New Project" 클릭
- "Deploy from GitHub repo" 선택
- `JihunKong/classroom-mafia` 저장소 선택

### 3️⃣ 환경변수 설정
프로젝트 생성 후 "Variables" 탭에서 다음 환경변수 추가:

```bash
PORT=3001
NODE_ENV=production
CLIENT_URL=https://classroom-mafia-production.up.railway.app
VITE_SERVER_URL=https://classroom-mafia-production.up.railway.app
VITE_SOCKET_URL=https://classroom-mafia-production.up.railway.app
CORS_ORIGIN=https://classroom-mafia-production.up.railway.app
```

### 4️⃣ 도메인 설정
- "Settings" → "Domains" 탭
- "Generate Domain" 클릭하여 Railway 도메인 생성
- 또는 "Custom Domain"에서 원하는 도메인 설정

### 5️⃣ 배포 확인
- "Deployments" 탭에서 배포 상태 확인
- 로그에서 "Server is running on port 3001" 메시지 확인

## 🎯 자동 배포 설정

### GitHub 연동
- "Settings" → "Source" 탭
- "Branch": main
- "Auto Deploy": 활성화
- GitHub에 푸시할 때마다 자동 재배포

### 빌드 설정 확인
- Build Command: `npm run install:all && npm run build`
- Start Command: `cd server && node dist/index.js`

## 📊 배포 후 테스트

### 1. 기본 기능 테스트
```bash
curl https://[your-domain]/health
```

### 2. 웹 앱 테스트
- 브라우저에서 앱 URL 접속
- "방 만들기" 기능 테스트
- 다른 기기에서 참여 코드로 입장 테스트

## 🔧 Railway CLI 대안 명령어

터미널에서 다음 명령어로 상태 확인 가능:

```bash
# 현재 연결된 프로젝트 확인
railway status

# 로그 확인 (웹 서비스로 전환 후)
railway logs

# 도메인 확인
railway domain

# 앱 열기
railway open
```

## 💡 성공적인 배포를 위한 체크리스트

- ✅ GitHub 저장소 연결 완료
- ✅ 환경변수 모두 설정 완료  
- ✅ 빌드 스크립트 정상 작동
- ✅ `dist/index.js` 파일 생성 확인
- ✅ 포트 3001 설정 확인
- ✅ 도메인 접속 가능 확인

Railway 웹 대시보드를 통해 안정적으로 배포할 수 있습니다!