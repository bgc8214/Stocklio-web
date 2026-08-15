# 22. 투자일지(Stocklio) — 풀 네이티브 iOS 앱 기획·구조 문서

작성일: 2026-08-15 · 상태: **확정 기획(v1)** · 대상 독자: 이 앱을 처음 보는 iOS 구현 에이전트/개발자

> **이 문서의 목적**: 이 문서 하나만 읽고 iOS 앱을 처음부터 끝까지 만들 수 있게 하는 것.
> 웹 코드를 참고할 수 있는 곳은 "참조:" 로 파일 경로를 명시했다. 웹을 못 보는 상황에서도
> 이 문서의 데이터 계약·화면 스펙만으로 구현이 가능해야 한다.

---

## 0. 한 장 요약

- **제품**: 멀티 계좌 주식 포트폴리오 기록·조회 앱. 매매 실행 없음(브로커 아님). 한국 사용자 대상(KRW 중심, 미국+한국 주식).
- **전략**: SwiftUI 풀 네이티브. **Supabase에 직접 연결**(웹과 같은 데이터, 실시간 동기화 공짜), 순수 계산 로직만 Swift 패키지로 포팅. 새 백엔드는 **푸시(APNs) 한 조각**만 추가.
- **iOS만의 가치**: ① 홈/잠금화면 **위젯**(총자산·일간변동) ② **APNs 푸시**(텔레그램 의존 제거) ③ **Face ID 잠금** ④ 네이티브 차트/햅틱.
- **버리는 것**: 대시보드 드래그 편집, 엑셀 가져오기, JSON 백업, 텔레그램 설정 UI, 시뮬레이터(P2 보류).
- **핵심 제약**: 투자 조언·매수/매도 추천·수익 보장 문구 절대 금지(전 화면). 서비스 롤 키는 서버 전용.

---

## 1. 제품 정의

### 1.1 무엇을 하는 앱인가
여러 증권사 계좌에 흩어진 주식·예수금을 **한 곳에 기록**하고, 자동으로 갱신되는 시세/환율로
**총자산·손익·배당 예상·성과 흐름**을 보여주는 개인 투자 기록 앱. 사용자가 직접 수량·평단가를
입력한다(증권사 연동 스크래핑 없음).

### 1.2 대상 사용자
- 2개 이상 증권사 계좌(직접투자+연금)에 미국/한국 주식을 나눠 담은 한국 개인투자자.
- 하루 1~3회 "지금 얼마지?"를 확인하는 습관형 사용자. → 위젯·푸시가 핵심 리텐션 장치.

### 1.3 제품 원칙 (전 화면 공통, 위반 시 심사 리젝 사유)
1. **투자 조언 금지**: 매수/매도 추천, 수익 보장, "지금 사세요" 류 문구·UI 절대 없음.
   모든 예측성 수치(예상 배당 등)에는 "세전 추정치, 미래 보장 아님" 명시.
2. **손익 색상은 한국 관례**: 상승/이익 = 빨강(`gain`), 하락/손실 = 파랑(`loss`), **0 = 중립색**.
3. **기록은 사용자의 것**: 계정 삭제·데이터 초기화 제공(Apple 필수 요건이기도 함).

---

## 2. 현재 웹 자산 인벤토리 (무엇이 이미 있는가)

### 2.1 백엔드 (그대로 재사용 — iOS에서 새로 만들 것 없음)
| 자산 | 내용 | iOS에서의 사용 |
|---|---|---|
| Supabase Auth | Google OAuth, **custom:naver** OAuth, 이메일 매직링크(OTP) | supabase-swift SDK로 동일 사용 |
| Supabase DB `portfolio_states` | `user_id`(PK) + `state`(JSONB, 아래 §8) + RLS | 직접 read/upsert |
| Supabase DB `notification_settings` | 유저별 알림 설정 | 푸시 설정 저장(확장) |
| Supabase DB `notification_delivery_logs` | 발송 이력 | 읽기(선택) |
| Vercel `/api/yahoo/chart?symbol=&range=&interval=&events=div` | 시세·환율·배당 프록시(키 불필요, 5분/1시간 CDN 캐시) | 그대로 호출 |
| Vercel `/api/yahoo/search?q=` | 티커 자동완성 | 그대로 호출 |
| Vercel `/api/yahoo/history?symbol=&start=&end=&interval=` | 과거 시세(시뮬레이터용) | P2 |
| Vercel Cron `daily-snapshot` (UTC 22:00 = KST 07:00) | 전 유저 시세 갱신+스냅샷 저장 (서비스 롤 키) | 변경 없음 — 앱은 결과만 읽음 |
| 프로덕션 호스트 | `https://stocklio-web.vercel.app` | API base URL |

### 2.2 도메인 로직 (순수 JS → Swift 포팅 대상, §9)
참조: `src/domain/portfolio-core.js`, `src/app/performance-selectors.js`, `src/domain/market-calendar.js`
- 총자산/손익 집계, 스냅샷 구성, 배당 TTM 파싱·프로젝션·월별 스케줄·다음 배당,
  성과 통계(기간증감·투자손익·MDD), 미국장 캘린더(주말/휴장 판단).
- **기존 JS 단위테스트 45개**(`tests/domain.test.mjs`)가 곧 스펙이다. 포팅 시 XCTest로 함께 포팅해
  숫자 1원 단위까지 일치를 검증한다.

### 2.3 웹 화면 7개 탭
대시보드 / 보유 종목 / 계좌 / 성과 / 입출금(+배당) / 설정(알림·자동기록·백업) / 시뮬레이터

---

## 3. 아키텍처 결정 (ADR)

### ADR-1: 데이터 접근 = Supabase 직결 (신규 REST 백엔드 만들지 않음)
- **결정**: iOS는 supabase-swift로 `portfolio_states.state`(JSONB)를 직접 읽고/쓴다. 웹과 동일한 방식.
- **이유**: 웹과 실시간 동일 데이터(동기화 로직 0), RLS로 보안 확보, 백엔드 신규 개발 0.
- **기각한 대안**: Vercel에 `/api/portfolio/*` REST를 새로 깔고 서버가 집계까지 계산해 내려주는 방식.
  → 쓰기 API 전체(종목/계좌/예수금/입출금 CRUD)를 새로 만들어야 해서 v1 범위 초과. 집계 계산은
  작고 순수해서(§9) Swift 포팅 비용이 더 싸다.

### ADR-2: 계산 로직 = `PortfolioCore` Swift 패키지로 1회 포팅
- **결정**: §9의 순수 함수만 Swift로 포팅. UI/저장/네트워크와 무관한 값 계산 전용 패키지.
- **이유**: 오프라인에서도 화면이 계산 가능, 위젯도 같은 패키지 사용. JS 테스트 45개가 정답지 역할.
- **동기화 리스크 완화**: 도메인 수정은 "JS 먼저 + 테스트 추가 → Swift에 동일 반영" 규칙을 문서화.

### ADR-3: 시세 = 기존 Vercel Yahoo 프록시 재사용
- iOS가 Yahoo를 직접 치지 않고 반드시 프록시를 경유(캐시 공유, UA 일관, 차단 리스크 격리).
- **리스크**: Yahoo 비공식 API. 스토어 앱으로 규모가 커지면 유료 시세 API 교체 검토(§16).

### ADR-4: 쓰기 충돌 = Last-Write-Wins (현행 웹과 동일)
- state 전체를 upsert하는 read-modify-write 모델. 웹과 iOS 동시 편집 시 마지막 저장이 이긴다.
- v1 완화책: 저장 직전 서버 state를 다시 읽어 `savedAt`(state 내부에 iOS가 새로 기록)이 로컬 로드
  시점보다 최신이면 "다른 기기에서 수정됨 — 새로고침 후 다시 시도" 알럿. (엄밀한 머지는 비범위)

### ADR-5: 최소 타깃 iOS 17, SwiftUI + @Observable(MVVM), Swift Charts, async/await
- 라이브러리: `supabase-swift`(공식)만 외부 의존. 차트·키체인·위젯 전부 1st party.

---

## 4. 기능 매핑 — 유지 / 변형 / 제거 / 신규

### 4.1 유지 (동작 동일, UI만 네이티브)
| 기능 | 비고 |
|---|---|
| 보유 종목 CRUD (계좌·전략·수량·평단·목표가·손절가) | 티커 검색 자동완성 포함 |
| 계좌 CRUD + 예수금 인라인 편집 (investor+account+currency 단일 upsert) | 웹 19번 문서의 UX 원칙 유지 |
| 입출금 기록 (입금/출금/배당 3종 — 세금/수수료는 이미 제거됨) | 배당 빠른입력 유지 |
| 예상 배당 (연/월평균/수익률, 종목별 랭크, 월별 캘린더, 다음 배당) | |
| 성과 (KPI, 손익 흐름, 월별/일별 표, 총자산 추세, 기여 분석) | Swift Charts로 재구현 |
| 통화 표시 토글 (₩ ↔ $) | |
| 시세/환율 수동 새로고침 | pull-to-refresh로 자연스럽게 |
| 샘플 데이터 모드 (비로그인) | **심사 필수** — 리뷰어가 로그인 없이 전 기능 확인 |

### 4.2 변형 (iOS에 맞게 재설계)
| 웹 | iOS |
|---|---|
| 사이드바 7탭 + 모바일 하단 nav | **탭바 5개** (§5) — 계좌·입출금은 상위 탭에서 흡수 |
| 종목 상세 "드로어" | **push 네비게이션** 상세 화면 (iOS 관례) |
| 종목 추가/수정 드로어 | **sheet(.medium/.large detent)** |
| 행 ⋮ 메뉴 (수정/삭제) | **스와이프 액션** + 컨텍스트 메뉴 |
| 텔레그램 알림 | **APNs 푸시** (§7.2) — 텔레그램은 웹 전용으로 존치 |
| 대시보드 상태 스트립 "가격 갱신 중" | 당겨서 새로고침 + 미세한 갱신 시각 라벨 |
| 입출금 미기록 경고 배너 | 동일 배너 (성과 탭) |

### 4.3 제거 (iOS 비범위 — 웹에는 그대로 존치)
| 기능 | 제거 이유 |
|---|---|
| 대시보드 카드 드래그 편집(Craft.js 레이아웃) | 폰에서 가치 낮음. 고정 레이아웃 + 위젯으로 대체 |
| 엑셀(XLSX) 가져오기 | 원래 로컬 데스크톱 전용. "웹에서 가져오면 자동 동기화됨" 안내만 |
| JSON 백업/복원 | 클라우드 저장이 원본. 필요 시 웹 사용 안내 |
| 텔레그램 chat id 설정 UI | APNs로 대체 |
| 시뮬레이터(몰빵 vs 적립식) | **P2 보류** — v1 범위 아님. 도메인(`simulator-core.js`)은 이미 순수라 P2에 포팅만 하면 됨 |
| 랜딩 페이지/로그인 화면의 데모 배너 | 온보딩 플로우로 대체 |

### 4.4 신규 (iOS 전용 — 이 앱의 존재 이유)
| 기능 | 우선순위 |
|---|---|
| **홈/잠금화면 위젯** (§7.1) | P0 |
| **APNs 푸시** — 일일 요약, 큰 변동 알림 (§7.2) | P0 |
| **Face ID/Touch ID 앱 잠금** (설정에서 on/off) | P0 |
| 햅틱 (저장 성공 `.success`, 삭제 `.warning`) | P0 |
| 온보딩 (3장: 소개 → 샘플 둘러보기/로그인 선택 → 알림 권한) | P0 |
| **계정 삭제** (Apple 필수: 계정 생성이 있으면 삭제도 있어야 심사 통과) | P0 |
| 잠금화면 위젯 (inline/circular: 총자산 or 일간변동) | P1 |
| 성과 요약 이미지 공유(ShareLink) | P2 |
| Spotlight 인덱싱(보유 종목 검색) | P2 |

---

## 5. 정보 구조 (IA) — 탭 5개

```
TabView
├─ ① 홈          HomeView
├─ ② 보유        HoldingsView
├─ ③ 배당        DividendsView
├─ ④ 성과        PerformanceView
└─ ⑤ 설정        SettingsView
```

- **계좌·예수금 관리**: 홈의 "계좌" 카드 → push / 설정 > 계좌 관리 → 동일 화면. (탭 승격할 만큼 빈도 높지 않음)
- **입출금 기록**: 배당 탭 하단 섹션 + 성과 탭 경고 배너에서 딥링크.
- 네비게이션은 탭마다 독립 `NavigationStack`.

### 화면 목록 전체 (구현 단위)
| ID | 화면 | 진입 |
|---|---|---|
| S1 | 온보딩(3장) | 첫 실행 |
| S2 | 로그인 (Naver/Google/이메일) | 온보딩·설정 |
| S3 | 홈 | 탭① |
| S4 | 보유 목록 (종목별 기본 ↔ 계좌별 토글) | 탭② |
| S5 | 종목 상세 (계좌별 분해) | S4 push |
| S6 | 종목 추가/수정 sheet | S4/S5 |
| S7 | 배당 (예상+캘린더+다음배당+수령기록) | 탭③ |
| S8 | 입출금 추가 sheet | S7 |
| S9 | 성과 | 탭④ |
| S10 | 설정 | 탭⑤ |
| S11 | 계좌 목록+예수금 편집 | S3/S10 push |
| S12 | 계좌 추가/수정 sheet | S11 |
| S13 | 알림 설정 | S10 push |
| S14 | Face ID 잠금 화면 | 앱 활성화 시 오버레이 |
| W1 | 위젯 (small/medium/lock) | 홈/잠금화면 |

---

## 6. 화면별 상세 스펙

> 모든 금액 표기: `tabular-nums`(monospacedDigit), KRW는 `1,234,567원`, USD는 `$1,234.56`.
> 통화 토글(₩/$)은 홈·보유에서 공유하는 전역 설정(UserDefaults).
> 손익 색: `gain`(빨강)/`loss`(파랑)/0은 `secondary`. 부호 접두(+/−) 필수, 0은 무부호.

### S3. 홈
목적: "지금 내 자산이 얼마고 오늘 무엇이 움직였나"를 10초 안에.
- **총자산 히어로**: `getTotals().valueKrw` 크게. 아래 작은 줄: 주식평가 + 예수금 구성.
- **오늘 변동 카드**: `lastPriceRefreshImpact` 기반 — 오늘 추정 변동액(가격/환율 분해), 상위 기여 종목 3개
  (종목명·기여액·기여%). 주말/휴장이면 "주말에는 새 종목별 변동을 표시하지 않습니다"(market-calendar 로직).
- **자산 비중 도넛**: 전략별 기본, segment로 전략/종목/계좌/계좌유형 전환. 팔레트 §12.
- **다음 배당 카드**: `getNextDividendMonth()` — "다음 배당 · 이번 달 · 약 N원 · 티커들". 탭 → 배당 탭.
- **계좌 요약 카드**: 계좌 수·예수금 합계·**예수금 미입력 N개**(있으면 경고 톤). 탭 → S11.
- pull-to-refresh: 시세+환율 갱신(§10.3) 후 재계산. 마지막 갱신 시각 표시.
- 비로그인(샘플 모드): 상단에 "예시 데이터입니다 · 로그인" 배너.

### S4. 보유 목록
- 기본 **종목별**(티커 합산 카드 그리드): 로고·이름·티커·평가액(KRW)·수익률·일변동·비중, 우하단 은은한 chevron.
  탭 → S5. (웹 21번 문서의 합산 로직: 같은 티커 quantity/value/cost/dayMove 합산)
- **계좌별** 토글: 평탄한 리스트(투자자·계좌·전략 캡션 + 수량·현재가·평단·평가액·일영향·손익·수익률).
  행 스와이프: 수정(S6)/삭제(확인 다이얼로그: "성과 계산에도 반영됩니다").
- 필터: 검색(이름/티커/계좌), 투자자, 전략, 계좌유형, 수익/손실 segment. 정렬: 평가액/손익/수익률/일영향/수량/이름.
- 요약 스트립: 총 평가금액·총 손익(+%)·일 영향·상위 3종목 집중도.

### S5. 종목 상세 (push)
- 헤더: 로고·이름·티커·현재가·일간변동(%).
- 요약 그리드: 평가금액/원금/총손익(+%)/일 영향/평단(합산)/수량(합산)/포트폴리오 비중.
- **예상 연 배당 콜아웃**(perShare>0일 때): 금액 + 수익률.
- **계좌별 보유 분해**: 계좌·투자자·수량·평단 / 평가액·손익(%). ← 이 화면의 존재 이유.
- 하단 고지: "평단가 기준 세전 손익입니다. 실현손익·매매 이력은 지원하지 않습니다."
- 툴바: 수정(첫 보유 편집 sheet), (보유가 여러 계좌면 행별 수정).
- **실현손익·매매이력·호가는 절대 넣지 않는다**(데이터 없음 — 가짜 금지).

### S6. 종목 추가/수정 sheet
- 필드: 계좌(피커, S11의 계좌 목록), 계좌유형(직접투자/연금), 전략(기존 전략 + 직접입력),
  티커 검색(`/api/yahoo/search` 자동완성 — symbol/name/exchange 표시), 수량(소수 4자리), 평단가,
  목표가/손절가(선택).
- 저장: 신규면 append + 즉시 시세 조회, 수정이면 해당 id 교체. 성공 햅틱+토스트.
- 검증: 수량·평단 > 0, 통화는 티커로 자동(6자리 숫자[.KS] → KRW, 그 외 USD).

### S7. 배당
- 요약 4카드: 예상 연 배당 / 월 평균 / 배당 수익률 / 배당 종목 수(티커 기준).
- **다음 배당 한 줄**: "이번 달(또는 N월) · 약 N원 · 상위 티커".
- segment: **종목별**(연배당 비례 막대 랭크 리스트: 티커·이름·연배당·수익률·연N회·N주·N계좌)
  ↔ **월별**(현재 월부터 12개월 전방 캘린더 막대, 피크 월 강조, 현재 월 마커, 캡션 "향후 12개월 예상 · 최근 1년 배당 기준").
- 고지: "최근 1년 실제 지급 배당 기준 세전 추정 · 환율 N 적용 · 향후 변동·세금 미반영".
- **배당 수령 기록**(실제): 월별 미니 바 차트 + 기록 리스트. 빈 상태: "배당 빠른 입력으로 기록하세요".
- **입출금 기록** 섹션: 최근 30건(날짜·계좌·유형·금액·메모), 추가 버튼 → S8, 스와이프 수정/삭제.
- 배당 빠른 입력: 보유 티커 칩 → S8을 배당 유형+계좌+메모 프리필로 오픈.

### S8. 입출금 추가 sheet
- 날짜(기본 오늘)·계좌 피커·유형(입금/출금/배당)·금액(KRW)·메모. 저장 시 append.

### S9. 성과
- KPI 행: 기간 증감(+%) / 입출금 / 투자손익(=증감−입출금) / 월 누적(+%) / 최대 낙폭(+%).
- 기간 피커: 전체/올해/최근 30일/최근 7일. "요약 복사"(클립보드 텍스트) 유지, CSV 내보내기는 ShareLink(P1).
- **입출금 미기록 경고**: deposit/withdrawal 0건이면 "투자손익이 부풀려질 수 있어요" + 배당 탭 딥링크.
- 손익 흐름 차트(Swift Charts): 월 선택, 연 누적(초록 `#1f7a5b` — 사용자 확정 색)·월 누적(파랑)·일일(빨강) 라인.
  스냅샷 <3개면 높이 축소 + "기록이 쌓이면 채워집니다".
- 월별 요약 표(월/월초/월말/증감 — 증감만 손익색, 0 중립), 일별 성과 표.
- 총자산 추세(면적 라인, 초록 `--chart-line`), 포인트 탭 → 날짜·총자산·투자손익 팝오버.
- 기여 분석: 계좌별/전략별 segment, 기여 비례 막대.

### S10. 설정
- 프로필: 로그인 상태/이메일, 로그인·로그아웃.
- 계좌 관리 → S11. / 알림 → S13. / **Face ID 잠금** 토글.
- 통화 표시(₩/$), 테마(시스템/라이트/다크).
- 자동 기록 상태(읽기 전용): "매일 07:00 KST 자동 저장 · 마지막: {automation.lastRunAt}".
- 데이터: 포트폴리오 초기화(2단계 확인), **계정 삭제**(Supabase user 삭제 + state 삭제, 2단계 확인).
- 정보: 버전, 개인정보처리방침 URL, 면책("본 앱은 투자 조언을 제공하지 않습니다"), 오픈소스 고지.

### S11. 계좌 목록 + 예수금
- 요약: 예수금 합계(KRW 환산) 히어로 / 추적 계좌 수 / **미입력 N개**(탭 → 미입력만 필터).
- 계좌 행: 이름·투자자·기관·유형·통화 + 총자산·손익 / **예수금 인라인**: 값(원통화)+≈KRW+"편집" →
  행 확장 인라인 편집기(금액+통화, 키보드 완료로 저장, "저장됨 ✓" 플래시).
- 저장 규칙: `investor+account+currency` 키로 **단일 upsert**(중복 레코드 생성 금지 — 웹 19번 문서 원칙).
- 계좌 행 탭 → 보유 종목·구성(주식/예수금 비율 바). 스와이프: 수정(S12)/삭제(사용 중이면 비활성).
- 미분류 예수금(`account`에 "미분류" 포함 + KRW)이 있으면 배분 카드 노출(계좌 선택+금액 → 이동).

### S13. 알림 설정
- 시스템 권한 요청 → `device_tokens` 등록(§7.2).
- 토글: 매일 요약 받기(기본 on) / 큰 변동 알림 + 기준 금액(원, 0=매일).
- 발송 시각 안내: "매일 아침 7시(한국시간) 자동 기록 후 발송".
- 테스트 발송 버튼.

### S14. Face ID 잠금
- 설정에서 on이면: 앱 활성화(scenePhase active)마다 블러 오버레이 + LocalAuthentication.
  실패 시 재시도/로그아웃 선택. 켤 때 즉시 1회 인증 요구.

### S1. 온보딩 / S2. 로그인
- 온보딩 3장: ① "여러 계좌, 하나의 기록" ② "매일 아침 자동 기록·알림" ③ 알림 권한 사전 설명 → 요청.
- 마지막 장 선택지: **"샘플로 둘러보기"**(createSampleState 로컬 주입) / "로그인".
- 로그인: Naver(우선 노출)·Google — `ASWebAuthenticationSession` + supabase `signInWithOAuth`
  (provider `"custom:naver"` / `"google"`, redirect = 커스텀 스킴 `stocklio://auth-callback`,
  Supabase 대시보드에 해당 redirect URL 등록 필요). 이메일 = `signInWithOtp` 매직링크(같은 스킴으로 복귀).
- 로그인 성공 시: 서버 state 존재 → 로드. 없고 로컬 샘플/작성 데이터 있으면 "이 기기 데이터를 클라우드에 저장할까요?" 1회 머지 프롬프트(덮어쓰기 아님).

---

## 7. iOS 전용 기능 스펙

### 7.1 위젯 (WidgetKit)
- **App Group** `group.app.stocklio` — 메인 앱이 갱신 때마다 `WidgetSnapshot` JSON을 컨테이너에 기록:
  ```json
  { "totalValueKrw": 85149229, "dayChangeKrw": -296825, "dayChangeRate": -0.0056,
    "asOf": "2026-08-15T07:00:12+09:00", "top": [{"ticker":"SCHD","dayKrw":-83892}],
    "spark": [46380032, 46110000, ...] }   // 최근 14개 스냅샷 totalValueKrw
  ```
- systemSmall: 총자산 + 일간변동(손익색·부호). systemMedium: + 스파크라인 + 상위 변동 2종목.
- 잠금화면 inline: "₩85,149,229 · −0.56%". circular: 일간변동률.
- Timeline: 앱 포그라운드 갱신 시 `reloadAllTimelines()` + 시스템 리프레시 4시간 간격. 데이터 없으면 "앱에서 로그인" 플레이스홀더.
- 위젯 탭 딥링크: `stocklio://tab/home`.

### 7.2 APNs 푸시 (유일한 신규 백엔드 작업)
- **DB**: Supabase 신규 테이블
  ```sql
  create table device_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    token text not null unique,
    platform text not null default 'ios',
    created_at timestamptz default now()
  );
  alter table device_tokens enable row level security;
  create policy "own tokens" on device_tokens for all using (auth.uid() = user_id);
  ```
- **서버**: 기존 `api/cron/daily-snapshot.js`가 유저별 스냅샷 저장 후 — 기존
  `notification-core.js`의 `buildDailyDigest`/`shouldSendDailyDigest`(요약 문구·임계값 판단 로직 재사용)로
  메시지를 만들고, `device_tokens`를 조회해 **APNs HTTP/2 (JWT, .p8 키)** 로 발송.
  신규 env: `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`(p8 내용), `APNS_BUNDLE_ID`. Vercel 서버 전용.
- 페이로드: `{"aps":{"alert":{"title":"오늘의 포트폴리오","body":"총자산 8,514만원 · 어제보다 −29.6만원(−0.35%)"},"sound":"default"},"deeplink":"stocklio://tab/home"}`
- 클라: 권한 → 토큰 등록(upsert), 로그아웃 시 토큰 삭제. 수신 탭 → 딥링크.
- 텔레그램 발송 로직은 삭제하지 않고 공존(웹 사용자용).

### 7.3 기타
- 햅틱: 저장 `.success` / 삭제 `.warning` / 토글 `.selectionChanged`.
- 모든 리스트 pull-to-refresh. 갱신 스피너는 iOS 기본.
- 다이나믹 타입 대응(최소 xxxLarge까지 레이아웃 유지), VoiceOver 라벨(금액은 "8천5백14만 9천229원"처럼 읽히도록 accessibilityLabel 별도 지정).

---

## 8. 데이터 계약 — `portfolio_states.state` (STATE_VERSION = 6)

> Supabase: `portfolio_states(user_id uuid PK, state jsonb)`. RLS: 본인 행만. 저장은 전체 upsert.
> **알 수 없는 필드는 절대 버리지 말 것** — 웹이 쓰는 필드(dashboardLayout 등)를 iOS가 저장 시 유실하면 안 된다.
> → Swift 모델은 아래 필드를 typed로 갖되, 원본 JSON을 보존-병합(round-trip)하는 저장 전략을 쓴다.

```jsonc
{
  "version": 6,
  "fxRate": { "pair": "USD/KRW", "rate": 1409.4, "previousClose": 1407.1,
              "change": 2.3, "changePercent": 0.16, "source": "Yahoo Finance", "asOf": "ISO8601" },
  "holdings": [{
    "id": "uuid", "investor": "규철", "account": "토스", 
    "accountType": "direct_investment" /* | "pension" (구값 brokerage/irp 등은 정규화 필요: §9 normalizeAccountType) */,
    "strategy": "인덱스", "ticker": "SPY" /* 한국: "379800" 또는 name과 동일한 경우 있음 */,
    "name": "SPDR S&P 500 ETF", "quantity": 10, "averageCost": 480.0,
    "price": 498.5, "priceChange": 1.2, "priceChangePercent": 0.24,
    "currency": "USD" /* | "KRW" */, "priceSource": "Yahoo Finance", "priceAsOf": "ISO8601",
    "targetPrice": 550.0, "stopLoss": 420.0  /* 선택 */
  }],
  "cashBalances": [{ "id": "uuid", "investor": "규철", "account": "토스",
    "currency": "USD", "amount": 500.0, "asOf": "2026-08-08", "source": "사용자 수정" }],
  "cashFlows": [{ "id": "uuid", "date": "2026-05-01", "investor": "규철", "account": "토스",
    "type": "deposit" /* | "withdrawal" | "dividend" (레거시 tax/fee 존재 가능 — 표시만, 입력 불가) */,
    "amountKrw": 1000000, "note": "월 납입" }],
  "accounts": [{ "id": "uuid", "investor": "규철", "account": "토스", "provider": "토스증권",
    "accountType": "direct_investment", "baseCurrency": "USD" }],
  "portfolioSnapshots": [{ "id": "uuid", "date": "2026-08-14", "totalValueKrw": 85149229,
    "totalValueUsd": 60412.1, "totalCostUsd": 0, "totalGainUsd": 0, "fxRate": 1409.4,
    "netInflowKrw": 0 }],
  "accountSnapshots": [{ "date": "2026-08-14", "investor": "규철", "account": "토스",
    "totalAssetsKrw": 22364820 /* + stockValueKrw, cashKrw 등 */ }],
  "priceUpdateLogs": [ /* 최근 시세 갱신 로그 — iOS는 읽기 전용, 갱신 시 append */ ],
  "lastPriceRefreshImpact": { /* 오늘 변동 카드 소스: perHolding 기여 목록 + 가격/환율 분해 */ },
  "dashboardLayout": [ /* 웹 전용 — iOS는 그대로 보존만 */ ],
  "automation": { "lastRunAt": "ISO8601", "lastResult": "…", "snapshotTime": "09:10", "timezone": "Asia/Seoul" }
}
```

핵심 규칙:
- 예수금 유일 키: `investor + account + currency` (편집=upsert, 신규 레코드 금지).
- 입출금 `getExternalFlowAmount`: deposit=+, withdrawal=−, **그 외 전부 0** (배당은 손익에 미반영 — 재투자 중복 계상 방지).
- 미분류 예수금 판정: `currency=="KRW" && account.contains("미분류")`.
- KRW 환산: `currency=="USD" ? amount × fxRate.rate : amount`.

---

## 9. `PortfolioCore` Swift 패키지 — 포팅 명세

참조 원본: `src/domain/portfolio-core.js`(+ 테스트 `tests/domain.test.mjs` 45개가 정답지)

| Swift 함수 | 원본 | 역할 |
|---|---|---|
| `holdingValues(holding, fx) -> HoldingValues` | getHoldingValues | valueNative/costNative/gainNative + Krw/Usd 환산 |
| `totals(holdings, cashBalances, fx) -> Totals` | getTotals | stockValueKrw, cashKrw, valueKrw, costKrw, gainKrw |
| `externalFlowAmount(flow) -> Double` | getExternalFlowAmount | deposit +, withdrawal −, else 0 |
| `netInflowKrw(flows, date)` | getNetInflowKrw | 특정일 순입출금 |
| `parseTtmDividend(chartJSON, now) -> DividendInfo` | parseTtmDividendPerShare | 최근 372일 배당 합계(perShare)·통화·횟수·payments[{month, perShare}] |
| `projectDividends(holdings, byTicker, fx) -> Projection` | projectPortfolioDividends | rows + **byTicker 합산**(accountCount 포함) + annualKrw/monthlyAvg/yieldRatio |
| `monthlySchedule(holdings, byTicker, fx) -> Schedule` | buildMonthlyDividendSchedule | 12개월 버킷, peakMonth, payingMonths |
| `nextDividendMonth(schedule, nowMonth)` | getNextDividendMonth | 현재 월 포함 전방 탐색(래핑) |
| `normalizeAccountType(raw)` | account-types.js | brokerage/overseas_brokerage→direct_investment, irp/retirement_pension→pension |
| `performanceStats(rows)` | performance-selectors.js getPerformanceStats | 기간증감/투자손익/월누적/MDD |
| `snapshotRows(snapshots)` / `monthlyRows(rows)` | 〃 | 일별 delta·월별 집계 |
| `usMarketContext(date)` | market-calendar.js | 주말/휴장 여부(오늘 변동 카드 문구) |

- 전부 **순수 함수**(Foundation만). 부동소수점: JS Number와 같은 Double 사용(테스트 기준 일치 확인).
- XCTest: JS 테스트 45개 중 도메인 계산 관련 전부를 동일 입력/기대값으로 포팅. 이것이 "포팅 완료"의 정의.

---

## 10. 네트워크 계층

### 10.1 Supabase (supabase-swift)
- `loadState() -> PortfolioState?`: `from("portfolio_states").select("state").eq("user_id", uid).maybeSingle()`
- `saveState(_:)`: 전체 upsert `{user_id, state}` (ADR-4의 savedAt 체크 선행)
- 알림 설정: `notification_settings` upsert(기존 컬럼 + 신규 `push_enabled` 재사용 여부는 구현 시 결정 — 없으면 `large_move_threshold_krw`, `daily_digest_enabled` 재사용)

### 10.2 시세 (기존 Vercel 프록시, base = `https://stocklio-web.vercel.app`)
| 용도 | 호출 | 파싱 |
|---|---|---|
| 종목 시세 | `GET /api/yahoo/chart?symbol={t}&range=1d&interval=1d` | `chart.result[0].meta`: regularMarketPrice, previousClose, currency → price/priceChange/% |
| 환율 | 같은 API, `symbol=KRW=X` | meta.regularMarketPrice = USD/KRW |
| 배당(TTM) | `…&range=1y&events=div` | `result[0].events.dividends{ts:{amount,date}}` → §9 parseTtmDividend |
| 티커 검색 | `GET /api/yahoo/search?q=` | `{results:[{symbol,name,type,exchange}]}` |

### 10.3 갱신 플로우(수동/앱 시작)
1. 환율(`KRW=X`) → 2. 보유 티커 병렬(chart) → 3. state의 holdings price/priceChange/priceAsOf 갱신,
   `lastPriceRefreshImpact` 재계산(웹 로직 참조: `src/app/automation-view.js` refreshPricesNow) →
4. saveState → 5. 위젯 스냅샷 기록 + reloadAllTimelines.
- 캐시: 시세 5분/환율 1시간/배당 24h — URLCache 아닌 앱 내 timestamp 캐시(웹과 동일 TTL).
- 오프라인: 마지막 state로 전 화면 표시 가능(계산은 PortfolioCore 로컬). 갱신 실패는 조용히 배지로.

---

## 11. 앱 프로젝트 구조

```
StocklioApp/                        # Xcode workspace
├─ Packages/PortfolioCore/          # §9 순수 계산 (테스트 포함)
├─ Stocklio/                        # 메인 앱 타깃 (iOS 17+)
│  ├─ App/            StocklioApp.swift, DeepLink, AppLock(FaceID)
│  ├─ Models/         PortfolioState(+원본 JSON 보존 래퍼), Codable 모델(§8)
│  ├─ Services/       SupabaseService, MarketDataService, PushService, WidgetBridge
│  ├─ Stores/         AppStore(@Observable: state, fx, currencyMode, auth)
│  ├─ Features/       Home/ Holdings/ Dividends/ Performance/ Settings/ Accounts/ Onboarding/
│  ├─ DesignSystem/   Colors, Typography, MoneyText, GainLossText, Haptics
│  └─ Resources/      Assets(앱 아이콘), Pretendard 폰트(OFL — 번들 허용)
├─ StocklioWidget/                  # 위젯 익스텐션 (§7.1)
└─ 서버 변경: api/cron/daily-snapshot.js에 APNs 발송 추가 + device_tokens 테이블(§7.2)
```

- 상태 관리: 단일 `AppStore`(@Observable) — state 로드/저장/갱신, 파생값은 View에서 PortfolioCore 호출.
- 저장 전략: **원본 JSON dictionary 보존** + typed 모델은 뷰용 파생. 저장 시 typed 변경분을 원본에 머지 후 업로드(웹 필드 유실 방지, §8).

---

## 12. 디자인 시스템 (웹 토큰 → iOS 매핑)

> **상세 디자인 스펙은 짝 문서 `23_ios_design_system.md`가 정본이다** — 컴포넌트 라이브러리,
> 타이포 스케일, 아이콘 체계, 모션/햅틱, 화면별 시각 위계, 위젯 디자인, Do/Don't 게이트 포함.
> 아래 표는 요약본.

| 토큰 | Light | Dark | 용도 |
|---|---|---|---|
| accent | `#3366FF` | `#5C8DFF` | 주 액션, 활성, 링크 |
| accentDark | `#2451D9` | `#3B6FE0` | 강조 텍스트 |
| gain (상승) | `#C7433D` | `#FF6B6B` | +손익 — **빨강** |
| loss (하락) | `#2F67B1` | `#5B9CF6` | −손익 — **파랑** |
| bg | `#F6F7F3` | `#0A0A0A` | 배경 |
| surface | `#FBFCFD` | `#111111` | 카드 (순백 금지) |
| surfaceSoft | `#EEF3EE` | `#1A1A1A` | 보조 배경 |
| ink/value | `#111A15`/`#0F1712` | `#F0F0EE`/`#FFFFFF` | 본문/숫자 |
| muted | `#6A766F` | `rgba(240,240,238,0.45)` | 보조 텍스트 |
| line | `#DBE1DA` | `rgba(255,255,255,0.08)` | 구분선 |
| warn | line `#E6A817` bg `#FFF8EC` text `#A06D0E` | `#7A5A12`/`#241B0D`/`#F0B429` | 미입력 경고 |
| chartLine | `#1F7A5B` (초록 — 총자산 추세 전용, 사용자 확정) | 동일 | 성과 추세 차트 |
| 차트 팔레트 | `#3366FF #16A34A #F59E0B #8B5CF6 #6541F2` | 동일 | 도넛/비중 |

- 폰트: **Pretendard**(웹과 동일, OFL 라이선스 — 번들 가능). 숫자는 `.monospacedDigit()`.
- 모서리 12pt(카드) / 10pt(내부). 카드 그림자 최소, 다크에선 밝기 승격으로 위계.
- 이모지 아이콘 금지 — SF Symbols 사용(탭: house / chart.pie / wonsign.circle(또는 banknote) / chart.line.uptrend.xyaxis / gearshape).
- 빈 상태: SF Symbol + 1줄 제목 + 1줄 다음 행동 안내(웹 문구 재사용).

---

## 13. 데모 모드 & App Store 심사

- **샘플 모드**: 비로그인 시 `createSampleState()` 동일 데이터(참조: `src/domain/sample-state.js` —
  Alpha/Beta/Gamma 투자자, SPY·QQQ·SCHD·MSFT·AAPL·GOOGL·069500·379800·361580, 스냅샷 7개, 월 100만원 입금).
  로컬에서 전 기능 편집 가능(저장은 기기 로컬). 심사 노트에 "로그인 없이 샘플로 전 기능 확인 가능" 명시.
- 심사 요건 체크리스트:
  - [ ] 계정 삭제 기능(§S10) — 필수
  - [ ] 개인정보처리방침 URL
  - [ ] 금융 면책 문구(설정 > 정보 + 스토어 설명)
  - [ ] 매매/추천 기능 없음 명시(리뷰 노트) — 5.2/3.1 금융 규정 회피 근거
  - [ ] 데이터 출처 표기(Yahoo Finance 프록시 — "시세는 지연될 수 있음")
  - [ ] 추적 없음 → App Privacy: 계정 데이터(이메일)만, 트래킹 없음

---

## 14. 마일스톤 (각 단계 = 릴리스 가능한 수직 슬라이스)

| 단계 | 범위 | 완료 기준(수용 테스트) |
|---|---|---|
| **M0 코어** | Xcode 셋업, PortfolioCore 포팅+XCTest, 디자인 토큰 | JS 테스트와 동일 케이스 전부 green |
| **M1 읽기 앱** | 온보딩(샘플 모드), 로그인, state 로드, 홈+보유(읽기)+종목상세, 시세 pull-to-refresh | 샘플·실계정 모두 홈/보유 수치가 웹과 1원 단위 일치 |
| **M2 쓰기 완성** | 종목/계좌/예수금/입출금 CRUD, 배당 탭, 성과 탭, 통화 토글, 다크모드 | 웹에서 수정 ↔ iOS 반영(재로드) 왕복 확인, 웹 필드 유실 0 |
| **M3 iOS 가치** | 위젯(small/medium/lock), APNs(서버 포함), Face ID, 햅틱, 딥링크, 계정 삭제 | 아침 7시 푸시 수신, 위젯 총자산 = 앱과 일치 |
| **M4 출시** | 앱 아이콘/스크린샷/심사 노트, TestFlight, 제출 | 심사 통과 |

- P2(출시 후): 시뮬레이터 탭, CSV/이미지 공유, Spotlight, Live Activity(장중 변동), 유료 시세 API 검토.

---

## 15. 구현 에이전트를 위한 작업 규칙

1. **숫자 정합성이 최우선**: 화면 수치는 반드시 PortfolioCore 경유. 뷰에서 임의 계산 금지.
2. **state 저장은 병합 저장**: 읽은 원본 JSON에 변경분만 머지 후 upsert. 모르는 키 유실 금지.
3. 도메인 로직을 바꿔야 하면 **웹 JS와 테스트를 먼저 바꾸고** Swift에 반영(단일 진실 원천 = JS 테스트).
4. 하드코딩 색 금지 — §12 토큰만. 손익 0은 중립. 이모지 아이콘 금지(SF Symbols).
5. 금지 문구: 매수/매도/추천/보장. 예측 수치엔 항상 "추정" 명시.
6. 각 마일스톤 종료 시 실제 기기(또는 시뮬레이터)에서 라이트/다크 × 표준/큰 글씨로 스크린샷 검증.

---

## 16. 리스크 & 미결 사항

| 리스크 | 심각도 | 대응 |
|---|---|---|
| Yahoo 비공식 API ToS (스토어 앱 배포 시) | 중~높음 | v1은 프록시 유지 + 지연 시세 고지. 사용자 늘면 유료 시세 API로 프록시 내부만 교체(클라 계약 불변) |
| custom:naver OAuth의 iOS 리다이렉트 동작 | 중 | M1 초기에 스파이크 검증. 실패 시 이메일+Google 우선 출시, Naver는 후속 |
| LWW 쓰기 충돌(웹↔iOS 동시 편집) | 낮음(단일 사용자) | ADR-4 알럿. 필드 단위 머지는 비범위 |
| 웹 도메인과 Swift 도메인 드리프트 | 중 | §15-3 규칙 + 테스트 페어링. 릴리스 전 정합성 스크립트(동일 state로 웹/iOS 총자산 비교) |
| APNs 키 관리 | 낮음 | Vercel env 서버 전용(웹 SUPABASE_SERVICE_ROLE_KEY와 동일 정책) |

미결(구현 시작 전 결정 필요, 기본값 제시):
- [ ] Bundle ID / 앱 이름 표기("투자일지" vs "Stocklio") — 기본: 표시명 "투자일지", bundle `com.stocklio.app`
- [ ] 최소 iOS 버전 — 기본: 17.0
- [ ] Supabase redirect URL(`stocklio://auth-callback`) 대시보드 등록 — 프로젝트 오너 작업
- [ ] Apple Developer 계정(APNs p8 키 발급) — 프로젝트 오너 작업
