#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('🧪 스냅샷 API 로컬 테스트 시작...\n')

// .env.local에서 CRON_SECRET 읽기
const envPath = path.join(__dirname, '.env.local')
let cronSecret = null

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const match = envContent.match(/^CRON_SECRET=(.+)$/m)
  if (match) {
    cronSecret = match[1].replace(/^["']|["']$/g, '')
  }
}

if (!cronSecret) {
  console.log('⚠️  CRON_SECRET이 설정되지 않았습니다.')
  console.log('   테스트용 임시 시크릿을 사용합니다.\n')
  cronSecret = 'test-secret-123'
} else {
  console.log(`🔑 시크릿: ${cronSecret.substring(0, 10)}...\n`)
}

// API 호출
const apiUrl = 'http://localhost:3000/api/cron/daily-snapshot'
console.log(`📍 API 주소: ${apiUrl}`)
console.log('🔄 API 호출 중...\n')

try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cronSecret}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()

  console.log(`📊 응답 상태: ${response.status}\n`)
  console.log('📦 응답 내용:')
  console.log(JSON.stringify(data, null, 2))
  console.log()

  if (response.ok) {
    console.log('✅ 테스트 성공!')
    if (data.stats) {
      console.log('\n📈 통계:')
      console.log(`   총 사용자: ${data.stats.totalUsers}`)
      console.log(`   성공: ${data.stats.successCount}`)
      console.log(`   실패: ${data.stats.errorCount}`)
    }
  } else {
    console.log(`❌ 테스트 실패! (HTTP ${response.status})`)
    process.exit(1)
  }
} catch (error) {
  console.error('❌ 오류 발생:', error.message)
  process.exit(1)
}
