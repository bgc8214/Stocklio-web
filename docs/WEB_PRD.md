# MyFolio Web - PRD (Product Requirements Document)

> 3개 카테고리 중심 포트폴리오 관리 - 앱의 핵심 경험을 웹 환경에 최적화

---

## 1. 제품 개요

### 1.1 핵심 컨셉 (앱과 동일)

**"3개 카테고리로 간단하게 관리하는 포트폴리오"**

- **나스닥 100** - 미국 대표 기술주
- **S&P 500** - 미국 대형주 지수
- **배당주** - 안정적인 배당 수익

사용자는 보유 주식을 이 3개 카테고리로 분류하고, 각 카테고리별 목표 금액(예: 1억 모으기)을 설정하여 추적합니다.

### 1.2 웹 버전의 목표

✅ **기존 앱 기능 유지:**
- 3개 카테고리 탭 구조
- 카테고리별 목표 설정 및 진행률 추적
- 일별/월별/연간 수익 추이 그래프
- 종목 추가/수정/삭제

✅ **웹 환경 최적화:**
- 넓은 화면 활용 (사이드바 네비게이션)
- 한 화면에 더 많은 정보 표시
- 키보드 단축키 지원
- 테이블 기반 종목 관리 (정렬, 필터링)
- 반응형 레이아웃 (데스크톱/태블릿/모바일)

---

## 2. 화면 구조

### 2.1 레이아웃 (데스크톱)

```
┌────────────────────────────────────────────────────────────┐
│ [🏠 MyFolio]                    [🔔 알림] [👤 프로필]      │
├───────────┬────────────────────────────────────────────────┤
│           │                                                │
│ [사이드바] │           [메인 콘텐츠]                         │
│           │                                                │
│ 대시보드   │  ┌────────────────────────────────────────┐   │
│ 📊        │  │ 히어로 카드: 총 자산                    │   │
│           │  │ ₩52,345,678 (+12.3%)                  │   │
│ 나스닥100  │  └────────────────────────────────────────┘   │
│ 📈        │                                                │
│           │  ┌────────────────────────────────────────┐   │
│ S&P 500   │  │ 수익 추이 차트 (일/월/연)              │   │
│ 📊        │  │ [1개월] [3개월] [6개월] [1년] [전체]   │   │
│           │  └────────────────────────────────────────┘   │
│ 배당주     │                                                │
│ 💰        │  ┌────────────────────────────────────────┐   │
│           │  │ 카테고리별 자산 배분 (원형 차트)        │   │
│ 리밸런싱   │  └────────────────────────────────────────┘   │
│ ⚖️        │                                                │
│           │  ┌────────────────────────────────────────┐   │
│ 월간리포트 │  │ 보유 종목 목록 (테이블)                │   │
│ 📅        │  │ 티커 | 종목명 | 수량 | 평단가 | 수익  │   │
│           │  └────────────────────────────────────────┘   │
│           │                                                │
└───────────┴────────────────────────────────────────────────┘
```

### 2.2 모바일 레이아웃

```
┌────────────────────────────┐
│ [🏠 MyFolio]    [👤]       │
├────────────────────────────┤
│                            │
│  히어로 카드                 │
│  ₩52,345,678              │
│  +12.3%                   │
│                            │
├────────────────────────────┤
│                            │
│  수익 추이 차트              │
│  (세로 스크롤)              │
│                            │
├────────────────────────────┤
│                            │
│  카테고리 배분               │
│                            │
├────────────────────────────┤
│                            │
│  보유 종목 목록              │
│  (카드형)                   │
│                            │
└────────────────────────────┘
│                            │
│ [대시보드] [나스닥] [S&P]   │  ← 하단 네비게이션
│ [배당주] [설정]             │
└────────────────────────────┘
```

---

## 3. 핵심 화면 상세 설계

### 3.1 대시보드 (메인)

#### 3.1.1 히어로 카드 (총 자산 요약)

앱과 동일한 정보, 웹에 맞게 레이아웃 조정:

```tsx
// components/hero-asset-card.tsx
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function HeroAssetCard({
  totalAsset,
  totalProfit,
  profitRate,
  todayProfit,
  todayProfitRate
}) {
  return (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <CardContent className="p-6">
        <div className="text-sm opacity-90">총 자산</div>
        <div className="text-4xl font-bold mt-2">
          {formatCurrency(totalAsset)}
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            {profitRate >= 0 ? <TrendingUp /> : <TrendingDown />}
            <span className="text-lg font-semibold">
              {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
            </span>
          </div>
          <span className="text-sm opacity-90">
            ({profitRate >= 0 ? '+' : ''}{formatCurrency(totalProfit)})
          </span>
        </div>

        <div className="mt-3 text-sm opacity-75">
          오늘: {todayProfitRate >= 0 ? '+' : ''}{todayProfitRate}%
          ({todayProfitRate >= 0 ? '+' : ''}{formatCurrency(todayProfit)})
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 3.1.2 수익 추이 차트

```tsx
// components/profit-chart.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function ProfitChart({ data, period, onPeriodChange }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>수익 추이</CardTitle>
          <Tabs value={period} onValueChange={onPeriodChange}>
            <TabsList>
              <TabsTrigger value="1m">1개월</TabsTrigger>
              <TabsTrigger value="3m">3개월</TabsTrigger>
              <TabsTrigger value="6m">6개월</TabsTrigger>
              <TabsTrigger value="1y">1년</TabsTrigger>
              <TabsTrigger value="all">전체</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="dailyProfit" stroke="#ef4444" name="일일 수익" />
            <Line type="monotone" dataKey="monthlyProfit" stroke="#3b82f6" name="월 누적" />
            <Line type="monotone" dataKey="yearlyProfit" stroke="#10b981" name="연 누적" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

#### 3.1.3 카테고리별 자산 배분 (원형 차트)

```tsx
// components/category-allocation.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  nasdaq100: '#3b82f6',
  sp500: '#10b981',
  dividend: '#f59e0b'
}

export function CategoryAllocation({ categories }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>카테고리별 자산 배분</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={categories}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.id]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[cat.id] }} />
                {cat.name}
              </span>
              <span className="font-semibold">
                {cat.percentage}% ({formatCurrency(cat.value)})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 3.1.4 보유 종목 목록 (테이블)

```tsx
// components/portfolio-table.tsx
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"

export function PortfolioTable({ portfolios, onAdd, onEdit }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'ticker' | 'profit'>('ticker')

  const filtered = portfolios
    .filter(p =>
      p.stockName.toLowerCase().includes(search.toLowerCase()) ||
      p.ticker.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'profit') return b.profitRate - a.profitRate
      return a.ticker.localeCompare(b.ticker)
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="종목 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          종목 추가
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => setSortBy('ticker')} className="cursor-pointer">
                카테고리
              </TableHead>
              <TableHead>티커</TableHead>
              <TableHead>종목명</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="text-right">평단가</TableHead>
              <TableHead className="text-right">현재가</TableHead>
              <TableHead
                className="text-right cursor-pointer"
                onClick={() => setSortBy('profit')}
              >
                수익률
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((portfolio) => (
              <TableRow
                key={portfolio.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEdit(portfolio)}
              >
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    {portfolio.category.icon} {portfolio.category.name}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{portfolio.ticker}</TableCell>
                <TableCell>{portfolio.stockName}</TableCell>
                <TableCell className="text-right">{portfolio.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(portfolio.avgPrice)}</TableCell>
                <TableCell className="text-right">{formatCurrency(portfolio.currentPrice)}</TableCell>
                <TableCell className={`text-right font-semibold ${
                  portfolio.profitRate >= 0 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {portfolio.profitRate >= 0 ? '+' : ''}{portfolio.profitRate.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

---

### 3.2 카테고리 화면 (나스닥100 / S&P 500 / 배당주)

#### 3.2.1 카테고리 헤더

```tsx
// components/category-header.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Settings } from "lucide-react"

export function CategoryHeader({ category, currentValue, percentage, targetPercentage }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {category.description}
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">현재 자산</span>
            <span className="font-bold text-lg">{formatCurrency(currentValue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">비중</span>
            <span className="font-semibold">{percentage.toFixed(1)}% / 목표 {targetPercentage}%</span>
          </div>
          <Progress value={(percentage / targetPercentage) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 3.2.2 목표 진행률 카드

```tsx
// components/goal-progress-card.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Target } from "lucide-react"

export function GoalProgressCard({ category, currentValue, targetAmount, onSetGoal }) {
  // 목표 미설정
  if (!targetAmount) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">목표를 설정해보세요!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                "1억 모으기" 목표로 동기부여 받기
              </p>
              <Button onClick={onSetGoal} className="mt-4">
                목표 설정하기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 목표 설정됨
  const progress = (currentValue / targetAmount) * 100
  const remaining = targetAmount - currentValue

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">목표: {formatCurrency(targetAmount)} 모으기</h3>
          <span className="text-2xl font-bold text-primary">
            {progress.toFixed(1)}%
          </span>
        </div>

        <Progress value={progress} className="h-3 mb-4" />

        <div className="flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">현재</span>
            <p className="font-semibold mt-1">{formatCurrency(currentValue)}</p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">부족</span>
            <p className="font-semibold mt-1">{formatCurrency(remaining)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### 3.3 리밸런싱 화면

```tsx
// components/rebalancing-view.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function RebalancingView({ categories, totalAsset }) {
  const [targets, setTargets] = useState({
    nasdaq100: 50,
    sp500: 30,
    dividend: 20
  })

  const total = Object.values(targets).reduce((a, b) => a + b, 0)
  const isValid = total === 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>목표 비중 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{cat.icon} {cat.name}</span>
                <span className="font-bold">{targets[cat.id]}%</span>
              </div>
              <Slider
                value={[targets[cat.id]]}
                onValueChange={(value) => setTargets({ ...targets, [cat.id]: value[0] })}
                max={100}
                step={5}
              />
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">합계</span>
              <span className={`text-xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {total}% {isValid ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>리밸런싱 제안</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((cat) => {
              const targetAmount = totalAsset * (targets[cat.id] / 100)
              const diff = targetAmount - cat.currentValue

              return (
                <div key={cat.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{cat.icon} {cat.name}</span>
                  <span className={`font-bold ${diff >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    {diff >= 0 ? ' 매수 필요' : ' 매도 필요'}
                  </span>
                </div>
              )
            })}
          </div>

          <Button className="w-full mt-6" disabled={!isValid}>
            <Download className="h-4 w-4 mr-2" />
            리밸런싱 플랜 다운로드 (CSV)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 4. 기술 스택

### 4.1 프론트엔드

**프레임워크:** Next.js 14 (App Router)

**이유:**
- ✅ React 기반 - 풍부한 생태계
- ✅ App Router - 최신 서버 컴포넌트 지원
- ✅ 파일 기반 라우팅 (간편한 구조)
- ✅ API Routes - 백엔드 함수 내장
- ✅ SEO 최적화 (SSR/SSG)
- ✅ Vercel 배포 원클릭

**UI 라이브러리:**
- **shadcn/ui** - 복사 가능한 컴포넌트 (커스터마이징 쉬움)
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Lucide Icons** - 아이콘 (shadcn 기본 사용)

**차트 라이브러리:**
- **Recharts** - React 네이티브 차트 (반응형, 커스터마이징 쉬움)

**상태 관리:**
- **Zustand** - 간단한 전역 상태 관리
- **TanStack Query (React Query)** - 서버 상태 관리, 캐싱

**폼 관리:**
- **React Hook Form** - 고성능 폼 라이브러리
- **Zod** - 타입 안전한 스키마 검증

### 4.2 백엔드

**인증:** NextAuth.js
- 이메일/비밀번호 로그인
- Google OAuth (선택적)
- JWT 세션 관리

**데이터베이스:**
- **Prisma ORM** - 타입 안전한 ORM
- **PostgreSQL** (Vercel Postgres 또는 Supabase)

**주가 데이터 API:**
- Yahoo Finance API (무료)
- 서버 사이드에서 호출 (API 키 숨김)

**배포:**
- **Vercel** - Next.js 최적 호스팅
- **자동 CI/CD** - Git push 시 자동 배포

### 4.3 데이터베이스 스키마 (Prisma)

```prisma
// prisma/schema.prisma

model User {
  id            String      @id @default(cuid())
  email         String      @unique
  passwordHash  String
  name          String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  portfolios    Portfolio[]
  categories    Category[]
  snapshots     DailySnapshot[]
}

model Category {
  id              String      @id @default(cuid())
  userId          String
  name            String      // "나스닥100", "S&P 500", "배당주"
  icon            String
  color           String
  targetPercentage Float      @default(0)
  targetAmount    Float?
  description     String

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolios      Portfolio[]

  @@unique([userId, name])
}

model Portfolio {
  id            String      @id @default(cuid())
  userId        String
  categoryId    String
  ticker        String
  stockName     String
  quantity      Int
  averagePrice  Float
  currentPrice  Float       @default(0)
  market        String      // "US" | "KR"
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  category      Category    @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([categoryId])
}

model DailySnapshot {
  id            String      @id @default(cuid())
  userId        String
  date          DateTime    @db.Date
  totalValue    Float
  totalCost     Float
  dailyProfit   Float
  monthlyProfit Float
  yearlyProfit  Float
  createdAt     DateTime    @default(now())

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, date])
}
```

---

## 5. 프로젝트 구조

```
my-portfolio-web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                # 사이드바 레이아웃
│   │   ├── page.tsx                  # 대시보드
│   │   ├── nasdaq100/
│   │   │   └── page.tsx
│   │   ├── sp500/
│   │   │   └── page.tsx
│   │   ├── dividend/
│   │   │   └── page.tsx
│   │   ├── rebalancing/
│   │   │   └── page.tsx
│   │   └── reports/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── portfolio/
│   │   │   ├── route.ts              # GET /api/portfolio
│   │   │   └── [id]/
│   │   │       └── route.ts          # PUT, DELETE /api/portfolio/:id
│   │   ├── prices/
│   │   │   └── [ticker]/
│   │   │       └── route.ts          # GET /api/prices/:ticker
│   │   └── snapshots/
│   │       └── route.ts              # GET /api/snapshots
│   ├── layout.tsx                    # 루트 레이아웃
│   └── page.tsx                      # 랜딩 페이지
│
├── components/
│   ├── ui/                           # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   ├── hero-asset-card.tsx
│   ├── profit-chart.tsx
│   ├── category-allocation.tsx
│   ├── portfolio-table.tsx
│   ├── category-header.tsx
│   ├── goal-progress-card.tsx
│   ├── rebalancing-view.tsx
│   ├── sidebar.tsx
│   └── mobile-nav.tsx
│
├── lib/
│   ├── prisma.ts                     # Prisma 클라이언트
│   ├── auth.ts                       # NextAuth 설정
│   ├── utils.ts                      # 유틸 함수 (cn, formatCurrency 등)
│   ├── yahoo-finance.ts              # Yahoo Finance API 래퍼
│   └── validations/
│       └── portfolio.ts              # Zod 스키마
│
├── hooks/
│   ├── use-portfolio.ts              # 포트폴리오 데이터 훅
│   ├── use-categories.ts             # 카테고리 데이터 훅
│   └── use-snapshots.ts              # 스냅샷 데이터 훅
│
├── store/
│   └── use-store.ts                  # Zustand 스토어
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── favicon.ico
│   └── og-image.png
│
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 6. 반응형 디자인

### 6.1 Tailwind 브레이크포인트

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '640px',   // 모바일 가로
      'md': '768px',   // 태블릿
      'lg': '1024px',  // 데스크톱
      'xl': '1280px',  // 큰 데스크톱
      '2xl': '1536px', // 초대형
    }
  }
}
```

### 6.2 레이아웃 변화

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* 사이드바 - 데스크톱만 표시 */}
      <aside className="hidden lg:flex w-64 border-r">
        <Sidebar />
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* 하단 네비게이션 - 모바일만 표시 */}
      <nav className="lg:hidden fixed bottom-0 w-full border-t bg-background">
        <MobileNav />
      </nav>
    </div>
  )
}
```

---

## 7. API Routes 예시

### 7.1 포트폴리오 목록 조회

```typescript
// app/api/portfolio/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(portfolios)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const portfolio = await prisma.portfolio.create({
    data: {
      userId: session.user.id,
      categoryId: body.categoryId,
      ticker: body.ticker,
      stockName: body.stockName,
      quantity: body.quantity,
      averagePrice: body.averagePrice,
      market: body.market
    }
  })

  return NextResponse.json(portfolio)
}
```

### 7.2 주가 조회 (Yahoo Finance)

```typescript
// app/api/prices/[ticker]/route.ts
import { NextResponse } from 'next/server'
import { getStockPrice } from '@/lib/yahoo-finance'

export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  try {
    const { ticker } = params
    const price = await getStockPrice(ticker)

    return NextResponse.json({ ticker, price })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch price' },
      { status: 500 }
    )
  }
}
```

---

## 8. 개발 로드맵

### MVP (4주)

**Week 1: 프로젝트 설정**
```bash
# 프로젝트 생성
npx create-next-app@latest my-portfolio-web --typescript --tailwind --app

# shadcn/ui 설치
npx shadcn-ui@latest init

# 필수 패키지 설치
npm install prisma @prisma/client
npm install next-auth
npm install zustand @tanstack/react-query
npm install recharts
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react

# Prisma 초기화
npx prisma init
```

- ✅ Next.js 프로젝트 생성
- ✅ shadcn/ui, Tailwind 설정
- ✅ Prisma 설정 및 스키마 작성
- ✅ NextAuth 설정 (이메일 로그인)

**Week 2: 인증 및 레이아웃**
- ✅ 로그인/회원가입 페이지
- ✅ 사이드바 레이아웃 (데스크톱)
- ✅ 하단 네비게이션 (모바일)
- ✅ 반응형 디자인 기본 구조

**Week 3: 핵심 기능**
- ✅ 대시보드 화면 (히어로 카드, 차트, 배분)
- ✅ 카테고리 화면 (3개)
- ✅ 종목 추가/수정/삭제 모달
- ✅ 목표 설정 및 진행률

**Week 4: 고급 기능 및 배포**
- ✅ 리밸런싱 화면
- ✅ 월간 리포트
- ✅ Yahoo Finance API 연동
- ✅ Vercel 배포

### Phase 2 (추가 2주)

- 테이블 정렬, 필터, 검색
- CSV 내보내기
- 키보드 단축키
- 다크 모드
- 성능 최적화

---

## 9. 환경 변수 설정

```env
# .env.local

# Database (Vercel Postgres 또는 Supabase)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Yahoo Finance API (선택적 - 무료는 API 키 불필요)
# YAHOO_FINANCE_API_KEY=""

# 이메일 (회원가입 인증용 - 선택적)
# SMTP_HOST=""
# SMTP_PORT=""
# SMTP_USER=""
# SMTP_PASSWORD=""
```

---

## 10. 시작하기

```bash
# 저장소 클론
git clone https://github.com/yourusername/my-portfolio-web.git
cd my-portfolio-web

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 수정

# Prisma 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev

# 브라우저에서 열기
# http://localhost:3000
```

---

**문서 버전:** 3.0 (Next.js + shadcn/ui)
**작성일:** 2025-01-26
**작성자:** bgc8214
**최종 수정:** 2025-01-26

