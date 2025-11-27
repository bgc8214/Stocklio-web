# MyFolio Web - 개발 가이드

> Next.js + Firebase + shadcn/ui 기반 포트폴리오 관리 웹 애플리케이션

---

## 프로젝트 개요

**MyFolio**는 주식 포트폴리오를 **나스닥100, S&P 500, 배당주** 3개 카테고리로 간단하게 관리하는 웹 애플리케이션입니다.

### 핵심 가치
- 3개 카테고리 중심의 단순한 포트폴리오 관리
- 카테고리별 목표 설정 및 진행률 추적
- 실시간 주가 조회 및 수익 추이 시각화
- 반응형 디자인 (데스크톱/태블릿/모바일)

---

## 기술 스택

### Frontend
- **Next.js 14** (App Router) - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 CSS
- **shadcn/ui** - UI 컴포넌트 라이브러리
- **Recharts** - 차트 시각화
- **Lucide React** - 아이콘
- **Framer Motion** - 애니메이션

### State Management
- **Zustand** - 전역 상태 관리
- **TanStack Query** - 서버 상태 관리 & 캐싱

### Backend & Database
- **Firebase Authentication** - 사용자 인증
- **Cloud Firestore** - NoSQL 데이터베이스
- **Firebase Storage** - 파일 저장

### External API
- **Yahoo Finance API** - 주식 시세 조회

---

## 빠른 시작

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.local.example .env.local
# .env.local 파일에 Firebase 설정값 입력
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

---

## 프로젝트 구조

```
my-portfolio-web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # 인증 페이지 (로그인, 회원가입)
│   │   ├── (dashboard)/    # 대시보드 페이지
│   │   └── api/            # API Routes
│   ├── components/         # React 컴포넌트
│   │   ├── ui/            # shadcn/ui 컴포넌트
│   │   ├── layouts/       # 레이아웃
│   │   ├── dashboard/     # 대시보드 컴포넌트
│   │   └── portfolio/     # 포트폴리오 컴포넌트
│   ├── lib/               # 유틸리티 & 설정
│   │   ├── firebase/      # Firebase 설정
│   │   ├── hooks/         # Custom Hooks
│   │   ├── storage/       # Local Storage
│   │   └── api/           # API 클라이언트
│   └── types/             # TypeScript 타입
├── docs/                  # 문서 (상세 가이드)
├── public/                # 정적 파일
└── README.md             # 프로젝트 소개
```

---

## 주요 기능

### 1. 대시보드
- 총 자산 현황 (히어로 카드)
- 수익 추이 차트 (일/월/연)
- 카테고리별 자산 배분

### 2. 포트폴리오 관리
- 종목 추가/수정/삭제
- 카테고리별 분류 (나스닥100, S&P 500, 배당주)
- 목표 설정 및 진행률 추적

### 3. 차트 & 분석
- 실시간 주가 조회
- 수익 추이 시각화
- 리밸런싱 제안

### 4. 인증 시스템
- 이메일/비밀번호 회원가입/로그인
- Google 소셜 로그인
- 비밀번호 재설정
- 이메일 인증

---

## 핵심 데이터 모델

### Portfolio (포트폴리오)
```typescript
interface Portfolio {
  id: string
  ticker: string          // 종목 코드
  name: string           // 종목명
  quantity: number       // 보유 수량
  averageCost: number    // 평균 매수가 (KRX: 원화, US: 달러)
  currentPrice: number   // 현재가 (KRX: 원화, US: 달러)
  market: 'KRX' | 'US'   // 시장 구분
  categoryId?: number    // 카테고리 ID
  createdAt: Date
  updatedAt: Date
}
```

### User (사용자)
```typescript
interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  lastLoginAt: Date
}
```

---

## 개발 가이드

### 통화 포맷팅
미국 주식과 한국 주식을 구분하여 통화를 표시합니다.

```typescript
import { formatCurrency } from '@/lib/utils'

// 한국 주식
formatCurrency(50000, 'KRX')  // ₩50,000

// 미국 주식
formatCurrency(150.50, 'US')  // $150.50
```

### Auth Hook 사용
```typescript
import { useAuth } from '@/lib/hooks/use-auth'

function MyComponent() {
  const { user, signIn, signUp, signOut } = useAuth()

  // 회원가입
  await signUp(email, password)

  // 로그인
  await signIn(email, password)

  // 로그아웃
  await signOut()
}
```

### Firebase 설정
`.env.local` 파일에 Firebase 설정값을 입력하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 개선 완료 사항

### ✅ 통화 시스템
- KRX(원화) / US(달러) 자동 구분
- 환율 변환 함수
- 총 자산 계산 시 원화 통일

### ✅ 차트 개선
- 스마트 금액 포맷팅 (억/천만/백만/만)
- 통계 요약 (현재 수익, 최고/최저, 평균 변동)
- 영역/선형 차트 선택
- 1주일 옵션 추가

### ✅ 디자인 시스템
- Glass Morphism 디자인
- 그라데이션 메시 배경
- 애니메이션 (Framer Motion)
- 다크 모드 우선

### ✅ 회원가입/로그인
- 비밀번호 강도 실시간 체크
- 이메일 인증
- Google 소셜 로그인
- 비밀번호 재설정
- Firestore 자동 동기화

---

## 다음 작업

1. **.env.local 파일 생성** - Firebase 설정
2. **개선된 컴포넌트 적용** - 랜딩, 인증, 자산 카드
3. **대시보드 구현** - 실제 데이터 연동
4. **종목 추가 기능** - Firebase 연동
5. **Yahoo Finance API 연동** - 실시간 주가

---

## 문서

### 루트 문서
- **README.md** - 프로젝트 소개 및 기본 사용법
- **claude.md** - 개발 가이드 (이 파일)

### 상세 문서 (docs/)
- **WEB_PRD.md** - 제품 요구사항 정의서
- **WEB_TECHNICAL_SPEC.md** - 기술 명세서
- **FRONTEND_DESIGN_ANALYSIS.md** - 디자인 분석 및 개선안
- **DESIGN_IMPROVEMENTS_SUMMARY.md** - 디자인 개선 요약
- **CHART_IMPROVEMENTS.md** - 차트 개선 상세
- **AUTH_IMPLEMENTATION_GUIDE.md** - 인증 구현 가이드

> 📁 **문서 작성 규칙**
> - 루트에는 README.md, claude.md만 유지
> - 상세 문서는 docs/ 폴더에 저장
> - 꼭 필요한 것만 작성 (나중에 참고, 진행 체크용)

---

## 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint
```

---

## 문제 해결

### Firebase 설정 경고
```
⚠️ Firebase가 설정되지 않았습니다.
```
→ `.env.local` 파일 생성 및 Firebase 설정값 입력

### 빌드 에러
```bash
rm -rf .next
npm run dev
```

### Type 에러
```bash
npx tsc --noEmit
```

---

**작성일**: 2025-11-27
**버전**: 1.0.0
