# 초기 하네스 요약

## 완료

- `stock-portfolio-lab` 프로젝트 생성
- `meta-harness` 설치기로 `.agents/skills/harness/`와 `.codex/skills/harness/` 설치
- git repository 초기화
- Numbers 파일을 임시 XLSX로 내보내 구조 분석
- 주식 포트폴리오 전용 팀 스펙과 초기 산출물 작성
- 초기 QA 리뷰 작성

## 핵심 발견

- 현재 Numbers 파일은 보유 현황, 자산군 총합, 월별 성과, 일별 성과를 함께 관리한다.
- 보유 현황 표는 공통 헤더와 단순 계산식으로 정리되어 있어 웹 앱 계산 로직으로 옮기기 좋다.
- 날짜별 성과 표는 wide-table 구조라 웹 앱에서는 snapshot row 구조로 바꾸는 것이 좋다.
- USD 자산은 환율 스냅샷이 필요하다.

## 다음 단계

1. 웹 스택 선택
2. 초기 앱 골격 생성
3. 샘플/비식별 seed 데이터 생성
4. Yahoo Finance 기반 미국 주식/환율 provider 구현
5. 대시보드와 보유 종목 테이블 구현
6. XLSX import 미리보기 구현
