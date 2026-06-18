import { formatAccountType, normalizeAccountType } from "./account-types.js";
import {
  escapeHtml,
  formatKrw,
  formatNumber,
  formatPercent,
  formatAsOf,
} from "./formatters.js";
import { dashboardCardLabels, palette } from "./constants.js";
import { normalizeDashboardLayout } from "../domain/portfolio-core.js";

let _ctx;

export function init(ctx) {
  _ctx = ctx;
}

export function renderFilters() {
  const state = _ctx.getState();
  const els = _ctx.els;
  fillSelect(els.investorFilter, "모든 투자자", _ctx.unique(state.holdings.map((h) => h.investor)));
  fillSelect(els.strategyFilter, "모든 전략", _ctx.strategyBuckets(state.holdings.map((h) => h.strategy)));
  fillSelect(els.accountTypeFilter, "모든 계좌 유형", _ctx.unique(state.holdings.map((h) => normalizeAccountType(h.accountType))), _ctx.accountTypeLabels);
}

export function fillSelect(select, label, values, labels = {}) {
  const previous = select.value;
  select.innerHTML = `<option value="">${label}</option>${values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(labels[value] || value)}</option>`)
    .join("")}`;
  select.value = values.includes(previous) ? previous : "";
}

export function renderSortHeaders() {
  const { holdingHeaderSort, cashFlowHeaderSort, DEFAULT_HOLDING_SORT, DEFAULT_CASH_FLOW_SORT } = _ctx;
  updateSortHeaderButtons("[data-holding-sort-key]", holdingHeaderSort, DEFAULT_HOLDING_SORT);
  updateSortHeaderButtons("[data-flow-sort-key]", cashFlowHeaderSort, DEFAULT_CASH_FLOW_SORT);
}

export function updateSortHeaderButtons(selector, activeSort, fallback) {
  const { parseSortValue } = _ctx;
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

export function renderAccountSelectors() {
  const els = _ctx.els;
  const accounts = _ctx.getKnownAccounts();
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
  fillSelect(els.accountInvestorFilter, "모든 투자자", _ctx.unique(accounts.map((account) => account.investor)));
}

export function accountOption(account) {
  const type = ` · ${formatAccountType(account.accountType)}`;
  return `<option value="${escapeHtml(account.key)}">${escapeHtml(account.investor)} · ${escapeHtml(account.account)}${escapeHtml(type)}</option>`;
}

export function renderSummary() {
  const state = _ctx.getState();
  const els = _ctx.els;
  const totals = _ctx.getTotals(state.holdings);
  const stockCount = state.holdings.filter((h) => h.type !== "cash").length;
  els.totalValue.textContent = formatKrw(totals.valueKrw);
  els.totalValueKrw.textContent = `주식 ${formatKrw(totals.stockValueKrw)} · 예수금 ${formatKrw(totals.cashKrw)}`;
  els.totalCost.textContent = formatKrw(totals.costKrw);
  const costMeta = document.getElementById("totalCostMeta");
  if (costMeta) costMeta.textContent = `${stockCount}개 종목 · 평단 기준`;
  els.totalGain.textContent = formatKrw(totals.gainKrw);
  els.totalGain.className = totals.gainKrw >= 0 ? "positive" : "negative";
  els.totalReturn.textContent = formatPercent(totals.returnRate);
  els.totalReturn.className = totals.gainKrw >= 0 ? "positive" : "negative";
  els.cashTotal.textContent = formatKrw(totals.cashKrw);
  els.fxRate.textContent = formatNumber(state.fxRate.rate, 2);
  els.fxSource.textContent = `${state.fxRate.source} · ${formatAsOf(state.fxRate.asOf)}`;
}

export function renderAllocation() {
  const els = _ctx.els;
  const { activeAllocationView, allocationViewLabels } = _ctx;
  els.allocationDimensionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.allocationView === activeAllocationView);
  });
  if (els.allocationDimensionSelect && els.allocationDimensionSelect.value !== activeAllocationView) {
    els.allocationDimensionSelect.value = activeAllocationView;
  }
  const grouped = getAllocationItems(activeAllocationView);
  renderDonut(els.allocationDonut, grouped, allocationViewLabels[activeAllocationView] || "구성");
  renderAllocationLegend(els.allocationLegend, grouped);
  // Craft.js가 DOM을 재구성하므로 allocation card 직접 탐색
  const allocationCard = document.querySelector('[data-dashboard-card="allocation"]');
  if (allocationCard) {
    let countEl = allocationCard.querySelector(".allocation-count-badge");
    if (!countEl) {
      const heading = allocationCard.querySelector(".section-heading");
      if (heading) {
        countEl = document.createElement("span");
        countEl.className = "allocation-count-badge section-badge";
        heading.appendChild(countEl);
      }
    }
    if (countEl) {
      const label = allocationViewLabels[activeAllocationView] || "항목";
      countEl.textContent = `${grouped.length}개 ${label}`;
    }
  }
}

export function renderAllocationOverview() {
  const els = _ctx.els;
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

function groupByValue(holdings, key) {
  const map = new Map();
  for (const holding of holdings) {
    map.set(holding[key], (map.get(holding[key]) || 0) + _ctx.getHoldingValues(holding).valueKrw);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function groupHoldingsByResolver(resolver) {
  const state = _ctx.getState();
  const map = new Map();
  for (const holding of state.holdings || []) {
    const label = resolver(holding) || "미분류";
    map.set(label, (map.get(label) || 0) + _ctx.getHoldingValues(holding).valueKrw);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function addCashToAllocation(items, resolver) {
  const state = _ctx.getState();
  const map = new Map(items.map((item) => [item.label, item.value]));
  for (const cash of state.cashBalances || []) {
    const label = resolver(cash) || "예수금";
    map.set(label, (map.get(label) || 0) + _ctx.getCashValueKrw(cash));
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
  const account = _ctx.getKnownAccounts().find((known) => known.investor === item.investor && known.account === item.account);
  return formatAccountType(normalizeAccountType(item.accountType || account?.accountType));
}

export function getAllocationItems(dimension = "strategy") {
  const { normalizeStrategy } = _ctx;
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

// ─── 레이아웃 상태 ────────────────────────────────────────────────
let isLayoutEditing = false;
let draggedDashboardCardId = null;
let resizingDashboardCard = null;

export function getIsLayoutEditing() { return isLayoutEditing; }
export function setIsLayoutEditing(v) { isLayoutEditing = v; }
export function getDraggedDashboardCardId() { return draggedDashboardCardId; }
export function setDraggedDashboardCardId(id) { draggedDashboardCardId = id; }
export function getResizingDashboardCard() { return resizingDashboardCard; }
export function setResizingDashboardCard(v) { resizingDashboardCard = v; }

export function renderDashboardLayout() {
  if (window.STOCKLIO_USE_CRAFT) return;
  const state = _ctx.getState();
  const els = _ctx.els;
  state.dashboardLayout = normalizeDashboardLayout(state.dashboardLayout);
  const cards = new Map(
    [...els.dashboardBoard.querySelectorAll("[data-dashboard-card]")].map((card) => [card.dataset.dashboardCard, card]),
  );
  let visibleCount = 0;
  for (const item of state.dashboardLayout) {
    const card = cards.get(item.id);
    if (!card) continue;
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
    if (isLayoutEditing) card.prepend(createLayoutControls(item));
    els.dashboardBoard.appendChild(card);
  }
  els.layoutStatus.textContent = isLayoutEditing ? `${visibleCount}/${state.dashboardLayout.length} 카드` : "";
  els.layoutStatus.hidden = !isLayoutEditing;
  els.layoutEditButton.textContent = isLayoutEditing ? "완료" : "편집";
  els.layoutResetButton.hidden = !isLayoutEditing;
}

export function createLayoutControls(item) {
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

export function handleDashboardLayoutAction(action, id) {
  const state = _ctx.getState();
  const layout = normalizeDashboardLayout(state.dashboardLayout);
  const index = layout.findIndex((item) => item.id === id);
  if (index < 0) return;
  if (action === "toggle") layout[index].visible = layout[index].visible === false;
  state.dashboardLayout = layout;
  _ctx.saveState();
  renderDashboardLayout();
}

export function handleDashboardResizeMove(event) {
  if (!resizingDashboardCard) return;
  const els = _ctx.els;
  const card = els.dashboardBoard.querySelector(`[data-dashboard-card="${CSS.escape(resizingDashboardCard.id)}"]`);
  if (!card) return;
  const columnWidth = getDashboardColumnWidth();
  const deltaColumns = columnWidth ? Math.round((event.clientX - resizingDashboardCard.startX) / columnWidth) : 0;
  const nextSpan = _ctx.clamp(resizingDashboardCard.startSpan + deltaColumns, 2, 12);
  const nextHeight = _ctx.clamp(resizingDashboardCard.startHeight + event.clientY - resizingDashboardCard.startY, 112, 720);
  card.style.setProperty("--card-span", String(nextSpan));
  card.style.setProperty("--card-min-height", `${Math.round(nextHeight)}px`);
  card.querySelector(".layout-size-readout").textContent = `${nextSpan}/12 · ${Math.round(nextHeight)}px`;
}

export function finishDashboardResize(event) {
  if (!resizingDashboardCard) return;
  const state = _ctx.getState();
  const els = _ctx.els;
  window.removeEventListener("pointermove", handleDashboardResizeMove);
  const columnWidth = getDashboardColumnWidth();
  const deltaColumns = columnWidth ? Math.round((event.clientX - resizingDashboardCard.startX) / columnWidth) : 0;
  const nextSpan = _ctx.clamp(resizingDashboardCard.startSpan + deltaColumns, 2, 12);
  const nextHeight = _ctx.clamp(resizingDashboardCard.startHeight + event.clientY - resizingDashboardCard.startY, 112, 720);
  const layout = normalizeDashboardLayout(state.dashboardLayout);
  const index = layout.findIndex((item) => item.id === resizingDashboardCard.id);
  if (index >= 0) {
    layout[index] = { ...layout[index], span: nextSpan, minHeight: Math.round(nextHeight) };
    state.dashboardLayout = layout;
    _ctx.saveState();
  }
  const card = els.dashboardBoard.querySelector(`[data-dashboard-card="${CSS.escape(resizingDashboardCard.id)}"]`);
  card?.classList.remove("is-resizing");
  if (card) card.draggable = isLayoutEditing;
  resizingDashboardCard = null;
  renderDashboardLayout();
}

export function getDashboardColumnWidth() {
  const els = _ctx.els;
  const styles = getComputedStyle(els.dashboardBoard);
  if (styles.gridTemplateColumns === "none") return els.dashboardBoard.clientWidth;
  const columns = styles.gridTemplateColumns.split(" ").filter(Boolean);
  const columnCount = columns.length || 1;
  const gap = Number.parseFloat(styles.columnGap || "0") || 0;
  return (els.dashboardBoard.clientWidth - gap * (columnCount - 1)) / columnCount + gap;
}

export function getDashboardDropTarget(event) {
  const card = event.target.closest("[data-dashboard-card]");
  if (!card || card.dataset.dashboardCard === draggedDashboardCardId) return null;
  return card;
}

export function shouldDropAfter(event, target) {
  const rect = target.getBoundingClientRect();
  const sameRowIntent = Math.abs(event.clientY - (rect.top + rect.height / 2)) < rect.height * 0.28;
  if (sameRowIntent) return event.clientX > rect.left + rect.width / 2;
  return event.clientY > rect.top + rect.height / 2;
}

export function reorderDashboardLayout(sourceId, targetId, insertAfter) {
  if (!sourceId || sourceId === targetId) return;
  const state = _ctx.getState();
  const layout = normalizeDashboardLayout(state.dashboardLayout);
  const sourceIndex = layout.findIndex((item) => item.id === sourceId);
  if (sourceIndex < 0) return;
  const [source] = layout.splice(sourceIndex, 1);
  const targetIndex = targetId ? layout.findIndex((item) => item.id === targetId) : -1;
  const insertIndex = targetIndex < 0 ? layout.length : targetIndex + (insertAfter ? 1 : 0);
  layout.splice(insertIndex, 0, source);
  state.dashboardLayout = layout;
  _ctx.saveState();
  renderDashboardLayout();
}

export function clearDashboardDragState() {
  draggedDashboardCardId = null;
  _ctx.els.dashboardBoard.querySelectorAll(".is-dragging, .is-drag-over").forEach((card) => {
    card.classList.remove("is-dragging", "is-drag-over", "is-drop-after");
  });
}
