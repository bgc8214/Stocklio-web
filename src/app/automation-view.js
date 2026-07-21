import { formatAsOf, formatKrw } from "./formatters.js";
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
let latestImportPreviewToken = null;
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

// 설정(자동화) 탭 UI 는 Phase 5 에서 React AutomationView 가 렌더한다.
// 이 모듈은 가격 갱신/스냅샷/알림/백업/임포트 같은 서비스 op 만 담당한다(DOM 렌더 없음).
export function renderAutomation() {}

// 대시보드 카드/가격로그/알림 표는 craft-dashboard(React) 와 React AutomationView 가 렌더한다.
export function renderDashboardStatus() {}
export function renderPriceLogs() {}
export function renderNotifications() {}

// AutomationView 가 알림 상태/로그를 store 로 push 하도록 돕는 헬퍼.
function publishNotificationState() {
  _ctx.setNotificationState?.({ settings: { ...notificationSettings }, logs: notificationLogs });
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

// 검증 리포트는 React AutomationView 가 계산/렌더한다.
export function renderReconciliation() {}

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

// 백업/임포트 op 는 상태 문자열을 반환한다(React AutomationView 가 표시). hasToken 으로 확정 버튼 활성화.
export async function exportBackup() {
  const state = _ctx.getState();
  const payload = { exportedAt: new Date().toISOString(), state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stock-portfolio-backup-${_ctx.todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  return `백업 생성 완료 · ${formatAsOf(payload.exportedAt)}`;
}

export async function restoreBackup(file) {
  if (!file) return null;
  try {
    const payload = JSON.parse(await file.text());
    const nextState = _ctx.normalizeState(payload.state || payload);
    _ctx.setState(nextState);
    _ctx.saveState();
    _ctx.render();
    _ctx.setStatus("백업 복원 완료", "현재 포트폴리오에 반영했습니다");
    return `복원 완료 · ${file.name}`;
  } catch (error) {
    _ctx.setStatus("백업 복원 실패", error.message);
    return `복원 실패 · ${error.message}`;
  }
}

export async function loadImportSummary() {
  try {
    const summary = await fetchJson("/api/import/summary");
    return `보유 ${summary.holdings}개 · 스냅샷 ${summary.snapshots}개 · 예수금 ${summary.cashBalances}개 · 총자산 ${formatKrw(summary.migratedTotalAssetsKrw)}`;
  } catch (error) {
    return `검증 리포트를 불러오지 못했습니다 · ${error.message}`;
  }
}

export async function previewImport(file) {
  if (!file) return { summary: null, canCommit: false };
  try {
    const response = await fetch("/api/import/preview", {
      method: "POST",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: await file.arrayBuffer(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    const result = await response.json();
    latestImportPreviewToken = result.token;
    const summary = result.summary;
    const names = result.preview.firstHoldingNames.length ? ` · 예: ${result.preview.firstHoldingNames.join(", ")}` : "";
    _ctx.setStatus("Import preview 완료", "확정 전까지 현재 포트폴리오는 바뀌지 않습니다");
    return { summary: `Preview 완료 · 보유 ${summary.holdings}개 · 스냅샷 ${summary.snapshots}개 · 예수금 ${summary.cashBalances}개 · 총자산 ${formatKrw(summary.migratedTotalAssetsKrw)}${names}`, canCommit: true };
  } catch (error) {
    _ctx.setStatus("Import preview 실패", error.message);
    return { summary: `Preview 실패 · ${error.message}`, canCommit: false };
  }
}

export async function commitImport() {
  try {
    const result = await fetchJson("/api/import/commit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: latestImportPreviewToken }),
    });
    latestImportPreviewToken = null;
    const newState = await _ctx.loadState();
    _ctx.setState(newState);
    _ctx.render();
    _ctx.setStatus("Import 확정 완료", "새 포트폴리오를 저장했습니다");
    return { summary: `Import 확정 완료 · 보유 ${result.holdings}개 · 스냅샷 ${result.snapshots}개 · 예수금 ${result.cashBalances}개`, done: true };
  } catch (error) {
    _ctx.setStatus("Import 확정 실패", error.message);
    return { summary: `Import 확정 실패 · ${error.message}`, done: false };
  }
}

export async function loadNotificationState() {
  // stocklio:auth 이벤트가 init(ctx) 보다 먼저 도착하면 _ctx 가 아직 없다(부트스트랩 레이스). 방어.
  if (!_ctx) {
    return;
  }
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
  publishNotificationState();
}

// React AutomationView 가 폼 값을 인자로 넘긴다.
export async function saveNotificationSettings(nextSettings) {
  if (!_ctx.authState.signedIn) {
    throw new Error("로그인 후 알림을 설정할 수 있습니다");
  }
  await window.StocklioAuth.saveNotificationSettings(nextSettings);
  notificationSettings = nextSettings;
  _ctx.setStatus("알림 설정 저장됨", notificationSettings.telegram_enabled ? "매일 스냅샷 후 텔레그램으로 발송합니다" : "알림이 꺼져 있습니다");
  _ctx.showOperationToast("알림 설정 저장", "텔레그램 알림 설정을 저장했습니다", "success");
  await loadNotificationState();
}

export async function sendTestNotification(chatId) {
  if (!_ctx.authState.signedIn) {
    throw new Error("로그인 후 테스트할 수 있습니다");
  }
  if (!chatId) {
    throw new Error("Telegram chat id를 입력하세요");
  }
  _ctx.setStatus("테스트 알림 전송 중", "텔레그램으로 메시지를 보내고 있습니다");
  const token = window.StocklioAuth.getAccessToken?.();
  const result = await fetch("/api/notifications/test", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ chatId }),
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) {
    throw new Error(formatNotificationError(payload.error || `HTTP ${result.status}`));
  }
  _ctx.setStatus("테스트 알림 전송 완료", "텔레그램에서 메시지를 확인하세요");
  _ctx.showOperationToast("테스트 알림 전송", "텔레그램으로 테스트 메시지를 보냈습니다", "success");
  await loadNotificationState();
}

// chat id 를 찾아 반환한다(React 가 폼에 반영).
export async function findTelegramChatId() {
  if (!_ctx.authState.signedIn) {
    throw new Error("로그인 후 chat id를 찾을 수 있습니다");
  }
  _ctx.setStatus("chat id 찾는 중", "@stocklio_alarm_bot에 /start를 보낸 대화를 확인합니다");
  const token = window.StocklioAuth.getAccessToken?.();
  const result = await fetch("/api/notifications/telegram-updates", {
    headers: { authorization: `Bearer ${token}` },
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) {
    throw new Error(formatNotificationError(payload.error || `HTTP ${result.status}`));
  }
  const chat = payload.chats?.[0];
  if (!chat) {
    throw new Error("@stocklio_alarm_bot에 /start를 먼저 보내고 다시 눌러주세요");
  }
  _ctx.setStatus("chat id 입력 완료", `${chat.name || "텔레그램 대화"} · ${chat.id}`);
  _ctx.showOperationToast("chat id 찾기 완료", "텔레그램 chat id를 입력했습니다. 설정 저장 또는 테스트 메시지를 눌러주세요", "success");
  return String(chat.id);
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
