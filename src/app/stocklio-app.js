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
import { fetchJson, getQuote, getUsdKrw, searchSymbols } from "./services/market-data-service.js";
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
  renderRebalance,
  renderSnapshots,
  renderMonthlySummary,
  exportPerformanceCsv,
  copyPerformanceSummary,
  renderTrendChart,
  renderWaterfall,
  renderPerformanceInsights,
  getStrategyPerformanceRows,
} from "./performance-view.js";
import {
  init as initCashflowsView,
  renderCashFlows,
  renderDividendChart,
  renderCashBalances,
  allocateUnclassifiedCash,
  startEditCashFlow,
  startEditCashBalance,
  formatFlowType,
  cashFlowTypeOptions,
  currencyOptions,
  saveInlineCashBalanceEdit,
  saveInlineCashFlowEdit,
} from "./cashflows-view.js";
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
import {
  init as initAccountsView,
  renderAccounts,
  renderAccountDetail,
  renderAccountOverview,
  renderAccountSummary,
  renderCashSelectedPreview,
  syncCashFormToSelectedAccount,
  getAccountStats,
  getFilteredAccounts,
  rowActionMenu,
  startEditAccount,
} from "./accounts-view.js";

let holdingHeaderSort = { key: "value", dir: "desc" };
let cashFlowHeaderSort = { key: "date", dir: "desc" };
const HOLDINGS_PAGE_SIZE = window.innerWidth <= 980 ? 100 : 10;

const sampleState = createSampleState(makeId);

let state = createEmptyState();
let editingHoldingId = null;
let editingCashFlowId = null;
let editingCashBalanceId = null;
let editingAccountId = null;
let holdingPage = 1;
let holdingScope = "all";
let holdingsViewMode = "detail";
let selectedNumbersMonth = null; // "YYYY-MM" or null (= latest) // "detail" | "summary"
let numbersPerformanceChart = null;
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
let activeView = window.innerWidth <= 980 ? "holdings" : "dashboard";
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

els.viewTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.viewTab);
  });
});

// ─── 모바일 더보기 드로어 ─────────────────────────────────────────
(function initMoreDrawer() {
  // 모바일 전용: CSS 로 .nav-more-btn 이 표시될 때만 동작
  const moreBtn = document.getElementById("navMoreBtn");
  const drawer = document.getElementById("navMoreDrawer");
  const backdrop = document.getElementById("navMoreBackdrop");
  const itemsEl = document.getElementById("navMoreItems");
  if (!moreBtn || !drawer || !itemsEl) return;

  // 더보기에 포함될 탭 (data-nav-more 속성으로 표시됨, JS 로 이동)
  const MORE_TABS = ["cashflows", "automation", "simulator"];

  function openDrawer() {
    // 현재 탭 상태 반영해 아이템 생성
    itemsEl.innerHTML = "";
    MORE_TABS.forEach((tabId) => {
      const src = document.querySelector(`[data-view-tab="${tabId}"]`);
      if (!src) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-more-item" + (src.classList.contains("active") ? " active" : "");
      btn.dataset.viewTab = tabId;
      btn.innerHTML = `<span class="nav-more-icon">${src.dataset.navIcon}</span><span class="nav-more-name">${src.textContent}</span>`;
      btn.addEventListener("click", () => {
        setView(tabId);
        closeDrawer();
      });
      itemsEl.appendChild(btn);
    });
    drawer.hidden = false;
    moreBtn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => drawer.classList.add("open"));
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    moreBtn.setAttribute("aria-expanded", "false");
    drawer.addEventListener("transitionend", () => { drawer.hidden = true; }, { once: true });
  }

  moreBtn.addEventListener("click", () => {
    drawer.hidden ? openDrawer() : closeDrawer();
  });
  backdrop.addEventListener("click", closeDrawer);

  // setView 후 더보기 버튼 active 상태 갱신 (MORE_TABS 중 하나가 활성이면 강조)
  const _origSetView = setView;
  // setView 를 직접 패치하지 않고 viewTabs MutationObserver 대신 탭 클릭마다 갱신
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-view-tab]")) return;
    const activeTab = e.target.closest("[data-view-tab]")?.dataset.viewTab;
    moreBtn.classList.toggle("active", MORE_TABS.includes(activeTab));
  });
})();

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

els.openLoginButton?.addEventListener("click", () => {
  openLoginDialog();
});

document.getElementById("sampleDataLoginButton")?.addEventListener("click", () => {
  openLoginDialog();
});

els.loginDialogCloseButton?.addEventListener("click", () => {
  closeLoginDialog();
});

els.loginDialog?.addEventListener("click", (event) => {
  if (event.target === els.loginDialog) {
    closeLoginDialog();
  }
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

els.addAccountButton?.addEventListener("click", () => {
  editingAccountId = null;
  els.accountForm.reset();
  els.accountForm.hidden = false;
  updateEditControls();
  setView("automation");
  els.accountForm.scrollIntoView({ block: "center", behavior: "smooth" });
  els.accountForm.querySelector("input")?.focus();
});

els.googleLoginButton.addEventListener("click", () => {
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
});

els.naverLoginButton.addEventListener("click", () => {
  closeLoginDialog();
  window.StocklioAuth?.signInWithNaver?.().catch((error) => {
    setStatus("네이버 로그인 실패", error.message);
    showOperationToast("네이버 로그인 실패", "Supabase Custom OAuth Provider 설정을 확인하세요", "error");
  });
});

els.emailLoginButton.addEventListener("click", () => {
  closeLoginDialog();
  openEmailLoginDialog();
});

els.emailLoginCancelButton.addEventListener("click", () => {
  closeEmailLoginDialog();
});

els.emailLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendEmailLoginLink();
});

els.logoutButton.addEventListener("click", () => {
  els.logoutButton.disabled = true;
  setStatus("로그아웃 중", "세션을 정리하고 있습니다");
  window.StocklioAuth?.signOut?.()
    .then(() => {
      localStorage.removeItem(STORAGE_KEY);
      els.logoutButton.disabled = false;
      setStatus("로그아웃 완료", "다시 로그인할 수 있습니다");
    })
    .catch((error) => {
      els.logoutButton.disabled = false;
      setStatus("로그아웃 실패", error.message);
    });
});

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

els.accountDetailSelect.addEventListener("change", () => {
  syncCashFormToSelectedAccount();
  renderAccounts();
  renderAccountDetail();
  renderCashBalances();
});
for (const accountFilter of [els.accountInvestorFilter, els.accountCurrencyFilter, els.accountSearch]) {
  accountFilter?.addEventListener(accountFilter === els.accountSearch ? "input" : "change", renderAccounts);
}
els.cashBalanceForm.elements.accountKey.addEventListener("change", () => {
  els.accountDetailSelect.value = els.cashBalanceForm.elements.accountKey.value;
  renderAccounts();
  renderAccountDetail();
  renderCashBalances();
});
els.cashBalanceForm.elements.currency.addEventListener("change", renderCashSelectedPreview);
els.cashBalanceForm.elements.amount.addEventListener("input", renderCashSelectedPreview);
els.accountReconcileButton?.addEventListener("click", () => {
  renderReconciliation();
  setView("automation");
  els.reconcileSummary?.scrollIntoView({ block: "center", behavior: "smooth" });
});

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
  event.currentTarget.hidden = true;
  updateEditControls();
  saveState();
  render();
  // 계좌 저장 — UI에 반영되므로 별도 알림 불필요
});

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
  // 입출금 저장 상태 알림 제거
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
  // 예수금 저장 상태 알림 제거
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

function initTheme() {
  const saved = localStorage.getItem("stocklio-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved ? saved === "dark" : prefersDark;
  applyTheme(isDark ? "dark" : "light");

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("stocklio-theme", next);
  };
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
  document.getElementById("themeToggleMobile")?.addEventListener("click", toggleTheme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  const icon = document.getElementById("themeToggleIcon");
  const label = document.getElementById("themeToggleLabel");
  const iconM = document.getElementById("themeToggleIconMobile");
  const labelM = document.getElementById("themeToggleLabelMobile");
  if (icon) icon.textContent = isDark ? "☀️" : "🌙";
  if (label) label.textContent = isDark ? "라이트 모드" : "다크 모드";
  if (iconM) iconM.textContent = isDark ? "☀️" : "🌙";
  if (labelM) labelM.textContent = isDark ? "라이트 모드" : "다크 모드";
}

async function initialize() {
  initTheme();
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
    renderCashBalances,
    renderCashFlows,
    formatFlowType,
    getEditingHoldingId: () => editingHoldingId,
    setEditingHoldingId: (id) => { editingHoldingId = id; },
    getEditingAccountId: () => editingAccountId,
    setEditingAccountId: (id) => { editingAccountId = id; },
    getEditingCashFlowId: () => editingCashFlowId,
    setEditingCashFlowId: (id) => { editingCashFlowId = id; },
    getEditingCashBalanceId: () => editingCashBalanceId,
    setEditingCashBalanceId: (id) => { editingCashBalanceId = id; },
    getAuthState: () => authState,
    setAuthState: (s) => { authState = s; },
    getSyncState: () => syncState,
    setSyncState: (s) => { syncState = s; },
    startEditAccount,
    getHoldingDailyMove: selectHoldingDailyMove,
    getDailyMoveRows: selectDailyMoveRows,
    getCurrentMarketContext: () => getUsMarketContextForSeoulDate(),
    getSnapshotRows: selectSnapshotRows,
    getFilteredSnapshotRows: filterSnapshotRows,
    buildAccountSnapshots: createAccountSnapshots,
    getRecentPriceRefreshImpact,
    getAccountStats,
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
    // state management
    setState: (s) => { state = s; },
    loadState,
    normalizeState,
    // cancel edit
    cancelEdit,
    // accounts-view helpers
    renderCashSelectedPreview,
    rowActionMenu,
  };
  initHoldingsView(ctx);
  initPerformanceView(ctx);
  initCashflowsView(ctx);
  initAutomationView(ctx);
  initDashboardView(ctx);
  initAccountsView(ctx);
  try {
    configureRuntimeSurface();
    authState = await waitForAuthState();
    [state] = await Promise.all([loadState(), loadNotificationState()]);
    render();
    setView(activeView);
    renderAuth();
    if (authState.signedIn) setStatus("포트폴리오 불러옴", authState.user?.email || "");
    queueAutomaticPriceRefresh();
  } catch {
    state = structuredClone(sampleState);
    render();
    setView(activeView);
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
  renderRebalance();

  renderAccounts();
  renderAccountSummary();
  renderAccountDetail();
  renderSnapshots();
  renderMonthlySummary();
  renderAllocationOverview();
  renderHoldings();
  renderCashFlows();
  renderDividendChart();
  renderCashBalances();
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
  if (!els.authStatus) {
    return;
  }
  const configured = window.StocklioAuth?.isConfigured?.() || false;
  authState = window.StocklioAuth?.getState?.() || authState;
  if (!configured) {
    els.authStatus.textContent = "";
    setSyncState("idle", "");
    els.openLoginButton.hidden = true;
    els.naverLoginButton.disabled = true;
    els.googleLoginButton.disabled = true;
    els.emailLoginButton.disabled = true;
    els.logoutButton.hidden = true;
    const banner = document.getElementById("sampleDataBanner");
    if (banner) banner.hidden = false;
    renderDashboardStatus();
    return;
  }
  if (authState.signedIn) {
    els.authStatus.textContent = authState.user?.name || authState.user?.email || "";
    els.openLoginButton.hidden = true;
    els.logoutButton.disabled = false;
    els.logoutButton.hidden = false;
    const banner = document.getElementById("sampleDataBanner");
    if (banner) banner.hidden = true;
    closeLoginDialog();
    renderSyncStatus();
    renderDashboardStatus();
    return;
  }
  els.authStatus.textContent = "";
  setSyncState("idle", "");
  els.openLoginButton.disabled = false;
  els.openLoginButton.hidden = false;
  els.naverLoginButton.disabled = false;
  els.googleLoginButton.disabled = false;
  els.emailLoginButton.disabled = false;
  els.logoutButton.disabled = false;
  els.logoutButton.hidden = true;
  const banner = document.getElementById("sampleDataBanner");
  if (banner) banner.hidden = false;
  renderDashboardStatus();
}

function openLoginDialog() {
  if (!els.loginDialog) {
    return;
  }
  if (typeof els.loginDialog.showModal === "function") {
    els.loginDialog.showModal();
  } else {
    els.loginDialog.hidden = false;
  }
}

function closeLoginDialog() {
  if (!els.loginDialog) {
    return;
  }
  if (els.loginDialog.open) {
    els.loginDialog.close();
  } else {
    els.loginDialog.hidden = true;
  }
}

function openEmailLoginDialog() {
  if (!els.emailLoginDialog) {
    return;
  }
  els.emailLoginInput.value = authState.user?.email || "";
  if (typeof els.emailLoginDialog.showModal === "function") {
    els.emailLoginDialog.showModal();
  } else {
    els.emailLoginDialog.hidden = false;
  }
  window.setTimeout(() => els.emailLoginInput.focus(), 0);
}

function closeEmailLoginDialog() {
  if (!els.emailLoginDialog) {
    return;
  }
  if (typeof els.emailLoginDialog.close === "function") {
    els.emailLoginDialog.close();
  } else {
    els.emailLoginDialog.hidden = true;
  }
}

async function sendEmailLoginLink() {
  const email = els.emailLoginInput.value;
  els.emailLoginSubmitButton.disabled = true;
  try {
    await window.StocklioAuth?.signInWithEmail?.(email);
    closeEmailLoginDialog();
    setStatus("이메일 확인", `${email}로 로그인 링크를 보냈습니다`);
    showOperationToast("로그인 링크 전송", "메일함에서 Stocklio 로그인 링크를 열어주세요", "success");
  } catch (error) {
    setStatus("이메일 로그인 실패", error.message);
    showOperationToast("이메일 로그인 실패", error.message, "error");
  } finally {
    els.emailLoginSubmitButton.disabled = false;
  }
}

function isEmbeddedBrowser() {
  const userAgent = navigator.userAgent || "";
  return /NAVER|KAKAOTALK|KAKAOSTORY|Instagram|FBAN|FBAV|Line\//i.test(userAgent);
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

let simulatorInitialized = false;

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
  // 배너는 대시보드에서만 표시 (다른 탭에선 authStatus 링크로 충분)
  const banner = document.getElementById("sampleDataBanner");
  if (banner && !banner.hidden !== undefined) {
    const shouldShowBanner = view === "dashboard";
    // 로그인 상태면 항상 숨김, 비로그인이면 대시보드에서만 표시
    const isLoggedIn = window.StocklioAuth?.getState?.()?.signedIn;
    if (!isLoggedIn && !window.StocklioAuth?.isConfigured?.()) {
      banner.hidden = view !== "dashboard";
    }
  }
  renderEmptyPortfolioNotice();
}

function cancelEdit(kind) {
  if (kind === "holding") {
    closeHoldingDrawer();
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
    els.accountForm.hidden = true;
  }
  updateEditControls();
  renderAccountSelectors();
}

function updateEditControls() {
  els.accountSubmit.textContent = editingAccountId ? "수정 저장" : "계좌 저장";
  els.accountCancel.hidden = els.accountForm.hidden;
  els.addAccountButton.hidden = !els.accountForm.hidden;
  els.holdingSubmit.textContent = editingHoldingId ? "수정 저장" : "목록에 추가";
  els.holdingCancel.hidden = Boolean(els.holdingFormPanel?.hidden);
  if (els.holdingFormTitle) {
    els.holdingFormTitle.textContent = editingHoldingId ? "종목 수정" : "종목 추가";
    els.holdingFormSubtitle.textContent = editingHoldingId ? "보유 포지션의 계좌, 전략, 수량, 평단가를 수정합니다." : "현재 보유 종목 목록에 새 포지션을 추가합니다.";
  }
  els.cashFlowSubmit.textContent = editingCashFlowId ? "수정 저장" : "기록";
  els.cashFlowCancel.hidden = !editingCashFlowId;
  els.cashBalanceSubmit.textContent = editingCashBalanceId ? "수정 저장" : "저장";
  els.cashBalanceCancel.hidden = !editingCashBalanceId;
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
  els.providerStatus.textContent = status;
  els.lastUpdated.textContent = detail;
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
  if (!els.operationToast) {
    return;
  }
  window.clearTimeout(toastTimer);
  els.operationToast.hidden = false;
  els.operationToast.dataset.tone = tone;
  els.operationToastTitle.textContent = title;
  els.operationToastDetail.textContent = detail;
  toastTimer = window.setTimeout(() => {
    els.operationToast.hidden = true;
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
