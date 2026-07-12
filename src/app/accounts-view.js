import { accountKeyFor, parseAccountKey } from "./accounts.js";
import { formatAccountType, normalizeAccountType } from "./account-types.js";
import {
  escapeHtml,
  formatKrw,
  formatMoney,
  formatPercent,
} from "./formatters.js";

let _ctx;
let expandedAccountKey = null;
let accountDrafts = {};

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
    stats.set(account.key, { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, gainKrw: 0, holdingCount: 0 });
  }
  for (const holding of state.holdings) {
    const key = accountKeyFor(holding);
    const current = stats.get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, gainKrw: 0, holdingCount: 0 };
    const values = _ctx.getHoldingValues(holding);
    current.stockValueKrw += values.valueKrw;
    current.gainKrw += values.gainKrw;
    current.holdingCount += 1;
    stats.set(key, current);
  }
  for (const cash of state.cashBalances || []) {
    const key = accountKeyFor(cash);
    const current = stats.get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, gainKrw: 0, holdingCount: 0 };
    current.cashKrw += _ctx.getCashValueKrw(cash);
    stats.set(key, current);
  }
  for (const flow of state.cashFlows || []) {
    const key = accountKeyFor(flow);
    const current = stats.get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, gainKrw: 0, holdingCount: 0 };
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
  const totalCash = [...stats.values()].reduce((sum, item) => sum + item.cashKrw, 0);
  if (els.accountOverviewCash) els.accountOverviewCash.textContent = formatKrw(totalCash);
  if (els.accountOverviewCount) els.accountOverviewCount.textContent = String(accounts.length);
  if (els.accountOverviewCountDetail) {
    const krw = accounts.filter((a) => a.baseCurrency === "KRW").length;
    const usd = accounts.filter((a) => a.baseCurrency === "USD").length;
    els.accountOverviewCountDetail.textContent = `KRW ${krw}개 · USD ${usd}개 포함`;
  }
  // 예수금 미입력 계좌 경고 카드
  const missingCard = document.getElementById("accountCashMissingCard");
  const missingCount = document.getElementById("accountCashMissingCount");
  if (missingCard && missingCount) {
    const missing = accounts.filter((a) => (stats.get(a.key)?.cashKrw ?? 0) === 0).length;
    missingCard.hidden = missing === 0;
    missingCount.textContent = `${missing}개`;
  }
}

function draftForAccount(account, stats) {
  return accountDrafts[account.key] || { currency: account.baseCurrency || "KRW", amount: "" };
}

export function toggleAccountExpand(key) {
  if (expandedAccountKey === key) {
    expandedAccountKey = null;
    renderAccounts();
    return;
  }
  const account = _ctx.getKnownAccounts().find((item) => item.key === key);
  const stats = getAccountStats().get(key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, holdingCount: 0 };
  expandedAccountKey = key;
  if (!accountDrafts[key] && account) {
    const currency = account.baseCurrency || "KRW";
    const rate = currency === "USD" ? Number(_ctx.getState().fxRate?.rate || 1) : 1;
    accountDrafts[key] = { currency, amount: rate ? Math.round((stats.cashKrw / rate) * 100) / 100 : stats.cashKrw };
  }
  renderAccounts();
}

export function setAccountDraftField(key, field, value) {
  accountDrafts[key] = { ...(accountDrafts[key] || { currency: "KRW", amount: "" }), [field]: value };
}

export function saveAccountCashDraft(key) {
  const state = _ctx.getState();
  const account = parseAccountKey(key);
  const draft = accountDrafts[key];
  if (!draft) return;
  const amount = Number(draft.amount) || 0;
  const currency = draft.currency || "KRW";
  const existing = (state.cashBalances || []).find((cash) => cash.investor === account.investor && cash.account === account.account && cash.currency === currency);
  const nextCash = {
    id: existing?.id || _ctx.makeId(),
    investor: account.investor,
    account: account.account,
    currency,
    amount,
    asOf: _ctx.todayKey(),
    source: existing ? "사용자 수정" : "사용자 입력",
  };
  state.cashBalances = existing
    ? state.cashBalances.map((cash) => (cash.id === existing.id ? nextCash : cash))
    : [...(state.cashBalances || []), nextCash];
  _ctx.saveState();
  _ctx.render();
  _ctx.setStatus("예수금 저장 완료", `${account.account} · ${formatMoney(amount, currency)}`);
  _ctx.showOperationToast("예수금 저장 완료", `${account.account} · ${formatMoney(amount, currency)}`, "success");
}

function renderAccountAccordionBody(account, stats) {
  const state = _ctx.getState();
  const holdings = state.holdings.filter((h) => h.investor === account.investor && h.account === account.account);
  const draft = draftForAccount(account, stats);
  const totalKrw = stats.stockValueKrw + stats.cashKrw;
  const stockRatio = totalKrw ? stats.stockValueKrw / totalKrw : 0;
  const cashRatio = totalKrw ? stats.cashKrw / totalKrw : 0;
  const holdingRows = holdings.map((h) => {
    const values = _ctx.getHoldingValues(h);
    return `<li><span>${escapeHtml(h.name || h.ticker)}<small>${escapeHtml(h.ticker)}</small></span><strong>${formatKrw(values.valueKrw)}</strong></li>`;
  }).join("");
  return `<div class="account-accordion-body">
    <div class="account-cash-form-row">
      <label>통화
        <select data-account-draft-field="currency" data-account-key="${escapeHtml(account.key)}">
          <option value="KRW" ${draft.currency === "KRW" ? "selected" : ""}>KRW</option>
          <option value="USD" ${draft.currency === "USD" ? "selected" : ""}>USD</option>
        </select>
      </label>
      <label>예수금
        <input data-account-draft-field="amount" data-account-key="${escapeHtml(account.key)}" type="number" step="0.01" placeholder="0" value="${escapeHtml(draft.amount ?? "")}">
      </label>
      <button type="button" data-save-account-cash="${escapeHtml(account.key)}">예수금 저장</button>
    </div>
    <div class="account-accordion-columns">
      <div>
        <div class="section-badge">보유 종목 (${holdings.length})</div>
        <ul class="detail-list">${holdingRows || "<li>보유 종목 없음</li>"}</ul>
      </div>
      <div>
        <div class="section-badge">구성 비중</div>
        <div class="composition-row"><span>주식</span><strong>${formatPercent(stockRatio)}</strong></div>
        <div class="composition-bar"><span style="width:${Math.max(0, stockRatio * 100)}%"></span></div>
        <div class="composition-row"><span>예수금</span><strong>${formatPercent(cashRatio)}</strong></div>
        <div class="composition-bar muted"><span style="width:${Math.max(0, cashRatio * 100)}%"></span></div>
      </div>
    </div>
  </div>`;
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
        const stats = accountStats.get(account.key) || { stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, gainKrw: 0, holdingCount: 0 };
        const deleteLabel = inUse ? "사용 중인 계좌라 삭제할 수 없습니다" : "계좌 삭제";
        const isExpanded = expandedAccountKey === account.key;
        const totalKrw = stats.stockValueKrw + stats.cashKrw;
        const gainClass = stats.gainKrw >= 0 ? "positive" : "negative";
        const gainSign = stats.gainKrw >= 0 ? "+" : "";
        return `<div class="account-list-row-wrap ${isExpanded ? "is-expanded" : ""}">
          <div class="account-list-row" role="button" tabindex="0" data-toggle-account="${escapeHtml(account.key)}">
            <div>
              <strong>${escapeHtml(account.account)}</strong>
              <small>${escapeHtml(account.investor)} · ${escapeHtml(account.provider || "기관 미지정")} · ${formatAccountType(account.accountType)} · ${escapeHtml(account.baseCurrency || "KRW")}</small>
            </div>
            <div class="account-row-totals">
              <strong>${formatKrw(totalKrw)}</strong>
              <small class="${gainClass}">${gainSign}${formatKrw(stats.gainKrw)}</small>
            </div>
            <div class="account-row-menu" onclick="event.stopPropagation()">${rowActionMenu(`계좌 ${account.account} 작업`, [
              `<button type="button" data-edit-account="${account.id}">수정</button>`,
              `<button class="row-menu-danger" type="button" data-delete-account="${account.id}" ${inUse ? "disabled" : ""} title="${deleteLabel}">삭제</button>`,
            ])}</div>
            <span class="account-row-chevron" aria-hidden="true">${isExpanded ? "▲" : "▼"}</span>
          </div>
          ${isExpanded ? renderAccountAccordionBody(account, stats) : ""}
        </div>`;
      }).join("")
    : `<div class="empty-state">등록된 계좌가 없습니다</div>`;

  document.querySelectorAll("[data-toggle-account]").forEach((button) => {
    const toggle = () => toggleAccountExpand(button.dataset.toggleAccount);
    button.addEventListener("click", toggle);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
    });
  });

  document.querySelectorAll("[data-account-draft-field]").forEach((field) => {
    const key = field.dataset.accountKey;
    field.addEventListener(field.tagName === "SELECT" ? "change" : "input", () => {
      setAccountDraftField(key, field.dataset.accountDraftField, field.value);
    });
  });

  document.querySelectorAll("[data-save-account-cash]").forEach((button) => {
    button.addEventListener("click", () => saveAccountCashDraft(button.dataset.saveAccountCash));
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
  _ctx.setView("automation");
  els.accountForm.scrollIntoView({ block: "center" });
}
