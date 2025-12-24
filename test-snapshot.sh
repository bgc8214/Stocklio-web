#!/bin/bash

# 스냅샷 API 로컬 테스트 스크립트
echo "🧪 스냅샷 API 로컬 테스트 시작..."

# .env.local에서 CRON_SECRET 읽기
if [ -f .env.local ]; then
  CRON_SECRET=$(grep "^CRON_SECRET=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

# CRON_SECRET이 없으면 경고
if [ -z "$CRON_SECRET" ]; then
  echo "⚠️  CRON_SECRET이 설정되지 않았습니다."
  echo "    테스트용 임시 시크릿을 사용합니다."
  CRON_SECRET="test-secret-123"
fi

# 로컬 개발 서버 주소
API_URL="http://localhost:3000/api/cron/daily-snapshot"

echo ""
echo "📍 API 주소: $API_URL"
echo "🔑 시크릿: ${CRON_SECRET:0:10}..."
echo ""
echo "🔄 API 호출 중..."
echo ""

# API 호출
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

# 응답 분리
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "📊 응답 상태: $http_code"
echo ""
echo "📦 응답 내용:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" -eq 200 ]; then
  echo "✅ 테스트 성공!"
else
  echo "❌ 테스트 실패! (HTTP $http_code)"
fi
