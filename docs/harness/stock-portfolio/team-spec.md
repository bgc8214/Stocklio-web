# 주식 포트폴리오 웹 서비스 하네스

## 목표

Numbers로 관리 중인 개인 주식 포트폴리오를 웹 서비스로 옮긴다. MVP는 보유 종목, 계좌, 투자자, 자산군, 환율, 평가금액, 매입금액, 손익, 수익률, 월별/일별 성과 흐름을 명확하게 보여주고 관리하는 것이다.

## 아키텍처

바깥 구조는 `Pipeline`이다.

품질 게이트는 `Producer-Reviewer`다. 워크북 분석, 제품 범위, 데이터 모델, 웹 구현 계획을 순서대로 만들고 QA가 금융 데이터 정확성, 개인정보 노출, 계산식 일치성을 검토한다.

실시간 시장 데이터 연동은 MVP 이후로 둔다. 먼저 수동 입력/가져오기 기반의 정확한 계산 모델을 만든다.

## 역할

| 역할 | 책임 | 재사용 스킬 | 작성 파일 |
| --- | --- | --- | --- |
| Orchestrator | 단계 진행, 핸드오프, 최종 요약 | `.agents/skills/stock-portfolio-orchestrator/SKILL.md` | `_workspace/stock-portfolio/final/initial-harness-summary.md` |
| Workbook Analyst | Numbers/XLSX 구조, 시트, 계산식, 데이터 위험 분석 | `.agents/skills/stock-workbook-analyst/SKILL.md` | `_workspace/stock-portfolio/01_workbook_audit.md` |
| Product Strategist | MVP 범위, 사용자 흐름, 제외 범위 정의 | `.agents/skills/stock-product-strategist/SKILL.md` | `_workspace/stock-portfolio/03_mvp_plan.md` |
| Web Builder | 데이터 모델, 라우트, 컴포넌트, 구현 순서 정의 | `.agents/skills/stock-web-builder/SKILL.md` | `_workspace/stock-portfolio/02_domain_model.md` |
| QA Reviewer | 계산식, 개인정보, 금융 표현, 가져오기 경계 검토 | `.agents/skills/stock-qa-reviewer/SKILL.md` | `_workspace/stock-portfolio/05_qa_review.md` |

## 단계 순서

### Phase 0: 요청 정리

- Input sources: 사용자 요청, Numbers 파일 경로, 현재 Playground 상태
- Actions: 프로젝트 목표, 데이터 민감도, 초기 가정을 정리
- Output files: `_workspace/stock-portfolio/00_input/request-summary.md`
- Completion criteria: 웹 서비스 목표와 원본 파일 취급 정책이 명확함

### Phase 1: 워크북 분석

- Input sources: Numbers 파일, 임시 XLSX 변환본, 미리보기 이미지
- Actions: 시트 그룹, 표 헤더, 계산식, 통화/환율, 성과 기록 방식을 분석
- Output files: `_workspace/stock-portfolio/01_workbook_audit.md`
- Completion criteria: 웹 앱으로 옮겨야 하는 기능 단위가 식별됨

### Phase 2: 데이터 모델

- Input sources: 워크북 분석
- Actions: 계좌, 투자자, 종목, 보유수량, 가격, 환율, 스냅샷, 현금흐름 모델 정의
- Output files: `_workspace/stock-portfolio/02_domain_model.md`
- Completion criteria: Numbers 계산식을 웹 앱 계산 로직으로 옮길 수 있음

### Phase 3: MVP 계획

- Input sources: 워크북 분석, 데이터 모델
- Actions: 첫 화면, 보유 종목 관리, 성과 화면, import 흐름, 제외 범위 정의
- Output files: `_workspace/stock-portfolio/03_mvp_plan.md`
- Completion criteria: 구현 시작에 필요한 제품 결정이 충분함

### Phase 4: 웹 구현

- Input sources: MVP 계획, 데이터 모델
- Actions: 앱 스택 선택, 라우트, UI, 데이터 저장, 계산 서비스, import 도구 구현
- Output files: 구현 코드와 `_workspace/stock-portfolio/04_web_build_notes.md`
- Completion criteria: 로컬에서 포트폴리오 데이터를 입력하거나 가져와 대시보드를 볼 수 있음

### Phase 5: QA 검토

- Input sources: 모든 산출물과 구현 코드
- Actions: 계산식 일치성, 민감정보 노출, 금융 표현, 모바일/데스크톱 UX 검토
- Output files: `_workspace/stock-portfolio/05_qa_review.md`
- Completion criteria: `pass`, `fix`, `redo` 중 하나와 근거가 명확함

## 핸드오프 파일

| From | To | File | Purpose |
| --- | --- | --- | --- |
| User | Orchestrator | `_workspace/stock-portfolio/00_input/request-summary.md` | 목표와 원본 파일 위치, 개인정보 취급 가정 보존 |
| Workbook Analyst | Web Builder | `_workspace/stock-portfolio/01_workbook_audit.md` | 현재 Numbers 구조를 기능 요구사항으로 변환 |
| Web Builder | Product Strategist | `_workspace/stock-portfolio/02_domain_model.md` | 계산 가능하고 확장 가능한 데이터 구조 확정 |
| Product Strategist | Orchestrator | `_workspace/stock-portfolio/03_mvp_plan.md` | 구현 우선순위와 제외 범위 확정 |
| QA Reviewer | Orchestrator | `_workspace/stock-portfolio/05_qa_review.md` | 출시 전 차단 이슈와 수정 권고 제공 |

## 실패 정책

- 원본 파일을 읽지 못하면 미리보기 기반으로만 가정하지 말고 변환 경로를 먼저 확보한다.
- 현재가/환율 자동 연동은 출처와 시각을 저장할 수 있을 때만 붙인다.
- 계산식이 Numbers와 다르면 웹 앱 계산식을 우선 설명 가능하게 만들고 차이를 문서화한다.
- 민감한 계좌/보유 내역 원본은 기본적으로 git에 넣지 않는다. MVP 예시 데이터는 비식별 샘플로만 넣는다.
- 이 앱은 투자 조언 서비스가 아니라 개인 기록/계산 도구로 표현한다.

## 검증 체크

- 모든 `SKILL.md`는 `name`과 `description`이 있는 YAML frontmatter로 시작한다.
- 원본 Numbers 파일과 행 단위 export 파일은 gitignore 대상이다.
- seed/fixture 데이터는 실제 사용자명, 실제 총액, 실제 계좌명을 포함하지 않는다.
- 보유 종목 계산은 `평가금액 = 수량 * 현재가`, `매입금액 = 수량 * 평단가`, `손익 = 평가금액 - 매입금액`, `수익률 = 손익 / 매입금액`을 재현한다.
- USD 보유자산은 환율 스냅샷을 통해 원화 평가액으로 변환한다.
- 계좌별, 투자자별, 자산군별, 종목별 집계가 가능하다.
- 월별/일별 성과는 포트폴리오 스냅샷과 입출금 조정값을 분리한다.
- UI는 금융 조언처럼 보이지 않고 기록/관리 도구처럼 보인다.
