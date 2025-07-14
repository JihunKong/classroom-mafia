#!/bin/bash

echo "🚄 Railway CLI - fabulous-passion 프로젝트 배포"
echo "=============================================="
echo ""

echo "현재 상태:"
railway status
echo ""

echo "📋 배포 명령어들 (터미널에서 실행):"
echo ""

echo "1. fabulous-passion 프로젝트에 연결:"
echo "railway link fabulous-passion"
echo ""

echo "2. 환경변수 설정:"
echo "railway variables set PORT=3001"
echo "railway variables set NODE_ENV=production"
echo "railway variables set CLIENT_URL=https://fabulous-passion-production.up.railway.app"
echo "railway variables set VITE_SERVER_URL=https://fabulous-passion-production.up.railway.app"
echo "railway variables set VITE_SOCKET_URL=https://fabulous-passion-production.up.railway.app"
echo "railway variables set CORS_ORIGIN=https://fabulous-passion-production.up.railway.app"
echo ""

echo "3. 배포 실행:"
echo "railway up"
echo ""

echo "4. 실시간 로그 확인:"
echo "railway logs --follow"
echo ""

echo "5. 도메인 확인:"
echo "railway domain"
echo ""

echo "6. 앱 열기:"
echo "railway open"
echo ""

echo "💡 참고: fabulous-passion 프로젝트의 실제 도메인은"
echo "   배포 후 'railway domain' 명령어로 확인할 수 있습니다."