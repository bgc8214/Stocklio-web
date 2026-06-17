import { DATA_VERSION, defaultDashboardLayout } from "./constants.js";

export function createEmptyState() {
  return {
    version: DATA_VERSION,
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
    dashboardLayout: structuredClone(defaultDashboardLayout),
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
    version: DATA_VERSION,
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
      { id: makeId(), investor: "Alpha", account: "ISA 계좌", accountType: "isa", strategy: "인덱스", ticker: "SPY", name: "SPDR S&P 500 ETF", quantity: 10, averageCost: 480.0, price: 510.0, priceChange: 2.1, priceChangePercent: 0.0041, currency: "USD", priceSource: "샘플", priceAsOf: "샘플" },
      { id: makeId(), investor: "Alpha", account: "ISA 계좌", accountType: "isa", strategy: "인덱스", ticker: "QQQ", name: "Invesco QQQ Trust", quantity: 10, averageCost: 420.0, price: 445.0, priceChange: 1.8, priceChangePercent: 0.0041, currency: "USD", priceSource: "샘플", priceAsOf: "샘플" },
      { id: makeId(), investor: "Alpha", account: "연금 계좌", accountType: "pension", strategy: "배당", ticker: "SCHD", name: "Schwab US Dividend Equity ETF", quantity: 20, averageCost: 76.0, price: 82.0, priceChange: 0.5, priceChangePercent: 0.0061, currency: "USD", priceSource: "샘플", priceAsOf: "샘플" },
      // 투자자 Beta — 개별 종목
      { id: makeId(), investor: "Beta", account: "해외주식 계좌", accountType: "brokerage", strategy: "성장", ticker: "AAPL", name: "Apple", quantity: 15, averageCost: 170.0, price: 195.0, priceChange: -1.2, priceChangePercent: -0.0061, currency: "USD", priceSource: "샘플", priceAsOf: "샘플" },
      { id: makeId(), investor: "Beta", account: "해외주식 계좌", accountType: "brokerage", strategy: "성장", ticker: "MSFT", name: "Microsoft", quantity: 10, averageCost: 380.0, price: 415.0, priceChange: 3.5, priceChangePercent: 0.0085, currency: "USD", priceSource: "샘플", priceAsOf: "샘플" },
      { id: makeId(), investor: "Beta", account: "해외주식 계좌", accountType: "brokerage", strategy: "성장", ticker: "GOOGL", name: "Alphabet", quantity: 12, averageCost: 155.0, price: 175.0, priceChange: 1.1, priceChangePercent: 0.0063, currency: "USD", priceSource: "샘플", priceAsOf: "샘플" },
      // 투자자 Gamma — 국내 + 혼합
      { id: makeId(), investor: "Gamma", account: "국내주식 계좌", accountType: "brokerage", strategy: "인덱스", ticker: "069500", name: "KODEX 200", quantity: 50, averageCost: 32000, price: 34500, priceChange: 200, priceChangePercent: 0.0058, currency: "KRW", priceSource: "샘플", priceAsOf: "샘플" },
      { id: makeId(), investor: "Gamma", account: "국내주식 계좌", accountType: "brokerage", strategy: "배당", ticker: "361580", name: "TIGER 미국배당다우존스", quantity: 40, averageCost: 11500, price: 12200, priceChange: 80, priceChangePercent: 0.0066, currency: "KRW", priceSource: "샘플", priceAsOf: "샘플" },
      { id: makeId(), investor: "Gamma", account: "연금 계좌", accountType: "pension", strategy: "인덱스", ticker: "379800", name: "KODEX 미국S&P500TR", quantity: 30, averageCost: 15800, price: 17200, priceChange: 120, priceChangePercent: 0.0070, currency: "KRW", priceSource: "샘플", priceAsOf: "샘플" },
    ],
    cashFlows: [
      { id: makeId(), date: "2026-04-01", investor: "Alpha", account: "ISA 계좌", type: "deposit", amountKrw: 1000000, note: "월 납입" },
      { id: makeId(), date: "2026-04-01", investor: "Beta", account: "해외주식 계좌", type: "deposit", amountKrw: 1000000, note: "월 납입" },
      { id: makeId(), date: "2026-04-01", investor: "Gamma", account: "국내주식 계좌", type: "deposit", amountKrw: 1000000, note: "월 납입" },
      { id: makeId(), date: "2026-05-01", investor: "Alpha", account: "ISA 계좌", type: "deposit", amountKrw: 1000000, note: "월 납입" },
      { id: makeId(), date: "2026-05-01", investor: "Beta", account: "해외주식 계좌", type: "deposit", amountKrw: 1000000, note: "월 납입" },
      { id: makeId(), date: "2026-05-01", investor: "Gamma", account: "국내주식 계좌", type: "deposit", amountKrw: 1000000, note: "월 납입" },
    ],
    cashBalances: [
      { id: makeId(), investor: "Alpha", account: "ISA 계좌", currency: "USD", amount: 500, source: "샘플" },
      { id: makeId(), investor: "Beta", account: "해외주식 계좌", currency: "USD", amount: 500, source: "샘플" },
      { id: makeId(), investor: "Gamma", account: "국내주식 계좌", currency: "KRW", amount: 500000, source: "샘플" },
    ],
    accounts: [],
    dashboardLayout: structuredClone(defaultDashboardLayout),
    accountSnapshots: [],
    priceUpdateLogs: [],
    lastPriceRefreshImpact: null,
    portfolioSnapshots: [
      { id: makeId(), date: "2026-04-07", totalValueUsd: 28000, totalValueKrw: 38640000, totalCostUsd: 27000, totalGainUsd: 1000, fxRate: 1380, netInflowKrw: 3000000 },
      { id: makeId(), date: "2026-04-14", totalValueUsd: 28400, totalValueKrw: 39192000, totalCostUsd: 27000, totalGainUsd: 1400, fxRate: 1380, netInflowKrw: 0 },
      { id: makeId(), date: "2026-04-21", totalValueUsd: 29100, totalValueKrw: 40158000, totalCostUsd: 27000, totalGainUsd: 2100, fxRate: 1380, netInflowKrw: 0 },
      { id: makeId(), date: "2026-04-28", totalValueUsd: 28800, totalValueKrw: 39744000, totalCostUsd: 27000, totalGainUsd: 1800, fxRate: 1380, netInflowKrw: 0 },
      { id: makeId(), date: "2026-05-06", totalValueUsd: 30000, totalValueKrw: 41400000, totalCostUsd: 30000, totalGainUsd: 0, fxRate: 1380, netInflowKrw: 3000000 },
      { id: makeId(), date: "2026-05-13", totalValueUsd: 30800, totalValueKrw: 42504000, totalCostUsd: 30000, totalGainUsd: 800, fxRate: 1380, netInflowKrw: 0 },
      { id: makeId(), date: "2026-05-20", totalValueUsd: 31500, totalValueKrw: 43470000, totalCostUsd: 30000, totalGainUsd: 1500, fxRate: 1380, netInflowKrw: 0 },
    ],
    automation: {
      lastRunAt: null,
      lastResult: "아직 자동 실행 없음",
      snapshotTime: "09:10",
      timezone: "Asia/Seoul",
    },
  };
}
