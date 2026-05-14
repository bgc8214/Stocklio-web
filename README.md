# Stock Portfolio Lab

Numbers로 관리하던 개인 주식 포트폴리오를 웹 서비스로 옮기기 위한 프로젝트다.

초기 목표는 보유 종목, 계좌, 투자자, 자산군, 환율, 평가금액, 손익, 기간별 성과를 웹에서 관리하고 확인하는 것이다. 원본 Numbers 파일은 민감한 금융 데이터이므로 레포에 저장하지 않고, 하네스 문서에는 구조와 계산 규칙만 남긴다.

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

미국 주식/ETF 가격과 USD/KRW 환율은 Yahoo Finance chart endpoint를 작은 로컬 프록시로 가져온다. 별도 API key는 필요 없다. 가격 응답은 5분, 환율 응답은 1시간 캐시한다.

앱 상태는 `data/portfolio.db` SQLite 파일에 저장된다. 이 DB 파일은 개인 포트폴리오 데이터를 담을 수 있으므로 git에 포함하지 않는다. 서버는 15분마다 자동화 조건을 확인하고, `Asia/Seoul` 기준 매일 09:10 이후 가격/환율을 갱신한 뒤 당일 `PortfolioSnapshot`과 `accountSnapshots`를 생성하거나 갱신한다.

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

## Vercel 배포 메모

`vercel.json`은 현재 정적 화면 배포를 위한 기본 설정이다. 실제 제품 배포에서는 로컬 SQLite 대신 Vercel Functions와 외부 Postgres 계열 DB를 붙여야 사용자별 데이터가 영구 저장된다. 현재 제품화 1차에서는 계산 로직을 `src/domain/portfolio-core.js`로 분리해 이후 API/DB 계층에서 같은 계산 경계를 재사용할 수 있게 했다.
