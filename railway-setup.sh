#!/bin/bash

echo "🚄 Railway CLI 설정 스크립트"
echo "==========================="
echo ""
echo "다음 명령어들을 터미널에서 차례대로 실행하세요:"
echo ""

echo "1️⃣ Railway 로그인 (브라우저가 열립니다)"
echo "railway login"
echo ""

echo "2️⃣ 프로젝트에 연결"
echo "railway link"
echo "   → JihunKong을 선택"
echo "   → classroom-mafia 프로젝트 선택"
echo ""

echo "3️⃣ 환경변수 일괄 설정"
echo "railway variables set PORT=3001 NODE_ENV=production CLIENT_URL=https://classroom-mafia-production.up.railway.app VITE_SERVER_URL=https://classroom-mafia-production.up.railway.app VITE_SOCKET_URL=https://classroom-mafia-production.up.railway.app CORS_ORIGIN=https://classroom-mafia-production.up.railway.app"
echo ""

echo "4️⃣ 즉시 배포"
echo "railway up"
echo ""

echo "5️⃣ 실시간 로그 확인"
echo "railway logs --follow"
echo ""

echo "6️⃣ 배포 완료 후 앱 열기"
echo "railway open"
echo ""

echo "📋 추가 유용한 명령어:"
echo "- railway status           # 프로젝트 상태 확인"
echo "- railway variables        # 환경변수 목록"
echo "- railway redeploy         # 강제 재배포"
echo "- railway domain           # 도메인 정보"
echo "- railway logs --tail 100  # 최근 100줄 로그"