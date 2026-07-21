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
  formatMonthDay,
  formatShortDate,
} from "./formatters.js";
import {
  filterSnapshotRows,
  getAccountPerformanceRows as selectAccountPerformanceRows,
  getAvailableMonths,
  getMonthlyRows as selectMonthlyRows,
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
import { clearStaleQuoteCaches, fetchJson, getQuote, getUsdKrw, searchSymbols } from "./services/market-data-service.js";
import { getUsMarketContextForSeoulDate } from "../domain/market-calendar.js";
import { initSimulatorView } from "./simulator-view.js";
import {
  buildAccountSnapshots as createAccountSnapshots,
  buildPortfolioSnapshot as createPortfolioSnapshot,
  getCashValueKrw as calculateCashValueKrw,
  getExternalFlowAmount as calculateExternalFlowAmount,
  getHoldingValues as calculateHoldingValues,
  getNetInflowKrw as calculateNetInflowKrw,
  getTotals as calculateTotals,
  groupByAccount as calculateGroupByAccount,
  normalizeDashboardLayout,
} from "../domain/portfolio-core.js";
import {
  init as initHoldingsView,
  renderHoldings,
  openHoldingDrawer,
  closeHoldingDrawer,
  filteredHoldings,
  tickerLogoHtml,
  exportVisibleHoldings,
  startEditHolding,
  hideTickerSuggestions,
  queueTickerSearch,
  selectTickerSuggestion,
  saveInlineHoldingEdit,
  setHoldingsViewMode,
} from "./holdings-view.js";
import {
  init as initPerformanceView,
  renderPerformance,
  renderBreakdown,
  renderTopMover,

  renderSnapshots,
  renderMonthlySummary,
  exportPerformanceCsv,
  copyPerformanceSummary,
  setContributionView,
} from "./performance-view.js";
// 입출금 탭은 Phase 3 에서 React CashflowsView 가 소유한다(cashflows-view.js 제거).
import {
  init as initAutomationView,
  renderAutomation,
  renderDashboardStatus,
  renderPriceLogs,
  renderNotifications,
  saveTodaySnapshot,
  queueAutomaticPriceRefresh,
  refreshPrices,
  getRecentPriceRefreshImpact,
  loadNotificationState,
  saveNotificationSettings,
  sendTestNotification,
  findTelegramChatId,
  exportBackup,
  restoreBackup,
  loadImportSummary,
  previewImport,
  commitImport,
  buildPortfolioSnapshot,
  saveTodaySnapshotNow,
  renderReconciliation,
  formatNotificationStatus,
  getPriceRefreshPromise,
  getNotificationSettings,
  getNotificationLogs,
} from "./automation-view.js";
import {
  init as initDashboardView,
  renderSummary,
  renderAllocation,
  renderAllocationOverview,
  renderFilters,
  renderSortHeaders,
  renderAccountSelectors,
  fillSelect,
  getAllocationItems,
  accountOption,
  updateSortHeaderButtons,
  renderDashboardLayout,
  createLayoutControls,
  handleDashboardLayoutAction,
  handleDashboardResizeMove,
  finishDashboardResize,
  getDashboardColumnWidth,
  getDashboardDropTarget,
  shouldDropAfter,
  reorderDashboardLayout,
  clearDashboardDragState,
  getIsLayoutEditing,
  setIsLayoutEditing,
  getDraggedDashboardCardId,
  setDraggedDashboardCardId,
  getResizingDashboardCard,
  setResizingDashboardCard,
} from "./dashboard-view.js";
import { useStore } from "../react/store/useStore.js";

// 계좌 탭은 Phase 2 에서 React AccountsView 가 소유한다(accounts-view.js 제거).
// cashflows/holdings 뷰가 ctx 로 쓰는 공용 행 메뉴 헬퍼만 여기로 이식한다.
function rowActionMenu(label, actions) {
  return `<details class="row-menu">
    <summary aria-label="${escapeHtml(label)}" title="작업 더보기">⋮</summary>
    <div class="row-menu-popover">${actions.join("")}</div>
  </details>`;
}

let holdingHeaderSort = { key: "value", dir: "desc" };
let cashFlowHeaderSort = { key: "date", dir: "desc" };
let currencyMode = localStorage.getItem("currencyMode") === "usd" ? "usd" : "krw";
const HOLDINGS_PAGE_SIZE = window.innerWidth <= 980 ? 100 : 10;

const sampleState = createSampleState(makeId);

let state = createEmptyState();
let editingHoldingId = null;
let editingAccountId = null;
let holdingPage = 1;
let holdingScope = "all";
let holdingsViewMode = "detail";
let priceRefreshPromise = null;
let snapshotSavePromise = null;
let toastTimer = null;
let tickerSearchTimer = null;
let tickerSearchSeq = 0;
let notificationSettings = {
  telegram_chat_id: "",
  telegram_enabled: false,
  daily_digest_enabled: true,
  large_move_threshold_krw: 0,
};
let notificationLogs = [];
let authState = {
  configured: false,
  signedIn: false,
  user: null,
};
const VIEW_IDS = Object.keys(viewCopy);
function viewFromHash() {
  const hash = window.location.hash.slice(1);
  return VIEW_IDS.includes(hash) ? hash : null;
}
let activeView = viewFromHash() || (window.innerWidth <= 980 ? "holdings" : "dashboard");
let activeAllocationView = "strategy";
let syncState = {
  status: "idle",
  message: "",
};

const DEFAULT_STRATEGIES = ["QQQ", "S&P500", "국내주식", "SCHD", "기타"];
const allocationViewLabels = {
  strategy: "전략",
  holding: "종목",
  account: "계좌",
  investor: "투자자",
  accountType: "계좌 유형",
};

const els = getDomElements();

// 사이드바 nav(탭/통화토글/테마/모바일 더보기 드로어)는 Phase 1b-1 에서 React 셸(Sidebar)이 소유한다.
// React 셸이 store.actions 를 통해 아래 액션을 호출한다. store 로 view/currency 를 push 한다.
useStore.getState().registerActions({
  setView: (view) => setView(view),
  applyCurrencyMode: (mode) => applyCurrencyMode(mode),
  // 포팅된 React 탭이 상태를 변경할 때 쓰는 공용 mutation 표면.
  // fn(state)이 state 를 직접 변형(또는 새 state 반환)하면 save+render 로 브리지에 반영한다.
  // legacy 가 여전히 단일 writer 이므로 React 는 이 액션을 통해서만 쓴다(Phase 8 에서 store 로 승격).
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
});

window.addEventListener("popstate", () => {
  setView(viewFromHash() || "dashboard", { fromHistory: true });
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

els.dashboardRefreshButton?.addEventListener("click", () => {
  refreshPrices({ reason: "manual" }).catch((error) => {
    setStatus("가격 업데이트 실패", error.message);
    showOperationToast("가격 업데이트 실패", error.message, "error");
  });
});

els.dashboardSnapshotButton?.addEventListener("click", () => {
  saveTodaySnapshot({ reason: "manual" }).catch((error) => {
    setStatus("오늘 성과 기록 실패", error.message);
    showOperationToast("오늘 성과 기록 실패", error.message, "error");
  });
});

els.dashboardAddHoldingButton?.addEventListener("click", () => {
  editingHoldingId = null;
  openHoldingDrawer();
  updateEditControls();
  renderAccountSelectors();
  setView("holdings");
});

els.allocationDimensionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeAllocationView = button.dataset.allocationView || "strategy";
    if (els.allocationDimensionSelect) els.allocationDimensionSelect.value = activeAllocationView;
    renderAllocation();
  });
});
els.allocationDimensionSelect?.addEventListener("change", () => {
  activeAllocationView = els.allocationDimensionSelect.value || "strategy";
  renderAllocation();
});

// 로그인/이메일 다이얼로그, 로그인 버튼, 배너 로그인 버튼은 React 셸(ContentChrome)이 소유한다.
// 아래 액션들을 store 에 등록하면 React 컴포넌트가 호출한다.
useStore.getState().registerActions({
  openLoginDialog,
  closeLoginDialog,
  openEmailDialog: openEmailLoginDialog,
  closeEmailDialog: closeEmailLoginDialog,
  signInWithGoogle: handleGoogleLogin,
  signInWithNaver: handleNaverLogin,
  signInWithEmail: sendEmailLoginLink,
  signOut: handleLogout,
});

els.notificationForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveNotificationSettings().catch((error) => {
    setStatus("알림 설정 저장 실패", error.message);
    showOperationToast("알림 설정 저장 실패", error.message, "error");
  });
});

els.testNotificationButton?.addEventListener("click", () => {
  sendTestNotification().catch((error) => {
    setStatus("테스트 알림 실패", error.message);
    showOperationToast("테스트 알림 실패", error.message, "error");
  });
});

els.findTelegramChatButton?.addEventListener("click", () => {
  findTelegramChatId().catch((error) => {
    setStatus("chat id 찾기 실패", error.message);
    showOperationToast("chat id 찾기 실패", error.message, "error");
  });
});

els.emptyPortfolioButton.addEventListener("click", () => {
  const ok = window.confirm("현재 포트폴리오 데이터를 비우고 빈 상태로 시작할까요?");
  if (!ok) {
    return;
  }
  state = createEmptyState();
  setIsLayoutEditing(false);
  saveState();
  render();
  showOperationToast("포트폴리오 초기화", "보유 종목과 계좌를 새로 입력하세요");
});

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

els.resetButton.addEventListener("click", () => {
  state = structuredClone(sampleState);
  setIsLayoutEditing(false);
  saveState();
  render();
  showOperationToast("예시 데이터 로드됨", "보유 종목과 계좌에서 직접 입력하세요");
});

els.layoutEditButton.addEventListener("click", () => {
  if (window.STOCKLIO_USE_CRAFT) {
    return;
  }
  setIsLayoutEditing(!getIsLayoutEditing());
  renderDashboardLayout();
});

els.layoutResetButton.addEventListener("click", () => {
  if (window.STOCKLIO_USE_CRAFT) {
    return;
  }
  state.dashboardLayout = structuredClone(defaultDashboardLayout);
  setIsLayoutEditing(false);
  saveState();
  renderDashboardLayout();
  showOperationToast("레이아웃 초기화", "기본 배치로 되돌렸습니다");
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
  if (!getIsLayoutEditing() || !handle) {
    return;
  }
  const card = handle.closest("[data-dashboard-card]");
  const item = normalizeDashboardLayout(state.dashboardLayout).find((layoutItem) => layoutItem.id === card?.dataset.dashboardCard);
  if (!card || !item) {
    return;
  }
  event.preventDefault();
  setResizingDashboardCard({
    id: item.id,
    startX: event.clientX,
    startY: event.clientY,
    startSpan: item.span,
    startHeight: card.getBoundingClientRect().height,
  });
  card.classList.add("is-resizing");
  card.draggable = false;
  window.addEventListener("pointermove", handleDashboardResizeMove);
  window.addEventListener("pointerup", finishDashboardResize, { once: true });
});

els.dashboardBoard.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-dashboard-card]");
  if (!getIsLayoutEditing() || !card || event.target.closest("button, input, select, textarea")) {
    event.preventDefault();
    return;
  }
  setDraggedDashboardCardId(card.dataset.dashboardCard);
  card.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", getDraggedDashboardCardId());
});

els.dashboardBoard.addEventListener("dragover", (event) => {
  if (!getIsLayoutEditing() || !getDraggedDashboardCardId()) {
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
  if (!getIsLayoutEditing() || !getDraggedDashboardCardId()) {
    return;
  }
  event.preventDefault();
  const target = getDashboardDropTarget(event);
  reorderDashboardLayout(getDraggedDashboardCardId(), target?.dataset.dashboardCard, target ? shouldDropAfter(event, target) : true);
  clearDashboardDragState();
});

els.dashboardBoard.addEventListener("dragend", () => {
  clearDashboardDragState();
});

// 필터 팝오버 토글
els.filterPopoverBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = !els.filterPopover.hidden;
  els.filterPopover.hidden = open;
  els.filterPopoverBtn.setAttribute("aria-expanded", String(!open));
});
document.addEventListener("click", (e) => {
  if (!els.filterPopover?.hidden && !els.filterPopover.contains(e.target) && e.target !== els.filterPopoverBtn) {
    els.filterPopover.hidden = true;
    els.filterPopoverBtn?.setAttribute("aria-expanded", "false");
  }
});

// 통화 모드 토글: 버튼 UI 는 React 셸(Sidebar)이 store.currencyMode 로 렌더한다.
// 여기서는 상태 갱신 + legacy 뷰 재렌더 + store push + currencyModeChange 이벤트를 담당한다.
function applyCurrencyMode(mode) {
  currencyMode = mode === "usd" ? "usd" : "krw";
  localStorage.setItem("currencyMode", currencyMode);
  useStore.getState().setCurrencyMode(currencyMode);
  renderHoldings();
  renderSummary();
  window.dispatchEvent(new CustomEvent("currencyModeChange", { detail: currencyMode }));
}
// 초기 통화 모드를 store 에 반영한다(부트스트랩 시점의 localStorage 값).
useStore.getState().setCurrencyMode(currencyMode);

// 필터 초기화
els.filterResetBtn?.addEventListener("click", () => {
  if (els.investorFilter) els.investorFilter.value = "";
  if (els.strategyFilter) els.strategyFilter.value = "";
  if (els.accountTypeFilter) els.accountTypeFilter.value = "";
  holdingPage = 1;
  renderHoldings();
});

for (const filter of [els.investorFilter, els.strategyFilter, els.accountTypeFilter, els.holdingSort]) {
  filter.addEventListener("change", () => {
    holdingPage = 1;
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
    holdingPage = 1;
    holdingHeaderSort = parseSortValue(nextSort, DEFAULT_HOLDING_SORT);
    renderSortHeaders();
    renderHoldings();
  });
});

els.holdingSearch.addEventListener("input", () => {
  holdingPage = 1;
  renderHoldings();
});

for (const [button, scope] of [
  [els.holdingScopeAll, "all"],
  [els.holdingScopeGain, "gain"],
  [els.holdingScopeLoss, "loss"],
]) {
  button?.addEventListener("click", () => {
    holdingScope = scope;
    holdingPage = 1;
    renderHoldings();
  });
}

els.holdingsViewDetail?.addEventListener("click", () => {
  setHoldingsViewMode("detail");
  renderHoldings();
});
els.holdingsViewSummary?.addEventListener("click", () => {
  setHoldingsViewMode("summary");
  renderHoldings();
});

els.holdingForm.elements.ticker.addEventListener("input", () => {
  els.holdingForm.elements.name.value = "";
  queueTickerSearch();
});
els.holdingForm.elements.ticker.addEventListener("focus", queueTickerSearch);
els.holdingTickerSuggestions.addEventListener("mousedown", (event) => {
  const button = event.target.closest("[data-symbol]");
  if (!button) {
    return;
  }
  event.preventDefault();
  selectTickerSuggestion(button.dataset.symbol, button.dataset.name);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".ticker-search-field")) {
    hideTickerSuggestions();
  }
});

els.addHoldingButton.addEventListener("click", () => {
  editingHoldingId = null;
  openHoldingDrawer();
  updateEditControls();
  renderAccountSelectors();
  setView("holdings");
});

els.holdingDrawerClose?.addEventListener("click", () => closeHoldingDrawer());
els.holdingDrawerBackdrop?.addEventListener("click", () => closeHoldingDrawer());
els.holdingCancel.addEventListener("click", () => closeHoldingDrawer());
els.holdingsExportButton?.addEventListener("click", exportVisibleHoldings);

els.performanceRange.addEventListener("change", () => {
  renderPerformance();
  renderSnapshots();
  renderMonthlySummary();
});

els.snapshotDayFilter?.addEventListener("change", renderSnapshots);

els.performanceCopyButton?.addEventListener("click", copyPerformanceSummary);
els.performanceExportButton?.addEventListener("click", exportPerformanceCsv);

els.contributionViewAccount?.addEventListener("click", () => setContributionView("account"));
els.contributionViewStrategy?.addEventListener("click", () => setContributionView("strategy"));

// 입출금 필터/정렬/폼/인라인 편집은 Phase 3 에서 React CashflowsView 가 소유한다.
// 계좌 필터/검증/계좌 폼/계좌별 예수금은 Phase 2 에서 React AccountsView 가 소유한다.

els.holdingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const account = parseAccountKey(form.get("accountKey"));
  const ticker = String(form.get("ticker")).trim().toUpperCase();
  const selectedName = String(form.get("name") || "").trim();
  const name = selectedName || ticker || String(form.get("strategy"));
  const existingHolding = editingHoldingId ? state.holdings.find((holding) => holding.id === editingHoldingId) : null;
  const averageCost = Number(form.get("averageCost"));
  const currency = existingHolding?.currency || (/^[0-9]{6}\.KS$/.test(ticker) ? "KRW" : "USD");
  const nextHolding = {
    id: editingHoldingId || makeId(),
    investor: account.investor,
    account: account.account,
    accountType: normalizeAccountType(String(form.get("accountType"))),
    strategy: normalizeStrategy(form.get("strategy")),
    ticker: ticker || name,
    name,
    quantity: Number(form.get("quantity")),
    averageCost,
    price: existingHolding?.price ?? averageCost,
    currency,
    priceSource: existingHolding?.priceSource || "사용자 입력",
    priceAsOf: existingHolding?.priceAsOf || new Date().toISOString(),
    autoPrice: existingHolding?.autoPrice ?? true,
    targetPrice: Number(form.get("targetPrice")) || null,
    stopLoss: Number(form.get("stopLoss")) || null,
  };
  if (editingHoldingId) {
    state.holdings = state.holdings.map((holding) => (holding.id === editingHoldingId ? { ...holding, ...nextHolding } : holding));
  } else {
    state.holdings.push(nextHolding);
  }
  editingHoldingId = null;
  event.currentTarget.reset();
  hideTickerSuggestions();
  closeHoldingDrawer({ reset: false });
  updateEditControls();
  saveState();
  render();
  // 보유 종목 저장 — UI에 반영
});

els.holdingCancel.addEventListener("click", () => cancelEdit("holding"));
els.accountCancel?.addEventListener("click", () => cancelEdit("account"));

// 미분류 예수금 배분은 Phase 2 에서 React AccountsView 가 소유한다.

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

async function initialize() {
  // 테마 초기 적용은 index.html <head> 인라인 스크립트가, 토글은 React 셸(useTheme)이 담당한다.
  clearStaleQuoteCaches();
  const ctx = {
    getState: () => state,
    els,
    saveState,
    render,
    makeId,
    todayKey,
    setStatus,
    setActionState,
    showOperationToast,
    setView,
    updateEditControls,
    getTotals,
    getCashValueKrw,
    getHoldingValues,
    getCashTotalKrw,
    getUnclassifiedCashBalances,
    getKnownAccounts,
    isAccountInUse,
    groupByAccount: calculateGroupByAccount,
    groupByValue,
    unique,
    normalizeStrategy,
    strategyBuckets,
    getEditingHoldingId: () => editingHoldingId,
    setEditingHoldingId: (id) => { editingHoldingId = id; },
    getEditingAccountId: () => editingAccountId,
    setEditingAccountId: (id) => { editingAccountId = id; },
    getAuthState: () => authState,
    setAuthState: (s) => { authState = s; },
    getSyncState: () => syncState,
    setSyncState: (s) => { syncState = s; },
    getHoldingDailyMove: selectHoldingDailyMove,
    getDailyMoveRows: selectDailyMoveRows,
    getCurrentMarketContext: () => getUsMarketContextForSeoulDate(),
    getSnapshotRows: selectSnapshotRows,
    getFilteredSnapshotRows: filterSnapshotRows,
    buildAccountSnapshots: createAccountSnapshots,
    getRecentPriceRefreshImpact,
    renderAccountSelectors,
    clamp,
    // sort helpers
    parseSortValue,
    cycleSortValue,
    DEFAULT_HOLDING_SORT,
    DEFAULT_CASH_FLOW_SORT,
    get holdingHeaderSort() { return holdingHeaderSort; },
    set holdingHeaderSort(v) { holdingHeaderSort = v; },
    get cashFlowHeaderSort() { return cashFlowHeaderSort; },
    set cashFlowHeaderSort(v) { cashFlowHeaderSort = v; },
    // allocation view state
    get activeAllocationView() { return activeAllocationView; },
    get allocationViewLabels() { return allocationViewLabels; },
    // labels/formatters
    accountTypeLabels,
    formatAccountType,
    formatShortDate,
    // account helpers
    isUnclassifiedCash,
    parseAccountKey,
    normalizeAccountType,
    // auth state direct access
    get authState() { return authState; },
    // currency display mode
    get currencyMode() { return currencyMode; },
    setCurrencyMode(mode) {
      currencyMode = mode;
      localStorage.setItem("currencyMode", mode);
    },
    getFxRate: () => state.fxRate.rate,
    getFxRateObj: () => state.fxRate,
    // state management
    setState: (s) => { state = s; },
    loadState,
    normalizeState,
    // cancel edit
    cancelEdit,
    // accounts-view helpers
    rowActionMenu,
  };
  initHoldingsView(ctx);
  initPerformanceView(ctx);
  initAutomationView(ctx);
  initDashboardView(ctx);
  try {
    configureRuntimeSurface();
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

function configureRuntimeSurface() {
  if (!isStaticDeployment()) {
    return;
  }
  document.querySelectorAll("[data-local-only]").forEach((element) => {
    element.hidden = true;
  });
  if (els.importSummary) {
    els.importSummary.textContent = "엑셀 가져오기는 로컬 환경 전용입니다";
  }
  if (els.backupStatus) {
    els.backupStatus.textContent = "JSON 백업과 복원은 현재 브라우저 포트폴리오에 적용됩니다";
  }
}

function makeId() {
  return crypto.randomUUID();
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

function strategyBuckets(values = []) {
  const extras = unique(values.map((value) => normalizeStrategy(value)).filter((value) => !DEFAULT_STRATEGIES.includes(value)));
  return [...DEFAULT_STRATEGIES, ...extras];
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
  renderTopMover();

  // 계좌 목록/개요/예수금 잔고는 Phase 2 에서 React AccountsView 가 store 구독으로 렌더한다.
  renderSnapshots();
  renderMonthlySummary();
  renderAllocationOverview();
  renderHoldings();
  // 입출금 기록/배당 차트는 Phase 3 에서 React CashflowsView 가 store 구독으로 렌더한다.
  renderAutomation();
  renderDashboardStatus();
  renderPriceLogs();
  renderNotifications();
  renderReconciliation();
  renderDashboardLayout();
  renderEmptyPortfolioNotice();
  publishState();
  renderAuth();
}

function renderAuth() {
  // auth 패널/배너/버튼 disabled 상태는 React 셸(Toolbar/SampleDataBanner)이 store.auth 로 렌더한다.
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
  renderDashboardStatus();
}

function openLoginDialog() {
  useStore.getState().setLoginDialog(true);
}

function closeLoginDialog() {
  useStore.getState().setLoginDialog(false);
}

function openEmailLoginDialog() {
  // 로그인 다이얼로그에서 넘어오는 경우가 있어 먼저 닫는다(두 모달 동시 open 방지).
  useStore.getState().setLoginDialog(false);
  useStore.getState().setEmailDialog(true, authState.user?.email || "");
}

function closeEmailLoginDialog() {
  useStore.getState().setEmailDialog(false);
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

let syncClearTimer = null;
function setSyncState(status, message) {
  syncState = { status, message };
  renderSyncStatus();
  // synced 상태는 1.5초 후 자동으로 숨김
  if (syncClearTimer) clearTimeout(syncClearTimer);
  if (status === "synced") {
    syncClearTimer = setTimeout(() => {
      syncState = { status: "idle", message: "" };
      renderSyncStatus();
    }, 1500);
  }
}

function renderSyncStatus() {
  // sync 상태 표시는 React 셸(Toolbar)이 store.sync + store.auth 로 렌더한다.
  useStore.getState().setSync({ status: syncState.status, message: syncState.message });
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

let simulatorInitialized = false;

function setView(view, { fromHistory = false, replaceHistory = false } = {}) {
  if (!VIEW_IDS.includes(view)) {
    view = "dashboard";
  }
  if (activeView === "holdings" && view !== "holdings") {
    editingHoldingId = null;
    els.holdingFormPanel.hidden = true;
    els.holdingForm.reset();
    renderHoldings();
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
  // page title/subtitle 및 활성 탭 표시는 React 셸(Toolbar/Sidebar)이 store 로 구동한다.
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
  if (view === "simulator" && !simulatorInitialized) {
    simulatorInitialized = true;
    initSimulatorView();
  }
  // 배너 표시는 React 셸(SampleDataBanner)이 store.auth + store.activeView 로 파생한다.
  renderEmptyPortfolioNotice();
}

function cancelEdit(kind) {
  // 계좌/입출금 편집은 React AccountsView/CashflowsView 가 소유한다. 여기서는 종목만 처리한다.
  if (kind === "holding") {
    closeHoldingDrawer();
  }
  updateEditControls();
  renderAccountSelectors();
}

function updateEditControls() {
  // 계좌/입출금 폼은 React AccountsView/CashflowsView 가 소유한다. 종목 폼만 처리한다.
  els.holdingSubmit.textContent = editingHoldingId ? "수정 저장" : "목록에 추가";
  els.holdingCancel.hidden = Boolean(els.holdingFormPanel?.hidden);
  if (els.holdingFormTitle) {
    els.holdingFormTitle.textContent = editingHoldingId ? "종목 수정" : "종목 추가";
    els.holdingFormSubtitle.textContent = editingHoldingId ? "보유 포지션의 계좌, 전략, 수량, 평단가를 수정합니다." : "현재 보유 종목 목록에 새 포지션을 추가합니다.";
  }
}

function getTotals(holdings) {
  return calculateTotals({
    holdings: holdings || state.holdings,
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

function groupByValue(holdings, key) {
  const map = new Map();
  for (const holding of holdings) {
    map.set(holding[key], (map.get(holding[key]) || 0) + getHoldingValues(holding).valueKrw);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function setStatus(status, detail) {
  // sr-only 상태 라인은 React 셸(Toolbar)이 store.status 로 렌더한다.
  useStore.getState().setStatus({ title: status, detail });
}

function setActionState(kind, isRunning) {
  if (kind === "price" && els.refreshButton) {
    els.refreshButton.disabled = isRunning;
    els.refreshButton.textContent = isRunning ? "가격 갱신 중..." : "가격 다시 가져오기";
  }
  if (kind === "price" && els.dashboardRefreshButton) {
    els.dashboardRefreshButton.disabled = isRunning;
    els.dashboardRefreshButton.textContent = isRunning ? "확인 중..." : "시세 확인";
  }
  if (kind === "snapshot" && els.saveSnapshotButton) {
    els.saveSnapshotButton.disabled = isRunning;
    els.saveSnapshotButton.textContent = isRunning ? "성과 기록 중..." : "오늘 스냅샷 다시 계산";
  }
  if (kind === "snapshot" && els.dashboardSnapshotButton) {
    els.dashboardSnapshotButton.disabled = isRunning;
    els.dashboardSnapshotButton.textContent = isRunning ? "저장 중..." : "스냅샷 저장";
  }
}

function showOperationToast(title, detail, tone = "info") {
  // 토스트는 React 셸(Toast)이 store.toast 로 렌더한다. 자동 숨김 타이머는 여기서 스케줄한다.
  const store = useStore.getState();
  window.clearTimeout(toastTimer);
  store.setToast({ visible: true, title, detail, tone });
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
