import {
  buildAccountSnapshots,
  buildPortfolioSnapshot,
  getNetInflowKrw,
  validateStateShape,
} from "../../src/domain/portfolio-core.js";
import {
  buildDailyDigest,
  shouldSendDailyDigest,
} from "../../src/domain/notification-core.js";
import {
  dateKeyInTimeZone,
  getUsMarketContextForSeoulDate,
  parseYahooChartMeta,
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
      failure_count: failures.length,
      message: summarizeRun(runStatus, today, portfolios.length, failures.length),
    });

    // 포트폴리오 단위 실패(failureCount)나 전체 실패는 텔레그램으로 셀프 알림 —
    // 심볼 단건 실패(partial)는 매일 노이즈가 될 수 있어 제외.
    if (runStatus === "failed" || failureCount > 0) {
      await notifyRunFailure(runStatus, today, failures).catch(() => {});
    }

    response.status(runStatus === "failed" ? 500 : 200).json({
      ok: runStatus !== "failed",
      runId,
      date: today,
      status: runStatus,
      processedPortfolios: portfolios.length,
      successCount,
      failureCount: failures.length,
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
    await notifyRunFailure("failed", today, [{ symbol: "run", message: error.message }]).catch(() => {});
    response.status(500).json({ ok: false, runId, error: error.message });
  }
}

// cron 이 조용히 죽으면 대시보드를 열어보기 전까지 아무도 모른다 —
// 실패 시 봇으로 셀프 알림 1건을 보낸다. OPS_TELEGRAM_CHAT_ID 가 있으면 그 대화로,
// 없으면 텔레그램이 켜진 첫 사용자의 chat 으로 보낸다. 알림 실패는 무시(run 결과에 영향 없음).
async function notifyRunFailure(runStatus, date, failures) {
  if (!TELEGRAM_BOT_TOKEN) {
    return;
  }
  let chatId = String(process.env.OPS_TELEGRAM_CHAT_ID || "").trim();
  if (!chatId) {
    const rows = await supabaseFetch("/rest/v1/notification_settings", {
      searchParams: {
        select: "telegram_chat_id",
        telegram_enabled: "eq.true",
        limit: "1",
      },
    }).catch(() => null);
    chatId = String(rows?.[0]?.telegram_chat_id || "").trim();
  }
  if (!chatId) {
    return;
  }
  const lines = [
    `⚠️ 투자일지 자동 기록 ${runStatus === "failed" ? "실패" : "부분 실패"} · ${date}`,
    ...failures.slice(0, 5).map((failure) => `- ${failure.symbol}: ${String(failure.message || "").slice(0, 120)}`),
  ];
  await sendTelegramMessage(chatId, lines.join("\n"));
}

function isAuthorized(request) {
  if (!CRON_SECRET) {
    // 시크릿이 없으면 Vercel 어디서든(프리뷰 포함) 거부한다 — 로컬 개발만 예외.
    // (이전엔 non-production 이면 통과라 프리뷰 URL 로 무인증 실행이 가능했다)
    return !process.env.VERCEL;
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
  const refreshResult = await refreshPrices(state, runId, portfolio.user_id, marketContext);
  const failures = refreshResult.failures;
  // 가격 조회(수십 초) 동안 사용자가 브라우저에서 저장한 편집을 잃지 않도록,
  // 쓰기 직전 fresh 상태를 재조회하고 그 위에 이번 run 의 시세 결과만 얹는다
  // (server.mjs 로컬 자동화 루프의 re-read 패턴과 동일. 재조회 실패 시 run 시작 상태로 fallback).
  let base = state;
  try {
    const freshState = await fetchPortfolioState(portfolio.user_id);
    if (freshState) {
      base = normalizeAutomationState(freshState);
    }
  } catch {
    // fallback to run-start state
  }
  const refreshed = applyRefreshResults(base, refreshResult);
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

function isKrTicker(ticker) {
  return /^[0-9]{6}\.(KS|KQ)$/.test(String(ticker || "").toUpperCase());
}

async function refreshPrices(state, runId, userId, marketContext) {
  const quoteMap = new Map();
  const failures = [];
  const newLogs = [];
  const tickers = unique((state.holdings || []).filter((holding) => holding.autoPrice !== false).map((holding) => holding.ticker));

  // 미국 휴장일(추수감사절 등)에도 한국 장은 열릴 수 있다 — 미국 종목만 최근 종가를
  // 유지하고 KR 종목(6자리 .KS/.KQ)과 환율은 계속 갱신한다.
  const usMarketClosed = Boolean(marketContext?.isMarketClosed);
  const tickersToFetch = usMarketClosed ? tickers.filter(isKrTicker) : tickers;

  if (usMarketClosed) {
    const log = createPriceLog({
      symbol: "US_MARKET",
      status: "success",
      message: `${marketContext.closedReason || "휴장"} · 미국 종목 ${marketContext.latestTradingDate} 종가 유지`,
      marketStatus: "closed",
      quoteAsOf: marketContext.latestTradingDate,
    });
    newLogs.push(log);
    await recordPriceLog(userId, runId, log).catch(() => {});
  }

  await runWithConcurrency(tickersToFetch, PRICE_FETCH_CONCURRENCY, async (ticker) => {
    try {
      const quote = await getYahooQuote(ticker);
      quoteMap.set(ticker, quote);
      const log = createPriceLog({ symbol: ticker, status: "success", price: quote.price, source: quote.source, marketStatus: "open", quoteAsOf: quote.asOf });
      newLogs.push(log);
      await recordPriceLog(userId, runId, log);
    } catch (error) {
      const failure = { symbol: ticker, message: error.message };
      failures.push(failure);
      const log = createPriceLog({ symbol: ticker, status: "error", message: error.message, marketStatus: "unknown" });
      newLogs.push(log);
      await recordPriceLog(userId, runId, log).catch(() => {});
    }
  });

  let fxRate = null; // 조회 실패 시 applyRefreshResults 가 base 의 기존 환율을 유지한다
  try {
    fxRate = await getYahooFxRate();
    const log = createPriceLog({ symbol: "USD/KRW", status: "success", price: fxRate.rate, source: "Yahoo Finance" });
    newLogs.push(log);
    await recordPriceLog(userId, runId, log);
  } catch (error) {
    failures.push({ symbol: "USD/KRW", message: error.message });
    const log = createPriceLog({ symbol: "USD/KRW", status: "error", message: error.message });
    newLogs.push(log);
    await recordPriceLog(userId, runId, log).catch(() => {});
  }

  return { failures, quoteMap, fxRate, newLogs };
}

// refreshPrices 결과(시세·환율·로그)를 base 상태 위에 얹는다.
// base 는 쓰기 직전 재조회한 fresh 상태 — 이번 run 의 결과 외에는 건드리지 않는다.
function applyRefreshResults(base, { quoteMap, fxRate, newLogs }) {
  return {
    ...base,
    fxRate: fxRate || base.fxRate,
    priceUpdateLogs: [...(base.priceUpdateLogs || []), ...newLogs].slice(-300),
    holdings: (base.holdings || []).map((holding) => {
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
  };
}

async function fetchPortfolioState(userId) {
  const data = await supabaseFetch("/rest/v1/portfolio_states", {
    searchParams: {
      select: "state",
      user_id: `eq.${userId}`,
      limit: "1",
    },
  });
  return Array.isArray(data) && data[0]?.state ? data[0].state : null;
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
    // netInflowKrw 는 스냅샷 생성(07:00) "이후" 당일 날짜로 입력된 입출금을 놓친다 —
    // 매 run 마다 현재 cashFlows 기준으로 전체 재계산해 늦게 입력·백데이트된 흐름을 반영한다.
    portfolioSnapshots: nextPortfolioSnapshots
      .map((item) => ({ ...item, netInflowKrw: getNetInflowKrw(state.cashFlows || [], item.date) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
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
  // 한국 종목(6자리 숫자)은 .KS suffix 자동 시도
  const isKrTicker = /^\d{6}$/.test(ticker);
  const symbols = isKrTicker ? [`${ticker}.KS`, ticker] : [ticker];

  let lastError;
  for (const symbol of symbols) {
    try {
      const data = await fetchYahooChartData(symbol);
      const quote = parseYahooChartMeta(data);
      if (quote) {
        return quote;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error(`${ticker} 가격 응답이 없습니다`);
}

async function getYahooFxRate() {
  const data = await fetchYahooChartData("KRW=X");
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
  return dateKeyInTimeZone(date, "Asia/Seoul");
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
