export const STATE_VERSION = 6;

export const DEFAULT_DASHBOARD_LAYOUT = [
  { id: "total-value", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-cost", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-gain", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "cash-total", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "fx-rate", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "allocation", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "performance-flow", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "breakdown", widthPct: 50, span: 6, minHeight: 320, visible: true },
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
  const rate = holding.currency === "KRW" ? 1 : Number(fxRate || 1);
  return {
    valueNative,
    costNative,
    valueKrw: valueNative * rate,
    costKrw: costNative * rate,
    gainKrw: (valueNative - costNative) * rate,
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
    if (Number(holding.quantity || 0) < 0) {
      issues.push(`holding ${holding.id} quantity cannot be negative`);
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
  return `generated-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
