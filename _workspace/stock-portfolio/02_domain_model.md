# 데이터 모델 초안

## 핵심 엔티티

### Investor

- `id`
- `name`
- `display_order`

예: Investor A, Investor B

### Account

- `id`
- `investor_id`
- `name`
- `provider`
- `account_type`
- `base_currency`
- `tax_bucket`

`account_type` 후보: pension, irp, retirement_pension, brokerage, overseas_brokerage.

### Instrument

- `id`
- `name`
- `ticker`
- `market`
- `asset_class`
- `strategy_bucket`
- `currency`

`strategy_bucket` 후보: QQQ, S&P500, domestic_stock.

### Holding

- `id`
- `account_id`
- `instrument_id`
- `quantity`
- `average_cost`
- `cost_currency`
- `as_of_date`
- `source_batch_id`

### PriceSnapshot

- `id`
- `instrument_id`
- `price`
- `currency`
- `as_of_date`
- `source`

### FxRateSnapshot

- `id`
- `base_currency`
- `quote_currency`
- `rate`
- `as_of_date`
- `source`

예: USD/KRW 1450.

### PortfolioSnapshot

- `id`
- `investor_id`
- `account_id`
- `as_of_date`
- `value_krw`
- `deposit_krw`
- `withdrawal_krw`
- `note`

Numbers의 월별/일별 성과 wide table을 이 row 모델로 옮긴다.

### ImportBatch

- `id`
- `source_type`
- `source_filename`
- `imported_at`
- `status`
- `notes`

## 계산식

보유 종목:

- `market_value_native = quantity * current_price`
- `cost_value_native = quantity * average_cost`
- `gain_native = market_value_native - cost_value_native`
- `return_rate = gain_native / cost_value_native`
- `market_value_krw = market_value_native * fx_rate` when currency is not KRW

성과:

- `daily_change = current_total_value - previous_total_value`
- `net_inflow = deposit - withdrawal`
- `investment_gain = daily_change - net_inflow`
- `cumulative_gain = current_total_value - baseline_total_value - cumulative_net_inflow`

## 화면에서 필요한 뷰 모델

### DashboardSummary

- total_value_krw
- total_cost_krw
- total_gain_krw
- total_return_rate
- allocation_by_strategy
- allocation_by_investor
- allocation_by_account_type

### HoldingsTableRow

- investor
- account
- strategy_bucket
- instrument_name
- quantity
- current_price
- average_cost
- market_value_krw
- cost_value_krw
- gain_krw
- return_rate

### PerformancePoint

- date
- total_value_krw
- daily_or_monthly_change_krw
- net_inflow_krw
- investment_gain_krw
- return_rate

## 가져오기 전략

1. Numbers 파일은 직접 서버에서 파싱하지 않는다.
2. 사용자가 Numbers에서 XLSX 또는 CSV로 내보낸 파일을 업로드한다.
3. 업로드된 파일에서 알려진 시트 이름과 헤더를 매칭한다.
4. 결과를 미리보기 화면에서 검증한 뒤 저장한다.
5. 저장 후 원본 파일은 필요하면 즉시 폐기하거나 로컬 전용 저장소에만 둔다.

## 아직 결정할 것

- 배포 형태: 웹사이트로 만든다. MVP는 개인/소규모 사용자를 전제로 하되, 여러 사용자가 자기 포트폴리오를 입력할 수 있게 데이터 모델은 사용자 단위로 분리한다.
- 가격/환율: 미국 주식 우선으로 Yahoo Finance chart endpoint를 작은 로컬 프록시를 통해 사용한다. API key는 필요 없고, quote 응답은 5분, fx 응답은 1시간 캐시한다. 한국 주식 자동 가격은 MVP 이후로 둔다.
- 기록 범위: MVP는 현재 보유 스냅샷과 성과 스냅샷 중심으로 시작하고, 거래장부는 이후 확장으로 둔다.
- 데이터 저장소: MVP는 브라우저 `localStorage`와 작은 로컬 데이터 프록시로 시작한다. 다중 사용자 서비스로 확장할 때 hosted DB와 인증을 붙인다.
