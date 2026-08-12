import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store/useStore.js";
import { getKnownAccounts, getAccountStats, isAccountInUse, holdingValues, fxOf } from "../store/selectors.js";
import { mutate, makeId, todayKey, setStatus, showToast } from "../store/mutations.js";
import { accountKeyFor, isUnclassifiedCash, renameAccountReferences } from "../../app/accounts.js";
import { formatAccountType, normalizeAccountType } from "../../app/account-types.js";
import { formatKrw, formatMoney, formatPercent } from "../../app/formatters.js";

const empty = () => ({ stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, gainKrw: 0, holdingCount: 0 });
const toKrw = (amount, currency, fx) => (currency === "USD" ? Number(amount || 0) * (fx || 1) : Number(amount || 0));

// 인라인 스트로크 아이콘 — 앱 전반의 line-icon 보이스와 맞춘 단일 세트(이모지 대체).
const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function AccountsView() {
  const state = useStore((s) => s.portfolio);
  const [search, setSearch] = useState("");
  const [investorFilter, setInvestorFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [editingCashKey, setEditingCashKey] = useState(null); // 예수금 인라인 편집 중인 계좌 key
  const [savedFlashKey, setSavedFlashKey] = useState(null); // 저장 직후 "저장됨" 확정 표시
  const [cashDraft, setCashDraft] = useState({ currency: "KRW", amount: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [allocAmount, setAllocAmount] = useState("");
  const [allocTarget, setAllocTarget] = useState("");
  const cashInputRef = useRef(null);

  const fx = fxOf(state);
  const accounts = useMemo(() => getKnownAccounts(state), [state]);
  const stats = useMemo(() => getAccountStats(state), [state]);

  // 계좌별 예수금 레코드(미분류 제외). 계좌당 보통 1건.
  const cashByKey = useMemo(() => {
    const map = new Map();
    for (const cash of state?.cashBalances || []) {
      if (isUnclassifiedCash(cash)) continue;
      const key = accountKeyFor(cash);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(cash);
    }
    return map;
  }, [state]);

  const primaryCashFor = (account) => {
    const records = cashByKey.get(account.key) || [];
    return records.find((c) => c.currency === (account.baseCurrency || "KRW")) || records[0] || null;
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const haystack = [account.account, account.investor, account.provider, formatAccountType(account.accountType), account.baseCurrency]
        .join(" ").toLowerCase();
      const cashKrw = stats.get(account.key)?.cashKrw ?? 0;
      return (!investorFilter || account.investor === investorFilter) &&
        (!currencyFilter || account.baseCurrency === currencyFilter) &&
        (!missingOnly || cashKrw === 0) &&
        (!query || haystack.includes(query));
    });
  }, [accounts, stats, search, investorFilter, currencyFilter, missingOnly]);

  const investors = useMemo(() => [...new Set(accounts.map((a) => a.investor).filter(Boolean))].sort(), [accounts]);
  const totalCash = [...stats.values()].reduce((sum, item) => sum + item.cashKrw, 0);
  const krwCount = accounts.filter((a) => a.baseCurrency === "KRW").length;
  const usdCount = accounts.filter((a) => a.baseCurrency === "USD").length;
  const missingCount = accounts.filter((a) => (stats.get(a.key)?.cashKrw ?? 0) === 0).length;

  // 미분류 예수금 배분
  const unclassified = (state?.cashBalances || []).filter(isUnclassifiedCash);
  const unclassifiedTotal = unclassified.reduce((sum, cash) => sum + Number(cash.amount || 0), 0);
  const showAllocation = unclassifiedTotal > 0 && accounts.length > 0;

  useEffect(() => {
    if (editingCashKey && cashInputRef.current) cashInputRef.current.focus();
  }, [editingCashKey]);

  const toggleExpand = (account) => {
    setExpandedKey((prev) => (prev === account.key ? null : account.key));
  };

  // 예수금 편집 시작 — 항상 최신 저장값으로 초기화(오래된 draft 잔존 방지).
  const openCashEditor = (account) => {
    const primary = primaryCashFor(account);
    setCashDraft({
      currency: primary?.currency || account.baseCurrency || "KRW",
      amount: primary ? String(primary.amount ?? "") : "",
    });
    setEditingCashKey(account.key);
    setSavedFlashKey(null);
  };

  const closeCashEditor = () => setEditingCashKey(null);

  const saveCash = (account, event) => {
    event?.preventDefault();
    const amount = Number(cashDraft.amount) || 0;
    const currency = cashDraft.currency || account.baseCurrency || "KRW";
    mutate((st) => {
      const existing = (st.cashBalances || []).find(
        (c) => c.investor === account.investor && c.account === account.account && c.currency === currency,
      );
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
    setEditingCashKey(null);
    setSavedFlashKey(account.key);
    window.setTimeout(() => setSavedFlashKey((k) => (k === account.key ? null : k)), 2200);
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
    const baseCurrency = String(form.get("baseCurrency"));
    const nextAccount = {
      id: editingId || makeId(),
      investor: String(form.get("investor")).trim(),
      account: String(form.get("account")).trim(),
      provider: String(form.get("provider")).trim(),
      accountType: normalizeAccountType(String(form.get("accountType"))),
      baseCurrency,
    };
    const cashRaw = String(form.get("cash") || "").trim();
    const cashAmount = cashRaw === "" ? null : Number(cashRaw.replace(/[^0-9.]/g, ""));
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
      // 계좌 생성/수정 시 예수금을 함께 입력했다면 upsert(계좌 통화 기준).
      if (cashAmount !== null && Number.isFinite(cashAmount)) {
        const existing = (st.cashBalances || []).find(
          (c) => c.investor === nextAccount.investor && c.account === nextAccount.account && c.currency === baseCurrency,
        );
        const cashRecord = {
          id: existing?.id || makeId(),
          investor: nextAccount.investor,
          account: nextAccount.account,
          currency: baseCurrency,
          amount: cashAmount,
          asOf: todayKey(),
          source: existing ? "사용자 수정" : "사용자 입력",
        };
        st.cashBalances = existing
          ? (st.cashBalances || []).map((c) => (c.id === existing.id ? cashRecord : c))
          : [...(st.cashBalances || []), cashRecord];
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
  const editingCashPreview = toKrw(cashDraft.amount, cashDraft.currency, fx);

  return (
    <section className="accounts-view" data-view="accounts">
      <div className="account-page-heading">
        <div>
          <strong>계좌</strong>
          <span>계좌마다 예수금을 입력·수정하세요</span>
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
            <span>계좌 정보와 예수금을 함께 입력할 수 있어요</span>
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
            <input name="cash" type="text" inputMode="decimal" placeholder="예수금 (선택)"
              defaultValue={editingAccount ? (primaryCashFor(editingAccount)?.amount ?? "") : ""} />
            <button type="submit">{editingId ? "수정 저장" : "계좌 저장"}</button>
            <button className="ghost" type="button" onClick={() => { setFormOpen(false); setEditingId(null); }}>취소</button>
          </form>
        </div>
      ) : null}

      <div className="account-overview-grid" aria-label="계좌 요약">
        <article className="account-overview-card account-overview-card--primary">
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
          <button
            type="button"
            className={`account-overview-card account-overview-card--alert${missingOnly ? " is-active" : ""}`}
            onClick={() => setMissingOnly((v) => !v)}
            aria-pressed={missingOnly}
          >
            <span>예수금 미입력</span>
            <strong>{missingCount}개</strong>
            <small>{missingOnly ? "· 전체 계좌 보기" : "· 클릭해 해당 계좌만 보기"}</small>
          </button>
        ) : null}
      </div>

      <div className="panel account-list-panel">
        <div className="section-heading">
          <div>
            <h2>계좌 목록</h2>
            <span>예수금은 각 계좌의 <b>편집</b>에서 바로 수정합니다. 계좌를 펼치면 보유 종목·구성을 볼 수 있어요.</span>
          </div>
          <span className="status-pill">{filtered.length}개 계좌{missingOnly ? " · 미입력만" : ""}</span>
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
            <p className="allocation-hint">가져오기 과정에서 계좌를 특정하지 못한 예수금입니다. 아래에서 각 계좌로 나눠 담아 주세요.</p>
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
            const isEditingCash = editingCashKey === account.key;
            const totalKrw = st.stockValueKrw + st.cashKrw;
            const gainClass = st.gainKrw >= 0 ? "positive" : "negative";
            const gainSign = st.gainKrw >= 0 ? "+" : "";
            const primary = primaryCashFor(account);
            const cur = account.baseCurrency || "KRW";
            const hasCash = st.cashKrw !== 0 || primary != null;
            return (
              <div className={`account-list-row-wrap${isExpanded ? " is-expanded" : ""}`} key={account.key}>
                <div
                  className="account-list-row" role="button" tabIndex={0}
                  onClick={() => toggleExpand(account)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(account); } }}
                >
                  <div>
                    <strong>{account.account}</strong>
                    <small>{account.investor} · {account.provider || "기관 미지정"} · {formatAccountType(account.accountType)} · {cur}</small>
                    <button
                      type="button"
                      className={`account-cash-quick${!hasCash ? " is-empty" : ""}${savedFlashKey === account.key ? " is-saved" : ""}`}
                      onClick={(e) => { e.stopPropagation(); openCashEditor(account); }}
                    >
                      {savedFlashKey === account.key ? (
                        <span className="cash-saved-flag"><CheckIcon />저장됨</span>
                      ) : (
                        <>
                          <span className="cash-quick-label">예수금</span>
                          <span className="cash-quick-value">
                            {primary ? formatMoney(primary.amount, primary.currency) : "미입력"}
                          </span>
                          {primary && primary.currency === "USD" ? <span className="cash-quick-krw">≈ {formatKrw(st.cashKrw)}</span> : null}
                          <span className="cash-quick-edit"><PencilIcon />편집</span>
                        </>
                      )}
                    </button>
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

                {isEditingCash ? (
                  <form className="account-cash-editor" onSubmit={(e) => saveCash(account, e)}>
                    <label className="cash-editor-field">
                      <span>예수금 ({cashDraft.currency})</span>
                      <input
                        ref={cashInputRef} type="number" step="0.01" placeholder="0"
                        value={cashDraft.amount}
                        onChange={(e) => setCashDraft((d) => ({ ...d, amount: e.target.value }))}
                      />
                    </label>
                    <label className="cash-editor-field cash-editor-currency">
                      <span>통화</span>
                      <select value={cashDraft.currency} onChange={(e) => setCashDraft((d) => ({ ...d, currency: e.target.value }))}>
                        <option value="KRW">KRW</option>
                        <option value="USD">USD</option>
                      </select>
                    </label>
                    <div className="cash-editor-actions">
                      <button type="submit">저장</button>
                      <button className="ghost" type="button" onClick={closeCashEditor}>취소</button>
                    </div>
                    {cashDraft.currency === "USD" ? (
                      <span className="cash-krw-hint">≈ {formatKrw(editingCashPreview)} (환율 {fx ? fx.toLocaleString() : "-"})</span>
                    ) : null}
                  </form>
                ) : null}

                {isExpanded ? <AccountAccordionBody account={account} stats={st} state={state} /> : null}
              </div>
            );
          }) : (
            <div className="empty-state">
              {missingOnly ? "예수금 미입력 계좌가 없습니다" : "등록된 계좌가 없습니다"}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <h2>예수금 현황</h2>
            <span>모든 계좌의 현재 예수금입니다. 수정은 위 계좌 목록의 <b>편집</b>에서 하세요.</span>
          </div>
        </div>
        <CashStatusList state={state} fx={fx} />
      </div>
    </section>
  );
}

function AccountAccordionBody({ account, stats, state }) {
  const holdings = (state?.holdings || []).filter((h) => h.investor === account.investor && h.account === account.account);
  const totalKrw = stats.stockValueKrw + stats.cashKrw;
  const stockRatio = totalKrw ? stats.stockValueKrw / totalKrw : 0;
  const cashRatio = totalKrw ? stats.cashKrw / totalKrw : 0;
  return (
    <div className="account-accordion-body">
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

// 예수금 현황 — 읽기 전용. 편집은 계좌 목록의 인라인 편집기 한 곳에서만 이뤄진다.
function CashStatusList({ state, fx }) {
  const rows = [...(state?.cashBalances || [])]
    .sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));

  if (!rows.length) {
    return <div className="cash-balance-list"><div className="empty-state">등록된 예수금이 없습니다</div></div>;
  }

  return (
    <div className="cash-balance-list">
      {rows.map((cash) => {
        const unclassified = isUnclassifiedCash(cash);
        const krw = toKrw(cash.amount, cash.currency, fx);
        return (
          <div className="cash-balance-row" key={cash.id}>
            <span>
              <strong>{unclassified ? "미분류 예수금" : cash.account}</strong>
              <small>
                {cash.investor || "미지정"} · {cash.source || "직접 입력"}
                {cash.asOf ? ` · ${cash.asOf}` : ""}
              </small>
            </span>
            <strong>{formatMoney(cash.amount, cash.currency)}</strong>
            <small className="cash-balance-krw">{cash.currency === "USD" ? `≈ ${formatKrw(krw)}` : ""}</small>
          </div>
        );
      })}
    </div>
  );
}
