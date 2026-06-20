import { accountKeyFor, parseAccountKey } from "./accounts.js";
import { accountTypeLabels } from "./account-types.js";
import {
  escapeHtml,
  formatKrw,
  formatMoney,
} from "./formatters.js";
import { DEFAULT_CASH_FLOW_SORT } from "./constants.js";
import { parseSortValue } from "./sort.js";

let _ctx;

// 모듈 내부 상태
let editingCashFlowId = null;
let editingCashBalanceId = null;

export function init(ctx) {
  _ctx = ctx;
}

export function getEditingCashFlowId() {
  return editingCashFlowId;
}

export function setEditingCashFlowId(id) {
  editingCashFlowId = id;
}

export function getEditingCashBalanceId() {
  return editingCashBalanceId;
}

export function setEditingCashBalanceId(id) {
  editingCashBalanceId = id;
}

export function formatFlowType(type) {
  return {
    deposit: "입금",
    withdrawal: "출금",
    dividend: "배당",
    tax: "세금",
    fee: "수수료",
  }[type] || type || "";
}

export function currencyOptions(value) {
  return ["KRW", "USD"]
    .map((currency) => `<option value="${currency}" ${currency === value ? "selected" : ""}>${currency}</option>`)
    .join("");
}

export function cashFlowTypeOptions(value) {
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

export function renderCashBalances() {
  const state = _ctx.getState();
  const els = _ctx.els;
  renderUnclassifiedCashAllocation();
  _ctx.renderCashSelectedPreview();
  const rows = [...(state.cashBalances || [])].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
  els.cashBalanceList.innerHTML = rows.length
    ? rows
        .map((cash) => editingCashBalanceId === cash.id ? renderCashBalanceEditRow(cash) : `<div class="cash-balance-row">
          <span>
            <strong>${escapeHtml(cash.account)}</strong>
            <small>${escapeHtml(cash.investor)} · ${escapeHtml(cash.source || "직접 입력")}</small>
          </span>
          <strong>${formatMoney(cash.amount, cash.currency)}</strong>
          ${_ctx.rowActionMenu(`${cash.account} 예수금 작업`, [
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
    button.addEventListener("click", () => _ctx.cancelEdit("cashBalance"));
  });

  document.querySelectorAll("[data-delete-cash]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("이 예수금 기록을 삭제할까요?")) {
        return;
      }
      const state = _ctx.getState();
      state.cashBalances = state.cashBalances.filter((cash) => cash.id !== button.dataset.deleteCash);
      _ctx.saveState();
      _ctx.render();
    });
  });
}

function renderCashBalanceEditRow(cash) {
  const accountOptions = _ctx.getKnownAccounts()
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
  const els = _ctx.els;
  const unclassified = _ctx.getUnclassifiedCashBalances();
  const total = unclassified.reduce((sum, cash) => sum + Number(cash.amount || 0), 0);
  const accounts = _ctx.getKnownAccounts();
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

export function allocateUnclassifiedCash({ investor, account, amount }) {
  const state = _ctx.getState();
  let remaining = Math.max(0, Number(amount || 0));
  let allocated = 0;
  const nextCashBalances = [];
  for (const cash of state.cashBalances || []) {
    if (!_ctx.isUnclassifiedCash(cash) || remaining <= 0) {
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
      id: _ctx.makeId(),
      investor,
      account,
      currency: "KRW",
      amount: allocated,
      asOf: _ctx.todayKey(),
      source: "미분류 예수금 배분",
    });
  }
  state.cashBalances = nextCashBalances;
  return allocated;
}

export function renderDividendChart() {
  const el = document.getElementById("dividendChartContent");
  if (!el) return;
  const state = _ctx.getState();
  const dividends = (state.cashFlows || []).filter(f => f.type === "dividend");
  if (!dividends.length) {
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">🌱</span><strong>배당 기록이 없습니다</strong><span>입출금 탭에서 배당 수령을 기록하면 차트가 채워집니다</span></div>`;
    return;
  }
  // 월별 집계
  const byMonth = {};
  for (const f of dividends) {
    const ym = f.date?.slice(0, 7) || "unknown";
    byMonth[ym] = (byMonth[ym] || 0) + Number(f.amountKrw || 0);
  }
  const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  if (!sorted.length) { el.innerHTML = `<div class="empty-state"><span>집계할 배당 데이터가 없습니다</span></div>`; return; }
  const maxVal = Math.max(...sorted.map(([, v]) => v));
  const totalAnnual = sorted.reduce((s, [, v]) => s + v, 0);
  const avgMonthly = Math.round(totalAnnual / sorted.length);
  el.innerHTML = `
    <div class="dividend-summary">
      <span>최근 ${sorted.length}개월 합계 <strong>${formatKrw(totalAnnual)}</strong></span>
      <span>월 평균 <strong>${formatKrw(avgMonthly)}</strong></span>
    </div>
    <div class="dividend-bars">
      ${sorted.map(([ym, val]) => `
        <div class="dividend-bar-wrap">
          <div class="dividend-bar" style="height:${Math.max(4, Math.round((val / maxVal) * 80))}px" title="${formatKrw(val)}"></div>
          <span class="dividend-bar-label">${ym.slice(5)}</span>
        </div>`).join("")}
    </div>`;
}

export function renderCashFlows() {
  const state = _ctx.getState();
  const els = _ctx.els;
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
      <td data-label="날짜">${escapeHtml(flow.date)}</td>
      <td data-label="투자자">${escapeHtml(flow.investor)}</td>
      <td data-label="계좌">${escapeHtml(flow.account)}</td>
      <td data-label="유형">${formatFlowType(flow.type)}</td>
      <td data-label="금액"><span class="money-value">${formatKrw(flow.amountKrw)}</span></td>
      <td data-label="메모">${escapeHtml(flow.note || "")}</td>
      <td data-label="작업">
        ${_ctx.rowActionMenu(`${flow.date} 입출금 작업`, [
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
    button.addEventListener("click", () => _ctx.cancelEdit("cashFlow"));
  });

  document.querySelectorAll("[data-delete-flow]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("이 입출금 기록을 삭제할까요? 성과 계산에도 반영됩니다.")) {
        return;
      }
      const state = _ctx.getState();
      state.cashFlows = state.cashFlows.filter((flow) => flow.id !== button.dataset.deleteFlow);
      _ctx.saveState();
      _ctx.render();
    });
  });
}

function renderCashFlowEditRow(flow) {
  const accountOptions = _ctx.getKnownAccounts()
    .map((account) => `<option value="${escapeHtml(account.key)}" ${account.key === accountKeyFor(flow) ? "selected" : ""}>${escapeHtml(account.investor)} · ${escapeHtml(account.account)}</option>`)
    .join("");
  return `<tr class="is-editing-row">
    <td data-label="날짜"><input data-inline-flow-field="date" type="date" value="${escapeHtml(flow.date || _ctx.todayKey())}" aria-label="날짜"></td>
    <td data-label="계좌" colspan="2">
      <select data-inline-flow-field="accountKey" aria-label="계좌">${accountOptions}</select>
    </td>
    <td data-label="유형"><select data-inline-flow-field="type" aria-label="유형">${cashFlowTypeOptions(flow.type)}</select></td>
    <td data-label="금액"><input data-inline-flow-field="amountKrw" type="number" step="1" min="0" value="${escapeHtml(flow.amountKrw ?? "")}" aria-label="금액 KRW"></td>
    <td data-label="메모"><input data-inline-flow-field="note" value="${escapeHtml(flow.note || "")}" placeholder="메모" aria-label="메모"></td>
    <td data-label="작업">
      <div class="row-actions">
        <button class="secondary small-button" type="button" data-save-flow="${flow.id}">저장</button>
        <button class="ghost small-button" type="button" data-cancel-flow-edit>취소</button>
        <button class="icon-danger" type="button" data-delete-flow="${flow.id}" aria-label="입출금 기록 삭제">×</button>
      </div>
    </td>
  </tr>`;
}

export function saveInlineCashBalanceEdit(id) {
  const state = _ctx.getState();
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
    asOf: _ctx.todayKey(),
    source: "사용자 수정",
  };
  state.cashBalances = state.cashBalances.map((cash) => (cash.id === id ? nextCash : cash));
  editingCashBalanceId = null;
  _ctx.saveState();
  _ctx.render();
  _ctx.setStatus("예수금 수정 완료", `${nextCash.account} · ${formatMoney(nextCash.amount, nextCash.currency)}`);
  _ctx.showOperationToast("예수금 수정 완료", `${nextCash.account} · ${formatMoney(nextCash.amount, nextCash.currency)}`, "success");
}

export function saveInlineCashFlowEdit(id) {
  const state = _ctx.getState();
  const row = document.querySelector(`[data-save-flow="${CSS.escape(id)}"]`)?.closest("tr");
  const existingFlow = state.cashFlows.find((flow) => flow.id === id);
  if (!row || !existingFlow) {
    return;
  }
  const field = (name) => row.querySelector(`[data-inline-flow-field="${name}"]`)?.value || "";
  const account = parseAccountKey(field("accountKey"));
  const nextFlow = {
    ...existingFlow,
    date: field("date") || _ctx.todayKey(),
    investor: account.investor,
    account: account.account,
    type: field("type"),
    amountKrw: Number(field("amountKrw")),
    note: field("note").trim(),
  };
  state.cashFlows = state.cashFlows.map((flow) => (flow.id === id ? nextFlow : flow));
  editingCashFlowId = null;
  _ctx.saveState();
  _ctx.render();
  _ctx.setStatus("입출금 수정 완료", `${formatFlowType(nextFlow.type)} · ${formatKrw(nextFlow.amountKrw)}`);
  _ctx.showOperationToast("입출금 수정 완료", `${nextFlow.date} · ${formatKrw(nextFlow.amountKrw)}`, "success");
}

export function startEditCashFlow(id) {
  const state = _ctx.getState();
  const flow = state.cashFlows.find((item) => item.id === id);
  if (!flow) {
    return;
  }
  editingCashFlowId = id;
  _ctx.updateEditControls();
  renderCashFlows();
  const row = document.querySelector(`[data-save-flow="${CSS.escape(id)}"]`)?.closest("tr");
  row?.scrollIntoView({ block: "center", behavior: "smooth" });
  row?.querySelector("[data-inline-flow-field='amountKrw']")?.focus();
}

export function startEditCashBalance(id) {
  const state = _ctx.getState();
  const cash = (state.cashBalances || []).find((item) => item.id === id);
  if (!cash) {
    return;
  }
  editingCashBalanceId = id;
  _ctx.updateEditControls();
  renderCashBalances();
  const row = document.querySelector(`[data-save-cash="${CSS.escape(id)}"]`)?.closest(".detail-row");
  row?.scrollIntoView({ block: "center", behavior: "smooth" });
  row?.querySelector("[data-inline-cash-field='amount']")?.focus();
}
