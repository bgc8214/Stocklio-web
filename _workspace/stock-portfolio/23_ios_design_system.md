# 23. 투자일지 iOS — 디자인 시스템 & 화면 시각 스펙

작성일: 2026-08-15 · 짝 문서: **22_ios_native_app_plan.md**(기능·구조) — 이 문서는 "어떻게 보이고 움직이는가"만 다룬다.
대상 독자: 이 앱을 처음 보는 iOS 구현 에이전트. **이 문서의 값(pt·색·규칙)을 그대로 코드에 옮기면 된다.**

> 방법론: 이 문서는 hallmark 디자인 스킬(anti-AI-slop)의 규율을 iOS/SwiftUI로 번역한 것이다.
> 핵심: **토큰 잠금**(inline 색·폰트 금지), **한 가지 아이콘 보이스**, **정직한 콘텐츠**(가짜 수치 금지),
> **숫자가 주인공**인 시각 위계.

---

## 1. 디자인 방향 — "조용한 장부(Ledger)"

이 앱은 트레이딩 앱이 아니라 **기록장**이다. 시세 틱마다 번쩍이는 흥분이 아니라,
아침에 펼쳐 보는 장부의 **차분한 신뢰**가 목표다.

- **성격 3단어**: 차분함(quiet) · 정밀함(precise) · 장부다움(ledger-like)
- **숫자가 주인공**: 화면마다 히어로 숫자는 하나. 나머지는 그 숫자를 설명하는 조연.
- **색은 의미로만**: 빨강/파랑은 오직 손익. accent 파랑은 오직 "행동 가능한 것"(버튼·활성·링크).
  장식 목적의 유채색 금지.
- **움직임은 확인의 언어**: 애니메이션은 "저장됐다/갱신됐다"를 확인시켜줄 때만. 시선 끌기용 모션 금지.

### 브랜드 마크와 UI 색의 관계 (결정)
- 앱 아이콘 = 기존 **짙은 초록 장부+상승곡선** 마크(`assets/tuja-ilji-icon-512.png` 참조) **그대로 유지**.
  초록 = 브랜드(장부), 파랑 = UI 액션. 아이콘과 UI accent가 달라도 무방(예: 카카오뱅크 노랑 아이콘/중립 UI).
- 앱 안에서 초록을 쓰는 곳은 딱 두 곳: ① 브랜드 마크 자체 ② 성과 "총자산 추세" 차트 선(`chartLine`, 사용자 확정).
  그 외 UI에서 초록 사용 금지(과거 초록 테마 잔재 재유입 방지 — 웹에서 이미 정리 완료).

---

## 2. 컬러 토큰 (Asset Catalog 정의)

Xcode Asset Catalog에 아래 이름 그대로 Color Set 생성(Any/Dark). **뷰 코드에 hex 직접 입력 절대 금지** —
`Color("Gain")`처럼 토큰만 참조. 필요한 색이 없으면 토큰을 추가한 뒤 참조한다(hallmark locked-tokens 규칙).

| Asset 이름 | Light | Dark | 용도 |
|---|---|---|---|
| `AccentPrimary` | `#3366FF` | `#5C8DFF` | 주 버튼, 활성 상태, 링크, 선택 |
| `AccentStrong` | `#2451D9` | `#3B6FE0` | accent 위 강조 텍스트, 눌림 상태 |
| `Gain` | `#C7433D` | `#FF6B6B` | **+손익(빨강)** — 한국 관례 |
| `Loss` | `#2F67B1` | `#5B9CF6` | **−손익(파랑)** |
| `Bg` | `#F6F7F3` | `#0A0A0A` | 화면 배경 |
| `Surface` | `#FBFCFD` | `#111111` | 카드/시트 (순백 `#FFFFFF` 금지) |
| `SurfaceSoft` | `#EEF3EE` | `#1A1A1A` | 보조 배경, 요약 그리드 칸, 인풋 배경 |
| `Ink` | `#111A15` | `#F0F0EE` | 본문 텍스트 |
| `ValueInk` | `#0F1712` | `#FFFFFF` | 금액 숫자 전용(본문보다 반 단계 진함) |
| `Muted` | `#6A766F` | `#F0F0EE` @45% | 라벨, 캡션, 보조 정보 |
| `Subtle` | `#879189` | `#F0F0EE` @30% | 비활성, 힌트 셰브론 |
| `Line` | `#DBE1DA` | `#FFFFFF` @8% | 구분선, 카드 테두리 |
| `WarnLine` / `WarnBg` / `WarnText` | `#E6A817` / `#FFF8EC` / `#A06D0E` | `#7A5A12` / `#241B0D` / `#F0B429` | 예수금 미입력 등 경고 |
| `ChartLine` | `#1F7A5B` | `#1F7A5B` | 총자산 추세 선 **전용**(초록, §1) |
| `ChartPalette1..5` | `#3366FF` `#16A34A` `#F59E0B` `#8B5CF6` `#6541F2` | 동일 | 도넛/비중 세그먼트 순서 고정 |
| `TooltipBg` / `TooltipFg` | `#1B2430` / `#FFFFFF` | 동일(항상 어두움) | 차트 팝오버 칩 |

### 색 사용 규칙
1. **손익 0은 무색**: `value > 0 → Gain`, `< 0 → Loss`, `== 0 → Muted`. 부호도 0이면 생략. (웹 `signClass` 동일)
2. 날짜·라벨·수량 등 **비손익 값에 Gain/Loss 금지** (웹에서 월 라벨이 빨갛던 버그의 재발 방지).
3. accent는 상호작용 전용 — 정보 강조에 쓰지 말 것(그건 weight/크기로).
4. 그라데이션 금지. 유일한 예외: 차트 영역 채움(`ChartLine` 또는 시리즈색의 8~14% 불투명 단색 틴트).
5. 다크모드 위계는 그림자가 아니라 **밝기 승격**(Surface < SurfaceSoft)으로.

---

## 3. 타이포그래피

- 서체: **Pretendard Variable**(번들, OFL 라이선스). 폴백 시스템 산세리프.
  모든 스타일 `Font.custom("Pretendard", size:, relativeTo:)`로 **Dynamic Type 연동 필수**.
- 숫자: 금액·수량·퍼센트는 **전부** `.monospacedDigit()` (Pretendard tnum). 예외 없음.
- **이탤릭 금지**(헤더든 본문이든 — 국문에서 어색 + hallmark 규칙).

| 스타일 토큰 | 크기/굵기 | relativeTo | 용도 |
|---|---|---|---|
| `HeroMoney` | 34pt / 800 | .largeTitle | 홈 총자산, S11 예수금 합계 |
| `TitleL` | 22pt / 800 | .title2 | 화면 제목(네비 large title 대체 시) |
| `TitleM` | 17pt / 700 | .headline | 카드/섹션 제목 |
| `MoneyL` | 19pt / 800 | .title3 | 행의 주 금액(계좌 총자산, 종목 평가액) |
| `MoneyM` | 15pt / 700 | .body | 표·리스트 안 금액 |
| `Body` | 15pt / 500 | .body | 본문 |
| `Caption` | 12.5pt / 600 | .footnote | 보조 라벨(계좌·투자자·기준일) |
| `Micro` | 11pt / 700 | .caption2 | 배지, 힌트, 고지 문구 |

- 금액+퍼센트 병기 시: 금액이 주(크게), 퍼센트는 Caption으로 종속. 둘 다 같은 크기로 나열 금지.
- 국문 자간 기본값 유지(자간 조작 금지), 행간 1.4~1.5.

---

## 4. 레이아웃 & 형태

| 항목 | 값 |
|---|---|
| 스페이싱 스케일 | 4 / 8 / 12 / 16 / 20 / 28 (pt) — 이 6개 외 임의값 금지 |
| 화면 좌우 여백 | 16pt (regular), 20pt (큰 화면) |
| 카드 radius | 12pt · 카드 내부 요소 10pt · 칩/pill 999 |
| 카드 스타일 | `Surface` 배경 + `Line` 1px 테두리. **그림자 없음**(라이트에서 y1 blur3 @4% 이하 허용) |
| 카드 내부 패딩 | 16pt (요약 그리드 칸은 12pt) |
| 리스트 행 높이 | 최소 52pt(터치 타깃 44pt 보장) |
| **card-in-card 금지** | 카드 안에 또 테두리+배경 상자 넣지 않는다. 내부는 구분선/여백/타이포로 (웹 계좌탭 redesign 원칙) |
| 등분 그리드 회피 | 요약 카드가 3개 이상이면 **주인공 1개를 크게**(비대칭). 균등 3-column 금지 |

---

## 5. 컴포넌트 라이브러리 (DesignSystem/ 모듈 스펙)

구현 에이전트는 아래 컴포넌트를 먼저 만들고, 화면은 이것들의 조립으로만 구성한다.

### 5.1 `MoneyText(amount, currency, style)`
- KRW: `1,234,567원` · USD: `$1,234.56`. 음수 `−`(U+2212) 사용. monospacedDigit 강제.
- VoiceOver: "천이백삼십사만…원"으로 읽히도록 `accessibilityLabel` 별도 생성.

### 5.2 `GainLossText(value, rate?, style)`
- §2 색 규칙(0=Muted·무부호) 내장. `+1,234원`처럼 부호 접두. rate 있으면 `(+2.4%)` Caption 종속.
- **모든 손익 표기는 반드시 이 컴포넌트 경유** — 뷰에서 색 분기 재구현 금지.

### 5.3 `StatCard(label, value, sub?, emphasis: .hero|.normal)`
- SurfaceSoft 칸(12pt 패딩, 10pt radius). label=Caption·Muted, value=MoneyL/HeroMoney.
- `.hero`는 그리드에서 1.7배 폭 + AccentPrimary 5% 틴트 배경(웹 계좌탭 bento 원칙).

### 5.4 `TickerLogoView(ticker, name, size)`
- 웹 TickerLogo 이식: 로고 이미지(도메인 파비콘) 시도 → 실패 시 이니셜+결정적 배경색(팔레트 해시).
- 원형 마스크, 테두리 `Line` 0.5pt.

### 5.5 `HoldingCard` (S4 종목별)
- 헤더: 로고(32) + 이름(TitleM, 1줄 말줄임)/티커(Caption·Muted) + 우측 수익률 GainLossText.
- 중앙: 평가액 MoneyL. 하단: 일변동 GainLossText + 비중 Caption + 우측 `chevron.right`(Subtle 13pt).
- 눌림: scale 0.98 + Surface→SurfaceSoft, 120ms easeOut. (hover 없음 — 터치 우선)

### 5.6 `AccountRow` (S11)
- 좌: 계좌명(TitleM)+메타(Caption) / 예수금 인라인: `예수금 $500.00 ≈ 690,000원 [연필아이콘]편집`
  — 텍스트 버튼(테두리·배경 없음, card-in-card 금지), 편집 링크만 AccentStrong.
- 우: 총자산 MoneyL + 손익 GainLossText(Caption).

### 5.7 `CalloutBar(kind: .dividend|.warning, ...)`
- 1줄 콜아웃: 아이콘(SF Symbol 14pt) + 라벨(Micro·Muted) + 주값(MoneyM) + 우측 보조(Micro).
- `.dividend`: AccentPrimary 8% 배경 + 30% 테두리 / `.warning`: Warn 토큰. radius 10.
- 용도: "다음 배당 · 이번 달 · 약 N원", "입출금 기록이 없어 투자손익이 부풀려질 수 있어요".

### 5.8 `EmptyStateView(symbol, title, hint)`
- SF Symbol 28pt Subtle + 제목 TitleM + 다음 행동 1줄(Caption·Muted). 세로 중앙, 최소 높이 160pt.
- **이모지 금지**(웹의 🌱🪙 → `leaf`, `wonsign.circle` 등 심볼로 치환).

### 5.9 `RankBarRow` (배당 종목별)
- 행 배경에 좌→우 `AccentPrimary` 14% 채움(폭 ∝ 값/최댓값, 최소 3%), 우측 2px 48% 경계선.
- 등장 시 좌→우 scaleX 0.55s staggered(55ms/행), `reduceMotion`이면 즉시.

### 5.10 `MonthBarCalendar` (배당 월별)
- 12칸 균등(간격 6pt), 막대 최대높이 118pt, 금액 라벨 Micro(좁으면 숨김).
- 피크 월: accent 그라데이션(수직, Primary→Strong) + 라벨 AccentStrong. 현재 월: 라벨 아래 4pt accent 점.
- 빈 달: 바닥 2px `Line` 베이스라인.

### 5.11 차트 공통 (Swift Charts)
- 선 2pt, 포인트 3pt(Surface 채움+시리즈색 테두리). 영역 채움은 시리즈색 8~14% 단색.
- 축: `Line` 색 그리드, 라벨 Caption·Muted. 범례는 하단 텍스트(색점+라벨).
- 값 팝오버: TooltipBg 칩, 날짜 Micro·55% 흰색 / 값 MoneyM 흰색 / 증감 GainLossText.
- 성과 손익 흐름 시리즈색: 연 누적 `ChartLine`(초록)·월 누적 `#1D6FA4`·일일 `#C7433D` (웹 확정값 — ChartPalette와 별개로 `ChartSeriesYear/Month/Daily` 토큰으로 등록).
- 스냅샷 <3개면 차트 높이 440→240pt + "기록이 쌓이면 채워집니다" Micro 안내.

### 5.12 Toast / 저장 확인
- 하단 캡슐 토스트(TooltipBg, 아이콘+1줄, 2.2s 자동 소멸). 저장 성공은 토스트+`.success` 햅틱.
- 인라인 확정이 더 맞는 곳(예수금 저장)은 행 안에서 `checkmark` + "저장됨" 2.2s 플래시(웹 동일).

---

## 6. 아이콘 체계 — SF Symbols 단일 보이스

- 웨이트 **.medium** 고정, 스케일 .medium. 이모지·외부 아이콘팩·커스텀 SVG 혼용 금지(브랜드 마크 제외).

| 맥락 | 심볼 |
|---|---|
| 탭: 홈/보유/배당/성과/설정 | `house` / `chart.pie` / `wonsign.circle` / `chart.line.uptrend.xyaxis` / `gearshape` (선택 시 `.fill` 변형) |
| 편집 / 삭제 / 추가 | `pencil` / `trash` / `plus` |
| 새로고침·갱신시각 | `arrow.clockwise` / `clock` |
| 배당·예수금 | `banknote` (콜아웃), `wonsign.circle` |
| 경고 | `exclamationmark.triangle` |
| 계좌·기관 | `building.columns` |
| 잠금(Face ID) | `faceid` / `lock.fill` |
| 상세 진입 힌트 | `chevron.right` (Subtle) |
| 빈 상태 | 배당 `banknote`, 기록 `tray`, 종목 `chart.pie`, 검색결과 `magnifyingglass` |

---

## 7. 모션 & 햅틱 언어

| 이벤트 | 모션 | 햅틱 |
|---|---|---|
| 화면 전환 | 시스템 기본(push/sheet) — 커스텀 전환 금지 | — |
| 카드/행 눌림 | scale 0.98, 120ms easeOut | — |
| 저장 성공 | 토스트 슬라이드업 240ms | `.success` |
| 삭제 확정 | 행 시스템 삭제 애니메이션 | `.warning` |
| segment/토글 전환 | 크로스페이드 180ms | `.selectionChanged` |
| 차트/랭크 최초 등장 | 좌→우(또는 아래→위) 성장 0.55s, stagger 40~55ms, **화면당 1회만** | — |
| pull-to-refresh 완료 | 시스템 기본 | `.light` impact |

규칙: bounce/spring 과장 금지(기본 spring 파라미터만), "전부 다 페이드인" 금지 — **오케스트레이션된 등장은 화면당 하나**.
`accessibilityReduceMotion` 시 모든 등장 애니메이션 생략.

---

## 8. 화면별 시각 위계 (각 화면의 "주인공" 지정)

| 화면 | 주인공(딱 하나) | 조연 | 금지 |
|---|---|---|---|
| S3 홈 | 총자산 HeroMoney | 오늘 변동 카드, 도넛, 다음 배당 콜아웃 | KPI 4개를 같은 크기로 나열 |
| S4 보유(종목별) | 카드 그리드의 평가액 | 수익률·일변동 | 카드 안 정보 7개 이상 |
| S5 종목 상세 | 평가금액 (요약 그리드 hero 칸) | 계좌별 분해 리스트 | 실현손익·이력(데이터 없음) |
| S7 배당 | 예상 연 배당 | 월별 캘린더·랭크 | 세후/미래 보장 뉘앙스 |
| S9 성과 | 기간 증감(+투자손익) | 차트·표 | 0원에 손익색 |
| S11 계좌 | 예수금 합계 hero + 미입력 경고 | 계좌 행들 | 예수금 pill 카드화(card-in-card) |
| S10 설정 | (없음 — 시스템 List 관례) | | 커스텀 카드 스타일 남발 |

공통: 한 화면에서 HeroMoney는 1회만. 섹션 제목마다 번호/eyebrow 라벨 금지(hallmark).

---

## 9. 위젯 디자인

| 종류 | 레이아웃 |
|---|---|
| systemSmall | 상단: 브랜드 마크 12pt + "총자산" Caption / 중앙: 금액(24pt/800, 축약 없이) / 하단: 일간변동 GainLossText(Caption) + 갱신시각 Micro |
| systemMedium | 좌측 = small과 동일 / 우측: 14포인트 스파크라인(ChartLine 1.5pt, 영역 10% 틴트) + 상위 변동 2종목(티커+GainLoss Micro) |
| 잠금 inline | `₩85,149,229 −0.56%` |
| 잠금 circular | 중앙 일간변동률, 게이지 없음 |

- 배경: 시스템 위젯 배경(`containerBackground(.fill.tertiary)`) — 커스텀 그라데이션 금지.
- 데이터 없음/비로그인: 브랜드 마크 + "앱에서 로그인" Caption.
- 민감정보 고려: 잠금화면 위젯은 설정에서 "금액 숨기기"(●●● 표시) 옵션 제공(P1).

---

## 10. 다크모드 · 접근성

- 다크 = 별도 디자인이 아니라 토큰 스왑만으로 성립해야 한다(§2 표). 위계는 밝기 승격.
- Dynamic Type: xxxLarge까지 레이아웃 유지(카드 그리드는 1열로 리플로우). 금액 줄바꿈 금지 → `minimumScaleFactor(0.7)` 후 축약.
- 대비: 모든 텍스트 WCAG AA(4.5:1) — 특히 Muted/Subtle을 SurfaceSoft 위에 쓸 때 확인.
- VoiceOver: GainLossText는 "이익 12만 3천원, 2.4퍼센트"처럼 의미로 읽기. 차트는 요약 문장 제공("4월부터 8월까지 총자산 3,864만원에서 4,347만원으로 증가").
- 터치 타깃 최소 44×44pt(예수금 "편집" 텍스트 버튼 포함 — 히트영역 패딩으로 확보).

---

## 11. 앱 아이콘 · 런치 스크린

- 앱 아이콘: 기존 초록 장부 마크 유지(§1). 1024pt 원본에서 재출력, iOS 표준 마스크에 맞게 여백 재조정
  (현 PNG는 자체 라운드 사각 — **아이콘 안에 라운드 사각을 또 그리지 말 것**, 시스템이 마스킹).
  다크/틴트 변형(iOS 18): 다크 = 배경 `#0F1F17`, 틴트 = 곡선만 남긴 단색 글리프.
- 런치 스크린: `Bg` 단색 + 중앙 브랜드 마크(정적) — 애니메이션 스플래시 금지.

---

## 12. Do / Don't 최종 게이트 (구현 후 자가 검증 체크리스트)

- [ ] 뷰 코드에 hex/rgb 리터럴 0건 (토큰만) — `grep -rn "Color(red:\|#" Features/` = 0
- [ ] 손익 0이 빨강/파랑으로 칠해진 곳 0건, 날짜·라벨에 손익색 0건
- [ ] `#FFFFFF`/`#000000` 표면 0건
- [ ] 이모지 아이콘 0건, SF Symbols 외 아이콘 0건(브랜드 마크 제외)
- [ ] 모든 금액 monospacedDigit, 세로 정렬 확인
- [ ] card-in-card 0건, 균등 3-column 요약 0건(주인공 비대칭)
- [ ] 없는 데이터 UI 0건(실현손익·호가·추천 등), 모든 추정치에 "추정" 고지
- [ ] 화면당 등장 애니메이션 1회 이하, reduceMotion 대응
- [ ] 라이트/다크 × 표준/xxxLarge 4조합 스크린샷 검증(마일스톤마다)
- [ ] 잠금 위젯 포함 위젯 3종이 앱 수치와 일치
