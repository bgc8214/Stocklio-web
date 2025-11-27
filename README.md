# MyFolio Web - 포트폴리오 관리 웹 애플리케이션

> 3개 카테고리 중심 포트폴리오 관리 - Next.js + Firebase + shadcn/ui

## 프로젝트 개요

MyFolio는 주식 포트폴리오를 **나스닥100**, **S&P 500**, **배당주** 3개 카테고리로 간단하게 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- ✅ 3개 카테고리별 포트폴리오 관리
- ✅ 카테고리별 목표 설정 및 진행률 추적
- ✅ 실시간 주가 조회 (Yahoo Finance API)
- ✅ 일별/월별/연간 수익 추이 차트
- ✅ 카테고리별 자산 배분 시각화
- ✅ 리밸런싱 제안
- ✅ 월간 리포트
- ✅ 반응형 디자인 (데스크톱/태블릿/모바일)

## 기술 스택

### Frontend
- **Next.js 14** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 CSS 프레임워크
- **shadcn/ui** - UI 컴포넌트 라이브러리
- **Recharts** - 차트 시각화
- **Lucide React** - 아이콘

### State Management
- **Zustand** - 전역 상태 관리
- **TanStack Query** - 서버 상태 관리 & 캐싱

### Backend
- **Firebase Authentication** - 사용자 인증
- **Cloud Firestore** - 실시간 NoSQL 데이터베이스
- **Firebase Storage** - 파일 저장

### API
- **Yahoo Finance API** - 주식 시세 조회

## 시작하기

### 1. 패키지 설치

\`\`\`bash
npm install
\`\`\`

### 2. 환경 변수 설정

\`.env.local.example\` 파일을 복사하여 \`.env.local\` 파일을 생성하고 Firebase 설정값을 입력하세요.

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

\`.env.local\` 파일:
\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

### 3. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

\`\`\`
my-portfolio-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 랜딩 페이지
│   │   └── globals.css        # 전역 스타일
│   │
│   ├── components/            # React 컴포넌트
│   │   └── ui/               # shadcn/ui 컴포넌트
│   │
│   ├── lib/                   # 유틸리티 & 설정
│   │   ├── firebase/         # Firebase 설정
│   │   │   ├── config.ts    # Firebase 초기화
│   │   │   └── firestore.ts # Firestore 헬퍼
│   │   └── utils.ts          # 유틸리티 함수
│   │
│   └── types/                 # TypeScript 타입 정의
│       ├── portfolio.ts
│       ├── user.ts
│       ├── stock.ts
│       └── snapshot.ts
│
├── public/                    # 정적 파일
├── .env.local.example        # 환경 변수 예시
├── components.json           # shadcn/ui 설정
├── next.config.js            # Next.js 설정
├── tailwind.config.ts        # Tailwind 설정
└── tsconfig.json             # TypeScript 설정
\`\`\`

## 사용 가능한 명령어

### 개발 명령어
\`\`\`bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint
\`\`\`

### Git Worktree 명령어
\`\`\`bash
# 워크트리 생성 (빠른 방법)
npm run wt:create -- ../worktrees/issue-7 -b feature/#7-new-feature

# 워크트리 목록 확인
npm run wt:list

# 워크트리 삭제
npm run wt:remove -- ../worktrees/issue-7

# 워크트리 정리
npm run wt:prune

# 헬퍼 스크립트 사용 (권장)
./.worktree-helper.sh create 7    # 이슈 7번 워크트리 생성
./.worktree-helper.sh list        # 워크트리 목록
./.worktree-helper.sh open 7      # VS Code로 열기
./.worktree-helper.sh remove 7    # 워크트리 삭제
\`\`\`

## 개발 로드맵

### ✅ Phase 1: 프로젝트 설정 (완료)
- [x] Next.js 프로젝트 생성
- [x] Tailwind CSS & shadcn/ui 설정
- [x] Firebase 설정
- [x] TypeScript 타입 정의
- [x] 기본 레이아웃 구조

### 🚧 Phase 2: 인증 & 레이아웃 (진행 중)
- [ ] 로그인/회원가입 페이지
- [ ] Firebase Authentication 연동
- [ ] 사이드바 레이아웃 (데스크톱)
- [ ] 하단 네비게이션 (모바일)
- [ ] 반응형 디자인

### 📋 Phase 3: 핵심 기능
- [ ] 대시보드 화면
- [ ] 카테고리별 화면 (나스닥100, S&P 500, 배당주)
- [ ] 종목 추가/수정/삭제
- [ ] 목표 설정 및 진행률
- [ ] 수익 추이 차트

### 🎯 Phase 4: 고급 기능
- [ ] 리밸런싱 화면
- [ ] 월간 리포트
- [ ] Yahoo Finance API 연동
- [ ] CSV 내보내기
- [ ] 다크 모드

## 문서

- [PRD (Product Requirements Document)](./WEB_PRD.md)
- [Technical Specification](./WEB_TECHNICAL_SPEC.md)

## 라이선스

ISC

## 작성자

bgc8214
