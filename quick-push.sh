#!/bin/bash

echo "🚀 Korean Mafia Game - GitHub 푸시 스크립트"
echo "=========================================="
echo ""
echo "현재 상태 확인 중..."

# 현재 브랜치 확인
BRANCH=$(git branch --show-current)
echo "✅ 현재 브랜치: $BRANCH"

# 커밋 상태 확인
COMMITS=$(git log --oneline -n 2)
echo "✅ 최근 커밋:"
echo "$COMMITS"

echo ""
echo "푸시할 준비가 되었습니다!"
echo ""
echo "다음 명령어를 복사해서 터미널에 붙여넣으세요:"
echo ""
echo "git push -u origin main"
echo ""
echo "그 다음:"
echo "1. Username 입력: JihunKong"
echo "2. Password 입력: [GitHub Token]"
echo ""
echo "푸시가 완료되면 Railway 앱 주소를 알려주세요!"