---
name: stock-web-builder
description: 포트폴리오 웹앱의 데이터 모델, 라우트, 컴포넌트, 계산 서비스, import 흐름을 구현 계획으로 옮긴다.
---

# 주식 웹 빌더

## 언제 사용할까

- 포트폴리오 웹앱 구현 계획이나 코드 작업을 시작할 때
- 보유 현황 계산, 성과 차트, XLSX import를 설계할 때
- 데이터 모델과 UI 컴포넌트의 경계를 정할 때

## 필요한 입력

- `_workspace/stock-portfolio/01_workbook_audit.md`
- `_workspace/stock-portfolio/02_domain_model.md`
- `_workspace/stock-portfolio/03_mvp_plan.md`
- 현재 코드베이스 구조

## 워크플로우

1. 기존 앱 스택과 패턴을 확인한다.
2. 데이터 저장소와 계산 서비스 경계를 정한다.
3. 대시보드, holdings, allocation, performance, import 라우트를 설계한다.
4. 계산식 테스트 케이스를 만든다.
5. UI는 정보 밀도가 높고 반복 사용에 적합하게 만든다.

## 출력

- 구현 코드
- `_workspace/stock-portfolio/04_web_build_notes.md`
- 계산식 테스트 또는 검증 스크립트

## 검증

- 평가금액, 매입금액, 손익, 수익률 계산이 워크북과 일치해야 한다.
- 환율과 현재가는 기준 시각을 표시해야 한다.

