# 웹 구현 노트

## MVP 결정

- 형태: 웹사이트와 작은 로컬 데이터 프록시
- 저장소: 브라우저 `localStorage`
- 가격 provider: Yahoo Finance chart endpoint, API key 없음
- 범위: 미국 주식/ETF 우선
- 한국 주식 자동 가격: MVP 이후
- seed 데이터: 비식별 샘플 데이터

## 구현 범위

- 대시보드 요약
- 보유 종목 테이블
- 투자자/전략/계좌유형별 비중
- 간단한 성과 추이
- holding 추가/삭제
- 미국 주식 현재가와 USD/KRW 환율 업데이트
- quote 5분 캐시, fx 1시간 캐시, 실패 상태 표시
- `/api/yahoo/chart?symbol=...` 로컬 프록시로 브라우저 CORS 회피

## 보안/개인정보

- API key를 사용하지 않는다.
- 실제 Numbers export는 레포에 저장하지 않는다.
- 샘플 데이터는 실제 사용자명, 계좌명, 금액을 쓰지 않는다.
