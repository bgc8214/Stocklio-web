# 투자일지

개인 주식 포트폴리오를 관리하는 독립 웹 서비스다. Numbers 스프레드시트를 대체하는 것이 초기 계기였지만, 지금은 그 계기와 분리된 자체 제품으로 본다.

보유 종목, 계좌, 투자자, 자산군, 환율, 평가금액, 손익, 기간별 성과를 웹에서 관리하고 확인한다. 원본 Numbers 파일은 민감한 금융 데이터이므로 레포에 저장하지 않고, 하네스 문서에는 구조와 계산 규칙만 남긴다.

## 현재 상태

- `meta-harness` 기반 하네스 설치 완료
- Numbers 파일을 XLSX로 임시 변환해 구조 분석 완료
- 초기 팀 스펙과 MVP 계획 작성 완료
- 웹 MVP 구현 완료
- Node 내장 SQLite 기반 저장소와 매일 자동 스냅샷 작업 추가
- 총자산 계산에 예수금을 포함하고, 계좌별 자산 검증과 성과 상세 화면 추가
- 가격 업데이트 로그, 최근 import 검증 리포트, JSON 백업/복원 UI 추가
- Craft.js 기반 대시보드 편집 캔버스 추가
- 공통 도메인 계산 모듈과 제품 스모크 테스트 추가
- 앱 안에서 XLSX import preview 후 확정 저장 가능
- Supabase Google 로그인과 사용자별 포트폴리오 저장 경로 추가
- Supabase 미설정 시에는 로컬 데모 모드로 안전하게 동작
- Vercel Cron 기반 프로덕션 일일 스냅샷 함수 추가

## 실행

```bash
npm install
npm run build
npm run dev
```

그 다음 브라우저에서 `http://localhost:4173`을 연다.

## 검증

```bash
npm run check
npm run test:migration
npm run test:product
npm run verify
```

`npm run verify`는 도메인 단위 테스트, Numbers 마이그레이션 테스트, 로컬 서버/API/브라우저/Craft.js 대시보드 스모크 테스트를 한 번에 실행한다.

## CSS 구조

`styles.css`는 자동 생성 파일이다. 직접 수정하지 말고 `styles/*.css` 소스 파일을 고친 뒤 `npm run build:css`를 실행한다 (`npm run dev`/`npm run build`가 이미 자동으로 실행한다).

- `styles/base.css` — 리셋, 타이포그래피, CSS 변수
- `styles/layout-nav.css`, `layout-login.css`, `layout-common.css`, `layout-drawer.css` — 사이드바/네비게이션, 로그인, 공통 컴포넌트(패널·폼·테이블·토스트 등), 드로어
- `styles/dashboard.css`, `holdings.css`, `accounts.css`, `cashflows.css`, `performance.css`, `automation.css`, `simulator.css` — 탭별 스타일
- `styles/theme.css` — 다크 테마

각 파일은 `@layer <카테고리>`로 감싸여 있고, `scripts/build-css.mjs`가 병합 시 최상단에 `@layer base, layout, dashboard, ..., responsive;` 순서 선언을 붙인다. CSS Cascade Layers 덕분에 반응형(`@layer responsive`) 규칙은 소스 파일 순서와 무관하게 항상 다른 레이어보다 우선한다 — 예전에는 모바일 오버라이드가 나중에 추가된 전역 규칙에 우연히 덮이는 버그가 여러 곳 있었는데, 이 구조에서는 그런 캐스케이드 버그가 생기지 않는다.

## Import

`자동화/데이터` 탭에서 `.xlsx` 파일을 올리면 서버가 먼저 preview 상태를 만든다. 이 단계에서는 현재 포트폴리오가 바뀌지 않는다. 요약을 확인한 뒤 `Import 확정`을 눌러야 SQLite 상태가 교체된다.

제품 방향상 신규 사용자용 import는 후순위다. 현재 구현은 기존 스프레드시트 데이터를 옮기려는 사용자를 위한 보조 기능으로 둔다.

미국 주식/ETF 가격과 USD/KRW 환율은 Yahoo Finance chart endpoint를 작은 로컬 프록시로 가져온다. 별도 API key는 필요 없다. 가격 응답은 5분, 환율 응답은 1시간 캐시한다.

로컬 개발 서버의 앱 상태는 `data/portfolio.db` SQLite 파일에 저장된다. 이 DB 파일은 개인 포트폴리오 데이터를 담을 수 있으므로 git에 포함하지 않는다. 로컬 서버는 15분마다 자동화 조건을 확인하고, `Asia/Seoul` 기준 자동화 시각 이후 가격/환율을 갱신한 뒤 당일 `PortfolioSnapshot`과 `accountSnapshots`를 생성하거나 갱신한다.

## 주요 문서

- `docs/harness/stock-portfolio/team-spec.md`
- `_workspace/stock-portfolio/01_workbook_audit.md`
- `_workspace/stock-portfolio/02_domain_model.md`
- `_workspace/stock-portfolio/03_mvp_plan.md`
- `_workspace/stock-portfolio/04_web_build_notes.md`
- `_workspace/stock-portfolio/05_qa_review.md`
- `_workspace/stock-portfolio/06_full_automation_plan.md`
- `_workspace/stock-portfolio/07_numbers_migration_report.md`
- `_workspace/stock-portfolio/08_product_roadmap.md`
- `_workspace/stock-portfolio/09_product_level_roadmap.md`
- `_workspace/stock-portfolio/10_ux_review.md`
- `_workspace/stock-portfolio/11_local_productization_report.md`
- `_workspace/stock-portfolio/12_production_automation_roadmap.md`

## Vercel 배포 메모

`vercel.json`은 정적 화면, `api/yahoo/chart` 가격 프록시, `api/cron/daily-snapshot` 일일 자동 스냅샷 배포를 위한 설정이다. 운영 사용자 데이터는 로컬 SQLite가 아니라 Supabase의 `portfolio_states` 테이블에 저장한다. 계산 로직은 `src/domain/portfolio-core.js`로 분리해 브라우저, 로컬 서버, Vercel Function이 같은 계산 경계를 재사용한다.

Vercel Cron은 UTC 기준 `0 22 * * *`로 설정되어 있으며, 이는 `Asia/Seoul` 기준 매일 07:00 실행이다. 이 함수는 모든 사용자 포트폴리오를 순회하므로 브라우저용 anon key가 아니라 서버 전용 service role key가 필요하다.

## Supabase 설정

Supabase 프로젝트를 만든 뒤 `supabase/schema.sql`을 SQL Editor에서 실행한다. Authentication Providers에서 Google을 활성화하고, redirect URL에 로컬과 운영 주소를 모두 넣는다.

- 로컬: `http://localhost:4173`
- 운영: `https://stocklio-web.vercel.app`

Vercel 환경변수에는 다음 값을 넣고 다시 배포한다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`: Vercel 서버 환경변수에만 저장한다. 브라우저 코드나 `.env` 공개 파일에 넣지 않는다.
- `CRON_SECRET`: `/api/cron/daily-snapshot` 호출 보호용 비밀값이다.

환경변수가 없으면 앱은 로그인 버튼을 비활성화하고 로컬 데모 모드로 동작한다.

운영 자동화 활성화 체크리스트:

1. Supabase SQL Editor에서 최신 `supabase/schema.sql`을 실행한다.
2. Vercel Production 환경변수에 `SUPABASE_SERVICE_ROLE_KEY`와 `CRON_SECRET`을 추가한다.
3. 재배포 후 `/api/health`의 `checks.automationEnv`와 `automationStatus`를 확인한다.
4. 필요한 경우 `Authorization: Bearer $CRON_SECRET` 헤더로 `/api/cron/daily-snapshot`을 수동 호출해 오늘 스냅샷 upsert를 검증한다.
