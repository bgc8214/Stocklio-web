import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store/useStore.js";
import { getKnownAccounts } from "../store/selectors.js";
import { mutate, makeId, todayKey, setStatus, showToast } from "../store/mutations.js";
import { accountKeyFor, parseAccountKey } from "../../app/accounts.js";
import { formatKrw, formatNumber, formatPercent } from "../../app/formatters.js";
import { parseSortValue, cycleSortValue } from "../../app/sort.js";
import { projectPortfolioDividends } from "../../domain/portfolio-core.js";
import { getDividendInfo } from "../../app/services/market-data-service.js";

const DEFAULT_SORT = "date-desc";
// 입력 가능한 유형 — 세금/수수료는 성과 계산에 반영되지 않는 dead input이라 제거했다.
// (과거에 기록/가져온 tax·fee 항목은 아래 라벨 맵으로 그대로 표시된다.)
const INPUT_FLOW_TYPES = [
  ["deposit", "입금"],
  ["withdrawal", "출금"],
  ["dividend", "배당"],
];
const FLOW_TYPE_LABELS = { deposit: "입금", withdrawal: "출금", dividend: "배당", tax: "세금", fee: "수수료" };
const flowTypeLabel = (type) => FLOW_TYPE_LABELS[type] || type || "";

export function CashflowsView() {
  const state = useStore((s) => s.portfolio);
  const [typeFilter, setTypeFilter] = useState("");
  const [sortValue, setSortValue] = useState(DEFAULT_SORT);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const formRef = useRef(null);
  const accounts = useMemo(() => getKnownAccounts(state), [state]);
  const dividends = useMemo(() => (state?.cashFlows || []).filter((f) => f.type === "dividend"), [state]);

  // 보유 종목에서 계좌·종목 조합을 뽑아 "배당 빠른 입력" 칩을 만든다.
  const dividendSuggestions = useMemo(() => {
    const seen = new Map();
    for (const h of state?.holdings || []) {
      const accountKey = accountKeyFor(h);
      const ticker = h.ticker || h.symbol || "";
      const key = `${accountKey}|${ticker || h.name || ""}`;
      if (!seen.has(key)) {
        seen.set(key, { accountKey, account: h.account, ticker, name: h.name });
      }
    }
    return [...seen.values()];
  }, [state]);

  const prefillDividend = (s) => {
    const form = formRef.current;
    if (!form) return;
    if (form.elements.type) form.elements.type.value = "dividend";
    if (form.elements.accountKey) form.elements.accountKey.value = s.accountKey;
    if (form.elements.note && !form.elements.note.value) form.elements.note.value = `${s.name || s.ticker} 배당`;
    form.elements.amountKrw?.focus();
  };

  // 예상 배당 — 보유 종목의 주당 연배당(TTM)을 조회해 자동 계산한다.
  const holdings = useMemo(() => state?.holdings || [], [state]);
  const fxRate = Number(state?.fxRate?.rate || 1);
  const [dividendMap, setDividendMap] = useState({});
  const [divStatus, setDivStatus] = useState("idle"); // idle | loading | ready | error
  const tickerKey = useMemo(
    () => [...new Set(holdings.map((h) => h.ticker).filter(Boolean))].sort().join(","),
    [holdings],
  );
  useEffect(() => {
    const tickers = tickerKey ? tickerKey.split(",") : [];
    if (!tickers.length) { setDividendMap({}); setDivStatus("idle"); return undefined; }
    let cancelled = false;
    setDivStatus("loading");
    Promise.all(tickers.map(async (t) => {
      try { return [t, await getDividendInfo(t)]; } catch { return [t, null]; }
    })).then((entries) => {
      if (cancelled) return;
      const map = {};
      for (const [t, info] of entries) if (info) map[t] = info;
      setDividendMap(map);
      setDivStatus("ready");
    }).catch(() => { if (!cancelled) setDivStatus("error"); });
    return () => { cancelled = true; };
  }, [tickerKey]);

  const projection = useMemo(
    () => projectPortfolioDividends(holdings, dividendMap, fxRate),
    [holdings, dividendMap, fxRate],
  );

  const sort = parseSortValue(sortValue, DEFAULT_SORT);
  const rows = useMemo(() => {
    return [...(state?.cashFlows || [])]
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
  }, [state, typeFilter, sortValue]);

  const submitForm = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const account = parseAccountKey(form.get("accountKey"));
    const nextFlow = {
      id: makeId(),
      date: String(form.get("date")),
      investor: account.investor,
      account: account.account,
      type: String(form.get("type")),
      amountKrw: Number(form.get("amountKrw")),
      note: String(form.get("note")).trim(),
    };
    mutate((st) => {
      st.cashFlows = [...(st.cashFlows || []), nextFlow];
      return st;
    });
    event.currentTarget.reset();
    event.currentTarget.elements.date.value = todayKey();
  };

  const startEdit = (flow) => {
    setEditingId(flow.id);
    setDraft({
      date: flow.date || todayKey(),
      accountKey: accountKeyFor(flow),
      type: flow.type,
      amountKrw: flow.amountKrw ?? "",
      note: flow.note || "",
    });
  };

  const saveEdit = (id) => {
    const account = parseAccountKey(draft.accountKey);
    mutate((st) => {
      const existing = (st.cashFlows || []).find((f) => f.id === id);
      if (!existing) return st;
      const nextFlow = {
        ...existing,
        date: draft.date || todayKey(),
        investor: account.investor,
        account: account.account,
        type: draft.type,
        amountKrw: Number(draft.amountKrw),
        note: String(draft.note).trim(),
      };
      st.cashFlows = st.cashFlows.map((f) => (f.id === id ? nextFlow : f));
      return st;
    });
    setStatus("입출금 수정 완료", `${flowTypeLabel(draft.type)} · ${formatKrw(Number(draft.amountKrw))}`);
    showToast("입출금 수정 완료", `${draft.date} · ${formatKrw(Number(draft.amountKrw))}`, "success");
    setEditingId(null);
    setDraft(null);
  };

  const remove = (id) => {
    if (!window.confirm("이 입출금 기록을 삭제할까요? 성과 계산에도 반영됩니다.")) return;
    mutate((st) => {
      st.cashFlows = (st.cashFlows || []).filter((f) => f.id !== id);
      return st;
    });
  };

  const cycleSort = (key) => setSortValue((prev) => cycleSortValue(prev, key, DEFAULT_SORT));
  const sortIndicator = (key) => (sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : "↕");

  return (
    <section className="detail-grid" data-view="cashflows">
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="section-heading">
          <h2>예상 배당</h2>
          <span>보유 종목의 최근 1년 배당 기준 · 세전 추정</span>
        </div>
        <ExpectedDividendPanel projection={projection} status={divStatus} fxRate={fxRate} />
      </div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="section-heading">
          <h2>배당 수령 기록</h2>
          <span>내가 실제로 받은 배당 · 월별</span>
        </div>
        <DividendChart dividends={dividends} />
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>입출금 기록</h2>
          <span>입금/출금은 투자손익 계산을 보정합니다</span>
        </div>
        <form className="cash-flow-form" ref={formRef} onSubmit={submitForm}>
          <input name="date" type="date" required defaultValue={todayKey()} />
          <select name="accountKey" aria-label="계좌 선택" required defaultValue="">
            <option value="">계좌 선택</option>
            {accounts.map((a) => <option key={a.key} value={a.key}>{a.investor} · {a.account}</option>)}
          </select>
          <select name="type" required defaultValue="deposit">
            {INPUT_FLOW_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <input name="amountKrw" type="number" step="1" min="0" placeholder="금액 KRW" required />
          <input name="note" placeholder="메모" />
          <button type="submit">기록</button>
        </form>
        {dividendSuggestions.length ? (
          <div className="dividend-quick-add">
            <span className="dividend-quick-label">배당 빠른 입력</span>
            <div className="dividend-quick-chips">
              {dividendSuggestions.map((s) => (
                <button
                  type="button"
                  key={`${s.accountKey}|${s.ticker || s.name}`}
                  className="dividend-quick-chip"
                  onClick={() => prefillDividend(s)}
                  title={`${s.account} · ${s.name || s.ticker} 배당을 위 양식에 채웁니다`}
                >
                  {s.ticker || s.name}
                </button>
              ))}
            </div>
            <span className="dividend-quick-hint">종목을 누르면 위 양식이 배당으로 채워집니다. 배당은 위 인컴 차트에만 집계되며 투자손익에는 중복 반영되지 않아요.</span>
          </div>
        ) : null}
        <div className="filters compact-filters" aria-label="입출금 필터">
          <select aria-label="입출금 유형 필터" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">모든 유형</option>
            {INPUT_FLOW_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <select aria-label="입출금 정렬" value={sortValue} onChange={(e) => setSortValue(e.target.value)}>
            <option value="date-desc">최근 날짜순</option>
            <option value="date-asc">오래된 날짜순</option>
            <option value="amount-desc">금액 높은 순</option>
            <option value="amount-asc">금액 낮은 순</option>
          </select>
        </div>
        <div className="table-wrap compact">
          <table>
            <thead>
              <tr>
                <th><button className={`th-sort${sort.key === "date" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("date")}>날짜 <span className="sort-indicator" aria-hidden="true">{sortIndicator("date")}</span></button></th>
                <th>투자자</th>
                <th>계좌</th>
                <th>유형</th>
                <th><button className={`th-sort${sort.key === "amount" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("amount")}>금액 <span className="sort-indicator" aria-hidden="true">{sortIndicator("amount")}</span></button></th>
                <th>메모</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((flow) => editingId === flow.id ? (
                <tr className="is-editing-row" key={flow.id}>
                  <td data-label="날짜"><input type="date" aria-label="날짜" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} /></td>
                  <td data-label="계좌" colSpan={2}>
                    <select aria-label="계좌" value={draft.accountKey} onChange={(e) => setDraft((d) => ({ ...d, accountKey: e.target.value }))}>
                      {accounts.map((a) => <option key={a.key} value={a.key}>{a.investor} · {a.account}</option>)}
                    </select>
                  </td>
                  <td data-label="유형">
                    <select aria-label="유형" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}>
                      {INPUT_FLOW_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                  </td>
                  <td data-label="금액"><input type="number" step="1" min="0" aria-label="금액 KRW" value={draft.amountKrw} onChange={(e) => setDraft((d) => ({ ...d, amountKrw: e.target.value }))} /></td>
                  <td data-label="메모"><input aria-label="메모" placeholder="메모" value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} /></td>
                  <td data-label="작업">
                    <div className="row-actions">
                      <button className="secondary small-button" type="button" onClick={() => saveEdit(flow.id)}>저장</button>
                      <button className="ghost small-button" type="button" onClick={() => { setEditingId(null); setDraft(null); }}>취소</button>
                      <button className="icon-danger" type="button" aria-label="입출금 기록 삭제" onClick={() => remove(flow.id)}>×</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={flow.id}>
                  <td data-label="날짜">{flow.date}</td>
                  <td data-label="투자자">{flow.investor}</td>
                  <td data-label="계좌">{flow.account}</td>
                  <td data-label="유형">{flowTypeLabel(flow.type)}</td>
                  <td data-label="금액"><span className="money-value">{formatKrw(flow.amountKrw)}</span></td>
                  <td data-label="메모">{flow.note || ""}</td>
                  <td data-label="작업">
                    <details className="row-menu">
                      <summary aria-label={`${flow.date} 입출금 작업`} title="작업 더보기">⋮</summary>
                      <div className="row-menu-popover">
                        <button type="button" onClick={() => startEdit(flow)}>수정</button>
                        <button className="row-menu-danger" type="button" onClick={() => remove(flow.id)}>삭제</button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function formatPerShare(value, currency) {
  return currency === "USD" ? `$${formatNumber(value, value < 10 ? 4 : 2)}` : `${formatNumber(value, 0)}원`;
}

function ExpectedDividendPanel({ projection, status, fxRate }) {
  if (status === "loading" && !projection.rows.length) {
    return <div className="empty-state"><span>보유 종목의 배당 정보를 불러오는 중…</span></div>;
  }
  if (status === "error" && !projection.rows.length) {
    return <div className="empty-state"><span>배당 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</span></div>;
  }
  if (!projection.rows.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🪙</span>
        <strong>배당을 지급하는 보유 종목이 없어요</strong>
        <span>배당주(예: SCHD)를 보유하면 예상 배당이 여기에 자동 계산됩니다</span>
      </div>
    );
  }
  return (
    <div className="expected-dividend">
      <div className="expected-dividend-summary">
        <div><span>예상 연 배당</span><strong>{formatKrw(projection.annualKrw)}</strong></div>
        <div><span>월 평균</span><strong>{formatKrw(projection.monthlyAvgKrw)}</strong></div>
        <div><span>배당 수익률</span><strong>{formatPercent(projection.portfolioYieldRatio)}</strong></div>
        <div><span>배당 종목</span><strong>{projection.payingCount}개</strong></div>
      </div>
      <div className="table-wrap compact">
        <table>
          <thead>
            <tr>
              <th>종목</th>
              <th>주당 배당</th>
              <th>수량</th>
              <th>예상 연 배당</th>
              <th>수익률</th>
            </tr>
          </thead>
          <tbody>
            {projection.rows.map((r) => (
              <tr key={`${r.investor}|${r.account}|${r.ticker}`}>
                <td data-label="종목"><strong>{r.ticker}</strong><span className="expected-dividend-name">{r.name}</span></td>
                <td data-label="주당 배당">{formatPerShare(r.perShare, r.currency)}{r.payoutsPerYear ? <span className="expected-dividend-freq"> · 연 {r.payoutsPerYear}회</span> : null}</td>
                <td data-label="수량">{formatNumber(r.quantity, 0)}</td>
                <td data-label="예상 연 배당"><span className="money-value">{formatKrw(r.annualKrw)}</span></td>
                <td data-label="수익률">{formatPercent(r.yieldRatio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="expected-dividend-note">최근 1년간 실제 지급된 배당(주당) 기준의 세전 추정치입니다. 환율 {formatNumber(fxRate, 1)} 적용 · 향후 배당 변동·세금은 반영되지 않습니다.</p>
    </div>
  );
}

function DividendChart({ dividends }) {
  if (!dividends.length) {
    return (
      <div className="dividend-chart">
        <div className="empty-state">
          <span className="empty-icon">🌱</span>
          <strong>배당 기록이 없습니다</strong>
          <span>아래 입출금 기록의 '배당 빠른 입력'에서 종목을 누르면 차트가 채워집니다</span>
        </div>
      </div>
    );
  }
  const byMonth = {};
  for (const f of dividends) {
    const ym = f.date?.slice(0, 7) || "unknown";
    byMonth[ym] = (byMonth[ym] || 0) + Number(f.amountKrw || 0);
  }
  const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  if (!sorted.length) {
    return <div className="dividend-chart"><div className="empty-state"><span>집계할 배당 데이터가 없습니다</span></div></div>;
  }
  const maxVal = Math.max(...sorted.map(([, v]) => v));
  const totalAnnual = sorted.reduce((s, [, v]) => s + v, 0);
  const avgMonthly = Math.round(totalAnnual / sorted.length);
  return (
    <div className="dividend-chart">
      <div className="dividend-summary">
        <span>최근 {sorted.length}개월 합계 <strong>{formatKrw(totalAnnual)}</strong></span>
        <span>월 평균 <strong>{formatKrw(avgMonthly)}</strong></span>
      </div>
      <div className="dividend-bars">
        {sorted.map(([ym, val]) => (
          <div className="dividend-bar-wrap" key={ym}>
            <div className="dividend-bar" style={{ height: Math.max(4, Math.round((val / maxVal) * 80)) }} title={formatKrw(val)} />
            <span className="dividend-bar-label">{ym.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
