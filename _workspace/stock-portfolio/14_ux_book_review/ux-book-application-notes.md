# UX 책 적용 기반 Stocklio 개선 노트

## 목적

블로그 서평에서 `책의 UX 법칙 → Stocklio 적용 전 문제 → 적용 후 개선` 흐름으로 설명할 수 있도록 화면 증거와 개선 근거를 남긴다.

## 적용 전 캡처

- `before/before-desktop-dashboard.png`
- `before/before-desktop-holdings.png`
- `before/before-desktop-accounts.png`
- `before/before-desktop-performance.png`
- `before/before-desktop-automation.png`
- `before/before-desktop-login-entry.png`
- `before/before-mobile-dashboard.png`
- `before/before-mobile-holdings.png`
- `before/before-mobile-performance.png`

## 적용 후 캡처

- `after/after-desktop-dashboard.png`
- `after/after-desktop-holdings.png`
- `after/after-desktop-accounts.png`
- `after/after-desktop-performance.png`
- `after/after-desktop-automation.png`
- `after/after-desktop-login-entry.png`
- `after/after-mobile-dashboard.png`
- `after/after-mobile-dashboard-viewport.png`
- `after/after-mobile-holdings.png`
- `after/after-mobile-holdings-viewport.png`
- `after/after-mobile-performance.png`
- `after/after-mobile-performance-viewport.png`

## 책 목차 기준 진단

| 책의 법칙 | Stocklio에서 보인 문제 | 개선 방향 |
| --- | --- | --- |
| 첫인상이 중요하다 | 모바일 첫 화면에서 카드가 한 줄로 길게 이어져 핵심 데이터까지 스크롤이 길다. | 모바일 KPI 카드를 더 압축해 핵심 수치를 빠르게 스캔하게 한다. |
| 바로 행동하게 하라 | 대시보드 상단에서 `편집`, `시세 확인`, `종목 추가`가 같은 무게로 보인다. | `종목 추가`를 우선 CTA로 두고, 화면 편집은 보조 작업으로 낮춘다. |
| 피드백은 빠르고 정확하게 하라 | 가격 갱신 토스트가 모바일 하단 내비게이션과 콘텐츠를 가린다. | 토스트를 상단 알림처럼 이동해 상태는 보이되 작업 영역은 가리지 않게 한다. |
| 사용자를 기만하지 않아야 한다 | 네이버 앱에서 Google 로그인이 제한될 수 있다는 맥락이 약하다. | 로그인 안내 문구에 제한 상황과 권장 로그인 방식을 명확히 쓴다. |
| 결국 가독성이 중요하다 | 금융 숫자와 상태 알림이 겹치면 사용자가 먼저 볼 정보를 놓친다. | 숫자 카드와 피드백 요소의 위치/밀도를 분리한다. |
| 전략적으로 정보를 전달하라 | 대시보드 첫 화면에서 액션과 상태 피드백이 핵심 자산 카드와 경쟁한다. | 핵심 자산 카드는 유지하고, 작업 버튼과 피드백을 더 명확한 위계로 정리한다. |

## 이번 적용 항목

- 적용 전 웹/모바일 주요 화면 캡처
- 모바일 대시보드 KPI 카드 2열 압축
- 총자산 카드는 모바일에서도 전체 폭 유지
- 가격 갱신/저장 토스트를 하단 내비게이션 위가 아닌 상단 알림으로 이동
- 대시보드 CTA 순서 조정: 종목 추가 → 시세 확인 → 화면 편집
- 로그인 안내 문구 개선

## 블로그에서 쓸 수 있는 관찰 문장

책에서 말한 "사용자는 정독하지 않고 스캔한다"는 문장을 실제 서비스에 대입해보니, 모바일 첫 화면에서 가장 큰 문제는 기능 부족이 아니라 정보 밀도였다. 필요한 정보는 있었지만, 사용자가 빠르게 훑기에는 카드가 길고 피드백 알림이 화면을 가리고 있었다. 그래서 기능을 더 추가하기보다 핵심 수치를 더 빨리 보이게 하고, 피드백은 보이되 방해하지 않는 위치로 옮겼다.
