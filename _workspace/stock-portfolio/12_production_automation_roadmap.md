# 프로덕션 자동화 로드맵

## 결론

Stocklio의 프로덕션 기준은 `사용자가 매일 누르지 않아도 포트폴리오가 기록되는 것`이다. 수동 `가격 갱신`, `성과 저장`은 비상/보정용이어야 하고, 기본 흐름은 예약 작업이 가격, 환율, 스냅샷, 실패 로그를 자동으로 만든다.

현재 상태는 `로그인 + Supabase 저장 + 수동 스냅샷`이다. 다음 제품화의 1순위는 `자동 스냅샷 파이프라인`이다.

## 목표 상태

- 매일 정해진 시간에 모든 활성 포트폴리오를 자동 기록한다.
- 가격/환율 갱신 성공 여부와 실패 종목을 남긴다.
- 같은 날짜 스냅샷은 중복 생성하지 않고 갱신한다.
- 사용자는 다음 날 접속하면 전일 대비, 기간별 증감, 입출금 제외 성과를 바로 본다.
- 휴장일, 가격 조회 실패, 일부 종목 수동 가격은 데이터 품질 상태로 표시한다.
- 수동 `성과 저장`은 자동화 실패나 즉시 보정이 필요한 경우의 보조 기능으로 유지한다.

## 권장 아키텍처

### 1안: Supabase 중심 자동화

데이터가 Supabase에 있으므로 예약, 처리 로그, 스냅샷 저장을 Supabase에 가깝게 둔다.

- Supabase Cron: 매일 지정 시간에 작업 트리거
- Supabase Edge Function 또는 Postgres 함수: 모든 사용자 포트폴리오 처리
- Supabase Postgres: 스냅샷, 가격 로그, 자동화 실행 로그 저장
- Vercel: 화면과 Yahoo proxy 보조

장점:

- 데이터와 예약 실행이 같은 플랫폼에 있어 운영 경계가 단순하다.
- RLS/Service Role을 구분해 서버 작업만 전체 포트폴리오를 처리할 수 있다.
- Vercel 정적 앱이 잠들어 있어도 기록이 계속된다.

주의:

- Edge Function에서 Service Role key를 써야 하므로 브라우저에 절대 노출하지 않는다.
- 사용자 수가 늘면 한 번의 cron에서 전체 사용자를 처리하지 않고 job queue/배치 크기를 둔다.

### 2안: Vercel Cron + Vercel Function

Vercel Cron이 production URL의 `/api/cron/daily-snapshot`을 호출하고, 함수가 Supabase를 업데이트한다.

장점:

- 현재 Vercel 배포 흐름과 맞다.
- `vercel.json`에서 cron path와 schedule을 코드 리뷰할 수 있다.

주의:

- Vercel Cron은 HTTP GET으로 production deployment path를 호출한다.
- `CRON_SECRET` 같은 서버 환경변수로 cron endpoint를 보호해야 한다.
- 서버리스 실행 시간 안에 전체 포트폴리오 처리가 끝나야 한다.

## Phase A: 자동화 데이터 모델

상태: `다음`

추가 테이블 또는 JSON state 필드:

- `automation_runs`
  - `id`
  - `started_at`
  - `finished_at`
  - `status`: `running | success | partial | failed`
  - `scope`: `daily_snapshot | price_refresh | backfill`
  - `processed_portfolios`
  - `success_count`
  - `failure_count`
  - `message`
- `price_logs`
  - `portfolio_user_id`
  - `symbol`
  - `status`
  - `price`
  - `currency`
  - `source`
  - `as_of`
  - `message`
- `portfolio_snapshots`
  - 현재 JSON state 안의 `portfolioSnapshots`를 장기적으로 정규 테이블화
- `portfolio_states.state.automation`
  - 마지막 자동 실행 요약을 UI가 빠르게 읽기 위한 캐시

완료 기준:

- 자동화 한 번의 결과를 나중에 재현할 수 있다.
- 실패한 종목/사용자/포트폴리오를 특정할 수 있다.
- UI에서 `마지막 자동 기록`, `일부 실패`, `오늘 기록 없음`을 구분할 수 있다.

## Phase B: 일일 스냅샷 함수

상태: `다음`

함수 책임:

1. 활성 사용자 포트폴리오 목록 조회
2. 각 포트폴리오 state 검증
3. 자동 가격 대상 종목만 Yahoo 가격 조회
4. USD/KRW 환율 조회
5. 수동 가격 종목은 기존 가격 유지
6. 총자산, 계좌별 자산, 평가손익 재계산
7. 오늘 날짜 스냅샷 upsert
8. 자동화 로그 저장
9. 실패한 심볼/포트폴리오는 partial 상태로 남김

완료 기준:

- 같은 날짜에 여러 번 실행해도 스냅샷이 중복되지 않는다.
- 일부 가격이 실패해도 전체 작업이 모두 실패하지 않는다.
- 실패한 심볼은 UI에서 확인 가능하다.
- 수동으로 `성과 저장`을 눌러도 자동 스냅샷과 충돌하지 않는다.

## Phase C: 예약 실행

상태: `다음`

기본 스케줄:

- 한국 주식 포함 기준: KST 16:10 이후 1회
- 미국 주식 중심 기준: KST 06:30 이후 1회
- 현재 포트폴리오는 국내/미국 혼합이므로 초기값은 `KST 07:00`, 필요 시 `KST 16:30` 보조 실행

운영 정책:

- 하루 1회 필수 기록
- 실패 시 30분 뒤 1회 재시도
- 수동 `가격 갱신`은 즉시 조회만 하고, 수동 `성과 저장`은 오늘 스냅샷을 upsert
- 휴장일에도 총자산 스냅샷은 만들 수 있지만 `market_status: closed_or_stale` 표시

완료 기준:

- 사용자가 앱을 열지 않아도 다음 날 성과 화면에 새 날짜가 생긴다.
- cron 실패가 health/readiness나 자동화 화면에 표시된다.
- cron endpoint는 비밀값 없이는 실행할 수 없다.

## Phase D: UI/UX

상태: `다음`

대시보드:

- `마지막 자동 기록: 2026-05-15 07:00`
- `가격 기준: 일부 수동 / 일부 자동`
- `오늘 스냅샷 없음`, `일부 가격 실패`, `기록 정상` 상태 표시

성과:

- 어제 대비 총자산 증감
- 입출금 제외 투자손익
- 계좌별 증감
- 전략별 기여도
- 가격 실패/수동 가격이 성과에 준 영향 표시

자동화/데이터:

- 최근 자동 실행 목록
- 실패 심볼 목록
- 재시도 버튼
- 특정 날짜 스냅샷 재생성

완료 기준:

- 사용자가 “왜 오늘 총자산이 바뀌었는지”를 자동화 로그와 성과 화면만 보고 설명할 수 있다.
- 자동화 실패가 조용히 묻히지 않는다.

## Phase E: 백필과 정정

상태: `다음`

필요 기능:

- 특정 날짜 스냅샷 재계산
- 특정 종목 가격 수동 보정
- 환율 수동 보정
- 잘못된 입출금/예수금 변경 시 과거 성과 재계산
- Numbers 마이그레이션 데이터와 웹 데이터 차이 리포트

완료 기준:

- 잘못 기록된 하루를 삭제하지 않고 정정할 수 있다.
- 정정 내역이 로그에 남는다.
- 정정 후 월별/기간별 성과가 일관되게 재계산된다.

## Phase F: 멀티 포트폴리오 확장

상태: `후순위`

현재 결정은 사용자당 기본 1포트폴리오다. 제품 안정화 후 다음을 추가한다.

- 사용자당 여러 포트폴리오
- 가족/공유 포트폴리오
- 읽기 전용 공유
- 포트폴리오별 자동화 시간대/시장 기준

완료 기준:

- 자동화가 포트폴리오 단위로 분리된다.
- 공유 권한이 있어도 다른 사용자의 비공개 데이터는 보이지 않는다.

## Phase G: 운영 안정성

상태: `다음`

필수 항목:

- `CRON_SECRET` 또는 Supabase Vault 기반 비밀값 관리
- 자동화 함수 idempotency key
- 실행 시간 제한 대비 배치 처리
- 실패 재시도와 dead-letter 목록
- Supabase 백업/복원 절차
- production smoke: health, auth, empty state, snapshot generation, price proxy
- 알림: cron 실패, 2일 이상 스냅샷 없음, Supabase 저장 실패

완료 기준:

- 자동화가 실패해도 다음 실행이나 수동 재시도로 복구 가능하다.
- 사용자 데이터가 사라진 것처럼 보이는 상태가 없다.
- 배포 전 자동화 회귀 테스트가 실행된다.

## 즉시 구현 순서

1. Supabase에 `automation_runs`, `price_logs`, `portfolio_snapshots` 초안 테이블 추가
2. `src/domain/portfolio-core.js` 계산 함수를 서버/함수에서 재사용할 수 있게 정리
3. Supabase Edge Function 또는 Vercel `/api/cron/daily-snapshot` 구현
4. cron secret 적용
5. 오늘 날짜 스냅샷 upsert 테스트
6. 자동화/데이터 화면에 최근 실행 결과 표시
7. production health에 `lastAutomationRunAt`, `lastSnapshotDate` 추가
8. Playwright/API smoke에 자동 스냅샷 dry-run 추가
9. 한국/미국 시장별 실행 시간 정책 확정
10. 실패 알림 채널 결정

## 현재 결정해야 하는 것

- 예약 실행 위치: `Supabase Cron + Edge Function`을 기본안으로 권장
- 기록 시간:
  - 미국장 기준이면 KST 07:00
  - 국내장 포함이면 KST 16:30도 필요
  - 혼합이면 하루 2회 또는 사용자가 시장 기준을 선택
- 가격 보정 정책:
  - 자동 조회 실패 시 기존 가격 유지
  - 실패 상태를 스냅샷에 표시
  - 특정 종목은 항상 수동 가격 허용
- 알림 채널:
  - 초기: 앱 내부 자동화 화면
  - 다음: 이메일 또는 Slack/카카오 등 외부 알림
