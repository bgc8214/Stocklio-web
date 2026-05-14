# 저장소 에이전트 가이드

이 파일은 저장소 전반 규칙만 짧게 담는다. 구체적인 역할과 산출물 계약은 `docs/harness/stock-portfolio/team-spec.md`를 본다.

## 무엇

- 이 저장소는 Numbers로 관리하던 개인 주식 포트폴리오를 웹 서비스로 옮기기 위한 프로젝트다.
- 기준 하네스는 `.agents/skills/harness/`와 `.codex/skills/harness/`에 설치되어 있다.
- 주식 포트폴리오 전용 작업 계약은 `docs/harness/stock-portfolio/`와 `_workspace/stock-portfolio/`에 둔다.

## 이유

- 원본 Numbers 파일의 수동 계산과 시트 구조를 잃지 않고, 웹 앱의 데이터 모델과 화면으로 안전하게 옮기기 위해 존재한다.
- 금융 데이터는 민감하므로 원본 파일과 행 단위 내역은 기본적으로 git에 넣지 않는다.

## 방법

- 금융 조언, 매수/매도 추천, 수익 보장 표현을 만들지 않는다.
- 현재가, 환율, 시장 데이터처럼 변할 수 있는 값은 출처와 시각을 명시한다.
- 원본 Numbers/XLSX 파일은 `data/private/`, `imports/private/`, `exports/`처럼 gitignore된 위치에만 둔다.
- 구현 명령이 정해지면 이 파일에 빌드/테스트/검증 명령을 짧게 추가한다.

