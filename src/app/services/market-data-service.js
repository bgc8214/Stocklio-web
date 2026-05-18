import { CACHE_PREFIX, FX_CACHE_TTL_MS, QUOTE_CACHE_TTL_MS } from "../constants.js";
import { getPriceDateInUsMarket } from "../../domain/market-calendar.js";

export async function getQuote(ticker, options = {}) {
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
      priceDate: timestamp ? getPriceDateInUsMarket(new Date(timestamp * 1000).toISOString()) : "",
    };
  }, { ...options, validate: isQuotePayload });
}

export async function getUsdKrw(options = {}) {
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
      priceDate: timestamp ? getPriceDateInUsMarket(new Date(timestamp * 1000).toISOString()) : "",
    };
  }, { ...options, validate: isFxPayload });
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
  localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), payload }));
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
