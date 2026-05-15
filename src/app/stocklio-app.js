import {
  accountKeyFor,
  getKnownAccounts as getKnownAccountsFromState,
  isAccountInUse as isAccountInUseInState,
  isUnclassifiedCash,
  normalizeAccounts,
  parseAccountKey,
  renameAccountReferences,
} from "./accounts.js";
import {
  AUTH_READY_TIMEOUT_MS,
  AUTO_PRICE_REFRESH_TTL_MS,
  dashboardCardLabels,
  dashboardSizeToSpan,
  DATA_VERSION,
  DEFAULT_CASH_FLOW_SORT,
  DEFAULT_HOLDING_SORT,
  defaultDashboardLayout,
  palette,
  STORAGE_KEY,
  viewCopy,
} from "./constants.js";
import { accountTypeLabels, formatAccountType, normalizeAccountType } from "./account-types.js";
import {
  escapeHtml,
  formatAsOf,
  formatChartLabel,
  formatCompactKrw,
  formatKrw,
  formatMoney,
  formatNumber,
  formatPercent,
  formatShortDate,
} from "./formatters.js";
import {
  filterSnapshotRows,
  getAccountPerformanceRows as selectAccountPerformanceRows,
  getMonthlyRows as selectMonthlyRows,
  getNumbersChartSource,
  getPerformanceStats,
  getSnapshotRows as selectSnapshotRows,
} from "./performance-selectors.js";
import { cycleSortValue, parseSortValue } from "./sort.js";
import { createEmptyState, createSampleState } from "./state-factory.js";
import { getDomElements } from "./dom-elements.js";
import {
  getDailyMoveRows as selectDailyMoveRows,
  getHoldingDailyMove as selectHoldingDailyMove,
} from "./daily-move-selectors.js";
import { fetchJson, getQuote, getUsdKrw } from "./services/market-data-service.js";
import {
  buildAccountSnapshots as createAccountSnapshots,
  buildPortfolioSnapshot as createPortfolioSnapshot,
  getCashValueKrw as calculateCashValueKrw,
  getExternalFlowAmount as calculateExternalFlowAmount,
  getHoldingValues as calculateHoldingValues,
  getNetInflowKrw as calculateNetInflowKrw,
  getTotals as calculateTotals,
  groupByAccount as calculateGroupByAccount,
} from "../domain/portfolio-core.js";

let holdingHeaderSort = { key: "value", dir: "desc" };
let cashFlowHeaderSort = { key: "date", dir: "desc" };

const sampleState = createSampleState(makeId);

let state = createEmptyState();
let editingHoldingId = null;
let editingCashFlowId = null;
let editingCashBalanceId = null;
let editingAccountId = null;
let isLayoutEditing = false;
let draggedDashboardCardId = null;
let resizingDashboardCard = null;
let numbersPerformanceChart = null;
let priceRefreshPromise = null;
let snapshotSavePromise = null;
let toastTimer = null;
let authState = {
  configured: false,
  signedIn: false,
  user: null,
};
let activeView = "dashboard";
let syncState = {
  status: "idle",
  message: "",
};

const els = getDomElements();

els.viewTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.viewTab);
  });
});

els.refreshButton.addEventListener("click", () => {
  refreshPrices({ reason: "manual" }).catch((error) => {
    setStatus("가격 업데이트 실패", error.message);
  });
});

els.saveSnapshotButton.addEventListener("click", () => {
  saveTodaySnapshot({ reason: "manual" }).catch((error) => {
    setStatus("오늘 성과 기록 실패", error.message);
    showOperationToast("오늘 성과 기록 실패", error.message, "error");
  });
});

els.emptyPortfolioButton.addEventListener("click", () => {
  const ok = window.confirm("현재 포트폴리오 데이터를 비우고 빈 상태로 시작할까요?");
  if (!ok) {
    return;
  }
  state = createEmptyState();
  isLayoutEditing = false;
  saveState();
  render();
  setStatus("빈 포트폴리오로 전환했습니다", "보유 종목, 계좌, 예수금을 새로 입력하세요");
});

els.googleLoginButton.addEventListener("click", () => {
  window.StocklioAuth?.signInWithGoogle?.().catch((error) => setStatus("로그인 실패", error.message));
});

els.logoutButton.addEventListener("click", () => {
  window.StocklioAuth?.signOut?.().catch((error) => setStatus("로그아웃 실패", error.message));
});

window.addEventListener("stocklio:auth", (event) => {
  authState = event.detail;
  renderAuth();
  loadState().then((nextState) => {
    state = nextState;
    render();
    setStatus(authState.signedIn ? "포트폴리오 불러옴" : "브라우저 저장", authState.user?.email || "현재 기기에 저장됩니다");
    queueAutomaticPriceRefresh();
  });
});

els.resetButton.addEventListener("click", () => {
  state = structuredClone(sampleState);
  isLayoutEditing = false;
  saveState();
  render();
  setStatus("샘플 데이터를 불러왔습니다", "실제 포트폴리오는 보유 종목과 계좌에서 직접 입력하세요");
});

els.layoutEditButton.addEventListener("click", () => {
  if (window.STOCKLIO_USE_CRAFT) {
    return;
  }
  isLayoutEditing = !isLayoutEditing;
  renderDashboardLayout();
});

els.layoutResetButton.addEventListener("click", () => {
  if (window.STOCKLIO_USE_CRAFT) {
    return;
  }
  state.dashboardLayout = structuredClone(defaultDashboardLayout);
  isLayoutEditing = false;
  saveState();
  renderDashboardLayout();
  setStatus("대시보드 레이아웃 복원", "기본 카드 배치로 되돌렸습니다");
});

els.dashboardBoard.addEventListener("click", (event) => {
  const button = event.target.closest("[data-layout-action]");
  if (!button) {
    return;
  }
  handleDashboardLayoutAction(button.dataset.layoutAction, button.dataset.layoutCard);
});

els.dashboardBoard.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-layout-resize]");
  if (!isLayoutEditing || !handle) {
    return;
  }
  const card = handle.closest("[data-dashboard-card]");
  const item = normalizeDashboardLayout(state.dashboardLayout).find((layoutItem) => layoutItem.id === card?.dataset.dashboardCard);
  if (!card || !item) {
    return;
  }
  event.preventDefault();
  resizingDashboardCard = {
    id: item.id,
    startX: event.clientX,
    startY: event.clientY,
    startSpan: item.span,
    startHeight: card.getBoundingClientRect().height,
  };
  card.classList.add("is-resizing");
  card.draggable = false;
  window.addEventListener("pointermove", handleDashboardResizeMove);
  window.addEventListener("pointerup", finishDashboardResize, { once: true });
});

els.dashboardBoard.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-dashboard-card]");
  if (!isLayoutEditing || !card || event.target.closest("button, input, select, textarea")) {
    event.preventDefault();
    return;
  }
  draggedDashboardCardId = card.dataset.dashboardCard;
  card.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedDashboardCardId);
});

els.dashboardBoard.addEventListener("dragover", (event) => {
  if (!isLayoutEditing || !draggedDashboardCardId) {
    return;
  }
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const target = getDashboardDropTarget(event);
  els.dashboardBoard.querySelectorAll(".is-drag-over").forEach((card) => card.classList.remove("is-drag-over", "is-drop-after"));
  if (target) {
    target.classList.add("is-drag-over");
    target.classList.toggle("is-drop-after", shouldDropAfter(event, target));
  }
});

els.dashboardBoard.addEventListener("drop", (event) => {
  if (!isLayoutEditing || !draggedDashboardCardId) {
    return;
  }
  event.preventDefault();
  const target = getDashboardDropTarget(event);
  reorderDashboardLayout(draggedDashboardCardId, target?.dataset.dashboardCard, target ? shouldDropAfter(event, target) : true);
  clearDashboardDragState();
});

els.dashboardBoard.addEventListener("dragend", () => {
  clearDashboardDragState();
});

for (const filter of [els.investorFilter, els.strategyFilter, els.accountTypeFilter, els.holdingSort]) {
  filter.addEventListener("change", () => {
    if (filter === els.holdingSort) {
      holdingHeaderSort = parseSortValue(els.holdingSort.value, DEFAULT_HOLDING_SORT);
      renderSortHeaders();
    }
    renderHoldings();
  });
}

document.querySelectorAll("[data-holding-sort-key]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextSort = cycleSortValue(els.holdingSort.value, button.dataset.holdingSortKey, DEFAULT_HOLDING_SORT);
    els.holdingSort.value = nextSort;
    holdingHeaderSort = parseSortValue(nextSort, DEFAULT_HOLDING_SORT);
    renderSortHeaders();
    renderHoldings();
  });
});

els.holdingSearch.addEventListener("input", renderHoldings);

els.addHoldingButton.addEventListener("click", () => {
  editingHoldingId = null;
  els.holdingForm.reset();
  els.holdingFormPanel.hidden = false;
  updateEditControls();
  renderAccountSelectors();
  renderHoldings();
  setView("holdings");
  els.holdingFormPanel.scrollIntoView({ block: "center", behavior: "smooth" });
  els.holdingForm.elements.accountKey.focus();
});

els.performanceRange.addEventListener("change", () => {
  renderPerformance();
  renderSnapshots();
  renderMonthlySummary();
});

els.cashFlowTypeFilter.addEventListener("change", renderCashFlows);
els.cashFlowSort.addEventListener("change", () => {
  cashFlowHeaderSort = parseSortValue(els.cashFlowSort.value, DEFAULT_CASH_FLOW_SORT);
  renderSortHeaders();
  renderCashFlows();
});
document.querySelectorAll("[data-flow-sort-key]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextSort = cycleSortValue(els.cashFlowSort.value, button.dataset.flowSortKey, DEFAULT_CASH_FLOW_SORT);
    els.cashFlowSort.value = nextSort;
    cashFlowHeaderSort = parseSortValue(nextSort, DEFAULT_CASH_FLOW_SORT);
    renderSortHeaders();
    renderCashFlows();
  });
});

els.accountDetailSelect.addEventListener("change", renderAccountDetail);

els.accountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const nextAccount = {
    id: editingAccountId || makeId(),
    investor: String(form.get("investor")).trim(),
    account: String(form.get("account")).trim(),
    provider: String(form.get("provider")).trim(),
    accountType: normalizeAccountType(String(form.get("accountType"))),
    baseCurrency: String(form.get("baseCurrency")),
  };
  if (editingAccountId) {
    const previous = state.accounts.find((account) => account.id === editingAccountId) || getKnownAccounts().find((account) => account.id === editingAccountId);
    const hasPersistedAccount = state.accounts.some((account) => account.id === editingAccountId);
    state.accounts = hasPersistedAccount
      ? state.accounts.map((account) => (account.id === editingAccountId ? nextAccount : account))
      : [...state.accounts, nextAccount];
    if (previous) {
      state = renameAccountReferences(state, previous, nextAccount);
    }
  } else {
    state.accounts.push(nextAccount);
  }
  editingAccountId = null;
  event.currentTarget.reset();
  updateEditControls();
  saveState();
  render();
  setStatus("계좌 저장", `${nextAccount.investor} · ${nextAccount.account}`);
});

els.holdingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const account = parseAccountKey(form.get("accountKey"));
  const ticker = String(form.get("ticker")).trim().toUpperCase();
  const name = ticker || String(form.get("strategy"));
  const existingHolding = editingHoldingId ? state.holdings.find((holding) => holding.id === editingHoldingId) : null;
  const averageCost = Number(form.get("averageCost"));
  const currency = existingHolding?.currency || (/^[0-9]{6}\.KS$/.test(ticker) ? "KRW" : "USD");
  const nextHolding = {
    id: editingHoldingId || makeId(),
    investor: account.investor,
    account: account.account,
    accountType: normalizeAccountType(String(form.get("accountType"))),
    strategy: String(form.get("strategy")),
    ticker: ticker || name,
    name,
    quantity: Number(form.get("quantity")),
    averageCost,
    price: existingHolding?.price ?? averageCost,
    currency,
    priceSource: existingHolding?.priceSource || "사용자 입력",
    priceAsOf: existingHolding?.priceAsOf || new Date().toISOString(),
    autoPrice: existingHolding?.autoPrice ?? true,
  };
  if (editingHoldingId) {
    state.holdings = state.holdings.map((holding) => (holding.id === editingHoldingId ? { ...holding, ...nextHolding } : holding));
  } else {
    state.holdings.push(nextHolding);
  }
  editingHoldingId = null;
  event.currentTarget.reset();
  els.holdingFormPanel.hidden = true;
  updateEditControls();
  saveState();
  render();
  setStatus("보유 종목 저장", `${nextHolding.name} · ${nextHolding.account}`);
});

els.cashFlowForm.date.value = todayKey();

els.cashFlowForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const account = parseAccountKey(form.get("accountKey"));
  const nextFlow = {
    id: editingCashFlowId || makeId(),
    date: String(form.get("date")),
    investor: account.investor,
    account: account.account,
    type: String(form.get("type")),
    amountKrw: Number(form.get("amountKrw")),
    note: String(form.get("note")).trim(),
  };
  if (editingCashFlowId) {
    state.cashFlows = state.cashFlows.map((flow) => (flow.id === editingCashFlowId ? nextFlow : flow));
  } else {
    state.cashFlows.push(nextFlow);
  }
  editingCashFlowId = null;
  event.currentTarget.reset();
  els.cashFlowForm.date.value = todayKey();
  updateEditControls();
  saveState();
  render();
  setStatus("입출금 기록 저장", "다음 스냅샷부터 투자손익 계산에 반영");
});

els.cashBalanceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const account = parseAccountKey(form.get("accountKey"));
  const nextCash = {
    id: editingCashBalanceId || makeId(),
    investor: account.investor,
    account: account.account,
    currency: String(form.get("currency")),
    amount: Number(form.get("amount")),
    asOf: todayKey(),
    source: editingCashBalanceId ? "사용자 수정" : "사용자 입력",
  };
  if (editingCashBalanceId) {
    state.cashBalances = state.cashBalances.map((cash) => (cash.id === editingCashBalanceId ? nextCash : cash));
  } else {
    state.cashBalances.push(nextCash);
  }
  editingCashBalanceId = null;
  event.currentTarget.reset();
  updateEditControls();
  saveState();
  render();
  setStatus("예수금 저장", "총자산과 다음 스냅샷에 반영");
});

els.holdingCancel.addEventListener("click", () => cancelEdit("holding"));
els.cashFlowCancel.addEventListener("click", () => cancelEdit("cashFlow"));
els.cashBalanceCancel.addEventListener("click", () => cancelEdit("cashBalance"));
els.accountCancel.addEventListener("click", () => cancelEdit("account"));

els.cashAllocationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const [investor, account] = String(form.get("targetAccount")).split("|||");
  const allocated = allocateUnclassifiedCash({
    investor,
    account,
    amount: Number(form.get("amount")),
  });
  event.currentTarget.reset();
  saveState();
  render();
  setStatus("미분류 예수금 배분", `${investor} · ${account}에 ${formatKrw(allocated)} 반영`);
});

els.exportBackupButton.addEventListener("click", () => {
  exportBackup();
});

els.restoreInput.addEventListener("change", (event) => {
  restoreBackup(event.target.files?.[0]).finally(() => {
    event.target.value = "";
  });
});

els.importPreviewInput.addEventListener("change", (event) => {
  previewImport(event.target.files?.[0]).finally(() => {
    event.target.value = "";
  });
});

els.commitImportButton.addEventListener("click", () => {
  commitImport();
});

els.loadImportSummaryButton.addEventListener("click", () => {
  loadImportSummary();
});

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (window.StocklioAuth?.isConfigured?.() && window.StocklioAuth.getState().signedIn) {
    return window.StocklioAuth.loadPortfolioState()
      .then((remoteState) => {
        const normalized = remoteState ? normalizeState(remoteState) : createEmptyState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        syncState = remoteState ? { status: "synced", message: "저장됨" } : { status: "idle", message: "" };
        return normalized;
      })
      .catch((error) => {
        setStatus("Supabase 불러오기 실패", error.message);
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

async function initialize() {
  try {
    configureRuntimeSurface();
    authState = await waitForAuthState();
    state = await loadState();
    render();
    renderAuth();
    setStatus(authState.signedIn ? "Supabase 데이터 불러옴" : "데이터 불러옴", authState.user?.email || state.automation?.lastResult || "저장소와 연결됨");
    queueAutomaticPriceRefresh();
  } catch {
    state = structuredClone(sampleState);
    render();
    setStatus("샘플 데이터 불러옴", "서버 저장소를 사용할 수 없습니다");
  }
}

function configureRuntimeSurface() {
  if (!isStaticDeployment()) {
    return;
  }
  document.querySelectorAll("[data-local-only]").forEach((element) => {
    element.hidden = true;
  });
  if (els.importSummary) {
    els.importSummary.textContent = "Numbers import는 로컬 마이그레이션 전용입니다";
  }
  if (els.backupStatus) {
    els.backupStatus.textContent = "JSON 백업과 복원은 현재 브라우저 포트폴리오에 적용됩니다";
  }
}

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `holding-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(state),
  }).catch((error) => {
    setStatus("서버 저장 실패", error.message);
  });
}

function isStaticDeployment() {
  return !["localhost", "127.0.0.1", ""].includes(window.location.hostname);
}

function render() {
  renderFilters();
  renderAccountSelectors();
  renderSortHeaders();
  updateEditControls();
  renderSummary();
  renderAllocation();
  renderPerformance();
  renderBreakdown();
  renderAccounts();
  renderAccountSummary();
  renderAccountDetail();
  renderSnapshots();
  renderMonthlySummary();
  renderHoldings();
  renderCashFlows();
  renderCashBalances();
  renderAutomation();
  renderPriceLogs();
  renderReconciliation();
  renderDashboardLayout();
  renderEmptyPortfolioNotice();
  publishState();
  renderAuth();
}

function renderAuth() {
  if (!els.authStatus) {
    return;
  }
  const configured = window.StocklioAuth?.isConfigured?.() || false;
  authState = window.StocklioAuth?.getState?.() || authState;
  if (!configured) {
    els.authStatus.textContent = "";
    setSyncState("idle", "");
    els.googleLoginButton.disabled = true;
    els.googleLoginButton.hidden = false;
    els.logoutButton.hidden = true;
    return;
  }
  if (authState.signedIn) {
    els.authStatus.textContent = authState.user?.name || authState.user?.email || "";
    els.googleLoginButton.hidden = true;
    els.logoutButton.hidden = false;
    renderSyncStatus();
    return;
  }
  els.authStatus.textContent = "";
  setSyncState("idle", "");
  els.googleLoginButton.disabled = false;
  els.googleLoginButton.hidden = false;
  els.logoutButton.hidden = true;
}

function setSyncState(status, message) {
  syncState = { status, message };
  renderSyncStatus();
}

function renderSyncStatus() {
  if (!els.syncStatus) {
    return;
  }
  const shouldShow = authState.signedIn && syncState.message;
  els.syncStatus.hidden = !shouldShow;
  els.syncStatus.textContent = syncState.message;
  els.syncStatus.dataset.syncStatus = syncState.status;
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

function waitForAuthState() {
  return new Promise((resolve) => {
    if (window.StocklioAuth) {
      resolve(window.StocklioAuth.getState());
      return;
    }
    const timer = setTimeout(() => resolve(authState), AUTH_READY_TIMEOUT_MS);
    window.addEventListener(
      "stocklio:auth",
      (event) => {
        clearTimeout(timer);
        resolve(event.detail);
      },
      { once: true },
    );
  });
}

function publishState() {
  window.StocklioApp = {
    getState: () => structuredClone(state),
    setDashboardLayout: (layout) => {
      state.dashboardLayout = normalizeDashboardLayout(layout);
      saveState();
      renderDashboardLayout();
      publishState();
    },
  };
  window.dispatchEvent(new CustomEvent("stocklio:state", { detail: structuredClone(state) }));
}

function setView(view) {
  if (activeView === "holdings" && view !== "holdings") {
    editingHoldingId = null;
    els.holdingFormPanel.hidden = true;
    els.holdingForm.reset();
    renderHoldings();
  }
  activeView = view;
  const copy = viewCopy[view] || viewCopy.dashboard;
  if (els.pageTitle) {
    els.pageTitle.textContent = copy.title;
  }
  if (els.pageSubtitle) {
    els.pageSubtitle.textContent = copy.subtitle;
  }
  els.viewTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTab === view);
  });
  els.viewSections.forEach((section) => {
    section.hidden = section.dataset.view !== view;
  });
  renderEmptyPortfolioNotice();
}

function normalizeDashboardLayout(layout) {
  const knownIds = new Set(defaultDashboardLayout.map((item) => item.id));
  const defaults = new Map(defaultDashboardLayout.map((item) => [item.id, item]));
  const seen = new Set();
  const normalized = [];
  for (const item of Array.isArray(layout) ? layout : []) {
    if (!item || !knownIds.has(item.id) || seen.has(item.id)) {
      continue;
    }
    const fallback = defaults.get(item.id);
    const span = normalizeDashboardSpan(item, fallback);
    normalized.push({
      id: item.id,
      widthPct: normalizeDashboardWidth(item, fallback, span),
      span,
      minHeight: normalizeDashboardHeight(item, fallback),
      visible: item.visible !== false,
    });
    seen.add(item.id);
  }
  for (const fallback of defaultDashboardLayout) {
    if (!seen.has(fallback.id)) {
      normalized.push({ ...fallback });
    }
  }
  return normalized;
}

function renderDashboardLayout() {
  if (window.STOCKLIO_USE_CRAFT) {
    return;
  }
  state.dashboardLayout = normalizeDashboardLayout(state.dashboardLayout);
  const cards = new Map(
    [...els.dashboardBoard.querySelectorAll("[data-dashboard-card]")].map((card) => [card.dataset.dashboardCard, card]),
  );
  let visibleCount = 0;
  for (const item of state.dashboardLayout) {
    const card = cards.get(item.id);
    if (!card) {
      continue;
    }
    const isHidden = item.visible === false;
    visibleCount += isHidden ? 0 : 1;
    card.style.setProperty("--card-span", String(item.span));
    card.style.setProperty("--card-width-pct", `${item.widthPct}%`);
    card.style.setProperty("--card-min-height", `${item.minHeight}px`);
    card.hidden = isHidden && !isLayoutEditing;
    card.draggable = isLayoutEditing;
    card.classList.toggle("is-hidden-card", isHidden && isLayoutEditing);
    card.classList.toggle("is-layout-editing", isLayoutEditing);
    card.querySelector(".layout-controls")?.remove();
    if (isLayoutEditing) {
      card.prepend(createLayoutControls(item));
    }
    els.dashboardBoard.appendChild(card);
  }
  els.layoutStatus.textContent = isLayoutEditing
    ? `${visibleCount}/${state.dashboardLayout.length} 카드`
    : "";
  els.layoutEditButton.textContent = isLayoutEditing ? "완료" : "편집";
  els.layoutResetButton.hidden = !isLayoutEditing;
}

function createLayoutControls(item) {
  const controls = document.createElement("div");
  controls.className = "layout-controls";
  controls.setAttribute("aria-label", `${dashboardCardLabels[item.id] || item.id} 레이아웃 편집`);
  const visibilityLabel = item.visible === false ? "표시" : "숨김";
  controls.innerHTML = `
    <span class="layout-drag-handle">이동</span>
    <span class="layout-card-label">${escapeHtml(dashboardCardLabels[item.id] || item.id)}</span>
    <span class="layout-size-readout">${item.span}/12 · ${Math.round(item.minHeight)}px</span>
    <button class="ghost layout-visibility-button" type="button" data-layout-action="toggle" data-layout-card="${escapeHtml(item.id)}">${visibilityLabel}</button>
    <span class="layout-resize-handle" data-layout-resize="${escapeHtml(item.id)}" aria-label="카드 크기 조절"></span>
  `;
  return controls;
}

function handleDashboardLayoutAction(action, id) {
  const layout = normalizeDashboardLayout(state.dashboardLayout);
  const index = layout.findIndex((item) => item.id === id);
  if (index < 0) {
    return;
  }
  if (action === "toggle") {
    layout[index].visible = layout[index].visible === false;
  }
  state.dashboardLayout = layout;
  saveState();
  renderDashboardLayout();
}

function normalizeDashboardSpan(item, fallback) {
  const migratedSpan = dashboardSizeToSpan[item.size] || fallback.span || 3;
  const span = Number(item.span ?? migratedSpan);
  return clamp(Math.round(span), 2, 12);
}

function normalizeDashboardWidth(item, fallback, span) {
  const width = Number(item.widthPct ?? fallback.widthPct ?? (span / 12) * 100);
  return clamp(Math.round(width * 10) / 10, 18, 100);
}

function normalizeDashboardHeight(item, fallback) {
  const height = Number(item.minHeight ?? fallback.minHeight ?? 180);
  return clamp(Math.round(height), 112, 720);
}

function handleDashboardResizeMove(event) {
  if (!resizingDashboardCard) {
    return;
  }
  const card = els.dashboardBoard.querySelector(`[data-dashboard-card="${CSS.escape(resizingDashboardCard.id)}"]`);
  if (!card) {
    return;
  }
  const columnWidth = getDashboardColumnWidth();
  const deltaColumns = columnWidth ? Math.round((event.clientX - resizingDashboardCard.startX) / columnWidth) : 0;
  const nextSpan = clamp(resizingDashboardCard.startSpan + deltaColumns, 2, 12);
  const nextHeight = clamp(resizingDashboardCard.startHeight + event.clientY - resizingDashboardCard.startY, 112, 720);
  card.style.setProperty("--card-span", String(nextSpan));
  card.style.setProperty("--card-min-height", `${Math.round(nextHeight)}px`);
  card.querySelector(".layout-size-readout").textContent = `${nextSpan}/12 · ${Math.round(nextHeight)}px`;
}

function finishDashboardResize(event) {
  if (!resizingDashboardCard) {
    return;
  }
  window.removeEventListener("pointermove", handleDashboardResizeMove);
  const columnWidth = getDashboardColumnWidth();
  const deltaColumns = columnWidth ? Math.round((event.clientX - resizingDashboardCard.startX) / columnWidth) : 0;
  const nextSpan = clamp(resizingDashboardCard.startSpan + deltaColumns, 2, 12);
  const nextHeight = clamp(resizingDashboardCard.startHeight + event.clientY - resizingDashboardCard.startY, 112, 720);
  const layout = normalizeDashboardLayout(state.dashboardLayout);
  const index = layout.findIndex((item) => item.id === resizingDashboardCard.id);
  if (index >= 0) {
    layout[index] = {
      ...layout[index],
      span: nextSpan,
      minHeight: Math.round(nextHeight),
    };
    state.dashboardLayout = layout;
    saveState();
  }
  const card = els.dashboardBoard.querySelector(`[data-dashboard-card="${CSS.escape(resizingDashboardCard.id)}"]`);
  card?.classList.remove("is-resizing");
  if (card) {
    card.draggable = isLayoutEditing;
  }
  resizingDashboardCard = null;
  renderDashboardLayout();
}

function getDashboardColumnWidth() {
  const styles = getComputedStyle(els.dashboardBoard);
  if (styles.gridTemplateColumns === "none") {
    return els.dashboardBoard.clientWidth;
  }
  const columns = styles.gridTemplateColumns.split(" ").filter(Boolean);
  const columnCount = columns.length || 1;
  const gap = Number.parseFloat(styles.columnGap || "0") || 0;
  return (els.dashboardBoard.clientWidth - gap * (columnCount - 1)) / columnCount + gap;
}

function getDashboardDropTarget(event) {
  const card = event.target.closest("[data-dashboard-card]");
  if (!card || card.dataset.dashboardCard === draggedDashboardCardId) {
    return null;
  }
  return card;
}

function shouldDropAfter(event, target) {
  const rect = target.getBoundingClientRect();
  const sameRowIntent = Math.abs(event.clientY - (rect.top + rect.height / 2)) < rect.height * 0.28;
  if (sameRowIntent) {
    return event.clientX > rect.left + rect.width / 2;
  }
  return event.clientY > rect.top + rect.height / 2;
}

function reorderDashboardLayout(sourceId, targetId, insertAfter) {
  if (!sourceId || sourceId === targetId) {
    return;
  }
  const layout = normalizeDashboardLayout(state.dashboardLayout);
  const sourceIndex = layout.findIndex((item) => item.id === sourceId);
  if (sourceIndex < 0) {
    return;
  }
  const [source] = layout.splice(sourceIndex, 1);
  const targetIndex = targetId ? layout.findIndex((item) => item.id === targetId) : -1;
  const insertIndex = targetIndex < 0 ? layout.length : targetIndex + (insertAfter ? 1 : 0);
  layout.splice(insertIndex, 0, source);
  state.dashboardLayout = layout;
  saveState();
  renderDashboardLayout();
}

function clearDashboardDragState() {
  draggedDashboardCardId = null;
  els.dashboardBoard.querySelectorAll(".is-dragging, .is-drag-over").forEach((card) => {
    card.classList.remove("is-dragging", "is-drag-over", "is-drop-after");
  });
}

function renderFilters() {
  fillSelect(els.investorFilter, "모든 투자자", unique(state.holdings.map((h) => h.investor)));
  fillSelect(els.strategyFilter, "모든 전략", unique(state.holdings.map((h) => h.strategy)));
  fillSelect(els.accountTypeFilter, "모든 계좌 유형", unique(state.holdings.map((h) => normalizeAccountType(h.accountType))), accountTypeLabels);
}

function fillSelect(select, label, values, labels = {}) {
  const previous = select.value;
  select.innerHTML = `<option value="">${label}</option>${values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(labels[value] || value)}</option>`)
    .join("")}`;
  select.value = values.includes(previous) ? previous : "";
}

function renderSortHeaders() {
  updateSortHeaderButtons("[data-holding-sort-key]", holdingHeaderSort, DEFAULT_HOLDING_SORT);
  updateSortHeaderButtons("[data-flow-sort-key]", cashFlowHeaderSort, DEFAULT_CASH_FLOW_SORT);
}

function updateSortHeaderButtons(selector, activeSort, fallback) {
  const fallbackSort = parseSortValue(fallback, fallback);
  document.querySelectorAll(selector).forEach((button) => {
    const key = button.dataset.holdingSortKey || button.dataset.flowSortKey;
    const isActive = activeSort.key === key && !(activeSort.key === fallbackSort.key && activeSort.dir === fallbackSort.dir && key !== fallbackSort.key);
    const direction = isActive ? activeSort.dir : "none";
    button.classList.toggle("is-sorted", direction !== "none");
    button.setAttribute("aria-sort", direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none");
    const indicator = button.querySelector(".sort-indicator");
    if (indicator) {
      indicator.textContent = direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕";
    }
  });
}

function renderAccountSelectors() {
  const accounts = getKnownAccounts();
  const options = accounts.map(accountOption).join("");
  for (const form of [els.holdingForm, els.cashFlowForm, els.cashBalanceForm]) {
    const select = form.elements.accountKey;
    const previous = select.value;
    select.innerHTML = `<option value="">계좌 선택</option>${options}`;
    select.value = accounts.some((account) => account.key === previous) ? previous : "";
  }
  const previousDetail = els.accountDetailSelect.value;
  els.accountDetailSelect.innerHTML = `<option value="">전체 계좌</option>${options}`;
  els.accountDetailSelect.value = accounts.some((account) => account.key === previousDetail) ? previousDetail : "";
}

function accountOption(account) {
  const type = ` · ${formatAccountType(account.accountType)}`;
  return `<option value="${escapeHtml(account.key)}">${escapeHtml(account.investor)} · ${escapeHtml(account.account)}${escapeHtml(type)}</option>`;
}

function renderSummary() {
  const totals = getTotals(state.holdings);
  els.totalValue.textContent = formatKrw(totals.valueKrw);
  els.totalValueKrw.textContent = `주식 ${formatKrw(totals.stockValueKrw)} · 예수금 ${formatKrw(totals.cashKrw)}`;
  els.totalCost.textContent = formatKrw(totals.costKrw);
  els.totalGain.textContent = formatKrw(totals.gainKrw);
  els.totalGain.className = totals.gainKrw >= 0 ? "positive" : "negative";
  els.totalReturn.textContent = formatPercent(totals.returnRate);
  els.totalReturn.className = totals.gainKrw >= 0 ? "positive" : "negative";
  els.cashTotal.textContent = formatKrw(totals.cashKrw);
  els.fxRate.textContent = formatNumber(state.fxRate.rate, 2);
  els.fxSource.textContent = `${state.fxRate.source} · ${formatAsOf(state.fxRate.asOf)}`;
}

function renderAllocation() {
  const grouped = getAllocationItems();
  renderDonut(grouped);
  const total = grouped.reduce((sum, item) => sum + item.value, 0);
  els.allocationLegend.innerHTML = grouped
    .map((item, index) => {
      const pct = total ? item.value / total : 0;
      return `<div class="legend-row">
        <span class="swatch" style="background:${palette[index % palette.length]}"></span>
        <span>${escapeHtml(item.label)}</span>
        <strong>${formatPercent(pct)}</strong>
      </div>`;
    })
    .join("");
}

function renderDonut(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const rings = items
    .map((item, index) => {
      const ratio = total ? item.value / total : 0;
      const dash = ratio * circumference;
      const ring = `<circle cx="110" cy="110" r="${radius}" fill="none" stroke="${palette[index % palette.length]}" stroke-width="28" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 110 110)" />`;
      offset += dash;
      return ring;
    })
    .join("");
  els.allocationDonut.innerHTML = `
    <circle cx="110" cy="110" r="${radius}" fill="none" stroke="#e6ebe5" stroke-width="28"></circle>
    ${rings}
    <text x="110" y="106" text-anchor="middle" font-size="19" font-weight="800" fill="#17211b">${items.length}</text>
    <text x="110" y="130" text-anchor="middle" font-size="12" fill="#66736b">전략</text>
  `;
}

function renderPerformance() {
  const points = getFilteredSnapshotRows().slice(-8);
  if (!points.length) {
    els.performanceStats.innerHTML = "";
    els.performanceChart.innerHTML = `<div class="empty-state">저장된 성과 스냅샷이 없습니다</div>`;
    renderPerformanceDetails([]);
    return;
  }
  const latest = points[points.length - 1];
  const first = points[0];
  const previous = points[points.length - 2];
  const periodChange = latest.totalValueKrw - first.totalValueKrw;
  const dailyChange = previous ? latest.totalValueKrw - previous.totalValueKrw : 0;
  els.performanceStats.innerHTML = `
    <div><span>최근 총자산</span><strong>${formatKrw(latest.totalValueKrw)}</strong></div>
    <div><span>최근 일 증감</span><strong class="${dailyChange >= 0 ? "positive" : "negative"}">${formatKrw(dailyChange)}</strong></div>
    <div><span>표시기간 증감</span><strong class="${periodChange >= 0 ? "positive" : "negative"}">${formatKrw(periodChange)}</strong></div>
  `;
  const max = Math.max(...points.map((point) => point.totalValueKrw));
  const min = Math.min(...points.map((point) => point.totalValueKrw));
  const span = Math.max(1, max - min);
  els.performanceChart.innerHTML = points
    .map((point, index) => {
      const previousPoint = points[index - 1];
      const change = previousPoint ? point.totalValueKrw - previousPoint.totalValueKrw : 0;
      const height = Math.max(42, Math.round(((point.totalValueKrw - min) / span) * 120) + 52);
      return `<div class="bar">
        <div class="bar-value">${formatCompactKrw(point.totalValueKrw)}</div>
        <div class="bar-fill" style="height:${height}px" title="${formatKrw(point.totalValueKrw)}"></div>
        <span>${formatShortDate(point.date)}</span>
        <small class="${change >= 0 ? "positive" : "negative"}">${previousPoint ? formatCompactKrw(change) : "-"}</small>
      </div>`;
    })
    .join("");
  renderPerformanceDetails(getFilteredSnapshotRows());
}

function renderPerformanceDetails(rows) {
  if (!rows.length) {
    els.performanceDetailStats.innerHTML = "";
    els.performanceTrendChart.innerHTML = `<div class="empty-state">저장된 성과 스냅샷이 없습니다</div>`;
    els.performanceWaterfall.innerHTML = `<div class="empty-state">성과를 계산할 스냅샷이 없습니다</div>`;
    els.performanceInsight.innerHTML = "";
    els.accountPerformanceBody.innerHTML = `<tr><td colspan="7">계좌별 스냅샷이 없습니다</td></tr>`;
    els.strategyPerformanceBody.innerHTML = `<tr><td colspan="6">보유 종목이 없습니다</td></tr>`;
    return;
  }

  const stats = getPerformanceStats(rows);
  els.performanceDetailStats.innerHTML = `
    <div><span>최근 총자산</span><strong>${formatKrw(stats.latest.totalValueKrw)}</strong><small>${escapeHtml(stats.latest.date)}</small></div>
    <div><span>기간 증감</span><strong class="${stats.periodChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(stats.periodChangeKrw)}</strong><small>${formatPercent(stats.periodReturn)}</small></div>
    <div><span>입출금</span><strong>${formatKrw(stats.netInflowKrw)}</strong><small>외부 현금흐름</small></div>
    <div><span>투자손익</span><strong class="${stats.investmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(stats.investmentGainKrw)}</strong><small>증감 - 입출금</small></div>
    <div><span>월 누적</span><strong class="${stats.monthToDateGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(stats.monthToDateGainKrw)}</strong><small>${formatPercent(stats.monthToDateReturn)}</small></div>
    <div><span>최대 낙폭</span><strong class="${stats.maxDrawdownKrw >= 0 ? "positive" : "negative"}">${formatKrw(stats.maxDrawdownKrw)}</strong><small>${formatPercent(stats.maxDrawdownRate)}</small></div>
  `;

  els.performanceTrendChart.innerHTML = renderTrendChart(rows);
  renderNumbersPerformanceChart(rows);
  els.performanceWaterfall.innerHTML = renderWaterfall(stats);
  els.performanceInsight.innerHTML = renderPerformanceInsights(stats);
  renderAccountPerformance(rows);
  renderStrategyPerformance();
}

function renderNumbersPerformanceChart(rows) {
  const source = getNumbersChartSource(rows, getSnapshotRows());
  if (!source.points.length) {
    els.numbersChartCaption.textContent = "월간 성과 데이터 없음";
    els.numbersSourceHead.innerHTML = "";
    els.numbersSourceBody.innerHTML = `<tr><td>선택 기간에 월간 차트를 만들 스냅샷이 없습니다</td></tr>`;
    if (numbersPerformanceChart) {
      numbersPerformanceChart.destroy();
      numbersPerformanceChart = null;
    }
    return;
  }

  els.numbersChartCaption.textContent = `${source.monthLabel} · 단위 만원`;
  els.numbersSourceHead.innerHTML = `<tr><th></th>${source.points.map((point) => `<th>${escapeHtml(point.label)}</th>`).join("")}</tr>`;
  els.numbersSourceBody.innerHTML = source.rows
    .map((row) => `<tr><th>${escapeHtml(row.label)}</th>${row.values.map((value) => `<td>${formatNumber(value, 0)}</td>`).join("")}</tr>`)
    .join("");

  if (!window.Chart || !window.ChartDataLabels) {
    els.numbersChartCaption.textContent = `${source.monthLabel} · 차트 라이브러리 로드 대기`;
    return;
  }

  const ctx = els.numbersPerformanceChart.getContext("2d");
  if (numbersPerformanceChart) {
    numbersPerformanceChart.destroy();
  }
  window.Chart.register(window.ChartDataLabels);
  numbersPerformanceChart = new window.Chart(ctx, {
    type: "line",
    data: {
      labels: source.points.map((point) => point.label),
      datasets: [
        {
          label: source.yearLabel,
          data: source.points.map((point) => point.yearCumulativeMan),
          borderColor: "#4f7f36",
          backgroundColor: "rgba(190, 224, 166, 0.72)",
          borderWidth: 4,
          fill: "origin",
          pointRadius: 0,
          pointHitRadius: 10,
          tension: 0,
          datalabels: {
            align: "top",
            anchor: "end",
            color: "#101a14",
            font: { weight: "800", size: 11 },
            formatter: formatChartLabel,
          },
        },
        {
          label: source.monthLabel,
          data: source.points.map((point) => point.monthCumulativeMan),
          borderColor: "#0866e8",
          backgroundColor: "rgba(8, 102, 232, 0.08)",
          borderWidth: 5,
          fill: false,
          pointRadius: 0,
          pointHitRadius: 10,
          tension: 0,
          datalabels: {
            align: "top",
            anchor: "end",
            color: "#0866e8",
            font: { weight: "800", size: 11 },
            formatter: formatChartLabel,
          },
        },
        {
          label: "일일 수익",
          data: source.points.map((point) => point.dailyMan),
          borderColor: "#ff2419",
          backgroundColor: "rgba(255, 36, 25, 0.08)",
          borderWidth: 5,
          fill: false,
          pointRadius: 0,
          pointHitRadius: 10,
          tension: 0,
          datalabels: {
            align: (context) => (Number(context.dataset.data[context.dataIndex]) < 0 ? "bottom" : "top"),
            anchor: (context) => (Number(context.dataset.data[context.dataIndex]) < 0 ? "start" : "end"),
            color: "#ff2419",
            font: { weight: "800", size: 11 },
            formatter: formatChartLabel,
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 30, right: 24, bottom: 8, left: 8 } },
      plugins: {
        legend: {
          align: "center",
          labels: {
            boxWidth: 18,
            color: "#17211b",
            font: { weight: "700" },
            usePointStyle: false,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatNumber(context.parsed.y, 0)}만원`,
          },
        },
        datalabels: {
          clip: false,
          display: true,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#17211b",
            maxRotation: 0,
            minRotation: 0,
            autoSkip: source.points.length > 24,
            font: { size: 12 },
          },
        },
        y: {
          beginAtZero: false,
          grid: {
            color: "#17211b",
            lineWidth: 1.2,
          },
          ticks: {
            color: "#17211b",
            callback: (value) => formatNumber(value, 0),
            font: { size: 12, weight: "700" },
          },
        },
      },
    },
  });
}

function renderBreakdown() {
  const movers = getDailyMoveRows().slice(0, 5);
  const refreshImpact = getRecentPriceRefreshImpact();
  if (!movers.length) {
    if (refreshImpact?.rows?.length) {
      els.breakdownList.innerHTML = renderPriceRefreshImpact(refreshImpact);
      return;
    }
    const fallback = renderBreakdownFallback();
    els.breakdownList.innerHTML = `
      <div class="daily-move-empty">
        <strong>가격 갱신 후 원인을 분석할 수 있습니다</strong>
        <span>전일 대비 가격 데이터가 없는 캐시나 일부 종목 실패가 있으면 원인 분석이 제한됩니다. 가격을 다시 가져오면 새 데이터로 분석합니다.</span>
      </div>
      <div class="breakdown-subtitle">구성 참고</div>
      ${fallback}
    `;
    return;
  }
  const netMove = movers.reduce((sum, item) => sum + item.value, 0);
  const priceEffect = movers.reduce((sum, item) => sum + item.priceEffectKrw, 0);
  const fxEffect = movers.reduce((sum, item) => sum + item.fxEffectKrw, 0);
  const insight = dailyMoveInsight(movers, netMove, priceEffect, fxEffect);
  els.breakdownList.innerHTML = `
    <div class="daily-move-summary">
      <span>오늘 추정 변동</span>
      <strong class="${netMove >= 0 ? "positive" : "negative"}">${formatKrw(netMove)}</strong>
      <small>가격 ${priceEffect >= 0 ? "+" : ""}${formatCompactKrw(priceEffect)} · 환율 ${fxEffect >= 0 ? "+" : ""}${formatCompactKrw(fxEffect)}</small>
    </div>
    <div class="daily-move-insight">${escapeHtml(insight)}</div>
    ${movers.map((item) => dailyMoveRow(item)).join("")}
    ${refreshImpact && Math.abs(refreshImpact.totalDeltaKrw) > Math.max(100000, Math.abs(netMove) * 3) ? renderPriceRefreshImpact(refreshImpact, { compact: true }) : ""}
  `;
}

function renderBreakdownFallback() {
  const investors = groupByValue(state.holdings, "investor");
  const accountTypes = groupByValue(state.holdings.map((holding) => ({ ...holding, accountType: formatAccountType(holding.accountType) })), "accountType");
  return [
    ...investors.map((item, index) => breakdownRow(item, index)),
    ...accountTypes.map((item, index) => breakdownRow(item, index + investors.length)),
  ].join("");
}

function renderPriceRefreshImpact(impact, { compact = false } = {}) {
  const rows = (impact.rows || []).slice(0, compact ? 3 : 5);
  const title = compact ? "이번 가격 갱신 전후" : "최근 가격 갱신 영향";
  return `
    <div class="daily-move-summary price-refresh-impact">
      <span>${title}</span>
      <strong class="${impact.totalDeltaKrw >= 0 ? "positive" : "negative"}">${impact.totalDeltaKrw >= 0 ? "+" : ""}${formatKrw(impact.totalDeltaKrw)}</strong>
      <small>${formatAsOf(impact.at)} · 갱신 전 ${formatCompactKrw(impact.previousTotalKrw)} → 갱신 후 ${formatCompactKrw(impact.nextTotalKrw)}</small>
    </div>
    <div class="daily-move-insight">${escapeHtml(priceRefreshImpactInsight(impact))}</div>
    ${rows.map((item) => priceRefreshImpactRow(item)).join("")}
  `;
}

function renderAccounts() {
  const accounts = getKnownAccounts();
  const accountStats = getAccountStats();
  els.accountList.innerHTML = accounts.length
    ? accounts
        .map((account) => {
          const inUse = isAccountInUse(account);
          const stats = accountStats.get(account.key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 };
          const deleteLabel = inUse ? "사용 중인 계좌라 삭제할 수 없습니다" : "계좌 삭제";
          return `<div class="detail-row account-card-row">
            <div>
              <strong>${escapeHtml(account.account)}</strong>
              <small>${escapeHtml(account.investor)} · ${escapeHtml(account.provider || "기관 미지정")} · ${formatAccountType(account.accountType)} · ${escapeHtml(account.baseCurrency || "KRW")}</small>
            </div>
            <div class="account-card-metrics">
              <span><small>총자산</small><strong>${formatKrw(stats.stockValueKrw + stats.cashKrw)}</strong></span>
              <span><small>주식</small><strong>${formatKrw(stats.stockValueKrw)}</strong></span>
              <span><small>예수금</small><strong>${formatKrw(stats.cashKrw)}</strong></span>
              <span><small>종목</small><strong>${formatNumber(stats.holdingCount)}</strong></span>
            </div>
            ${rowActionMenu(`계좌 ${account.account} 작업`, [
              `<button type="button" data-edit-account="${account.id}">수정</button>`,
              `<button class="row-menu-danger" type="button" data-delete-account="${account.id}" ${inUse ? "disabled" : ""} title="${deleteLabel}">삭제</button>`,
            ])}
          </div>`;
        })
        .join("")
    : `<div class="empty-state">등록된 계좌가 없습니다</div>`;

  document.querySelectorAll("[data-edit-account]").forEach((button) => {
    button.addEventListener("click", () => startEditAccount(button.dataset.editAccount));
  });
  document.querySelectorAll("[data-delete-account]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("이 계좌를 삭제할까요? 보유 종목이나 예수금에 연결된 계좌는 삭제할 수 없습니다.")) {
        return;
      }
      state.accounts = state.accounts.filter((account) => account.id !== button.dataset.deleteAccount);
      saveState();
      render();
    });
  });
}

function rowActionMenu(label, actions) {
  return `<details class="row-menu">
    <summary aria-label="${escapeHtml(label)}" title="작업 더보기">⋮</summary>
    <div class="row-menu-popover">${actions.join("")}</div>
  </details>`;
}

function getAccountStats() {
  const stats = new Map();
  for (const account of getKnownAccounts()) {
    stats.set(account.key, { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 });
  }
  for (const holding of state.holdings) {
    const key = accountKeyFor(holding);
    const current = stats.get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 };
    current.stockValueKrw += getHoldingValues(holding).valueKrw;
    current.holdingCount += 1;
    stats.set(key, current);
  }
  for (const cash of state.cashBalances || []) {
    const key = accountKeyFor(cash);
    const current = stats.get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 };
    current.cashKrw += getCashValueKrw(cash);
    stats.set(key, current);
  }
  for (const flow of state.cashFlows || []) {
    const key = accountKeyFor(flow);
    const current = stats.get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 };
    current.flowsKrw += Number(flow.amountKrw || 0);
    stats.set(key, current);
  }
  return stats;
}

function renderAccountSummary() {
  const grouped = groupByAccount(state.holdings);
  els.accountSummary.innerHTML = grouped
    .map((item) => `<div class="detail-row">
      <span>
        <strong>${escapeHtml(item.account)}</strong>
        <small>${escapeHtml(item.investor)} · 주식 ${formatKrw(item.stockValueKrw)} · 예수금 ${formatKrw(item.cashKrw)}</small>
      </span>
      <span>${formatKrw(item.valueKrw)}</span>
      <strong class="${item.gain >= 0 ? "positive" : "negative"}">${formatPercent(item.returnRate)}</strong>
    </div>`)
    .join("");
}

function renderAccountDetail() {
  const selected = els.accountDetailSelect.value;
  if (!selected) {
    els.accountDetail.innerHTML = `<div class="empty-state">계좌를 선택하면 보유 종목, 예수금, 현금흐름을 한 번에 볼 수 있습니다</div>`;
    return;
  }
  const account = parseAccountKey(selected);
  const holdings = state.holdings.filter((holding) => holding.investor === account.investor && holding.account === account.account);
  const cashBalances = (state.cashBalances || []).filter((cash) => cash.investor === account.investor && cash.account === account.account);
  const flows = (state.cashFlows || []).filter((flow) => flow.investor === account.investor && flow.account === account.account).slice(-6).reverse();
  const holdingRows = holdings.map((holding) => {
    const values = getHoldingValues(holding);
    return `<li><span>${escapeHtml(holding.name || holding.ticker)}<small>${escapeHtml(holding.ticker)}</small></span><strong>${formatKrw(values.valueKrw)}</strong></li>`;
  }).join("");
  const cashRows = cashBalances.map((cash) => `<li><span>${escapeHtml(cash.currency)} 예수금<small>${escapeHtml(cash.source || "")}</small></span><strong>${formatMoney(cash.amount, cash.currency)}</strong></li>`).join("");
  const flowRows = flows.map((flow) => `<li><span>${escapeHtml(flow.date)} · ${formatFlowType(flow.type)}<small>${escapeHtml(flow.note || "")}</small></span><strong>${formatKrw(flow.amountKrw)}</strong></li>`).join("");
  els.accountDetail.innerHTML = `
    <div class="detail-block">
      <h3>보유 종목</h3>
      <ul>${holdingRows || "<li>보유 종목 없음</li>"}</ul>
    </div>
    <div class="detail-block">
      <h3>예수금</h3>
      <ul>${cashRows || "<li>예수금 없음</li>"}</ul>
    </div>
    <div class="detail-block">
      <h3>최근 현금흐름</h3>
      <ul>${flowRows || "<li>현금흐름 없음</li>"}</ul>
    </div>
  `;
}

function renderSnapshots() {
  const rows = getFilteredSnapshotRows().slice(-12).reverse();
  els.snapshotsBody.innerHTML = rows
    .map((row) => `<tr>
      <td>${escapeHtml(row.date)}</td>
      <td>${formatKrw(row.totalValueKrw)}</td>
      <td class="${row.dailyChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.dailyChangeKrw)}</td>
      <td>${formatKrw(row.netInflowKrw)}</td>
      <td class="${row.investmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.investmentGainKrw)}</td>
      <td class="${row.dailyReturn >= 0 ? "positive" : "negative"}">${formatPercent(row.dailyReturn)}</td>
      <td class="${row.monthToDateInvestmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.monthToDateInvestmentGainKrw)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="7">저장된 성과 스냅샷이 없습니다</td></tr>`;
}

function renderMonthlySummary() {
  const rows = selectMonthlyRows(getFilteredSnapshotRows()).reverse();
  els.monthlySummaryBody.innerHTML = rows
    .map((row) => `<tr>
      <td>${escapeHtml(row.month)}</td>
      <td>${formatKrw(row.startValueKrw)}</td>
      <td>${formatKrw(row.endValueKrw)}</td>
      <td class="${row.changeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.changeKrw)}</td>
      <td>${formatKrw(row.netInflowKrw)}</td>
      <td class="${row.investmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.investmentGainKrw)}</td>
      <td class="${row.returnRate >= 0 ? "positive" : "negative"}">${formatPercent(row.returnRate)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="7">월별로 집계할 스냅샷이 없습니다</td></tr>`;
}

function renderAccountPerformance(rows) {
  const accountRows = selectAccountPerformanceRows(state.accountSnapshots, rows);
  els.accountPerformanceBody.innerHTML = accountRows
    .map((row) => `<tr>
      <td>${escapeHtml(row.account)}<small>${escapeHtml(row.investor)}</small></td>
      <td>${formatKrw(row.latestValueKrw)}</td>
      <td class="${row.dailyChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.dailyChangeKrw)}</td>
      <td class="${row.periodChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.periodChangeKrw)}</td>
      <td>${formatKrw(row.stockValueKrw)}</td>
      <td>${formatKrw(row.cashKrw)}</td>
      <td class="${row.returnRate >= 0 ? "positive" : "negative"}">${formatPercent(row.returnRate)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="7">계좌별 스냅샷이 없습니다. 오늘 성과 저장 또는 자동 기록 후 표시됩니다.</td></tr>`;
}

function renderStrategyPerformance() {
  const rows = getStrategyPerformanceRows();
  els.strategyPerformanceBody.innerHTML = rows
    .map((row) => `<tr>
      <td>${escapeHtml(row.strategy)}</td>
      <td>${formatKrw(row.valueKrw)}</td>
      <td>${formatPercent(row.weight)}</td>
      <td class="${row.gainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.gainKrw)}</td>
      <td class="${row.returnRate >= 0 ? "positive" : "negative"}">${formatPercent(row.returnRate)}</td>
      <td>${formatNumber(row.count)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="6">보유 종목이 없습니다</td></tr>`;
}

function breakdownRow(item, index) {
  return `<div class="breakdown-row">
    <span class="swatch" style="background:${palette[index % palette.length]}"></span>
    <span>${escapeHtml(item.label)}</span>
    <strong>${formatKrw(item.value)}</strong>
  </div>`;
}

function dailyMoveRow(item) {
  const share = Number.isFinite(item.contributionShare) ? Math.abs(item.contributionShare) : 0;
  const detail = Math.abs(item.fxEffectKrw) >= 1000
    ? `가격 ${item.priceEffectKrw >= 0 ? "+" : ""}${formatCompactKrw(item.priceEffectKrw)} · 환율 ${item.fxEffectKrw >= 0 ? "+" : ""}${formatCompactKrw(item.fxEffectKrw)}`
    : `${formatNumber(item.quantity, 4)}주 · ${formatPercent(item.changePercent)}`;
  return `<div class="daily-move-row">
    <div>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.ticker)} · ${detail} · 영향 ${formatPercent(share)}</small>
    </div>
    <span class="${item.value >= 0 ? "positive" : "negative"}">${item.value >= 0 ? "+" : ""}${formatKrw(item.value)}</span>
  </div>`;
}

function dailyMoveInsight(movers, netMove, priceEffect, fxEffect) {
  const top = movers.slice(0, 2).map((item) => item.name).filter(Boolean);
  if (!top.length || Math.abs(netMove) < 1000) {
    return "오늘은 뚜렷하게 총자산을 움직인 종목이 없습니다.";
  }
  const direction = netMove >= 0 ? "증가" : "하락";
  const main = top.join(", ");
  if (Math.abs(fxEffect) > Math.abs(priceEffect) * 0.35) {
    const fxDirection = fxEffect >= 0 ? "환율 상승" : "환율 하락";
    return `오늘 ${direction}는 ${main}와 ${fxDirection} 영향이 큽니다.`;
  }
  return `오늘 ${direction}는 ${main}의 가격 변동이 대부분 설명합니다.`;
}

function priceRefreshImpactRow(item) {
  const before = formatCompactKrw(item.beforeValueKrw);
  const after = formatCompactKrw(item.afterValueKrw);
  return `<div class="daily-move-row">
    <div>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.ticker)} · ${before} → ${after}</small>
    </div>
    <span class="${item.deltaKrw >= 0 ? "positive" : "negative"}">${item.deltaKrw >= 0 ? "+" : ""}${formatKrw(item.deltaKrw)}</span>
  </div>`;
}

function priceRefreshImpactInsight(impact) {
  const rows = impact.rows || [];
  const top = rows[0];
  if (!top || Math.abs(impact.totalDeltaKrw) < 1000) {
    return "이번 가격 갱신으로 평가금액 변화가 거의 없었습니다.";
  }
  const direction = impact.totalDeltaKrw >= 0 ? "증가" : "감소";
  return `이번 ${direction}는 ${top.name} 등 Yahoo 가격으로 바뀐 종목 영향이 큽니다.`;
}

function renderHoldings() {
  const rows = filteredHoldings();
  els.holdingsBody.innerHTML = rows.length
    ? rows
    .map((holding) => {
      if (editingHoldingId === holding.id) {
        return renderHoldingEditRow(holding);
      }
      const values = getHoldingValues(holding);
      const value = values.valueNative;
      const cost = values.costNative;
      const gain = values.gainNative;
      const returnRate = cost ? gain / cost : 0;
      const dailyMove = getHoldingDailyMove(holding);
      return `<tr>
        <td data-label="투자자">${escapeHtml(holding.investor)}</td>
        <td data-label="계좌"><span class="name-cell">${escapeHtml(holding.account)}</span></td>
        <td data-label="전략"><span class="name-cell">${escapeHtml(holding.strategy)}</span></td>
        <td data-label="종목"><strong class="name-cell">${escapeHtml(holding.name || holding.ticker)}</strong>${holding.ticker && holding.ticker !== holding.name ? `<small class="name-cell">${escapeHtml(holding.ticker)}</small>` : ""}</td>
        <td data-label="수량"><span class="amount-cell">${formatNumber(holding.quantity, 4)}</span></td>
        <td data-label="현재가"><span class="money-value">${formatMoney(holding.price, holding.currency)}</span><small>${escapeHtml(holding.priceSource || "사용자 입력")} · ${formatAsOf(holding.priceAsOf)}</small></td>
        <td data-label="평단가"><span class="money-value">${formatMoney(holding.averageCost, holding.currency)}</span></td>
        <td data-label="평가금액"><span class="money-value">${formatMoney(value, holding.currency)}</span></td>
        <td data-label="일 영향" class="${dailyMove.valueKrw >= 0 ? "positive" : "negative"}">
          <span class="money-value">${dailyMove.hasData ? `${dailyMove.valueKrw >= 0 ? "+" : ""}${formatKrw(dailyMove.valueKrw)}` : "-"}</span>
          ${dailyMove.hasData ? `<small>${formatPercent(dailyMove.changePercent)}</small>` : ""}
        </td>
        <td data-label="손익" class="${gain >= 0 ? "positive" : "negative"}"><span class="money-value">${formatMoney(gain, holding.currency)}</span></td>
        <td data-label="수익률" class="${gain >= 0 ? "positive" : "negative"}"><span class="amount-cell">${formatPercent(returnRate)}</span></td>
        <td data-label="작업">
          ${rowActionMenu(`${holding.name || holding.ticker} 작업`, [
            `<button type="button" data-edit-holding="${holding.id}">수정</button>`,
            `<button class="row-menu-danger" type="button" data-delete="${holding.id}">삭제</button>`,
          ])}
        </td>
      </tr>`;
    })
    .join("")
    : `<tr><td colspan="12">조건에 맞는 보유 종목이 없습니다</td></tr>`;

  document.querySelectorAll("[data-edit-holding]").forEach((button) => {
    button.addEventListener("click", () => startEditHolding(button.dataset.editHolding));
  });

  document.querySelectorAll("[data-save-holding]").forEach((button) => {
    button.addEventListener("click", () => saveInlineHoldingEdit(button.dataset.saveHolding));
  });

  document.querySelectorAll("[data-cancel-holding-edit]").forEach((button) => {
    button.addEventListener("click", () => cancelEdit("holding"));
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("이 보유 종목을 삭제할까요? 삭제 후에는 직접 다시 추가해야 합니다.")) {
        return;
      }
      state.holdings = state.holdings.filter((holding) => holding.id !== button.dataset.delete);
      saveState();
      render();
    });
  });
}

function renderHoldingEditRow(holding) {
  const values = getHoldingValues(holding);
  const accountOptions = getKnownAccounts()
    .map((account) => `<option value="${escapeHtml(account.key)}" ${account.key === accountKeyFor(holding) ? "selected" : ""}>${escapeHtml(account.investor)} · ${escapeHtml(account.account)}</option>`)
    .join("");
  return `<tr class="is-editing-row">
    <td data-label="투자자"><span class="inline-edit-chip">수정 중</span></td>
    <td data-label="계좌">
      <div class="inline-edit-cell">
        <select data-inline-holding-field="accountKey" aria-label="계좌 선택">${accountOptions}</select>
        <select data-inline-holding-field="accountType" aria-label="계좌 유형">
          ${holdingAccountTypeOptions(normalizeAccountType(holding.accountType))}
        </select>
      </div>
    </td>
    <td data-label="전략">
      <select data-inline-holding-field="strategy" aria-label="전략">${strategyOptions(holding.strategy)}</select>
    </td>
    <td data-label="종목">
      <div class="inline-edit-cell">
        <input data-inline-holding-field="name" value="${escapeHtml(holding.name || "")}" placeholder="종목명" aria-label="종목명">
        <input data-inline-holding-field="ticker" value="${escapeHtml(holding.ticker || "")}" placeholder="티커" aria-label="티커">
      </div>
    </td>
    <td data-label="수량"><input data-inline-holding-field="quantity" type="number" step="0.0001" min="0" value="${escapeHtml(holding.quantity ?? "")}" aria-label="수량"></td>
    <td data-label="현재가">${formatMoney(holding.price, holding.currency)}<small>${escapeHtml(holding.priceSource || "사용자 입력")} · ${formatAsOf(holding.priceAsOf)}</small></td>
    <td data-label="평단가"><input data-inline-holding-field="averageCost" type="number" step="0.01" min="0" value="${escapeHtml(holding.averageCost ?? "")}" aria-label="평단가"></td>
    <td data-label="평가금액">${formatMoney(values.valueNative, holding.currency)}</td>
    <td data-label="일 영향">가격 갱신 기준</td>
    <td data-label="손익" class="${values.gainNative >= 0 ? "positive" : "negative"}">${formatMoney(values.gainNative, holding.currency)}</td>
    <td data-label="수익률" class="${values.gainNative >= 0 ? "positive" : "negative"}">${formatPercent(values.costNative ? values.gainNative / values.costNative : 0)}</td>
    <td data-label="작업">
      <div class="row-actions">
        <button class="secondary small-button" type="button" data-save-holding="${holding.id}">저장</button>
        <button class="ghost small-button" type="button" data-cancel-holding-edit>취소</button>
        <button class="icon-danger" type="button" data-delete="${holding.id}" aria-label="${escapeHtml(holding.ticker)} 삭제">×</button>
      </div>
    </td>
  </tr>`;
}

function holdingAccountTypeOptions(value) {
  return Object.entries(accountTypeLabels)
    .map(([optionValue, label]) => `<option value="${optionValue}" ${optionValue === value ? "selected" : ""}>${label}</option>`)
    .join("");
}

function currencyOptions(value) {
  return ["KRW", "USD"]
    .map((currency) => `<option value="${currency}" ${currency === value ? "selected" : ""}>${currency}</option>`)
    .join("");
}

function cashFlowTypeOptions(value) {
  return [
    ["deposit", "입금"],
    ["withdrawal", "출금"],
    ["dividend", "배당"],
    ["tax", "세금"],
    ["fee", "수수료"],
  ]
    .map(([optionValue, label]) => `<option value="${optionValue}" ${optionValue === value ? "selected" : ""}>${label}</option>`)
    .join("");
}

function strategyOptions(value) {
  const strategies = unique(["QQQ", "S&P500", "국내주식", "Core", "Growth", ...state.holdings.map((holding) => holding.strategy)]);
  return strategies
    .map((strategy) => `<option value="${escapeHtml(strategy)}" ${strategy === value ? "selected" : ""}>${escapeHtml(strategy)}</option>`)
    .join("");
}

function saveInlineCashBalanceEdit(id) {
  const row = document.querySelector(`[data-save-cash="${CSS.escape(id)}"]`)?.closest(".detail-row");
  const existingCash = (state.cashBalances || []).find((cash) => cash.id === id);
  if (!row || !existingCash) {
    return;
  }
  const field = (name) => row.querySelector(`[data-inline-cash-field="${name}"]`)?.value || "";
  const account = parseAccountKey(field("accountKey"));
  const nextCash = {
    ...existingCash,
    investor: account.investor,
    account: account.account,
    currency: field("currency"),
    amount: Number(field("amount")),
    asOf: todayKey(),
    source: "사용자 수정",
  };
  state.cashBalances = state.cashBalances.map((cash) => (cash.id === id ? nextCash : cash));
  editingCashBalanceId = null;
  saveState();
  render();
  setStatus("예수금 수정 완료", `${nextCash.account} · ${formatMoney(nextCash.amount, nextCash.currency)}`);
  showOperationToast("예수금 수정 완료", `${nextCash.account} · ${formatMoney(nextCash.amount, nextCash.currency)}`, "success");
}

function saveInlineCashFlowEdit(id) {
  const row = document.querySelector(`[data-save-flow="${CSS.escape(id)}"]`)?.closest("tr");
  const existingFlow = state.cashFlows.find((flow) => flow.id === id);
  if (!row || !existingFlow) {
    return;
  }
  const field = (name) => row.querySelector(`[data-inline-flow-field="${name}"]`)?.value || "";
  const account = parseAccountKey(field("accountKey"));
  const nextFlow = {
    ...existingFlow,
    date: field("date") || todayKey(),
    investor: account.investor,
    account: account.account,
    type: field("type"),
    amountKrw: Number(field("amountKrw")),
    note: field("note").trim(),
  };
  state.cashFlows = state.cashFlows.map((flow) => (flow.id === id ? nextFlow : flow));
  editingCashFlowId = null;
  saveState();
  render();
  setStatus("입출금 수정 완료", `${formatFlowType(nextFlow.type)} · ${formatKrw(nextFlow.amountKrw)}`);
  showOperationToast("입출금 수정 완료", `${nextFlow.date} · ${formatKrw(nextFlow.amountKrw)}`, "success");
}

function saveInlineHoldingEdit(id) {
  const row = document.querySelector(`[data-save-holding="${CSS.escape(id)}"]`)?.closest("tr");
  const existingHolding = state.holdings.find((holding) => holding.id === id);
  if (!row || !existingHolding) {
    return;
  }
  const field = (name) => row.querySelector(`[data-inline-holding-field="${name}"]`)?.value || "";
  const account = parseAccountKey(field("accountKey"));
  const ticker = field("ticker").trim().toUpperCase();
  const name = field("name").trim() || ticker || field("strategy");
  const averageCost = Number(field("averageCost"));
  const quantity = Number(field("quantity"));
  const currency = existingHolding.currency || (/^[0-9]{6}\.KS$/.test(ticker) ? "KRW" : "USD");
  state.holdings = state.holdings.map((holding) =>
    holding.id === id
      ? {
          ...holding,
          investor: account.investor,
          account: account.account,
          accountType: normalizeAccountType(field("accountType")),
          strategy: field("strategy"),
          ticker: ticker || name,
          name,
          quantity,
          averageCost,
          currency,
        }
      : holding,
  );
  editingHoldingId = null;
  saveState();
  render();
  setStatus("보유 종목 수정 완료", `${name} · ${account.account}`);
  showOperationToast("보유 종목 수정 완료", `${name} · ${formatNumber(quantity, 4)}주`, "success");
}

function renderCashBalances() {
  renderUnclassifiedCashAllocation();
  const rows = [...(state.cashBalances || [])].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
  els.cashBalanceList.innerHTML = rows.length
    ? rows
        .map((cash) => editingCashBalanceId === cash.id ? renderCashBalanceEditRow(cash) : `<div class="detail-row">
          <span>
            <strong>${escapeHtml(cash.account)}</strong>
            <small>${escapeHtml(cash.investor)} · ${escapeHtml(cash.currency)} · ${escapeHtml(cash.source || "직접 입력")}</small>
          </span>
          <span>${formatMoney(cash.amount, cash.currency)}</span>
          ${rowActionMenu(`${cash.account} 예수금 작업`, [
            `<button type="button" data-edit-cash="${cash.id}">수정</button>`,
            `<button class="row-menu-danger" type="button" data-delete-cash="${cash.id}">삭제</button>`,
          ])}
        </div>`)
        .join("")
    : `<div class="empty-state">등록된 예수금이 없습니다</div>`;

  document.querySelectorAll("[data-edit-cash]").forEach((button) => {
    button.addEventListener("click", () => startEditCashBalance(button.dataset.editCash));
  });

  document.querySelectorAll("[data-save-cash]").forEach((button) => {
    button.addEventListener("click", () => saveInlineCashBalanceEdit(button.dataset.saveCash));
  });

  document.querySelectorAll("[data-cancel-cash-edit]").forEach((button) => {
    button.addEventListener("click", () => cancelEdit("cashBalance"));
  });

  document.querySelectorAll("[data-delete-cash]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("이 예수금 기록을 삭제할까요?")) {
        return;
      }
      state.cashBalances = state.cashBalances.filter((cash) => cash.id !== button.dataset.deleteCash);
      saveState();
      render();
    });
  });
}

function renderCashBalanceEditRow(cash) {
  const accountOptions = getKnownAccounts()
    .map((account) => `<option value="${escapeHtml(account.key)}" ${account.key === accountKeyFor(cash) ? "selected" : ""}>${escapeHtml(account.investor)} · ${escapeHtml(account.account)}</option>`)
    .join("");
  return `<div class="detail-row is-editing-row">
    <span>
      <strong>예수금 수정</strong>
      <small>계좌와 금액을 이 행에서 바로 수정합니다</small>
    </span>
    <div class="inline-edit-cell">
      <select data-inline-cash-field="accountKey" aria-label="예수금 계좌">${accountOptions}</select>
      <select data-inline-cash-field="currency" aria-label="통화">${currencyOptions(cash.currency)}</select>
      <input data-inline-cash-field="amount" type="number" step="0.01" value="${escapeHtml(cash.amount ?? "")}" aria-label="예수금">
    </div>
    <div class="row-actions">
      <button class="secondary small-button" type="button" data-save-cash="${cash.id}">저장</button>
      <button class="ghost small-button" type="button" data-cancel-cash-edit>취소</button>
      <button class="icon-danger" type="button" data-delete-cash="${cash.id}" aria-label="예수금 삭제">×</button>
    </div>
  </div>`;
}

function renderUnclassifiedCashAllocation() {
  const unclassified = getUnclassifiedCashBalances();
  const total = unclassified.reduce((sum, cash) => sum + Number(cash.amount || 0), 0);
  const accounts = getKnownAccounts();
  els.unclassifiedCashPanel.hidden = !total || !accounts.length;
  if (!total || !accounts.length) {
    return;
  }
  els.unclassifiedCashSummary.textContent = `${formatKrw(total)} 배분 가능`;
  const select = els.cashAllocationForm.elements.targetAccount;
  select.innerHTML = accounts
    .map((item) => `<option value="${escapeHtml(item.investor)}|||${escapeHtml(item.account)}">${escapeHtml(item.investor)} · ${escapeHtml(item.account)}</option>`)
    .join("");
  const amountInput = els.cashAllocationForm.elements.amount;
  amountInput.max = String(total);
  amountInput.placeholder = `최대 ${formatKrw(total)}`;
}

function allocateUnclassifiedCash({ investor, account, amount }) {
  let remaining = Math.max(0, Number(amount || 0));
  let allocated = 0;
  const nextCashBalances = [];
  for (const cash of state.cashBalances || []) {
    if (!isUnclassifiedCash(cash) || remaining <= 0) {
      nextCashBalances.push(cash);
      continue;
    }
    const sourceAmount = Number(cash.amount || 0);
    const moveAmount = Math.min(sourceAmount, remaining);
    allocated += moveAmount;
    remaining -= moveAmount;
    const leftover = sourceAmount - moveAmount;
    if (leftover > 0.01) {
      nextCashBalances.push({ ...cash, amount: leftover });
    }
  }
  if (allocated > 0) {
    nextCashBalances.push({
      id: makeId(),
      investor,
      account,
      currency: "KRW",
      amount: allocated,
      asOf: todayKey(),
      source: "미분류 예수금 배분",
    });
  }
  state.cashBalances = nextCashBalances;
  return allocated;
}

function renderCashFlows() {
  const typeFilter = els.cashFlowTypeFilter?.value || "";
  const sort = parseSortValue(els.cashFlowSort?.value, DEFAULT_CASH_FLOW_SORT);
  const rows = [...state.cashFlows]
    .filter((flow) => !typeFilter || flow.type === typeFilter)
    .sort((a, b) => {
      const comparisons = {
        date: a.date.localeCompare(b.date),
        amount: Number(a.amountKrw || 0) - Number(b.amountKrw || 0),
      };
      const result = comparisons[sort.key] ?? comparisons.date;
      return sort.dir === "asc" ? result : -result;
    })
    .slice(0, 30);
  els.cashFlowsBody.innerHTML = rows
    .map((flow) => editingCashFlowId === flow.id ? renderCashFlowEditRow(flow) : `<tr>
      <td>${escapeHtml(flow.date)}</td>
      <td>${escapeHtml(flow.investor)}</td>
      <td>${escapeHtml(flow.account)}</td>
      <td>${formatFlowType(flow.type)}</td>
      <td><span class="money-value">${formatKrw(flow.amountKrw)}</span></td>
      <td>${escapeHtml(flow.note || "")}</td>
      <td>
        ${rowActionMenu(`${flow.date} 입출금 작업`, [
          `<button type="button" data-edit-flow="${flow.id}">수정</button>`,
          `<button class="row-menu-danger" type="button" data-delete-flow="${flow.id}">삭제</button>`,
        ])}
      </td>
    </tr>`)
    .join("");

  document.querySelectorAll("[data-edit-flow]").forEach((button) => {
    button.addEventListener("click", () => startEditCashFlow(button.dataset.editFlow));
  });

  document.querySelectorAll("[data-save-flow]").forEach((button) => {
    button.addEventListener("click", () => saveInlineCashFlowEdit(button.dataset.saveFlow));
  });

  document.querySelectorAll("[data-cancel-flow-edit]").forEach((button) => {
    button.addEventListener("click", () => cancelEdit("cashFlow"));
  });

  document.querySelectorAll("[data-delete-flow]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("이 입출금 기록을 삭제할까요? 성과 계산에도 반영됩니다.")) {
        return;
      }
      state.cashFlows = state.cashFlows.filter((flow) => flow.id !== button.dataset.deleteFlow);
      saveState();
      render();
    });
  });
}

function renderCashFlowEditRow(flow) {
  const accountOptions = getKnownAccounts()
    .map((account) => `<option value="${escapeHtml(account.key)}" ${account.key === accountKeyFor(flow) ? "selected" : ""}>${escapeHtml(account.investor)} · ${escapeHtml(account.account)}</option>`)
    .join("");
  return `<tr class="is-editing-row">
    <td><input data-inline-flow-field="date" type="date" value="${escapeHtml(flow.date || todayKey())}" aria-label="날짜"></td>
    <td colspan="2">
      <select data-inline-flow-field="accountKey" aria-label="계좌">${accountOptions}</select>
    </td>
    <td><select data-inline-flow-field="type" aria-label="유형">${cashFlowTypeOptions(flow.type)}</select></td>
    <td><input data-inline-flow-field="amountKrw" type="number" step="1" min="0" value="${escapeHtml(flow.amountKrw ?? "")}" aria-label="금액 KRW"></td>
    <td><input data-inline-flow-field="note" value="${escapeHtml(flow.note || "")}" placeholder="메모" aria-label="메모"></td>
    <td>
      <div class="row-actions">
        <button class="secondary small-button" type="button" data-save-flow="${flow.id}">저장</button>
        <button class="ghost small-button" type="button" data-cancel-flow-edit>취소</button>
        <button class="icon-danger" type="button" data-delete-flow="${flow.id}" aria-label="입출금 기록 삭제">×</button>
      </div>
    </td>
  </tr>`;
}

function startEditHolding(id) {
  const holding = state.holdings.find((item) => item.id === id);
  if (!holding) {
    return;
  }
  editingHoldingId = id;
  els.holdingFormPanel.hidden = true;
  updateEditControls();
  renderHoldings();
  setView("holdings");
  const row = document.querySelector(`[data-save-holding="${CSS.escape(id)}"]`)?.closest("tr");
  row?.scrollIntoView({ block: "center", behavior: "smooth" });
  row?.querySelector("[data-inline-holding-field='quantity']")?.focus();
}

function startEditAccount(id) {
  const account = state.accounts.find((item) => item.id === id) || getKnownAccounts().find((item) => item.id === id);
  if (!account) {
    return;
  }
  editingAccountId = id;
  els.accountForm.elements.investor.value = account.investor || "";
  els.accountForm.elements.account.value = account.account || "";
  els.accountForm.elements.provider.value = account.provider || "";
  els.accountForm.elements.accountType.value = normalizeAccountType(account.accountType);
  els.accountForm.elements.baseCurrency.value = account.baseCurrency || "KRW";
  updateEditControls();
  setView("accounts");
  els.accountForm.scrollIntoView({ block: "center" });
}

function startEditCashFlow(id) {
  const flow = state.cashFlows.find((item) => item.id === id);
  if (!flow) {
    return;
  }
  editingCashFlowId = id;
  updateEditControls();
  renderCashFlows();
  const row = document.querySelector(`[data-save-flow="${CSS.escape(id)}"]`)?.closest("tr");
  row?.scrollIntoView({ block: "center", behavior: "smooth" });
  row?.querySelector("[data-inline-flow-field='amountKrw']")?.focus();
}

function startEditCashBalance(id) {
  const cash = (state.cashBalances || []).find((item) => item.id === id);
  if (!cash) {
    return;
  }
  editingCashBalanceId = id;
  updateEditControls();
  renderCashBalances();
  const row = document.querySelector(`[data-save-cash="${CSS.escape(id)}"]`)?.closest(".detail-row");
  row?.scrollIntoView({ block: "center", behavior: "smooth" });
  row?.querySelector("[data-inline-cash-field='amount']")?.focus();
}

function cancelEdit(kind) {
  if (kind === "holding") {
    editingHoldingId = null;
    els.holdingForm.reset();
    els.holdingFormPanel.hidden = true;
    renderHoldings();
  }
  if (kind === "cashFlow") {
    editingCashFlowId = null;
    els.cashFlowForm.reset();
    els.cashFlowForm.elements.date.value = todayKey();
    renderCashFlows();
  }
  if (kind === "cashBalance") {
    editingCashBalanceId = null;
    els.cashBalanceForm.reset();
    renderCashBalances();
  }
  if (kind === "account") {
    editingAccountId = null;
    els.accountForm.reset();
  }
  updateEditControls();
  renderAccountSelectors();
}

function updateEditControls() {
  els.accountSubmit.textContent = editingAccountId ? "수정 저장" : "계좌 저장";
  els.accountCancel.hidden = !editingAccountId;
  els.holdingSubmit.textContent = "추가";
  els.holdingCancel.hidden = Boolean(els.holdingFormPanel?.hidden);
  if (els.holdingFormTitle) {
    els.holdingFormTitle.textContent = "보유 종목 추가";
    els.holdingFormSubtitle.textContent = "계좌와 전략을 선택해 새 종목을 등록합니다";
  }
  els.cashFlowSubmit.textContent = editingCashFlowId ? "수정 저장" : "기록";
  els.cashFlowCancel.hidden = !editingCashFlowId;
  els.cashBalanceSubmit.textContent = editingCashBalanceId ? "수정 저장" : "저장";
  els.cashBalanceCancel.hidden = !editingCashBalanceId;
}

function renderAutomation() {
  const automation = state.automation || {};
  const storageLabel = authState.signedIn ? "클라우드 저장" : "브라우저 저장";
  els.automationCurrent.textContent = `${storageLabel} · 스냅샷 ${state.portfolioSnapshots.length}개 · 보유 ${state.holdings.length}개 · 예수금 ${(state.cashBalances || []).length}개`;
  els.automationSchedule.textContent = `매일 ${automation.snapshotTime || "09:10"} ${automation.timezone || "Asia/Seoul"}`;
  els.automationResult.textContent = automation.lastRunAt
    ? `${automation.lastResult || "자동화 실행 완료"} · ${formatAsOf(automation.lastRunAt)}`
    : automation.lastResult || "아직 자동 실행 없음";
}

function renderPriceLogs() {
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

function renderReconciliation() {
  const totals = getTotals(state.holdings);
  const accountsTotal = groupByAccount(state.holdings).reduce((sum, item) => sum + item.valueKrw, 0);
  const diff = totals.valueKrw - accountsTotal;
  els.reconcileSummary.textContent = `전체 총자산 ${formatKrw(totals.valueKrw)} · 계좌 합계 ${formatKrw(accountsTotal)} · 차이 ${formatKrw(diff)}`;
}

function filteredHoldings() {
  const query = (els.holdingSearch?.value || "").trim().toLowerCase();
  const rows = state.holdings.filter((holding) => {
    const haystack = [holding.name, holding.ticker, holding.account, holding.investor, holding.strategy].join(" ").toLowerCase();
    return (
      (!els.investorFilter.value || holding.investor === els.investorFilter.value) &&
      (!els.strategyFilter.value || holding.strategy === els.strategyFilter.value) &&
      (!els.accountTypeFilter.value || normalizeAccountType(holding.accountType) === els.accountTypeFilter.value) &&
      (!query || haystack.includes(query))
    );
  });
  const sort = parseSortValue(els.holdingSort?.value, DEFAULT_HOLDING_SORT);
  return rows.sort((a, b) => {
    const aValues = getHoldingValues(a);
    const bValues = getHoldingValues(b);
    const aReturn = aValues.costKrw ? aValues.gainKrw / aValues.costKrw : 0;
    const bReturn = bValues.costKrw ? bValues.gainKrw / bValues.costKrw : 0;
    const aPriceKrw = Number(a.price || 0) * (a.currency === "USD" ? Number(state.fxRate.rate || 1) : 1);
    const bPriceKrw = Number(b.price || 0) * (b.currency === "USD" ? Number(state.fxRate.rate || 1) : 1);
    const aDailyMove = getHoldingDailyMove(a).valueKrw;
    const bDailyMove = getHoldingDailyMove(b).valueKrw;
    const comparisons = {
      dayChange: aDailyMove - bDailyMove,
      gain: aValues.gainKrw - bValues.gainKrw,
      return: aReturn - bReturn,
      quantity: Number(a.quantity || 0) - Number(b.quantity || 0),
      price: aPriceKrw - bPriceKrw,
      name: String(a.name || a.ticker).localeCompare(String(b.name || b.ticker), "ko"),
      value: aValues.valueKrw - bValues.valueKrw,
    };
    const result = comparisons[sort.key] ?? comparisons.value;
    return sort.dir === "asc" ? result : -result;
  });
}

async function saveTodaySnapshot({ reason = "manual" } = {}) {
  if (snapshotSavePromise) {
    return snapshotSavePromise;
  }
  snapshotSavePromise = Promise.resolve().then(() => {
    setActionState("snapshot", true);
    showOperationToast("오늘 성과 기록 중", "현재 총자산을 오늘 스냅샷으로 저장합니다", "busy");
    return saveTodaySnapshotNow();
  });
  try {
    return await snapshotSavePromise;
  } finally {
    snapshotSavePromise = null;
    setActionState("snapshot", false);
  }
}

function saveTodaySnapshotNow() {
  const snapshot = buildPortfolioSnapshot(todayKey());
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
  saveState();
  render();
  const message = `${snapshot.date} · ${formatKrw(snapshot.totalValueKrw)}`;
  setStatus("오늘 성과 기록 완료", message);
  showOperationToast("오늘 성과 기록 완료", message, "success");
  return snapshot;
}

function buildPortfolioSnapshot(date) {
  return createPortfolioSnapshot(state, date, makeId);
}

function queueAutomaticPriceRefresh() {
  if (!shouldAutoRefreshPrices()) {
    return;
  }
  window.setTimeout(() => {
    refreshPrices({ reason: "auto" }).catch((error) => {
      setStatus("자동 가격 갱신 실패", error.message);
    });
  }, 250);
}

function shouldAutoRefreshPrices() {
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
  const priceLogs = (state.priceUpdateLogs || [])
    .filter((log) => log.status === "success" && log.at)
    .map((log) => new Date(log.at).getTime())
    .filter(Number.isFinite);
  const holdingTimes = state.holdings
    .map((holding) => new Date(holding.priceAsOf || 0).getTime())
    .filter(Number.isFinite);
  return Math.max(0, ...priceLogs, ...holdingTimes);
}

async function refreshPrices({ reason = "manual" } = {}) {
  if (priceRefreshPromise) {
    return priceRefreshPromise;
  }
  priceRefreshPromise = refreshPricesNow({ reason });
  try {
    return await priceRefreshPromise;
  } finally {
    priceRefreshPromise = null;
    setActionState("price", false);
  }
}

async function refreshPricesNow({ reason }) {
  setActionState("price", true);
  const isAuto = reason === "auto";
  const forceRefresh = !isAuto;
  const beforeTotals = getTotals();
  const previousFxRate = Number(state.fxRate?.rate || 1);
  setStatus(isAuto ? "자동 가격 갱신 중" : "가격 업데이트 중", "Yahoo Finance에서 보유 종목 현재가와 USD/KRW를 조회 중");
  showOperationToast(isAuto ? "가격 자동 갱신 중" : "가격 다시 가져오는 중", "보유 종목 현재가와 USD/KRW를 조회합니다", "busy");

  const tickers = unique(state.holdings.filter((holding) => holding.autoPrice !== false).map((holding) => holding.ticker));
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
        }
      : holding;
  });

  saveState();
  render();
  const updatedAt = new Date().toISOString();
  if (failures.length) {
    const detail = `${tickers.length - failures.length}/${tickers.length}개 종목 갱신 · ${failures.slice(0, 2).join(" · ")}`;
    setStatus("일부 가격 업데이트 완료", detail);
    showOperationToast("일부 가격만 갱신됨", detail, "warning");
    return { failures, updatedAt };
  }
  const detail = `${tickers.length}개 종목 + USD/KRW · ${formatAsOf(updatedAt)}`;
  setStatus(isAuto ? "자동 가격 갱신 완료" : "가격 업데이트 완료", detail);
  showOperationToast(isAuto ? "가격 자동 갱신 완료" : "가격 다시 가져오기 완료", detail, "success");
  return { failures, updatedAt };
}

function addPriceLog(log) {
  state.priceUpdateLogs = [
    ...(state.priceUpdateLogs || []),
    {
      id: makeId(),
      at: new Date().toISOString(),
      ...log,
    },
  ].slice(-200);
}

function buildPriceRefreshImpact({ beforeTotals, quoteMap, previousFxRate, reason }) {
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

function getRecentPriceRefreshImpact() {
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

function groupByValue(holdings, key) {
  const map = new Map();
  for (const holding of holdings) {
    map.set(holding[key], (map.get(holding[key]) || 0) + getHoldingValues(holding).valueKrw);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function getAllocationItems() {
  const grouped = groupByValue(state.holdings, "strategy");
  const cashKrw = getCashTotalKrw();
  if (cashKrw > 0) {
    grouped.push({ label: "예수금", value: cashKrw });
  }
  return grouped.sort((a, b) => b.value - a.value);
}

function getDailyMoveRows() {
  return selectDailyMoveRows({ holdings: state.holdings, fxRate: state.fxRate });
}

function getHoldingDailyMove(holding) {
  return selectHoldingDailyMove(holding, state.fxRate);
}

function groupByAccount(holdings) {
  return calculateGroupByAccount({
    ...state,
    holdings,
  });
}

function buildAccountSnapshots(date) {
  return createAccountSnapshots(state, date, makeId);
}

function getSnapshotRows() {
  return selectSnapshotRows(state.portfolioSnapshots);
}

function getFilteredSnapshotRows() {
  const rows = getSnapshotRows();
  const range = els.performanceRange?.value || "all";
  return filterSnapshotRows(rows, range);
}

function renderTrendChart(rows) {
  const chartRows = rows.slice(-30);
  if (chartRows.length < 2) {
    return `<div class="empty-state">추이를 그리려면 스냅샷이 2개 이상 필요합니다</div>`;
  }
  const width = 720;
  const height = 230;
  const padding = { top: 22, right: 38, bottom: 34, left: 78 };
  const values = chartRows.map((row) => row.totalValueKrw);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const xFor = (index) => padding.left + (index / Math.max(1, chartRows.length - 1)) * (width - padding.left - padding.right);
  const yFor = (value) => padding.top + ((max - value) / span) * (height - padding.top - padding.bottom);
  const line = chartRows.map((row, index) => `${xFor(index)},${yFor(row.totalValueKrw)}`).join(" ");
  const area = `${padding.left},${height - padding.bottom} ${line} ${width - padding.right},${height - padding.bottom}`;
  const labels = [chartRows[0], chartRows[Math.floor(chartRows.length / 2)], chartRows[chartRows.length - 1]];
  const tickCount = 5;
  const valueLabels = Array.from({ length: tickCount }, (_, index) => max - (span / (tickCount - 1)) * index);
  const lastRow = chartRows[chartRows.length - 1];
  const lastX = xFor(chartRows.length - 1);
  const lastY = yFor(lastRow.totalValueKrw);
  const pointGroups = chartRows
    .map((row, index) => {
      const x = xFor(index);
      const y = yFor(row.totalValueKrw);
      const previous = chartRows[index - 1];
      const dailyChange = Number(row.dailyChangeKrw ?? (previous ? row.totalValueKrw - previous.totalValueKrw : 0));
      const tooltipWidth = 164;
      const tooltipHeight = 48;
      const tooltipX = Math.max(padding.left, Math.min(width - padding.right - tooltipWidth, x - tooltipWidth / 2));
      const tooltipY = Math.max(6, y - tooltipHeight - 12);
      const tone = dailyChange >= 0 ? "+" : "";
      return `<g class="trend-point-group" tabindex="0" aria-label="${escapeHtml(`${row.date} 총자산 ${formatKrw(row.totalValueKrw)}, 일 증감 ${tone}${formatKrw(dailyChange)}`)}">
        <circle class="trend-hit" cx="${x}" cy="${y}" r="13"></circle>
        <circle class="trend-point" cx="${x}" cy="${y}" r="3.5"></circle>
        <g class="trend-tooltip" transform="translate(${tooltipX} ${tooltipY})">
          <rect width="${tooltipWidth}" height="${tooltipHeight}" rx="7"></rect>
          <text x="10" y="18">${escapeHtml(formatShortDate(row.date))} · ${escapeHtml(formatKrw(row.totalValueKrw))}</text>
          <text x="10" y="36">일 증감 ${escapeHtml(tone + formatKrw(dailyChange))}</text>
        </g>
      </g>`;
    })
    .join("");
  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="총자산 추이">
      ${valueLabels
        .map((value) => `<polyline class="trend-grid" points="${padding.left},${yFor(value)} ${width - padding.right},${yFor(value)}"></polyline>`)
        .join("")}
      <polygon class="trend-area" points="${area}"></polygon>
      <polyline class="trend-line" points="${line}"></polyline>
      ${pointGroups}
      <text class="trend-last-label" x="${Math.min(width - padding.right - 4, lastX + 8)}" y="${Math.max(16, lastY - 10)}" text-anchor="end">${formatCompactKrw(lastRow.totalValueKrw)}</text>
      ${labels
        .map((row, index) => `<text class="trend-label" x="${xFor(index === 0 ? 0 : index === 1 ? Math.floor((chartRows.length - 1) / 2) : chartRows.length - 1)}" y="${height - 10}" text-anchor="${index === 0 ? "start" : index === 1 ? "middle" : "end"}">${formatShortDate(row.date)}</text>`)
        .join("")}
      ${valueLabels
        .map((value) => `<text class="trend-value-label" x="10" y="${yFor(value) + 4}">${formatCompactKrw(value)}</text>`)
        .join("")}
    </svg>
  `;
}

function renderWaterfall(stats) {
  const items = [
    { label: "총 증감", value: stats.periodChangeKrw, tone: stats.periodChangeKrw >= 0 ? "positive" : "negative" },
    { label: "입출금", value: stats.netInflowKrw, tone: "neutral" },
    { label: "투자손익", value: stats.investmentGainKrw, tone: stats.investmentGainKrw >= 0 ? "positive" : "negative" },
  ];
  const max = Math.max(1, ...items.map((item) => Math.abs(item.value)));
  return items
    .map((item) => {
      const width = Math.max(6, Math.round((Math.abs(item.value) / max) * 100));
      return `<div class="waterfall-row">
        <span>${escapeHtml(item.label)}</span>
        <div class="waterfall-track"><b class="${item.tone}" style="width:${width}%"></b></div>
        <strong class="${item.tone === "negative" ? "negative" : item.tone === "positive" ? "positive" : ""}">${formatKrw(item.value)}</strong>
      </div>`;
    })
    .join("");
}

function renderPerformanceInsights(stats) {
  const flowShare = stats.periodChangeKrw ? stats.netInflowKrw / stats.periodChangeKrw : 0;
  const gainLabel = stats.investmentGainKrw >= 0 ? "투자손익이 총자산 증가에 기여했습니다" : "투자손익이 총자산을 낮췄습니다";
  return `
    <div><strong>기간 해석</strong><span>${gainLabel}. 입출금 보정 후 수익률은 ${formatPercent(stats.periodReturn)}입니다.</span></div>
    <div><strong>현금흐름 영향</strong><span>총 증감 중 입출금 비중은 ${Number.isFinite(flowShare) ? formatPercent(flowShare) : "0.00%"}입니다.</span></div>
    <div><strong>리스크</strong><span>선택 기간 최대 낙폭은 ${formatKrw(stats.maxDrawdownKrw)} (${formatPercent(stats.maxDrawdownRate)})입니다.</span></div>
  `;
}

function getStrategyPerformanceRows() {
  const totals = getTotals(state.holdings);
  return groupByValue(state.holdings, "strategy")
    .map((item) => {
      const holdings = state.holdings.filter((holding) => holding.strategy === item.label);
      const costKrw = holdings.reduce((sum, holding) => sum + getHoldingValues(holding).costKrw, 0);
      const gainKrw = holdings.reduce((sum, holding) => sum + getHoldingValues(holding).gainKrw, 0);
      return {
        strategy: item.label,
        valueKrw: item.value,
        weight: totals.stockValueKrw ? item.value / totals.stockValueKrw : 0,
        gainKrw,
        returnRate: costKrw ? gainKrw / costKrw : 0,
        count: holdings.length,
      };
    })
    .sort((a, b) => b.valueKrw - a.valueKrw);
}

async function exportBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stock-portfolio-backup-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  els.backupStatus.textContent = `백업 생성 완료 · ${formatAsOf(payload.exportedAt)}`;
}

async function restoreBackup(file) {
  if (!file) {
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    const nextState = normalizeState(payload.state || payload);
    state = nextState;
    saveState();
    render();
    els.backupStatus.textContent = `복원 완료 · ${file.name}`;
    setStatus("백업 복원 완료", "현재 포트폴리오에 반영했습니다");
  } catch (error) {
    els.backupStatus.textContent = `복원 실패 · ${error.message}`;
    setStatus("백업 복원 실패", error.message);
  }
}

async function loadImportSummary() {
  try {
    const summary = await fetchJson("/api/import/summary");
    els.importSummary.textContent = `보유 ${summary.holdings}개 · 스냅샷 ${summary.snapshots}개 · 예수금 ${summary.cashBalances}개 · 총자산 ${formatKrw(summary.migratedTotalAssetsKrw)}`;
  } catch (error) {
    els.importSummary.textContent = `검증 리포트를 불러오지 못했습니다 · ${error.message}`;
  }
}

async function previewImport(file) {
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
    setStatus("Import preview 완료", "확정 전까지 현재 포트폴리오는 바뀌지 않습니다");
  } catch (error) {
    els.importSummary.textContent = `Preview 실패 · ${error.message}`;
    setStatus("Import preview 실패", error.message);
  }
}

async function commitImport() {
  els.commitImportButton.disabled = true;
  try {
    const result = await fetchJson("/api/import/commit", {
      method: "POST",
    });
    state = await loadState();
    render();
    els.importSummary.textContent = `Import 확정 완료 · 보유 ${result.holdings}개 · 스냅샷 ${result.snapshots}개 · 예수금 ${result.cashBalances}개`;
    setStatus("Import 확정 완료", "새 포트폴리오를 저장했습니다");
  } catch (error) {
    els.importSummary.textContent = `Import 확정 실패 · ${error.message}`;
    setStatus("Import 확정 실패", error.message);
  }
}

function getNetInflowKrw(date) {
  return calculateNetInflowKrw(state.cashFlows, date);
}

function getExternalFlowAmount(flow) {
  return calculateExternalFlowAmount(flow);
}

function formatFlowType(type) {
  return {
    deposit: "입금",
    withdrawal: "출금",
    dividend: "배당",
    tax: "세금",
    fee: "수수료",
  }[type] || type || "";
}

function getTotals(holdings) {
  return calculateTotals({
    holdings,
    cashBalances: state.cashBalances,
    fxRate: state.fxRate.rate,
  });
}

function getCashTotalKrw() {
  return (state.cashBalances || []).reduce((sum, cash) => sum + getCashValueKrw(cash), 0);
}

function getCashValueKrw(cash) {
  return calculateCashValueKrw(cash, state.fxRate.rate);
}

function getUnclassifiedCashBalances() {
  return (state.cashBalances || []).filter(isUnclassifiedCash);
}

function getKnownAccounts() {
  return getKnownAccountsFromState(state, makeId);
}

function isAccountInUse(account) {
  return isAccountInUseInState(state, account);
}

function getHoldingValues(holding) {
  return calculateHoldingValues(holding, state.fxRate.rate);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function setStatus(status, detail) {
  els.providerStatus.textContent = status;
  els.lastUpdated.textContent = detail;
}

function setActionState(kind, isRunning) {
  if (kind === "price" && els.refreshButton) {
    els.refreshButton.disabled = isRunning;
    els.refreshButton.textContent = isRunning ? "가격 갱신 중..." : "가격 다시 가져오기";
  }
  if (kind === "snapshot" && els.saveSnapshotButton) {
    els.saveSnapshotButton.disabled = isRunning;
    els.saveSnapshotButton.textContent = isRunning ? "성과 기록 중..." : "오늘 스냅샷 다시 계산";
  }
}

function showOperationToast(title, detail, tone = "info") {
  if (!els.operationToast) {
    return;
  }
  window.clearTimeout(toastTimer);
  els.operationToast.hidden = false;
  els.operationToast.dataset.tone = tone;
  els.operationToastTitle.textContent = title;
  els.operationToastDetail.textContent = detail;
  if (tone !== "busy") {
    toastTimer = window.setTimeout(() => {
      els.operationToast.hidden = true;
    }, 4200);
  }
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
