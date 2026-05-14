# 전체 자동화 계획

## 목표

Numbers에서 수동으로 하던 포트폴리오 관리 흐름을 웹 서비스로 옮긴다. 사용자는 보유 종목, 계좌, 입금/출금, 매수/매도처럼 웹이 외부에서 알 수 없는 사건만 입력하고, 현재가/환율 업데이트, 일별 성과 기록, 월별 성과 집계, 그래프 생성은 시스템이 자동으로 수행한다.

## 핵심 원칙

- 현재가와 환율은 입력값이 아니라 provider에서 가져온다.
- 일별 성과는 사용자가 매일 쓰는 표가 아니라 시스템이 생성하는 `PortfolioSnapshot`이다.
- 월별 성과는 별도 입력표가 아니라 일별 스냅샷에서 집계한다.
- 입금/출금, 매수/매도, 계좌 이동은 시스템이 추측하지 않고 사용자가 이벤트로 기록한다.
- 원본 Numbers 데이터는 초기 마이그레이션 참고 자료로만 사용하고, 웹의 정식 데이터 모델로 정규화한다.

## 자동화 대상

### 1. 보유 현황

사용자 입력:

- 투자자
- 계좌
- 종목
- 수량
- 평단가
- 통화
- 전략/자산군

자동 계산:

- 현재가
- 평가금액
- 매입금액
- 손익
- 수익률
- 원화 환산 평가금액
- 전략/계좌/투자자별 비중

### 2. 가격과 환율

자동 처리:

- 미국 주식/ETF: Yahoo Finance chart endpoint
- USD/KRW: `KRW=X`
- 가격 캐시: 5분
- 환율 캐시: 1시간
- 실패 시 마지막 성공 가격 유지

추가 확장:

- 국내 주식은 Yahoo suffix `.KS`, `.KQ` 또는 별도 provider를 검토한다.

### 3. 일별 성과

현재 Numbers 방식:

- 매일 날짜 column에 계좌별 평가금액을 직접 입력
- 자산 Flow 시트에서 증가액, 누적 증가액, 추가입금, 일 수익률, 월 누적 계산

웹 방식:

- 매일 정해진 시각에 전체 포트폴리오를 평가한다.
- 계좌별/투자자별/전체 평가금액을 `portfolio_snapshots`에 저장한다.
- 전일 스냅샷과 비교해 일별 증가액을 계산한다.
- 같은 날짜의 입금/출금 이벤트를 반영해 순수 투자손익을 계산한다.

계산식:

- `daily_change = today_value - previous_value`
- `net_inflow = deposit - withdrawal`
- `investment_gain = daily_change - net_inflow`
- `daily_return = investment_gain / previous_value`
- `month_to_date_gain = sum(investment_gain in month)`
- `cumulative_gain = current_value - baseline_value - cumulative_net_inflow`

### 4. 월별 성과

웹 방식:

- 월별 성과표는 별도 수동 입력을 받지 않는다.
- 해당 월의 일별 스냅샷을 집계해 생성한다.
- 월초/월말 평가금액, 월 입금/출금, 월 투자손익, 월 수익률을 자동 표시한다.

### 5. 차트

자동 생성:

- 총 평가금액 추이
- 일별 투자손익
- 월별 투자손익
- 투자자별 성과
- 계좌별 성과
- QQQ/S&P500/국내주식 비중
- 연금/IRP/직투 비중

## 필요한 데이터 모델

### User

- 다중 사용자 확장용 루트 엔티티

### Investor

- 실제 포트폴리오 안의 투자자 구분

### Account

- 증권사/연금/IRP/직투 계좌

### Instrument

- 종목 마스터
- ticker, market, currency, asset class, strategy bucket

### Holding

- 현재 보유 상태
- account, instrument, quantity, average cost

### CashFlow

- 입금, 출금, 계좌 이동, 배당, 세금 등 현금 이벤트

### Trade

- 매수/매도 이벤트
- 수량과 평단가 자동 갱신의 근거

### PriceSnapshot

- 종목별 가격 기록

### FxRateSnapshot

- 환율 기록

### PortfolioSnapshot

- 날짜별 계좌/투자자/전체 평가금액
- Numbers의 일별 성과표를 대체하는 핵심 테이블

## 구현 단계

### Phase 1: Numbers 구조를 웹 모델로 고정

- 기존 Numbers 시트의 각 표를 웹 엔티티에 매핑한다.
- `QQQ`, `S&P500`, `국내주식`, `월별 성과`, `3월/4월/5월 성과`의 역할을 명확히 분리한다.
- 실제 값은 저장소에 넣지 않고, 비식별 fixture로 계산 검증 세트를 만든다.

산출물:

- `docs/stock-portfolio/data-map.md`
- `_workspace/stock-portfolio/07_numbers_to_web_mapping.md`

### Phase 2: 현재 MVP를 “스냅샷 중심”으로 재구성

- 현재 `performance` 샘플 배열을 제거하고 `portfolioSnapshots`로 바꾼다.
- 일별/월별 차트는 snapshot에서 계산되게 한다.
- `CashFlow` 입력 UI를 추가한다.
- 가격 업데이트 후 “오늘 스냅샷 저장” 버튼을 만든다.

목표:

- 앱을 열고 버튼을 누르면 오늘의 일별 성과가 자동 생성된다.

### Phase 3: 매일 자동 스냅샷 생성

- 브라우저가 열려 있지 않아도 동작하게 서버 작업을 만든다.
- 매일 장 마감 이후 또는 사용자가 정한 시각에 가격/환율을 갱신한다.
- `PortfolioSnapshot`을 자동 저장한다.
- 같은 날짜 스냅샷이 있으면 중복 생성하지 않고 갱신한다.

구현 상태:

- Node 내장 SQLite로 `data/portfolio.db` 저장소를 만들었다. `완료`
- `/api/state`로 앱 상태를 서버에 저장/로드한다. `완료`
- 서버가 15분마다 자동화 조건을 확인한다. `완료`
- `Asia/Seoul` 기준 매일 09:10 이후 당일 스냅샷을 생성/갱신한다. `완료`
- `/api/automation/run`으로 수동 자동화 실행을 검증할 수 있다. `완료`

필요 변화:

- `localStorage`만으로는 부족하다.
- 최소한 SQLite 같은 로컬 DB 또는 hosted DB가 필요하다.

추천 MVP:

- 로컬/개인용: Node server + SQLite
- 여러 사용자 서비스: Supabase/Postgres + 인증 + scheduled job

### Phase 4: 거래/현금흐름 기반 보유수량 자동화

- 사용자가 매수/매도/입금/출금을 이벤트로 입력한다.
- 수량, 평단가, 매입금액은 이벤트에서 자동 계산한다.
- 현재 보유 테이블은 직접 수정 대상이 아니라 결과 뷰가 된다.

### Phase 5: Numbers 마이그레이션

- Numbers를 XLSX로 내보낸 파일을 업로드한다.
- 시트 이름과 헤더를 감지한다.
- 보유 현황, 과거 일별 성과, 월별 성과를 preview로 보여준다.
- 사용자가 확인하면 웹 데이터 모델에 저장한다.
- 이후부터는 웹이 새 스냅샷을 이어서 만든다.

### Phase 6: 검증

- Numbers의 특정 날짜 총액과 웹 계산 결과를 비교한다.
- 전일 대비 증가액, 입금 반영 후 투자손익, 월 누적 수익률을 fixture로 검증한다.
- 가격 provider 실패, 환율 실패, 휴장일, 같은 날짜 중복 스냅샷을 테스트한다.

## 우선순위 제안

1. `PortfolioSnapshot` 모델과 일별/월별 계산부터 만든다.
2. `CashFlow` 입력을 붙여 투자손익과 단순 평가증감을 분리한다.
3. 오늘 스냅샷 저장 기능을 만든다.
4. Node + SQLite로 옮겨 매일 자동 스냅샷 job을 만든다. `완료`
5. XLSX import로 기존 Numbers 데이터를 한 번에 가져온다.

## 이번 MVP에서 바로 할 일

- 기존 정적 상태 구조를 snapshot 기반으로 바꾼다. `완료`
- 대시보드 그래프가 `performance` 샘플이 아니라 `PortfolioSnapshot`에서 그려지게 한다. `완료`
- “가격 업데이트”와 “오늘 성과 저장”을 분리한다. `완료`
- 입금/출금 기록 UI를 추가한다. `완료`
- 계좌별 상세 평가금액과 수익률을 확인할 수 있게 한다. `완료`
- 자동화 전 단계로, 앱을 열었을 때 오늘 스냅샷이 없으면 생성 후보를 보여준다. `다음`

## 이번 구현에서 반영한 화면 구조

- 상단 대시보드: 총 평가금액, 매입금액, 평가손익, USD/KRW
- 성과 흐름: 저장된 `PortfolioSnapshot`의 최근 일별 평가금액 그래프
- 계좌 상세: 투자자/계좌별 평가금액과 수익률
- 일별 성과: 날짜별 평가금액, 일 증감, 입출금, 투자손익, 일 수익률
- 보유 종목: 종목별 수량, 현재가, 평단가, 평가금액, 손익
- 입출금 기록: 성과 계산에서 단순 평가증감과 실제 투자손익을 분리하기 위한 이벤트 입력
