import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const phase = process.argv[2] || "before";
const baseUrl = process.argv[3] || "http://127.0.0.1:4173";
const outDir = path.resolve("_workspace/stock-portfolio/14_ux_book_review", phase);
const settleMs = phase === "after" ? 2800 : 700;

const desktopViewport = { width: 1440, height: 1100 };
const mobileViewport = { width: 390, height: 844 };

const views = [
  ["dashboard", "dashboard"],
  ["holdings", "holdings"],
  ["accounts", "accounts"],
  ["performance", "performance"],
  ["automation", "automation"],
];

async function openView(page, view) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.evaluate((nextView) => {
    document.querySelector(`[data-view-tab="${nextView}"]`)?.click();
  }, view);
  await page.waitForTimeout(settleMs);
}

async function capturePage(browser, name, view, viewport, options = {}) {
  const page = await browser.newPage({ viewport, isMobile: Boolean(options.mobile) });
  await openView(page, view);
  await page.screenshot({
    path: path.join(outDir, `${phase}-${options.mobile ? "mobile" : "desktop"}-${name}${options.viewportOnly ? "-viewport" : ""}.png`),
    fullPage: !options.viewportOnly,
  });
  await page.close();
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const [name, view] of views) {
  await capturePage(browser, name, view, desktopViewport);
}

for (const [name, view] of [
  ["dashboard", "dashboard"],
  ["holdings", "holdings"],
  ["performance", "performance"],
]) {
  await capturePage(browser, name, view, mobileViewport, { mobile: true });
  await capturePage(browser, name, view, mobileViewport, { mobile: true, viewportOnly: true });
}

const loginPage = await browser.newPage({ viewport: desktopViewport });
await loginPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
await loginPage.waitForTimeout(900);
await loginPage.evaluate(() => {
  const dialog = document.querySelector("#loginDialog");
  if (dialog && typeof dialog.showModal === "function" && !dialog.open) {
    dialog.showModal();
  }
});
await loginPage.waitForTimeout(300);
await loginPage.screenshot({ path: path.join(outDir, `${phase}-desktop-login-entry.png`), fullPage: true });
await loginPage.close();

await browser.close();

console.log(`Captured ${phase} screenshots in ${outDir}`);
