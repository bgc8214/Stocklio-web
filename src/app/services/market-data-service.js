import { CACHE_PREFIX, FX_CACHE_TTL_MS, QUOTE_CACHE_TTL_MS, DIVIDEND_CACHE_TTL_MS, PRICE_HISTORY_CACHE_TTL_MS } from "../constants.js";
import { parseYahooChartMeta } from "../../domain/market-calendar.js";
import { parseTtmDividendPerShare, parse52WeekPriceSummary } from "../../domain/portfolio-core.js";

const CACHE_BASE_NAME = CACHE_PREFIX.replace(/-v\d+$/, "");
// 어떤 캐시 유형이든 이보다 오래된 항목은 부트 시 제거 — 매도해서 더는 조회하지 않는
// 종목의 quote:/div:/hist: 키가 localStorage 에 영원히 쌓이는 것을 막는다.
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function clearStaleQuoteCaches() {
  const now = Date.now();
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(CACHE_BASE_NAME)) {
      continue;
    }
    if (!key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key); // 이전 버전 prefix
      continue;
    }
    try {
      const cachedValue = JSON.parse(localStorage.getItem(key) || "{}");
      if (!Number.isFinite(cachedValue.cachedAt) || now - cachedValue.cachedAt > CACHE_MAX_AGE_MS) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

export async function getQuote(ticker, options = {}) {
  return cached(`quote:${ticker}`, QUOTE_CACHE_TTL_MS, async () => {
    const data = await fetchYahooChart(ticker);
    const quote = parseYahooChartMeta(data);
    if (!quote) {
      throw new Error(`${ticker} 가격 응답이 없습니다`);
    }
    return quote;
  }, { ...options, validate: isQuotePayload });
}

export async function getUsdKrw(options = {}) {
  return cached("fx:USD:KRW", FX_CACHE_TTL_MS, async () => {
    const data = await fetchYahooChart("KRW=X");
    const quote = parseYahooChartMeta(data);
    if (!quote) {
      throw new Error("USD/KRW 환율 응답이 없습니다");
    }
    return {
      pair: "USD/KRW",
      rate: quote.price,
      previousClose: quote.previousClose,
      change: quote.priceChange,
      changePercent: quote.priceChangePercent,
      source: quote.source,
      asOf: quote.asOf,
      priceDate: quote.priceDate,
    };
  }, { ...options, validate: isFxPayload });
}

// 종목별 주당 연배당(TTM) 조회 — 배당은 자주 변하지 않아 24h 캐시.
export async function getDividendInfo(ticker, options = {}) {
  return cached(`div:${ticker}`, DIVIDEND_CACHE_TTL_MS, async () => {
    const url = new URL("/api/yahoo/chart", window.location.origin);
    url.searchParams.set("symbol", ticker);
    url.searchParams.set("range", "1y");
    url.searchParams.set("interval", "1d");
    url.searchParams.set("events", "div");
    const data = await fetchJson(url);
    return parseTtmDividendPerShare(data);
    // payments(월별 지급 내역)는 나중에 추가된 필드 — 이를 검증에 포함해야
    // 그 이전에 캐시된 payments 없는 옛 항목이 자동으로 재조회된다.
  }, { ...options, validate: (p) => p && Number.isFinite(Number(p.perShare)) && Array.isArray(p.payments) });
}

// 종목별 1년 일봉 요약(스파크라인 + 52주 최고가) — 일 단위로만 변하므로 24h 캐시.
// 고점 대비 하락률의 "현재가"는 이 캐시가 아니라 보유 종목의 실시간 quote 가격을 쓴다.
export async function getPriceHistory(ticker, options = {}) {
  return cached(`hist:${ticker}`, PRICE_HISTORY_CACHE_TTL_MS, async () => {
    const url = new URL("/api/yahoo/chart", window.location.origin);
    url.searchParams.set("symbol", ticker);
    url.searchParams.set("range", "1y");
    url.searchParams.set("interval", "1d");
    const data = await fetchJson(url);
    const summary = parse52WeekPriceSummary(data);
    if (!summary) {
      throw new Error(`${ticker} 가격 이력 응답이 없습니다`);
    }
    return summary;
  }, { ...options, validate: isPriceHistoryPayload });
}

export async function searchSymbols(query) {
  const trimmedQuery = String(query || "").trim();
  if (trimmedQuery.length < 2) {
    return [];
  }
  const url = new URL("/api/yahoo/search", window.location.origin);
  url.searchParams.set("q", trimmedQuery);
  const data = await fetchJson(url);
  return Array.isArray(data?.results) ? data.results.filter(isSearchResult) : [];
}

export async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  const yahooError = data?.chart?.error;
  if (yahooError) {
    throw new Error(yahooError.description || yahooError.code || "Yahoo Finance 오류");
  }
  return data;
}

async function cached(key, ttlMs, loader, { force = false, validate = () => true } = {}) {
  const cacheKey = `${CACHE_PREFIX}:${key}`;
  if (!force) {
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      try {
        const cachedValue = JSON.parse(stored);
        if (Date.now() - cachedValue.cachedAt < ttlMs && validate(cachedValue.payload)) {
          return cachedValue.payload;
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }
  }
  const payload = await loader();
  const serialized = JSON.stringify({ cachedAt: Date.now(), payload });
  try {
    localStorage.setItem(cacheKey, serialized);
  } catch {
    // quota 초과 — 오래된 캐시를 비우고 한 번 더 시도. 그래도 실패하면 캐시 없이 진행
    // (저장 실패가 가격 조회 자체를 죽이면 안 된다).
    try {
      clearStaleQuoteCaches();
      localStorage.setItem(cacheKey, serialized);
    } catch {
      // no-op
    }
  }
  return payload;
}

async function fetchYahooChart(symbol) {
  const url = new URL("/api/yahoo/chart", window.location.origin);
  url.searchParams.set("symbol", symbol);
  return fetchJson(url);
}

function isQuotePayload(payload) {
  return Boolean(
    payload &&
      Number.isFinite(Number(payload.price)) &&
      Number.isFinite(Number(payload.priceChange)) &&
      Number.isFinite(Number(payload.priceChangePercent)),
  );
}

function isFxPayload(payload) {
  return Boolean(
    payload &&
      Number.isFinite(Number(payload.rate)) &&
      Number.isFinite(Number(payload.previousClose)) &&
      Number.isFinite(Number(payload.change)) &&
      Number.isFinite(Number(payload.changePercent)),
  );
}

function isPriceHistoryPayload(payload) {
  return Boolean(
    payload &&
      Array.isArray(payload.points) &&
      payload.points.length > 0 &&
      Number.isFinite(Number(payload.high)) &&
      Number(payload.high) > 0,
  );
}

function isSearchResult(result) {
  return Boolean(result?.symbol && result?.name);
}
