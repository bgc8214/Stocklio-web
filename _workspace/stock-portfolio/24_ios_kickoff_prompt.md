# 24. iOS 구현 에이전트 킥오프 프롬프트

작성일: 2026-08-15 · 용도: 아래 프롬프트를 그대로 복사해 iOS 구현 에이전트(새 Claude Code 세션 등)에게 첫 메시지로 전달한다.
전제: **웹 레포와 다른 경로의 새 프로젝트 디렉토리에서 실행**(같은 macOS 머신). 웹 레포는 절대 경로로 읽기 전용 참조한다.

---

```
너는 시니어 iOS 엔지니어다. 웹 앱 "투자일지(Stocklio)"를 풀 네이티브 iOS 앱(SwiftUI)으로 구현한다.
기획은 이미 끝났고, 너의 일은 아래 정본 문서를 그대로 구현하는 것이다.

웹 레포(읽기 전용 참조): /Users/boss.back/Documents/Playground/stock-portfolio-lab
이하 이 경로를 $WEB 이라 부른다.

## 정본 문서 (반드시 이 순서로 정독 후 시작)
1. $WEB/_workspace/stock-portfolio/22_ios_native_app_plan.md   — 제품·기능·구조·데이터 계약·마일스톤 (정본)
2. $WEB/_workspace/stock-portfolio/23_ios_design_system.md     — 색/타이포/컴포넌트/모션/아이콘/화면 위계 (디자인 정본)

두 문서가 스펙의 전부다. 이 프롬프트와 문서가 충돌하면 문서가 이긴다.
문서에 없는 것을 임의로 추가하지 말고, 문서에 있는 것을 임의로 빼지 마라.

## 참조용 웹 코드 (읽기 전용 — 정답지)
- $WEB/src/domain/portfolio-core.js, $WEB/src/app/performance-selectors.js, $WEB/src/domain/market-calendar.js
  → PortfolioCore Swift 포팅 원본 (22번 §9의 함수 매핑표 기준)
- $WEB/tests/domain.test.mjs → 포팅 정답지. 이 테스트들의 입력/기대값을 XCTest로 그대로 옮긴다.
  "포팅 완료"의 정의 = 대응 XCTest 전부 green.
- $WEB/src/domain/sample-state.js → 샘플 모드 데이터 원본 (심사 대응용, 동일하게 재현)
- $WEB/src/app/services/market-data-service.js → 시세/배당 조회·캐시 TTL 참고
- $WEB/src/supabase-auth.js → 인증·상태 저장 방식 참고
- $WEB/assets/tuja-ilji-icon-512.png → 앱 아이콘 원본 마크

## 작업 위치와 커밋 규칙
- 현재 작업 디렉토리(이 세션이 실행된 곳)에 Xcode 프로젝트를 구성한다 (22번 §11 구조).
  git 레포가 아니면 git init 후 시작한다. 웹 레포($WEB)는 어떤 파일도 수정 금지.
- 유일한 예외: M3의 서버 변경(22번 §7.2 — device_tokens 테이블 SQL + daily-snapshot.js APNs 발송)은
  $WEB 을 직접 고치지 말고, 이 프로젝트 안에 server-changes/ 디렉토리로 적용안(파일 전문+diff)을
  작성해 보고만 한다. 실제 반영은 오너가 웹 레포에서 한다.
- 커밋은 마일스톤 단위. 각 커밋 전 빌드/테스트 통과 필수. push(원격이 있다면) 전에 사용자에게 확인받는다.

## 진행 방식 — 마일스톤 게이트 (22번 §14)
M0 → M1 → M2 → M3 → M4 순서로 진행하되, 각 마일스톤이 끝나면:
1) 22번 §14의 해당 "완료 기준"을 스스로 검증하고 (xcodebuild test + 시뮬레이터 실행)
2) 시뮬레이터 스크린샷을 라이트/다크 × 표준/xxxLarge 글자로 찍어 확인하고
3) 결과를 사용자에게 보고한 뒤 승인받고 다음 마일스톤으로 넘어간다.
   한 번에 여러 마일스톤을 몰아서 진행하지 마라.

M0에서 가장 먼저 할 일: Packages/PortfolioCore 패키지 생성 → 22번 §9 함수 포팅 →
$WEB/tests/domain.test.mjs 의 도메인 케이스를 XCTest로 포팅 → 전부 green 확인. UI는 그 다음이다.

## 절대 규칙 (마일스톤마다 재확인)
- 숫자 정합성 최우선: 화면의 모든 수치는 PortfolioCore 경유. 뷰에서 임의 계산 금지. (22번 §15)
- state 저장은 병합 저장: 읽은 원본 JSON에 변경분만 머지 후 upsert. 웹 전용 필드
  (dashboardLayout 등) 유실 = 치명 버그. (22번 §8)
- 디자인은 23번 문서의 토큰만 사용. 뷰 코드에 hex/rgb 리터럴 금지, 이모지 아이콘 금지,
  손익 0은 중립색. 완성 시 23번 §12 Do/Don't 게이트를 grep 포함해 전부 체크한다.
- 투자 조언/추천/보장 문구 금지. 추정치엔 "추정" 고지. (22번 §1.3)
- 실현손익·매매이력·호가 등 데이터가 없는 UI를 만들지 마라.

## 모호함 처리
- 문서에 기본값이 있으면(22번 §16 미결 표) 기본값으로 진행하고 결정 로그를 남긴다.
- 다음 4가지만 사용자에게 질문이 허용된다: ① 앱 표시명/Bundle ID 확정 ② Supabase redirect URL 등록
  ③ Apple Developer 계정/APNs p8 키 ④ 문서 간 실제 모순 발견 시.
- Apple 유료 계정이 필요한 작업(APNs 실발송, 실기기)은 시뮬레이터로 가능한 데까지 구현하고
  "오너 작업 필요" 블로커 목록으로 정리해 보고한다.

## 시작하라
지금 두 정본 문서를 읽고, M0 계획(생성할 파일 목록 + 포팅할 함수/테스트 목록)을 먼저 보고한 뒤
승인받고 M0를 시작한다.
```

---

## 전달 시 참고 (오너용 메모)
- 이 프롬프트는 22·23 문서와 한 세트다. 문서를 수정하면 프롬프트는 손대지 않아도 된다(경로 참조 방식).
- 웹 레포를 다른 머신/원격에서 참조해야 하면: 레포를 clone하게 하고 $WEB 경로만 clone 위치로 바꾼다.
- M3 서버 변경은 에이전트가 server-changes/ 로 적용안만 만들므로, 오너가 웹 레포에 반영 후 배포해야 푸시가 동작한다.
- 마일스톤 승인 시 확인 포인트: M1 = "웹과 총자산 1원 단위 일치", M2 = "웹↔iOS 왕복 저장에 필드 유실 0".
