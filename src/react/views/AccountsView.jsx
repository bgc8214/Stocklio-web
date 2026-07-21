import React, { useMemo, useState } from "react";
import { useStore } from "../store/useStore.js";
import { getKnownAccounts, getAccountStats, isAccountInUse, holdingValues, fxOf } from "../store/selectors.js";
import { mutate, makeId, todayKey, setStatus, showToast } from "../store/mutations.js";
import { accountKeyFor, parseAccountKey, isUnclassifiedCash, renameAccountReferences } from "../../app/accounts.js";
import { formatAccountType, normalizeAccountType } from "../../app/account-types.js";
import { formatKrw, formatMoney, formatPercent } from "../../app/formatters.js";

const empty = () => ({ stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, gainKrw: 0, holdingCount: 0 });

export function AccountsView() {
  const state = useStore((s) => s.portfolio);
  const [search, setSearch] = useState("");
  const [investorFilter, setInvestorFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [expandedKey, setExpandedKey] = useState(null);
  const [cashDrafts, setCashDrafts] = useState({}); // key -> {currency, amount}
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [allocAmount, setAllocAmount] = useState("");
  const [allocTarget, setAllocTarget] = useState("");

  const accounts = useMemo(() => getKnownAccounts(state), [state]);
  const stats = useMemo(() => getAccountStats(state), [state]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const haystack = [account.account, account.investor, account.provider, formatAccountType(account.accountType), account.baseCurrency]
        .join(" ").toLowerCase();
      return (!investorFilter || account.investor === investorFilter) &&
        (!currencyFilter || account.baseCurrency === currencyFilter) &&
        (!query || haystack.includes(query));
    });
  }, [accounts, search, investorFilter, currencyFilter]);

  const investors = useMemo(() => [...new Set(accounts.map((a) => a.investor).filter(Boolean))].sort(), [accounts]);
  const totalCash = [...stats.values()].reduce((sum, item) => sum + item.cashKrw, 0);
  const krwCount = accounts.filter((a) => a.baseCurrency === "KRW").length;
  const usdCount = accounts.filter((a) => a.baseCurrency === "USD").length;
  const missingCount = accounts.filter((a) => (stats.get(a.key)?.cashKrw ?? 0) === 0).length;

  // 미분류 예수금 배분
  const unclassified = (state?.cashBalances || []).filter(isUnclassifiedCash);
  const unclassifiedTotal = unclassified.reduce((sum, cash) => sum + Number(cash.amount || 0), 0);
  const showAllocation = unclassifiedTotal > 0 && accounts.length > 0;

  const toggleExpand = (account) => {
    if (expandedKey === account.key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(account.key);
    if (!cashDrafts[account.key]) {
      const st = stats.get(account.key) || empty();
      const currency = account.baseCurrency || "KRW";
      const rate = currency === "USD" ? fxOf(state) : 1;
      setCashDrafts((prev) => ({
        ...prev,
        [account.key]: { currency, amount: rate ? Math.round((st.cashKrw / rate) * 100) / 100 : st.cashKrw },
      }));
    }
  };

  const setDraft = (key, field, value) =>
    setCashDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || { currency: "KRW", amount: "" }), [field]: value } }));

  const saveCash = (key) => {
    const account = parseAccountKey(key);
    const draft = cashDrafts[key];
    if (!draft) return;
    const amount = Number(draft.amount) || 0;
    const currency = draft.currency || "KRW";
    mutate((st) => {
      const existing = (st.cashBalances || []).find((c) => c.investor === account.investor && c.account === account.account && c.currency === currency);
      const nextCash = {
        id: existing?.id || makeId(),
        investor: account.investor,
        account: account.account,
        currency,
        amount,
        asOf: todayKey(),
        source: existing ? "사용자 수정" : "사용자 입력",
      };
      st.cashBalances = existing
        ? st.cashBalances.map((c) => (c.id === existing.id ? nextCash : c))
        : [...(st.cashBalances || []), nextCash];
      return st;
    });
    setStatus("예수금 저장 완료", `${account.account} · ${formatMoney(amount, currency)}`);
    showToast("예수금 저장 완료", `${account.account} · ${formatMoney(amount, currency)}`, "success");
  };

  const deleteAccount = (id) => {
    if (!window.confirm("이 계좌를 삭제할까요? 보유 종목이나 예수금에 연결된 계좌는 삭제할 수 없습니다.")) return;
    mutate((st) => {
      st.accounts = (st.accounts || []).filter((a) => a.id !== id);
      return st;
    });
  };

  const startEdit = (account) => {
    setEditingId(account.id);
    setFormOpen(true);
  };

  const submitAccountForm = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextAccount = {
      id: editingId || makeId(),
      investor: String(form.get("investor")).trim(),
      account: String(form.get("account")).trim(),
      provider: String(form.get("provider")).trim(),
      accountType: normalizeAccountType(String(form.get("accountType"))),
      baseCurrency: String(form.get("baseCurrency")),
    };
    mutate((st) => {
      if (editingId) {
        const previous = (st.accounts || []).find((a) => a.id === editingId) || accounts.find((a) => a.id === editingId);
        const hasPersisted = (st.accounts || []).some((a) => a.id === editingId);
        st.accounts = hasPersisted
          ? st.accounts.map((a) => (a.id === editingId ? nextAccount : a))
          : [...(st.accounts || []), nextAccount];
        if (previous) {
          st = renameAccountReferences(st, previous, nextAccount);
        }
      } else {
        st.accounts = [...(st.accounts || []), nextAccount];
      }
      return st;
    });
    setEditingId(null);
    setFormOpen(false);
  };

  const submitAllocation = (event) => {
    event.preventDefault();
    const [investor, account] = String(allocTarget).split("|||");
    if (!investor) return;
    const amount = Number(allocAmount);
    let allocated = 0;
    mutate((st) => {
      let remaining = Math.max(0, amount);
      const next = [];
      for (const cash of st.cashBalances || []) {
        if (!isUnclassifiedCash(cash) || remaining <= 0) {
          next.push(cash);
          continue;
        }
        const sourceAmount = Number(cash.amount || 0);
        const moveAmount = Math.min(sourceAmount, remaining);
        allocated += moveAmount;
        remaining -= moveAmount;
        const leftover = sourceAmount - moveAmount;
        if (leftover > 0.01) next.push({ ...cash, amount: leftover });
      }
      if (allocated > 0) {
        next.push({ id: makeId(), investor, account, currency: "KRW", amount: allocated, asOf: todayKey(), source: "미분류 예수금 배분" });
      }
      st.cashBalances = next;
      return st;
    });
    setAllocAmount("");
    setStatus("미분류 예수금 배분", `${investor} · ${account}에 ${formatKrw(allocated)} 반영`);
  };

  const editingAccount = editingId ? accounts.find((a) => a.id === editingId) : null;

  return (
    <section className="accounts-view" data-view="accounts">
      <div className="account-page-heading">
        <div>
          <strong>계좌</strong>
          <span>예수금을 선택해 업데이트하세요</span>
        </div>
        <span className="status-pill">총자산에 예수금 포함</span>
        <div className="account-page-actions">
          <button
            className="secondary small-button"
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormOpen(true);
            }}
          >
            계좌 추가
          </button>
        </div>
      </div>

      {formOpen ? (
        <div className="panel account-form-panel">
          <div className="section-heading">
            <h2>{editingId ? "계좌 수정" : "계좌 추가"}</h2>
            <span>계좌 추가, 수정, 삭제</span>
          </div>
          <form className="account-form inline-create-panel" onSubmit={submitAccountForm}>
            <input name="investor" placeholder="투자자" required defaultValue={editingAccount?.investor || ""} />
            <input name="account" placeholder="계좌명" required defaultValue={editingAccount?.account || ""} />
            <input name="provider" placeholder="증권사/기관" defaultValue={editingAccount?.provider || ""} />
            <select name="accountType" required defaultValue={normalizeAccountType(editingAccount?.accountType)}>
              <option value="direct_investment">직접투자 계좌</option>
              <option value="pension">연금 계좌</option>
            </select>
            <select name="baseCurrency" required defaultValue={editingAccount?.baseCurrency || "KRW"}>
              <option value="KRW">KRW</option>
              <option value="USD">USD</option>
            </select>
            <button type="submit">{editingId ? "수정 저장" : "계좌 저장"}</button>
            <button className="ghost" type="button" onClick={() => { setFormOpen(false); setEditingId(null); }}>취소</button>
          </form>
        </div>
      ) : null}

      <div className="account-overview-grid" aria-label="계좌 요약">
        <article className="account-overview-card">
          <span>예수금</span>
          <strong>{formatKrw(totalCash)}</strong>
          <small>KRW 환산 기준</small>
        </article>
        <article className="account-overview-card">
          <span>추적 계좌</span>
          <strong>{accounts.length}</strong>
          <small>KRW {krwCount}개 · USD {usdCount}개 포함</small>
        </article>
        {missingCount > 0 ? (
          <article className="account-overview-card account-overview-card--alert">
            <span>예수금 미입력</span>
            <strong>{missingCount}개</strong>
            <small>업데이트가 필요한 계좌</small>
          </article>
        ) : null}
      </div>

      <div className="panel account-list-panel">
        <div className="section-heading">
          <div>
            <h2>계좌 목록</h2>
            <span>계좌를 클릭하면 그 자리에서 예수금과 보유 종목을 바로 편집할 수 있어요.</span>
          </div>
          <span className="status-pill">{filtered.length}개 계좌</span>
        </div>
        <div className="account-filters">
          <select aria-label="계좌 투자자 필터" value={investorFilter} onChange={(e) => setInvestorFilter(e.target.value)}>
            <option value="">모든 투자자</option>
            {investors.map((inv) => <option key={inv} value={inv}>{inv}</option>)}
          </select>
          <select aria-label="계좌 통화 필터" value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}>
            <option value="">모든 통화</option>
            <option value="KRW">KRW</option>
            <option value="USD">USD</option>
          </select>
          <input type="search" placeholder="계좌명/증권사 검색" aria-label="계좌 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {showAllocation ? (
          <div className="allocation-box">
            <div className="section-heading compact-heading">
              <h2>미분류 예수금 배분</h2>
              <span>{formatKrw(unclassifiedTotal)} 배분 가능</span>
            </div>
            <form className="cash-allocation-form" onSubmit={submitAllocation}>
              <select aria-label="배분할 계좌" required value={allocTarget} onChange={(e) => setAllocTarget(e.target.value)}>
                <option value="">계좌 선택</option>
                {accounts.map((a) => (
                  <option key={a.key} value={`${a.investor}|||${a.account}`}>{a.investor} · {a.account}</option>
                ))}
              </select>
              <input
                type="number" step="0.01" min="0.01" max={unclassifiedTotal} required
                placeholder={`최대 ${formatKrw(unclassifiedTotal)}`}
                value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)}
              />
              <button type="submit">계좌로 배분</button>
            </form>
          </div>
        ) : null}

        <div className="account-list">
          {filtered.length ? filtered.map((account) => {
            const st = stats.get(account.key) || empty();
            const inUse = isAccountInUse(state, account);
            const isExpanded = expandedKey === account.key;
            const totalKrw = st.stockValueKrw + st.cashKrw;
            const gainClass = st.gainKrw >= 0 ? "positive" : "negative";
            const gainSign = st.gainKrw >= 0 ? "+" : "";
            return (
              <div className={`account-list-row-wrap${isExpanded ? " is-expanded" : ""}`} key={account.key}>
                <div
                  className="account-list-row" role="button" tabIndex={0}
                  onClick={() => toggleExpand(account)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(account); } }}
                >
                  <div>
                    <strong>{account.account}</strong>
                    <small>{account.investor} · {account.provider || "기관 미지정"} · {formatAccountType(account.accountType)} · {account.baseCurrency || "KRW"}</small>
                  </div>
                  <div className="account-row-totals">
                    <strong>{formatKrw(totalKrw)}</strong>
                    <small className={gainClass}>{gainSign}{formatKrw(st.gainKrw)}</small>
                  </div>
                  <div className="account-row-menu" onClick={(e) => e.stopPropagation()}>
                    <details className="row-menu">
                      <summary aria-label={`계좌 ${account.account} 작업`} title="작업 더보기">⋮</summary>
                      <div className="row-menu-popover">
                        <button type="button" onClick={() => startEdit(account)}>수정</button>
                        <button
                          className="row-menu-danger" type="button" disabled={inUse}
                          title={inUse ? "사용 중인 계좌라 삭제할 수 없습니다" : "계좌 삭제"}
                          onClick={() => deleteAccount(account.id)}
                        >삭제</button>
                      </div>
                    </details>
                  </div>
                  <span className="account-row-chevron" aria-hidden="true">{isExpanded ? "▲" : "▼"}</span>
                </div>
                {isExpanded ? <AccountAccordionBody account={account} stats={st} state={state} draft={cashDrafts[account.key] || { currency: account.baseCurrency || "KRW", amount: "" }} setDraft={setDraft} saveCash={saveCash} /> : null}
              </div>
            );
          }) : <div className="empty-state">등록된 계좌가 없습니다</div>}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>예수금 변경 기록</h2>
        </div>
        <CashBalanceList state={state} accounts={accounts} />
      </div>
    </section>
  );
}

function AccountAccordionBody({ account, stats, state, draft, setDraft, saveCash }) {
  const holdings = (state?.holdings || []).filter((h) => h.investor === account.investor && h.account === account.account);
  const totalKrw = stats.stockValueKrw + stats.cashKrw;
  const stockRatio = totalKrw ? stats.stockValueKrw / totalKrw : 0;
  const cashRatio = totalKrw ? stats.cashKrw / totalKrw : 0;
  return (
    <div className="account-accordion-body">
      <div className="account-cash-form-row">
        <label>통화
          <select value={draft.currency} onChange={(e) => setDraft(account.key, "currency", e.target.value)}>
            <option value="KRW">KRW</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label>예수금
          <input type="number" step="0.01" placeholder="0" value={draft.amount ?? ""} onChange={(e) => setDraft(account.key, "amount", e.target.value)} />
        </label>
        <button type="button" onClick={() => saveCash(account.key)}>예수금 저장</button>
      </div>
      <div className="account-accordion-columns">
        <div>
          <div className="section-badge">보유 종목 ({holdings.length})</div>
          <ul className="detail-list">
            {holdings.length ? holdings.map((h) => (
              <li key={h.id}>
                <span>{h.name || h.ticker}<small>{h.ticker}</small></span>
                <strong>{formatKrw(holdingValues(state, h).valueKrw)}</strong>
              </li>
            )) : <li>보유 종목 없음</li>}
          </ul>
        </div>
        <div>
          <div className="section-badge">구성 비중</div>
          <div className="composition-row"><span>주식</span><strong>{formatPercent(stockRatio)}</strong></div>
          <div className="composition-bar"><span style={{ width: `${Math.max(0, stockRatio * 100)}%` }} /></div>
          <div className="composition-row"><span>예수금</span><strong>{formatPercent(cashRatio)}</strong></div>
          <div className="composition-bar muted"><span style={{ width: `${Math.max(0, cashRatio * 100)}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

// 예수금 변경 기록(인라인 편집 포함)
function CashBalanceList({ state, accounts }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const rows = [...(state?.cashBalances || [])].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));

  const startEdit = (cash) => {
    setEditingId(cash.id);
    setDraft({ accountKey: accountKeyFor(cash), currency: cash.currency, amount: cash.amount ?? "" });
  };

  const save = (id) => {
    const account = parseAccountKey(draft.accountKey);
    mutate((st) => {
      const existing = (st.cashBalances || []).find((c) => c.id === id);
      if (!existing) return st;
      const nextCash = {
        ...existing,
        investor: account.investor,
        account: account.account,
        currency: draft.currency,
        amount: Number(draft.amount),
        asOf: todayKey(),
        source: "사용자 수정",
      };
      st.cashBalances = st.cashBalances.map((c) => (c.id === id ? nextCash : c));
      return st;
    });
    setEditingId(null);
    setDraft(null);
  };

  const remove = (id) => {
    if (!window.confirm("이 예수금 기록을 삭제할까요?")) return;
    mutate((st) => {
      st.cashBalances = (st.cashBalances || []).filter((c) => c.id !== id);
      return st;
    });
  };

  if (!rows.length) {
    return <div className="cash-balance-list"><div className="empty-state">등록된 예수금이 없습니다</div></div>;
  }

  return (
    <div className="cash-balance-list">
      {rows.map((cash) => editingId === cash.id ? (
        <div className="detail-row is-editing-row" key={cash.id}>
          <span>
            <strong>예수금 수정</strong>
            <small>계좌와 금액을 이 행에서 바로 수정합니다</small>
          </span>
          <div className="inline-edit-cell">
            <select aria-label="예수금 계좌" value={draft.accountKey} onChange={(e) => setDraft((d) => ({ ...d, accountKey: e.target.value }))}>
              {accounts.map((a) => <option key={a.key} value={a.key}>{a.investor} · {a.account}</option>)}
            </select>
            <select aria-label="통화" value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}>
              <option value="KRW">KRW</option>
              <option value="USD">USD</option>
            </select>
            <input aria-label="예수금" type="number" step="0.01" value={draft.amount} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} />
          </div>
          <div className="row-actions">
            <button className="secondary small-button" type="button" onClick={() => save(cash.id)}>저장</button>
            <button className="ghost small-button" type="button" onClick={() => { setEditingId(null); setDraft(null); }}>취소</button>
            <button className="icon-danger" type="button" aria-label="예수금 삭제" onClick={() => remove(cash.id)}>×</button>
          </div>
        </div>
      ) : (
        <div className="cash-balance-row" key={cash.id}>
          <span>
            <strong>{cash.account}</strong>
            <small>{cash.investor} · {cash.source || "직접 입력"}</small>
          </span>
          <strong>{formatMoney(cash.amount, cash.currency)}</strong>
          <details className="row-menu">
            <summary aria-label={`${cash.account} 예수금 작업`} title="작업 더보기">⋮</summary>
            <div className="row-menu-popover">
              <button type="button" onClick={() => startEdit(cash)}>수정</button>
              <button className="row-menu-danger" type="button" onClick={() => remove(cash.id)}>삭제</button>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
