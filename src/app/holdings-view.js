import { accountKeyFor } from "./accounts.js";
import { accountTypeLabels, normalizeAccountType } from "./account-types.js";
import {
  escapeHtml,
  formatAsOf,
  formatKrw,
  formatMoney,
  formatNumber,
  formatPercent,
} from "./formatters.js";
import { DEFAULT_HOLDING_SORT } from "./constants.js";
import { parseSortValue } from "./sort.js";
import { searchSymbols } from "./services/market-data-service.js";

let _ctx;

// 모듈 내부 상태
let holdingPage = 1;
let holdingScope = "all";
let holdingsViewMode = "detail";
let holdingHeaderSort = { key: "value", dir: "desc" };
let editingHoldingId = null;
let tickerSearchTimer = null;
let tickerSearchSeq = 0;
// "investor|||account" 키, null = 전체
let selectedAccountChip = null;

const HOLDINGS_PAGE_SIZE = window.innerWidth <= 980 ? 100 : 10;

export const TICKER_LOGO_COLORS = [
  "#1d6fa4","#e8572a","#2e7d32","#7b1fa2","#c62828",
  "#00695c","#283593","#f57f17","#4e342e","#37474f",
];

// 한국 ETF 운용사 prefix → Parqet 심볼 매핑 (실제 응답 확인된 심볼)
export const KR_ETF_PROVIDER_SYMBOLS = {
  "KODEX": "005930.KS",   // 삼성자산운용 → 삼성전자 로고로 대체
  "TIGER": "006800.KS",   // 미래에셋자산운용 → 미래에셋증권
  "ACE": "071050.KS",     // 한국투자신탁운용 → 한국금융지주
  "RISE": "RISE",         // KB자산운용 (직접 심볼)
  "HANARO": "086790.KS",  // NH아문디 → 하나금융 (근사값)
  "하나1Q": "086790.KS",  // 하나자산운용 → 하나금융지주
  "SOL": "055550.KS",     // 신한자산운용 → 신한지주
  "ARIRANG": "000370.KS", // 한화자산운용 → 한화
  "KINDEX": "071050.KS",  // 한국투자신탁
};

export function init(ctx) {
  _ctx = ctx;
}

export function getHoldingHeaderSort() {
  return holdingHeaderSort;
}

export function setHoldingHeaderSort(sort) {
  holdingHeaderSort = sort;
}

export function getHoldingPage() {
  return holdingPage;
}

export function getHoldingScope() {
  return holdingScope;
}

export function setHoldingScope(scope) {
  holdingScope = scope;
}

export function getHoldingsViewMode() {
  return holdingsViewMode;
}

export function setHoldingsViewMode(mode) {
  holdingsViewMode = mode;
}

export function getEditingHoldingId() {
  return editingHoldingId;
}

export function setEditingHoldingId(id) {
  editingHoldingId = id;
}

function resolveLogoSymbol(ticker, name) {
  // 한국 주식: 종목코드.KS 형식
  if (/^\d{6}\.KS$/.test(ticker)) return ticker;
  // 한국 ETF: 이름이 운용사 prefix로 시작
  const fullName = (name || ticker || "").trim();
  for (const [prefix, sym] of Object.entries(KR_ETF_PROVIDER_SYMBOLS)) {
    if (fullName.startsWith(prefix + " ") || fullName === prefix) return sym;
  }
  // 미국 주식/ETF: 알파벳 ticker 그대로
  return (ticker || name || "").replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

export function tickerLogoHtml(ticker, name, size = 36) {
  const symbol = resolveLogoSymbol(ticker, name);
  const fallbackLetter = (ticker || name || "?").replace(/[^A-Za-z0-9가-힣]/g, "")[0]?.toUpperCase() || "?";
  const colorKey = (ticker || name || "").toUpperCase();
  const colorIdx = [...colorKey].reduce((a, c) => a + c.charCodeAt(0), 0) % TICKER_LOGO_COLORS.length;
  const bg = TICKER_LOGO_COLORS[colorIdx];
  const imgUrl = `https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol)}?format=svg`;
  return `<span class="ticker-logo" style="width:${size}px;height:${size}px">
    <img src="${imgUrl}" alt="${escapeHtml(ticker || name)}" width="${size}" height="${size}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <span class="ticker-logo-fallback" style="display:none;background:${bg};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${escapeHtml(fallbackLetter)}</span>
  </span>`;
}

export function renderAccountChips() {
  const els = _ctx.els;
  const state = _ctx.getState();
  if (!els.accountChipsBar) return;

  // 고유 계좌 목록 추출 (investor|||account 키 기준)
  const seen = new Map();
  for (const h of state.holdings) {
    const key = `${h.investor}|||${h.account}`;
    if (!seen.has(key)) seen.set(key, { investor: h.investor, account: h.account, key });
  }
  const accounts = [...seen.values()];

  // 칩이 5개 초과면 오버플로우 처리
  const VISIBLE_MAX = 5;
  const visible = accounts.slice(0, VISIBLE_MAX);
  const overflow = accounts.slice(VISIBLE_MAX);

  const chipHtml = (key, label) => {
    const active = selectedAccountChip === key;
    return `<button class="account-chip${active ? " is-active" : ""}" type="button" data-account-chip="${escapeHtml(key ?? "")}">${escapeHtml(label)}</button>`;
  };

  let html = chipHtml(null, "전체");
  for (const acc of visible) {
    const label = acc.investor !== accounts[0]?.investor || accounts.filter(a => a.investor === acc.investor).length > 1
      ? `${acc.investor} · ${acc.account}`
      : acc.account;
    html += chipHtml(acc.key, label);
  }
  if (overflow.length) {
    html += `<div class="account-chip-overflow-wrap">
      <button class="account-chip account-chip-more" type="button" data-account-chip-more>+${overflow.length}개 ▾</button>
      <div class="account-chip-overflow" hidden>
        ${overflow.map(acc => chipHtml(acc.key, `${acc.investor} · ${acc.account}`)).join("")}
      </div>
    </div>`;
  }
  els.accountChipsBar.innerHTML = html;

  els.accountChipsBar.querySelectorAll("[data-account-chip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.accountChip || null;
      selectedAccountChip = key === "" ? null : key;
      holdingPage = 1;
      renderAccountChips();
      renderHoldings();
    });
  });

  const moreBtn = els.accountChipsBar.querySelector("[data-account-chip-more]");
  if (moreBtn) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const overflow = moreBtn.nextElementSibling;
      const open = !overflow.hidden;
      overflow.hidden = open;
      moreBtn.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("click", () => {
      const overflow = moreBtn.nextElementSibling;
      if (overflow) overflow.hidden = true;
    }, { once: true });
  }
}

export function filteredHoldings() {
  const state = _ctx.getState();
  const els = _ctx.els;
  const query = (els.holdingSearch?.value || "").trim().toLowerCase();
  const rows = state.holdings.filter((holding) => {
    const chipKey = `${holding.investor}|||${holding.account}`;
    const haystack = [holding.name, holding.ticker, holding.account, holding.investor, holding.strategy].join(" ").toLowerCase();
    const values = _ctx.getHoldingValues(holding);
    return (
      (!selectedAccountChip || chipKey === selectedAccountChip) &&
      (!els.investorFilter.value || holding.investor === els.investorFilter.value) &&
      (!els.strategyFilter.value || holding.strategy === els.strategyFilter.value) &&
      (!els.accountTypeFilter.value || normalizeAccountType(holding.accountType) === els.accountTypeFilter.value) &&
      (holdingScope === "all" || (holdingScope === "gain" && values.gainKrw >= 0) || (holdingScope === "loss" && values.gainKrw < 0)) &&
      (!query || haystack.includes(query))
    );
  });
  const sort = parseSortValue(els.holdingSort?.value, DEFAULT_HOLDING_SORT);
  return rows.sort((a, b) => {
    const aValues = _ctx.getHoldingValues(a);
    const bValues = _ctx.getHoldingValues(b);
    const aReturn = aValues.costKrw ? aValues.gainKrw / aValues.costKrw : 0;
    const bReturn = bValues.costKrw ? bValues.gainKrw / bValues.costKrw : 0;
    const aPriceKrw = Number(a.price || 0) * (a.currency === "USD" ? Number(state.fxRate.rate || 1) : 1);
    const bPriceKrw = Number(b.price || 0) * (b.currency === "USD" ? Number(state.fxRate.rate || 1) : 1);
    const aDailyMove = _ctx.getHoldingDailyMove(a).valueKrw;
    const bDailyMove = _ctx.getHoldingDailyMove(b).valueKrw;
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

export function renderHoldings() {
  const els = _ctx.els;
  renderAccountChips();
  const rows = filteredHoldings();
  renderHoldingsSummary(rows);
  renderHoldingsViewToggle();
  renderFilterBadge();

  const isSummary = holdingsViewMode === "summary";
  if (els.holdingsSummaryView) els.holdingsSummaryView.hidden = !isSummary;
  const tableWrap = document.querySelector(".holdings-table-wrap");
  if (tableWrap) tableWrap.hidden = isSummary;
  const paginationEl = document.querySelector("#holdingPagination");
  if (paginationEl) paginationEl.hidden = isSummary;
  const filtersEl = document.querySelector(".filters");
  if (filtersEl) filtersEl.hidden = isSummary;
  const listToolsEl = document.querySelector(".holding-list-tools");
  if (listToolsEl) listToolsEl.hidden = isSummary;

  if (isSummary) {
    renderHoldingsSummaryView(rows);
    renderHoldingScopeControls();
    return;
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / HOLDINGS_PAGE_SIZE));
  holdingPage = Math.min(Math.max(1, holdingPage), totalPages);
  const pageRows = rows.slice((holdingPage - 1) * HOLDINGS_PAGE_SIZE, holdingPage * HOLDINGS_PAGE_SIZE);
  renderHoldingScopeControls();
  renderHoldingPagination(rows.length, totalPages);
  els.holdingsBody.innerHTML = pageRows.length
    ? pageRows
    .map((holding) => {
      const values = _ctx.getHoldingValues(holding);
      const value = values.valueNative;
      const cost = values.costNative;
      const gain = values.gainNative;
      const returnRate = cost ? gain / cost : 0;
      const dailyMove = _ctx.getHoldingDailyMove(holding);
      return `<tr>
        <td data-label="투자자">${escapeHtml(holding.investor)}</td>
        <td data-label="계좌"><span class="name-cell">${escapeHtml(holding.account)}</span></td>
        <td data-label="전략"><span class="name-cell">${escapeHtml(holding.strategy)}</span></td>
        <td data-label="종목"><span class="name-cell-logo">${tickerLogoHtml(holding.ticker, holding.name, 28)}<span><strong class="name-cell">${escapeHtml(holding.name || holding.ticker)}</strong>${holding.ticker && holding.ticker !== holding.name ? `<small class="name-cell">${escapeHtml(holding.ticker)}</small>` : ""}</span></span></td>
        <td data-label="수량"><span class="amount-cell">${formatNumber(holding.quantity, 4)}</span></td>
        <td data-label="현재가"><span class="money-value">${formatMoney(holding.price, holding.currency)}</span></td>
        <td data-label="평단가"><span class="money-value">${formatMoney(holding.averageCost, holding.currency)}</span></td>
        <td data-label="평가금액"><span class="money-value">${formatMoney(value, holding.currency)}</span></td>
        <td data-label="일 영향" class="${dailyMove.valueKrw >= 0 ? "positive" : "negative"}">
          <span class="money-value">${dailyMove.hasData ? `${dailyMove.valueKrw >= 0 ? "+" : ""}${formatKrw(dailyMove.valueKrw)}` : "-"}</span>
          ${dailyMove.hasData ? `<small>${formatPercent(dailyMove.changePercent)}</small>` : ""}
        </td>
        <td data-label="손익" class="${gain >= 0 ? "positive" : "negative"}"><span class="money-value">${formatMoney(gain, holding.currency)}</span></td>
        <td data-label="수익률" class="${gain >= 0 ? "positive" : "negative"}"><span class="amount-cell">${formatPercent(returnRate)}</span></td>
        <td data-label="작업">
          ${_ctx.rowActionMenu(`${holding.name || holding.ticker} 작업`, [
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
    button.addEventListener("click", () => _ctx.cancelEdit("holding"));
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("이 보유 종목을 삭제할까요? 삭제 후에는 직접 다시 추가해야 합니다.")) {
        return;
      }
      const state = _ctx.getState();
      state.holdings = state.holdings.filter((holding) => holding.id !== button.dataset.delete);
      _ctx.saveState();
      _ctx.render();
    });
  });
}

function renderHoldingScopeControls() {
  const els = _ctx.els;
  for (const [button, scope] of [
    [els.holdingScopeAll, "all"],
    [els.holdingScopeGain, "gain"],
    [els.holdingScopeLoss, "loss"],
  ]) {
    button?.classList.toggle("is-active", holdingScope === scope);
  }
}

function renderHoldingPagination(totalRows, totalPages) {
  const els = _ctx.els;
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
  const state = _ctx.getState();
  const els = _ctx.els;
  const allCount = state.holdings.length;
  const visibleCount = rows.length;
  const latestPriceTime = state.holdings
    .map((holding) => new Date(holding.priceAsOf || 0).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  const source = state.holdings.find((holding) => new Date(holding.priceAsOf || 0).getTime() === latestPriceTime)?.priceSource || "가격 데이터";
  const values = rows.map((holding) => ({ holding, values: _ctx.getHoldingValues(holding), dailyMove: _ctx.getHoldingDailyMove(holding) }));
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
    els.holdingsSummaryValue.textContent = formatKrw(totalValue);
  }
  if (els.holdingsSummaryGain) {
    els.holdingsSummaryGain.textContent = `${totalGain >= 0 ? "+" : ""}${formatKrw(totalGain)}`;
    els.holdingsSummaryGain.className = totalGain >= 0 ? "positive" : "negative";
  }
  if (els.holdingsSummaryReturn) {
    els.holdingsSummaryReturn.textContent = formatPercent(returnRate);
  }
  if (els.holdingsSummaryDayMove) {
    els.holdingsSummaryDayMove.textContent = `${totalDayMove >= 0 ? "+" : ""}${formatKrw(totalDayMove)}`;
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

function renderFilterBadge() {
  const els = _ctx.els;
  if (!els.filterActiveBadge) return;
  const count = [els.investorFilter?.value, els.strategyFilter?.value, els.accountTypeFilter?.value].filter(Boolean).length;
  els.filterActiveBadge.textContent = String(count);
  els.filterActiveBadge.hidden = count === 0;
}

function renderHoldingsViewToggle() {
  const els = _ctx.els;
  const isSummary = holdingsViewMode === "summary";
  els.holdingsViewDetail?.classList.toggle("is-active", !isSummary);
  els.holdingsViewDetail?.setAttribute("aria-pressed", String(!isSummary));
  els.holdingsViewSummary?.classList.toggle("is-active", isSummary);
  els.holdingsViewSummary?.setAttribute("aria-pressed", String(isSummary));
}

function renderHoldingsSummaryView(rows) {
  const els = _ctx.els;
  if (!els.holdingsSummaryView) return;

  // ticker 기준으로 합산
  const byTicker = new Map();
  for (const holding of rows) {
    const key = holding.ticker || holding.name;
    const values = _ctx.getHoldingValues(holding);
    const dailyMove = _ctx.getHoldingDailyMove(holding);
    if (byTicker.has(key)) {
      const existing = byTicker.get(key);
      existing.quantity += Number(holding.quantity || 0);
      existing.valueKrw += values.valueKrw;
      existing.costKrw += values.costKrw;
      existing.gainKrw += values.gainKrw;
      existing.dayMoveKrw += dailyMove.hasData ? dailyMove.valueKrw : 0;
      existing.hasDayData = existing.hasDayData || dailyMove.hasData;
    } else {
      byTicker.set(key, {
        ticker: holding.ticker,
        name: holding.name || holding.ticker,
        quantity: Number(holding.quantity || 0),
        price: holding.price,
        currency: holding.currency,
        valueKrw: values.valueKrw,
        costKrw: values.costKrw,
        gainKrw: values.gainKrw,
        dayMoveKrw: dailyMove.hasData ? dailyMove.valueKrw : 0,
        hasDayData: dailyMove.hasData,
        changePercent: Number(holding.priceChangePercent || 0),
      });
    }
  }

  const merged = [...byTicker.values()].sort((a, b) => b.valueKrw - a.valueKrw);
  const totalValue = merged.reduce((sum, r) => sum + r.valueKrw, 0);

  if (!merged.length) {
    els.holdingsSummaryView.innerHTML = `<div class="holdings-summary-empty">조건에 맞는 종목이 없습니다</div>`;
    return;
  }

  els.holdingsSummaryView.innerHTML = merged.map((item) => {
    const returnRate = item.costKrw ? item.gainKrw / item.costKrw : 0;
    const weight = totalValue ? item.valueKrw / totalValue : 0;
    const gainPositive = item.gainKrw >= 0;
    const dayPositive = item.dayMoveKrw >= 0;
    const weightPct = Math.max(4, Math.round(weight * 100));
    return `<div class="holdings-overview-row">
      <div class="holdings-overview-bar" style="width:${weightPct}%"></div>
      <div class="holdings-overview-main">
        <div class="holdings-overview-left">
          ${tickerLogoHtml(item.ticker, item.name, 36)}
          <div class="holdings-overview-text">
            <strong class="holdings-overview-name">${escapeHtml(item.name)}</strong>
            <span class="holdings-overview-meta">${escapeHtml(item.ticker)} · ${formatNumber(item.quantity, 4)}주 · ${formatPercent(weight)}</span>
          </div>
        </div>
        <div class="holdings-overview-right">
          <strong class="holdings-overview-value">${formatKrw(item.valueKrw)}</strong>
          <span class="holdings-overview-gain ${gainPositive ? "positive" : "negative"}">${gainPositive ? "+" : ""}${formatKrw(item.gainKrw)} (${gainPositive ? "+" : ""}${formatPercent(returnRate)})</span>
          ${item.hasDayData ? `<span class="holdings-overview-day ${dayPositive ? "positive" : "negative"}">${dayPositive ? "▲" : "▼"} ${formatKrw(Math.abs(item.dayMoveKrw))}</span>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");
}

export function exportVisibleHoldings() {
  const rows = filteredHoldings();
  const header = ["투자자", "계좌", "전략", "종목명", "티커", "수량", "현재가", "평단가", "평가금액", "손익", "수익률", "통화"];
  const csvRows = rows.map((holding) => {
    const values = _ctx.getHoldingValues(holding);
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
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stocklio-holdings-${_ctx.todayKey()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  _ctx.showOperationToast("보유 종목 내보내기 완료", `${rows.length}개 종목 CSV`, "success");
}

export function renderHoldingEditRow(holding) {
  const values = _ctx.getHoldingValues(holding);
  const accountOptions = _ctx.getKnownAccounts()
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

export function holdingAccountTypeOptions(value) {
  return Object.entries(accountTypeLabels)
    .map(([optionValue, label]) => `<option value="${optionValue}" ${optionValue === value ? "selected" : ""}>${label}</option>`)
    .join("");
}

function strategyOptions(value) {
  const selected = _ctx.normalizeStrategy(value);
  const strategies = _ctx.strategyBuckets([..._ctx.getState().holdings.map((holding) => holding.strategy), selected]);
  return strategies
    .map((strategy) => `<option value="${escapeHtml(strategy)}" ${strategy === selected ? "selected" : ""}>${escapeHtml(strategy)}</option>`)
    .join("");
}

export function saveInlineHoldingEdit(id) {
  const state = _ctx.getState();
  const els = _ctx.els;
  const row = document.querySelector(`[data-save-holding="${CSS.escape(id)}"]`)?.closest("tr");
  const existingHolding = state.holdings.find((holding) => holding.id === id);
  if (!row || !existingHolding) {
    return;
  }
  const field = (name) => row.querySelector(`[data-inline-holding-field="${name}"]`)?.value || "";
  const account = _ctx.parseAccountKey(field("accountKey"));
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
          accountType: _ctx.normalizeAccountType(field("accountType")),
          strategy: _ctx.normalizeStrategy(field("strategy")),
          ticker: ticker || name,
          name,
          quantity,
          averageCost,
          currency,
        }
      : holding,
  );
  editingHoldingId = null;
  _ctx.saveState();
  _ctx.render();
  _ctx.setStatus("보유 종목 수정 완료", `${name} · ${account.account}`);
  _ctx.showOperationToast("보유 종목 수정 완료", `${name} · ${formatNumber(quantity, 4)}주`, "success");
}

export function startEditHolding(id) {
  const state = _ctx.getState();
  const holding = state.holdings.find((item) => item.id === id);
  if (!holding) {
    return;
  }
  editingHoldingId = id;
  openHoldingDrawer(holding);
  _ctx.updateEditControls();
  _ctx.setView("holdings");
  _ctx.els.holdingForm.elements.quantity.focus();
}

export function openHoldingDrawer(holding = null) {
  const els = _ctx.els;
  hideTickerSuggestions();
  els.holdingForm.reset();
  _ctx.renderAccountSelectors();
  if (holding) {
    els.holdingForm.elements.accountKey.value = accountKeyFor(holding);
    els.holdingForm.elements.accountType.value = _ctx.normalizeAccountType(holding.accountType);
    els.holdingForm.elements.strategy.value = _ctx.normalizeStrategy(holding.strategy);
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
  _ctx.updateEditControls();
  const firstField = els.holdingForm.elements.accountKey;
  window.setTimeout(() => firstField?.focus(), 80);
}

export function closeHoldingDrawer({ reset = true } = {}) {
  const els = _ctx.els;
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
    _ctx.updateEditControls();
    renderHoldings();
  }
}

export function queueTickerSearch() {
  const els = _ctx.els;
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
  const els = _ctx.els;
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

export function selectTickerSuggestion(symbol, name) {
  const els = _ctx.els;
  els.holdingForm.elements.ticker.value = symbol || "";
  els.holdingForm.elements.name.value = name || symbol || "";
  hideTickerSuggestions();
  els.holdingForm.elements.quantity.focus();
}

export function hideTickerSuggestions() {
  const els = _ctx.els;
  window.clearTimeout(tickerSearchTimer);
  tickerSearchSeq += 1;
  if (els.holdingTickerSuggestions) {
    els.holdingTickerSuggestions.hidden = true;
    els.holdingTickerSuggestions.innerHTML = "";
  }
}
