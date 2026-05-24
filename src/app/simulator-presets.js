export const SIMULATOR_SYMBOLS = [
  { symbol: "QQQ",       label: "QQQ (나스닥100 ETF)",    currency: "USD" },
  { symbol: "TQQQ",      label: "TQQQ (나스닥100 3x)",    currency: "USD" },
  { symbol: "VOO",       label: "VOO (S&P500 ETF)",        currency: "USD" },
  { symbol: "SPY",       label: "SPY (S&P500 ETF)",        currency: "USD" },
  { symbol: "SCHD",      label: "SCHD (배당 ETF)",         currency: "USD" },
  { symbol: "AAPL",      label: "AAPL (애플)",             currency: "USD" },
  { symbol: "TSLA",      label: "TSLA (테슬라)",           currency: "USD" },
  { symbol: "NVDA",      label: "NVDA (엔비디아)",         currency: "USD" },
  { symbol: "MSFT",      label: "MSFT (마이크로소프트)",   currency: "USD" },
  { symbol: "005930.KS", label: "005930.KS (삼성전자)",    currency: "KRW" },
];

// 시나리오 탭 — 종목은 폼 안에서 선택
export const SIMULATOR_PRESETS = [
  {
    id: "lumpsum",
    label: "일시 투자",
    type: "lumpsum",
    symbol: "QQQ",
    investAmount: 10_000_000,
    start: tenYearsAgo(),
    end: today(),
  },
  {
    id: "dca",
    label: "적립식",
    type: "dca",
    symbol: "VOO",
    monthlyAmount: 500_000,
    start: yearsAgo(20),
    end: today(),
    frequency: "monthly",
  },
  {
    id: "multi",
    label: "종목 비교",
    type: "multi",
    symbols: ["QQQ", "TQQQ"],
    investAmount: 10_000_000,
    start: tenYearsAgo(),
    end: today(),
  },
  {
    id: "lumpsum_vs_dca",
    label: "몰빵 vs 적립식",
    type: "lumpsum_vs_dca",
    symbol: "QQQ",
    investAmount: 10_000_000,
    start: tenYearsAgo(),
    end: today(),
    frequency: "monthly",
  },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function yearsAgo(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}

function tenYearsAgo() {
  return yearsAgo(10);
}
