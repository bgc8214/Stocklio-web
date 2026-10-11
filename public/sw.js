// 투자일지 서비스 워커 — PWA 셸 캐시.
//
// 전략 (금융 데이터 앱이라 "신선함 우선"으로 보수적으로 잡는다):
//  - HTML 내비게이션: network-first — 새 배포가 즉시 반영되고, 오프라인일 때만 캐시 폴백
//  - 정적 자산(/assets/*, 해시 번들, 폰트): stale-while-revalidate — 즉시 응답 + 백그라운드 갱신.
//    해시 안 된 파일(chart.umd.min.js 등)도 다음 방문엔 새 버전이 반영된다
//  - /api/* 와 외부 오리진(Supabase·Yahoo): 절대 개입하지 않음 — 시세·상태가 캐시되면 안 된다
const CACHE = "stocklio-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith("/assets/") || /\.(js|css|png|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put("/", response.clone());
    }
    return response;
  } catch {
    return (await cache.match("/")) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || (await refresh) || Response.error();
}
