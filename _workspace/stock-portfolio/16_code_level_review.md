# 코드 레벨 리뷰: 실제 코드에서 발견한 문제와 수정 방향

작성일: 2026-07-17. 15번 문서(개선 방향성)가 기능/아키텍처 레벨이라면, 이 문서는 **현재 코드를 직접 읽고 찾은 구체적 결함**의 목록이다. 각 항목에 파일:줄 근거를 붙였다. 심각도 순으로 정리한다.

## A. 데이터 정합성 버그 (실제 데이터가 깨질 수 있는 것)

### A-1. 자동화 루프의 읽기-수정-쓰기 경쟁 — 사용자 편집이 조용히 사라진다

`server.mjs:336` `runDailySnapshotJob`은 ① `readState()`로 상태를 읽고, ② `await refreshStatePrices()`로 수십 초간 Yahoo를 순회한 뒤, ③ `writeState()`로 **전체 상태를 덮어쓴다**. ②가 진행되는 동안 사용자가 `PUT /api/state`로 종목을 추가하면, ③이 그 변경을 스냅샷 시작 시점의 낡은 상태로 되돌린다. 로컬에서 15분마다 실제로 일어날 수 있는 lost update다.

수정 방향: 잡 시작 시 `updated_at`을 기억하고 쓰기 직전에 재확인, 달라졌으면 상태를 다시 읽어 가격/스냅샷 필드만 병합해서 쓴다. (15번 문서의 revision 낙관적 잠금이 근본 해결이지만, 병합 쓰기만으로도 이 버그는 막힌다.)

### A-2. "일일" 스냅샷이 아니라 "09:10 이후 15분마다 전체 갱신"

`server.mjs:343`의 스킵 조건은 `currentTime < snapshotTime`뿐이다. 오늘 이미 실행했는지 확인하지 않으므로, 09:10 이후 자정까지 **매 15분 틱마다** 전 종목 Yahoo 조회 + 스냅샷 덮어쓰기 + 상태 저장이 반복된다. A-1의 경쟁 창이 하루 수십 번 열리고, `priceUpdateLogs`가 무의미한 성공 로그로 채워지며(200개 제한이라 진짜 실패 로그가 밀려남), Yahoo 호출량도 불필요하게 크다.

수정 방향: `automation.lastRunAt`의 서울 날짜가 오늘이고 오늘 스냅샷이 이미 있으면 skip. 장중 가격 갱신을 원하면 그것은 스냅샷 잡과 분리된 별도 주기로 명시한다.

### A-3. `normalizeState`가 화이트리스트라 필드가 조용히 증발한다

`server.mjs:298` `normalizeState`는 아는 키만 복사해서 새 객체를 만든다. 그 결과:

- `lastPriceRefreshImpact`는 시드 상태(`server.mjs:742`)와 클라이언트 상태 팩토리(`state-factory.js`)에는 있지만 `normalizeState`에는 없다 → **저장 왕복마다 삭제된다.** 지금 이 순간에도 재현되는 버그다.
- 앞으로 클라이언트에 필드를 추가할 때마다 `normalizeState`에도 추가하지 않으면 같은 방식으로 증발한다. 15번 문서의 거래 원장(`transactions`)을 붙이는 순간 바로 밟을 지뢰다.

수정 방향: `{ ...input, ...normalizedKnownFields }`로 스프레드 기반 병합으로 바꿔 미지의 필드를 보존하거나, 최소한 도메인의 `validateStateShape`와 필드 목록을 한 곳에서 공유한다.

### A-4. 버전 상수가 세 곳에 있고 서로 모른다

- `src/domain/portfolio-core.js:1` — `STATE_VERSION = 6` (정본이어야 할 곳)
- `src/app/constants.js` — `DATA_VERSION = 6` (별도 선언)
- `server.mjs:303`, `server.mjs:701` — 리터럴 `6` 하드코딩 2회

게다가 `normalizeState`는 입력의 version을 보지 않고 무조건 6을 찍는다. v7 마이그레이션을 하는 날, 서버를 고치지 않으면 클라이언트가 올린 v7 상태가 v6 라벨로 저장된다. 수정: 세 곳 모두 `STATE_VERSION` 임포트로 통일하고, `normalizeState`는 미지의 상위 버전 입력을 거부(또는 경고)해야 한다.

### A-5. 통화 처리가 KRW/USD 이분법에 하드코딩

`portfolio-core.js:72` — `rate = holding.currency === "KRW" ? 1 : fxRate`. KRW가 아닌 모든 통화를 USD로 간주해 USD/KRW 환율을 곱한다. JPY/EUR 종목을 입력하는 순간 총자산이 조용히 틀린다. `getCashValueKrw`(:88)도 동일. 지금 당장 다통화를 지원하자는 게 아니라, **지원하지 않는 통화를 거부하지 않는 것**이 문제다. 수정: `validateStateShape`에서 `currency ∉ {KRW, USD}`를 이슈로 보고하고, UI 통화 선택지를 두 개로 제한한다.

### A-6. `validateStateShape`가 숫자의 유한성을 검사하지 않는다

`portfolio-core.js:183`의 수량 음수 검사는 `Number(holding.quantity || 0) < 0`이라 `NaN`이 통과한다. `price`, `averageCost`, `amountKrw`는 아예 검사가 없다. NaN 하나가 들어오면 `getTotals` 합산 전체가 NaN으로 오염되고, 그 상태가 스냅샷으로 저장되면 성과 그래프에 영구 구멍이 남는다. 수정: 모든 금액/수량 필드에 `Number.isFinite` 검사 추가. (A-3의 diagnostics에 이미 이슈 배열 파이프라인이 있으니 검사만 추가하면 된다.)

## B. 보안

### B-1. 로컬 정적 서버가 저장소 루트 전체를 서빙한다

`server.mjs:594` `serveStatic`은 경로 탈출(`../`)만 막고 **allowlist가 없다**. 즉 `GET /data/portfolio.db`(전체 금융 데이터), `GET /.env`(Supabase 키), `GET /data/private/import-preview-state.json`이 모두 그대로 다운로드된다. 기본 바인딩이 `127.0.0.1`이라 방어되고 있지만, `HOST=0.0.0.0`으로 띄우는 순간(모바일에서 접속해보려고 흔히 하는 일) 같은 네트워크의 누구나 DB 파일을 가져갈 수 있다. 수정: 서빙 허용 경로를 `index.html`, `landing.html`, `assets/`, `styles.css`, `src/` 등 명시적 목록으로 제한하고, `data/`, `.env*`, `_workspace/`는 무조건 404.

### B-2. XSS 방어가 "관례"로만 유지되고 있다

`innerHTML` 대입이 9개 파일 56곳이고, 사용자 입력(종목명, 계좌명, 메모)이 템플릿 문자열로 들어간다. 표본 확인 결과 `escapeHtml` 사용 규율은 잘 지켜지고 있으나(`holdings-view.js:286-303` 등), 56곳 중 한 곳만 빠뜨려도 저장형 XSS가 된다 — 특히 XLSX 임포트로 외부에서 만든 파일의 문자열이 상태에 들어오는 경로가 있다. 수정: ① 이스케이프를 자동화하는 `html` 태그드 템플릿 헬퍼를 만들어 `escapeHtml` 수동 호출을 대체, ② `eslint-plugin-no-unsanitized`를 `npm run check`에 추가해 회귀를 기계로 막는다. CSP 헤더가 전무한 것도 함께: 로컬 서버와 Vercel 응답에 최소한의 `Content-Security-Policy`를 추가한다.

### B-3. 종목 로고를 제3자 CDN에서 직접 로드

`holdings-view.js:154` — `assets.parqet.com`으로 보유 종목 심볼이 브라우저에서 직접 유출된다. 개인 금융 도구 관점에서 보유 종목 목록은 민감 정보다. 수정: 로고를 로컬 프록시로 캐싱하거나, 옵트인 설정으로 두거나, 최소한 문서화한다. (B-2의 CSP를 넣을 때 이 도메인 허용 여부를 결정해야 하므로 함께 처리.)

## C. 중복과 구조 (버그의 온상)

### C-1. 시드 상태가 두 곳에 ~60줄씩 복제되어 이미 드리프트했다

`server.mjs:699` `createSeedState`와 `state-factory.js` `createSampleState`는 같은 샘플 데이터의 사본이고, 벌써 다르다(전자는 `lastPriceRefreshImpact` 포함, 후자와 스냅샷 형식 차이). A-3 버그와 결합하면 "어느 쪽이 진짜 상태 모양인가"에 답이 없어진다. 수정: 샘플/시드 상태 팩토리를 `src/domain/`으로 옮겨 서버와 클라이언트가 공유한다. 상태 "모양"의 정본은 도메인 레이어 한 곳이어야 한다.

### C-2. Yahoo 호출 코드가 세 벌이다

`server.mjs:502` `fetchYahooChartData` / `market-data-service.js` `fetchYahooChart` / `api/cron/daily-snapshot.js`의 가격 조회가 각각 별도 구현이다. 검증 로직(`regularMarketPrice` 유효성, 에러 메시지)도 3벌. 15번 문서의 provider 추상화 이전이라도, 최소한 응답 파싱/검증 함수(`parseYahooChartMeta`)는 도메인에 한 벌로 둘 수 있다.

### C-3. 날짜 헬퍼 중복

`server.mjs:808` `todayKey`/`seoulTime`과 `api/cron/daily-snapshot.js`의 `seoulDateKey`가 같은 일을 따로 한다. `src/domain/market-calendar.js`가 이미 있으니 서울 날짜/시각 헬퍼는 거기로 모은다.

### C-4. ID 생성이 제각각

`portfolio-core.js:205` `defaultId`, `server.mjs:836` `makeId`는 `Date.now()+Math.random()` 조합(같은 밀리초 내 충돌 가능), cron은 `crypto.randomUUID()`. Node 20과 모던 브라우저 모두 `crypto.randomUUID()`를 지원하므로 전부 그걸로 통일한다.

## D. 견고성

### D-1. 서버측 `fetch`에 타임아웃이 하나도 없다

`server.mjs`의 Yahoo 호출 전부(`:143`, `:183`, `:231`, `:507`)와 cron의 호출에 `AbortSignal.timeout()`이 없다. Yahoo가 응답을 물고 있으면 자동화 잡이 무기한 매달리고, A-1의 경쟁 창이 무한정 길어진다. 수정: 공용 `fetchWithTimeout(url, { timeoutMs: 10000 })` 하나 만들어 전 호출에 적용.

### D-2. 순차 가격 조회

`server.mjs:426` — 종목을 하나씩 `await`로 순회한다. 종목 30개면 30회 왕복이 직렬이다. cron 쪽은 이미 `PRICE_FETCH_CONCURRENCY = 5` 동시성 풀이 있으니(`api/cron/daily-snapshot.js:21`), 같은 패턴을 로컬 서버에도 적용한다. (C-2의 통합과 같은 작업이다.)

### D-3. 임포트 프리뷰 임시 파일 누적과 경쟁

`server.mjs:651` — 업로드를 `import-preview-<timestamp>.xlsx`로 저장하고 **삭제하지 않는다**. 프리뷰할 때마다 원본 금융 데이터 파일이 디스크에 쌓인다(gitignore 경로이긴 하나 B-1과 결합하면 다운로드 가능). 또한 프리뷰 결과가 고정 경로(`importPreviewStatePath`)에 저장되므로 두 탭에서 프리뷰하면 마지막 것이 이긴다 — commit은 "내가 방금 본 프리뷰"가 아닐 수 있다. 수정: 처리 후 `finally`에서 업로드 파일 삭제, 프리뷰에 토큰을 부여해 commit 시 토큰 일치 검증.

### D-4. 스트리밍 중 에러 시 이중 응답 크래시 가능

`server.mjs:111`의 최상위 catch는 무조건 `sendJson(500)`을 호출한다. `serveStatic`이 스트리밍을 시작한 뒤(`createReadStream(...).pipe`) 에러가 나면 이미 헤더가 전송된 상태라 `writeHead`가 throw한다. `response.headersSent` 가드 추가.

### D-5. 클라이언트 캐시의 세대 청소 없음

`constants.js` — `CACHE_PREFIX`가 `...-v2`인데 v1 키를 지우는 코드가 없다. localStorage에 죽은 캐시가 영구히 남는다. 부트 시 구 프리픽스 키 일괄 삭제 한 줄이면 된다.

## E. 테스트로 고정해야 할 것

위 항목 중 회귀 가능성이 높은 것은 수정과 동시에 테스트를 추가한다:

- A-2: "같은 날 두 번째 실행은 skip" — `runDailySnapshotJob`을 시간 주입 가능하게 리팩터링 후 단위 테스트
- A-3: "normalizeState 왕복 후 미지 필드 보존" — 골든 왕복 테스트
- A-6: "NaN price 입력 시 validateStateShape가 이슈 보고" — 도메인 테스트
- B-2: lint 규칙 자체가 테스트 역할 (`npm run check`에 포함)

## 우선순위 제안

| 순서 | 항목 | 이유 |
|---|---|---|
| 1 | A-1 + A-2 + D-1 (자동화 잡 안전화) | 지금 매일 도는 코드의 데이터 소실 경로. 한 PR로 묶기 좋다 |
| 2 | A-3 + A-4 + C-1 (상태 모양 정본화) | v7 마이그레이션(15번 문서 축 1)의 전제 조건 |
| 3 | B-1 (정적 서빙 allowlist) | 수정 자체는 30분짜리, 리스크 대비 최고 효율 |
| 4 | B-2 (html 헬퍼 + lint) | 기계적 방어로 전환 |
| 5 | A-5, A-6, C-2~4, D-2~5 | 각각 독립적인 소규모 PR |
