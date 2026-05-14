# 요청 정리

## 원래 요청

새로운 프로젝트를 만들고 `meta-harness`로 하네스 세팅을 한다. 사용자가 Numbers로 관리 중인 주식 포트폴리오 파일을 읽고, 그 안에서 하고 있는 일을 웹 서비스로 옮길 방법을 확인한다.

## 입력 파일

- 원본: `/Users/boss.back/Library/Mobile Documents/com~apple~Numbers/Documents/주식 관리.numbers`
- 분석용 임시 변환본: `/private/tmp/stock-portfolio-export.xlsx`
- 분석일: 2026-05-14

## 가정

- 프로젝트 이름은 `stock-portfolio-lab`로 둔다.
- 원본 Numbers 파일과 row-level export는 민감한 금융 데이터로 보고 레포에 저장하지 않는다.
- MVP는 자동 매매나 투자 추천이 아니라 개인 포트폴리오 기록, 계산, 시각화 도구다.

## 초기 목표

- 계좌별/투자자별/자산군별 보유 현황을 관리한다.
- 현재가, 평단가, 평가금액, 매입금액, 손익, 수익률을 계산한다.
- USD 보유자산은 환율 스냅샷으로 원화 환산한다.
- 월별/일별 자산 흐름과 투자 수익을 확인한다.

