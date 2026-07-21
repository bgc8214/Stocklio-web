import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, readdir } from "node:fs/promises";
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
  const assetsDir = new URL("dist/assets/", root);
  await access(new URL("dist/index.html", root));
  // Vite 는 해시된 진입 번들(index-*.js)을 생성한다.
  const entries = await readdir(assetsDir);
  if (!entries.some((name) => /^index-.*\.js$/.test(name))) {
    throw new Error("dist/assets 에 Vite 진입 번들(index-*.js)이 없습니다");
  }
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
      const text = message.text();
      // 외부 리소스(파케 로고, Yahoo 히스토리 등) 404 는 앱 결함이 아니므로 제외한다.
      if (text.includes("Failed to load resource")) return;
      errors.push(text);
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

    // React 셸 마운트 확인: 사이드바(그리드 col 1) + 대시보드 카드.
    await page.waitForSelector(".sidebar .view-tabs [data-view-tab=\"dashboard\"]", { timeout: 10_000 });
    await page.waitForSelector("#dashboardBoard [data-dashboard-card]", { timeout: 10_000 });

    const shell = await page.evaluate(() => ({
      tabs: document.querySelectorAll(".view-tabs [data-view-tab]").length,
      dashboardCards: document.querySelectorAll("#dashboardBoard [data-dashboard-card]").length,
      toolbar: Boolean(document.querySelector(".toolbar .auth-panel")),
      toast: Boolean(document.querySelector("#operationToast")),
      loginDialog: Boolean(document.querySelector("#loginDialog")),
      chartLoaded: Boolean(window.Chart && window.ChartDataLabels),
    }));
    assert.equal(shell.tabs, 7, "사이드바에 7개 탭이 있어야 한다");
    assert.ok(shell.dashboardCards >= 5, "대시보드 카드가 렌더돼야 한다");
    assert.equal(shell.toolbar, true, "툴바 auth 패널이 있어야 한다");
    assert.equal(shell.toast, true, "토스트 요소가 있어야 한다");
    assert.equal(shell.loginDialog, true, "로그인 다이얼로그가 있어야 한다");
    assert.equal(shell.chartLoaded, true, "Chart.js UMD 가 로드돼야 한다");

    // 7개 탭 전환 — 각 탭의 React 마운트가 표시되는지 확인.
    const tabMounts = {
      dashboard: "#dashboardBoard",
      holdings: "#holdingsViewMount .holdings-panel, #holdingsViewMount .holding-toolbar",
      accounts: "#accountsViewMount .account-list-panel",
      performance: "#performanceViewMount .performance-header",
      cashflows: "#cashflowsViewMount .cash-flow-form",
      automation: "#automationViewMount .automation-panel",
      simulator: "#simulatorViewMount .sim-root",
    };
    for (const [tab, selector] of Object.entries(tabMounts)) {
      await page.evaluate((view) => document.querySelector(`[data-view-tab="${view}"]`).click(), tab);
      await page.waitForSelector(selector, { state: "visible", timeout: 10_000 });
      const health = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        activeTabs: document.querySelectorAll(".view-tabs [data-view-tab].active").length,
      }));
      assert.equal(health.overflow, false, `${tab} 데스크톱에서 가로 오버플로가 없어야 한다`);
      assert.equal(health.activeTabs, 1, `${tab} 활성 탭은 하나여야 한다`);
    }

    // 보유 종목 탭: 테이블 렌더 + 검색 필터 동작.
    await page.evaluate(() => document.querySelector("[data-view-tab=\"holdings\"]").click());
    await page.waitForSelector("#holdingsViewMount .holdings-table tbody tr", { timeout: 10_000 });
    await page.fill("#holdingsViewMount input[type=search]", "QQQ");
    const holdings = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("#holdingsViewMount .holdings-table tbody tr")];
      return { rows: rows.length, firstText: rows[0]?.textContent || "" };
    });
    assert.ok(holdings.rows >= 1, "QQQ 검색 결과가 있어야 한다");
    assert.match(holdings.firstText, /QQQ/i);

    // 성과 탭: Chart.js 캔버스 + KPI 카드.
    await page.evaluate(() => document.querySelector("[data-view-tab=\"performance\"]").click());
    await page.waitForSelector("#performanceViewMount canvas", { timeout: 10_000 });
    const performance = await page.evaluate(() => ({
      canvas: Boolean(document.querySelector("#performanceViewMount canvas")),
      kpiCards: document.querySelectorAll("#performanceViewMount .performance-detail-stats > div").length,
      donuts: document.querySelectorAll("#performanceViewMount .allocation-overview-grid svg").length,
    }));
    assert.equal(performance.canvas, true, "월별 손익 Chart.js 캔버스가 있어야 한다");
    assert.equal(performance.kpiCards, 5, "성과 KPI 카드 5개");
    assert.equal(performance.donuts, 4, "자산 구성 도넛 4개");

    // 모바일: 오버플로 없이 7개 탭 전환.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle" });
    // 모바일 기본 진입 탭은 holdings 이므로 사이드바(항상 표시)를 기준으로 대기한다.
    await page.waitForSelector(".sidebar .view-tabs [data-view-tab=\"dashboard\"]", { timeout: 10_000 });
    for (const tab of Object.keys(tabMounts)) {
      await page.evaluate((view) => document.querySelector(`[data-view-tab="${view}"]`).click(), tab);
      const health = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        activeTabs: document.querySelectorAll(".view-tabs [data-view-tab].active").length,
      }));
      assert.equal(health.overflow, false, `${tab} 모바일에서 가로 오버플로가 없어야 한다`);
      assert.equal(health.activeTabs, 1, `${tab} 모바일 활성 탭은 하나여야 한다`);
    }

    assert.deepEqual(errors, [], `콘솔 에러 없음: ${errors.join(" | ")}`);
  } finally {
    await browser.close();
  }
}
