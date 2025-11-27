# MyFolio Web Version - 기술 명세서 (Technical Specification)

> Next.js + shadcn/ui + Tailwind CSS 기반 포트폴리오 관리 웹 애플리케이션 기술 구현 가이드

---

## 1. 기술 스택

### 1.1 Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x | React 프레임워크 (App Router) |
| React | 18.x | UI 라이브러리 |
| TypeScript | 5.x | 타입 안전성 |
| Tailwind CSS | 3.x | 유틸리티 CSS 프레임워크 |
| shadcn/ui | latest | UI 컴포넌트 라이브러리 |
| Radix UI | latest | 접근성 높은 Headless UI |
| Recharts | 2.x | 차트 시각화 |
| Lucide React | latest | 아이콘 |

### 1.2 상태 관리 & 데이터 패칭

| 기술 | 용도 |
|------|------|
| Zustand | 전역 상태 관리 |
| TanStack Query (React Query) | 서버 상태 관리 & 캐싱 |
| SWR | 실시간 데이터 업데이트 (대안) |

### 1.3 Backend (Firebase)

| 서비스 | 용도 |
|--------|------|
| Firebase Authentication | 사용자 인증 (이메일, Google) |
| Cloud Firestore | 실시간 NoSQL 데이터베이스 |
| Firebase Storage | 파일 저장 (프로필 이미지) |
| Vercel | 웹 호스팅 & 배포 |

### 1.4 API & 데이터

| API | 용도 |
|-----|------|
| Yahoo Finance API | 주식 시세 조회 |
| KRW=X (Yahoo) | USD/KRW 환율 |

---

## 2. 프로젝트 구조

### 2.1 디렉토리 구조

```
myfolio-web/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (auth)/                       # 인증 라우트 그룹
│   │   │   ├── login/
│   │   │   │   └── page.tsx             # 로그인 페이지
│   │   │   ├── signup/
│   │   │   │   └── page.tsx             # 회원가입 페이지
│   │   │   └── layout.tsx               # 인증 레이아웃
│   │   │
│   │   ├── (dashboard)/                  # 대시보드 라우트 그룹 (인증 필요)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx             # 메인 대시보드
│   │   │   ├── portfolio/
│   │   │   │   └── page.tsx             # 전체 종목 목록
│   │   │   ├── categories/
│   │   │   │   └── page.tsx             # 카테고리 관리
│   │   │   ├── rebalancing/
│   │   │   │   └── page.tsx             # 리밸런싱
│   │   │   ├── reports/
│   │   │   │   └── [month]/
│   │   │   │       └── page.tsx         # 월간 리포트
│   │   │   ├── dividends/
│   │   │   │   └── page.tsx             # 배당 캘린더
│   │   │   ├── fire/
│   │   │   │   └── page.tsx             # FIRE 시뮬레이터
│   │   │   ├── journals/
│   │   │   │   ├── page.tsx             # 투자 일지 목록
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # 일지 상세/수정
│   │   │   ├── settings/
│   │   │   │   └── page.tsx             # 설정
│   │   │   └── layout.tsx               # 대시보드 레이아웃 (사이드바)
│   │   │
│   │   ├── api/                          # API Routes
│   │   │   ├── auth/
│   │   │   │   └── route.ts             # 인증 API
│   │   │   ├── stocks/
│   │   │   │   ├── search/
│   │   │   │   │   └── route.ts         # 종목 검색
│   │   │   │   └── price/
│   │   │   │       └── route.ts         # 현재가 조회
│   │   │   └── exchange-rate/
│   │   │       └── route.ts             # 환율 조회
│   │   │
│   │   ├── layout.tsx                    # 루트 레이아웃
│   │   ├── page.tsx                      # 랜딩 페이지
│   │   ├── globals.css                   # Tailwind CSS
│   │   └── providers.tsx                 # Context Providers
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...                      # 기타 shadcn 컴포넌트
│   │   │
│   │   ├── layouts/
│   │   │   ├── sidebar.tsx              # 사이드바
│   │   │   ├── header.tsx               # 헤더
│   │   │   └── mobile-nav.tsx           # 모바일 네비게이션
│   │   │
│   │   ├── dashboard/
│   │   │   ├── hero-card.tsx            # 총 자산 카드
│   │   │   ├── profit-chart.tsx         # 수익 추이 차트
│   │   │   ├── portfolio-table.tsx      # 종목 테이블
│   │   │   └── category-pie-chart.tsx   # 카테고리 파이 차트
│   │   │
│   │   ├── portfolio/
│   │   │   ├── stock-search-dialog.tsx  # 종목 검색 모달
│   │   │   ├── add-stock-form.tsx       # 종목 추가 폼
│   │   │   └── stock-card.tsx           # 종목 카드
│   │   │
│   │   └── common/
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts                # Firebase 설정
│   │   │   ├── auth.ts                  # Authentication 헬퍼
│   │   │   ├── firestore.ts             # Firestore 헬퍼
│   │   │   └── converter.ts             # Firestore 컨버터
│   │   │
│   │   ├── api/
│   │   │   ├── yahoo-finance.ts         # Yahoo Finance API
│   │   │   └── exchange-rate.ts         # 환율 API
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-auth.ts              # 인증 훅
│   │   │   ├── use-portfolio.ts         # 포트폴리오 훅
│   │   │   ├── use-snapshots.ts         # 스냅샷 훅
│   │   │   └── use-media-query.ts       # 반응형 훅
│   │   │
│   │   ├── stores/
│   │   │   ├── auth-store.ts            # 인증 상태 (Zustand)
│   │   │   ├── portfolio-store.ts       # 포트폴리오 상태
│   │   │   └── theme-store.ts           # 테마 상태
│   │   │
│   │   └── utils/
│   │       ├── currency.ts              # 통화 포맷
│   │       ├── date.ts                  # 날짜 포맷
│   │       ├── validators.ts            # 유효성 검사
│   │       └── cn.ts                    # className 유틸리티
│   │
│   └── types/
│       ├── portfolio.ts                 # 포트폴리오 타입
│       ├── user.ts                      # 사용자 타입
│       ├── stock.ts                     # 주식 타입
│       └── snapshot.ts                  # 스냅샷 타입
│
├── public/
│   ├── icons/
│   └── images/
│
├── .env.local                            # 환경 변수
├── .eslintrc.json
├── components.json                       # shadcn/ui 설정
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. 설치 및 초기 설정

### 3.1 프로젝트 생성

```bash
# Next.js 프로젝트 생성
npx create-next-app@latest myfolio-web --typescript --tailwind --app --src-dir

# 프로젝트 디렉토리 이동
cd myfolio-web

# shadcn/ui 초기화
npx shadcn-ui@latest init
```

**shadcn/ui 설정 옵션:**
```
✔ Would you like to use TypeScript? … yes
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Where is your global CSS file? … src/app/globals.css
✔ Would you like to use CSS variables for colors? … yes
✔ Where is your tailwind.config.js located? … tailwind.config.ts
✔ Configure the import alias for components: … @/components
✔ Configure the import alias for utils: … @/lib/utils
```

### 3.2 필요한 패키지 설치

```bash
# UI 컴포넌트
npx shadcn-ui@latest add button card dialog dropdown-menu input label table tabs toast

# 상태 관리
npm install zustand @tanstack/react-query

# Firebase
npm install firebase

# 차트
npm install recharts

# 아이콘
npm install lucide-react

# 유틸리티
npm install clsx tailwind-merge date-fns zod react-hook-form
npm install @hookform/resolvers

# 개발 도구
npm install -D @types/node
```

### 3.3 환경 변수 설정

**`.env.local`**
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Yahoo Finance API (프록시용)
YAHOO_FINANCE_API_URL=https://query1.finance.yahoo.com
```

---

## 4. Tailwind CSS 설정

### 4.1 tailwind.config.ts

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 커스텀 색상 (MyFolio 브랜드)
        profit: {
          DEFAULT: '#4CAF50',
          light: '#81C784',
        },
        loss: {
          DEFAULT: '#F44336',
          light: '#E57373',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // 반응형 브레이크포인트
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### 4.2 globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* 커스텀 스크롤바 */
@layer utilities {
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

## 5. TypeScript 타입 정의

### 5.1 Portfolio 타입

**`src/types/portfolio.ts`**
```typescript
export interface Portfolio {
  id: string
  ticker: string
  name: string
  quantity: number
  averageCost: number
  currentPrice: number
  market: 'KRX' | 'US'
  categoryId?: number
  createdAt: Date
  updatedAt: Date
}

export interface PortfolioWithProfit extends Portfolio {
  marketValue: number
  investment: number
  profit: number
  profitRate: number
}

export interface Category {
  id: number
  name: string
  targetWeight: number
  color: string
}

export interface DailySnapshot {
  id: string
  date: Date
  totalValue: number
  totalInvestment: number
  totalProfit: number
  dailyProfit: number
  createdAt: Date
}
```

### 5.2 User 타입

**`src/types/user.ts`**
```typescript
export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  lastLoginAt: Date
}
```

---

## 6. Firebase 설정

### 6.1 Firebase 초기화

**`src/lib/firebase/config.ts`**
```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase 싱글톤
let app: FirebaseApp
let auth: Auth
let firestore: Firestore
let storage: FirebaseStorage

if (!getApps().length) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  firestore = getFirestore(app)
  storage = getStorage(app)
} else {
  app = getApps()[0]
  auth = getAuth(app)
  firestore = getFirestore(app)
  storage = getStorage(app)
}

export { app, auth, firestore, storage }
```

### 6.2 Firestore 헬퍼

**`src/lib/firebase/firestore.ts`**
```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreDataConverter,
} from 'firebase/firestore'
import { firestore } from './config'
import { Portfolio, DailySnapshot } from '@/types/portfolio'

// Portfolio Converter
export const portfolioConverter: FirestoreDataConverter<Portfolio> = {
  toFirestore: (portfolio: Portfolio): DocumentData => ({
    ticker: portfolio.ticker,
    name: portfolio.name,
    quantity: portfolio.quantity,
    averageCost: portfolio.averageCost,
    currentPrice: portfolio.currentPrice,
    market: portfolio.market,
    categoryId: portfolio.categoryId,
    createdAt: Timestamp.fromDate(portfolio.createdAt),
    updatedAt: Timestamp.fromDate(portfolio.updatedAt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot): Portfolio => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ticker: data.ticker,
      name: data.name,
      quantity: data.quantity,
      averageCost: data.averageCost,
      currentPrice: data.currentPrice,
      market: data.market,
      categoryId: data.categoryId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  },
}

// Portfolio CRUD
export async function getPortfolios(userId: string): Promise<Portfolio[]> {
  const q = query(
    collection(firestore, 'portfolios', userId, 'stocks'),
    orderBy('createdAt', 'desc')
  ).withConverter(portfolioConverter)

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data())
}

export async function addPortfolio(
  userId: string,
  portfolio: Omit<Portfolio, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(firestore, 'portfolios', userId, 'stocks').withConverter(
      portfolioConverter
    ),
    portfolio as Portfolio
  )
  return ref.id
}

export async function updatePortfolio(
  userId: string,
  portfolioId: string,
  data: Partial<Portfolio>
): Promise<void> {
  const ref = doc(firestore, 'portfolios', userId, 'stocks', portfolioId)
  await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deletePortfolio(
  userId: string,
  portfolioId: string
): Promise<void> {
  const ref = doc(firestore, 'portfolios', userId, 'stocks', portfolioId)
  await deleteDoc(ref)
}
```

---

## 7. 인증 구현

### 7.1 Auth Hook

**`src/lib/hooks/use-auth.ts`**
```typescript
'use client'

import { useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    router.push('/login')
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }
}

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return '사용자를 찾을 수 없습니다'
    case 'auth/wrong-password':
      return '비밀번호가 틀렸습니다'
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다'
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다 (최소 6자)'
    case 'auth/invalid-email':
      return '올바른 이메일 형식이 아닙니다'
    default:
      return '인증 오류가 발생했습니다'
  }
}
```

### 7.2 로그인 페이지

**`src/app/(auth)/login/page.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google 로그인 실패',
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
          <CardDescription>
            이메일과 비밀번호를 입력하여 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            Google로 로그인
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 8. 대시보드 레이아웃

### 8.1 사이드바 컴포넌트

**`src/components/layouts/sidebar.tsx`**
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  BarChart3,
  Calendar,
  TrendingUp,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '포트폴리오', href: '/portfolio', icon: Wallet },
  { name: '카테고리', href: '/categories', icon: PieChart },
  { name: '리밸런싱', href: '/rebalancing', icon: BarChart3 },
  { name: '월간 리포트', href: '/reports', icon: Calendar },
  { name: '배당 캘린더', href: '/dividends', icon: TrendingUp },
  { name: 'FIRE 계산기', href: '/fire', icon: TrendingUp },
  { name: '투자 일지', href: '/journals', icon: BookOpen },
  { name: '설정', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* 로고 */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600" />
          <span className="text-xl font-bold">MyFolio</span>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          로그아웃
        </Button>
      </div>
    </div>
  )
}
```

### 8.2 대시보드 레이아웃

**`src/app/(dashboard)/layout.tsx`**
```typescript
import { Sidebar } from '@/components/layouts/sidebar'
import { Header } from '@/components/layouts/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바 (데스크톱) */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## 9. API Routes (Yahoo Finance 프록시)

### 9.1 주식 가격 조회 API

**`src/app/api/stocks/price/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { next: { revalidate: 60 } } // 1분 캐싱
    )

    if (!response.ok) {
      throw new Error('Failed to fetch stock price')
    }

    const data = await response.json()
    const result = data.chart.result[0]
    const meta = result.meta

    return NextResponse.json({
      ticker,
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent:
        ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) *
        100,
    })
  } catch (error) {
    console.error('Error fetching stock price:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock price' },
      { status: 500 }
    )
  }
}
```

### 9.2 환율 조회 API

**`src/app/api/exchange-rate/route.ts`**
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d&range=1d',
      { next: { revalidate: 3600 } } // 1시간 캐싱
    )

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate')
    }

    const data = await response.json()
    const result = data.chart.result[0]
    const meta = result.meta

    return NextResponse.json({
      rate: meta.regularMarketPrice,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    )
  }
}
```

---

## 10. 배포

### 10.1 Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

### 10.2 환경 변수 설정 (Vercel)

Vercel 대시보드 → Settings → Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

---

## 11. 개발 워크플로우

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run start

# Lint 검사
npm run lint

# TypeScript 타입 체크
npm run type-check
```

---

**End of Technical Specification**
