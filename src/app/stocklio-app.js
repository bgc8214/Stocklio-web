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
} from "../domain/portfolio-core.js";

let holdingHeaderSort = { key: "value", dir: "desc" };
let cashFlowHeaderSort = { key: "date", dir: "desc" };
const HOLDINGS_PAGE_SIZE = 10;

const sampleState = createSampleState(makeId);

let state = createEmptyState();
let editingHoldingId = null;
let editingCashFlowId = null;
let editingCashBalanceId = null;
let editingAccountId = null;
let holdingPage = 1;
let holdingScope = "all";
let isLayoutEditing = false;
let draggedDashboardCardId = null;
let resizingDashboardCard = null;
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
let activeView = "dashboard";
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

els.allocationDimensionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeAllocationView = button.dataset.allocationView || "strategy";
    renderAllocation();
  });
});

els.openLoginButton?.addEventListener("click", () => {
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
  isLayoutEditing = false;
  saveState();
  render();
  setStatus("빈 포트폴리오로 전환했습니다", "보유 종목, 계좌, 예수금을 새로 입력하세요");
});

els.addAccountButton?.addEventListener("click", () => {
  editingAccountId = null;
  els.accountForm.reset();
  els.accountForm.hidden = false;
  updateEditControls();
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
  setStatus("계좌 저장", `${nextAccount.investor} · ${nextAccount.account}`);
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

async function loadNotificationState() {
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
    setStatus("알림 설정 불러오기 실패", error.message);
  }
}

async function saveNotificationSettings() {
  if (!authState.signedIn) {
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
    setStatus("알림 설정 저장됨", notificationSettings.telegram_enabled ? "매일 스냅샷 후 텔레그램으로 발송합니다" : "알림이 꺼져 있습니다");
    showOperationToast("알림 설정 저장", "텔레그램 알림 설정을 저장했습니다", "success");
    await loadNotificationState();
    renderNotifications();
  } finally {
    els.saveNotificationButton.disabled = false;
  }
}

async function sendTestNotification() {
  if (!authState.signedIn) {
    throw new Error("로그인 후 테스트할 수 있습니다");
  }
  const chatId = els.telegramChatId.value.trim();
  if (!chatId) {
    throw new Error("Telegram chat id를 입력하세요");
  }
  els.testNotificationButton.disabled = true;
  setStatus("테스트 알림 전송 중", "텔레그램으로 메시지를 보내고 있습니다");
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
    setStatus("테스트 알림 전송 완료", "텔레그램에서 메시지를 확인하세요");
    showOperationToast("테스트 알림 전송", "텔레그램으로 테스트 메시지를 보냈습니다", "success");
    await loadNotificationState();
    renderNotifications();
  } finally {
    els.testNotificationButton.disabled = false;
  }
}

async function findTelegramChatId() {
  if (!authState.signedIn) {
    throw new Error("로그인 후 chat id를 찾을 수 있습니다");
  }
  els.findTelegramChatButton.disabled = true;
  setStatus("chat id 찾는 중", "@stocklio_alarm_bot에 /start를 보낸 대화를 확인합니다");
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
    setStatus("chat id 입력 완료", `${chat.name || "텔레그램 대화"} · ${chat.id}`);
    showOperationToast("chat id 찾기 완료", "텔레그램 chat id를 입력했습니다. 설정 저장 또는 테스트 메시지를 눌러주세요", "success");
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

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("stocklio-theme", next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const icon = document.getElementById("themeToggleIcon");
  const label = document.getElementById("themeToggleLabel");
  if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
  if (label) label.textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
}

async function initialize() {
  initTheme();
  try {
    configureRuntimeSurface();
    authState = await waitForAuthState();
    [state] = await Promise.all([loadState(), loadNotificationState()]);
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
  renderAccounts();
  renderAccountSummary();
  renderAccountDetail();
  renderSnapshots();
  renderMonthlySummary();
  renderAllocationOverview();
  renderHoldings();
  renderCashFlows();
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
    els.authStatus.textContent = "브라우저 저장";
    setSyncState("idle", "");
    els.openLoginButton.hidden = true;
    els.naverLoginButton.disabled = true;
    els.googleLoginButton.disabled = true;
    els.emailLoginButton.disabled = true;
    els.logoutButton.hidden = true;
    renderDashboardStatus();
    return;
  }
  if (authState.signedIn) {
    els.authStatus.textContent = authState.user?.name || authState.user?.email || "";
    els.openLoginButton.hidden = true;
    els.logoutButton.disabled = false;
    els.logoutButton.hidden = false;
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
  });
  if (view === "simulator" && !simulatorInitialized) {
    simulatorInitialized = true;
    initSimulatorView();
  }
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
  fillSelect(els.strategyFilter, "모든 전략", strategyBuckets(state.holdings.map((h) => h.strategy)));
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
  els.accountDetailSelect.value = accounts.some((account) => account.key === previousDetail) ? previousDetail : accounts[0]?.key || "";
  fillSelect(els.accountInvestorFilter, "모든 투자자", unique(accounts.map((account) => account.investor)));
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
  els.allocationDimensionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.allocationView === activeAllocationView);
  });
  const grouped = getAllocationItems(activeAllocationView);
  renderDonut(els.allocationDonut, grouped, allocationViewLabels[activeAllocationView] || "구성");
  renderAllocationLegend(els.allocationLegend, grouped);
}

function renderAllocationOverview() {
  renderAllocationPair(els.strategyAllocationDonut, els.strategyAllocationLegend, getAllocationItems("strategy"), "전략");
  renderAllocationPair(els.holdingAllocationDonut, els.holdingAllocationLegend, getAllocationItems("holding"), "종목");
  renderAllocationPair(els.accountAllocationDonut, els.accountAllocationLegend, getAllocationItems("account"), "계좌");
  renderAllocationPair(els.accountTypeAllocationDonut, els.accountTypeAllocationLegend, getAllocationItems("accountType"), "유형");
}

function renderAllocationPair(svg, legend, items, centerLabel) {
  if (!svg || !legend) {
    return;
  }
  renderDonut(svg, items, centerLabel, { radius: 60, strokeWidth: 22, center: 90 });
  renderAllocationLegend(legend, items, { compact: true });
}

function renderAllocationLegend(target, items, options = {}) {
  if (!target) {
    return;
  }
  const total = items.reduce((sum, item) => sum + item.value, 0);
  target.innerHTML = items
    .map((item, index) => {
      const pct = total ? item.value / total : 0;
      return `<div class="legend-row">
        <span class="swatch" style="background:${palette[index % palette.length]}"></span>
        <span title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
        <strong>${formatPercent(pct)}${options.compact ? "" : `<small>${formatKrw(item.value)}</small>`}</strong>
      </div>`;
    })
    .join("") || `<div class="empty-state">표시할 자산이 없습니다</div>`;
}

function renderDonut(target, items, centerLabel, options = {}) {
  if (!target) {
    return;
  }
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = options.radius || 78;
  const strokeWidth = options.strokeWidth || 28;
  const center = options.center || 110;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const rings = items
    .map((item, index) => {
      const ratio = total ? item.value / total : 0;
      const dash = ratio * circumference;
      const ring = `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${palette[index % palette.length]}" stroke-width="${strokeWidth}" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${center} ${center})" />`;
      offset += dash;
      return ring;
    })
    .join("");
  target.innerHTML = `
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#e6ebe5" stroke-width="${strokeWidth}"></circle>
    ${rings}
    <text x="${center}" y="${center - 4}" text-anchor="middle" font-size="${center === 90 ? 17 : 19}" font-weight="800" fill="#17211b">${items.length}</text>
    <text x="${center}" y="${center + 18}" text-anchor="middle" font-size="12" fill="#66736b">${escapeHtml(centerLabel)}</text>
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
  const marketContext = getCurrentMarketContext();
  const movers = getDailyMoveRows().slice(0, 5);
  const refreshImpact = getRecentPriceRefreshImpact();
  if (!movers.length) {
    if (marketContext.isMarketClosed) {
      const fallback = renderBreakdownFallback();
      els.breakdownList.innerHTML = `
        <div class="daily-move-empty">
          <strong>미국장 ${escapeHtml(marketContext.closedReason || "휴장")}에는 새 종목별 변동을 표시하지 않습니다</strong>
          <span>${escapeHtml(marketContext.label)}입니다. 총자산 변화가 있다면 입출금 또는 환율/현금 변화일 수 있습니다.</span>
        </div>
        <div class="breakdown-subtitle">구성 참고</div>
        ${fallback}
      `;
      return;
    }
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
  const accounts = getFilteredAccounts();
  renderAccountOverview();
  const accountStats = getAccountStats();
  if (els.accountListCount) {
    els.accountListCount.textContent = `${accounts.length}개 계좌`;
  }
  els.accountList.innerHTML = accounts.length
    ? accounts
        .map((account) => {
          const inUse = isAccountInUse(account);
          const stats = accountStats.get(account.key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 };
          const deleteLabel = inUse ? "사용 중인 계좌라 삭제할 수 없습니다" : "계좌 삭제";
          const isSelected = els.accountDetailSelect.value === account.key;
          return `<div class="account-list-row ${isSelected ? "is-selected" : ""}" role="button" tabindex="0" data-select-account="${escapeHtml(account.key)}">
            <div>
              <strong>${escapeHtml(account.account)}</strong>
              <small>${escapeHtml(account.investor)} · ${escapeHtml(account.provider || "기관 미지정")} · ${formatAccountType(account.accountType)} · ${escapeHtml(account.baseCurrency || "KRW")}</small>
            </div>
            <div class="account-card-metrics">
              <span><small>총자산</small><strong>${formatCompactKrw(stats.stockValueKrw + stats.cashKrw)}</strong></span>
              <span><small>주식</small><strong>${formatCompactKrw(stats.stockValueKrw)}</strong></span>
              <span><small>예수금</small><strong>${formatCompactKrw(stats.cashKrw)}</strong></span>
              <span><small>종목</small><strong>${formatNumber(stats.holdingCount)}</strong></span>
            </div>
            <div class="account-row-menu" onclick="event.stopPropagation()">${rowActionMenu(`계좌 ${account.account} 작업`, [
              `<button type="button" data-edit-account="${account.id}">수정</button>`,
              `<button class="row-menu-danger" type="button" data-delete-account="${account.id}" ${inUse ? "disabled" : ""} title="${deleteLabel}">삭제</button>`,
            ])}</div>
          </div>`;
        })
        .join("")
    : `<div class="empty-state">등록된 계좌가 없습니다</div>`;

  document.querySelectorAll("[data-select-account]").forEach((button) => {
    const select = () => {
      els.accountDetailSelect.value = button.dataset.selectAccount;
      syncCashFormToSelectedAccount();
      renderAccounts();
      renderAccountDetail();
      renderCashBalances();
    };
    button.addEventListener("click", select);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
  });

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

function getFilteredAccounts() {
  const query = (els.accountSearch?.value || "").trim().toLowerCase();
  const investor = els.accountInvestorFilter?.value || "";
  const currency = els.accountCurrencyFilter?.value || "";
  return getKnownAccounts().filter((account) => {
    const haystack = [account.account, account.investor, account.provider, formatAccountType(account.accountType), account.baseCurrency].join(" ").toLowerCase();
    return (!investor || account.investor === investor) && (!currency || account.baseCurrency === currency) && (!query || haystack.includes(query));
  });
}

function renderAccountOverview() {
  const stats = getAccountStats();
  const accounts = getKnownAccounts();
  const totalStock = [...stats.values()].reduce((sum, item) => sum + item.stockValueKrw, 0);
  const totalCash = [...stats.values()].reduce((sum, item) => sum + item.cashKrw, 0);
  if (els.accountOverviewTotal) {
    els.accountOverviewTotal.textContent = formatKrw(totalStock + totalCash);
  }
  if (els.accountOverviewStocks) {
    els.accountOverviewStocks.textContent = formatKrw(totalStock);
  }
  if (els.accountOverviewCash) {
    els.accountOverviewCash.textContent = formatKrw(totalCash);
  }
  if (els.accountOverviewCount) {
    els.accountOverviewCount.textContent = String(accounts.length);
  }
  if (els.accountOverviewCountDetail) {
    const krw = accounts.filter((account) => account.baseCurrency === "KRW").length;
    const usd = accounts.filter((account) => account.baseCurrency === "USD").length;
    els.accountOverviewCountDetail.textContent = `KRW ${krw}개 · USD ${usd}개 포함`;
  }
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
    if (els.accountDetailSubtitle) {
      els.accountDetailSubtitle.textContent = "계좌를 선택해 상세를 확인합니다";
    }
    if (els.accountDetailType) {
      els.accountDetailType.textContent = "-";
    }
    if (els.accountSummary) {
      els.accountSummary.innerHTML = "";
    }
    if (els.accountComposition) {
      els.accountComposition.innerHTML = `<div class="empty-state">계좌를 선택하면 구성이 표시됩니다</div>`;
    }
    els.accountDetail.innerHTML = `<div class="empty-state">계좌를 선택하면 보유 종목, 예수금, 현금흐름을 한 번에 볼 수 있습니다</div>`;
    renderCashSelectedPreview();
    return;
  }
  const account = parseAccountKey(selected);
  const accountInfo = getKnownAccounts().find((item) => item.key === selected);
  const holdings = state.holdings.filter((holding) => holding.investor === account.investor && holding.account === account.account);
  const cashBalances = (state.cashBalances || []).filter((cash) => cash.investor === account.investor && cash.account === account.account);
  const flows = (state.cashFlows || []).filter((flow) => flow.investor === account.investor && flow.account === account.account).slice(-6).reverse();
  const stockValueKrw = holdings.reduce((sum, holding) => sum + getHoldingValues(holding).valueKrw, 0);
  const cashKrw = cashBalances.reduce((sum, cash) => sum + getCashValueKrw(cash), 0);
  const totalKrw = stockValueKrw + cashKrw;
  const stockRatio = totalKrw ? stockValueKrw / totalKrw : 0;
  const cashRatio = totalKrw ? cashKrw / totalKrw : 0;
  if (els.accountDetailSubtitle) {
    els.accountDetailSubtitle.textContent = `${account.account} · ${account.investor} · ${accountInfo?.provider || "기관 미지정"}`;
  }
  if (els.accountDetailType) {
    els.accountDetailType.textContent = formatAccountType(accountInfo?.accountType);
  }
  if (els.accountCompositionCurrency) {
    els.accountCompositionCurrency.textContent = accountInfo?.baseCurrency || "KRW";
  }
  if (els.accountSummary) {
    els.accountSummary.innerHTML = `
      <div><span>총자산<small>주식과 예수금 합계</small></span><strong>${formatKrw(totalKrw)}</strong></div>
      <div><span>주식 평가금액<small>${holdings.length}개 포지션</small></span><strong>${formatKrw(stockValueKrw)}</strong></div>
      <div><span>예수금<small>${cashBalances.length}개 잔액</small></span><strong>${formatKrw(cashKrw)}</strong></div>
      <div><span>보유 종목<small>현재 추적 중인 포지션</small></span><strong>${holdings.length}개</strong></div>
    `;
  }
  if (els.accountComposition) {
    els.accountComposition.innerHTML = `
      <div class="composition-row"><span>주식</span><strong>${formatPercent(stockRatio)}</strong></div>
      <div class="composition-bar"><span style="width:${Math.max(0, stockRatio * 100)}%"></span></div>
      <div class="composition-row"><span>예수금</span><strong>${formatPercent(cashRatio)}</strong></div>
      <div class="composition-bar muted"><span style="width:${Math.max(0, cashRatio * 100)}%"></span></div>
      <div class="composition-note">${cashBalances.length ? "예수금 기록 있음" : "예수금 기록 없음"}<span>${cashBalances.length ? "" : "필요할 때 오른쪽 입력 폼에서 추가합니다."}</span></div>
    `;
  }
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
  renderCashSelectedPreview();
}

function syncCashFormToSelectedAccount() {
  const selected = els.accountDetailSelect.value;
  if (selected && [...els.cashBalanceForm.elements.accountKey.options].some((option) => option.value === selected)) {
    els.cashBalanceForm.elements.accountKey.value = selected;
  }
  renderCashSelectedPreview();
}

function renderCashSelectedPreview() {
  if (!els.cashSelectedPreview) {
    return;
  }
  const selected = els.cashBalanceForm.elements.accountKey.value;
  const account = selected ? parseAccountKey(selected) : null;
  const amount = Number(els.cashBalanceForm.elements.amount.value || 0);
  const currency = els.cashBalanceForm.elements.currency.value || "KRW";
  const rate = currency === "USD" ? Number(state.fxRate?.rate || 1) : 1;
  const accountStats = getAccountStats();
  const stats = selected ? accountStats.get(selected) : null;
  const existingCashRows = selected
    ? (state.cashBalances || []).filter((cash) => cash.investor === account.investor && cash.account === account.account && cash.currency === currency)
    : [];
  const existingSameCurrencyKrw = existingCashRows.reduce((sum, cash) => sum + getCashValueKrw(cash), 0);
  const nextCashKrw = Math.max(0, amount * rate);
  const baseTotal = stats ? stats.stockValueKrw + stats.cashKrw - existingSameCurrencyKrw : 0;
  const previewTotal = selected ? baseTotal + nextCashKrw : 0;
  els.cashSelectedPreview.innerHTML = selected
    ? `<span>저장 후 선택 계좌 총자산</span><strong>${formatKrw(previewTotal)}</strong><small>${account.account} · ${currency} 예수금 ${formatMoney(amount, currency)}</small>`
    : `<span>저장 후 선택 계좌 총자산</span><strong>-</strong><small>계좌를 선택하면 미리 계산합니다</small>`;
}

function renderSnapshots() {
  const dayFilter = els.snapshotDayFilter?.value || "all";
  const base = getFilteredSnapshotRows();
  const filtered = dayFilter === "7d" ? base.slice(-7) : dayFilter === "30d" ? base.slice(-30) : base;
  const rows = filtered.slice().reverse();
  els.snapshotsBody.innerHTML = rows
    .map((row) => `<tr>
      <td>${escapeHtml(row.date)}</td>
      <td>${formatKrw(row.totalValueKrw)}</td>
      <td class="${row.dailyChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.dailyChangeKrw)}</td>
      <td class="${row.investmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.investmentGainKrw)}</td>
      <td class="${row.dailyReturn >= 0 ? "positive" : "negative"}">${formatPercent(row.dailyReturn)}</td>
      <td class="${row.monthToDateInvestmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.monthToDateInvestmentGainKrw)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="6">저장된 성과 스냅샷이 없습니다</td></tr>`;
}

function renderMonthlySummary() {
  const rows = selectMonthlyRows(getFilteredSnapshotRows()).reverse();
  els.monthlySummaryBody.innerHTML = rows
    .map((row) => `<tr>
      <td class="${row.changeKrw >= 0 ? "positive" : "negative"}">${escapeHtml(row.month)}</td>
      <td>${formatKrw(row.startValueKrw)}</td>
      <td>${formatKrw(row.endValueKrw)}</td>
      <td class="${row.changeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.changeKrw)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="4">월별로 집계할 스냅샷이 없습니다</td></tr>`;
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
  renderHoldingsSummary(rows);
  const totalPages = Math.max(1, Math.ceil(rows.length / HOLDINGS_PAGE_SIZE));
  holdingPage = Math.min(Math.max(1, holdingPage), totalPages);
  const pageRows = rows.slice((holdingPage - 1) * HOLDINGS_PAGE_SIZE, holdingPage * HOLDINGS_PAGE_SIZE);
  renderHoldingScopeControls();
  renderHoldingPagination(rows.length, totalPages);
  els.holdingsBody.innerHTML = pageRows.length
    ? pageRows
    .map((holding) => {
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

function renderHoldingScopeControls() {
  for (const [button, scope] of [
    [els.holdingScopeAll, "all"],
    [els.holdingScopeGain, "gain"],
    [els.holdingScopeLoss, "loss"],
  ]) {
    button?.classList.toggle("is-active", holdingScope === scope);
  }
}

function renderHoldingPagination(totalRows, totalPages) {
  if (els.holdingsPageInfo) {
    const start = totalRows ? (holdingPage - 1) * HOLDINGS_PAGE_SIZE + 1 : 0;
    const end = Math.min(totalRows, holdingPage * HOLDINGS_PAGE_SIZE);
    els.holdingsPageInfo.textContent = totalRows > HOLDINGS_PAGE_SIZE ? `${start}-${end} / ${totalRows}개` : `${totalRows}개 표시`;
  }
  if (!els.holdingPagination) {
    return;
  }
  if (totalRows <= HOLDINGS_PAGE_SIZE) {
    els.holdingPagination.innerHTML = "";
    return;
  }
  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return `<button class="ghost small-button ${page === holdingPage ? "is-active" : ""}" type="button" data-holding-page="${page}" aria-label="${page}페이지">${page}</button>`;
  }).join("");
  els.holdingPagination.innerHTML = `
    <span>${formatNumber(totalRows, 0)}개 중 ${formatNumber((holdingPage - 1) * HOLDINGS_PAGE_SIZE + 1, 0)}-${formatNumber(Math.min(totalRows, holdingPage * HOLDINGS_PAGE_SIZE), 0)}개</span>
    <div>
      <button class="ghost small-button" type="button" data-holding-page-prev ${holdingPage <= 1 ? "disabled" : ""}>이전</button>
      ${pageButtons}
      <button class="ghost small-button" type="button" data-holding-page-next ${holdingPage >= totalPages ? "disabled" : ""}>다음</button>
    </div>
  `;
  els.holdingPagination.querySelector("[data-holding-page-prev]")?.addEventListener("click", () => {
    holdingPage = Math.max(1, holdingPage - 1);
    renderHoldings();
  });
  els.holdingPagination.querySelector("[data-holding-page-next]")?.addEventListener("click", () => {
    holdingPage = Math.min(totalPages, holdingPage + 1);
    renderHoldings();
  });
  els.holdingPagination.querySelectorAll("[data-holding-page]").forEach((button) => {
    button.addEventListener("click", () => {
      holdingPage = Number(button.dataset.holdingPage || 1);
      renderHoldings();
    });
  });
}

function renderHoldingsSummary(rows) {
  const allCount = state.holdings.length;
  const visibleCount = rows.length;
  const latestPriceTime = state.holdings
    .map((holding) => new Date(holding.priceAsOf || 0).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  const source = state.holdings.find((holding) => new Date(holding.priceAsOf || 0).getTime() === latestPriceTime)?.priceSource || "가격 데이터";
  const values = rows.map((holding) => ({ holding, values: getHoldingValues(holding), dailyMove: getHoldingDailyMove(holding) }));
  const totalValue = values.reduce((sum, row) => sum + row.values.valueKrw, 0);
  const totalCost = values.reduce((sum, row) => sum + row.values.costKrw, 0);
  const totalGain = values.reduce((sum, row) => sum + row.values.gainKrw, 0);
  const totalDayMove = values.reduce((sum, row) => sum + (row.dailyMove.hasData ? row.dailyMove.valueKrw : 0), 0);
  const returnRate = totalCost ? totalGain / totalCost : 0;
  const sortedByValue = [...values].sort((a, b) => b.values.valueKrw - a.values.valueKrw);
  const topRows = sortedByValue.slice(0, 3);
  const topValue = topRows.reduce((sum, row) => sum + row.values.valueKrw, 0);
  const concentration = totalValue ? topValue / totalValue : 0;
  const topNames = topRows.map((row) => row.holding.name || row.holding.ticker).join(" · ") || "-";

  if (els.holdingsMeta) {
    els.holdingsMeta.textContent = `${visibleCount}/${allCount}개 종목`;
  }
  if (els.holdingsPriceMeta) {
    els.holdingsPriceMeta.textContent = latestPriceTime ? `마지막 가격 갱신 ${formatAsOf(new Date(latestPriceTime).toISOString())} · ${source}` : "가격 기준 없음";
  }
  if (els.holdingsSummaryValue) {
    els.holdingsSummaryValue.textContent = formatCompactKrw(totalValue);
  }
  if (els.holdingsSummaryGain) {
    els.holdingsSummaryGain.textContent = `${totalGain >= 0 ? "+" : ""}${formatCompactKrw(totalGain)}`;
    els.holdingsSummaryGain.className = totalGain >= 0 ? "positive" : "negative";
  }
  if (els.holdingsSummaryReturn) {
    els.holdingsSummaryReturn.textContent = formatPercent(returnRate);
  }
  if (els.holdingsSummaryDayMove) {
    els.holdingsSummaryDayMove.textContent = `${totalDayMove >= 0 ? "+" : ""}${formatCompactKrw(totalDayMove)}`;
    els.holdingsSummaryDayMove.className = totalDayMove >= 0 ? "positive" : "negative";
  }
  if (els.holdingsSummaryDayNote) {
    const leadingMove = values
      .filter((row) => row.dailyMove.hasData)
      .sort((a, b) => Math.abs(b.dailyMove.valueKrw) - Math.abs(a.dailyMove.valueKrw))[0];
    els.holdingsSummaryDayNote.textContent = leadingMove ? `${leadingMove.holding.ticker} 영향 최대` : "가격 갱신 기준";
  }
  if (els.holdingsSummaryConcentration) {
    els.holdingsSummaryConcentration.textContent = formatPercent(concentration);
  }
  if (els.holdingsSummaryTopNames) {
    els.holdingsSummaryTopNames.textContent = topNames;
  }
}

function exportVisibleHoldings() {
  const rows = filteredHoldings();
  const header = ["투자자", "계좌", "전략", "종목명", "티커", "수량", "현재가", "평단가", "평가금액", "손익", "수익률", "통화"];
  const csvRows = rows.map((holding) => {
    const values = getHoldingValues(holding);
    const returnRate = values.costNative ? values.gainNative / values.costNative : 0;
    return [
      holding.investor,
      holding.account,
      holding.strategy,
      holding.name || holding.ticker,
      holding.ticker,
      holding.quantity,
      holding.price,
      holding.averageCost,
      values.valueNative,
      values.gainNative,
      returnRate,
      holding.currency,
    ];
  });
  const csv = [header, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stocklio-holdings-${todayKey()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showOperationToast("보유 종목 내보내기 완료", `${rows.length}개 종목 CSV`, "success");
}

function exportPerformanceCsv() {
  const rows = getFilteredSnapshotRows();
  if (!rows.length) {
    showOperationToast("내보내기 실패", "성과 데이터가 없습니다", "error");
    return;
  }
  const header = ["날짜", "총자산(원)", "일 증감(원)", "입출금(원)", "투자손익(원)", "일 수익률", "월 누적(원)"];
  const csvRows = rows.slice().reverse().map((row) => [
    row.date,
    row.totalValueKrw,
    row.dailyChangeKrw ?? "",
    row.netInflowKrw ?? "",
    row.investmentGainKrw ?? "",
    row.dailyReturn != null ? (row.dailyReturn * 100).toFixed(2) + "%" : "",
    row.monthToDateInvestmentGainKrw ?? "",
  ]);
  const csv = [header, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stocklio-performance-${todayKey()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showOperationToast("성과 내보내기 완료", `${rows.length}개 일자 CSV`, "success");
}

function copyPerformanceSummary() {
  const rows = getFilteredSnapshotRows();
  if (!rows.length) {
    showOperationToast("복사 실패", "성과 데이터가 없습니다", "error");
    return;
  }
  const stats = getPerformanceStats(rows);
  const lines = [
    `성과 요약 (${els.performanceRange?.options[els.performanceRange.selectedIndex]?.text ?? ""})`,
    `최근 총자산: ${formatKrw(stats.latest.totalValueKrw)} (${escapeHtml(stats.latest.date)})`,
    `기간 증감: ${formatKrw(stats.periodChangeKrw)} (${formatPercent(stats.periodReturn)})`,
    `투자손익: ${formatKrw(stats.investmentGainKrw)}`,
    `월 누적: ${formatKrw(stats.monthToDateGainKrw)} (${formatPercent(stats.monthToDateReturn)})`,
    `최대 낙폭: ${formatKrw(stats.maxDrawdownKrw)} (${formatPercent(stats.maxDrawdownRate)})`,
  ];
  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    showOperationToast("요약 복사 완료", "클립보드에 복사했습니다", "success");
  }).catch(() => {
    showOperationToast("복사 실패", "클립보드 접근이 거부되었습니다", "error");
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
  const selected = normalizeStrategy(value);
  const strategies = strategyBuckets([...state.holdings.map((holding) => holding.strategy), selected]);
  return strategies
    .map((strategy) => `<option value="${escapeHtml(strategy)}" ${strategy === selected ? "selected" : ""}>${escapeHtml(strategy)}</option>`)
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
          strategy: normalizeStrategy(field("strategy")),
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
  renderCashSelectedPreview();
  const rows = [...(state.cashBalances || [])].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
  els.cashBalanceList.innerHTML = rows.length
    ? rows
        .map((cash) => editingCashBalanceId === cash.id ? renderCashBalanceEditRow(cash) : `<div class="cash-balance-row">
          <span>
            <strong>${escapeHtml(cash.account)}</strong>
            <small>${escapeHtml(cash.investor)} · ${escapeHtml(cash.source || "직접 입력")}</small>
          </span>
          <strong>${formatMoney(cash.amount, cash.currency)}</strong>
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
  openHoldingDrawer(holding);
  updateEditControls();
  setView("holdings");
  els.holdingForm.elements.quantity.focus();
}

function openHoldingDrawer(holding = null) {
  hideTickerSuggestions();
  els.holdingForm.reset();
  renderAccountSelectors();
  if (holding) {
    els.holdingForm.elements.accountKey.value = accountKeyFor(holding);
    els.holdingForm.elements.accountType.value = normalizeAccountType(holding.accountType);
    els.holdingForm.elements.strategy.value = normalizeStrategy(holding.strategy);
    els.holdingForm.elements.name.value = holding.name || "";
    els.holdingForm.elements.ticker.value = holding.ticker || "";
    els.holdingForm.elements.quantity.value = holding.quantity ?? "";
    els.holdingForm.elements.averageCost.value = holding.averageCost ?? "";
  }
  els.holdingFormPanel.hidden = false;
  els.holdingDrawerBackdrop.hidden = false;
  document.body.classList.add("drawer-open");
  window.setTimeout(() => {
    els.holdingFormPanel.classList.add("is-open");
    els.holdingDrawerBackdrop.classList.add("is-open");
  }, 0);
  updateEditControls();
  const firstField = els.holdingForm.elements.accountKey;
  window.setTimeout(() => firstField?.focus(), 80);
}

function closeHoldingDrawer({ reset = true } = {}) {
  hideTickerSuggestions();
  els.holdingFormPanel.classList.remove("is-open");
  els.holdingDrawerBackdrop.classList.remove("is-open");
  document.body.classList.remove("drawer-open");
  window.setTimeout(() => {
    els.holdingFormPanel.hidden = true;
    els.holdingDrawerBackdrop.hidden = true;
  }, 180);
  if (reset) {
    editingHoldingId = null;
    els.holdingForm.reset();
    updateEditControls();
    renderHoldings();
  }
}

function startEditAccount(id) {
  const account = state.accounts.find((item) => item.id === id) || getKnownAccounts().find((item) => item.id === id);
  if (!account) {
    return;
  }
  editingAccountId = id;
  els.accountForm.hidden = false;
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

function queueTickerSearch() {
  const query = String(els.holdingForm.elements.ticker.value || "").trim();
  window.clearTimeout(tickerSearchTimer);
  if (query.length < 2) {
    hideTickerSuggestions();
    return;
  }
  tickerSearchTimer = window.setTimeout(() => loadTickerSuggestions(query), 220);
}

async function loadTickerSuggestions(query) {
  const searchId = ++tickerSearchSeq;
  renderTickerSuggestions([], "검색 중...");
  try {
    const results = await searchSymbols(query);
    if (searchId !== tickerSearchSeq) {
      return;
    }
    renderTickerSuggestions(results, results.length ? "" : "검색 결과가 없습니다");
  } catch {
    if (searchId === tickerSearchSeq) {
      renderTickerSuggestions([], "검색을 잠시 사용할 수 없습니다");
    }
  }
}

function renderTickerSuggestions(results, emptyMessage = "") {
  if (!els.holdingTickerSuggestions) {
    return;
  }
  if (!results.length) {
    els.holdingTickerSuggestions.innerHTML = emptyMessage
      ? `<div class="ticker-suggestion-empty">${escapeHtml(emptyMessage)}</div>`
      : "";
    els.holdingTickerSuggestions.hidden = !emptyMessage;
    return;
  }
  els.holdingTickerSuggestions.innerHTML = results.map((result) => {
    const meta = [result.type, result.exchange].filter(Boolean).join(" · ");
    return `
      <button class="ticker-suggestion-button" type="button" role="option" data-symbol="${escapeHtml(result.symbol)}" data-name="${escapeHtml(result.name)}">
        <strong>${escapeHtml(result.symbol)}</strong>
        <span>${escapeHtml(result.name)}</span>
        <small>${escapeHtml(meta || "Yahoo Finance")}</small>
      </button>
    `;
  }).join("");
  els.holdingTickerSuggestions.hidden = false;
}

function selectTickerSuggestion(symbol, name) {
  els.holdingForm.elements.ticker.value = symbol || "";
  els.holdingForm.elements.name.value = name || symbol || "";
  hideTickerSuggestions();
  els.holdingForm.elements.quantity.focus();
}

function hideTickerSuggestions() {
  window.clearTimeout(tickerSearchTimer);
  tickerSearchSeq += 1;
  if (els.holdingTickerSuggestions) {
    els.holdingTickerSuggestions.hidden = true;
    els.holdingTickerSuggestions.innerHTML = "";
  }
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

function renderDashboardStatus() {
  const marketContext = getCurrentMarketContext();
  const latestHoldingPrice = [...state.holdings]
    .filter((holding) => holding.priceAsOf)
    .sort((a, b) => String(b.priceAsOf).localeCompare(String(a.priceAsOf)))[0];
  const priceAsOf = latestHoldingPrice?.priceAsOf || state.fxRate?.asOf;
  const todaySnapshot = (state.portfolioSnapshots || []).find((snapshot) => snapshot.date === todayKey());
  const latestSnapshot = [...(state.portfolioSnapshots || [])].sort((a, b) => b.date.localeCompare(a.date))[0];
  const storageLabel = authState.signedIn ? "클라우드 저장" : isStaticDeployment() ? "브라우저 저장" : "로컬 저장";

  if (els.dashboardPriceStatus) {
    els.dashboardPriceStatus.textContent = marketContext.isMarketClosed ? marketContext.label : priceAsOf ? formatAsOf(priceAsOf) : "가격 갱신 필요";
    els.dashboardPriceDetail.textContent = `${state.holdings.length}개 종목 · USD/KRW ${formatNumber(state.fxRate?.rate || 0, 2)}${marketContext.isMarketClosed ? " · 새 미국장 거래 없음" : ""}`;
  }
  if (els.dashboardSnapshotStatus) {
    els.dashboardSnapshotStatus.textContent = marketContext.isMarketClosed
      ? todaySnapshot ? "휴장일 기록됨" : "휴장일 기록 전"
      : todaySnapshot ? "오늘 기록됨" : "오늘 기록 전";
    els.dashboardSnapshotDetail.textContent = latestSnapshot
      ? `최근 스냅샷 ${latestSnapshot.date}`
      : "스냅샷을 저장하면 성과 추이가 쌓입니다";
  }
  if (els.dashboardStorageStatus) {
    els.dashboardStorageStatus.textContent = storageLabel;
    els.dashboardStorageDetail.textContent = authState.signedIn
      ? authState.user?.email || "계정에 동기화됩니다"
      : "로그인하면 기기 밖에서도 이어서 볼 수 있습니다";
  }
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

function renderNotifications() {
  if (!els.notificationForm) {
    return;
  }
  const signedIn = Boolean(authState.signedIn);
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

function formatNotificationStatus(status) {
  if (status === "success") {
    return "성공";
  }
  if (status === "skipped") {
    return "건너뜀";
  }
  return "실패";
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
    const values = getHoldingValues(holding);
    return (
      (!els.investorFilter.value || holding.investor === els.investorFilter.value) &&
      (!els.strategyFilter.value || holding.strategy === els.strategyFilter.value) &&
      (!els.accountTypeFilter.value || normalizeAccountType(holding.accountType) === els.accountTypeFilter.value) &&
      (holdingScope === "all" || (holdingScope === "gain" && values.gainKrw >= 0) || (holdingScope === "loss" && values.gainKrw < 0)) &&
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
          priceDate: quote.priceDate,
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

function groupHoldingsByResolver(resolver) {
  const map = new Map();
  for (const holding of state.holdings || []) {
    const label = resolver(holding) || "미분류";
    map.set(label, (map.get(label) || 0) + getHoldingValues(holding).valueKrw);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function addCashToAllocation(items, resolver) {
  const map = new Map(items.map((item) => [item.label, item.value]));
  for (const cash of state.cashBalances || []) {
    const label = resolver(cash) || "예수금";
    map.set(label, (map.get(label) || 0) + getCashValueKrw(cash));
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function aggregateAllocationItems(items, limit = 5) {
  const sorted = [...items].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= limit) {
    return sorted;
  }
  const head = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((sum, item) => sum + item.value, 0);
  return rest > 0 ? [...head, { label: "기타", value: rest }] : head;
}

function accountTypeForItem(item) {
  const account = getKnownAccounts().find((known) => known.investor === item.investor && known.account === item.account);
  return formatAccountType(normalizeAccountType(item.accountType || account?.accountType));
}

function getAllocationItems(dimension = "strategy") {
  if (dimension === "holding") {
    return aggregateAllocationItems(addCashToAllocation(groupHoldingsByResolver((holding) => holding.name || holding.ticker), () => "예수금"));
  }
  if (dimension === "account") {
    return aggregateAllocationItems(addCashToAllocation(groupHoldingsByResolver((holding) => `${holding.investor} · ${holding.account}`), (cash) => `${cash.investor} · ${cash.account}`));
  }
  if (dimension === "investor") {
    return aggregateAllocationItems(addCashToAllocation(groupHoldingsByResolver((holding) => holding.investor), (cash) => cash.investor));
  }
  if (dimension === "accountType") {
    return aggregateAllocationItems(addCashToAllocation(groupHoldingsByResolver(accountTypeForItem), accountTypeForItem));
  }
  return aggregateAllocationItems(addCashToAllocation(groupHoldingsByResolver((holding) => normalizeStrategy(holding.strategy)), () => "예수금"));
}

function getDailyMoveRows() {
  return selectDailyMoveRows({ holdings: state.holdings, fxRate: state.fxRate, marketContext: getCurrentMarketContext() });
}

function getHoldingDailyMove(holding) {
  return selectHoldingDailyMove(holding, state.fxRate, getCurrentMarketContext());
}

function getCurrentMarketContext() {
  return getUsMarketContextForSeoulDate(todayKey());
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
        <circle class="trend-point" cx="${x}" cy="${y}" r="2.5"></circle>
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
    els.dashboardRefreshButton.textContent = isRunning ? "갱신 중..." : "가격 갱신";
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
