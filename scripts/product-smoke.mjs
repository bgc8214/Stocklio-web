import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
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
  await waitForServer();
  await verifyApi();
  await verifyBrowser();
  console.log("Product smoke passed");
} finally {
  server.kill("SIGTERM");
  await waitForExit(server, 2_000);
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
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-dashboard-card=\"performance-flow\"]", { timeout: 10_000 });
    await page.click("#layoutEditButton");
    await page.waitForSelector(".layout-resize-handle", { timeout: 10_000 });

    const desktop = await page.evaluate(() => ({
      craftLoaded: Boolean([...document.scripts].find((script) => script.src.includes("craft-dashboard"))),
      cards: document.querySelectorAll("[data-dashboard-card]").length,
      controls: document.querySelectorAll(".layout-controls").length,
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));

    assert.equal(desktop.craftLoaded, true);
    assert.equal(desktop.cards, 8);
    assert.equal(desktop.controls, 8);
    assert.equal(desktop.bodyOverflow, false);

    await page.evaluate(() => document.querySelector("[data-view-tab=\"performance\"]").click());
    await page.waitForSelector("#performanceTrendChart svg", { timeout: 10_000 });
    const performance = await page.evaluate(() => ({
      chartLoaded: Boolean(window.Chart && window.ChartDataLabels),
      statCards: document.querySelectorAll("#performanceDetailStats > div").length,
      sourceRows: document.querySelectorAll("#numbersSourceBody tr").length,
      numbersChartCanvas: Boolean(document.querySelector("#numbersPerformanceChart")),
      waterfallRows: document.querySelectorAll("#performanceWaterfall .waterfall-row").length,
      accountRows: document.querySelectorAll("#accountPerformanceBody tr").length,
      strategyRows: document.querySelectorAll("#strategyPerformanceBody tr").length,
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));

    assert.equal(performance.chartLoaded, true);
    assert.equal(performance.statCards, 6);
    assert.equal(performance.sourceRows, 3);
    assert.equal(performance.numbersChartCanvas, true);
    assert.equal(performance.waterfallRows, 3);
    assert.ok(performance.accountRows >= 1);
    assert.ok(performance.strategyRows >= 1);
    assert.equal(performance.bodyOverflow, false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("[data-dashboard-card=\"performance-flow\"]", { timeout: 10_000 });
    await page.evaluate(() => document.querySelector("[data-view-tab=\"performance\"]").click());
    await page.waitForSelector("#performanceDetailStats", { timeout: 10_000 });
    const mobile = await page.evaluate(() => ({
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      cards: document.querySelectorAll("[data-dashboard-card]").length,
      performanceStatCards: document.querySelectorAll("#performanceDetailStats > div").length,
    }));

    assert.equal(mobile.bodyOverflow, false);
    assert.equal(mobile.cards, 8);
    assert.equal(mobile.performanceStatCards, 6);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
