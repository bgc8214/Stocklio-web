import { CACHE_PREFIX, FX_CACHE_TTL_MS, QUOTE_CACHE_TTL_MS } from "../constants.js";

export async function getQuote(ticker) {
  return cached(`quote:${ticker}`, QUOTE_CACHE_TTL_MS, async () => {
    const data = await fetchYahooChart(ticker);
    const meta = data?.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`${ticker} 가격 응답이 없습니다`);
    }
    const previousClose = Number(meta?.previousClose ?? meta?.chartPreviousClose ?? price);
    const timestamp = Number(meta?.regularMarketTime);
    return {
      price,
      priceChange: price - previousClose,
      priceChangePercent: previousClose ? (price - previousClose) / previousClose : 0,
      source: "Yahoo Finance",
      asOf: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
    };
  });
}

export async function getUsdKrw() {
  return cached("fx:USD:KRW", FX_CACHE_TTL_MS, async () => {
    const data = await fetchYahooChart("KRW=X");
    const meta = data?.chart?.result?.[0]?.meta;
    const rate = Number(meta?.regularMarketPrice);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("USD/KRW 환율 응답이 없습니다");
    }
    const previousClose = Number(meta?.previousClose ?? meta?.chartPreviousClose ?? rate);
    const timestamp = Number(meta?.regularMarketTime);
    return {
      pair: "USD/KRW",
      rate,
      previousClose,
      change: rate - previousClose,
      changePercent: previousClose ? (rate - previousClose) / previousClose : 0,
      source: "Yahoo Finance",
      asOf: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
    };
  });
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

async function cached(key, ttlMs, loader) {
  const cacheKey = `${CACHE_PREFIX}:${key}`;
  const stored = localStorage.getItem(cacheKey);
  if (stored) {
    const cachedValue = JSON.parse(stored);
    if (Date.now() - cachedValue.cachedAt < ttlMs) {
      return cachedValue.payload;
    }
  }
  const payload = await loader();
  localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), payload }));
  return payload;
}

async function fetchYahooChart(symbol) {
  const url = new URL("/api/yahoo/chart", window.location.origin);
  url.searchParams.set("symbol", symbol);
  return fetchJson(url);
}
