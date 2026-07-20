import { DEFAULT_DASHBOARD_LAYOUT, STATE_VERSION } from "./portfolio-core.js";

export function createEmptyState() {
  return {
    version: STATE_VERSION,
    fxRate: {
      pair: "USD/KRW",
      rate: 1350,
      previousClose: 1350,
      change: 0,
      changePercent: 0,
      source: "기본 환율",
      asOf: "가격 업데이트 전",
    },
    holdings: [],
    cashFlows: [],
    cashBalances: [],
    accounts: [],
    dashboardLayout: DEFAULT_DASHBOARD_LAYOUT.map((item) => ({ ...item })),
    accountSnapshots: [],
    priceUpdateLogs: [],
    lastPriceRefreshImpact: null,
    portfolioSnapshots: [],
    automation: {
      lastRunAt: null,
      lastResult: "아직 자동 실행 없음",
      snapshotTime: "09:10",
      timezone: "Asia/Seoul",
    },
  };
}

export function createSampleState(makeId) {
  return {
    version: STATE_VERSION,
    fxRate: {
      pair: "USD/KRW",
      rate: 1380,
      previousClose: 1375,
      change: 5,
      changePercent: 0.0036,
      source: "샘플 환율",
      asOf: "샘플",
    },
    holdings: [
      // 투자자 Alpha — 연금/ISA
      createSampleHolding(makeId, "Alpha", "ISA 계좌", "isa", "인덱스", "SPY", "SPDR S&P 500 ETF", 10, 480.0, 510.0, 2.1, 0.0041, "USD"),
      createSampleHolding(makeId, "Alpha", "ISA 계좌", "isa", "인덱스", "QQQ", "Invesco QQQ Trust", 10, 420.0, 445.0, 1.8, 0.0041, "USD"),
      createSampleHolding(makeId, "Alpha", "연금 계좌", "pension", "배당", "SCHD", "Schwab US Dividend Equity ETF", 20, 76.0, 82.0, 0.5, 0.0061, "USD"),
      // 투자자 Beta — 개별 종목
      createSampleHolding(makeId, "Beta", "해외주식 계좌", "brokerage", "성장", "AAPL", "Apple", 15, 170.0, 195.0, -1.2, -0.0061, "USD"),
      createSampleHolding(makeId, "Beta", "해외주식 계좌", "brokerage", "성장", "MSFT", "Microsoft", 10, 380.0, 415.0, 3.5, 0.0085, "USD"),
      createSampleHolding(makeId, "Beta", "해외주식 계좌", "brokerage", "성장", "GOOGL", "Alphabet", 12, 155.0, 175.0, 1.1, 0.0063, "USD"),
      // 투자자 Gamma — 국내 + 혼합
      createSampleHolding(makeId, "Gamma", "국내주식 계좌", "brokerage", "인덱스", "069500", "KODEX 200", 50, 32000, 34500, 200, 0.0058, "KRW"),
      createSampleHolding(makeId, "Gamma", "국내주식 계좌", "brokerage", "배당", "361580", "TIGER 미국배당다우존스", 40, 11500, 12200, 80, 0.0066, "KRW"),
      createSampleHolding(makeId, "Gamma", "연금 계좌", "pension", "인덱스", "379800", "KODEX 미국S&P500TR", 30, 15800, 17200, 120, 0.0070, "KRW"),
    ],
    cashFlows: [
      createSampleCashFlow(makeId, "2026-04-01", "Alpha", "ISA 계좌", "deposit", 1000000, "월 납입"),
      createSampleCashFlow(makeId, "2026-04-01", "Beta", "해외주식 계좌", "deposit", 1000000, "월 납입"),
      createSampleCashFlow(makeId, "2026-04-01", "Gamma", "국내주식 계좌", "deposit", 1000000, "월 납입"),
      createSampleCashFlow(makeId, "2026-05-01", "Alpha", "ISA 계좌", "deposit", 1000000, "월 납입"),
      createSampleCashFlow(makeId, "2026-05-01", "Beta", "해외주식 계좌", "deposit", 1000000, "월 납입"),
      createSampleCashFlow(makeId, "2026-05-01", "Gamma", "국내주식 계좌", "deposit", 1000000, "월 납입"),
    ],
    cashBalances: [
      { id: makeId(), investor: "Alpha", account: "ISA 계좌", currency: "USD", amount: 500, source: "샘플" },
      { id: makeId(), investor: "Beta", account: "해외주식 계좌", currency: "USD", amount: 500, source: "샘플" },
      { id: makeId(), investor: "Gamma", account: "국내주식 계좌", currency: "KRW", amount: 500000, source: "샘플" },
    ],
    accounts: [],
    dashboardLayout: DEFAULT_DASHBOARD_LAYOUT.map((item) => ({ ...item })),
    accountSnapshots: [],
    priceUpdateLogs: [],
    lastPriceRefreshImpact: null,
    portfolioSnapshots: [
      createSampleSnapshot(makeId, "2026-04-07", 28000, 38640000, 27000, 1000, 1380, 3000000),
      createSampleSnapshot(makeId, "2026-04-14", 28400, 39192000, 27000, 1400, 1380, 0),
      createSampleSnapshot(makeId, "2026-04-21", 29100, 40158000, 27000, 2100, 1380, 0),
      createSampleSnapshot(makeId, "2026-04-28", 28800, 39744000, 27000, 1800, 1380, 0),
      createSampleSnapshot(makeId, "2026-05-06", 30000, 41400000, 30000, 0, 1380, 3000000),
      createSampleSnapshot(makeId, "2026-05-13", 30800, 42504000, 30000, 800, 1380, 0),
      createSampleSnapshot(makeId, "2026-05-20", 31500, 43470000, 30000, 1500, 1380, 0),
    ],
    automation: {
      lastRunAt: null,
      lastResult: "아직 자동 실행 없음",
      snapshotTime: "09:10",
      timezone: "Asia/Seoul",
    },
  };
}

function createSampleHolding(makeId, investor, account, accountType, strategy, ticker, name, quantity, averageCost, price, priceChange, priceChangePercent, currency) {
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
    priceChange,
    priceChangePercent,
    currency,
    priceSource: "샘플",
    priceAsOf: "샘플",
  };
}

function createSampleCashFlow(makeId, date, investor, account, type, amountKrw, note) {
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

function createSampleSnapshot(makeId, date, totalValueUsd, totalValueKrw, totalCostUsd, totalGainUsd, fxRate, netInflowKrw) {
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
