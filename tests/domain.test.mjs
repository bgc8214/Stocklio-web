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
