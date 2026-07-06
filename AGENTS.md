# 저장소 에이전트 가이드

이 파일은 저장소 전반 규칙만 짧게 담는다. 구체적인 역할과 산출물 계약은 `docs/harness/stock-portfolio/team-spec.md`를 본다.

## 무엇

- 이 저장소는 개인 주식 포트폴리오를 관리하는 독립 웹 서비스(Stocklio)다. Numbers 스프레드시트를 대체하는 것이 초기 계기였지만, 지금은 그 계기와 분리된 자체 제품으로 본다.
- 기준 하네스는 `.agents/skills/harness/`와 `.codex/skills/harness/`에 설치되어 있다.
- 주식 포트폴리오 전용 작업 계약은 `docs/harness/stock-portfolio/`와 `_workspace/stock-portfolio/`에 둔다.

## 이유

- 계산 정확성(평가금액, 손익, 수익률, 환율 변환)과 민감한 금융 데이터를 안전하게 다루기 위해 전용 역할과 산출물 체계를 둔다.
- 금융 데이터는 민감하므로 원본 파일과 행 단위 내역은 기본적으로 git에 넣지 않는다.
- Numbers 워크북 분석 역할(`stock-workbook-analyst`)은 초기 마이그레이션 단계에서 쓰인 역할로, 지금은 신규 기능/제품 방향 작업에서는 우선순위가 낮다.

## 방법

- 금융 조언, 매수/매도 추천, 수익 보장 표현을 만들지 않는다.
- 현재가, 환율, 시장 데이터처럼 변할 수 있는 값은 출처와 시각을 명시한다.
- 원본 Numbers/XLSX 파일은 `data/private/`, `imports/private/`, `exports/`처럼 gitignore된 위치에만 둔다.
- 구현 명령이 정해지면 이 파일에 빌드/테스트/검증 명령을 짧게 추가한다.

