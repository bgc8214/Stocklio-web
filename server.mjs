import { createReadStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const dataDir = join(rootDir, "data");
const dbPath = join(dataDir, "portfolio.db");
const importSummaryPath = join(dataDir, "private", "migration-summary.json");
const stateKey = "default";
const automationIntervalMs = 15 * 60 * 1000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

await mkdir(dataDir, { recursive: true });
const db = new DatabaseSync(dbPath);
initializeDb();

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (url.pathname === "/api/state" && request.method === "GET") {
      sendJson(response, 200, readState());
      return;
    }

    if (url.pathname === "/api/state" && request.method === "PUT") {
      const nextState = await readJsonBody(request);
      writeState(normalizeState(nextState));
      sendJson(response, 200, { ok: true, savedAt: new Date().toISOString() });
      return;
    }

    if (url.pathname === "/api/automation/run" && request.method === "POST") {
      const result = await runDailySnapshotJob("manual");
      sendJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/automation/status" && request.method === "GET") {
      sendJson(response, 200, getAutomationStatus());
      return;
    }

    if (url.pathname === "/api/import/summary" && request.method === "GET") {
      await sendImportSummary(response);
      return;
    }

    if (url.pathname === "/api/yahoo/chart") {
      await proxyYahooChart(url, response);
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Internal server error" });
  }
}).listen(port, () => {
  console.log(`Stock Portfolio Lab running at http://localhost:${port}`);
  console.log(`SQLite state: ${dbPath}`);
});

setInterval(() => {
  runDailySnapshotJob("schedule").catch((error) => {
    console.error(`Scheduled snapshot failed: ${error.message}`);
  });
}, automationIntervalMs);

async function proxyYahooChart(url, response) {
  const symbol = String(url.searchParams.get("symbol") || "").trim().toUpperCase();
  if (!/^[A-Z0-9.=^-]{1,20}$/.test(symbol)) {
    sendJson(response, 400, { error: "Invalid symbol" });
    return;
  }

  const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  yahooUrl.searchParams.set("interval", "1d");
  yahooUrl.searchParams.set("range", "1d");

  const yahooResponse = await fetch(yahooUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "stock-portfolio-lab/0.1",
    },
  });

  const body = await yahooResponse.text();
  response.writeHead(yahooResponse.status, {
    "content-type": yahooResponse.headers.get("content-type") || "application/json; charset=utf-8",
    "cache-control": symbol === "KRW=X" ? "public, max-age=3600" : "public, max-age=300",
  });
  response.end(body);
}

function initializeDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const existing = db.prepare("SELECT value FROM app_state WHERE key = ?").get(stateKey);
  if (!existing) {
    writeState(createSeedState());
  }
}

function readState() {
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get(stateKey);
  if (!row) {
    const seed = createSeedState();
    writeState(seed);
    return seed;
  }
  return normalizeState(JSON.parse(row.value));
}

function writeState(nextState) {
  db.prepare(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(stateKey, JSON.stringify(nextState), new Date().toISOString());
}

function normalizeState(input) {
  if (!input || typeof input !== "object") {
    return createSeedState();
  }
  return {
    version: 6,
    fxRate: input.fxRate || {
      pair: "USD/KRW",
      rate: 1350,
      source: "샘플 환율",
      asOf: "샘플",
    },
    holdings: Array.isArray(input.holdings) ? input.holdings : [],
    cashFlows: Array.isArray(input.cashFlows) ? input.cashFlows : [],
    cashBalances: Array.isArray(input.cashBalances) ? input.cashBalances : [],
    accounts: Array.isArray(input.accounts) ? input.accounts : deriveAccounts(input),
    dashboardLayout: normalizeDashboardLayout(input.dashboardLayout),
    accountSnapshots: Array.isArray(input.accountSnapshots) ? input.accountSnapshots : [],
    priceUpdateLogs: Array.isArray(input.priceUpdateLogs) ? input.priceUpdateLogs : [],
    portfolioSnapshots: Array.isArray(input.portfolioSnapshots) ? input.portfolioSnapshots : [],
    automation: {
      lastRunAt: input.automation?.lastRunAt || null,
      lastResult: input.automation?.lastResult || "아직 자동 실행 없음",
      snapshotTime: input.automation?.snapshotTime || "09:10",
      timezone: input.automation?.timezone || "Asia/Seoul",
    },
  };
}

async function runDailySnapshotJob(trigger) {
  const state = readState();
  const now = new Date();
  const today = todayKey(now);
  const currentTime = seoulTime(now);
  const snapshotTime = state.automation?.snapshotTime || "09:10";

  if (currentTime < snapshotTime && trigger !== "manual") {
    return updateAutomationState(state, {
      ok: true,
      skipped: true,
      trigger,
      reason: `스냅샷 시간이 아직 아닙니다 (${currentTime} < ${snapshotTime})`,
    });
  }

  const refreshed = await refreshStatePrices(state);
  const snapshot = buildPortfolioSnapshot(refreshed, today);
  const accountSnapshots = buildAccountSnapshots(refreshed, today);
  const existingIndex = refreshed.portfolioSnapshots.findIndex((item) => item.date === today);

  if (existingIndex >= 0) {
    refreshed.portfolioSnapshots[existingIndex] = {
      ...refreshed.portfolioSnapshots[existingIndex],
      ...snapshot,
      id: refreshed.portfolioSnapshots[existingIndex].id,
    };
  } else {
    refreshed.portfolioSnapshots.push(snapshot);
  }
  refreshed.accountSnapshots = [
    ...(refreshed.accountSnapshots || []).filter((item) => item.date !== today),
    ...accountSnapshots,
  ].sort((a, b) => `${a.date}${a.investor}${a.account}`.localeCompare(`${b.date}${b.investor}${b.account}`));
  refreshed.portfolioSnapshots.sort((a, b) => a.date.localeCompare(b.date));

  return updateAutomationState(refreshed, {
    ok: true,
    skipped: false,
    trigger,
    date: today,
    totalValueKrw: snapshot.totalValueKrw,
    message: "가격/환율 갱신 후 일별 스냅샷 저장 완료",
  });
}

function updateAutomationState(state, result) {
  const updated = {
    ...state,
    automation: {
      ...(state.automation || {}),
      lastRunAt: new Date().toISOString(),
      lastResult: result.message || result.reason || "자동화 실행 완료",
      snapshotTime: state.automation?.snapshotTime || "09:10",
      timezone: state.automation?.timezone || "Asia/Seoul",
    },
  };
  writeState(updated);
  return { ...result, automation: updated.automation };
}

function getAutomationStatus() {
  const state = readState();
  return {
    ...(state.automation || {}),
    snapshotCount: state.portfolioSnapshots.length,
    holdingCount: state.holdings.length,
    cashBalanceCount: (state.cashBalances || []).length,
  };
}

async function refreshStatePrices(state) {
  const quoteMap = new Map();
  const priceUpdateLogs = [...(state.priceUpdateLogs || [])];
  const tickers = unique(state.holdings.filter((holding) => holding.autoPrice !== false).map((holding) => holding.ticker));

  for (const ticker of tickers) {
    try {
      quoteMap.set(ticker, await getYahooQuote(ticker));
      priceUpdateLogs.push(createPriceLog({ symbol: ticker, status: "success", price: quoteMap.get(ticker).price, source: "Yahoo Finance" }));
    } catch (error) {
      console.error(`Quote refresh failed for ${ticker}: ${error.message}`);
      priceUpdateLogs.push(createPriceLog({ symbol: ticker, status: "error", message: error.message }));
    }
  }

  let fxRate = state.fxRate;
  try {
    fxRate = await getYahooFxRate();
    priceUpdateLogs.push(createPriceLog({ symbol: "USD/KRW", status: "success", price: fxRate.rate, source: "Yahoo Finance" }));
  } catch (error) {
    console.error(`FX refresh failed: ${error.message}`);
    priceUpdateLogs.push(createPriceLog({ symbol: "USD/KRW", status: "error", message: error.message }));
  }

  return {
    ...state,
    fxRate,
    priceUpdateLogs: priceUpdateLogs.slice(-200),
    holdings: state.holdings.map((holding) => {
      const quote = quoteMap.get(holding.ticker);
      return quote
        ? {
            ...holding,
            price: quote.price,
            priceSource: quote.source,
            priceAsOf: quote.asOf,
          }
        : holding;
    }),
  };
}

function createPriceLog(log) {
  return {
    id: makeId(),
    at: new Date().toISOString(),
    ...log,
  };
}

async function getYahooQuote(ticker) {
  const data = await fetchYahooChartData(ticker);
  const meta = data?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${ticker} 가격 응답이 없습니다`);
  }
  const timestamp = Number(meta?.regularMarketTime);
  return {
    price,
    source: "Yahoo Finance",
    asOf: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
  };
}

async function getYahooFxRate() {
  const data = await fetchYahooChartData("KRW=X");
  const meta = data?.chart?.result?.[0]?.meta;
  const rate = Number(meta?.regularMarketPrice);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("USD/KRW 환율 응답이 없습니다");
  }
  const timestamp = Number(meta?.regularMarketTime);
  return {
    pair: "USD/KRW",
    rate,
    source: "Yahoo Finance",
    asOf: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
  };
}

async function fetchYahooChartData(symbol) {
  const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  yahooUrl.searchParams.set("interval", "1d");
  yahooUrl.searchParams.set("range", "1d");

  const yahooResponse = await fetch(yahooUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "stock-portfolio-lab/0.1",
    },
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
}

function buildPortfolioSnapshot(state, date) {
  const totals = getTotals(state.holdings, state.cashBalances, state.fxRate.rate);
  return {
    id: makeId(),
    date,
    totalValueUsd: totals.valueUsdEquivalent,
    totalValueKrw: totals.valueKrw,
    totalCostUsd: totals.costUsdEquivalent,
    totalGainUsd: totals.gainUsdEquivalent,
    fxRate: state.fxRate.rate,
    netInflowKrw: getNetInflowKrw(state.cashFlows, date),
  };
}

function buildAccountSnapshots(state, date) {
  return groupByAccount(state).map((item) => ({
    id: makeId(),
    date,
    investor: item.investor,
    account: item.account,
    stockValueKrw: item.stockValueKrw,
    cashKrw: item.cashKrw,
    totalAssetsKrw: item.valueKrw,
    gainKrw: item.gainKrw,
    returnRate: item.returnRate,
  }));
}

function groupByAccount(state) {
  const map = new Map();
  for (const holding of state.holdings || []) {
    const key = `${holding.investor}|||${holding.account}`;
    const current = map.get(key) || {
      investor: holding.investor,
      account: holding.account,
      stockValueKrw: 0,
      cashKrw: 0,
      costKrw: 0,
      gainKrw: 0,
    };
    const values = getHoldingValues(holding, state.fxRate.rate);
    current.stockValueKrw += values.valueKrw;
    current.costKrw += values.costKrw;
    current.gainKrw += values.valueKrw - values.costKrw;
    map.set(key, current);
  }
  for (const cash of state.cashBalances || []) {
    const key = `${cash.investor}|||${cash.account}`;
    const current = map.get(key) || {
      investor: cash.investor,
      account: cash.account,
      stockValueKrw: 0,
      cashKrw: 0,
      costKrw: 0,
      gainKrw: 0,
    };
    current.cashKrw += getCashValueKrw(cash, state.fxRate.rate);
    map.set(key, current);
  }
  return [...map.values()].map((item) => ({
    ...item,
    valueKrw: item.stockValueKrw + item.cashKrw,
    returnRate: item.costKrw ? item.gainKrw / item.costKrw : 0,
  }));
}

function getTotals(holdings, cashBalances, fxRate) {
  const values = holdings.map((holding) => getHoldingValues(holding, fxRate));
  const stockValueKrw = values.reduce((sum, item) => sum + item.valueKrw, 0);
  const cashKrw = (cashBalances || []).reduce((sum, cash) => sum + getCashValueKrw(cash, fxRate), 0);
  const valueKrw = stockValueKrw + cashKrw;
  const costKrw = values.reduce((sum, item) => sum + item.costKrw, 0);
  const gainKrw = stockValueKrw - costKrw;
  return {
    valueKrw,
    costKrw,
    gainKrw,
    valueUsdEquivalent: valueKrw / Number(fxRate || 1),
    costUsdEquivalent: costKrw / Number(fxRate || 1),
    gainUsdEquivalent: gainKrw / Number(fxRate || 1),
  };
}

function getHoldingValues(holding, fxRate) {
  const valueNative = Number(holding.quantity || 0) * Number(holding.price || 0);
  const costNative = Number(holding.quantity || 0) * Number(holding.averageCost || 0);
  const rate = holding.currency === "KRW" ? 1 : Number(fxRate || 1);
  return {
    valueKrw: valueNative * rate,
    costKrw: costNative * rate,
  };
}

function getCashValueKrw(cash, fxRate) {
  const amount = Number(cash.amount || 0);
  return cash.currency === "USD" ? amount * Number(fxRate || 1) : amount;
}

function getNetInflowKrw(cashFlows, date) {
  return (cashFlows || [])
    .filter((flow) => flow.date === date)
    .reduce((sum, flow) => sum + getExternalFlowAmount(flow), 0);
}

function getExternalFlowAmount(flow) {
  if (flow.type === "deposit") {
    return Number(flow.amountKrw || 0);
  }
  if (flow.type === "withdrawal") {
    return -Number(flow.amountKrw || 0);
  }
  return 0;
}

function deriveAccounts(state) {
  const map = new Map();
  for (const holding of state.holdings || []) {
    const key = `${holding.investor}|||${holding.account}`;
    map.set(key, {
      id: makeId(),
      investor: holding.investor,
      account: holding.account,
      provider: inferProvider(holding.account),
      accountType: holding.accountType || "brokerage",
      baseCurrency: holding.currency || "KRW",
    });
  }
  for (const cash of state.cashBalances || []) {
    const key = `${cash.investor}|||${cash.account}`;
    if (!map.has(key)) {
      map.set(key, {
        id: makeId(),
        investor: cash.investor,
        account: cash.account,
        provider: inferProvider(cash.account),
        accountType: "cash",
        baseCurrency: cash.currency || "KRW",
      });
    }
  }
  return [...map.values()].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
}

function inferProvider(accountName = "") {
  return String(accountName).split(" ")[0] || "";
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 2_000_000) {
      throw new Error("Request body too large");
    }
  }
  return JSON.parse(body || "{}");
}

async function serveStatic(pathname, response) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const absolutePath = normalize(join(rootDir, cleanPath));
  if (!absolutePath.startsWith(rootDir)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  let fileStat;
  try {
    fileStat = await stat(absolutePath);
  } catch {
    sendJson(response, 404, { error: "Not found" });
    return;
  }
  if (!fileStat.isFile()) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  response.writeHead(200, {
    "content-type": mimeTypes[extname(absolutePath)] || "application/octet-stream",
  });
  createReadStream(absolutePath).pipe(response);
}

async function sendImportSummary(response) {
  try {
    const content = await readFile(importSummaryPath, "utf8");
    sendJson(response, 200, JSON.parse(content));
  } catch {
    sendJson(response, 404, { error: "Import summary not found" });
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function createSeedState() {
  return {
    version: 6,
    fxRate: {
      pair: "USD/KRW",
      rate: 1350,
      source: "샘플 환율",
      asOf: "샘플",
    },
    holdings: [
      createHolding("투자자 A", "연금 계좌", "pension", "QQQ", "QQQ", "Invesco QQQ Trust", 18, 408.25, 430.15),
      createHolding("투자자 A", "일반 계좌", "brokerage", "성장주", "MSFT", "Microsoft", 12, 375.4, 414.92),
      createHolding("투자자 B", "일반 계좌", "brokerage", "성장주", "NVDA", "NVIDIA", 20, 104.5, 128.4),
      createHolding("투자자 B", "코어 계좌", "brokerage", "S&P500", "VOO", "Vanguard S&P 500 ETF", 10, 465.2, 510.75),
      createHolding("투자자 A", "전술 계좌", "brokerage", "S&P500", "SSO", "ProShares Ultra S&P500", 35, 58.4, 64.1),
    ],
    cashFlows: [
      createCashFlow("2026-05-10", "투자자 A", "연금 계좌", "deposit", 1200000, "월 납입"),
      createCashFlow("2026-05-12", "투자자 B", "일반 계좌", "deposit", 800000, "추가입금"),
    ],
    cashBalances: [],
    accounts: [],
    dashboardLayout: createDefaultDashboardLayout(),
    accountSnapshots: [],
    priceUpdateLogs: [],
    portfolioSnapshots: [
      createSnapshot("2026-05-10", 24850, 33547500, 23400, 1450, 1350, 1200000),
      createSnapshot("2026-05-11", 25140, 33939000, 23400, 1740, 1350, 0),
      createSnapshot("2026-05-12", 26010, 35113500, 23990, 2020, 1350, 800000),
      createSnapshot("2026-05-13", 25920, 34992000, 23990, 1930, 1350, 0),
      createSnapshot("2026-05-14", 26420, 35667000, 23990, 2430, 1350, 0),
    ],
    automation: {
      lastRunAt: null,
      lastResult: "아직 자동 실행 없음",
      snapshotTime: "09:10",
      timezone: "Asia/Seoul",
    },
  };
}

function createDefaultDashboardLayout() {
  return [
    { id: "total-value", span: 3, minHeight: 128, visible: true },
    { id: "total-cost", span: 3, minHeight: 128, visible: true },
    { id: "total-gain", span: 3, minHeight: 128, visible: true },
    { id: "cash-total", span: 3, minHeight: 128, visible: true },
    { id: "fx-rate", span: 3, minHeight: 128, visible: true },
    { id: "allocation", span: 6, minHeight: 320, visible: true },
    { id: "performance-flow", span: 6, minHeight: 320, visible: true },
    { id: "breakdown", span: 6, minHeight: 320, visible: true },
  ];
}

function normalizeDashboardLayout(layout) {
  const defaults = createDefaultDashboardLayout();
  const defaultById = new Map(defaults.map((item) => [item.id, item]));
  const sizeToSpan = { small: 3, medium: 4, wide: 6, full: 12 };
  const seen = new Set();
  const normalized = [];
  for (const item of Array.isArray(layout) ? layout : []) {
    if (!item || !defaultById.has(item.id) || seen.has(item.id)) {
      continue;
    }
    const fallback = defaultById.get(item.id);
    normalized.push({
      id: item.id,
      span: clamp(Math.round(Number(item.span ?? sizeToSpan[item.size] ?? fallback.span)), 2, 12),
      minHeight: clamp(Math.round(Number(item.minHeight ?? fallback.minHeight)), 112, 720),
      visible: item.visible !== false,
    });
    seen.add(item.id);
  }
  for (const fallback of defaults) {
    if (!seen.has(fallback.id)) {
      normalized.push(fallback);
    }
  }
  return normalized;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createHolding(investor, account, accountType, strategy, ticker, name, quantity, averageCost, price) {
  return {
    id: makeId(),
    investor,
    account,
    accountType,
    strategy,
    ticker,
    name,
    quantity,
    averageCost,
    price,
    currency: "USD",
    priceSource: "샘플",
    priceAsOf: "샘플",
  };
}

function createCashFlow(date, investor, account, type, amountKrw, note) {
  return {
    id: makeId(),
    date,
    investor,
    account,
    type,
    amountKrw,
    note,
  };
}

function createSnapshot(date, totalValueUsd, totalValueKrw, totalCostUsd, totalGainUsd, fxRate, netInflowKrw) {
  return {
    id: makeId(),
    date,
    totalValueUsd,
    totalValueKrw,
    totalCostUsd,
    totalGainUsd,
    fxRate,
    netInflowKrw,
  };
}

function todayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

function seoulTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  return `${part(parts, "hour")}:${part(parts, "minute")}`;
}

function part(parts, type) {
  return parts.find((item) => item.type === type)?.value || "";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function makeId() {
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
