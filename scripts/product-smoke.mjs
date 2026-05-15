import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access } from "node:fs/promises";
import { chromium } from "playwright";

const port = Number(process.env.PORT || 4273);
const baseUrl = `http://127.0.0.1:${port}`;

const server = spawn(process.execPath, ["server.mjs"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

try {
  await verifyStaticBuild();
  await waitForServer();
  await verifyApi();
  await verifyBrowser();
  console.log("Product smoke passed");
} finally {
  server.kill("SIGTERM");
  await waitForExit(server, 2_000);
}

async function verifyStaticBuild() {
  const root = new URL("..", import.meta.url);
  await Promise.all([
    access(new URL("dist/index.html", root)),
    access(new URL("dist/src/app/stocklio-app.js", root)),
    access(new URL("dist/src/domain/portfolio-core.js", root)),
  ]);
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 12_000) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Server did not start on ${baseUrl}\n${serverOutput}`);
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  await Promise.race([
    once(child, "exit").catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

async function verifyApi() {
  const [health, state] = await Promise.all([
    fetch(`${baseUrl}/api/health`).then((response) => response.json()),
    fetch(`${baseUrl}/api/state`).then((response) => response.json()),
  ]);

  assert.equal(health.ok, true);
  assert.equal(state.version, 6);
  assert.ok(Array.isArray(state.dashboardLayout));
  assert.ok(Array.isArray(state.holdings));
}

async function verifyBrowser() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  try {
    await page.route("**/api/yahoo/chart?**", async (route) => {
      const symbol = new URL(route.request().url()).searchParams.get("symbol");
      const price = symbol === "KRW=X" ? 1350 : 100;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          chart: {
            result: [{ meta: { regularMarketPrice: price, previousClose: price * 0.99, regularMarketTime: 1778720400 } }],
          },
        }),
      });
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-dashboard-card=\"performance-flow\"]", { timeout: 10_000 });
    await page.click("#layoutEditButton");
    await page.waitForSelector(".layout-resize-handle", { timeout: 10_000 });

    const desktop = await page.evaluate(() => ({
      craftLoaded: Boolean([...document.scripts].find((script) => script.src.includes("craft-dashboard"))),
      cards: document.querySelectorAll("[data-dashboard-card]").length,
      controls: document.querySelectorAll(".layout-controls").length,
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      nav: (() => {
        const tabs = [...document.querySelectorAll(".view-tabs button")];
        const rects = tabs.map((button) => button.getBoundingClientRect());
        const pseudo = tabs.map((button) => getComputedStyle(button, "::before").content.replaceAll("\"", ""));
        return {
          count: tabs.length,
          maxHeight: Math.max(...rects.map((rect) => rect.height)),
          minHeight: Math.min(...rects.map((rect) => rect.height)),
          totalHeight: rects.reduce((sum, rect) => sum + rect.height, 0),
          letterBadges: pseudo.filter((value) => /^[A-Z]$/.test(value)).length,
        };
      })(),
      toolbar: (() => {
        const toolbar = document.querySelector(".toolbar");
        return {
          hasAccount: Boolean(toolbar.querySelector(".auth-panel")),
          hasRefresh: Boolean(toolbar.querySelector("#refreshButton")),
          hasSnapshot: Boolean(toolbar.querySelector("#saveSnapshotButton")),
          hasMore: Boolean(toolbar.querySelector(".more-actions")),
        };
      })(),
      toastExists: Boolean(document.querySelector("#operationToast")),
    }));

    assert.equal(desktop.craftLoaded, true);
    assert.equal(desktop.cards, 8);
    assert.equal(desktop.controls, 8);
    assert.equal(desktop.bodyOverflow, false);
    assert.equal(desktop.nav.count, 6);
    assert.ok(desktop.nav.maxHeight <= 56);
    assert.ok(desktop.nav.maxHeight - desktop.nav.minHeight <= 2);
    assert.ok(desktop.nav.totalHeight <= 360);
    assert.equal(desktop.nav.letterBadges, 0);
    assert.equal(desktop.toolbar.hasAccount, true);
    assert.equal(desktop.toolbar.hasRefresh, false);
    assert.equal(desktop.toolbar.hasSnapshot, false);
    assert.equal(desktop.toolbar.hasMore, false);
    assert.equal(desktop.toastExists, true);

    for (const tab of ["dashboard", "holdings", "accounts", "performance", "cashflows", "automation"]) {
      await page.evaluate((view) => document.querySelector(`[data-view-tab="${view}"]`).click(), tab);
      const viewHealth = await page.evaluate(() => ({
        bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        activeTabs: document.querySelectorAll(".view-tabs button.active").length,
        navMaxHeight: Math.max(
          ...[...document.querySelectorAll(".view-tabs button")].map((button) => button.getBoundingClientRect().height),
        ),
      }));
      assert.equal(viewHealth.bodyOverflow, false, `${tab} should not overflow on desktop`);
      assert.equal(viewHealth.activeTabs, 1, `${tab} should have one active tab on desktop`);
      assert.ok(viewHealth.navMaxHeight <= 56, `${tab} desktop nav should stay compact`);
    }

    await page.evaluate(() => document.querySelector("[data-view-tab=\"performance\"]").click());
    await page.waitForSelector("#performanceTrendChart svg", { timeout: 10_000 });
    const performance = await page.evaluate(() => ({
      chartLoaded: Boolean(window.Chart && window.ChartDataLabels),
      statCards: document.querySelectorAll("#performanceDetailStats > div").length,
      sourceRows: document.querySelectorAll("#numbersSourceBody tr").length,
      numbersChartCanvas: Boolean(document.querySelector("#numbersPerformanceChart")),
      trendValueLabels: document.querySelectorAll(".trend-value-label").length,
      trendLastLabel: Boolean(document.querySelector(".trend-last-label")),
      trendTooltips: document.querySelectorAll(".trend-tooltip").length,
      focusablePoints: document.querySelectorAll(".trend-point-group[tabindex='0']").length,
      waterfallRows: document.querySelectorAll("#performanceWaterfall .waterfall-row").length,
      accountRows: document.querySelectorAll("#accountPerformanceBody tr").length,
      strategyRows: document.querySelectorAll("#strategyPerformanceBody tr").length,
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));

    assert.equal(performance.chartLoaded, true);
    assert.equal(performance.statCards, 6);
    assert.equal(performance.sourceRows, 3);
    assert.equal(performance.numbersChartCanvas, true);
    assert.ok(performance.trendValueLabels >= 5);
    assert.equal(performance.trendLastLabel, true);
    assert.ok(performance.trendTooltips >= 2);
    assert.ok(performance.focusablePoints >= 2);
    assert.equal(performance.waterfallRows, 3);
    assert.ok(performance.accountRows >= 1);
    assert.ok(performance.strategyRows >= 1);
    assert.equal(performance.bodyOverflow, false);

    await page.evaluate(() => document.querySelector("[data-view-tab=\"automation\"]").click());
    await page.click("#saveSnapshotButton");
    await page.waitForSelector("#operationToast:not([hidden])", { timeout: 10_000 });
    const automationActions = await page.evaluate(() => ({
      refreshInAutomation: Boolean(document.querySelector("[data-view=\"automation\"] #refreshButton")),
      snapshotInAutomation: Boolean(document.querySelector("[data-view=\"automation\"] #saveSnapshotButton")),
      resetIsLocalOnly: document.querySelector("#resetButton")?.hasAttribute("data-local-only") || false,
      toastText: document.querySelector("#operationToast")?.textContent || "",
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    assert.equal(automationActions.refreshInAutomation, true);
    assert.equal(automationActions.snapshotInAutomation, true);
    assert.equal(automationActions.resetIsLocalOnly, true);
    assert.match(automationActions.toastText, /성과 기록|스냅샷/);
    assert.equal(automationActions.bodyOverflow, false);

    await page.evaluate(() => document.querySelector("[data-view-tab=\"holdings\"]").click());
    await page.fill("#holdingSearch", "QQQ");
    await page.click("[data-holding-sort-key=\"quantity\"]");
    await page.click("[data-holding-sort-key=\"quantity\"]");
    const holdingFilter = await page.evaluate(() => ({
      rows: document.querySelectorAll("#holdingsBody tr").length,
      firstText: document.querySelector("#holdingsBody tr")?.textContent || "",
      rowMenus: document.querySelectorAll("#holdingsBody .row-menu").length,
      sortValue: document.querySelector("#holdingSort")?.value,
      sortAria: document.querySelector("[data-holding-sort-key=\"quantity\"]")?.getAttribute("aria-sort"),
    }));
    assert.ok(holdingFilter.rows >= 1);
    assert.match(holdingFilter.firstText, /QQQ/i);
    assert.ok(holdingFilter.rowMenus >= 1);
    assert.equal(holdingFilter.sortValue, "quantity-desc");
    assert.equal(holdingFilter.sortAria, "descending");
    await page.click("#holdingsBody .row-menu summary");
    await page.click("#holdingsBody [data-edit-holding]");
    const holdingEdit = await page.evaluate(() => ({
      formHidden: document.querySelector("#holdingFormPanel")?.hidden,
      editingRows: document.querySelectorAll("tr.is-editing-row").length,
      inlineInputs: document.querySelectorAll("tr.is-editing-row [data-inline-holding-field]").length,
      hasSave: Boolean(document.querySelector("tr.is-editing-row [data-save-holding]")),
      hasCancel: Boolean(document.querySelector("tr.is-editing-row [data-cancel-holding-edit]")),
    }));
    assert.equal(holdingEdit.formHidden, true);
    assert.equal(holdingEdit.editingRows, 1);
    assert.ok(holdingEdit.inlineInputs >= 6);
    assert.equal(holdingEdit.hasSave, true);
    assert.equal(holdingEdit.hasCancel, true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("[data-dashboard-card=\"performance-flow\"]", { timeout: 10_000 });
    await page.evaluate(() => document.querySelector("[data-view-tab=\"performance\"]").click());
    await page.waitForSelector("#performanceDetailStats", { timeout: 10_000 });
    for (const tab of ["dashboard", "holdings", "accounts", "performance", "cashflows", "automation"]) {
      await page.evaluate((view) => document.querySelector(`[data-view-tab="${view}"]`).click(), tab);
      const viewHealth = await page.evaluate(() => ({
        bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        activeTabs: document.querySelectorAll(".view-tabs button.active").length,
      }));
      assert.equal(viewHealth.bodyOverflow, false, `${tab} should not overflow on mobile`);
      assert.equal(viewHealth.activeTabs, 1, `${tab} should have one active tab`);
    }
    await page.evaluate(() => document.querySelector("[data-view-tab=\"performance\"]").click());
    const mobile = await page.evaluate(() => ({
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      cards: document.querySelectorAll("[data-dashboard-card]").length,
      performanceStatCards: document.querySelectorAll("#performanceDetailStats > div").length,
      tabRail: (() => {
        const rail = document.querySelector(".view-tabs");
        const tabs = [...rail.querySelectorAll("button")].map((button) => button.getBoundingClientRect());
        return {
          height: rail.getBoundingClientRect().height,
          scrollOverflow: rail.scrollWidth - rail.clientWidth,
          maxButtonHeight: Math.max(...tabs.map((rect) => rect.height)),
          bottomGap: Math.abs(window.innerHeight - rail.getBoundingClientRect().bottom),
        };
      })(),
      tabOverlap: (() => {
        const tabs = [...document.querySelectorAll(".view-tabs button")].map((button) => button.getBoundingClientRect());
        return tabs.some((rect, index) => {
          const next = tabs[index + 1];
          return next && rect.right > next.left + 1 && rect.bottom > next.top && rect.top < next.bottom;
        });
      })(),
      holdingRows: document.querySelectorAll("#holdingsBody tr").length,
    }));

    assert.equal(mobile.bodyOverflow, false);
    assert.equal(mobile.cards, 8);
    assert.equal(mobile.performanceStatCards, 6);
    assert.ok(mobile.tabRail.height <= 72);
    assert.ok(mobile.tabRail.maxButtonHeight <= 52);
    assert.ok(mobile.tabRail.scrollOverflow <= 0);
    assert.ok(mobile.tabRail.bottomGap <= 1);
    assert.equal(mobile.tabOverlap, false);
    assert.ok(mobile.holdingRows >= 1);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
