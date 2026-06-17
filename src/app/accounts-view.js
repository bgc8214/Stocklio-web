import { accountKeyFor, parseAccountKey } from "./accounts.js";
import { formatAccountType, normalizeAccountType } from "./account-types.js";
import {
  escapeHtml,
  formatAsOf,
  formatCompactKrw,
  formatKrw,
  formatMoney,
  formatNumber,
  formatPercent,
} from "./formatters.js";

let _ctx;

export function init(ctx) {
  _ctx = ctx;
}

export function rowActionMenu(label, actions) {
  return `<details class="row-menu">
    <summary aria-label="${escapeHtml(label)}" title="작업 더보기">⋮</summary>
    <div class="row-menu-popover">${actions.join("")}</div>
  </details>`;
}

export function getAccountStats() {
  const state = _ctx.getState();
  const stats = new Map();
  for (const account of _ctx.getKnownAccounts()) {
    stats.set(account.key, { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 });
  }
  for (const holding of state.holdings) {
    const key = accountKeyFor(holding);
    const current = stats.get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 };
    current.stockValueKrw += _ctx.getHoldingValues(holding).valueKrw;
    current.holdingCount += 1;
    stats.set(key, current);
  }
  for (const cash of state.cashBalances || []) {
    const key = accountKeyFor(cash);
    const current = stats.get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 };
    current.cashKrw += _ctx.getCashValueKrw(cash);
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

export function getFilteredAccounts() {
  const els = _ctx.els;
  const query = (els.accountSearch?.value || "").trim().toLowerCase();
  const investor = els.accountInvestorFilter?.value || "";
  const currency = els.accountCurrencyFilter?.value || "";
  return _ctx.getKnownAccounts().filter((account) => {
    const haystack = [account.account, account.investor, account.provider, formatAccountType(account.accountType), account.baseCurrency].join(" ").toLowerCase();
    return (!investor || account.investor === investor) && (!currency || account.baseCurrency === currency) && (!query || haystack.includes(query));
  });
}

export function renderAccountOverview() {
  const els = _ctx.els;
  const stats = getAccountStats();
  const accounts = _ctx.getKnownAccounts();
  const totalStock = [...stats.values()].reduce((sum, item) => sum + item.stockValueKrw, 0);
  const totalCash = [...stats.values()].reduce((sum, item) => sum + item.cashKrw, 0);
  if (els.accountOverviewTotal) els.accountOverviewTotal.textContent = formatKrw(totalStock + totalCash);
  if (els.accountOverviewStocks) els.accountOverviewStocks.textContent = formatKrw(totalStock);
  if (els.accountOverviewCash) els.accountOverviewCash.textContent = formatKrw(totalCash);
  if (els.accountOverviewCount) els.accountOverviewCount.textContent = String(accounts.length);
  if (els.accountOverviewCountDetail) {
    const krw = accounts.filter((a) => a.baseCurrency === "KRW").length;
    const usd = accounts.filter((a) => a.baseCurrency === "USD").length;
    els.accountOverviewCountDetail.textContent = `KRW ${krw}개 · USD ${usd}개 포함`;
  }
}

export function renderAccountSummary() {
  const els = _ctx.els;
  const grouped = _ctx.groupByAccount(_ctx.getState().holdings);
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

export function renderCashSelectedPreview() {
  const els = _ctx.els;
  if (!els.cashSelectedPreview) return;
  const selected = els.cashBalanceForm.elements.accountKey.value;
  const account = selected ? parseAccountKey(selected) : null;
  const amount = Number(els.cashBalanceForm.elements.amount.value || 0);
  const currency = els.cashBalanceForm.elements.currency.value || "KRW";
  const rate = currency === "USD" ? Number(_ctx.getState().fxRate?.rate || 1) : 1;
  const stats = selected ? getAccountStats().get(selected) : null;
  const existingCashRows = selected
    ? (_ctx.getState().cashBalances || []).filter((cash) => cash.investor === account.investor && cash.account === account.account && cash.currency === currency)
    : [];
  const existingSameCurrencyKrw = existingCashRows.reduce((sum, cash) => sum + _ctx.getCashValueKrw(cash), 0);
  const nextCashKrw = Math.max(0, amount * rate);
  const baseTotal = stats ? stats.stockValueKrw + stats.cashKrw - existingSameCurrencyKrw : 0;
  const previewTotal = selected ? baseTotal + nextCashKrw : 0;
  els.cashSelectedPreview.innerHTML = selected
    ? `<span>저장 후 선택 계좌 총자산</span><strong>${formatKrw(previewTotal)}</strong><small>${account.account} · ${currency} 예수금 ${formatMoney(amount, currency)}</small>`
    : `<span>저장 후 선택 계좌 총자산</span><strong>-</strong><small>계좌를 선택하면 미리 계산합니다</small>`;
}

export function syncCashFormToSelectedAccount() {
  const els = _ctx.els;
  const selected = els.accountDetailSelect.value;
  if (selected && [...els.cashBalanceForm.elements.accountKey.options].some((o) => o.value === selected)) {
    els.cashBalanceForm.elements.accountKey.value = selected;
  }
  renderCashSelectedPreview();
}

export function renderAccountDetail() {
  const els = _ctx.els;
  const state = _ctx.getState();
  const selected = els.accountDetailSelect.value;
  if (!selected) {
    if (els.accountDetailSubtitle) els.accountDetailSubtitle.textContent = "계좌를 선택해 상세를 확인합니다";
    if (els.accountDetailType) els.accountDetailType.textContent = "-";
    if (els.accountSummary) els.accountSummary.innerHTML = "";
    if (els.accountComposition) els.accountComposition.innerHTML = `<div class="empty-state">계좌를 선택하면 구성이 표시됩니다</div>`;
    els.accountDetail.innerHTML = `<div class="empty-state">계좌를 선택하면 보유 종목, 예수금, 현금흐름을 한 번에 볼 수 있습니다</div>`;
    renderCashSelectedPreview();
    return;
  }
  const account = parseAccountKey(selected);
  const accountInfo = _ctx.getKnownAccounts().find((item) => item.key === selected);
  const holdings = state.holdings.filter((h) => h.investor === account.investor && h.account === account.account);
  const cashBalances = (state.cashBalances || []).filter((c) => c.investor === account.investor && c.account === account.account);
  const flows = (state.cashFlows || []).filter((f) => f.investor === account.investor && f.account === account.account).slice(-6).reverse();
  const stockValueKrw = holdings.reduce((sum, h) => sum + _ctx.getHoldingValues(h).valueKrw, 0);
  const cashKrw = cashBalances.reduce((sum, c) => sum + _ctx.getCashValueKrw(c), 0);
  const totalKrw = stockValueKrw + cashKrw;
  const stockRatio = totalKrw ? stockValueKrw / totalKrw : 0;
  const cashRatio = totalKrw ? cashKrw / totalKrw : 0;
  if (els.accountDetailSubtitle) els.accountDetailSubtitle.textContent = `${account.account} · ${account.investor} · ${accountInfo?.provider || "기관 미지정"}`;
  if (els.accountDetailType) els.accountDetailType.textContent = formatAccountType(accountInfo?.accountType);
  if (els.accountCompositionCurrency) els.accountCompositionCurrency.textContent = accountInfo?.baseCurrency || "KRW";
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
  const holdingRows = holdings.map((h) => {
    const values = _ctx.getHoldingValues(h);
    return `<li><span>${escapeHtml(h.name || h.ticker)}<small>${escapeHtml(h.ticker)}</small></span><strong>${formatKrw(values.valueKrw)}</strong></li>`;
  }).join("");
  const cashRows = cashBalances.map((c) => `<li><span>${escapeHtml(c.currency)} 예수금<small>${escapeHtml(c.source || "")}</small></span><strong>${formatMoney(c.amount, c.currency)}</strong></li>`).join("");
  const flowRows = flows.map((f) => `<li><span>${escapeHtml(f.date)} · ${_ctx.formatFlowType(f.type)}<small>${escapeHtml(f.note || "")}</small></span><strong>${formatKrw(f.amountKrw)}</strong></li>`).join("");
  els.accountDetail.innerHTML = `
    <div class="detail-block"><h3>보유 종목</h3><ul>${holdingRows || "<li>보유 종목 없음</li>"}</ul></div>
    <div class="detail-block"><h3>예수금</h3><ul>${cashRows || "<li>예수금 없음</li>"}</ul></div>
    <div class="detail-block"><h3>최근 현금흐름</h3><ul>${flowRows || "<li>현금흐름 없음</li>"}</ul></div>
  `;
  renderCashSelectedPreview();
}

export function renderAccounts() {
  const els = _ctx.els;
  const state = _ctx.getState();
  const accounts = getFilteredAccounts();
  renderAccountOverview();
  const accountStats = getAccountStats();
  if (els.accountListCount) els.accountListCount.textContent = `${accounts.length}개 계좌`;
  els.accountList.innerHTML = accounts.length
    ? accounts.map((account) => {
        const inUse = _ctx.isAccountInUse(account);
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
      }).join("")
    : `<div class="empty-state">등록된 계좌가 없습니다</div>`;

  document.querySelectorAll("[data-select-account]").forEach((button) => {
    const select = () => {
      els.accountDetailSelect.value = button.dataset.selectAccount;
      syncCashFormToSelectedAccount();
      renderAccounts();
      renderAccountDetail();
      _ctx.renderCashBalances();
    };
    button.addEventListener("click", select);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
    });
  });

  document.querySelectorAll("[data-edit-account]").forEach((button) => {
    button.addEventListener("click", () => _ctx.startEditAccount(button.dataset.editAccount));
  });
  document.querySelectorAll("[data-delete-account]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("이 계좌를 삭제할까요? 보유 종목이나 예수금에 연결된 계좌는 삭제할 수 없습니다.")) return;
      _ctx.getState().accounts = state.accounts.filter((a) => a.id !== button.dataset.deleteAccount);
      _ctx.saveState();
      _ctx.render();
    });
  });
}

export function startEditAccount(id) {
  const els = _ctx.els;
  const state = _ctx.getState();
  const account = state.accounts.find((item) => item.id === id) || _ctx.getKnownAccounts().find((item) => item.id === id);
  if (!account) return;
  _ctx.setEditingAccountId(id);
  els.accountForm.hidden = false;
  els.accountForm.elements.investor.value = account.investor || "";
  els.accountForm.elements.account.value = account.account || "";
  els.accountForm.elements.provider.value = account.provider || "";
  els.accountForm.elements.accountType.value = normalizeAccountType(account.accountType);
  els.accountForm.elements.baseCurrency.value = account.baseCurrency || "KRW";
  _ctx.updateEditControls();
  _ctx.setView("accounts");
  els.accountForm.scrollIntoView({ block: "center" });
}
