import {
  escapeHtml,
  formatAsOf,
  formatKrw,
  formatNumber,
} from "./formatters.js";
import { AUTO_PRICE_REFRESH_TTL_MS } from "./constants.js";
import { fetchJson, getQuote, getUsdKrw } from "./services/market-data-service.js";
import {
  buildPortfolioSnapshot as createPortfolioSnapshot,
  buildAccountSnapshots as createAccountSnapshots,
  getTotals as calculateTotals,
} from "../domain/portfolio-core.js";

let _ctx;

// 모듈 내부 상태
let priceRefreshPromise = null;
let snapshotSavePromise = null;
let notificationSettings = {
  telegram_chat_id: "",
  telegram_enabled: false,
  daily_digest_enabled: true,
  large_move_threshold_krw: 0,
};
let notificationLogs = [];

export function init(ctx) {
  _ctx = ctx;
}

export function getNotificationSettings() {
  return notificationSettings;
}

export function getNotificationLogs() {
  return notificationLogs;
}

export function getPriceRefreshPromise() {
  return priceRefreshPromise;
}

export function renderAutomation() {
  const state = _ctx.getState();
  const els = _ctx.els;
  const automation = state.automation || {};
  const storageLabel = _ctx.authState.signedIn ? "클라우드 저장" : "로컬 저장";
  els.automationCurrent.textContent = `${storageLabel} · 스냅샷 ${state.portfolioSnapshots.length}개 · 보유 ${state.holdings.length}개 · 예수금 ${(state.cashBalances || []).length}개`;
  els.automationSchedule.textContent = `매일 ${automation.snapshotTime || "09:10"} ${automation.timezone || "Asia/Seoul"}`;
  els.automationResult.textContent = automation.lastRunAt
    ? `${automation.lastResult || "자동화 실행 완료"} · ${formatAsOf(automation.lastRunAt)}`
    : automation.lastResult || "자동 기록 대기 중";

}

export function renderDashboardStatus() {
  const state = _ctx.getState();
  const els = _ctx.els;
  const marketContext = _ctx.getCurrentMarketContext();
  const latestHoldingPrice = [...state.holdings]
    .filter((holding) => holding.priceAsOf)
    .sort((a, b) => String(b.priceAsOf).localeCompare(String(a.priceAsOf)))[0];
  const priceAsOf = latestHoldingPrice?.priceAsOf || state.fxRate?.asOf;

  // 총자산 카드 뱃지: 날짜, FX, 장상태 (Craft.js가 DOM을 재구성하므로 카드 직접 탐색)
  const totalValueCard = document.querySelector('[data-dashboard-card="total-value"]');
  if (totalValueCard) {
    let badgesEl = totalValueCard.querySelector(".metric-badges");
    if (!badgesEl) {
      badgesEl = document.createElement("div");
      badgesEl.className = "metric-badges";
      totalValueCard.appendChild(badgesEl);
    }
    const { formatShortDate } = _ctx;
    // priceAsOf가 실제 날짜 형식(YYYY-MM-DD)인지 확인
    const isRealDate = priceAsOf && /^\d{4}-\d{2}-\d{2}/.test(priceAsOf);
    const dateText = isRealDate
      ? `${formatShortDate(priceAsOf.slice(0, 10))} 종가`
      : (marketContext.isMarketClosed ? marketContext.label : "");
    const fxText = state.fxRate?.rate ? `USD/KRW ${formatNumber(state.fxRate.rate, 2)}` : "";
    const marketText = marketContext.isMarketClosed ? marketContext.closedReason || "미국장 휴장" : "";
    // 수익률 배지는 renderSummary가 별도 span으로 주입 — 덮어쓰지 않고 유지
    const returnBadge = badgesEl.querySelector(".metric-return-badge");
    const returnBadgeHtml = returnBadge ? returnBadge.outerHTML : "";
    badgesEl.innerHTML = [dateText, fxText, marketText]
      .filter(Boolean)
      .map((t) => `<span class="metric-badge">${escapeHtml(t)}</span>`)
      .join("") + returnBadgeHtml;
  }

  // 변동 요약 패널 레이블
  const breakdownDateLabel = document.getElementById("breakdownDateLabel");
  const breakdownSubtitle = document.getElementById("breakdownSubtitle");
  if (breakdownDateLabel) {
    breakdownDateLabel.textContent = marketContext.isMarketClosed ? "휴장일 기준" : "오늘 기준";
  }
  if (breakdownSubtitle) {
    breakdownSubtitle.textContent = marketContext.isMarketClosed
      ? "휴장일에는 변동 대신 환율과 현금 흐름을 확인합니다"
      : "종목별 가격 변동과 환율 효과를 분석합니다";
  }
}

export function renderPriceLogs() {
  const state = _ctx.getState();
  const els = _ctx.els;
  const logs = [...(state.priceUpdateLogs || [])].slice(-20).reverse();
  els.priceLogsBody.innerHTML = logs.length
    ? logs
        .map((log) => `<tr>
          <td>${formatAsOf(log.at)}</td>
          <td>${escapeHtml(log.symbol)}</td>
          <td class="${log.status === "success" ? "positive" : "negative"}">${log.status === "success" ? "성공" : "실패"}</td>
          <td>${log.price ? formatNumber(log.price, 4) : ""}</td>
          <td>${escapeHtml(log.message || log.source || "")}</td>
        </tr>`)
        .join("")
    : `<tr><td colspan="5">가격 업데이트 로그가 없습니다</td></tr>`;
}

export function renderNotifications() {
  const els = _ctx.els;
  if (!els.notificationForm) {
    return;
  }
  const signedIn = Boolean(_ctx.authState.signedIn);
  els.telegramChatId.value = notificationSettings.telegram_chat_id || "";
  els.largeMoveThreshold.value = Number(notificationSettings.large_move_threshold_krw || 0) || "";
  els.telegramEnabled.checked = Boolean(notificationSettings.telegram_enabled);
  els.dailyDigestEnabled.checked = notificationSettings.daily_digest_enabled !== false;
  els.notificationForm.querySelectorAll("input, button").forEach((control) => {
    control.disabled = !signedIn;
  });
  if (els.notificationLockedNotice) {
    els.notificationLockedNotice.hidden = signedIn;
  }
  els.notificationForm.hidden = !signedIn;
  els.notificationStatus.textContent = signedIn
    ? notificationSettings.telegram_enabled
      ? "매일 스냅샷 후 발송"
      : "알림 꺼짐"
    : "로그인 후 설정 가능";
  const latest = notificationLogs[0];
  els.notificationLogSummary.textContent = latest
    ? `${latest.status === "success" ? "성공" : latest.status === "skipped" ? "건너뜀" : "실패"} · ${formatAsOf(latest.sent_at || latest.created_at)}`
    : "발송 기록이 없습니다";
  els.notificationLogsBody.innerHTML = notificationLogs.length
    ? notificationLogs
        .slice(0, 8)
        .map((log) => `<tr>
          <td>${formatAsOf(log.sent_at || log.created_at)}</td>
          <td>${log.message_type === "test" ? "테스트" : "일일 요약"}</td>
          <td class="${log.status === "success" ? "positive" : log.status === "error" ? "negative" : ""}">${formatNotificationStatus(log.status)}</td>
          <td>${escapeHtml(log.error_message || log.message_preview || "")}</td>
        </tr>`)
        .join("")
    : `<tr><td colspan="4">발송 기록이 없습니다</td></tr>`;
}

export function formatNotificationStatus(status) {
  if (status === "success") {
    return "성공";
  }
  if (status === "skipped") {
    return "건너뜀";
  }
  return "실패";
}

export function renderReconciliation() {
  const state = _ctx.getState();
  const els = _ctx.els;
  const totals = _ctx.getTotals(state.holdings);
  const accountsTotal = _ctx.groupByAccount(state.holdings).reduce((sum, item) => sum + item.valueKrw, 0);
  const diff = totals.valueKrw - accountsTotal;
  els.reconcileSummary.textContent = `전체 총자산 ${formatKrw(totals.valueKrw)} · 계좌 합계 ${formatKrw(accountsTotal)} · 차이 ${formatKrw(diff)}`;
}

export async function saveTodaySnapshot({ reason = "manual" } = {}) {
  if (snapshotSavePromise) {
    return snapshotSavePromise;
  }
  snapshotSavePromise = Promise.resolve().then(() => {
    _ctx.setActionState("snapshot", true);
    _ctx.showOperationToast("오늘 성과 기록 중", "현재 총자산을 오늘 스냅샷으로 저장합니다", "busy");
    return saveTodaySnapshotNow();
  });
  try {
    return await snapshotSavePromise;
  } finally {
    snapshotSavePromise = null;
    _ctx.setActionState("snapshot", false);
  }
}

export function saveTodaySnapshotNow() {
  const state = _ctx.getState();
  const snapshot = buildPortfolioSnapshot(_ctx.todayKey());
  const accountSnapshots = buildAccountSnapshots(snapshot.date);
  const previousIndex = state.portfolioSnapshots.findIndex((item) => item.date === snapshot.date);
  if (previousIndex >= 0) {
    state.portfolioSnapshots[previousIndex] = {
      ...state.portfolioSnapshots[previousIndex],
      ...snapshot,
      id: state.portfolioSnapshots[previousIndex].id,
    };
  } else {
    state.portfolioSnapshots.push(snapshot);
  }
  state.accountSnapshots = [
    ...(state.accountSnapshots || []).filter((item) => item.date !== snapshot.date),
    ...accountSnapshots,
  ].sort((a, b) => `${a.date}${a.investor}${a.account}`.localeCompare(`${b.date}${b.investor}${b.account}`));
  state.portfolioSnapshots.sort((a, b) => a.date.localeCompare(b.date));
  _ctx.saveState();
  _ctx.render();
  const message = `${snapshot.date} · ${formatKrw(snapshot.totalValueKrw)}`;
  _ctx.setStatus("오늘 성과 기록 완료", message);
  _ctx.showOperationToast("오늘 성과 기록 완료", message, "success");
  return snapshot;
}

export function buildPortfolioSnapshot(date) {
  return createPortfolioSnapshot(_ctx.getState(), date, _ctx.makeId);
}

function buildAccountSnapshots(date) {
  return createAccountSnapshots(_ctx.getState(), date, _ctx.makeId);
}

export function queueAutomaticPriceRefresh() {
  if (!shouldAutoRefreshPrices()) {
    return;
  }
  window.setTimeout(() => {
    refreshPrices({ reason: "auto" }).catch((error) => {
      _ctx.setStatus("자동 가격 갱신 실패", error.message);
    });
  }, 250);
}

function shouldAutoRefreshPrices() {
  const state = _ctx.getState();
  if (!state.holdings.length || priceRefreshPromise) {
    return false;
  }
  const lastSuccess = getLastSuccessfulPriceUpdateTime();
  if (!lastSuccess) {
    return true;
  }
  return Date.now() - lastSuccess > AUTO_PRICE_REFRESH_TTL_MS;
}

function getLastSuccessfulPriceUpdateTime() {
  const state = _ctx.getState();
  const priceLogs = (state.priceUpdateLogs || [])
    .filter((log) => log.status === "success" && log.at)
    .map((log) => new Date(log.at).getTime())
    .filter(Number.isFinite);
  const holdingTimes = state.holdings
    .map((holding) => new Date(holding.priceAsOf || 0).getTime())
    .filter(Number.isFinite);
  return Math.max(0, ...priceLogs, ...holdingTimes);
}

export async function refreshPrices({ reason = "manual" } = {}) {
  if (priceRefreshPromise) {
    return priceRefreshPromise;
  }
  priceRefreshPromise = refreshPricesNow({ reason });
  try {
    return await priceRefreshPromise;
  } finally {
    priceRefreshPromise = null;
    _ctx.setActionState("price", false);
  }
}

async function refreshPricesNow({ reason }) {
  const state = _ctx.getState();
  _ctx.setActionState("price", true);
  const isAuto = reason === "auto";
  const forceRefresh = !isAuto;
  const beforeTotals = _ctx.getTotals();
  const previousFxRate = Number(state.fxRate?.rate || 1);
  _ctx.setStatus(isAuto ? "자동 가격 갱신 중" : "가격 업데이트 중", "Yahoo Finance에서 보유 종목 현재가와 USD/KRW를 조회 중");
  _ctx.showOperationToast(isAuto ? "가격 자동 갱신 중" : "가격 다시 가져오는 중", "보유 종목 현재가와 USD/KRW를 조회합니다", "busy");

  const tickers = _ctx.unique(state.holdings.filter((holding) => holding.autoPrice !== false).map((holding) => holding.ticker));
  const quoteMap = {};
  const failures = [];
  for (const ticker of tickers) {
    try {
      quoteMap[ticker] = await getQuote(ticker, { force: forceRefresh });
      addPriceLog({ symbol: ticker, status: "success", price: quoteMap[ticker].price, source: quoteMap[ticker].source });
    } catch (error) {
      failures.push(`${ticker}: ${error.message}`);
      addPriceLog({ symbol: ticker, status: "error", message: error.message });
    }
  }

  try {
    state.fxRate = await getUsdKrw({ force: forceRefresh });
    addPriceLog({ symbol: "USD/KRW", status: "success", price: state.fxRate.rate, source: state.fxRate.source });
  } catch (error) {
    failures.push(`USD/KRW: ${error.message}`);
    addPriceLog({ symbol: "USD/KRW", status: "error", message: error.message });
  }

  state.lastPriceRefreshImpact = buildPriceRefreshImpact({
    beforeTotals,
    quoteMap,
    previousFxRate,
    reason,
  });
  state.holdings = state.holdings.map((holding) => {
    const quote = quoteMap[holding.ticker];
    return quote
      ? {
          ...holding,
          price: quote.price,
          priceChange: quote.priceChange,
          priceChangePercent: quote.priceChangePercent,
          previousClose: quote.price - quote.priceChange,
          priceSource: quote.source,
          priceAsOf: quote.asOf,
          priceDate: quote.priceDate,
        }
      : holding;
  });

  _ctx.saveState();
  _ctx.render();
  const updatedAt = new Date().toISOString();
  if (failures.length) {
    const detail = `${tickers.length - failures.length}/${tickers.length}개 종목 갱신 · ${failures.slice(0, 2).join(" · ")}`;
    _ctx.setStatus("일부 가격 업데이트 완료", detail);
    _ctx.showOperationToast("일부 가격만 갱신됨", detail, "warning");
    return { failures, updatedAt };
  }
  const detail = `${tickers.length}개 종목 + USD/KRW · ${formatAsOf(updatedAt)}`;
  _ctx.setStatus(isAuto ? "자동 가격 갱신 완료" : "가격 업데이트 완료", detail);
  _ctx.showOperationToast(isAuto ? "가격 자동 갱신 완료" : "가격 다시 가져오기 완료", detail, "success");
  return { failures, updatedAt };
}

function addPriceLog(log) {
  const state = _ctx.getState();
  state.priceUpdateLogs = [
    ...(state.priceUpdateLogs || []),
    {
      id: _ctx.makeId(),
      at: new Date().toISOString(),
      ...log,
    },
  ].slice(-200);
}

function buildPriceRefreshImpact({ beforeTotals, quoteMap, previousFxRate, reason }) {
  const state = _ctx.getState();
  const currentFxRate = Number(state.fxRate?.rate || previousFxRate || 1);
  const rows = state.holdings
    .map((holding) => {
      const quote = quoteMap[holding.ticker];
      if (!quote) {
        return null;
      }
      const quantity = Number(holding.quantity || 0);
      const oldPrice = Number(holding.price || 0);
      const newPrice = Number(quote.price || oldPrice);
      const beforeFx = holding.currency === "USD" ? previousFxRate : 1;
      const afterFx = holding.currency === "USD" ? currentFxRate : 1;
      const beforeValueKrw = quantity * oldPrice * beforeFx;
      const afterValueKrw = quantity * newPrice * afterFx;
      return {
        id: holding.id,
        name: holding.name || holding.ticker,
        ticker: holding.ticker,
        currency: holding.currency,
        quantity,
        oldPrice,
        newPrice,
        beforeValueKrw,
        afterValueKrw,
        deltaKrw: afterValueKrw - beforeValueKrw,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.deltaKrw) - Math.abs(a.deltaKrw));
  const afterTotals = calculateTotals({
    holdings: state.holdings.map((holding) => {
      const quote = quoteMap[holding.ticker];
      return quote ? { ...holding, price: quote.price } : holding;
    }),
    cashBalances: state.cashBalances,
    fxRate: currentFxRate,
  });

  return {
    at: new Date().toISOString(),
    reason,
    previousFxRate,
    currentFxRate,
    previousTotalKrw: beforeTotals.totalValueKrw,
    nextTotalKrw: afterTotals.totalValueKrw,
    totalDeltaKrw: afterTotals.totalValueKrw - beforeTotals.totalValueKrw,
    rows,
  };
}

export function getRecentPriceRefreshImpact() {
  const state = _ctx.getState();
  const impact = state.lastPriceRefreshImpact;
  if (!impact?.at || !Array.isArray(impact.rows)) {
    return null;
  }
  const ageMs = Date.now() - new Date(impact.at).getTime();
  if (!Number.isFinite(ageMs) || ageMs > 24 * 60 * 60 * 1000) {
    return null;
  }
  return impact;
}

export async function exportBackup() {
  const state = _ctx.getState();
  const els = _ctx.els;
  const payload = {
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stock-portfolio-backup-${_ctx.todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  els.backupStatus.textContent = `백업 생성 완료 · ${formatAsOf(payload.exportedAt)}`;
}

export async function restoreBackup(file) {
  const els = _ctx.els;
  if (!file) {
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    const nextState = _ctx.normalizeState(payload.state || payload);
    const state = _ctx.getState();
    // 상태 교체 — ctx를 통해 처리
    _ctx.setState(nextState);
    _ctx.saveState();
    _ctx.render();
    els.backupStatus.textContent = `복원 완료 · ${file.name}`;
    _ctx.setStatus("백업 복원 완료", "현재 포트폴리오에 반영했습니다");
  } catch (error) {
    els.backupStatus.textContent = `복원 실패 · ${error.message}`;
    _ctx.setStatus("백업 복원 실패", error.message);
  }
}

export async function loadImportSummary() {
  const els = _ctx.els;
  const { formatKrw: fmtKrw } = { formatKrw };
  try {
    const summary = await fetchJson("/api/import/summary");
    els.importSummary.textContent = `보유 ${summary.holdings}개 · 스냅샷 ${summary.snapshots}개 · 예수금 ${summary.cashBalances}개 · 총자산 ${formatKrw(summary.migratedTotalAssetsKrw)}`;
  } catch (error) {
    els.importSummary.textContent = `검증 리포트를 불러오지 못했습니다 · ${error.message}`;
  }
}

export async function previewImport(file) {
  const els = _ctx.els;
  if (!file) {
    return;
  }
  els.importSummary.textContent = `${file.name} 검증 중...`;
  els.commitImportButton.disabled = true;
  try {
    const response = await fetch("/api/import/preview", {
      method: "POST",
      headers: {
        "content-type": file.type || "application/octet-stream",
      },
      body: await file.arrayBuffer(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    const result = await response.json();
    const summary = result.summary;
    const names = result.preview.firstHoldingNames.length ? ` · 예: ${result.preview.firstHoldingNames.join(", ")}` : "";
    els.importSummary.textContent = `Preview 완료 · 보유 ${summary.holdings}개 · 스냅샷 ${summary.snapshots}개 · 예수금 ${summary.cashBalances}개 · 총자산 ${formatKrw(summary.migratedTotalAssetsKrw)}${names}`;
    els.commitImportButton.disabled = false;
    _ctx.setStatus("Import preview 완료", "확정 전까지 현재 포트폴리오는 바뀌지 않습니다");
  } catch (error) {
    els.importSummary.textContent = `Preview 실패 · ${error.message}`;
    _ctx.setStatus("Import preview 실패", error.message);
  }
}

export async function commitImport() {
  const els = _ctx.els;
  els.commitImportButton.disabled = true;
  try {
    const result = await fetchJson("/api/import/commit", {
      method: "POST",
    });
    const newState = await _ctx.loadState();
    _ctx.setState(newState);
    _ctx.render();
    els.importSummary.textContent = `Import 확정 완료 · 보유 ${result.holdings}개 · 스냅샷 ${result.snapshots}개 · 예수금 ${result.cashBalances}개`;
    _ctx.setStatus("Import 확정 완료", "새 포트폴리오를 저장했습니다");
  } catch (error) {
    els.importSummary.textContent = `Import 확정 실패 · ${error.message}`;
    _ctx.setStatus("Import 확정 실패", error.message);
  }
}

export async function loadNotificationState() {
  const els = _ctx.els;
  if (!window.StocklioAuth?.isConfigured?.() || !window.StocklioAuth.getState().signedIn) {
    notificationSettings = {
      telegram_chat_id: "",
      telegram_enabled: false,
      daily_digest_enabled: true,
      large_move_threshold_krw: 0,
    };
    notificationLogs = [];
    return;
  }
  try {
    const [settings, logs] = await Promise.all([
      window.StocklioAuth.loadNotificationSettings?.(),
      window.StocklioAuth.loadNotificationDeliveryLogs?.(10),
    ]);
    notificationSettings = {
      telegram_chat_id: settings?.telegram_chat_id || "",
      telegram_enabled: Boolean(settings?.telegram_enabled),
      daily_digest_enabled: settings?.daily_digest_enabled !== false,
      large_move_threshold_krw: Number(settings?.large_move_threshold_krw || 0),
    };
    notificationLogs = Array.isArray(logs) ? logs : [];
  } catch (error) {
    notificationLogs = [];
    _ctx.setStatus("알림 설정 불러오기 실패", error.message);
  }
}

export async function saveNotificationSettings() {
  const els = _ctx.els;
  if (!_ctx.authState.signedIn) {
    throw new Error("로그인 후 알림을 설정할 수 있습니다");
  }
  const nextSettings = {
    telegram_chat_id: els.telegramChatId.value.trim(),
    telegram_enabled: els.telegramEnabled.checked,
    daily_digest_enabled: els.dailyDigestEnabled.checked,
    large_move_threshold_krw: Number(els.largeMoveThreshold.value || 0),
  };
  els.saveNotificationButton.disabled = true;
  try {
    await window.StocklioAuth.saveNotificationSettings(nextSettings);
    notificationSettings = nextSettings;
    _ctx.setStatus("알림 설정 저장됨", notificationSettings.telegram_enabled ? "매일 스냅샷 후 텔레그램으로 발송합니다" : "알림이 꺼져 있습니다");
    _ctx.showOperationToast("알림 설정 저장", "텔레그램 알림 설정을 저장했습니다", "success");
    await loadNotificationState();
    renderNotifications();
  } finally {
    els.saveNotificationButton.disabled = false;
  }
}

export async function sendTestNotification() {
  const els = _ctx.els;
  if (!_ctx.authState.signedIn) {
    throw new Error("로그인 후 테스트할 수 있습니다");
  }
  const chatId = els.telegramChatId.value.trim();
  if (!chatId) {
    throw new Error("Telegram chat id를 입력하세요");
  }
  els.testNotificationButton.disabled = true;
  _ctx.setStatus("테스트 알림 전송 중", "텔레그램으로 메시지를 보내고 있습니다");
  try {
    const token = window.StocklioAuth.getAccessToken?.();
    const result = await fetch("/api/notifications/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId }),
    });
    const payload = await result.json().catch(() => ({}));
    if (!result.ok) {
      throw new Error(formatNotificationError(payload.error || `HTTP ${result.status}`));
    }
    _ctx.setStatus("테스트 알림 전송 완료", "텔레그램에서 메시지를 확인하세요");
    _ctx.showOperationToast("테스트 알림 전송", "텔레그램으로 테스트 메시지를 보냈습니다", "success");
    await loadNotificationState();
    renderNotifications();
  } finally {
    els.testNotificationButton.disabled = false;
  }
}

export async function findTelegramChatId() {
  const els = _ctx.els;
  if (!_ctx.authState.signedIn) {
    throw new Error("로그인 후 chat id를 찾을 수 있습니다");
  }
  els.findTelegramChatButton.disabled = true;
  _ctx.setStatus("chat id 찾는 중", "@stocklio_alarm_bot에 /start를 보낸 대화를 확인합니다");
  try {
    const token = window.StocklioAuth.getAccessToken?.();
    const result = await fetch("/api/notifications/telegram-updates", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const payload = await result.json().catch(() => ({}));
    if (!result.ok) {
      throw new Error(formatNotificationError(payload.error || `HTTP ${result.status}`));
    }
    const chat = payload.chats?.[0];
    if (!chat) {
      throw new Error("@stocklio_alarm_bot에 /start를 먼저 보내고 다시 눌러주세요");
    }
    els.telegramChatId.value = chat.id;
    _ctx.setStatus("chat id 입력 완료", `${chat.name || "텔레그램 대화"} · ${chat.id}`);
    _ctx.showOperationToast("chat id 찾기 완료", "텔레그램 chat id를 입력했습니다. 설정 저장 또는 테스트 메시지를 눌러주세요", "success");
  } finally {
    els.findTelegramChatButton.disabled = false;
  }
}

function formatNotificationError(error) {
  if (error === "missing_telegram_bot_token") {
    return "서버에 TELEGRAM_BOT_TOKEN 환경변수가 아직 없습니다";
  }
  if (error === "telegram_chat_id_required") {
    return "Telegram chat id를 입력하세요";
  }
  if (String(error).startsWith("telegram_send_failed_")) {
    return "텔레그램 전송에 실패했습니다. chat id와 봇 대화 시작 여부를 확인하세요";
  }
  if (String(error).startsWith("telegram_updates_failed_")) {
    return "텔레그램 대화 목록을 불러오지 못했습니다";
  }
  return error || "알 수 없는 오류";
}
