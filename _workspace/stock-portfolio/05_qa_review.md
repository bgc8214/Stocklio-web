# 초기 QA 리뷰

## 판정

`pass with follow-up`

하네스 세팅, 워크북 구조 분석, 웹 MVP 구현은 다음 단계 반복 개발로 이어질 만큼 충분하다. 실제 배포 전에는 Yahoo Finance 호출 실패 케이스와 계산식 fixture를 더 보강해야 한다.

## 확인한 것

- 원본 Numbers 파일과 임시 XLSX export는 레포에 저장하지 않았다.
- `.gitignore`가 `*.numbers`, `*.xlsx`, `*.csv`, `data/private/`, `imports/private/`, `exports/`를 제외한다.
- 보유 현황 표의 핵심 계산식은 웹 앱 계산 로직으로 재현 가능하다.
- 날짜별 성과 표는 wide-table이라 snapshot row 모델로 정규화해야 한다.
- 환율은 상수값이 아니라 기준일이 있는 스냅샷으로 저장해야 한다.
- MVP는 비식별 seed 데이터, `localStorage` 저장, Yahoo Finance 로컬 프록시, quote 5분/fx 1시간 캐시를 구현했다.

## 차단 이슈

없음.

## 후속 수정 권고

- Numbers export와 웹 앱 계산 결과를 비교할 최소 fixture를 만든다.
- Yahoo Finance rate limit, proxy failure, empty quote 응답을 UI 테스트에 추가한다.
- 가격 provider가 미국 주식 우선임을 UI와 문서에서 계속 명확히 한다.
- 화면 문구에서 투자 조언, 수익 보장, 매수/매도 유도 표현을 제거한다.
