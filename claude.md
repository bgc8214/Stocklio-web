# MyFolio Web - 개발 가이드

> Next.js + Firebase + shadcn/ui 기반 포트폴리오 관리 웹 애플리케이션

---

## 🔄 GitHub Issues 워크플로우

이 프로젝트는 **GitHub Issues 기반 개발 워크플로우**와 **Git Worktree**를 사용합니다.

### 🌳 Git Worktree 기반 개발

**여러 이슈를 동시에 작업**하기 위해 Git Worktree를 사용합니다. 각 이슈는 독립적인 작업 디렉토리에서 진행됩니다.

#### 디렉토리 구조
```
Desktop/cursor/
├── my-portfolio-web/          # 메인 저장소 (main 브랜치)
│   ├── .git/
│   └── ...
└── worktrees/                 # 워크트리 전용 디렉토리
    ├── issue-5/               # 이슈 5번 작업 공간
    ├── issue-6/               # 이슈 6번 작업 공간
    └── hotfix-urgent/         # 긴급 핫픽스 작업 공간
```

### 📋 이슈 기반 작업 프로세스

**IMPORTANT: 모든 이슈 작업은 반드시 워크트리에서 진행합니다.**

사용자가 "N번 이슈 진행해줘" 라고 요청하면, 다음 순서로 **자동으로** 진행합니다:

1. **워크트리 생성하기** - `.worktree-helper.sh create N` 실행
2. **이슈 불러오기** - `gh issue view N`으로 이슈 확인
3. **워크트리로 이동** - `cd ../worktrees/issue-N`
4. **코드베이스 분석하기** - 관련 파일 및 의존성 파악
5. **이슈 해결 계획 세우기** - 구현 방향 및 단계 설계
6. **이슈 해결하기** - 실제 코드 작성 및 구현
7. **검증하기** - 빌드, 린트, 타입 체크
8. **커밋 & PR 작성하기** - 커밋 후 PR 생성
9. **메인 저장소로 복귀** - `cd ~/Desktop/cursor/my-portfolio-web`

**워크트리 정리는 사용자가 요청할 때만 진행합니다.** (PR 머지 후)

#### 작업 시작 명령어

```bash
# 사용자가 이렇게 요청하면
"6번 이슈 진행해줘"

# Claude가 자동으로 실행
./.worktree-helper.sh create 6
cd ../worktrees/issue-6
# ... 이슈 해결 진행
```

### 🌿 브랜치 네이밍 규칙

```bash
# Feature
feature/#<issue-number>-<short-description>
예: feature/#1-implement-dashboard

# Bugfix
bugfix/#<issue-number>-<short-description>
예: bugfix/#5-fix-login-error

# Hotfix
hotfix/#<issue-number>-<short-description>
예: hotfix/#10-critical-security-patch
```

### 💬 커밋 메시지 규칙

```bash
<type>(#<issue-number>): <subject>

[optional body]

[optional footer]
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 등

**예시:**
```bash
feat(#12): 대시보드 히어로 카드 구현

- 총 자산 표시 컴포넌트 추가
- 실시간 수익률 계산 로직 구현
- Glass Morphism 디자인 적용

Closes #12
```

### 📝 풀리퀘스트 템플릿

```markdown
## 📌 관련 이슈
Closes #<issue-number>

## 🎯 작업 내용
- [ ] 작업 항목 1
- [ ] 작업 항목 2

## 🧪 테스트 체크리스트
- [ ] 빌드 성공
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 기능 동작 확인

## 📸 스크린샷 (옵션)

## 💭 리뷰 노트
```

### 🛠️ Worktree 명령어

#### 워크트리 생성 및 관리
```bash
# 1. 워크트리 디렉토리 생성 (최초 1회)
mkdir -p ../worktrees

# 2. 이슈용 워크트리 생성
git worktree add ../worktrees/issue-<번호> -b feature/#<번호>-<설명>

# 예시: 이슈 7번 작업 시작
git worktree add ../worktrees/issue-7 -b feature/#7-realtime-updates

# 3. 워크트리 목록 확인
git worktree list

# 4. 워크트리로 이동
cd ../worktrees/issue-7

# 5. VS Code에서 워크트리 열기
code ../worktrees/issue-7

# 6. 작업 완료 후 워크트리 삭제
git worktree remove ../worktrees/issue-7

# 7. 불필요한 워크트리 정리
git worktree prune
```

#### 워크트리 작업 플로우
```bash
# Step 1: 메인 저장소에서 워크트리 생성
cd ~/Desktop/cursor/my-portfolio-web
git worktree add ../worktrees/issue-7 -b feature/#7-new-feature

# Step 2: 워크트리로 이동하여 작업
cd ../worktrees/issue-7
npm install  # 각 워크트리마다 필요
npm run dev -- -p 3000

# Step 3: 코드 작성 및 커밋
git add .
git commit -m "feat(#7): 구현"
git push -u origin feature/#7-new-feature

# Step 4: PR 생성
gh pr create --title "feat(#7): 새 기능" --body "Closes #7"

# Step 5: 작업 완료 후 워크트리 삭제
cd ~/Desktop/cursor/my-portfolio-web
git worktree remove ../worktrees/issue-7
```

### 🛠️ GitHub CLI 명령어

```bash
# 이슈 조회
gh issue list
gh issue view <issue-number>

# PR 생성
gh pr create --title "feat(#12): 대시보드 구현" --body "Closes #12"

# PR 상태 확인
gh pr status
gh pr view

# PR 리뷰
gh pr review --approve
gh pr merge
```

### ⚡ 빠른 시작 스크립트

**package.json에 추가된 스크립트:**
```json
{
  "scripts": {
    "wt:create": "git worktree add",
    "wt:list": "git worktree list",
    "wt:remove": "git worktree remove",
    "wt:prune": "git worktree prune"
  }
}
```

**사용 예시:**
```bash
# 워크트리 생성
npm run wt:create -- ../worktrees/issue-8 -b feature/#8-analytics

# 워크트리 목록
npm run wt:list

# 워크트리 삭제
npm run wt:remove -- ../worktrees/issue-8
```

### 🎯 워크트리 헬퍼 스크립트 (권장)

프로젝트에 포함된 `.worktree-helper.sh` 스크립트를 사용하면 더 편리합니다.

**기본 사용법:**
```bash
# 도움말 보기
./.worktree-helper.sh help

# 워크트리 생성 (GitHub 이슈 정보 자동 반영)
./.worktree-helper.sh create 7

# 워크트리 목록
./.worktree-helper.sh list

# VS Code로 워크트리 열기
./.worktree-helper.sh open 7

# 워크트리 삭제
./.worktree-helper.sh remove 7

# 불필요한 워크트리 정리
./.worktree-helper.sh clean

# 초기 설정 (워크트리 디렉토리 생성)
./.worktree-helper.sh setup
```

**실제 작업 흐름 예시:**
```bash
# 1. 이슈 7번 워크트리 생성
./.worktree-helper.sh create 7
# 출력: feature/#7-realtime-updates 브랜치 생성

# 2. 워크트리로 이동
cd ../worktrees/issue-7

# 3. 패키지 설치
npm install

# 4. 개발 서버 실행
npm run dev

# 5. 작업 완료 후 커밋 & PR
git add .
git commit -m "feat(#7): 구현"
git push -u origin feature/#7-realtime-updates
gh pr create --title "feat(#7): 실시간 업데이트" --body "Closes #7"

# 6. 메인 저장소로 돌아가서 워크트리 삭제
cd ~/Desktop/cursor/my-portfolio-web
./.worktree-helper.sh remove 7
```

### 🚨 워크트리 주의사항

1. **각 워크트리마다 npm install 필요**
   - 워크트리는 독립적인 작업 공간이므로 node_modules를 별도로 설치해야 합니다.

2. **포트 충돌 방지**
   ```bash
   # 워크트리 1
   cd ../worktrees/issue-5
   npm run dev -- -p 3000

   # 워크트리 2 (다른 포트 사용)
   cd ../worktrees/issue-6
   npm run dev -- -p 3001
   ```

3. **같은 브랜치는 한 번만 체크아웃 가능**
   - 동일한 브랜치를 여러 워크트리에서 동시에 사용할 수 없습니다.

4. **작업 완료 후 반드시 워크트리 삭제**
   - PR 머지 후 워크트리를 삭제하여 디스크 공간을 확보하세요.

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

# 타입 체크
npx tsc --noEmit
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
