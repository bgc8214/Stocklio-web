import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAccountSnapshots,
  buildPortfolioSnapshot,
  getExternalFlowAmount,
  getTotals,
  groupByAccount,
  normalizeDashboardLayout,
  validateStateShape,
} from "../src/domain/portfolio-core.js";
import {
  calcMaxDrawdown,
  findNextTradingDate,
  normalizePriceRows,
  simulateDCA,
  simulateLumpSum,
  simulateLumpSumVsDCA,
  simulateMultiSymbol,
} from "../src/domain/simulator-core.js";
import { buildDailyDigest, shouldSendDailyDigest } from "../src/domain/notification-core.js";
import { getUsMarketContextForSeoulDate, isUsMarketTradingDay } from "../src/domain/market-calendar.js";
import { formatAccountType, normalizeAccountType } from "../src/app/account-types.js";
import {
  accountKeyFor,
  getKnownAccounts,
  normalizeAccounts,
  parseAccountKey,
  renameAccountReferences,
} from "../src/app/accounts.js";
import { cycleSortValue, parseSortValue } from "../src/app/sort.js";
import { formatKrw, formatPercent } from "../src/app/formatters.js";
import {
  filterSnapshotRows,
  getAccountPerformanceRows,
  getMonthlyRows,
  getNumbersChartSource,
  getPerformanceStats,
  getSnapshotRows,
} from "../src/app/performance-selectors.js";
import { getDailyMoveRows, getHoldingDailyMove } from "../src/app/daily-move-selectors.js";
import { createEmptyState, createSampleState } from "../src/app/state-factory.js";

const sample = {
  version: 6,
  fxRate: { rate: 1400 },
  holdings: [
    {
      id: "h1",
      investor: "규철",
      account: "토스",
      ticker: "QQQ",
      quantity: 2,
      price: 500,
      averageCost: 400,
      currency: "USD",
    },
    {
      id: "h2",
      investor: "규철",
      account: "삼성증권",
      ticker: "005930.KS",
      quantity: 10,
      price: 80000,
      averageCost: 70000,
      currency: "KRW",
    },
  ],
  cashBalances: [
    { id: "c1", investor: "규철", account: "토스", currency: "KRW", amount: 320000 },
    { id: "c2", investor: "규철", account: "토스", currency: "USD", amount: 100 },
  ],
  cashFlows: [
    { id: "f1", date: "2026-05-14", type: "deposit", amountKrw: 1000000 },
    { id: "f2", date: "2026-05-14", type: "dividend", amountKrw: 50000 },
    { id: "f3", date: "2026-05-14", type: "withdrawal", amountKrw: 200000 },
  ],
  portfolioSnapshots: [],
};

test("totals include stocks, KRW cash, and USD cash", () => {
  const totals = getTotals({
    holdings: sample.holdings,
    cashBalances: sample.cashBalances,
    fxRate: sample.fxRate.rate,
  });

  assert.equal(totals.stockValueKrw, 2_200_000);
  assert.equal(totals.cashKrw, 460_000);
  assert.equal(totals.valueKrw, 2_660_000);
  assert.equal(totals.costKrw, 1_820_000);
  assert.equal(totals.gainKrw, 380_000);
});

test("external flow excludes dividends, taxes, and fees from net inflow", () => {
  assert.equal(getExternalFlowAmount({ type: "deposit", amountKrw: 100 }), 100);
  assert.equal(getExternalFlowAmount({ type: "withdrawal", amountKrw: 100 }), -100);
  assert.equal(getExternalFlowAmount({ type: "dividend", amountKrw: 100 }), 0);
  assert.equal(getExternalFlowAmount({ type: "fee", amountKrw: 100 }), 0);
});

test("portfolio and account snapshots use the same pure calculation boundary", () => {
  const snapshot = buildPortfolioSnapshot(sample, "2026-05-14", () => "snapshot-id");
  const accountSnapshots = buildAccountSnapshots(sample, "2026-05-14", () => "account-snapshot-id");

  assert.equal(snapshot.totalValueKrw, 2_660_000);
  assert.equal(snapshot.netInflowKrw, 800_000);
  assert.equal(accountSnapshots.reduce((sum, row) => sum + row.totalAssetsKrw, 0), snapshot.totalValueKrw);
  assert.equal(groupByAccount(sample).length, 2);
});

test("dashboard layout normalization migrates old preset sizes", () => {
  const layout = normalizeDashboardLayout([
    { id: "performance-flow", size: "full", minHeight: 900 },
    { id: "unknown", size: "wide" },
    { id: "total-value", widthPct: 8, span: 1, minHeight: 40 },
  ]);

  assert.equal(layout.length, 8);
  assert.deepEqual(layout[0], {
    id: "performance-flow",
    widthPct: 100,
    span: 12,
    minHeight: 720,
    visible: true,
  });
  assert.deepEqual(layout[1], {
    id: "total-value",
    widthPct: 18,
    span: 2,
    minHeight: 112,
    visible: true,
  });
});

test("state shape validation catches product data issues", () => {
  assert.deepEqual(validateStateShape(sample), []);
  assert.ok(validateStateShape({ ...sample, fxRate: { rate: "nope" } }).includes("fxRate.rate must be numeric"));
});

test("account type taxonomy collapses to product categories", () => {
  assert.equal(normalizeAccountType("brokerage"), "direct_investment");
  assert.equal(normalizeAccountType("overseas_brokerage"), "direct_investment");
  assert.equal(normalizeAccountType("irp"), "pension");
  assert.equal(formatAccountType("retirement_pension"), "연금 계좌");
});

test("table sort helpers cycle through asc, desc, and fallback", () => {
  assert.deepEqual(parseSortValue("", "value-desc"), { key: "value", dir: "desc" });
  assert.equal(cycleSortValue("value-desc", "quantity", "value-desc"), "quantity-asc");
  assert.equal(cycleSortValue("quantity-asc", "quantity", "value-desc"), "quantity-desc");
  assert.equal(cycleSortValue("quantity-desc", "quantity", "value-desc"), "value-desc");
});

test("shared formatters keep display conventions stable", () => {
  assert.equal(formatKrw(1234567), "₩1,234,567");
  assert.equal(formatPercent(0.1234), "12.34%");
});

test("state factories expose empty and sample portfolio shapes", () => {
  const nextId = idFactory();
  const empty = createEmptyState();
  const seeded = createSampleState(nextId);

  assert.equal(empty.version, 6);
  assert.equal(empty.holdings.length, 0);
  assert.ok(seeded.holdings.length > 0);
  assert.ok(normalizeAccounts(seeded, nextId).length > 0);
  assert.ok(seeded.dashboardLayout.length > 0);
});

test("account helpers derive explicit accounts and update references immutably", () => {
  const nextId = idFactory();
  const source = {
    holdings: [
      {
        id: "h1",
        investor: "규철",
        account: "토스",
        accountType: "irp",
        currency: "USD",
      },
    ],
    cashBalances: [
      { id: "c1", investor: "규철", account: "토스", currency: "KRW", amount: 1000 },
      { id: "c2", investor: "규철", account: "미분류 예수금", currency: "KRW", amount: 1000 },
    ],
    cashFlows: [{ id: "f1", investor: "규철", account: "토스", amountKrw: 1000 }],
  };

  const accounts = normalizeAccounts(source, nextId);
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].accountType, "pension");
  assert.equal(accountKeyFor(accounts[0]), "규철|||토스");
  assert.deepEqual(parseAccountKey("규철|||토스"), { investor: "규철", account: "토스" });
  assert.equal(getKnownAccounts({ ...source, accounts }, nextId).length, 1);

  const renamed = renameAccountReferences(source, accounts[0], { ...accounts[0], account: "미래에셋" });
  assert.equal(source.holdings[0].account, "토스");
  assert.equal(renamed.holdings[0].account, "미래에셋");
  assert.equal(renamed.cashBalances[0].account, "미래에셋");
  assert.equal(renamed.cashFlows[0].account, "미래에셋");
});

test("performance selectors calculate snapshot deltas and Numbers-style chart rows", () => {
  const rows = getSnapshotRows([
    { id: "s1", date: "2026-04-01", totalValueKrw: 10_000_000, netInflowKrw: 0 },
    { id: "s2", date: "2026-04-02", totalValueKrw: 12_500_000, netInflowKrw: 1_000_000 },
    { id: "s3", date: "2026-05-01", totalValueKrw: 13_000_000, netInflowKrw: 0 },
  ]);

  assert.equal(rows[1].dailyChangeKrw, 2_500_000);
  assert.equal(rows[1].investmentGainKrw, 1_500_000);
  assert.equal(filterSnapshotRows(rows, "ytd").length, 3);

  const monthly = getMonthlyRows(rows);
  assert.equal(monthly[0].month, "2026-04");
  assert.equal(monthly[0].investmentGainKrw, 1_500_000);

  const stats = getPerformanceStats(rows);
  assert.equal(stats.periodChangeKrw, 3_000_000);
  assert.equal(stats.investmentGainKrw, 2_000_000);

  const source = getNumbersChartSource(rows.slice(0, 2), rows);
  assert.deepEqual(source.rows[2].values, [0, 150]);
});

test("account performance selector compares latest, previous, and period account snapshots", () => {
  const rows = getSnapshotRows([
    { id: "s1", date: "2026-05-01", totalValueKrw: 1000, netInflowKrw: 0 },
    { id: "s2", date: "2026-05-02", totalValueKrw: 1200, netInflowKrw: 0 },
  ]);
  const accounts = getAccountPerformanceRows(
    [
      { date: "2026-05-01", investor: "규철", account: "토스", totalAssetsKrw: 1000, stockValueKrw: 900, cashKrw: 100, returnRate: 0.1 },
      { date: "2026-05-02", investor: "규철", account: "토스", totalAssetsKrw: 1300, stockValueKrw: 1100, cashKrw: 200, returnRate: 0.2 },
    ],
    rows,
  );

  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].dailyChangeKrw, 300);
  assert.equal(accounts[0].periodChangeKrw, 300);
  assert.equal(accounts[0].cashKrw, 200);
});

test("daily move selectors explain which holdings moved portfolio value", () => {
  const holdings = [
    { id: "h1", name: "Microsoft", ticker: "MSFT", quantity: 10, currency: "USD", priceChange: 2, priceChangePercent: 0.01 },
    { id: "h2", name: "삼성전자", ticker: "005930.KS", quantity: 3, currency: "KRW", priceChange: -1000, priceChangePercent: -0.02 },
    { id: "h3", name: "No data", ticker: "NODATA", quantity: 1, currency: "USD" },
  ];

  assert.deepEqual(getHoldingDailyMove(holdings[0], 1400), {
    hasData: true,
    valueKrw: 28_000,
    priceEffectKrw: 28_000,
    fxEffectKrw: 0,
    changePercent: 0.01,
    previousPrice: null,
  });

  const rows = getDailyMoveRows({ holdings, fxRate: 1400 });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].ticker, "MSFT");
  assert.equal(rows[0].value, 28_000);
  assert.equal(rows[0].contributionShare, 28_000 / 31_000);
  assert.equal(rows[1].value, -3000);
});

test("daily move selectors split price and fx effects when previous fx is available", () => {
  const holding = {
    id: "h1",
    name: "Microsoft",
    ticker: "MSFT",
    quantity: 10,
    currency: "USD",
    price: 105,
    previousClose: 100,
    priceChange: 5,
    priceChangePercent: 0.05,
  };

  const move = getHoldingDailyMove(holding, { rate: 1400, previousClose: 1390 });
  assert.equal(move.priceEffectKrw, 69_500);
  assert.equal(move.fxEffectKrw, 10_500);
  assert.equal(move.valueKrw, 80_000);
});

test("daily digest summarizes portfolio change and top movers", () => {
  const snapshot = { date: "2026-05-14", totalValueKrw: 2_800_000, netInflowKrw: 100_000 };
  const previousSnapshot = { date: "2026-05-13", totalValueKrw: 2_600_000 };
  const state = {
    ...sample,
    cashBalances: [],
    fxRate: { rate: 1400, previousClose: 1390 },
    holdings: [
      {
        id: "h1",
        name: "Microsoft",
        ticker: "MSFT",
        quantity: 10,
        currency: "USD",
        price: 105,
        priceChange: 5,
        priceChangePercent: 0.05,
      },
      {
        id: "h2",
        name: "삼성전자",
        ticker: "005930.KS",
        quantity: 3,
        currency: "KRW",
        price: 70000,
        priceChange: -1000,
        priceChangePercent: -0.01,
      },
    ],
  };

  const digest = buildDailyDigest({ state, snapshot, previousSnapshot, date: "2026-05-14", siteUrl: "https://stocklio-web.vercel.app" });

  assert.equal(digest.metrics.dayChangeKrw, 200_000);
  assert.equal(digest.metrics.investmentChangeKrw, 100_000);
  assert.equal(digest.metrics.priceEffectKrw, 66_500);
  assert.equal(digest.metrics.fxEffectKrw, 10_500);
  assert.equal(digest.topMovers[0].ticker, "MSFT");
  assert.match(digest.text, /총자산/);
  assert.match(digest.text, /변동 분해: 가격 \+₩66,500 · 환율 \+₩10,500/);
  assert.match(digest.text, /변동 원인 상위/);
  assert.equal(shouldSendDailyDigest({ telegram_enabled: true, daily_digest_enabled: true, large_move_threshold_krw: 300_000 }, digest), false);
  assert.equal(shouldSendDailyDigest({ telegram_enabled: true, daily_digest_enabled: true, large_move_threshold_krw: 100_000 }, digest), true);
});

test("daily digest explains when fx offsets stock price losses", () => {
  const snapshot = { date: "2026-05-20", totalValueKrw: 1_122_237_022, netInflowKrw: 0 };
  const previousSnapshot = { date: "2026-05-19", totalValueKrw: 1_121_398_489 };
  const state = {
    ...sample,
    cashBalances: [{ id: "cash-usd", account: "토스", investor: "규철", currency: "USD", amount: 1000 }],
    fxRate: { rate: 1500, previousClose: 1480 },
    holdings: [
      {
        id: "h1",
        name: "TQQQ",
        ticker: "TQQQ",
        quantity: 100,
        currency: "USD",
        price: 100,
        priceChange: -1,
        priceChangePercent: -0.01,
      },
      {
        id: "h2",
        name: "현대차",
        ticker: "005380.KS",
        quantity: 10,
        currency: "KRW",
        price: 250000,
        priceChange: -5000,
        priceChangePercent: -0.02,
      },
    ],
  };

  const digest = buildDailyDigest({ state, snapshot, previousSnapshot, date: "2026-05-20" });

  assert.equal(digest.metrics.priceEffectKrw, -198_000);
  assert.equal(digest.metrics.fxEffectKrw, 220_000);
  assert.match(digest.text, /해석: 주가는 하락했지만 USD\/KRW 상승이 총자산을 끌어올렸습니다/);
  assert.match(digest.text, /TQQQ: \+₩52,000 · -1.00% · 가격 -₩148,000, 환율 \+₩200,000/);
});

test("market calendar marks Seoul Sunday and Monday morning as US market closed context", () => {
  const sunday = getUsMarketContextForSeoulDate("2026-05-17");
  const mondayMorning = getUsMarketContextForSeoulDate("2026-05-18");
  const tuesdayMorning = getUsMarketContextForSeoulDate("2026-05-19");

  assert.equal(sunday.isMarketClosed, true);
  assert.equal(sunday.latestTradingDate, "2026-05-15");
  assert.equal(mondayMorning.isMarketClosed, true);
  assert.equal(mondayMorning.latestTradingDate, "2026-05-15");
  assert.equal(tuesdayMorning.isMarketClosed, false);
  assert.equal(tuesdayMorning.latestTradingDate, "2026-05-18");
  assert.equal(isUsMarketTradingDay("2026-05-25"), false);
});

test("daily digest suppresses stale top movers on US market closed days", () => {
  const snapshot = { date: "2026-05-17", totalValueKrw: 2_800_000, netInflowKrw: 0 };
  const previousSnapshot = { date: "2026-05-16", totalValueKrw: 2_800_000 };
  const state = {
    ...sample,
    fxRate: { rate: 1400, previousClose: 1390 },
    holdings: [
      {
        id: "h1",
        name: "TQQQ",
        ticker: "TQQQ",
        quantity: 10,
        currency: "USD",
        price: 105,
        priceChange: -5,
        priceChangePercent: -0.0457,
      },
    ],
  };

  const digest = buildDailyDigest({
    state,
    snapshot,
    previousSnapshot,
    date: "2026-05-17",
    marketContext: getUsMarketContextForSeoulDate("2026-05-17"),
  });

  assert.equal(digest.topMovers.length, 0);
  assert.equal(digest.metrics.marketClosed, true);
  assert.match(digest.text, /휴장일 기준 요약/);
  assert.match(digest.text, /새 종목별 변동을 표시하지 않습니다/);
});

function idFactory() {
  let id = 0;
  return () => `test-id-${++id}`;
}

// ─── simulator-core 테스트 ────────────────────────────────────────

const PRICE_ROWS = [
  { date: "2020-01-31", adjClose: 100 },
  { date: "2020-02-28", adjClose: 80 },
  { date: "2020-03-31", adjClose: 120 },
  { date: "2020-04-30", adjClose: 150 },
  { date: "2020-05-29", adjClose: 200 },
];

test("simulateLumpSum: 수량과 최종 평가금액 계산", () => {
  const result = simulateLumpSum({
    priceRows: PRICE_ROWS,
    investAmount: 1_000_000,
    start: "2020-01-01",
    end: "2020-12-31",
  });
  assert.equal(result.ok, true);
  assert.equal(result.totalPrincipal, 1_000_000);
  // 매수 수량: 1_000_000 / 100 = 10,000주
  // 최종가 200 → finalValue = 2_000_000
  assert.equal(result.finalValue, 2_000_000);
  assert.ok(Math.abs(result.returnRate - 1.0) < 0.0001, "수익률 100%");
  assert.equal(result.points[0].principal, 1_000_000);
  assert.equal(result.actualStart, "2020-01-31");
});

test("simulateLumpSum: 데이터 부족 시 error 반환", () => {
  const result = simulateLumpSum({
    priceRows: [{ date: "2020-01-31", adjClose: 100 }],
    investAmount: 1_000_000,
    start: "2020-01-01",
    end: "2020-12-31",
  });
  assert.equal(result.ok, false);
  assert.ok(result.error);
});

test("simulateLumpSum: 상장일이 start보다 늦으면 actualStart 보정", () => {
  const result = simulateLumpSum({
    priceRows: PRICE_ROWS,
    investAmount: 500_000,
    start: "2019-01-01",
    end: "2020-12-31",
  });
  assert.equal(result.actualStart, "2020-01-31");
});

test("simulateLumpSum: adjClose 없으면 close fallback 사용 + hasFallback 표시", () => {
  const rows = [
    { date: "2020-01-31", close: 100 },
    { date: "2020-02-28", close: 200 },
  ];
  const result = simulateLumpSum({
    priceRows: rows,
    investAmount: 1_000_000,
    start: "2020-01-01",
    end: "2020-12-31",
  });
  assert.equal(result.ok, true);
  assert.equal(result.hasFallback, true);
  assert.equal(result.finalValue, 2_000_000);
});

test("simulateDCA: 매월 적립 후 누적 원금과 평가금액 계산", () => {
  const result = simulateDCA({
    priceRows: PRICE_ROWS,
    monthlyAmount: 100_000,
    start: "2020-01-01",
    end: "2020-12-31",
    frequency: "monthly",
  });
  assert.equal(result.ok, true);
  // 5개 월봉 → 5회 매수 → 총 원금 500_000
  assert.ok(Math.abs(result.totalPrincipal - 500_000) < 1, "총 원금 500,000");
  // 마지막 포인트의 원금이 총 원금과 같아야 함
  const lastPoint = result.points[result.points.length - 1];
  assert.ok(Math.abs(lastPoint.principal - result.totalPrincipal) < 1);
});

test("simulateDCA: 원금선은 매수 전까지 0이고 매수 후 증가", () => {
  const result = simulateDCA({
    priceRows: PRICE_ROWS,
    monthlyAmount: 100_000,
    start: "2020-01-01",
    end: "2020-12-31",
    frequency: "monthly",
  });
  assert.equal(result.ok, true);
  // 첫 포인트에서는 원금이 0보다 커야 함 (첫 매수)
  assert.ok(result.points[0].principal > 0);
  // 원금은 단조 증가
  for (let i = 1; i < result.points.length; i++) {
    assert.ok(result.points[i].principal >= result.points[i - 1].principal);
  }
});

test("calcMaxDrawdown: 피크 대비 최대 하락 계산", () => {
  // 100 → 80 → 120 → 150 → 200
  // 피크 100에서 80으로 떨어짐 → MDD = 0.2 (20%)
  const values = [100, 80, 120, 150, 200];
  const mdd = calcMaxDrawdown(values);
  assert.ok(Math.abs(mdd - 0.2) < 0.0001, "MDD 20%");
});

test("calcMaxDrawdown: 단조 증가 시 MDD = 0", () => {
  assert.equal(calcMaxDrawdown([100, 200, 300]), 0);
});

test("calcMaxDrawdown: simulateLumpSum 결과에 포함됨", () => {
  const result = simulateLumpSum({
    priceRows: PRICE_ROWS,
    investAmount: 1_000_000,
    start: "2020-01-01",
    end: "2020-12-31",
  });
  // 100 → 80 : 20% MDD
  assert.ok(Math.abs(result.maxDrawdown - 0.2) < 0.0001);
});

test("findNextTradingDate: 정확한 날짜 반환", () => {
  const dates = ["2020-01-02", "2020-01-03", "2020-01-06"];
  assert.equal(findNextTradingDate(dates, "2020-01-01"), "2020-01-02");
  assert.equal(findNextTradingDate(dates, "2020-01-03"), "2020-01-03");
  assert.equal(findNextTradingDate(dates, "2020-01-05"), "2020-01-06");
  assert.equal(findNextTradingDate(dates, "2020-01-07"), null);
});

test("normalizePriceRows: start~end 범위 필터 및 정렬", () => {
  const rows = [
    { date: "2019-12-31", adjClose: 50 },
    { date: "2020-02-28", adjClose: 80 },
    { date: "2020-01-31", adjClose: 100 },
    { date: "2020-03-31", adjClose: 120 },
    { date: "2021-01-01", adjClose: 200 },
  ];
  const { rows: normalized } = normalizePriceRows(rows, "2020-01-01", "2020-12-31");
  assert.equal(normalized.length, 3);
  assert.equal(normalized[0].date, "2020-01-31");
  assert.equal(normalized[2].date, "2020-03-31");
});

test("simulateLumpSumVsDCA: 총 투자금 동일성", () => {
  const { lumpSum, dca } = simulateLumpSumVsDCA({
    priceRows: PRICE_ROWS,
    totalAmount: 500_000,
    start: "2020-01-01",
    end: "2020-12-31",
    frequency: "monthly",
  });
  assert.equal(lumpSum.ok, true);
  assert.equal(dca.ok, true);
  assert.equal(lumpSum.totalPrincipal, 500_000);
  assert.ok(Math.abs(dca.totalPrincipal - 500_000) < 1, "DCA 총 원금이 500,000에 근접");
});

test("simulateMultiSymbol: 종목별 결과 반환", () => {
  const rows2 = [
    { date: "2020-01-31", adjClose: 50 },
    { date: "2020-02-28", adjClose: 40 },
    { date: "2020-03-31", adjClose: 60 },
    { date: "2020-04-30", adjClose: 75 },
    { date: "2020-05-29", adjClose: 100 },
  ];
  const results = simulateMultiSymbol({
    items: [
      { symbol: "QQQ", priceRows: PRICE_ROWS, investAmount: 1_000_000 },
      { symbol: "VOO", priceRows: rows2, investAmount: 1_000_000 },
    ],
    start: "2020-01-01",
    end: "2020-12-31",
  });
  assert.equal(results.length, 2);
  assert.equal(results[0].symbol, "QQQ");
  assert.equal(results[1].symbol, "VOO");
  assert.equal(results[0].result.finalValue, 2_000_000);
  assert.equal(results[1].result.finalValue, 2_000_000);
});
