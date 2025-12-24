#!/usr/bin/env node

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('🔍 Firestore 데이터 확인 중...\n')

// .env.local에서 Firebase 설정 읽기
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match ? match[1].replace(/^["']|["']$/g, '') : null
}

const firebaseConfig = {
  apiKey: getEnvValue('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvValue('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvValue('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvValue('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvValue('NEXT_PUBLIC_FIREBASE_APP_ID'),
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// 데이터 조회
async function checkData() {
  try {
    // 1. 포트폴리오 확인
    console.log('📊 포트폴리오 데이터:')
    const portfoliosRef = collection(db, 'portfolios')
    const portfoliosSnapshot = await getDocs(portfoliosRef)

    console.log(`   총 ${portfoliosSnapshot.size}개의 포트폴리오\n`)

    if (portfoliosSnapshot.empty) {
      console.log('   ⚠️  포트폴리오가 없습니다!\n')
    } else {
      portfoliosSnapshot.forEach((doc) => {
        const data = doc.data()
        console.log(`   - ${data.ticker} (${data.name})`)
        console.log(`     수량: ${data.quantity}, 평균가: ${data.averageCost}, 현재가: ${data.currentPrice}`)
        console.log(`     시장: ${data.market}, userId: ${data.userId}`)
      })
      console.log()
    }

    // 2. 스냅샷 확인
    console.log('📸 스냅샷 데이터:')
    const snapshotsRef = collection(db, 'snapshots')
    const snapshotsQuery = query(snapshotsRef, orderBy('date', 'desc'), limit(5))
    const snapshotsSnapshot = await getDocs(snapshotsQuery)

    console.log(`   총 ${snapshotsSnapshot.size}개의 최근 스냅샷\n`)

    if (snapshotsSnapshot.empty) {
      console.log('   ⚠️  스냅샷이 없습니다!\n')
    } else {
      snapshotsSnapshot.forEach((doc) => {
        const data = doc.data()
        const date = data.date?.toDate ? data.date.toDate() : new Date(data.date)
        console.log(`   - 날짜: ${date.toISOString().split('T')[0]}`)
        console.log(`     총 자산: ₩${data.totalAssets?.toLocaleString() || 0}`)
        console.log(`     총 투자금: ₩${data.totalInvestment?.toLocaleString() || 0}`)
        console.log(`     수익: ₩${data.totalProfit?.toLocaleString() || 0} (${data.profitRate || 0}%)`)
        console.log(`     포트폴리오 수: ${data.portfolioCount || 0}`)
        console.log(`     userId: ${data.userId}`)
        console.log()
      })
    }

    // 3. 사용자 확인
    console.log('👤 사용자 데이터:')
    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(usersRef)

    console.log(`   총 ${usersSnapshot.size}명의 사용자\n`)

    if (usersSnapshot.empty) {
      console.log('   ⚠️  사용자가 없습니다!\n')
    } else {
      usersSnapshot.forEach((doc) => {
        const data = doc.data()
        console.log(`   - UID: ${doc.id}`)
        console.log(`     이메일: ${data.email}`)
        console.log(`     이름: ${data.displayName || 'N/A'}`)
      })
      console.log()
    }

    console.log('✅ 데이터 확인 완료!')
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

checkData()
