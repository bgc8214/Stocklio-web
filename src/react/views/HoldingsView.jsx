import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store/useStore.js";
import {
  holdingValues, holdingDailyMove, getKnownAccounts, fxOf,
  normalizeStrategy, strategyBuckets, normalizeAccountType,
} from "../store/selectors.js";
import { mutate, makeId, setStatus, showToast } from "../store/mutations.js";
import { accountKeyFor, parseAccountKey } from "../../app/accounts.js";
import { accountTypeLabels } from "../../app/account-types.js";
import {
  formatAsOf, formatKrw, formatMoneyByMode, formatChangeByMode, formatChangePrefixed, formatNumber, formatPercent,
} from "../../app/formatters.js";
import { parseSortValue, cycleSortValue } from "../../app/sort.js";
import { searchSymbols, getDividendInfo } from "../../app/services/market-data-service.js";
import { TickerLogo } from "../components/TickerLogo.jsx";

// 손익 색: 양수=상승(빨강), 음수=하락(파랑), 0=중립.
const signClass = (v) => (v > 0 ? "positive" : v < 0 ? "negative" : undefined);

const DEFAULT_SORT = "value-desc";
const PAGE_SIZE = window.innerWidth <= 980 ? 100 : 10;
const SORT_OPTIONS = [
  ["value-desc", "평가금액 높은 순"], ["value-asc", "평가금액 낮은 순"],
  ["gain-desc", "손익 높은 순"], ["gain-asc", "손익 낮은 순"],
  ["return-desc", "수익률 높은 순"], ["return-asc", "수익률 낮은 순"],
  ["dayChange-desc", "일 영향 큰 순"], ["dayChange-asc", "일 영향 낮은 순"],
  ["quantity-desc", "수량 많은 순"], ["quantity-asc", "수량 적은 순"],
  ["price-desc", "현재가 높은 순"], ["price-asc", "현재가 낮은 순"],
  ["name-asc", "종목명 가나다순"], ["name-desc", "종목명 역순"],
];

export function HoldingsView() {
  const state = useStore((s) => s.portfolio);
  const currencyMode = useStore((s) => s.currencyMode);

  const [search, setSearch] = useState("");
  const [investorFilter, setInvestorFilter] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("");
  const [sortValue, setSortValue] = useState(DEFAULT_SORT);
  const [scope, setScope] = useState("all");
  const [viewMode, setViewMode] = useState("detail");
  const [page, setPage] = useState(1);
  const [accountChip, setAccountChip] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [drawer, setDrawer] = useState(null); // null | {holding} — holding=null 은 신규
  const [detailTicker, setDetailTicker] = useState(null); // 종목 상세 드로어(종목별 카드 탭)

  // 대시보드 "종목 추가" 버튼(레거시 status strip)이 신규 드로어를 열도록 하는 신호.
  const openDrawerSignal = useStore((s) => s.openHoldingDrawerSignal);
  useEffect(() => {
    if (openDrawerSignal > 0) setDrawer({ holding: null });
  }, [openDrawerSignal]);

  const holdings = state?.holdings || [];
  const fx = fxOf(state);
  const sort = parseSortValue(sortValue, DEFAULT_SORT);

  const investors = useMemo(() => [...new Set(holdings.map((h) => h.investor).filter(Boolean))].sort(), [holdings]);
  const strategies = useMemo(() => strategyBuckets(holdings.map((h) => h.strategy)), [holdings]);
  const accountTypes = useMemo(() => [...new Set(holdings.map((h) => normalizeAccountType(h.accountType)))], [holdings]);
  const accountChips = useMemo(() => {
    const seen = new Map();
    for (const h of holdings) {
      const key = `${h.investor}|||${h.account}`;
      if (!seen.has(key)) seen.set(key, { investor: h.investor, account: h.account, key });
    }
    return [...seen.values()];
  }, [holdings]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = holdings.filter((h) => {
      const chipKey = `${h.investor}|||${h.account}`;
      const haystack = [h.name, h.ticker, h.account, h.investor, h.strategy].join(" ").toLowerCase();
      const v = holdingValues(state, h);
      return (!accountChip || chipKey === accountChip) &&
        (!investorFilter || h.investor === investorFilter) &&
        (!strategyFilter || h.strategy === strategyFilter) &&
        (!accountTypeFilter || normalizeAccountType(h.accountType) === accountTypeFilter) &&
        (scope === "all" || (scope === "gain" && v.gainKrw >= 0) || (scope === "loss" && v.gainKrw < 0)) &&
        (!query || haystack.includes(query));
    });
    return rows.sort((a, b) => {
      const av = holdingValues(state, a), bv = holdingValues(state, b);
      const aReturn = av.costKrw ? av.gainKrw / av.costKrw : 0;
      const bReturn = bv.costKrw ? bv.gainKrw / bv.costKrw : 0;
      const aPriceKrw = Number(a.price || 0) * (a.currency === "USD" ? fx : 1);
      const bPriceKrw = Number(b.price || 0) * (b.currency === "USD" ? fx : 1);
      const cmp = {
        dayChange: holdingDailyMove(state, a).valueKrw - holdingDailyMove(state, b).valueKrw,
        gain: av.gainKrw - bv.gainKrw,
        return: aReturn - bReturn,
        quantity: Number(a.quantity || 0) - Number(b.quantity || 0),
        price: aPriceKrw - bPriceKrw,
        name: String(a.name || a.ticker).localeCompare(String(b.name || b.ticker), "ko"),
        value: av.valueKrw - bv.valueKrw,
      };
      const result = cmp[sort.key] ?? cmp.value;
      return sort.dir === "asc" ? result : -result;
    });
  }, [holdings, state, search, investorFilter, strategyFilter, accountTypeFilter, scope, sortValue, accountChip, fx]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const summary = useMemo(() => computeSummary(state, filtered), [state, filtered]);
  const activeFilterCount = [investorFilter, strategyFilter, accountTypeFilter].filter(Boolean).length;
  const isSummary = viewMode === "summary";

  const removeHolding = (id) => {
    if (!window.confirm("이 보유 종목을 삭제할까요? 삭제 후에는 직접 다시 추가해야 합니다.")) return;
    mutate((st) => { st.holdings = (st.holdings || []).filter((h) => h.id !== id); return st; });
  };

  const resetFilters = () => { setInvestorFilter(""); setStrategyFilter(""); setAccountTypeFilter(""); setPage(1); };
  const cycleSort = (key) => { setSortValue((prev) => cycleSortValue(prev, key, DEFAULT_SORT)); setPage(1); };
  const sortIndicator = (key) => (sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : "↕");

  return (
    <section className="panel holdings-panel" data-view="holdings">
      <div className="holding-toolbar">
        <div className="holding-toolbar-meta">
          <strong>{summary.visibleCount}/{summary.allCount}개 종목</strong>
          <span>{summary.priceMeta}</span>
          <button className="ghost small-button holding-export-btn" type="button" title="CSV 내보내기" onClick={() => exportCsv(state, filtered)}>↓ 내보내기</button>
        </div>
        <button className="primary small-button" type="button" onClick={() => setDrawer({ holding: null })}>+ 종목 추가</button>
      </div>

      <div className="holdings-summary-grid" aria-label="보유 종목 요약">
        <article className="holding-summary-card"><span>총 평가금액</span><strong>{formatKrw(summary.totalValue)}</strong></article>
        <article className="holding-summary-card"><span>총 손익</span><strong className={summary.totalGain >= 0 ? "positive" : "negative"}>{summary.totalGain >= 0 ? "+" : ""}{formatKrw(summary.totalGain)}</strong><small>{formatPercent(summary.returnRate)}</small></article>
        <article className="holding-summary-card"><span>일 영향</span><strong className={summary.totalDayMove >= 0 ? "positive" : "negative"}>{summary.totalDayMove >= 0 ? "+" : ""}{formatKrw(summary.totalDayMove)}</strong></article>
        <article className="holding-summary-card"><span>상위 집중도</span><strong>{formatPercent(summary.concentration)}</strong><small>{summary.topNames}</small></article>
      </div>

      {!isSummary ? (
        <div className="filters" aria-label="보유 종목 필터">
          <div className="filters-row1">
            <select className="account-chips-select" aria-label="계좌 선택" value={accountChip} onChange={(e) => { setAccountChip(e.target.value); setPage(1); }}>
              <option value="">전체 계좌</option>
              {accountChips.map((a) => <option key={a.key} value={a.key}>{a.investor} · {a.account}</option>)}
            </select>
            <div className="filters-row1-controls">
              <input type="search" placeholder="종목/티커 검색" aria-label="보유 종목 검색" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              <div className="filter-popover-wrap">
                <button className="ghost small-button" type="button" aria-expanded={filterOpen} onClick={() => setFilterOpen((v) => !v)}>필터 {activeFilterCount > 0 ? <span className="filter-badge">{activeFilterCount}</span> : null}</button>
                {filterOpen ? (
                  <div className="filter-popover">
                    <select aria-label="투자자 필터" value={investorFilter} onChange={(e) => { setInvestorFilter(e.target.value); setPage(1); }}>
                      <option value="">모든 투자자</option>{investors.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select aria-label="전략 필터" value={strategyFilter} onChange={(e) => { setStrategyFilter(e.target.value); setPage(1); }}>
                      <option value="">모든 전략</option>{strategies.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select aria-label="계좌 유형 필터" value={accountTypeFilter} onChange={(e) => { setAccountTypeFilter(e.target.value); setPage(1); }}>
                      <option value="">모든 계좌 유형</option>{accountTypes.map((v) => <option key={v} value={v}>{accountTypeLabels[v] || v}</option>)}
                    </select>
                    <button className="ghost small-button" type="button" onClick={resetFilters}>초기화</button>
                  </div>
                ) : null}
              </div>
              <select aria-label="보유 종목 정렬" value={sortValue} onChange={(e) => { setSortValue(e.target.value); setPage(1); }}>
                {SORT_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>
        </div>
      ) : null}

      <div className="holding-view-toggle" role="group" aria-label="보기 방식">
        <button className={`ghost small-button${!isSummary ? " is-active" : ""}`} type="button" aria-pressed={!isSummary} onClick={() => setViewMode("detail")}>계좌별</button>
        <button className={`ghost small-button${isSummary ? " is-active" : ""}`} type="button" aria-pressed={isSummary} onClick={() => setViewMode("summary")}>종목별</button>
      </div>

      {!isSummary ? (
        <div className="holding-list-tools">
          <div className="segmented-control compact-segmented" role="group" aria-label="보유 종목 범위">
            {[["all", "전체"], ["gain", "수익"], ["loss", "손실"]].map(([s, label]) => (
              <button key={s} type="button" className={scope === s ? "is-active" : undefined} onClick={() => { setScope(s); setPage(1); }}>{label}</button>
            ))}
          </div>
          <span className="status-pill">{filtered.length > PAGE_SIZE ? `${(safePage - 1) * PAGE_SIZE + 1}-${Math.min(filtered.length, safePage * PAGE_SIZE)} / ${filtered.length}개` : `${filtered.length}개 표시`}</span>
        </div>
      ) : null}

      {isSummary ? (
        <HoldingsSummaryCards state={state} rows={filtered} onOpenDetail={(t) => setDetailTicker(t)} />
      ) : (
        <>
          <div className="table-wrap holdings-table-wrap">
            <table className={`holdings-table${accountChip ? " cols-context-hidden" : ""}`}>
              <thead>
                <tr>
                  <th className="col-context">투자자</th>
                  <th className="col-context">계좌</th>
                  <th className="col-context">전략</th>
                  <th><button className={`th-sort${sort.key === "name" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("name")}>종목 <span className="sort-indicator" aria-hidden="true">{sortIndicator("name")}</span></button></th>
                  <th><button className={`th-sort${sort.key === "quantity" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("quantity")}>수량 <span className="sort-indicator" aria-hidden="true">{sortIndicator("quantity")}</span></button></th>
                  <th><button className={`th-sort${sort.key === "price" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("price")}>현재가 <span className="sort-indicator" aria-hidden="true">{sortIndicator("price")}</span></button></th>
                  <th>평단가</th>
                  <th><button className={`th-sort${sort.key === "value" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("value")}>평가금액 <span className="sort-indicator" aria-hidden="true">{sortIndicator("value")}</span></button></th>
                  <th><button className={`th-sort${sort.key === "dayChange" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("dayChange")}>일 영향 <span className="sort-indicator" aria-hidden="true">{sortIndicator("dayChange")}</span></button></th>
                  <th><button className={`th-sort${sort.key === "gain" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("gain")}>손익 <span className="sort-indicator" aria-hidden="true">{sortIndicator("gain")}</span></button></th>
                  <th><button className={`th-sort${sort.key === "return" ? " is-sorted" : ""}`} type="button" onClick={() => cycleSort("return")}>수익률 <span className="sort-indicator" aria-hidden="true">{sortIndicator("return")}</span></button></th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageRows.length ? pageRows.map((h) => (
                  <HoldingRow key={h.id} state={state} holding={h} currencyMode={currencyMode} fx={fx}
                    onEdit={() => setDrawer({ holding: h })} onDelete={() => removeHolding(h.id)} />
                )) : <tr><td colSpan={12}>조건에 맞는 보유 종목이 없습니다</td></tr>}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE_SIZE ? (
            <div className="pagination-bar" aria-label="보유 종목 페이지">
              <span>{formatNumber(filtered.length, 0)}개 중 {formatNumber((safePage - 1) * PAGE_SIZE + 1, 0)}-{formatNumber(Math.min(filtered.length, safePage * PAGE_SIZE), 0)}개</span>
              <div>
                <button className="ghost small-button" type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>이전</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`ghost small-button${p === safePage ? " is-active" : ""}`} type="button" onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="ghost small-button" type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>다음</button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {drawer ? <HoldingDrawer state={state} holding={drawer.holding} onClose={() => setDrawer(null)} /> : null}
      {detailTicker ? <HoldingDetailDrawer state={state} tickerKey={detailTicker} currencyMode={currencyMode} fx={fx} onClose={() => setDetailTicker(null)} /> : null}
    </section>
  );
}

function HoldingRow({ state, holding, currencyMode, fx, onEdit, onDelete }) {
  const v = holdingValues(state, holding);
  const returnRate = v.costNative ? v.gainNative / v.costNative : 0;
  const dailyMove = holdingDailyMove(state, holding);
  const isUsd = holding.currency === "USD";
  const dailyMoveValue = currencyMode === "krw" ? dailyMove.valueKrw : dailyMove.valueUsd;
  const dailyMoveIsKrw = currencyMode === "krw" || !isUsd;
  return (
    <tr>
      <td data-label="투자자" className="col-context">{holding.investor}</td>
      <td data-label="계좌" className="col-context"><span className="name-cell">{holding.account}</span></td>
      <td data-label="전략" className="col-context"><span className="name-cell">{holding.strategy}</span></td>
      <td data-label="종목"><span className="name-cell-logo"><TickerLogo ticker={holding.ticker} name={holding.name} size={28} /><span><strong className="name-cell">{holding.name || holding.ticker}</strong>{holding.ticker && holding.ticker !== holding.name ? <small className="name-cell">{holding.ticker}</small> : null}</span></span></td>
      <td data-label="수량"><span className="amount-cell">{formatNumber(holding.quantity, 4)}</span></td>
      <td data-label="현재가"><span className="money-value">{formatMoneyByMode(holding.price, holding.currency, currencyMode, fx)}</span></td>
      <td data-label="평단가"><span className="money-value">{formatMoneyByMode(holding.averageCost, holding.currency, currencyMode, fx)}</span></td>
      <td data-label="평가금액"><span className="money-value">{formatMoneyByMode(v.valueNative, holding.currency, currencyMode, fx)}</span></td>
      <td data-label="일 영향" className={dailyMove.hasData ? (dailyMoveValue >= 0 ? "positive" : "negative") : "no-data"}>
        <span className="money-value">{dailyMove.hasData ? formatChangePrefixed(dailyMoveValue, dailyMoveIsKrw) : ""}</span>
        {dailyMove.hasData ? <small>{formatPercent(dailyMove.changePercent)}</small> : null}
      </td>
      <td data-label="손익" className={v.gainNative >= 0 ? "positive" : "negative"}><span className="money-value">{formatChangeByMode(v.gainNative, holding.currency, currencyMode, fx)}</span></td>
      <td data-label="수익률" className={v.gainNative >= 0 ? "positive" : "negative"}><span className="amount-cell">{formatPercent(returnRate)}</span></td>
      <td data-label="작업">
        <details className="row-menu">
          <summary aria-label={`${holding.name || holding.ticker} 작업`} title="작업 더보기">⋮</summary>
          <div className="row-menu-popover">
            <button type="button" onClick={onEdit}>수정</button>
            <button className="row-menu-danger" type="button" onClick={onDelete}>삭제</button>
          </div>
        </details>
      </td>
    </tr>
  );
}

function HoldingsSummaryCards({ state, rows, onOpenDetail }) {
  const byTicker = new Map();
  for (const h of rows) {
    const key = h.ticker || h.name;
    const v = holdingValues(state, h);
    const dm = holdingDailyMove(state, h);
    if (byTicker.has(key)) {
      const e = byTicker.get(key);
      e.quantity += Number(h.quantity || 0); e.valueKrw += v.valueKrw; e.costKrw += v.costKrw; e.gainKrw += v.gainKrw;
      e.dayMoveKrw += dm.hasData ? dm.valueKrw : 0; e.hasDayData = e.hasDayData || dm.hasData;
    } else {
      byTicker.set(key, { ticker: h.ticker, name: h.name || h.ticker, quantity: Number(h.quantity || 0),
        valueKrw: v.valueKrw, costKrw: v.costKrw, gainKrw: v.gainKrw, dayMoveKrw: dm.hasData ? dm.valueKrw : 0, hasDayData: dm.hasData });
    }
  }
  const merged = [...byTicker.values()].sort((a, b) => b.valueKrw - a.valueKrw);
  const totalValue = merged.reduce((s, r) => s + r.valueKrw, 0);
  if (!merged.length) return <div id="holdingsSummaryView"><div className="holdings-summary-empty">조건에 맞는 종목이 없습니다</div></div>;
  return (
    <div id="holdingsSummaryView">
      <div className="holdings-card-slider" role="list" aria-label="보유 종목 카드">
        {merged.map((item) => {
          const returnRate = item.costKrw ? item.gainKrw / item.costKrw : 0;
          const weight = totalValue ? item.valueKrw / totalValue : 0;
          const gainPos = item.gainKrw >= 0, dayPos = item.dayMoveKrw >= 0;
          return (
            <button
              type="button"
              className="holdings-summary-card"
              role="listitem"
              key={item.ticker || item.name}
              onClick={() => onOpenDetail?.(item.ticker || item.name)}
              title={`${item.name} 계좌별 상세 보기`}
            >
              <div className="hsc-header">
                <TickerLogo ticker={item.ticker} name={item.name} size={32} />
                <div className="hsc-name-wrap"><strong className="hsc-name" title={item.name}>{item.name}</strong><span className="hsc-ticker">{item.ticker}</span></div>
                <span className={`hsc-change ${gainPos ? "positive" : "negative"}`}>{gainPos ? "+" : ""}{formatPercent(returnRate)}</span>
              </div>
              <div className="hsc-value">{formatKrw(item.valueKrw)}</div>
              <div className="hsc-meta">
                {item.hasDayData ? <span className={`hsc-day ${dayPos ? "positive" : "negative"}`}>{dayPos ? "+" : ""}{formatKrw(item.dayMoveKrw)}</span> : null}
                <span className="hsc-weight">{formatPercent(weight)}</span>
                <span className="hsc-detail-cue" aria-hidden="true">›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 종목 상세 드로어 — 한 종목을 계좌별로 분해해서 보여준다(멀티계좌 앱의 핵심 공백을 메움).
// 실현수익/매매이력은 데이터가 없어 표시하지 않는다.
function HoldingDetailDrawer({ state, tickerKey, currencyMode, fx, onClose }) {
  const holdings = (state?.holdings || []).filter((h) => (h.ticker || h.name) === tickerKey);
  const [dividend, setDividend] = useState(null);
  const first = holdings[0] || {};
  const currency = first.currency || "KRW";
  const ticker = first.ticker;
  const name = first.name || first.ticker || tickerKey;

  useEffect(() => {
    if (!ticker) return undefined;
    let cancelled = false;
    getDividendInfo(ticker).then((info) => { if (!cancelled) setDividend(info); }).catch(() => {});
    return () => { cancelled = true; };
  }, [ticker]);

  const money = (nativeVal) => formatMoneyByMode(nativeVal, currency, currencyMode, fx);
  const change = (nativeVal) => formatChangeByMode(nativeVal, currency, currencyMode, fx);

  const agg = holdings.reduce((a, h) => {
    const v = holdingValues(state, h);
    const dm = holdingDailyMove(state, h);
    a.qty += Number(h.quantity || 0);
    a.valueNative += v.valueNative; a.costNative += v.costNative; a.valueKrw += v.valueKrw;
    a.dayMoveNative += dm.hasData ? (currency === "USD" ? dm.valueUsd : dm.valueKrw) : 0;
    a.hasDay = a.hasDay || dm.hasData;
    return a;
  }, { qty: 0, valueNative: 0, costNative: 0, valueKrw: 0, dayMoveNative: 0, hasDay: false });
  const gainNative = agg.valueNative - agg.costNative;
  const returnRate = agg.costNative ? gainNative / agg.costNative : 0;
  const avgCost = agg.qty ? agg.costNative / agg.qty : 0;
  const totalPortfolioKrw = (state?.holdings || []).reduce((s, h) => s + holdingValues(state, h).valueKrw, 0);
  const weight = totalPortfolioKrw ? agg.valueKrw / totalPortfolioKrw : 0;

  const perShare = Number(dividend?.perShare || 0);
  const annualNative = perShare * agg.qty;
  const annualKrw = currency === "USD" ? annualNative * fx : annualNative;
  const divYield = agg.valueNative ? annualNative / agg.valueNative : 0;

  const rows = holdings
    .map((h) => { const v = holdingValues(state, h); return { h, v, ret: v.costNative ? v.gainNative / v.costNative : 0 }; })
    .sort((a, b) => b.v.valueNative - a.v.valueNative);

  return (
    <>
      <div className="drawer-backdrop is-open" onClick={onClose} />
      <aside className="side-drawer holding-detail-drawer is-open" aria-label={`${name} 상세`}>
        <div className="drawer-heading">
          <div className="hdd-title">
            <TickerLogo ticker={ticker} name={name} size={36} />
            <div>
              <h2>{name}</h2>
              <span>{ticker ? `${ticker} · ` : ""}{money(Number(first.price || 0))}</span>
            </div>
          </div>
          <button className="ghost small-button" type="button" onClick={onClose}>닫기</button>
        </div>

        <div className="hdd-body">
          <div className="hdd-summary">
            <div><span>평가금액</span><strong>{money(agg.valueNative)}</strong></div>
            <div><span>원금</span><strong>{money(agg.costNative)}</strong></div>
            <div><span>총손익</span><strong className={signClass(gainNative)}>{change(gainNative)}</strong><small className={signClass(gainNative)}>{formatPercent(returnRate)}</small></div>
            <div><span>일 영향</span><strong className={agg.hasDay ? signClass(agg.dayMoveNative) : undefined}>{agg.hasDay ? change(agg.dayMoveNative) : "—"}</strong></div>
            <div><span>평단가</span><strong>{money(avgCost)}</strong></div>
            <div><span>수량</span><strong>{formatNumber(agg.qty, 4)}</strong></div>
            <div><span>비중</span><strong>{formatPercent(weight)}</strong></div>
          </div>

          {perShare > 0 ? (
            <div className="hdd-dividend">
              <span className="hdd-dividend-icon" aria-hidden="true">💰</span>
              <span className="hdd-dividend-label">예상 연 배당</span>
              <span className="hdd-dividend-main">{formatKrw(annualKrw)}</span>
              <span className="hdd-dividend-sub">수익률 {formatPercent(divYield)}</span>
            </div>
          ) : null}

          <div className="hdd-section-title">계좌별 보유 <span>{rows.length}개 계좌</span></div>
          <div className="hdd-accounts">
            {rows.map(({ h, v, ret }) => (
              <div className="hdd-account-row" key={`${h.investor}|${h.account}|${h.id}`}>
                <div className="hdd-account-id">
                  <strong>{h.account}</strong>
                  <small>{h.investor} · {formatNumber(h.quantity, 4)}주 · 평단 {money(h.averageCost)}</small>
                </div>
                <div className="hdd-account-figs">
                  <span className="hdd-account-val">{money(v.valueNative)}</span>
                  <span className={`hdd-account-gain ${signClass(v.gainNative) || ""}`}>{change(v.gainNative)} · {formatPercent(ret)}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="hdd-note">평단가 기준 세전 손익입니다. 실현손익·매매 이력은 현재 지원하지 않습니다.</p>
        </div>
      </aside>
    </>
  );
}

function computeSummary(state, rows) {
  const holdings = state?.holdings || [];
  const allCount = holdings.length;
  const visibleCount = rows.length;
  const times = holdings.map((h) => new Date(h.priceAsOf || 0).getTime()).filter(Number.isFinite).sort((a, b) => b - a);
  const latestPriceTime = times[0];
  const values = rows.map((h) => ({ holding: h, values: holdingValues(state, h), dailyMove: holdingDailyMove(state, h) }));
  const totalValue = values.reduce((s, r) => s + r.values.valueKrw, 0);
  const totalCost = values.reduce((s, r) => s + r.values.costKrw, 0);
  const totalGain = values.reduce((s, r) => s + r.values.gainKrw, 0);
  const totalDayMove = values.reduce((s, r) => s + (r.dailyMove.hasData ? r.dailyMove.valueKrw : 0), 0);
  const sorted = [...values].sort((a, b) => b.values.valueKrw - a.values.valueKrw).slice(0, 3);
  const topValue = sorted.reduce((s, r) => s + r.values.valueKrw, 0);
  const trunc = (s, max = 10) => (s.length > max ? s.slice(0, max) + "…" : s);
  return {
    allCount, visibleCount,
    priceMeta: latestPriceTime ? `${formatAsOf(new Date(latestPriceTime).toISOString())} 기준` : "가격 미조회",
    totalValue, totalGain, totalDayMove,
    returnRate: totalCost ? totalGain / totalCost : 0,
    concentration: totalValue ? topValue / totalValue : 0,
    topNames: sorted.map((r) => trunc(r.holding.name || r.holding.ticker)).join(" · ") || "-",
  };
}

function exportCsv(state, rows) {
  const header = ["투자자", "계좌", "전략", "종목명", "티커", "수량", "현재가", "평단가", "평가금액", "손익", "수익률", "통화"];
  const csvRows = rows.map((h) => {
    const v = holdingValues(state, h);
    const returnRate = v.costNative ? v.gainNative / v.costNative : 0;
    return [h.investor, h.account, h.strategy, h.name || h.ticker, h.ticker, h.quantity, h.price, h.averageCost, v.valueNative, v.gainNative, returnRate, h.currency];
  });
  const csv = [header, ...csvRows].map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stocklio-holdings-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("보유 종목 내보내기 완료", `${rows.length}개 종목 CSV`, "success");
}

// ─── 종목 추가/수정 드로어 (라이브 티커 검색 포함) ──────────────────
function HoldingDrawer({ state, holding, onClose }) {
  const editing = Boolean(holding);
  const accounts = useMemo(() => getKnownAccounts(state), [state]);
  const [accountKey, setAccountKey] = useState(holding ? accountKeyFor(holding) : "");
  const [accountType, setAccountType] = useState(normalizeAccountType(holding?.accountType));
  const [strategy, setStrategy] = useState(normalizeStrategy(holding?.strategy) || "QQQ");
  const [ticker, setTicker] = useState(holding?.ticker || "");
  const [name, setName] = useState(holding?.name || "");
  const [quantity, setQuantity] = useState(holding?.quantity ?? "");
  const [averageCost, setAverageCost] = useState(holding?.averageCost ?? "");
  const [targetPrice, setTargetPrice] = useState(holding?.targetPrice ?? "");
  const [stopLoss, setStopLoss] = useState(holding?.stopLoss ?? "");

  // 라이브 티커 검색 (디바운스 + seq race guard)
  const [suggestions, setSuggestions] = useState([]);
  const [searchMsg, setSearchMsg] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const seqRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const queueSearch = (query) => {
    window.clearTimeout(timerRef.current);
    const q = String(query || "").trim();
    if (q.length < 2) { setShowSuggestions(false); setSuggestions([]); setSearchMsg(""); return; }
    timerRef.current = window.setTimeout(async () => {
      const searchId = ++seqRef.current;
      setSuggestions([]); setSearchMsg("검색 중..."); setShowSuggestions(true);
      try {
        const results = await searchSymbols(q);
        if (searchId !== seqRef.current) return;
        setSuggestions(results);
        setSearchMsg(results.length ? "" : "검색 결과가 없습니다");
      } catch {
        if (searchId === seqRef.current) { setSuggestions([]); setSearchMsg("검색을 잠시 사용할 수 없습니다"); }
      }
    }, 220);
  };

  const onTickerChange = (value) => { setTicker(value); setName(""); queueSearch(value); };
  const pickSuggestion = (sym, nm) => {
    seqRef.current += 1;
    setTicker(sym || ""); setName(nm || sym || "");
    setShowSuggestions(false); setSuggestions([]);
  };

  const submit = (event) => {
    event.preventDefault();
    const acct = parseAccountKey(accountKey);
    const tk = String(ticker).trim().toUpperCase();
    const nm = String(name).trim() || tk || strategy;
    const avg = Number(averageCost);
    mutate((st) => {
      const existing = editing ? (st.holdings || []).find((h) => h.id === holding.id) : null;
      const currency = existing?.currency || (/^[0-9]{6}\.KS$/.test(tk) ? "KRW" : "USD");
      const next = {
        id: editing ? holding.id : makeId(),
        investor: acct.investor,
        account: acct.account,
        accountType: normalizeAccountType(accountType),
        strategy: normalizeStrategy(strategy),
        ticker: tk || nm,
        name: nm,
        quantity: Number(quantity),
        averageCost: avg,
        price: existing?.price ?? avg,
        currency,
        priceSource: existing?.priceSource || "사용자 입력",
        priceAsOf: existing?.priceAsOf || new Date().toISOString(),
        autoPrice: existing?.autoPrice ?? true,
        targetPrice: Number(targetPrice) || null,
        stopLoss: Number(stopLoss) || null,
      };
      st.holdings = editing
        ? st.holdings.map((h) => (h.id === holding.id ? { ...h, ...next } : h))
        : [...(st.holdings || []), next];
      return st;
    });
    if (editing) {
      setStatus("보유 종목 수정 완료", `${name} · ${acct.account}`);
      showToast("보유 종목 수정 완료", `${name} · ${formatNumber(Number(quantity), 4)}주`, "success");
    }
    onClose();
  };

  const strategyOpts = strategyBuckets([...(state?.holdings || []).map((h) => h.strategy), strategy]);

  return (
    <>
      <div className="drawer-backdrop is-open" onClick={onClose} />
      <aside className="side-drawer holding-drawer is-open" aria-label="보유 종목 입력">
        <div className="drawer-heading">
          <div>
            <h2>{editing ? "종목 수정" : "종목 추가"}</h2>
            <span>{editing ? "보유 포지션의 계좌, 전략, 수량, 평단가를 수정합니다." : "현재 보유 종목 목록에 새 포지션을 추가합니다."}</span>
          </div>
          <button className="ghost small-button" type="button" onClick={onClose}>닫기</button>
        </div>
        <form className="holding-form" onSubmit={submit}>
          <label>계좌
            <select aria-label="계좌 선택" required value={accountKey} onChange={(e) => setAccountKey(e.target.value)}>
              <option value="">계좌 선택</option>
              {accounts.map((a) => <option key={a.key} value={a.key}>{a.investor} · {a.account}</option>)}
            </select>
          </label>
          <label>계좌 유형
            <select required value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              <option value="direct_investment">직접투자 계좌</option>
              <option value="pension">연금 계좌</option>
            </select>
          </label>
          <label>전략
            <select required value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              {strategyOpts.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>종목명/티커
            <div className="ticker-search-field">
              <input placeholder="예: Apple 또는 AAPL" autoComplete="off" aria-label="티커 또는 종목명 검색"
                value={ticker}
                onChange={(e) => onTickerChange(e.target.value)}
                onFocus={() => queueSearch(ticker)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)} />
              <div className="ticker-suggestions" role="listbox" hidden={!showSuggestions}>
                {suggestions.length ? suggestions.map((r) => (
                  <button key={r.symbol} className="ticker-suggestion-button" type="button" role="option"
                    onMouseDown={(e) => { e.preventDefault(); pickSuggestion(r.symbol, r.name); }}>
                    <strong>{r.symbol}</strong>
                    <span>{r.name}</span>
                    <small>{[r.type, r.exchange].filter(Boolean).join(" · ") || "Yahoo Finance"}</small>
                  </button>
                )) : (searchMsg ? <div className="ticker-suggestion-empty">{searchMsg}</div> : null)}
              </div>
            </div>
          </label>
          <label>수량
            <input type="number" step="0.0001" min="0" placeholder="10" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <label>평단가
            <input type="number" step="0.01" min="0" placeholder="185.40" required value={averageCost} onChange={(e) => setAverageCost(e.target.value)} />
          </label>
          <input type="number" step="0.01" min="0" placeholder="목표가 (선택)" aria-label="목표가" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} />
          <input type="number" step="0.01" min="0" placeholder="손절가 (선택)" aria-label="손절가" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
          <div className="drawer-actions">
            <button type="submit">{editing ? "수정 저장" : "목록에 추가"}</button>
            <button className="ghost" type="button" onClick={onClose}>취소</button>
          </div>
        </form>
      </aside>
    </>
  );
}
