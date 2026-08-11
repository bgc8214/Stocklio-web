export const STATE_VERSION = 6;

export const DEFAULT_DASHBOARD_LAYOUT = [
  { id: "total-value", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-cost", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-gain", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "cash-total", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "allocation", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "breakdown", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "performance-flow", widthPct: 100, span: 12, minHeight: 360, visible: true },
];

export function normalizeDashboardLayout(layout) {
  const defaults = new Map(DEFAULT_DASHBOARD_LAYOUT.map((item) => [item.id, item]));
  const sizeToSpan = { small: 3, medium: 4, wide: 6, full: 12 };
  const seen = new Set();
  const normalized = [];
  for (const item of Array.isArray(layout) ? layout : []) {
    if (!item || !defaults.has(item.id) || seen.has(item.id)) {
      continue;
    }
    const fallback = defaults.get(item.id);
    // breakdown 카드가 예전 기본값(전체폭)으로 저장돼 있으면 새 기본값(자산 비중과 나란히)으로 마이그레이션한다.
    if (item.id === "breakdown" && Number(item.span) === 12 && Number(item.widthPct) === 100) {
      normalized.push({ ...fallback });
      seen.add(item.id);
      continue;
    }
    const span = clamp(Math.round(Number(item.span ?? sizeToSpan[item.size] ?? fallback.span)), 2, 12);
    normalized.push({
      id: item.id,
      widthPct: clamp(Math.round(Number(item.widthPct ?? fallback.widthPct ?? (span / 12) * 100) * 10) / 10, 18, 100),
      span,
      minHeight: clamp(Math.round(Number(item.minHeight ?? fallback.minHeight)), 112, 720),
      visible: item.visible !== false,
    });
    seen.add(item.id);
  }
  for (const fallback of DEFAULT_DASHBOARD_LAYOUT) {
    if (!seen.has(fallback.id)) {
      normalized.push({ ...fallback });
    }
  }
  return normalized;
}

export function getTotals({ holdings = [], cashBalances = [], fxRate = 1 }) {
  const values = holdings.map((holding) => getHoldingValues(holding, fxRate));
  const stockValueKrw = values.reduce((sum, item) => sum + item.valueKrw, 0);
  const cashKrw = cashBalances.reduce((sum, cash) => sum + getCashValueKrw(cash, fxRate), 0);
  const valueKrw = stockValueKrw + cashKrw;
  const costKrw = values.reduce((sum, item) => sum + item.costKrw, 0);
  const gainKrw = stockValueKrw - costKrw;
  const rate = Number(fxRate || 1);
  return {
    valueKrw,
    stockValueKrw,
    cashKrw,
    costKrw,
    gainKrw,
    returnRate: costKrw ? gainKrw / costKrw : 0,
    valueUsdEquivalent: valueKrw / rate,
    costUsdEquivalent: costKrw / rate,
    gainUsdEquivalent: gainKrw / rate,
  };
}

export function getHoldingValues(holding, fxRate = 1) {
  const valueNative = Number(holding.quantity || 0) * Number(holding.price || 0);
  const costNative = Number(holding.quantity || 0) * Number(holding.averageCost || 0);
  const gainNative = valueNative - costNative;
  const rate = holding.currency === "KRW" ? 1 : Number(fxRate || 1);
  return {
    valueNative,
    costNative,
    gainNative,
    valueKrw: valueNative * rate,
    costKrw: costNative * rate,
    gainKrw: gainNative * rate,
    valueUsdEquivalent: holding.currency === "USD" ? valueNative : valueNative / Number(fxRate || 1),
    costUsdEquivalent: holding.currency === "USD" ? costNative : costNative / Number(fxRate || 1),
    gainUsdEquivalent: holding.currency === "USD" ? gainNative : gainNative / Number(fxRate || 1),
  };
}

export function getCashValueKrw(cash, fxRate = 1) {
  const amount = Number(cash.amount || 0);
  return cash.currency === "USD" ? amount * Number(fxRate || 1) : amount;
}

export function groupByAccount(state) {
  const fxRate = Number(state.fxRate?.rate || state.fxRate || 1);
  const map = new Map();
  for (const holding of state.holdings || []) {
    const key = `${holding.investor}|||${holding.account}`;
    const current = map.get(key) || createAccountAggregate(holding);
    const values = getHoldingValues(holding, fxRate);
    current.stockValueKrw += values.valueKrw;
    current.costKrw += values.costKrw;
    current.gainKrw += values.gainKrw;
    map.set(key, current);
  }
  for (const cash of state.cashBalances || []) {
    const key = `${cash.investor}|||${cash.account}`;
    const current = map.get(key) || createAccountAggregate(cash);
    current.cashKrw += getCashValueKrw(cash, fxRate);
    map.set(key, current);
  }
  return [...map.values()]
    .map((item) => ({
      ...item,
      valueKrw: item.stockValueKrw + item.cashKrw,
      valueUsd: (item.stockValueKrw + item.cashKrw) / fxRate,
      costUsd: item.costKrw / fxRate,
      gain: item.gainKrw,
      returnRate: item.costKrw ? item.gainKrw / item.costKrw : 0,
    }))
    .sort((a, b) => b.valueKrw - a.valueKrw);
}

export function getNetInflowKrw(cashFlows = [], date) {
  return cashFlows
    .filter((flow) => flow.date === date)
    .reduce((sum, flow) => sum + getExternalFlowAmount(flow), 0);
}

export function getExternalFlowAmount(flow) {
  if (flow.type === "deposit") {
    return Number(flow.amountKrw || 0);
  }
  if (flow.type === "withdrawal") {
    return -Number(flow.amountKrw || 0);
  }
  return 0;
}

// Yahoo chart(events=div) 응답에서 최근 12개월 배당 합계 = 주당 연배당(TTM)을 뽑는다.
export function parseTtmDividendPerShare(chartPayload, nowMs = Date.now()) {
  const result = chartPayload?.chart?.result?.[0];
  const currency = result?.meta?.currency || "USD";
  const events = result?.events?.dividends;
  if (!events || typeof events !== "object") {
    return { perShare: 0, currency, count: 0, lastDate: null };
  }
  const cutoffSec = nowMs / 1000 - 372 * 24 * 3600; // 약 12개월(윤달·주말 여유 포함)
  let sum = 0;
  let count = 0;
  let lastSec = 0;
  for (const key of Object.keys(events)) {
    const ev = events[key];
    const amount = Number(ev?.amount);
    const ts = Number(ev?.date ?? key);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (Number.isFinite(ts) && ts < cutoffSec) continue;
    sum += amount;
    count += 1;
    if (ts > lastSec) lastSec = ts;
  }
  return {
    perShare: sum,
    currency,
    count,
    lastDate: lastSec ? new Date(lastSec * 1000).toISOString().slice(0, 10) : null,
  };
}

// 보유 종목 × 주당 연배당(TTM) → 예상 배당(원통화·KRW 환산·수익률) 및 포트폴리오 합계.
// dividendByTicker: { [ticker]: { perShare, currency, count } }
export function projectPortfolioDividends(holdings = [], dividendByTicker = {}, fxRate = 1) {
  const fx = Number(fxRate || 1);
  const rows = [];
  for (const h of holdings) {
    const info = dividendByTicker[h.ticker];
    const perShare = Number(info?.perShare || 0);
    const quantity = Number(h.quantity || 0);
    if (perShare <= 0 || quantity <= 0) continue;
    const currency = info?.currency || h.currency || "KRW";
    const annualNative = perShare * quantity;
    const annualKrw = currency === "USD" ? annualNative * fx : annualNative;
    const valueNative = Number(h.price || 0) * quantity;
    const yieldRatio = valueNative > 0 ? annualNative / valueNative : 0; // 비율(0.03 = 3%)
    rows.push({
      ticker: h.ticker,
      name: h.name,
      account: h.account,
      investor: h.investor,
      currency,
      perShare,
      quantity,
      annualNative,
      annualKrw,
      yieldRatio,
      payoutsPerYear: Number(info?.count || 0),
    });
  }
  rows.sort((a, b) => b.annualKrw - a.annualKrw);
  const annualKrw = rows.reduce((sum, r) => sum + r.annualKrw, 0);
  const equityValueKrw = getTotals({ holdings, cashBalances: [], fxRate: fx }).valueKrw;
  return {
    rows,
    annualKrw,
    monthlyAvgKrw: annualKrw / 12,
    portfolioYieldRatio: equityValueKrw > 0 ? annualKrw / equityValueKrw : 0,
    payingCount: rows.length,
  };
}

export function buildPortfolioSnapshot(state, date, makeId = defaultId) {
  const fxRate = Number(state.fxRate?.rate || 1);
  const totals = getTotals({ holdings: state.holdings, cashBalances: state.cashBalances, fxRate });
  return {
    id: makeId(),
    date,
    totalValueUsd: totals.valueUsdEquivalent,
    totalValueKrw: totals.valueKrw,
    totalCostUsd: totals.costUsdEquivalent,
    totalGainUsd: totals.gainUsdEquivalent,
    fxRate,
    netInflowKrw: getNetInflowKrw(state.cashFlows, date),
  };
}

export function buildAccountSnapshots(state, date, makeId = defaultId) {
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

export function validateStateShape(state) {
  const issues = [];
  if (!state || typeof state !== "object") {
    return ["state must be an object"];
  }
  for (const key of ["holdings", "cashFlows", "cashBalances", "portfolioSnapshots"]) {
    if (!Array.isArray(state[key])) {
      issues.push(`${key} must be an array`);
    }
  }
  if (!state.fxRate || !Number.isFinite(Number(state.fxRate.rate))) {
    issues.push("fxRate.rate must be numeric");
  }
  for (const holding of state.holdings || []) {
    if (!holding.id || !holding.investor || !holding.account || !holding.ticker) {
      issues.push(`holding ${holding.id || "(missing id)"} is missing required identity fields`);
    }
    if (!Number.isFinite(Number(holding.quantity))) {
      issues.push(`holding ${holding.id} quantity must be a finite number`);
    } else if (Number(holding.quantity) < 0) {
      issues.push(`holding ${holding.id} quantity cannot be negative`);
    }
    if (holding.price != null && !Number.isFinite(Number(holding.price))) {
      issues.push(`holding ${holding.id} price must be a finite number`);
    }
    if (holding.averageCost != null && !Number.isFinite(Number(holding.averageCost))) {
      issues.push(`holding ${holding.id} averageCost must be a finite number`);
    }
    if (holding.currency && holding.currency !== "KRW" && holding.currency !== "USD") {
      issues.push(`holding ${holding.id} currency "${holding.currency}" is not supported (KRW or USD only)`);
    }
  }
  for (const cash of state.cashBalances || []) {
    if (cash.amount != null && !Number.isFinite(Number(cash.amount))) {
      issues.push(`cash balance ${cash.id || "(missing id)"} amount must be a finite number`);
    }
    if (cash.currency && cash.currency !== "KRW" && cash.currency !== "USD") {
      issues.push(`cash balance ${cash.id || "(missing id)"} currency "${cash.currency}" is not supported (KRW or USD only)`);
    }
  }
  for (const flow of state.cashFlows || []) {
    if (flow.amountKrw != null && !Number.isFinite(Number(flow.amountKrw))) {
      issues.push(`cash flow ${flow.id || "(missing id)"} amountKrw must be a finite number`);
    }
  }
  return issues;
}

function createAccountAggregate(source) {
  return {
    investor: source.investor,
    account: source.account,
    stockValueKrw: 0,
    cashKrw: 0,
    costKrw: 0,
    gainKrw: 0,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function defaultId() {
  return crypto.randomUUID();
}
