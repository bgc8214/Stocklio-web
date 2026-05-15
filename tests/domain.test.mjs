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
    widthPct: 50,
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

function idFactory() {
  let id = 0;
  return () => `test-id-${++id}`;
}
