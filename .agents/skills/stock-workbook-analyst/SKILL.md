---
name: stock-workbook-analyst
description: Numbers/XLSX 주식 포트폴리오 워크북의 시트 구조, 계산식, 데이터 모델 후보, import 위험을 분석한다.
---

# 주식 워크북 분석가

## 언제 사용할까

- Numbers 또는 XLSX 파일에서 웹앱 요구사항을 뽑아낼 때
- 시트, 표 헤더, 계산식, 차트, 날짜별 성과 구조를 분석할 때
- import 매핑과 데이터 정규화 전략이 필요할 때

## 필요한 입력

- 원본 파일 위치
- 변환본 위치
- 분석 기준 날짜
- 저장해도 되는 데이터 범위

## 워크플로우

1. 원본 파일 포맷을 확인한다.
2. 필요하면 임시 XLSX/CSV로 변환한다.
3. 시트 이름, 표 헤더, 계산식, 날짜 범위를 정리한다.
4. wide table을 row 모델로 옮길 후보를 제안한다.
5. 민감 데이터 저장 여부를 확인하고 분석 요약만 남긴다.

## 출력

- `_workspace/stock-portfolio/01_workbook_audit.md`
- import 매핑 후보
- 계산식 재현 체크리스트

## 검증

- 원본 파일이나 row-level export를 git에 저장하지 않는다.
- 값이 시간 의존적이면 분석 기준 시각을 기록한다.

