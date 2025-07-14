#!/bin/bash

echo "🚄 Railway CLI 사용 가이드"
echo "========================"
echo ""

echo "1. Railway 로그인:"
echo "railway login"
echo ""

echo "2. 프로젝트 연결:"
echo "railway link"
echo ""

echo "3. 환경변수 설정:"
echo "railway variables set PORT=3001"
echo "railway variables set NODE_ENV=production"
echo "railway variables set CLIENT_URL=https://classroom-mafia-production.up.railway.app"
echo "railway variables set VITE_SERVER_URL=https://classroom-mafia-production.up.railway.app"
echo "railway variables set VITE_SOCKET_URL=https://classroom-mafia-production.up.railway.app"
echo "railway variables set CORS_ORIGIN=https://classroom-mafia-production.up.railway.app"
echo ""

echo "4. 배포하기:"
echo "railway up"
echo ""

echo "5. 로그 확인:"
echo "railway logs"
echo ""

echo "6. 프로젝트 상태 확인:"
echo "railway status"
echo ""

echo "7. 도메인 확인:"
echo "railway domain"
echo ""

echo "8. 서비스 열기:"
echo "railway open"
echo ""

echo "💡 유용한 명령어들:"
echo "- railway variables: 환경변수 목록 보기"
echo "- railway variables unset KEY: 환경변수 삭제"
echo "- railway redeploy: 강제 재배포"
echo "- railway shell: 컨테이너 쉘 접속"