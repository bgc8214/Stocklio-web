import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  buildAccountSnapshots as buildAccountSnapshotsCore,
  buildPortfolioSnapshot as buildPortfolioSnapshotCore,
  getNetInflowKrw,
  groupByAccount as groupByAccountCore,
  normalizeDashboardLayout,
  validateStateShape,
} from "./src/domain/portfolio-core.js";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const dataDir = join(rootDir, "data");
const privateDataDir = join(dataDir, "private");
const dbPath = join(dataDir, "portfolio.db");
const importSummaryPath = join(privateDataDir, "migration-summary.json");
const importPreviewStatePath = join(privateDataDir, "import-preview-state.json");
const stateKey = "default";
const automationIntervalMs = 15 * 60 * 1000;
const execFileAsync = promisify(execFile);
const pythonBin = process.env.PYTHON_BIN || "/Users/boss.back/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

await mkdir(privateDataDir, { recursive: true });
const db = new DatabaseSync(dbPath);
initializeDb();

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (url.pathname === "/api/state" && request.method === "GET") {
      sendJson(response, 200, readState());
      return;
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      sendJson(response, 200, getHealthStatus());
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

    if (url.pathname === "/api/import/preview" && request.method === "POST") {
      await previewImport(request, response);
      return;
    }

    if (url.pathname === "/api/import/commit" && request.method === "POST") {
      await commitImportPreview(response);
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
}).listen(port, host, () => {
  console.log(`Stock Portfolio Lab running at http://${host}:${port}`);
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
  const normalized = {
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
  const issues = validateStateShape(normalized);
  return {
    ...normalized,
    diagnostics: {
      ...(input.diagnostics || {}),
      stateIssues: issues,
      checkedAt: new Date().toISOString(),
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

function getHealthStatus() {
  const state = readState();
  const issues = validateStateShape(state);
  return {
    ok: issues.length === 0,
    version: state.version,
    stateIssues: issues,
    holdingCount: state.holdings.length,
    cashBalanceCount: (state.cashBalances || []).length,
    snapshotCount: state.portfolioSnapshots.length,
    lastAutomationRunAt: state.automation?.lastRunAt || null,
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
  return buildPortfolioSnapshotCore(state, date, makeId);
}

function buildAccountSnapshots(state, date) {
  return buildAccountSnapshotsCore(state, date, makeId);
}

function groupByAccount(state) {
  return groupByAccountCore(state);
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

async function readBinaryBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 30_000_000) {
      throw new Error("Import file is too large");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
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

async function previewImport(request, response) {
  const contentType = request.headers["content-type"] || "";
  if (!contentType.includes("spreadsheet") && !contentType.includes("octet-stream")) {
    sendJson(response, 415, { error: "XLSX 파일만 업로드할 수 있습니다" });
    return;
  }
  const uploadPath = join(privateDataDir, `import-preview-${Date.now()}.xlsx`);
  await writeFile(uploadPath, await readBinaryBody(request));
  const { stdout, stderr } = await execFileAsync(pythonBin, [
    "scripts/migrate_numbers.py",
    "--xlsx",
    uploadPath,
    "--preview",
  ], {
    cwd: rootDir,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (stderr.trim()) {
    console.warn(stderr.trim());
  }
  const preview = JSON.parse(stdout);
  const normalized = normalizeState(preview.state);
  await writeFile(importPreviewStatePath, JSON.stringify(normalized, null, 2), "utf8");
  await writeFile(importSummaryPath, JSON.stringify(preview.summary, null, 2), "utf8");
  sendJson(response, 200, {
    summary: preview.summary,
    preview: {
      holdings: normalized.holdings.length,
      snapshots: normalized.portfolioSnapshots.length,
      cashBalances: normalized.cashBalances.length,
      accounts: normalized.accounts.length,
      firstHoldingNames: normalized.holdings.slice(0, 5).map((holding) => holding.name || holding.ticker),
    },
  });
}

async function commitImportPreview(response) {
  const content = await readFile(importPreviewStatePath, "utf8");
  const nextState = normalizeState(JSON.parse(content));
  writeState(nextState);
  sendJson(response, 200, {
    ok: true,
    savedAt: new Date().toISOString(),
    holdings: nextState.holdings.length,
    snapshots: nextState.portfolioSnapshots.length,
    cashBalances: nextState.cashBalances.length,
  });
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
  return DEFAULT_DASHBOARD_LAYOUT.map((item) => ({ ...item }));
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
