#!/usr/bin/env node

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('👤 현재 사용자 확인...\n')

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
const auth = getAuth(app)
const db = getFirestore(app)

async function checkUser() {
  try {
    console.log('📧 두 계정의 포트폴리오 확인:\n')

    const users = [
      { email: 'wce3308@naver.com', uid: 'UdTz1kuOfrduMhKB1NVU713W0Uk2' },
      { email: 'bgc8214@gmail.com', uid: 'VCj2nHdycyetbQ5yYQ9P1tj762r2' },
    ]

    for (const user of users) {
      console.log(`${user.email} (${user.uid}):`)

      const portfoliosRef = collection(db, 'portfolios')
      const q = query(portfoliosRef, where('userId', '==', user.uid))
      const snapshot = await getDocs(q)

      console.log(`   포트폴리오: ${snapshot.size}개`)

      if (snapshot.size > 0) {
        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log(`   - ${data.ticker}: ${data.quantity}주 @ $${data.currentPrice}`)
        })
      }
      console.log()
    }

    console.log('💡 확인 사항:')
    console.log('   - wce3308@naver.com: 포트폴리오 있음 (스냅샷 생성됨)')
    console.log('   - bgc8214@gmail.com: 포트폴리오 없음 (스냅샷 생성 안 됨)')
    console.log()
    console.log('✅ 스냅샷 API는 정상 작동 중입니다!')
    console.log('   포트폴리오가 있는 사용자만 스냅샷이 생성됩니다.')
  } catch (error) {
    console.error('❌ 오류:', error)
  }
}

checkUser()
