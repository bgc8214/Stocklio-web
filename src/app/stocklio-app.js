// 앱 부트스트랩 + 영속성 컨트롤러.
//
// Phase 1~7 에서 모든 UI(셸 + 7개 탭)가 React 로 이관됐다. 이 모듈은 더 이상 DOM 을 렌더하지 않고,
// 아래만 담당한다:
//  - portfolio state 의 load/save (localStorage + Supabase + /api/state) — 단일 writer
//  - state 변경을 Zustand 스토어로 발행(publishState → store 미러) → React 가 구독 렌더
//  - auth 이벤트 처리, 자동 가격 갱신 부트스트랩
//  - React 셸/탭이 호출하는 store.actions(setView/mutate/로그인/자동화 op) 등록
//  - automation-view 서비스 모듈(가격/스냅샷/알림/백업/임포트)에 ctx 주입
//
// 대시보드 카드 badge(날짜/FX/장상태)는 automation-view.renderDashboardStatus 가 craft 카드에 주입한다.
import { normalizeAccounts } from "./accounts.js";
import { AUTH_READY_TIMEOUT_MS, DATA_VERSION, STORAGE_KEY, viewCopy } from "./constants.js";
import { normalizeAccountType } from "./account-types.js";
import { createEmptyState, createSampleState } from "./state-factory.js";
import { clearStaleQuoteCaches, fetchJson } from "./services/market-data-service.js";
import {
  getTotals as calculateTotals,
  groupByAccount as calculateGroupByAccount,
  normalizeDashboardLayout,
} from "../domain/portfolio-core.js";
import {
  init as initAutomationView,
  saveTodaySnapshot,
  queueAutomaticPriceRefresh,
  refreshPrices,
  loadNotificationState,
  saveNotificationSettings,
  sendTestNotification,
  findTelegramChatId,
  exportBackup,
  restoreBackup,
  loadImportSummary,
  previewImport,
  commitImport,
} from "./automation-view.js";
import { useStore } from "../react/store/useStore.js";

const DEFAULT_STRATEGIES = ["QQQ", "S&P500", "국내주식", "SCHD", "기타"];

const sampleState = createSampleState(makeId);

let state = createEmptyState();
let currencyMode = localStorage.getItem("currencyMode") === "usd" ? "usd" : "krw";
let toastTimer = null;
let authState = { configured: false, signedIn: false, user: null };
let syncState = { status: "idle", message: "" };

const VIEW_IDS = Object.keys(viewCopy);
function viewFromHash() {
  const hash = window.location.hash.slice(1);
  return VIEW_IDS.includes(hash) ? hash : null;
}
let activeView = viewFromHash() || (window.innerWidth <= 980 ? "holdings" : "dashboard");

// 레거시 컨트롤러가 참조하는 DOM 은 대시보드 status strip 버튼과 뷰 섹션(setView 토글) 뿐이다.
const els = {
  viewSections: document.querySelectorAll("[data-view]"),
  dashboardRefreshButton: document.querySelector("#dashboardRefreshButton"),
  dashboardAddHoldingButton: document.querySelector("#dashboardAddHoldingButton"),
  layoutResetButton: document.querySelector("#layoutResetButton"),
  emptyPortfolioNotice: document.querySelector("#emptyPortfolioNotice"),
};

// ─── store.actions 등록 (React 셸/탭이 호출) ──────────────────────
useStore.getState().registerActions({
  setView: (view) => setView(view),
  applyCurrencyMode,
  // 포팅된 React 탭이 상태를 변경할 때 쓰는 공용 mutation. fn(state)→(변형 또는 새 state) 후 save+publish.
  mutate: (fn) => {
    const next = fn(state);
    if (next && next !== state) {
      state = next;
    }
    saveState();
    render();
  },
  makeId,
  todayKey,
  setStatus,
  showOperationToast,
  // 로그인/이메일 다이얼로그 + OAuth
  openLoginDialog,
  closeLoginDialog,
  openEmailDialog: openEmailLoginDialog,
  closeEmailDialog: closeEmailLoginDialog,
  signInWithGoogle: handleGoogleLogin,
  signInWithNaver: handleNaverLogin,
  signInWithEmail: sendEmailLoginLink,
  signOut: handleLogout,
  // 설정(자동화) 탭 op
  refreshPrices: (opts) => refreshPrices(opts),
  saveTodaySnapshot: (opts) => saveTodaySnapshot(opts),
  saveNotificationSettings: (settings) => saveNotificationSettings(settings),
  sendTestNotification: (chatId) => sendTestNotification(chatId),
  findTelegramChatId: () => findTelegramChatId(),
  exportBackup: () => exportBackup(),
  restoreBackup: (file) => restoreBackup(file),
  previewImport: (file) => previewImport(file),
  commitImport: () => commitImport(),
  loadImportSummary: () => loadImportSummary(),
  emptyPortfolio: () => {
    state = createEmptyState();
    saveState();
    render();
    showOperationToast("포트폴리오 초기화", "보유 종목과 계좌를 새로 입력하세요");
  },
  loadSampleData: () => {
    state = structuredClone(sampleState);
    saveState();
    render();
    showOperationToast("예시 데이터 로드됨", "보유 종목과 계좌에서 직접 입력하세요");
  },
  getReconcileSummary: () => {
    const totals = getTotals(state.holdings);
    const accountsTotal = calculateGroupByAccount(state.holdings).reduce((sum, item) => sum + item.valueKrw, 0);
    return { totalValueKrw: totals.valueKrw, accountsTotal, diff: totals.valueKrw - accountsTotal };
  },
});

// 초기 통화 모드를 store 에 반영한다.
useStore.getState().setCurrencyMode(currencyMode);

window.addEventListener("popstate", () => {
  setView(viewFromHash() || "dashboard", { fromHistory: true });
});

// 대시보드 status strip 버튼(레거시 HTML — status/layout 스트립)은 여기서 그대로 처리한다.
els.dashboardRefreshButton?.addEventListener("click", () => {
  refreshPrices({ reason: "manual" }).catch((error) => {
    setStatus("가격 업데이트 실패", error.message);
    showOperationToast("가격 업데이트 실패", error.message, "error");
  });
});
els.dashboardAddHoldingButton?.addEventListener("click", () => {
  setView("holdings");
  useStore.getState().requestOpenHoldingDrawer();
});

// 대시보드 레이아웃 편집/초기화 — craft 대시보드(React)가 소유하므로 여기서는 no-op 방지 가드만 유지.
els.layoutResetButton?.addEventListener("click", () => {
  state.dashboardLayout = normalizeDashboardLayout(undefined);
  saveState();
  showOperationToast("레이아웃 초기화", "기본 배치로 되돌렸습니다");
});

// auth 이벤트: 상태 갱신 → 데이터/알림 로드 → 렌더 → 자동 가격 갱신.
window.addEventListener("stocklio:auth", (event) => {
  authState = event.detail;
  renderAuth();
  Promise.all([loadState(), loadNotificationState()]).then(([nextState]) => {
    state = nextState;
    render();
    if (authState.signedIn) setStatus("포트폴리오 동기화됨", authState.user?.email || "");
    queueAutomaticPriceRefresh();
  });
});

// ─── 로그인/로그아웃 핸들러 ───────────────────────────────────────
function handleGoogleLogin() {
  if (isEmbeddedBrowser()) {
    closeLoginDialog();
    openEmailLoginDialog();
    setStatus("Google 로그인 제한", "네이버 앱에서는 네이버 로그인 또는 이메일 로그인을 사용하세요");
    showOperationToast("Google 로그인 제한", "현재 브라우저에서는 Google 정책상 로그인이 차단될 수 있어 이메일 로그인을 열었습니다", "warning");
    return;
  }
  closeLoginDialog();
  window.StocklioAuth?.signInWithGoogle?.().catch((error) => {
    setStatus("로그인 실패", error.message);
    showOperationToast("Google 로그인 실패", error.message, "error");
  });
}

function handleNaverLogin() {
  closeLoginDialog();
  window.StocklioAuth?.signInWithNaver?.().catch((error) => {
    setStatus("네이버 로그인 실패", error.message);
    showOperationToast("네이버 로그인 실패", "Supabase Custom OAuth Provider 설정을 확인하세요", "error");
  });
}

function handleLogout() {
  setStatus("로그아웃 중", "세션을 정리하고 있습니다");
  window.StocklioAuth?.signOut?.()
    .then(() => {
      localStorage.removeItem(STORAGE_KEY);
      setStatus("로그아웃 완료", "다시 로그인할 수 있습니다");
    })
    .catch((error) => {
      setStatus("로그아웃 실패", error.message);
    });
}

async function sendEmailLoginLink(email) {
  try {
    await window.StocklioAuth?.signInWithEmail?.(email);
    closeEmailLoginDialog();
    setStatus("이메일 확인", `${email}로 로그인 링크를 보냈습니다`);
    showOperationToast("로그인 링크 전송", "메일함에서 Stocklio 로그인 링크를 열어주세요", "success");
  } catch (error) {
    setStatus("이메일 로그인 실패", error.message);
    showOperationToast("이메일 로그인 실패", error.message, "error");
  }
}

function isEmbeddedBrowser() {
  const userAgent = navigator.userAgent || "";
  return /NAVER|KAKAOTALK|KAKAOSTORY|Instagram|FBAN|FBAV|Line\//i.test(userAgent);
}

// ─── 통화 모드 ────────────────────────────────────────────────────
function applyCurrencyMode(mode) {
  currencyMode = mode === "usd" ? "usd" : "krw";
  localStorage.setItem("currencyMode", currencyMode);
  useStore.getState().setCurrencyMode(currencyMode);
  window.dispatchEvent(new CustomEvent("currencyModeChange", { detail: currencyMode }));
}

// ─── load / save / normalize ──────────────────────────────────────
function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (window.StocklioAuth?.isConfigured?.() && window.StocklioAuth.getState().signedIn) {
    return window.StocklioAuth.loadPortfolioState()
      .then((remoteState) => {
        const normalized = remoteState ? normalizeState(remoteState) : createEmptyState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        syncState = { status: "idle", message: "" };
        return normalized;
      })
      .catch((error) => {
        setStatus("데이터 불러오기 실패", error.message);
        syncState = { status: "failed", message: "동기화 실패" };
        if (stored) {
          try {
            return normalizeState(JSON.parse(stored));
          } catch {
            return createEmptyState();
          }
        }
        return createEmptyState();
      });
  }
  if (isStaticDeployment()) {
    // Supabase 설정이 있지만 로그아웃 상태 → 데이터 노출 금지
    if (window.StocklioAuth?.isConfigured?.()) {
      return Promise.resolve(structuredClone(sampleState));
    }
    if (!stored) {
      return Promise.resolve(structuredClone(sampleState));
    }
    try {
      return Promise.resolve(normalizeState(JSON.parse(stored)));
    } catch {
      return Promise.resolve(structuredClone(sampleState));
    }
  }
  return fetchJson("/api/state")
    .then((serverState) => {
      const normalized = normalizeState(serverState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    })
    .catch(() => {
      if (!stored) {
        return structuredClone(sampleState);
      }
      try {
        return normalizeState(JSON.parse(stored));
      } catch {
        return structuredClone(sampleState);
      }
    });
}

function normalizeState(input) {
  const fallback = structuredClone(sampleState);
  if (!input || typeof input !== "object") {
    return fallback;
  }
  if (Number(input.version || 0) > DATA_VERSION) {
    return input;
  }
  return {
    ...fallback,
    ...input,
    version: DATA_VERSION,
    fxRate: input.fxRate || fallback.fxRate,
    holdings: (Array.isArray(input.holdings) ? input.holdings : fallback.holdings).map((holding) => ({
      ...holding,
      accountType: normalizeAccountType(holding.accountType),
      strategy: normalizeStrategy(holding.strategy),
    })),
    cashFlows: Array.isArray(input.cashFlows) ? input.cashFlows : fallback.cashFlows,
    cashBalances: Array.isArray(input.cashBalances) ? input.cashBalances : fallback.cashBalances,
    accounts: normalizeAccounts(input, makeId),
    dashboardLayout: normalizeDashboardLayout(input.dashboardLayout),
    accountSnapshots: Array.isArray(input.accountSnapshots) ? input.accountSnapshots : fallback.accountSnapshots,
    priceUpdateLogs: Array.isArray(input.priceUpdateLogs) ? input.priceUpdateLogs : fallback.priceUpdateLogs,
    lastPriceRefreshImpact: input.lastPriceRefreshImpact || fallback.lastPriceRefreshImpact,
    portfolioSnapshots: Array.isArray(input.portfolioSnapshots) ? input.portfolioSnapshots : fallback.portfolioSnapshots,
    automation: {
      ...fallback.automation,
      ...(input.automation || {}),
    },
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  publishState();
  if (window.StocklioAuth?.isConfigured?.() && window.StocklioAuth.getState().signedIn) {
    setSyncState("saving", "저장 중");
    window.StocklioAuth.savePortfolioState(state)
      .then(() => setSyncState("synced", "저장됨"))
      .catch((error) => {
        setSyncState("failed", "저장 실패");
        setStatus("Supabase 저장 실패", error.message);
      });
    return;
  }
  if (isStaticDeployment()) {
    return;
  }
  fetch("/api/state", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(state),
  }).catch((error) => {
    setStatus("서버 저장 실패", error.message);
  });
}

function isStaticDeployment() {
  return !["localhost", "127.0.0.1", ""].includes(window.location.hostname);
}

// ─── 부트스트랩 ───────────────────────────────────────────────────
async function initialize() {
  clearStaleQuoteCaches();
  // automation-view 서비스 모듈에 주입하는 ctx (DOM 렌더 없이 op 만 담당).
  const ctx = {
    getState: () => state,
    saveState,
    render,
    makeId,
    todayKey,
    setStatus,
    setActionState,
    showOperationToast,
    getTotals,
    unique,
    setState: (s) => { state = s; },
    loadState,
    normalizeState,
    get authState() { return authState; },
    setNotificationState: (payload) => useStore.getState().setNotification(payload),
  };
  initAutomationView(ctx);
  try {
    authState = await waitForAuthState();
    [state] = await Promise.all([loadState(), loadNotificationState()]);
    render();
    setView(activeView, { replaceHistory: true });
    renderAuth();
    if (authState.signedIn) setStatus("포트폴리오 불러옴", authState.user?.email || "");
    queueAutomaticPriceRefresh();
  } catch {
    state = structuredClone(sampleState);
    render();
    setView(activeView, { replaceHistory: true });
    setStatus("샘플 데이터 불러옴", "서버 저장소를 사용할 수 없습니다");
  }
}

// ─── 렌더(=store 발행) ────────────────────────────────────────────
function render() {
  // 모든 탭은 React 가 store 구독으로 렌더한다. 여기서는 브리지 발행 + auth/empty-notice 만 갱신.
  renderEmptyPortfolioNotice();
  publishState();
  renderAuth();
}

function renderAuth() {
  const configured = window.StocklioAuth?.isConfigured?.() || false;
  authState = window.StocklioAuth?.getState?.() || authState;
  useStore.getState().setAuth({
    configured,
    signedIn: Boolean(authState.signedIn),
    user: authState.user || null,
  });
  if (!configured || !authState.signedIn) {
    setSyncState("idle", "");
  } else {
    closeLoginDialog();
    renderSyncStatus();
  }
}

function renderEmptyPortfolioNotice() {
  if (!els.emptyPortfolioNotice) {
    return;
  }
  const hasUserData =
    state.holdings.length > 0 ||
    state.accounts.length > 0 ||
    state.cashBalances.length > 0 ||
    state.cashFlows.length > 0 ||
    state.portfolioSnapshots.length > 0;
  els.emptyPortfolioNotice.hidden = hasUserData || activeView !== "dashboard";
}

// ─── 다이얼로그 (store 로 open 상태 push) ─────────────────────────
function openLoginDialog() { useStore.getState().setLoginDialog(true); }
function closeLoginDialog() { useStore.getState().setLoginDialog(false); }
function openEmailLoginDialog() {
  useStore.getState().setLoginDialog(false);
  useStore.getState().setEmailDialog(true, authState.user?.email || "");
}
function closeEmailLoginDialog() { useStore.getState().setEmailDialog(false); }

// ─── sync 상태 ────────────────────────────────────────────────────
let syncClearTimer = null;
function setSyncState(status, message) {
  syncState = { status, message };
  renderSyncStatus();
  if (syncClearTimer) clearTimeout(syncClearTimer);
  if (status === "synced") {
    syncClearTimer = setTimeout(() => {
      syncState = { status: "idle", message: "" };
      renderSyncStatus();
    }, 1500);
  }
}

function renderSyncStatus() {
  useStore.getState().setSync({ status: syncState.status, message: syncState.message });
}

function waitForAuthState() {
  return new Promise((resolve) => {
    if (window.StocklioAuth) {
      resolve(window.StocklioAuth.getState());
      return;
    }
    const timer = setTimeout(() => resolve(authState), AUTH_READY_TIMEOUT_MS);
    window.addEventListener("stocklio:auth", (event) => {
      clearTimeout(timer);
      resolve(event.detail);
    }, { once: true });
  });
}

// ─── 브리지: state → Zustand 스토어 미러 ──────────────────────────
function publishState() {
  window.StocklioApp = {
    getState: () => structuredClone(state),
    setDashboardLayout: (layout) => {
      state.dashboardLayout = normalizeDashboardLayout(layout);
      saveState();
      publishState();
    },
  };
  window.dispatchEvent(new CustomEvent("stocklio:state", { detail: structuredClone(state) }));
}

// ─── 뷰 전환 (store + hash 동기화) ────────────────────────────────
function setView(view, { fromHistory = false, replaceHistory = false } = {}) {
  if (!VIEW_IDS.includes(view)) {
    view = "dashboard";
  }
  activeView = view;
  if (!fromHistory && window.location.hash.slice(1) !== view) {
    if (replaceHistory) {
      window.history.replaceState(null, "", `#${view}`);
    } else {
      window.history.pushState(null, "", `#${view}`);
    }
  }
  const copy = viewCopy[view] || viewCopy.dashboard;
  useStore.getState().setActiveView(view, copy.title, copy.subtitle);
  els.viewSections.forEach((section) => {
    const isActive = section.dataset.view === view;
    section.hidden = !isActive;
    section.inert = !isActive;
    if (isActive) {
      section.dataset.entering = "";
      setTimeout(() => delete section.dataset.entering, 500);
    }
  });
  renderEmptyPortfolioNotice();
}

// ─── 도메인/유틸 (automation-view ctx 및 액션에서 사용) ────────────
function getTotals(holdings) {
  return calculateTotals({
    holdings: holdings || state.holdings,
    cashBalances: state.cashBalances,
    fxRate: state.fxRate.rate,
  });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function normalizeStrategy(value) {
  const label = String(value || "").trim();
  if (!label) {
    return "기타";
  }
  if (["Growth", "성장주", "Core", "코어"].includes(label)) {
    return "기타";
  }
  if (label.toLowerCase() === "schd") {
    return "SCHD";
  }
  return DEFAULT_STRATEGIES.includes(label) ? label : label;
}

function makeId() {
  return crypto.randomUUID();
}

function setStatus(status, detail) {
  useStore.getState().setStatus({ title: status, detail });
}

function setActionState(kind, isRunning) {
  if (kind === "price" && els.dashboardRefreshButton) {
    els.dashboardRefreshButton.disabled = isRunning;
    els.dashboardRefreshButton.textContent = isRunning ? "확인 중..." : "시세 확인";
  }
}

function showOperationToast(title, detail, tone = "info") {
  window.clearTimeout(toastTimer);
  useStore.getState().setToast({ visible: true, title, detail, tone });
  toastTimer = window.setTimeout(() => {
    useStore.getState().setToast({ visible: false });
  }, tone === "busy" ? 2200 : 4200);
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function initializeStocklioApp() {
  initialize();
}
