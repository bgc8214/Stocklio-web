const STORAGE_KEY = "stock-portfolio-lab-state";
const CACHE_PREFIX = "stock-portfolio-lab-yahoo-cache";
const QUOTE_CACHE_TTL_MS = 5 * 60 * 1000;
const FX_CACHE_TTL_MS = 60 * 60 * 1000;
const DATA_VERSION = 6;
const AUTH_READY_TIMEOUT_MS = 1800;

const palette = ["#1f7a5b", "#3366a8", "#a97819", "#7b5aa6", "#b94343"];
const dashboardCardLabels = {
  "total-value": "총 자산",
  "total-cost": "매입금액",
  "total-gain": "평가손익",
  "cash-total": "예수금",
  "fx-rate": "환율",
  allocation: "자산 비중",
  "performance-flow": "성과 흐름",
  breakdown: "상세 분해",
};
const dashboardSizeToSpan = {
  small: 3,
  medium: 4,
  wide: 6,
  full: 12,
};
const defaultDashboardLayout = [
  { id: "total-value", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-cost", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-gain", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "cash-total", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "fx-rate", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "allocation", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "performance-flow", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "breakdown", widthPct: 50, span: 6, minHeight: 320, visible: true },
];

const sampleState = {
  version: DATA_VERSION,
  fxRate: {
    pair: "USD/KRW",
    rate: 1350,
    source: "샘플 환율",
    asOf: "샘플",
  },
  holdings: [
    {
      id: makeId(),
      investor: "투자자 A",
      account: "연금 계좌",
      accountType: "pension",
      strategy: "QQQ",
      ticker: "QQQ",
      name: "Invesco QQQ Trust",
      quantity: 18,
      averageCost: 408.25,
      price: 430.15,
      currency: "USD",
      priceSource: "샘플",
      priceAsOf: "샘플",
    },
    {
      id: makeId(),
      investor: "투자자 A",
      account: "일반 계좌",
      accountType: "brokerage",
      strategy: "성장주",
      ticker: "MSFT",
      name: "Microsoft",
      quantity: 12,
      averageCost: 375.4,
      price: 414.92,
      currency: "USD",
      priceSource: "샘플",
      priceAsOf: "샘플",
    },
    {
      id: makeId(),
      investor: "투자자 B",
      account: "일반 계좌",
      accountType: "brokerage",
      strategy: "성장주",
      ticker: "NVDA",
      name: "NVIDIA",
      quantity: 20,
      averageCost: 104.5,
      price: 128.4,
      currency: "USD",
      priceSource: "샘플",
      priceAsOf: "샘플",
    },
    {
      id: makeId(),
      investor: "투자자 B",
      account: "코어 계좌",
      accountType: "brokerage",
      strategy: "S&P500",
      ticker: "VOO",
      name: "Vanguard S&P 500 ETF",
      quantity: 10,
      averageCost: 465.2,
      price: 510.75,
      currency: "USD",
      priceSource: "샘플",
      priceAsOf: "샘플",
    },
    {
      id: makeId(),
      investor: "투자자 A",
      account: "전술 계좌",
      accountType: "brokerage",
      strategy: "S&P500",
      ticker: "SSO",
      name: "ProShares Ultra S&P500",
      quantity: 35,
      averageCost: 58.4,
      price: 64.1,
      currency: "USD",
      priceSource: "샘플",
      priceAsOf: "샘플",
    },
  ],
  cashFlows: [
    {
      id: makeId(),
      date: "2026-05-10",
      investor: "투자자 A",
      account: "연금 계좌",
      type: "deposit",
      amountKrw: 1200000,
      note: "월 납입",
    },
    {
      id: makeId(),
      date: "2026-05-12",
      investor: "투자자 B",
      account: "일반 계좌",
      type: "deposit",
      amountKrw: 800000,
      note: "추가입금",
    },
  ],
  cashBalances: [],
  accounts: [],
  dashboardLayout: structuredClone(defaultDashboardLayout),
  accountSnapshots: [],
  priceUpdateLogs: [],
  portfolioSnapshots: [
    {
      id: makeId(),
      date: "2026-05-10",
      totalValueUsd: 24850,
      totalValueKrw: 33547500,
      totalCostUsd: 23400,
      totalGainUsd: 1450,
      fxRate: 1350,
      netInflowKrw: 1200000,
    },
    {
      id: makeId(),
      date: "2026-05-11",
      totalValueUsd: 25140,
      totalValueKrw: 33939000,
      totalCostUsd: 23400,
      totalGainUsd: 1740,
      fxRate: 1350,
      netInflowKrw: 0,
    },
    {
      id: makeId(),
      date: "2026-05-12",
      totalValueUsd: 26010,
      totalValueKrw: 35113500,
      totalCostUsd: 23990,
      totalGainUsd: 2020,
      fxRate: 1350,
      netInflowKrw: 800000,
    },
    {
      id: makeId(),
      date: "2026-05-13",
      totalValueUsd: 25920,
      totalValueKrw: 34992000,
      totalCostUsd: 23990,
      totalGainUsd: 1930,
      fxRate: 1350,
      netInflowKrw: 0,
    },
    {
      id: makeId(),
      date: "2026-05-14",
      totalValueUsd: 26420,
      totalValueKrw: 35667000,
      totalCostUsd: 23990,
      totalGainUsd: 2430,
      fxRate: 1350,
      netInflowKrw: 0,
    },
  ],
  automation: {
    lastRunAt: null,
    lastResult: "아직 자동 실행 없음",
    snapshotTime: "09:10",
    timezone: "Asia/Seoul",
  },
};

function createEmptyState() {
  return {
    version: DATA_VERSION,
    fxRate: {
      pair: "USD/KRW",
      rate: 1350,
      source: "기본 환율",
      asOf: "가격 업데이트 전",
    },
    holdings: [],
    cashFlows: [],
    cashBalances: [],
    accounts: [],
    dashboardLayout: structuredClone(defaultDashboardLayout),
    accountSnapshots: [],
    priceUpdateLogs: [],
    portfolioSnapshots: [],
    automation: {
      lastRunAt: null,
      lastResult: "아직 자동 실행 없음",
      snapshotTime: "09:10",
      timezone: "Asia/Seoul",
    },
  };
}

let state = createEmptyState();
let editingHoldingId = null;
let editingCashFlowId = null;
let editingCashBalanceId = null;
let editingAccountId = null;
let isLayoutEditing = false;
let draggedDashboardCardId = null;
let resizingDashboardCard = null;
let authState = {
  configured: false,
  signedIn: false,
  user: null,
};

const els = {
  viewTabs: document.querySelectorAll("[data-view-tab]"),
  viewSections: document.querySelectorAll("[data-view]"),
  refreshButton: document.querySelector("#refreshButton"),
  saveSnapshotButton: document.querySelector("#saveSnapshotButton"),
  emptyPortfolioButton: document.querySelector("#emptyPortfolioButton"),
  resetButton: document.querySelector("#resetButton"),
  authStatus: document.querySelector("#authStatus"),
  googleLoginButton: document.querySelector("#googleLoginButton"),
  logoutButton: document.querySelector("#logoutButton"),
  providerStatus: document.querySelector("#providerStatus"),
  lastUpdated: document.querySelector("#lastUpdated"),
  totalValue: document.querySelector("#totalValue"),
  totalValueKrw: document.querySelector("#totalValueKrw"),
  totalCost: document.querySelector("#totalCost"),
  totalGain: document.querySelector("#totalGain"),
  totalReturn: document.querySelector("#totalReturn"),
  cashTotal: document.querySelector("#cashTotal"),
  fxRate: document.querySelector("#fxRate"),
  fxSource: document.querySelector("#fxSource"),
  allocationDonut: document.querySelector("#allocationDonut"),
  allocationLegend: document.querySelector("#allocationLegend"),
  performanceChart: document.querySelector("#performanceChart"),
  performanceStats: document.querySelector("#performanceStats"),
  breakdownList: document.querySelector("#breakdownList"),
  dashboardBoard: document.querySelector("#dashboardBoard"),
  layoutStatus: document.querySelector("#layoutStatus"),
  layoutEditButton: document.querySelector("#layoutEditButton"),
  layoutResetButton: document.querySelector("#layoutResetButton"),
  accountSummary: document.querySelector("#accountSummary"),
  accountDetailSelect: document.querySelector("#accountDetailSelect"),
  accountDetail: document.querySelector("#accountDetail"),
  accountForm: document.querySelector("#accountForm"),
  accountSubmit: document.querySelector("#accountSubmit"),
  accountCancel: document.querySelector("#accountCancel"),
  accountList: document.querySelector("#accountList"),
  snapshotsBody: document.querySelector("#snapshotsBody"),
  monthlySummaryBody: document.querySelector("#monthlySummaryBody"),
  performanceRange: document.querySelector("#performanceRange"),
  investorFilter: document.querySelector("#investorFilter"),
  strategyFilter: document.querySelector("#strategyFilter"),
  accountTypeFilter: document.querySelector("#accountTypeFilter"),
  holdingsBody: document.querySelector("#holdingsBody"),
  holdingForm: document.querySelector("#holdingForm"),
  holdingSubmit: document.querySelector("#holdingSubmit"),
  holdingCancel: document.querySelector("#holdingCancel"),
  cashFlowForm: document.querySelector("#cashFlowForm"),
  cashFlowSubmit: document.querySelector("#cashFlowSubmit"),
  cashFlowCancel: document.querySelector("#cashFlowCancel"),
  cashFlowsBody: document.querySelector("#cashFlowsBody"),
  cashBalanceForm: document.querySelector("#cashBalanceForm"),
  cashBalanceSubmit: document.querySelector("#cashBalanceSubmit"),
  cashBalanceCancel: document.querySelector("#cashBalanceCancel"),
  cashAllocationForm: document.querySelector("#cashAllocationForm"),
  unclassifiedCashPanel: document.querySelector("#unclassifiedCashPanel"),
  unclassifiedCashSummary: document.querySelector("#unclassifiedCashSummary"),
  cashBalanceList: document.querySelector("#cashBalanceList"),
  automationCurrent: document.querySelector("#automationCurrent"),
  automationSchedule: document.querySelector("#automationSchedule"),
  automationResult: document.querySelector("#automationResult"),
  priceLogsBody: document.querySelector("#priceLogsBody"),
  exportBackupButton: document.querySelector("#exportBackupButton"),
  restoreInput: document.querySelector("#restoreInput"),
  importPreviewInput: document.querySelector("#importPreviewInput"),
  commitImportButton: document.querySelector("#commitImportButton"),
  loadImportSummaryButton: document.querySelector("#loadImportSummaryButton"),
  importSummary: document.querySelector("#importSummary"),
  reconcileSummary: document.querySelector("#reconcileSummary"),
  backupStatus: document.querySelector("#backupStatus"),
};

els.viewTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.viewTab);
  });
});

els.refreshButton.addEventListener("click", () => {
  refreshPrices().catch((error) => {
    setStatus("가격 업데이트 실패", error.message);
  });
});

els.saveSnapshotButton.addEventListener("click", () => {
  saveTodaySnapshot();
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
    setStatus(authState.signedIn ? "Supabase 포트폴리오 불러옴" : "로컬 데모 모드", authState.user?.email || "브라우저 저장소 사용");
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

for (const filter of [els.investorFilter, els.strategyFilter, els.accountTypeFilter]) {
  filter.addEventListener("change", renderHoldings);
}

els.performanceRange.addEventListener("change", () => {
  renderPerformance();
  renderSnapshots();
  renderMonthlySummary();
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
    accountType: String(form.get("accountType")),
    baseCurrency: String(form.get("baseCurrency")),
  };
  if (editingAccountId) {
    const previous = state.accounts.find((account) => account.id === editingAccountId);
    state.accounts = state.accounts.map((account) => (account.id === editingAccountId ? nextAccount : account));
    if (previous) {
      renameAccountReferences(previous, nextAccount);
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
    accountType: String(form.get("accountType")),
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
        return normalized;
      })
      .catch((error) => {
        setStatus("Supabase 불러오기 실패", error.message);
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
    holdings: Array.isArray(input.holdings) ? input.holdings : fallback.holdings,
    cashFlows: Array.isArray(input.cashFlows) ? input.cashFlows : fallback.cashFlows,
    cashBalances: Array.isArray(input.cashBalances) ? input.cashBalances : fallback.cashBalances,
    accounts: normalizeAccounts(input),
    dashboardLayout: normalizeDashboardLayout(input.dashboardLayout),
    accountSnapshots: Array.isArray(input.accountSnapshots) ? input.accountSnapshots : fallback.accountSnapshots,
    priceUpdateLogs: Array.isArray(input.priceUpdateLogs) ? input.priceUpdateLogs : fallback.priceUpdateLogs,
    portfolioSnapshots: Array.isArray(input.portfolioSnapshots) ? input.portfolioSnapshots : fallback.portfolioSnapshots,
    automation: {
      ...fallback.automation,
      ...(input.automation || {}),
    },
  };
}

async function initialize() {
  try {
    authState = await waitForAuthState();
    state = await loadState();
    render();
    renderAuth();
    setStatus(authState.signedIn ? "Supabase 데이터 불러옴" : "데이터 불러옴", authState.user?.email || state.automation?.lastResult || "저장소와 연결됨");
  } catch {
    state = structuredClone(sampleState);
    render();
    setStatus("샘플 데이터 불러옴", "서버 저장소를 사용할 수 없습니다");
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
    window.StocklioAuth.savePortfolioState(state).catch((error) => {
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
    els.authStatus.textContent = "Supabase 설정 필요 · 로컬 데모";
    els.googleLoginButton.disabled = true;
    els.googleLoginButton.hidden = false;
    els.logoutButton.hidden = true;
    return;
  }
  if (authState.signedIn) {
    els.authStatus.textContent = `${authState.user?.name || authState.user?.email} · Supabase 저장`;
    els.googleLoginButton.hidden = true;
    els.logoutButton.hidden = false;
    return;
  }
  els.authStatus.textContent = "로그인하면 개인 포트폴리오가 저장됩니다";
  els.googleLoginButton.disabled = false;
  els.googleLoginButton.hidden = false;
  els.logoutButton.hidden = true;
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
  els.viewTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTab === view);
  });
  els.viewSections.forEach((section) => {
    section.hidden = section.dataset.view !== view;
  });
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
    ? `${visibleCount}/${state.dashboardLayout.length} 카드 표시 · 이동/크기 조절 가능`
    : `${visibleCount}/${state.dashboardLayout.length} 카드 표시`;
  els.layoutEditButton.textContent = isLayoutEditing ? "편집 완료" : "레이아웃 편집";
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
  fillSelect(els.accountTypeFilter, "모든 계좌 유형", unique(state.holdings.map((h) => h.accountType)));
}

function fillSelect(select, label, values) {
  const previous = select.value;
  select.innerHTML = `<option value="">${label}</option>${values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("")}`;
  select.value = values.includes(previous) ? previous : "";
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
  const type = account.accountType ? ` · ${account.accountType}` : "";
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
}

function renderBreakdown() {
  const investors = groupByValue(state.holdings, "investor");
  const accountTypes = groupByValue(state.holdings, "accountType");
  els.breakdownList.innerHTML = [
    ...investors.map((item, index) => breakdownRow(item, index)),
    ...accountTypes.map((item, index) => breakdownRow(item, index + investors.length)),
  ].join("");
}

function renderAccounts() {
  const accounts = getKnownAccounts();
  els.accountList.innerHTML = accounts.length
    ? accounts
        .map((account) => {
          const inUse = isAccountInUse(account);
          return `<div class="detail-row">
            <span>
              <strong>${escapeHtml(account.account)}</strong>
              <small>${escapeHtml(account.investor)} · ${escapeHtml(account.provider || "기관 미지정")} · ${escapeHtml(account.accountType || "brokerage")} · ${escapeHtml(account.baseCurrency || "KRW")}</small>
            </span>
            <span>${formatKrw(getAccountValueKrw(account))}</span>
            <div class="row-actions">
              <button class="ghost small-button" type="button" data-edit-account="${account.id}">수정</button>
              <button class="icon-danger" type="button" data-delete-account="${account.id}" ${inUse ? "disabled" : ""} aria-label="계좌 삭제">×</button>
            </div>
          </div>`;
        })
        .join("")
    : `<div class="empty-state">등록된 계좌가 없습니다</div>`;

  document.querySelectorAll("[data-edit-account]").forEach((button) => {
    button.addEventListener("click", () => startEditAccount(button.dataset.editAccount));
  });
  document.querySelectorAll("[data-delete-account]").forEach((button) => {
    button.addEventListener("click", () => {
      state.accounts = state.accounts.filter((account) => account.id !== button.dataset.deleteAccount);
      saveState();
      render();
    });
  });
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
    </tr>`)
    .join("");
}

function renderMonthlySummary() {
  const rows = getMonthlyRows().reverse();
  els.monthlySummaryBody.innerHTML = rows
    .map((row) => `<tr>
      <td>${escapeHtml(row.month)}</td>
      <td>${formatKrw(row.endValueKrw)}</td>
      <td class="${row.changeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.changeKrw)}</td>
      <td>${formatKrw(row.netInflowKrw)}</td>
      <td class="${row.investmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.investmentGainKrw)}</td>
    </tr>`)
    .join("");
}

function breakdownRow(item, index) {
  return `<div class="breakdown-row">
    <span class="swatch" style="background:${palette[index % palette.length]}"></span>
    <span>${escapeHtml(item.label)}</span>
    <strong>${formatKrw(item.value)}</strong>
  </div>`;
}

function renderHoldings() {
  const rows = filteredHoldings();
  els.holdingsBody.innerHTML = rows
    .map((holding) => {
      const values = getHoldingValues(holding);
      const value = values.valueNative;
      const cost = values.costNative;
      const gain = values.gainNative;
      const returnRate = cost ? gain / cost : 0;
      return `<tr>
        <td>${escapeHtml(holding.investor)}</td>
        <td>${escapeHtml(holding.account)}</td>
        <td>${escapeHtml(holding.strategy)}</td>
        <td><strong>${escapeHtml(holding.name || holding.ticker)}</strong>${holding.ticker && holding.ticker !== holding.name ? `<small>${escapeHtml(holding.ticker)}</small>` : ""}</td>
        <td>${formatNumber(holding.quantity, 4)}</td>
        <td>${formatMoney(holding.price, holding.currency)}</td>
        <td>${formatMoney(holding.averageCost, holding.currency)}</td>
        <td>${formatMoney(value, holding.currency)}</td>
        <td class="${gain >= 0 ? "positive" : "negative"}">${formatMoney(gain, holding.currency)}</td>
        <td class="${gain >= 0 ? "positive" : "negative"}">${formatPercent(returnRate)}</td>
        <td>
          <div class="row-actions">
            <button class="ghost small-button" type="button" data-edit-holding="${holding.id}">수정</button>
            <button class="icon-danger" type="button" data-delete="${holding.id}" aria-label="${escapeHtml(holding.ticker)} 삭제">×</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  document.querySelectorAll("[data-edit-holding]").forEach((button) => {
    button.addEventListener("click", () => startEditHolding(button.dataset.editHolding));
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.holdings = state.holdings.filter((holding) => holding.id !== button.dataset.delete);
      saveState();
      render();
    });
  });
}

function renderCashBalances() {
  renderUnclassifiedCashAllocation();
  const rows = [...(state.cashBalances || [])].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
  els.cashBalanceList.innerHTML = rows.length
    ? rows
        .map((cash) => `<div class="detail-row">
          <span>
            <strong>${escapeHtml(cash.account)}</strong>
            <small>${escapeHtml(cash.investor)} · ${escapeHtml(cash.currency)} · ${escapeHtml(cash.source || "직접 입력")}</small>
          </span>
          <span>${formatMoney(cash.amount, cash.currency)}</span>
          <div class="row-actions">
            <button class="ghost small-button" type="button" data-edit-cash="${cash.id}">수정</button>
            <button class="icon-danger" type="button" data-delete-cash="${cash.id}" aria-label="예수금 삭제">×</button>
          </div>
        </div>`)
        .join("")
    : `<div class="empty-state">등록된 예수금이 없습니다</div>`;

  document.querySelectorAll("[data-edit-cash]").forEach((button) => {
    button.addEventListener("click", () => startEditCashBalance(button.dataset.editCash));
  });

  document.querySelectorAll("[data-delete-cash]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cashBalances = state.cashBalances.filter((cash) => cash.id !== button.dataset.deleteCash);
      saveState();
      render();
    });
  });
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
  const rows = [...state.cashFlows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  els.cashFlowsBody.innerHTML = rows
    .map((flow) => `<tr>
      <td>${escapeHtml(flow.date)}</td>
      <td>${escapeHtml(flow.investor)}</td>
      <td>${escapeHtml(flow.account)}</td>
      <td>${formatFlowType(flow.type)}</td>
      <td>${formatKrw(flow.amountKrw)}</td>
      <td>${escapeHtml(flow.note || "")}</td>
      <td>
        <div class="row-actions">
          <button class="ghost small-button" type="button" data-edit-flow="${flow.id}">수정</button>
          <button class="icon-danger" type="button" data-delete-flow="${flow.id}" aria-label="입출금 기록 삭제">×</button>
        </div>
      </td>
    </tr>`)
    .join("");

  document.querySelectorAll("[data-edit-flow]").forEach((button) => {
    button.addEventListener("click", () => startEditCashFlow(button.dataset.editFlow));
  });

  document.querySelectorAll("[data-delete-flow]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cashFlows = state.cashFlows.filter((flow) => flow.id !== button.dataset.deleteFlow);
      saveState();
      render();
    });
  });
}

function startEditHolding(id) {
  const holding = state.holdings.find((item) => item.id === id);
  if (!holding) {
    return;
  }
  editingHoldingId = id;
  setFormAccount(els.holdingForm, holding);
  els.holdingForm.elements.accountType.value = holding.accountType || "brokerage";
  els.holdingForm.elements.strategy.value = holding.strategy || "Core";
  els.holdingForm.elements.ticker.value = holding.ticker || "";
  els.holdingForm.elements.quantity.value = holding.quantity ?? "";
  els.holdingForm.elements.averageCost.value = holding.averageCost ?? "";
  updateEditControls();
  setView("holdings");
  els.holdingForm.scrollIntoView({ block: "center" });
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
  els.accountForm.elements.accountType.value = account.accountType || "brokerage";
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
  els.cashFlowForm.elements.date.value = flow.date || todayKey();
  setFormAccount(els.cashFlowForm, flow);
  els.cashFlowForm.elements.type.value = flow.type || "deposit";
  els.cashFlowForm.elements.amountKrw.value = flow.amountKrw ?? "";
  els.cashFlowForm.elements.note.value = flow.note || "";
  updateEditControls();
  setView("cashflows");
  els.cashFlowForm.scrollIntoView({ block: "center" });
}

function startEditCashBalance(id) {
  const cash = (state.cashBalances || []).find((item) => item.id === id);
  if (!cash) {
    return;
  }
  editingCashBalanceId = id;
  setFormAccount(els.cashBalanceForm, cash);
  els.cashBalanceForm.elements.currency.value = cash.currency || "KRW";
  els.cashBalanceForm.elements.amount.value = cash.amount ?? "";
  updateEditControls();
  setView("accounts");
  els.cashBalanceForm.scrollIntoView({ block: "center" });
}

function cancelEdit(kind) {
  if (kind === "holding") {
    editingHoldingId = null;
    els.holdingForm.reset();
  }
  if (kind === "cashFlow") {
    editingCashFlowId = null;
    els.cashFlowForm.reset();
    els.cashFlowForm.elements.date.value = todayKey();
  }
  if (kind === "cashBalance") {
    editingCashBalanceId = null;
    els.cashBalanceForm.reset();
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
  els.holdingSubmit.textContent = editingHoldingId ? "수정 저장" : "추가";
  els.holdingCancel.hidden = !editingHoldingId;
  els.cashFlowSubmit.textContent = editingCashFlowId ? "수정 저장" : "기록";
  els.cashFlowCancel.hidden = !editingCashFlowId;
  els.cashBalanceSubmit.textContent = editingCashBalanceId ? "수정 저장" : "저장";
  els.cashBalanceCancel.hidden = !editingCashBalanceId;
}

function renderAutomation() {
  const automation = state.automation || {};
  els.automationCurrent.textContent = `SQLite 저장소 · 스냅샷 ${state.portfolioSnapshots.length}개 · 보유 ${state.holdings.length}개 · 예수금 ${(state.cashBalances || []).length}개`;
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
  return state.holdings.filter((holding) => {
    return (
      (!els.investorFilter.value || holding.investor === els.investorFilter.value) &&
      (!els.strategyFilter.value || holding.strategy === els.strategyFilter.value) &&
      (!els.accountTypeFilter.value || holding.accountType === els.accountTypeFilter.value)
    );
  });
}

function saveTodaySnapshot() {
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
  setStatus("오늘 성과 저장 완료", `${snapshot.date} · ${formatKrw(snapshot.totalValueKrw)}`);
}

function buildPortfolioSnapshot(date) {
  const totals = getTotals(state.holdings);
  return {
    id: makeId(),
    date,
    totalValueUsd: totals.valueUsdEquivalent,
    totalValueKrw: totals.valueKrw,
    totalCostUsd: totals.costUsdEquivalent,
    totalGainUsd: totals.gainUsdEquivalent,
    fxRate: state.fxRate.rate,
    netInflowKrw: getNetInflowKrw(date),
  };
}

async function refreshPrices() {
  setStatus("가격 업데이트 중", "Yahoo Finance에서 키 없이 조회 중");

  const tickers = unique(state.holdings.filter((holding) => holding.autoPrice !== false).map((holding) => holding.ticker));
  const quoteMap = {};
  const failures = [];
  for (const ticker of tickers) {
    try {
      quoteMap[ticker] = await getQuote(ticker);
      addPriceLog({ symbol: ticker, status: "success", price: quoteMap[ticker].price, source: quoteMap[ticker].source });
    } catch (error) {
      failures.push(`${ticker}: ${error.message}`);
      addPriceLog({ symbol: ticker, status: "error", message: error.message });
    }
  }

  try {
    state.fxRate = await getUsdKrw();
    addPriceLog({ symbol: "USD/KRW", status: "success", price: state.fxRate.rate, source: state.fxRate.source });
  } catch (error) {
    failures.push(`USD/KRW: ${error.message}`);
    addPriceLog({ symbol: "USD/KRW", status: "error", message: error.message });
  }

  state.holdings = state.holdings.map((holding) => {
    const quote = quoteMap[holding.ticker];
    return quote
      ? {
          ...holding,
          price: quote.price,
          priceSource: quote.source,
          priceAsOf: quote.asOf,
        }
      : holding;
  });

  saveState();
  render();
  const updatedAt = new Date().toISOString();
  if (failures.length) {
    setStatus("일부 가격 업데이트 완료", failures.slice(0, 2).join(" · "));
    return;
  }
  setStatus("가격 업데이트 완료", `Yahoo Finance · 마지막 확인 ${formatAsOf(updatedAt)}`);
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

async function getQuote(ticker) {
  return cached(`quote:${ticker}`, QUOTE_CACHE_TTL_MS, async () => {
    const data = await fetchYahooChart(ticker);
    const meta = data?.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`${ticker} 가격 응답이 없습니다`);
    }
    const previousClose = Number(meta?.previousClose ?? meta?.chartPreviousClose ?? price);
    const timestamp = Number(meta?.regularMarketTime);
    return {
      price,
      priceChange: price - previousClose,
      priceChangePercent: previousClose ? (price - previousClose) / previousClose : 0,
      source: "Yahoo Finance",
      asOf: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
    };
  });
}

async function getUsdKrw() {
  return cached("fx:USD:KRW", FX_CACHE_TTL_MS, async () => {
    const data = await fetchYahooChart("KRW=X");
    const meta = data?.chart?.result?.[0]?.meta;
    const rate = Number(meta?.regularMarketPrice);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("USD/KRW 환율 응답이 없습니다");
    }
    const timestamp = Number(meta?.regularMarketTime);
    return {
      pair: "USD/KRW",
      rate,
      source: "Yahoo Finance",
      asOf: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
    };
  });
}

async function cached(key, ttlMs, loader) {
  const cacheKey = `${CACHE_PREFIX}:${key}`;
  const stored = localStorage.getItem(cacheKey);
  if (stored) {
    const cachedValue = JSON.parse(stored);
    if (Date.now() - cachedValue.cachedAt < ttlMs) {
      return cachedValue.payload;
    }
  }
  const payload = await loader();
  localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), payload }));
  return payload;
}

async function fetchYahooChart(symbol) {
  const url = new URL("/api/yahoo/chart", window.location.origin);
  url.searchParams.set("symbol", symbol);
  return fetchJson(url);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  const yahooError = data?.chart?.error;
  if (yahooError) {
    throw new Error(yahooError.description || yahooError.code || "Yahoo Finance 오류");
  }
  return data;
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

function groupByAccount(holdings) {
  const map = new Map();
  for (const holding of holdings) {
    const key = `${holding.investor}|||${holding.account}`;
    const current = map.get(key) || {
      investor: holding.investor,
      account: holding.account,
      accountType: holding.accountType,
      valueUsd: 0,
      costUsd: 0,
      gain: 0,
      stockValueKrw: 0,
      cashKrw: 0,
    };
    const values = getHoldingValues(holding);
    current.valueUsd += values.valueUsdEquivalent;
    current.costUsd += values.costUsdEquivalent;
    current.gain += values.gainKrw;
    current.stockValueKrw += values.valueKrw;
    map.set(key, current);
  }
  for (const cash of state.cashBalances || []) {
    const key = `${cash.investor}|||${cash.account}`;
    const current = map.get(key) || {
      investor: cash.investor,
      account: cash.account,
      accountType: "cash",
      valueUsd: 0,
      costUsd: 0,
      gain: 0,
      stockValueKrw: 0,
      cashKrw: 0,
    };
    const valueKrw = getCashValueKrw(cash);
    current.valueUsd += valueKrw / Number(state.fxRate.rate || 1);
    current.cashKrw += valueKrw;
    map.set(key, current);
  }
  return [...map.values()]
    .map((item) => ({
      ...item,
      valueKrw: item.valueUsd * state.fxRate.rate,
      returnRate: item.costUsd ? (item.gain / state.fxRate.rate) / item.costUsd : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

function buildAccountSnapshots(date) {
  return groupByAccount(state.holdings).map((item) => ({
    id: makeId(),
    date,
    investor: item.investor,
    account: item.account,
    stockValueKrw: item.stockValueKrw,
    cashKrw: item.cashKrw,
    totalAssetsKrw: item.valueKrw,
    gainKrw: item.gain,
    returnRate: item.returnRate,
  }));
}

function getSnapshotRows() {
  const snapshots = [...(state.portfolioSnapshots || [])].sort((a, b) => a.date.localeCompare(b.date));
  return snapshots.map((snapshot, index) => {
    const previous = snapshots[index - 1];
    const dailyChangeKrw = previous ? snapshot.totalValueKrw - previous.totalValueKrw : 0;
    const netInflowKrw = Number(snapshot.netInflowKrw || 0);
    const investmentGainKrw = previous ? dailyChangeKrw - netInflowKrw : 0;
    const dailyReturn = previous?.totalValueKrw ? investmentGainKrw / previous.totalValueKrw : 0;
    return {
      ...snapshot,
      dailyChangeKrw,
      netInflowKrw,
      investmentGainKrw,
      dailyReturn,
    };
  });
}

function getFilteredSnapshotRows() {
  const rows = getSnapshotRows();
  const range = els.performanceRange?.value || "all";
  if (!rows.length || range === "all") {
    return rows;
  }
  const latest = rows[rows.length - 1];
  const latestDate = new Date(`${latest.date}T00:00:00`);
  if (range === "ytd") {
    const year = latest.date.slice(0, 4);
    return rows.filter((row) => row.date.startsWith(year));
  }
  const days = range === "7d" ? 7 : 30;
  const minTime = latestDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000;
  return rows.filter((row) => new Date(`${row.date}T00:00:00`).getTime() >= minTime);
}

function getMonthlyRows() {
  const rows = getFilteredSnapshotRows();
  const grouped = new Map();
  for (const row of rows) {
    const month = row.date.slice(0, 7);
    if (!grouped.has(month)) {
      grouped.set(month, []);
    }
    grouped.get(month).push(row);
  }
  return [...grouped.entries()].map(([month, monthRows]) => {
    const first = monthRows[0];
    const last = monthRows[monthRows.length - 1];
    const changeKrw = last.totalValueKrw - first.totalValueKrw;
    const netInflowKrw = monthRows.reduce((sum, row) => sum + row.netInflowKrw, 0);
    return {
      month,
      endValueKrw: last.totalValueKrw,
      changeKrw,
      netInflowKrw,
      investmentGainKrw: changeKrw - netInflowKrw,
    };
  });
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
    setStatus("백업 복원 완료", "SQLite 상태에 반영했습니다");
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
    setStatus("Import 확정 완료", "SQLite 상태에 새 포트폴리오를 저장했습니다");
  } catch (error) {
    els.importSummary.textContent = `Import 확정 실패 · ${error.message}`;
    setStatus("Import 확정 실패", error.message);
  }
}

function getNetInflowKrw(date) {
  return (state.cashFlows || [])
    .filter((flow) => flow.date === date)
    .reduce((sum, flow) => sum + getExternalFlowAmount(flow), 0);
}

function getExternalFlowAmount(flow) {
  if (flow.type === "deposit") {
    return Number(flow.amountKrw || 0);
  }
  if (flow.type === "withdrawal") {
    return -Number(flow.amountKrw || 0);
  }
  return 0;
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
  const values = holdings.map(getHoldingValues);
  const stockValueKrw = values.reduce((sum, item) => sum + item.valueKrw, 0);
  const cashKrw = getCashTotalKrw();
  const valueKrw = stockValueKrw + cashKrw;
  const costKrw = values.reduce((sum, item) => sum + item.costKrw, 0);
  const gainKrw = stockValueKrw - costKrw;
  return {
    value: valueKrw / state.fxRate.rate,
    cost: costKrw / state.fxRate.rate,
    gain: gainKrw / state.fxRate.rate,
    valueKrw,
    stockValueKrw,
    cashKrw,
    costKrw,
    gainKrw,
    valueUsdEquivalent: valueKrw / state.fxRate.rate,
    costUsdEquivalent: costKrw / state.fxRate.rate,
    gainUsdEquivalent: gainKrw / state.fxRate.rate,
    returnRate: costKrw ? gainKrw / costKrw : 0,
  };
}

function getCashTotalKrw() {
  return (state.cashBalances || []).reduce((sum, cash) => sum + getCashValueKrw(cash), 0);
}

function getCashValueKrw(cash) {
  const amount = Number(cash.amount || 0);
  return cash.currency === "USD" ? amount * Number(state.fxRate.rate || 1) : amount;
}

function getUnclassifiedCashBalances() {
  return (state.cashBalances || []).filter(isUnclassifiedCash);
}

function isUnclassifiedCash(cash) {
  return cash.currency === "KRW" && String(cash.account || "").includes("미분류");
}

function normalizeAccounts(input) {
  const explicit = Array.isArray(input.accounts) ? input.accounts : [];
  const sourceState = {
    holdings: Array.isArray(input.holdings) ? input.holdings : [],
    cashBalances: Array.isArray(input.cashBalances) ? input.cashBalances : [],
  };
  const map = new Map();
  for (const account of [...deriveAccounts(sourceState), ...explicit]) {
    const key = `${account.investor}|||${account.account}`;
    map.set(key, {
      id: account.id || makeId(),
      investor: account.investor,
      account: account.account,
      provider: account.provider || inferProvider(account.account),
      accountType: account.accountType || "brokerage",
      baseCurrency: account.baseCurrency || "KRW",
    });
  }
  return [...map.values()].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
}

function deriveAccounts(sourceState = state) {
  const map = new Map();
  for (const holding of sourceState.holdings || []) {
    const key = `${holding.investor}|||${holding.account}`;
    map.set(key, {
      id: makeId(),
      investor: holding.investor,
      account: holding.account,
      provider: inferProvider(holding.account),
      accountType: holding.accountType || "brokerage",
      baseCurrency: holding.currency || "KRW",
    });
  }
  for (const cash of sourceState.cashBalances || []) {
    if (isUnclassifiedCash(cash)) {
      continue;
    }
    const key = `${cash.investor}|||${cash.account}`;
    if (!map.has(key)) {
      map.set(key, {
        id: makeId(),
        investor: cash.investor,
        account: cash.account,
        provider: inferProvider(cash.account),
        accountType: "cash",
        baseCurrency: cash.currency || "KRW",
      });
    }
  }
  return [...map.values()];
}

function getKnownAccounts() {
  const map = new Map();
  for (const account of state.accounts || []) {
    const key = `${account.investor}|||${account.account}`;
    map.set(key, { ...account, key });
  }
  for (const holding of state.holdings || []) {
    const key = `${holding.investor}|||${holding.account}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        id: makeId(),
        investor: holding.investor,
        account: holding.account,
        provider: inferProvider(holding.account),
        accountType: holding.accountType,
        baseCurrency: holding.currency || "KRW",
      });
    }
  }
  for (const cash of state.cashBalances || []) {
    if (isUnclassifiedCash(cash)) {
      continue;
    }
    const key = `${cash.investor}|||${cash.account}`;
    if (!map.has(key)) {
      map.set(key, { key, investor: cash.investor, account: cash.account, accountType: "" });
    }
  }
  return [...map.values()].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
}

function parseAccountKey(value) {
  const [investor, account] = String(value || "").split("|||");
  return { investor: investor || "", account: account || "" };
}

function accountKeyFor(item) {
  return `${item.investor}|||${item.account}`;
}

function setFormAccount(form, item) {
  renderAccountSelectors();
  form.elements.accountKey.value = accountKeyFor(item);
}

function isAccountInUse(account) {
  return state.holdings.some((holding) => holding.investor === account.investor && holding.account === account.account) ||
    (state.cashBalances || []).some((cash) => cash.investor === account.investor && cash.account === account.account) ||
    (state.cashFlows || []).some((flow) => flow.investor === account.investor && flow.account === account.account);
}

function getAccountValueKrw(account) {
  const key = `${account.investor}|||${account.account}`;
  return groupByAccount(state.holdings).find((item) => `${item.investor}|||${item.account}` === key)?.valueKrw || 0;
}

function renameAccountReferences(previous, nextAccount) {
  const replace = (item) =>
    item.investor === previous.investor && item.account === previous.account
      ? { ...item, investor: nextAccount.investor, account: nextAccount.account, accountType: item.accountType || nextAccount.accountType }
      : item;
  state.holdings = state.holdings.map(replace);
  state.cashBalances = (state.cashBalances || []).map(replace);
  state.cashFlows = (state.cashFlows || []).map(replace);
}

function inferProvider(accountName = "") {
  return String(accountName).split(" ")[0] || "";
}

function getHoldingValues(holding) {
  const valueNative = Number(holding.quantity || 0) * Number(holding.price || 0);
  const costNative = Number(holding.quantity || 0) * Number(holding.averageCost || 0);
  const gainNative = valueNative - costNative;
  const rate = holding.currency === "KRW" ? 1 : Number(state.fxRate.rate || 1);
  return {
    valueNative,
    costNative,
    gainNative,
    valueKrw: valueNative * rate,
    costKrw: costNative * rate,
    gainKrw: gainNative * rate,
    valueUsdEquivalent: holding.currency === "USD" ? valueNative : valueNative / Number(state.fxRate.rate || 1),
    costUsdEquivalent: holding.currency === "USD" ? costNative : costNative / Number(state.fxRate.rate || 1),
    gainUsdEquivalent: holding.currency === "USD" ? gainNative : gainNative / Number(state.fxRate.rate || 1),
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function setStatus(status, detail) {
  els.providerStatus.textContent = status;
  els.lastUpdated.textContent = detail;
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatKrw(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatMoney(value, currency = "USD") {
  return currency === "KRW" ? formatKrw(value) : formatUsd(value);
}

function formatCompactKrw(value) {
  const abs = Math.abs(value || 0);
  if (abs >= 100000000) {
    return `${formatNumber((value || 0) / 100000000, 1)}억`;
  }
  if (abs >= 10000) {
    return `${formatNumber((value || 0) / 10000, 0)}만`;
  }
  return formatKrw(value);
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value || 0);
}

function formatPercent(value) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatAsOf(value) {
  if (!value || value === "Sample" || value === "샘플") {
    return "샘플";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

initialize();
