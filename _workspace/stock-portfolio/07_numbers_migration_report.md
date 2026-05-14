# Numbers 마이그레이션 리포트

## 결과

- 원본 Numbers 파일을 임시 XLSX로 내보낸 뒤 SQLite 상태로 마이그레이션했다.
- 실제 데이터 파일은 `data/portfolio.db`에 저장했다.
- 임시 XLSX와 마이그레이션 요약 JSON은 git에 포함하지 않는다.

## 마이그레이션 범위

- 보유 종목: 상세 보유 현황 행 기준
- 성과 스냅샷: 월별/일별 `자산 Flow` 시트 기준
- 환율: `QQQ - 환율` 시트 기준
- 현금흐름: `추가입금` 행에 숫자가 있는 경우만 이벤트화

## 반영된 데이터

- 보유 종목 41개
- 일별/월별 성과 스냅샷 59개
- 마이그레이션 직후 자동화 실행으로 당일 스냅샷 1개 추가
- 예수금 1개. Numbers의 마지막 총자산 스냅샷과 상세 보유 평가액 차이를 `미분류 예수금`으로 잡았다.
- KRW, USD 혼합 통화 계산 지원
- 자동 가격 업데이트 대상 29개
- 수동 가격 유지 대상 12개

## 검증 메모

- 상세 보유 행의 수량, 현재가, 평단가를 기준으로 마이그레이션했다.
- 총합 시트 일부는 상세 보유 행 전체와 일치하지 않았다. 누락된 상세 행이 있는 것으로 보여, 실제 보유 행을 더 신뢰하는 기준으로 삼았다.
- 성과 스냅샷은 `자산 Flow`의 평가금액 행을 `만원` 단위로 해석해 KRW 값으로 저장했다.
- 마이그레이션 후 Yahoo Finance 자동화 수동 실행을 통해 가격/환율 갱신과 당일 스냅샷 생성을 확인했다.

## 검증 명령

```bash
/Users/boss.back/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest tests/test_migration.py
node --check app.js
node --check server.mjs
```
