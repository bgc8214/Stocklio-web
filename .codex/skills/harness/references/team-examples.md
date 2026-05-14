# 팀 예시 모음

이 문서는 하네스를 실제 산출물 형태로 상상하기 쉽게 도와주는 예시들이다.

## 예시 1: 리서치 하네스

추천 패턴: `Fan-out/Fan-in`

대표 산출물:

- `docs/harness/research/team-spec.md`
- `_workspace/01_official_findings.md`
- `_workspace/01_market_findings.md`
- `_workspace/01_community_findings.md`
- `_workspace/02_synthesis.md`
- `_workspace/final/report.md`

## 예시 2: 코드 리뷰 하네스

추천 패턴: `Fan-out/Fan-in + Producer-Reviewer`

대표 산출물:

- `docs/harness/review/team-spec.md`
- `_workspace/01_architecture_findings.md`
- `_workspace/01_security_findings.md`
- `_workspace/01_performance_findings.md`
- `_workspace/02_merged_findings.md`
- `_workspace/final/review-report.md`

## 예시 3: 웹 제품 구축 하네스

추천 패턴: `Pipeline`

대표 산출물:

- `docs/harness/product/team-spec.md`
- `_workspace/01_product_strategy.md`
- `_workspace/02_ux_spec.md`
- `_workspace/03_build_plan.md`
- `_workspace/04_qa_review.md`
- `_workspace/final/mvp-summary.md`

## 역할 문서 vs 스킬 문서

- 반복적으로 재사용될 행동: `.agents/skills/{role}/SKILL.md`
- 이번 도메인에만 필요한 역할 설명: `docs/harness/{domain}/roles/{role}.md`

## 결과물 이름 규칙 예시

- `_workspace/00_input/request-summary.md`
- `_workspace/01_{role}_{artifact}.md`
- `_workspace/02_{role}_{artifact}.md`
- `_workspace/03_review_{artifact}.md`
- `_workspace/final/{deliverable}.md`
