import {
  buildAccountSnapshots,
  buildPortfolioSnapshot,
  validateStateShape,
} from "../../src/domain/portfolio-core.js";
import {
  buildDailyDigest,
  shouldSendDailyDigest,
} from "../../src/domain/notification-core.js";
import {
  getPriceDateInUsMarket,
  getUsMarketContextForSeoulDate,
} from "../../src/domain/market-calendar.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || "https://stocklio-web.vercel.app").replace(/\/$/, "");
const CRON_SECRET = process.env.CRON_SECRET || "";
const MAX_PORTFOLIOS_PER_RUN = Number(process.env.AUTOMATION_BATCH_SIZE || 50);
const PRICE_FETCH_CONCURRENCY = Number(process.env.AUTOMATION_PRICE_CONCURRENCY || 5);

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    response.status(405).json({ error: "method not allowed" });
    return;
  }

  if (!isAuthorized(request)) {
    response.status(401).json({ error: "unauthorized" });
    return;
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    response.status(503).json({
      ok: false,
      error: "missing_supabase_service_configuration",
      missing: [
        !SUPABASE_URL && "VITE_SUPABASE_URL",
        !SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
      ].filter(Boolean),
    });
    return;
  }

  const startedAt = new Date().toISOString();
  const runId = crypto.randomUUID();
  const today = seoulDateKey();
  let runStatus = "success";
  let successCount = 0;
  let failureCount = 0;
  const failures = [];

  await recordAutomationRun({
    id: runId,
    started_at: startedAt,
    status: "running",
    scope: "daily_snapshot",
    message: "daily snapshot started",
  });

  try {
    const portfolios = await listPortfolioStates(MAX_PORTFOLIOS_PER_RUN);
    for (const portfolio of portfolios) {
      try {
        const result = await processPortfolio(portfolio, today, runId);
        successCount += 1;
        if (result.failures.length) {
          runStatus = "partial";
          failures.push(...result.failures.map((failure) => ({ user_id: portfolio.user_id, ...failure })));
        }
      } catch (error) {
        runStatus = "partial";
        failureCount += 1;
        failures.push({ user_id: portfolio.user_id, symbol: "portfolio", message: error.message });
      }
    }

    if (failureCount && !successCount) {
      runStatus = "failed";
    }

    const finishedAt = new Date().toISOString();
    await recordAutomationRun({
      id: runId,
      started_at: startedAt,
      finished_at: finishedAt,
      status: runStatus,
      scope: "daily_snapshot",
      processed_portfolios: portfolios.length,
      success_count: successCount,
      failure_count: failureCount + failures.length,
      message: summarizeRun(runStatus, today, portfolios.length, failures.length),
    });

    response.status(runStatus === "failed" ? 500 : 200).json({
      ok: runStatus !== "failed",
      runId,
      date: today,
      status: runStatus,
      processedPortfolios: portfolios.length,
      successCount,
      failureCount: failureCount + failures.length,
      failures: failures.slice(0, 20),
    });
  } catch (error) {
    await recordAutomationRun({
      id: runId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: "failed",
      scope: "daily_snapshot",
      message: error.message,
    }).catch(() => {});
    response.status(500).json({ ok: false, runId, error: error.message });
  }
}

function isAuthorized(request) {
  if (!CRON_SECRET) {
    return process.env.VERCEL_ENV !== "production";
  }
  return request.headers.authorization === `Bearer ${CRON_SECRET}`;
}

async function processPortfolio(portfolio, date, runId) {
  const state = normalizeAutomationState(portfolio.state);
  const issues = validateStateShape(state);
  if (issues.length) {
    throw new Error(`invalid portfolio state: ${issues.join("; ")}`);
  }

  const marketContext = getUsMarketContextForSeoulDate(date);
  const { state: refreshed, failures } = await refreshPrices(state, runId, portfolio.user_id, marketContext);
  const snapshot = buildPortfolioSnapshot(refreshed, date, idFor("snapshot"));
  snapshot.marketContext = marketContext;
  snapshot.priceDate = marketContext.latestTradingDate;
  const accountSnapshots = buildAccountSnapshots(refreshed, date, idFor("account-snapshot"));
  const previousSnapshot = getPreviousSnapshot(refreshed.portfolioSnapshots, date);
  const nextState = upsertSnapshots(refreshed, date, snapshot, accountSnapshots, failures, marketContext);

  await updatePortfolioState(portfolio.user_id, nextState);
  await sendDailyDigestIfNeeded(portfolio.user_id, nextState, snapshot, previousSnapshot, date, marketContext);
  return { failures, snapshot };
}

function normalizeAutomationState(input) {
  const state = input && typeof input === "object" ? input : {};
  return {
    version: Number(state.version || 6),
    fxRate: state.fxRate || {
      pair: "USD/KRW",
      rate: 1350,
      source: "기본 환율",
      asOf: new Date().toISOString(),
    },
    holdings: Array.isArray(state.holdings) ? state.holdings : [],
    cashFlows: Array.isArray(state.cashFlows) ? state.cashFlows : [],
    cashBalances: Array.isArray(state.cashBalances) ? state.cashBalances : [],
    accounts: Array.isArray(state.accounts) ? state.accounts : [],
    dashboardLayout: Array.isArray(state.dashboardLayout) ? state.dashboardLayout : [],
    accountSnapshots: Array.isArray(state.accountSnapshots) ? state.accountSnapshots : [],
    priceUpdateLogs: Array.isArray(state.priceUpdateLogs) ? state.priceUpdateLogs : [],
    portfolioSnapshots: Array.isArray(state.portfolioSnapshots) ? state.portfolioSnapshots : [],
    automation: {
      ...(state.automation || {}),
      snapshotTime: state.automation?.snapshotTime || "07:00",
      timezone: state.automation?.timezone || "Asia/Seoul",
    },
  };
}

async function refreshPrices(state, runId, userId, marketContext) {
  const quoteMap = new Map();
  const failures = [];
  const logs = [...(state.priceUpdateLogs || [])];
  const tickers = unique((state.holdings || []).filter((holding) => holding.autoPrice !== false).map((holding) => holding.ticker));

  if (marketContext?.isMarketClosed) {
    const log = createPriceLog({
      symbol: "US_MARKET",
      status: "success",
      message: `${marketContext.closedReason || "휴장"} · ${marketContext.latestTradingDate} 종가 유지`,
      marketStatus: "closed",
      quoteAsOf: marketContext.latestTradingDate,
    });
    logs.push(log);
    await recordPriceLog(userId, runId, log).catch(() => {});
  } else {
    await runWithConcurrency(tickers, PRICE_FETCH_CONCURRENCY, async (ticker) => {
      try {
        const quote = await getYahooQuote(ticker);
        quoteMap.set(ticker, quote);
        const log = createPriceLog({ symbol: ticker, status: "success", price: quote.price, source: quote.source, marketStatus: "open", quoteAsOf: quote.asOf });
        logs.push(log);
        await recordPriceLog(userId, runId, log);
      } catch (error) {
        const failure = { symbol: ticker, message: error.message };
        failures.push(failure);
        const log = createPriceLog({ symbol: ticker, status: "error", message: error.message, marketStatus: "unknown" });
        logs.push(log);
        await recordPriceLog(userId, runId, log).catch(() => {});
      }
    });
  }

  let fxRate = state.fxRate;
  try {
    fxRate = await getYahooFxRate();
    const log = createPriceLog({ symbol: "USD/KRW", status: "success", price: fxRate.rate, source: "Yahoo Finance" });
    logs.push(log);
    await recordPriceLog(userId, runId, log);
  } catch (error) {
    failures.push({ symbol: "USD/KRW", message: error.message });
    const log = createPriceLog({ symbol: "USD/KRW", status: "error", message: error.message });
    logs.push(log);
    await recordPriceLog(userId, runId, log).catch(() => {});
  }

  return {
    failures,
    state: {
      ...state,
      fxRate,
      priceUpdateLogs: logs.slice(-300),
      holdings: (state.holdings || []).map((holding) => {
        const quote = quoteMap.get(holding.ticker);
        return quote
            ? {
                ...holding,
                price: quote.price,
                previousClose: quote.previousClose,
                priceChange: quote.priceChange,
                priceChangePercent: quote.priceChangePercent,
                priceSource: quote.source,
                priceAsOf: quote.asOf,
                priceDate: quote.priceDate,
              }
          : holding;
      }),
    },
  };
}

function upsertSnapshots(state, date, snapshot, accountSnapshots, failures, marketContext) {
  const existingIndex = state.portfolioSnapshots.findIndex((item) => item.date === date);
  const nextPortfolioSnapshots = [...state.portfolioSnapshots];
  if (existingIndex >= 0) {
    nextPortfolioSnapshots[existingIndex] = {
      ...nextPortfolioSnapshots[existingIndex],
      ...snapshot,
      id: nextPortfolioSnapshots[existingIndex].id,
    };
  } else {
    nextPortfolioSnapshots.push(snapshot);
  }

  return {
    ...state,
    portfolioSnapshots: nextPortfolioSnapshots.sort((a, b) => a.date.localeCompare(b.date)),
    accountSnapshots: [
      ...state.accountSnapshots.filter((item) => item.date !== date),
      ...accountSnapshots,
    ].sort((a, b) => `${a.date}${a.investor}${a.account}`.localeCompare(`${b.date}${b.investor}${b.account}`)),
    automation: {
      ...(state.automation || {}),
      lastRunAt: new Date().toISOString(),
      lastResult: marketContext?.isMarketClosed
        ? `자동 기록 완료 · ${marketContext.closedReason || "휴장"} · ${marketContext.latestTradingDate} 종가 기준`
        : failures.length
          ? `자동 기록 완료 · 일부 가격 실패 ${failures.length}건`
          : "자동 기록 완료",
      lastSnapshotDate: date,
      lastFailureCount: failures.length,
      snapshotTime: state.automation?.snapshotTime || "07:00",
      timezone: "Asia/Seoul",
    },
  };
}

async function listPortfolioStates(limit) {
  const data = await supabaseFetch("/rest/v1/portfolio_states", {
    searchParams: {
      select: "user_id,state",
      limit: String(limit),
      order: "updated_at.asc",
    },
  });
  return Array.isArray(data) ? data : [];
}

async function updatePortfolioState(userId, state) {
  await supabaseFetch("/rest/v1/portfolio_states", {
    method: "PATCH",
    searchParams: { user_id: `eq.${userId}` },
    body: JSON.stringify({ state }),
    headers: {
      "content-type": "application/json",
      prefer: "return=minimal",
    },
  });
}

async function sendDailyDigestIfNeeded(userId, state, snapshot, previousSnapshot, date, marketContext) {
  const settings = await getNotificationSettings(userId);
  const digest = buildDailyDigest({
    state,
    snapshot,
    previousSnapshot,
    date,
    siteUrl: SITE_URL,
    marketContext,
  });
  if (!settings) {
    return;
  }
  if (!TELEGRAM_BOT_TOKEN) {
    await recordNotificationLog({
      user_id: userId,
      provider: "telegram",
      message_type: "daily_digest",
      snapshot_date: date,
      status: "error",
      error_message: "TELEGRAM_BOT_TOKEN is not configured",
    });
    return;
  }
  if (!settings.telegram_chat_id) {
    await recordNotificationLog({
      user_id: userId,
      provider: "telegram",
      message_type: "daily_digest",
      snapshot_date: date,
      status: "skipped",
      error_message: "telegram_chat_id is empty",
    });
    return;
  }
  if (!shouldSendDailyDigest(settings, digest)) {
    await recordNotificationLog({
      user_id: userId,
      provider: "telegram",
      message_type: "daily_digest",
      snapshot_date: date,
      status: "skipped",
      message_preview: digest.text.slice(0, 500),
    });
    return;
  }

  try {
    await sendTelegramMessage(settings.telegram_chat_id, digest.text);
    await recordNotificationLog({
      user_id: userId,
      provider: "telegram",
      message_type: "daily_digest",
      snapshot_date: date,
      status: "success",
      message_preview: digest.text.slice(0, 500),
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    await recordNotificationLog({
      user_id: userId,
      provider: "telegram",
      message_type: "daily_digest",
      snapshot_date: date,
      status: "error",
      message_preview: digest.text.slice(0, 500),
      error_message: error.message,
    });
  }
}

async function getNotificationSettings(userId) {
  const rows = await supabaseFetch("/rest/v1/notification_settings", {
    searchParams: {
      select: "*",
      user_id: `eq.${userId}`,
      limit: "1",
    },
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function recordNotificationLog(log) {
  await supabaseFetch("/rest/v1/notification_delivery_logs", {
    method: "POST",
    body: JSON.stringify(log),
    headers: {
      "content-type": "application/json",
      prefer: "return=minimal",
    },
  });
}

async function sendTelegramMessage(chatId, text) {
  const result = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!result.ok) {
    const errorText = await result.text();
    throw new Error(`Telegram ${result.status}: ${errorText.slice(0, 200)}`);
  }
}

function getPreviousSnapshot(snapshots = [], date) {
  return [...snapshots]
    .filter((snapshot) => snapshot.date < date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1) || null;
}

async function recordAutomationRun(run) {
  await supabaseFetch("/rest/v1/automation_runs", {
    method: "POST",
    searchParams: { on_conflict: "id" },
    body: JSON.stringify(run),
    headers: {
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    },
  });
}

async function recordPriceLog(userId, runId, log) {
  await supabaseFetch("/rest/v1/price_logs", {
    method: "POST",
    body: JSON.stringify({
      portfolio_user_id: userId,
      automation_run_id: runId,
      symbol: log.symbol,
      status: log.status,
      price: Number.isFinite(Number(log.price)) ? Number(log.price) : null,
      source: log.source || null,
      as_of: log.at,
      message: log.message || null,
    }),
    headers: {
      "content-type": "application/json",
      prefer: "return=minimal",
    },
  });
}

async function supabaseFetch(path, options = {}) {
  const url = new URL(path, SUPABASE_URL);
  for (const [key, value] of Object.entries(options.searchParams || {})) {
    url.searchParams.set(key, value);
  }
  const result = await fetch(url, {
    method: options.method || "GET",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
    body: options.body,
  });
  if (!result.ok) {
    const text = await result.text();
    throw new Error(`Supabase ${result.status}: ${text.slice(0, 300)}`);
  }
  if (result.status === 204) {
    return null;
  }
  const text = await result.text();
  return text ? JSON.parse(text) : null;
}

async function getYahooQuote(ticker) {
  const data = await fetchYahooChartData(ticker);
  const meta = data?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${ticker} 가격 응답이 없습니다`);
  }
  const previousClose = Number(meta?.previousClose ?? meta?.chartPreviousClose ?? price);
  const timestamp = Number(meta?.regularMarketTime);
  return {
    price,
    previousClose,
    priceChange: price - previousClose,
    priceChangePercent: previousClose ? (price - previousClose) / previousClose : 0,
    source: "Yahoo Finance",
    asOf: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
    priceDate: timestamp ? getPriceDateInUsMarket(new Date(timestamp * 1000).toISOString()) : "",
  };
}

async function getYahooFxRate() {
  const data = await fetchYahooChartData("KRW=X");
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
}

async function fetchYahooChartData(symbol) {
  if (!/^[A-Z0-9.^=-]{1,20}$/.test(symbol)) {
    throw new Error(`유효하지 않은 심볼: ${symbol}`);
  }
  const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  yahooUrl.searchParams.set("interval", "1d");
  yahooUrl.searchParams.set("range", "1d");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const yahooResponse = await fetch(yahooUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "stocklio-automation/1.0",
      },
      signal: controller.signal,
    });
    if (!yahooResponse.ok) {
      throw new Error(`Yahoo HTTP ${yahooResponse.status}`);
    }
    const data = await yahooResponse.json();
    const yahooError = data?.chart?.error;
    if (yahooError) {
      throw new Error(yahooError.description || yahooError.code || "Yahoo Finance 오류");
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function createPriceLog(log) {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...log,
  };
}

function idFor(prefix) {
  return () => `${prefix}-${crypto.randomUUID()}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

async function runWithConcurrency(items, concurrency, worker) {
  const queue = [...items];
  const workerCount = Math.max(1, Math.min(Number(concurrency) || 1, queue.length || 1));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length) {
        const item = queue.shift();
        await worker(item);
      }
    }),
  );
}

function seoulDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function summarizeRun(status, date, processed, failures) {
  if (status === "failed") {
    return `${date} 자동 기록 실패`;
  }
  if (failures) {
    return `${date} 자동 기록 일부 완료 · 실패 ${failures}건`;
  }
  return `${date} 자동 기록 완료 · 포트폴리오 ${processed}개`;
}
