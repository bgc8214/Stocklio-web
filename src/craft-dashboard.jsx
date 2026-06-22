import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { dateKeyInTimeZone, getUsMarketContextForSeoulDate } from "./domain/market-calendar.js";

const DEFAULT_LAYOUT = [
  { id: "total-value", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-cost", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-gain", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "cash-total", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "fx-rate", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "allocation", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "performance-flow", widthPct: 100, span: 12, minHeight: 360, visible: true },
  { id: "breakdown", widthPct: 100, span: 12, minHeight: 320, visible: true },

];

const LABELS = {
  "total-value": "총자산",
  "total-cost": "주식 매입금액",
  "total-gain": "주식 평가손익",
  "cash-total": "예수금",
  "fx-rate": "USD/KRW",
  allocation: "자산 비중",
  "performance-flow": "성과 흐름",
  breakdown: "오늘 변동 원인",
  "top-mover": "오늘의 주인공",

};

const palette = ["#1F4431", "#3366a8", "#a97819", "#7b5aa6", "#b94343"];
const accountTypeLabels = {
  direct_investment: "직접투자 계좌",
  pension: "연금 계좌",
};
const allocationViewLabels = {
  strategy: "전략",
  holding: "종목",
  account: "계좌",
  investor: "투자자",
  accountType: "계좌 유형",
};

function CraftDashboardApp() {
  const [state, setState] = useState(null);
  const [editing, setEditing] = useState(false);
  const [stateRevision, setStateRevision] = useState(0);

  useEffect(() => {
    setState(window.StocklioApp?.getState?.() || null);

    const handleState = (event) => {
      setState(event.detail);
      setStateRevision((value) => value + 1);
    };
    window.addEventListener("stocklio:state", handleState);
    return () => window.removeEventListener("stocklio:state", handleState);
  }, []);

  const layout = useMemo(() => normalizeLayout(state?.dashboardLayout), [state?.dashboardLayout]);
  const visibleCount = layout.filter((item) => item.visible !== false).length;

  const saveLayout = useCallback(
    (nextLayout) => {
      const normalized = normalizeLayout(nextLayout);
      setState((current) => (current ? { ...current, dashboardLayout: normalized } : current));
      setStateRevision((value) => value + 1);
      window.StocklioApp?.setDashboardLayout?.(normalized);
    },
    [setState],
  );

  useEffect(() => {
    const editButton = document.querySelector("#layoutEditButton");
    const resetButton = document.querySelector("#layoutResetButton");
    const status = document.querySelector("#layoutStatus");
    if (!editButton || !resetButton || !status) {
      return undefined;
    }
    const handleEdit = () => setEditing((value) => !value);
    const handleReset = () => {
      setEditing(false);
      saveLayout(DEFAULT_LAYOUT);
    };
    editButton.textContent = editing ? "완료" : "편집";
    resetButton.hidden = !editing;
    status.textContent = editing ? `${visibleCount}/${layout.length} 카드` : "";
    editButton.addEventListener("click", handleEdit);
    resetButton.addEventListener("click", handleReset);
    return () => {
      editButton.removeEventListener("click", handleEdit);
      resetButton.removeEventListener("click", handleReset);
    };
  }, [editing, layout.length, saveLayout, visibleCount]);

  if (!state) {
    return <div className="empty-state">대시보드를 불러오는 중입니다</div>;
  }

  return (
    <React.Fragment>
      {layout.map((item) =>
        item.visible === false && !editing ? null : (
          <DashboardCard
            key={item.id}
            item={item}
            appState={state}
            editing={editing}
            layout={layout}
            saveLayout={saveLayout}
          />
        ),
      )}
    </React.Fragment>
  );
}

function DashboardCard({ item, appState, editing, layout, saveLayout }) {
  const [draft, setDraft] = useState(null);
  const resizeActiveRef = useRef(false);

  const activeItem = draft || item;
  const style = {
    "--card-span": activeItem.span,
    "--card-width-pct": `${activeItem.widthPct}%`,
    "--card-min-height": `${activeItem.minHeight}px`,
  };

  const handleResizeStart = (event) => {
    if (resizeActiveRef.current) {
      return;
    }
    resizeActiveRef.current = true;
    event.preventDefault();
    event.stopPropagation();
    const card = event.target.closest("[data-dashboard-card]");
    const start = {
      x: event.clientX,
      y: event.clientY,
      span: item.span,
      widthPct: item.widthPct,
      height: card.getBoundingClientRect().height,
    };
    const board = document.querySelector("#dashboardBoard");
    const boardWidth = Math.max(1, board?.clientWidth || card.parentElement?.clientWidth || 1);
    const moveEventName = event.type === "mousedown" ? "mousemove" : "pointermove";
    const upEventName = event.type === "mousedown" ? "mouseup" : "pointerup";
    const handleMove = (moveEvent) => {
      const widthPct = clamp(start.widthPct + ((moveEvent.clientX - start.x) / boardWidth) * 100, 18, 100);
      const next = {
        ...item,
        widthPct,
        span: clamp(Math.round((widthPct / 100) * 12), 2, 12),
        minHeight: clamp(Math.round(start.height + moveEvent.clientY - start.y), 112, 720),
      };
      setDraft(next);
    };
    const handleUp = (upEvent) => {
      window.removeEventListener(moveEventName, handleMove);
      const widthPct = clamp(start.widthPct + ((upEvent.clientX - start.x) / boardWidth) * 100, 18, 100);
      const next = {
        ...item,
        widthPct: roundTo(widthPct, 0.1),
        span: clamp(Math.round((widthPct / 100) * 12), 2, 12),
        minHeight: clamp(Math.round(start.height + upEvent.clientY - start.y), 112, 720),
      };
      setDraft(null);
      resizeActiveRef.current = false;
      saveLayout(layout.map((layoutItem) => (layoutItem.id === item.id ? next : layoutItem)));
    };
    window.addEventListener(moveEventName, handleMove);
    window.addEventListener(upEventName, handleUp, { once: true });
  };

  // mousedown 기반 drag (HTML5 drag API 대신 — 브라우저 호환성 완벽)
  const dragActiveRef = useRef(false);

  const handleMoveStart = (event) => {
    if (!editing) return;
    if (event.target.closest(".layout-resize-handle, button, select, input, .layout-visibility-button")) return;
    if (resizeActiveRef.current) return;

    event.preventDefault();
    dragActiveRef.current = true;
    const card = event.currentTarget;
    card.classList.add("is-dragging");

    const moveEvent = event.type === "mousedown" ? "mousemove" : "pointermove";
    const upEvent = event.type === "mousedown" ? "mouseup" : "pointerup";

    const handleMove = (e) => {
      if (!dragActiveRef.current) return;
      // 현재 마우스 위치 아래의 카드 찾기
      card.style.pointerEvents = "none"; // 자기 자신 무시
      const el = document.elementFromPoint(e.clientX, e.clientY);
      card.style.pointerEvents = "";
      const targetCard = el?.closest("[data-dashboard-card]");
      document.querySelectorAll(".is-drag-over").forEach(x => x.classList.remove("is-drag-over"));
      if (targetCard && targetCard !== card) {
        targetCard.classList.add("is-drag-over");
      }
    };

    const handleUp = (e) => {
      window.removeEventListener(moveEvent, handleMove);
      dragActiveRef.current = false;
      card.classList.remove("is-dragging");

      card.style.pointerEvents = "none";
      const el = document.elementFromPoint(e.clientX, e.clientY);
      card.style.pointerEvents = "";
      const targetCard = el?.closest("[data-dashboard-card]");
      document.querySelectorAll(".is-drag-over").forEach(x => x.classList.remove("is-drag-over"));

      if (targetCard && targetCard !== card) {
        const sourceId = item.id;
        const targetId = targetCard.dataset.dashboardCard;
        if (sourceId && targetId && sourceId !== targetId) {
          // 소스가 타깃보다 앞에 있으면 타깃 뒤에, 뒤에 있으면 타깃 앞에 삽입
          const sourceIndex = layout.findIndex(l => l.id === sourceId);
          const targetIndex = layout.findIndex(l => l.id === targetId);
          const insertAfter = sourceIndex < targetIndex;
          saveLayout(reorderLayout(layout, sourceId, targetId, insertAfter));
        }
      }
    };

    window.addEventListener(moveEvent, handleMove);
    window.addEventListener(upEvent, handleUp, { once: true });
  };

  const handleToggle = (event) => {
    event.stopPropagation();
    saveLayout(layout.map((layoutItem) => (layoutItem.id === item.id ? { ...layoutItem, visible: layoutItem.visible === false } : layoutItem)));
  };

  const className = [
    cardClass(item.id),
    "dashboard-card",
    editing ? "is-layout-editing" : "",
    item.visible === false && editing ? "is-hidden-card" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={className}
      data-dashboard-card={item.id}
      onMouseDown={handleMoveStart}
      onPointerDown={handleMoveStart}
      style={style}
    >
      {editing ? (
        <div className="layout-controls">
          <span className="layout-drag-handle">이동</span>
          <span className="layout-card-label">{LABELS[item.id] || item.id}</span>
          <span className="layout-size-readout">
            {Math.round(activeItem.widthPct)}% · {Math.round(activeItem.minHeight)}px
          </span>
          <button className="ghost layout-visibility-button" type="button" onClick={handleToggle}>
            {item.visible === false ? "표시" : "숨김"}
          </button>
        </div>
      ) : null}
      {editing ? (
        <span
          className="layout-resize-handle"
          aria-label="카드 크기 조절"
          onMouseDown={handleResizeStart}
          onPointerDown={handleResizeStart}
        />
      ) : null}
      <CardContent id={item.id} state={appState} />
    </article>
  );
}

function CardContent({ id, state }) {
  const totals = getTotals(state);
  const cm = useCurrencyMode();
  const fmt = makeFmt(cm, state.fxRate);
  if (id === "total-value") {
    const marketContext = getCurrentMarketContext();
    const latestPriceAsOf = [...state.holdings]
      .filter((h) => h.priceAsOf)
      .sort((a, b) => String(b.priceAsOf).localeCompare(String(a.priceAsOf)))[0]?.priceAsOf || state.fxRate?.asOf;
    const isRealDate = latestPriceAsOf && /^\d{4}-\d{2}-\d{2}/.test(latestPriceAsOf);
    const dateText = isRealDate ? `${formatShortDate(latestPriceAsOf.slice(0, 10))} 종가` : (marketContext.isMarketClosed ? marketContext.label : "");
    const fxText = state.fxRate?.rate ? `USD/KRW ${formatNumber(state.fxRate.rate, 2)}` : "";
    const marketText = marketContext.isMarketClosed ? marketContext.closedReason || "미국장 휴장" : "";
    const badges = [dateText, fxText, marketText].filter(Boolean);
    const returnSign = totals.gainKrw >= 0 ? "+" : "";
    const returnCls = totals.gainKrw >= 0 ? "positive" : "negative";
    return (
      <>
        <span>총자산</span>
        <strong>{fmt(totals.valueKrw)}</strong>
        <small>{`주식 ${fmt(totals.stockValueKrw)} · 예수금 ${fmt(totals.cashKrw)}`}</small>
        <div className="metric-badges">
          {badges.map((b) => <span key={b} className="metric-badge">{b}</span>)}
          <span className={`metric-return-badge ${returnCls}`}>{returnSign}{formatPercent(totals.returnRate)}</span>
        </div>
      </>
    );
  }
  if (id === "total-cost") {
    const stockCount = state.holdings.filter((h) => h.type !== "cash").length;
    return <Metric label="주식 매입금액" value={fmt(totals.costKrw)} hint={`${stockCount}개 종목 · 평단 기준`} />;
  }
  if (id === "total-gain") {
    return <Metric label="주식 평가순익" value={fmt(totals.gainKrw)} hint={formatPercent(totals.returnRate)} tone={totals.gainKrw >= 0 ? "positive" : "negative"} />;
  }
  if (id === "cash-total") {
    return <Metric label="예수금" value={fmt(totals.cashKrw)} hint="총자산에 포함" />;
  }
  if (id === "fx-rate") {
    return <Metric label="USD/KRW" value={formatNumber(state.fxRate?.rate || 0, 2)} hint={`${state.fxRate?.source || "환율 기준"} · ${formatAsOf(state.fxRate?.asOf)}`} />;
  }
  if (id === "allocation") {
    return <AllocationPanel state={state} />;
  }
  if (id === "performance-flow") {
    return <PerformancePanel state={state} />;
  }
  if (id === "top-mover") {
    return <TopMoverPanel state={state} />;
  }


  return <BreakdownPanel state={state} />;
}

function Metric({ label, value, hint, tone }) {
  return (
    <>
      <span>{label}</span>
      <strong className={tone || ""}>{value}</strong>
      <small className={tone || ""}>{hint}</small>
    </>
  );
}

function AllocationPanel({ state }) {
  const [view, setView] = useState("strategy");
  const items = getAllocationItems(state, view);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <>
      <div className="section-heading">
        <div className="section-heading-title">
          <h2>자산 비중</h2>
          <span className="section-badge">{items.length}개 {allocationViewLabels[view] || "항목"}</span>
        </div>
        <span>현재 평가가격 기준</span>
        <select
          aria-label="자산 비중 기준"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          {Object.entries(allocationViewLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}별</option>
          ))}
        </select>
      </div>
      <div className="donut-wrap">
        <svg viewBox="0 0 220 220" role="img" aria-label="자산 비중 차트">
          <circle cx="110" cy="110" r="78" fill="none" stroke="#e6ebe5" strokeWidth="28" />
          {donutRings(items)}
          <text x="110" y="106" textAnchor="middle" fontSize="19" fontWeight="800" fill="#17211b">
            {items.length}
          </text>
          <text x="110" y="130" textAnchor="middle" fontSize="12" fill="#66736b">
            {allocationViewLabels[view]}
          </text>
        </svg>
        <div className="legend">
          {items.map((item, index) => (
            <div className="legend-row" key={item.label}>
              <span className="swatch" style={{ background: palette[index % palette.length] }} />
              <span>{item.label}</span>
              <strong>{formatPercent(total ? item.value / total : 0)}<small>{formatKrw(item.value)}</small></strong>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PerformancePanel({ state }) {
  const points = [...(state.portfolioSnapshots || [])].slice(-20);
  if (!points.length) {
    return <div className="empty-state">저장된 성과 스냅샷이 없습니다</div>;
  }
  const latest = points[points.length - 1];
  const first = points[0];
  const previous = points[points.length - 2];
  const dailyChange = previous ? latest.totalValueKrw - previous.totalValueKrw : 0;
  const periodChange = latest.totalValueKrw - first.totalValueKrw;
  const maxDrawdown = getMaxDrawdown(points);
  const max = Math.max(...points.map((point) => point.totalValueKrw));
  const min = Math.min(...points.map((point) => point.totalValueKrw));
  const span = Math.max(1, max - min);
  const chartWidth = 1000;
  const chartHeight = 280;
  const padding = { left: 72, right: 28, top: 28, bottom: 48 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const coordinates = points.map((point, index) => {
    const x = padding.left + (points.length === 1 ? plotWidth : (plotWidth * index) / (points.length - 1));
    const y = padding.top + plotHeight - ((Number(point.totalValueKrw || 0) - min) / span) * plotHeight;
    return { x, y, point };
  });
  const linePath = coordinates.map((item, index) => `${index === 0 ? "M" : "L"}${item.x.toFixed(1)} ${item.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coordinates[coordinates.length - 1].x.toFixed(1)} ${chartHeight - padding.bottom} L${coordinates[0].x.toFixed(1)} ${chartHeight - padding.bottom} Z`;
  const gridLines = [0, 0.33, 0.66, 1].map((ratio) => {
    const y = padding.top + plotHeight * ratio;
    const value = max - span * ratio;
    return { y, value };
  });
  return (
    <>
      <div className="section-heading">
        <h2>성과 흐름</h2>
        <span>금액과 증감</span>
      </div>
      <div className="performance-stats">
        <div>
          <span>최근 총자산</span>
          <strong>{formatKrw(latest.totalValueKrw)}</strong>
        </div>
        <div>
          <span>최근 일 증감</span>
          <strong className={dailyChange >= 0 ? "positive" : "negative"}>{formatKrw(dailyChange)}</strong>
        </div>
        <div>
          <span>표시기간 증감</span>
          <strong className={periodChange >= 0 ? "positive" : "negative"}>{formatKrw(periodChange)}</strong>
        </div>
        <div>
          <span>최대 낙폭</span>
          <strong className="negative">{formatKrw(maxDrawdown)}</strong>
        </div>
      </div>
      <div className="dashboard-line-chart" aria-label="성과 차트">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="총자산 추이 차트">
          <defs>
            <linearGradient id="dashboardAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(31, 68, 49, 0.24)" />
              <stop offset="100%" stopColor="rgba(31, 68, 49, 0.05)" />
            </linearGradient>
          </defs>
          {gridLines.map((line) => (
            <g key={line.y}>
              <line className="trend-grid" x1={padding.left} x2={chartWidth - padding.right} y1={line.y} y2={line.y} />
              <text className="dashboard-chart-axis" x={padding.left - 14} y={line.y + 5} textAnchor="end">
                {formatCompactKrw(line.value)}
              </text>
            </g>
          ))}
          <path className="trend-area" d={areaPath} />
          <path className="trend-line" d={linePath} />
          {coordinates.map(({ x, y, point }, index) => {
            const prev = coordinates[index - 1];
            const dailyChange = prev ? point.totalValueKrw - prev.point.totalValueKrw : 0;
            const isPositive = dailyChange >= 0;
            const arrow = isPositive ? "▲" : "▼";
            const changeClass = isPositive ? "tooltip-positive" : "tooltip-negative";
            const tooltipWidth = 160;
            const tooltipHeight = 64;
            const tooltipX = Math.max(padding.left, Math.min(chartWidth - padding.right - tooltipWidth, x - tooltipWidth / 2));
            const tooltipY = Math.max(6, y - tooltipHeight - 12);
            return (
              <g key={point.id || point.date} className="trend-point-group" tabIndex={0}
                aria-label={`${point.date} 총자산 ${formatKrw(point.totalValueKrw)}, 일 증감 ${isPositive ? "+" : ""}${formatKrw(dailyChange)}`}>
                <circle className="trend-hit" cx={x} cy={y} r="13" />
                <circle className="trend-point" cx={x} cy={y} r="2.5" />
                <g className="trend-tooltip" transform={`translate(${tooltipX} ${tooltipY})`}>
                  <rect width={tooltipWidth} height={tooltipHeight} rx="8" />
                  <text className="tooltip-date" x="12" y="19">{formatMonthDay(point.date)}</text>
                  <text className="tooltip-value" x="12" y="38">{formatKrw(point.totalValueKrw)}</text>
                  <text className={changeClass} x="12" y="56">{arrow} {formatKrw(Math.abs(dailyChange))}</text>
                </g>
              </g>
            );
          })}
          {[coordinates[0], coordinates[Math.floor(coordinates.length / 2)], coordinates[coordinates.length - 1]]
            .filter(Boolean)
            .map(({ x, point }, index) => (
              <text key={`${point.date}-${index}`} className="trend-label" x={x} y={chartHeight - 14} textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}>
                {formatShortDate(point.date)}
              </text>
            ))}
          <text className="trend-last-label" x={coordinates[coordinates.length - 1].x - 6} y={Math.max(16, coordinates[coordinates.length - 1].y - 10)} textAnchor="end">
            {formatCompactKrw(latest.totalValueKrw)}
          </text>
        </svg>
      </div>
    </>
  );
}

function getMaxDrawdown(points) {
  let peak = Number(points[0]?.totalValueKrw || 0);
  let drawdown = 0;
  for (const point of points) {
    const value = Number(point.totalValueKrw || 0);
    peak = Math.max(peak, value);
    drawdown = Math.min(drawdown, value - peak);
  }
  return drawdown;
}

function BreakdownPanel({ state }) {
  const marketContext = getCurrentMarketContext();
  const movers = getDailyMoveRows(state, marketContext).slice(0, 5);
  const refreshImpact = getRecentPriceRefreshImpact(state);
  const accountTypeRows = (state.holdings || []).map((holding) => ({ ...holding, accountType: formatAccountType(holding.accountType) }));
  const fallbackRows = [...groupByValue(state.holdings || [], state, "investor"), ...groupByValue(accountTypeRows, state, "accountType")];
  const netMove = movers.reduce((sum, item) => sum + item.value, 0);
  const priceEffect = movers.reduce((sum, item) => sum + item.priceEffectKrw, 0);
  const fxEffect = movers.reduce((sum, item) => sum + item.fxEffectKrw, 0);
  const insight = dailyMoveInsight(movers, netMove, priceEffect, fxEffect);
  return (
    <>
      <div className="section-heading">
        <h2>오늘 변동 원인</h2>
        <span>종목 기여도</span>
      </div>
      <div className="breakdown-list">
        {movers.length ? (
          <>
            <div className="daily-move-summary">
              <span>오늘 추정 변동</span>
              <strong className={netMove >= 0 ? "positive" : "negative"}>{formatKrw(netMove)}</strong>
              <small>가격 {priceEffect >= 0 ? "+" : ""}{formatCompactKrw(priceEffect)} · 환율 {fxEffect >= 0 ? "+" : ""}{formatCompactKrw(fxEffect)}</small>
            </div>
            <div className="daily-move-insight">{insight}</div>
            {movers.map((item) => (
              <div className="daily-move-row" key={item.id || item.ticker}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.ticker} · {dailyMoveDetail(item)} · 영향 {formatPercent(Math.abs(item.contributionShare || 0))}</small>
                </div>
                <span className={item.value >= 0 ? "positive" : "negative"}>{item.value >= 0 ? "+" : ""}{formatKrw(item.value)}</span>
              </div>
            ))}
            {refreshImpact && Math.abs(refreshImpact.totalDeltaKrw) > Math.max(100000, Math.abs(netMove) * 3) ? <PriceRefreshImpact impact={refreshImpact} compact /> : null}
          </>
        ) : (
          <>
            {marketContext.isMarketClosed ? (
              <>
                <div className="daily-move-empty">
                  <strong>미국장 {marketContext.closedReason || "휴장"}에는 새 종목별 변동을 표시하지 않습니다</strong>
                  <span>{marketContext.label}입니다. 총자산 변화가 있다면 입출금 또는 환율/현금 변화일 수 있습니다.</span>
                </div>
                <div className="breakdown-subtitle">구성 참고</div>
                {fallbackRows.map((item, index) => (
                  <div className="breakdown-row" key={`${item.label}-${index}`}>
                    <span className="swatch" style={{ background: palette[index % palette.length] }} />
                    <span>{item.label}</span>
                    <strong>{formatKrw(item.value)}</strong>
                  </div>
                ))}
              </>
            ) : refreshImpact?.rows?.length ? (
              <PriceRefreshImpact impact={refreshImpact} />
            ) : (
              <>
                <div className="daily-move-empty">
                  <strong>가격 갱신 후 원인을 분석할 수 있습니다</strong>
                  <span>전일 대비 가격 데이터가 없는 캐시나 일부 종목 실패가 있으면 원인 분석이 제한됩니다. 가격을 다시 가져오면 새 데이터로 분석합니다.</span>
                </div>
                <div className="breakdown-subtitle">구성 참고</div>
                {fallbackRows.map((item, index) => (
                  <div className="breakdown-row" key={`${item.label}-${index}`}>
                    <span className="swatch" style={{ background: palette[index % palette.length] }} />
                    <span>{item.label}</span>
                    <strong>{formatKrw(item.value)}</strong>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

function getDailyMoveRows(state, marketContext = null) {
  if (marketContext?.isMarketClosed) {
    return [];
  }
  const byTicker = new Map();
  for (const holding of (state.holdings || [])) {
    const move = getHoldingDailyMove(state, holding);
    if (!move.hasData) continue;
    const key = holding.ticker;
    if (byTicker.has(key)) {
      const existing = byTicker.get(key);
      existing.quantity += Number(holding.quantity || 0);
      existing.value += move.valueKrw;
      existing.priceEffectKrw += move.priceEffectKrw;
      existing.fxEffectKrw += move.fxEffectKrw;
    } else {
      byTicker.set(key, {
        id: holding.id,
        name: holding.name || holding.ticker,
        ticker: holding.ticker,
        quantity: Number(holding.quantity || 0),
        value: move.valueKrw,
        priceEffectKrw: move.priceEffectKrw,
        fxEffectKrw: move.fxEffectKrw,
        changePercent: move.changePercent,
        hasData: true,
      });
    }
  }
  const rows = [...byTicker.values()]
    .filter((item) => item.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const grossMove = rows.reduce((sum, row) => sum + Math.abs(row.value), 0);
  return rows.map((row) => ({ ...row, contributionShare: grossMove ? Math.abs(row.value) / grossMove : 0 }));
}

function getHoldingDailyMove(state, holding) {
  const priceChange = Number(holding.priceChange);
  const changePercent = Number(holding.priceChangePercent || 0);
  if (!Number.isFinite(priceChange)) {
    return { hasData: false, valueKrw: 0, priceEffectKrw: 0, fxEffectKrw: 0, changePercent: 0 };
  }
  const currentFx = Number(state.fxRate?.rate || 1);
  const previousFx = Number(state.fxRate?.previousClose || state.fxRate?.rate || 1);
  const quantity = Number(holding.quantity || 0);
  const isUsd = holding.currency === "USD";
  const currentPrice = Number(holding.price);
  const priceEffectKrw = quantity * priceChange * (isUsd ? previousFx : 1);
  const fxEffectKrw = isUsd && Number.isFinite(currentPrice) ? quantity * currentPrice * (currentFx - previousFx) : 0;
  return {
    hasData: true,
    valueKrw: priceEffectKrw + fxEffectKrw,
    priceEffectKrw,
    fxEffectKrw,
    changePercent,
  };
}

function getCurrentMarketContext() {
  return getUsMarketContextForSeoulDate(dateKeyInTimeZone(new Date(), "Asia/Seoul"));
}

function PriceRefreshImpact({ impact, compact = false }) {
  const rows = (impact.rows || []).slice(0, compact ? 3 : 5);
  return (
    <>
      <div className="daily-move-summary price-refresh-impact">
        <span>{compact ? "이번 가격 갱신 전후" : "최근 가격 갱신 영향"}</span>
        <strong className={impact.totalDeltaKrw >= 0 ? "positive" : "negative"}>{impact.totalDeltaKrw >= 0 ? "+" : ""}{formatKrw(impact.totalDeltaKrw)}</strong>
        <small>{formatAsOf(impact.at)} · 갱신 전 {formatCompactKrw(impact.previousTotalKrw)} → 갱신 후 {formatCompactKrw(impact.nextTotalKrw)}</small>
      </div>
      <div className="daily-move-insight">{priceRefreshImpactInsight(impact)}</div>
      {rows.map((item) => (
        <div className="daily-move-row" key={`${item.id || item.ticker}-refresh-impact`}>
          <div>
            <strong>{item.name}</strong>
            <small>{item.ticker} · {formatCompactKrw(item.beforeValueKrw)} → {formatCompactKrw(item.afterValueKrw)}</small>
          </div>
          <span className={item.deltaKrw >= 0 ? "positive" : "negative"}>{item.deltaKrw >= 0 ? "+" : ""}{formatKrw(item.deltaKrw)}</span>
        </div>
      ))}
    </>
  );
}

function getRecentPriceRefreshImpact(state) {
  const impact = state.lastPriceRefreshImpact;
  if (!impact?.at || !Array.isArray(impact.rows)) {
    return null;
  }
  const ageMs = Date.now() - new Date(impact.at).getTime();
  if (!Number.isFinite(ageMs) || ageMs > 24 * 60 * 60 * 1000) {
    return null;
  }
  return impact;
}

function priceRefreshImpactInsight(impact) {
  const top = impact.rows?.[0];
  if (!top || Math.abs(impact.totalDeltaKrw) < 1000) {
    return "이번 가격 갱신으로 평가금액 변화가 거의 없었습니다.";
  }
  const direction = impact.totalDeltaKrw >= 0 ? "증가" : "감소";
  return `이번 ${direction}는 ${top.name} 등 Yahoo 가격으로 바뀐 종목 영향이 큽니다.`;
}

function dailyMoveDetail(item) {
  if (Math.abs(item.fxEffectKrw) >= 1000) {
    return `가격 ${item.priceEffectKrw >= 0 ? "+" : ""}${formatCompactKrw(item.priceEffectKrw)} · 환율 ${item.fxEffectKrw >= 0 ? "+" : ""}${formatCompactKrw(item.fxEffectKrw)}`;
  }
  return `${formatNumber(item.quantity, 4)}주 · ${formatPercent(item.changePercent)}`;
}

function dailyMoveInsight(movers, netMove, priceEffect, fxEffect) {
  const top = movers.slice(0, 2).map((item) => item.name).filter(Boolean);
  if (!top.length || Math.abs(netMove) < 1000) {
    return "오늘은 뚜렷하게 총자산을 움직인 종목이 없습니다.";
  }
  const direction = netMove >= 0 ? "증가" : "하락";
  const main = top.join(", ");
  if (Math.abs(fxEffect) > Math.abs(priceEffect) * 0.35) {
    const fxDirection = fxEffect >= 0 ? "환율 상승" : "환율 하락";
    return `오늘 ${direction}는 ${main}와 ${fxDirection} 영향이 큽니다.`;
  }
  return `오늘 ${direction}는 ${main}의 가격 변동이 대부분 설명합니다.`;
}

function normalizeAccountType(value) {
  return ["pension", "irp", "retirement_pension"].includes(String(value || "")) ? "pension" : "direct_investment";
}

function formatAccountType(value) {
  return accountTypeLabels[normalizeAccountType(value)] || "직접투자 계좌";
}

function normalizeLayout(layout) {
  const defaults = new Map(DEFAULT_LAYOUT.map((item) => [item.id, item]));
  const sizeToSpan = { small: 3, medium: 4, wide: 6, full: 12 };
  const seen = new Set();
  const next = [];
  for (const item of Array.isArray(layout) ? layout : []) {
    if (!defaults.has(item.id) || seen.has(item.id)) {
      continue;
    }
    const fallback = defaults.get(item.id);
    const span = clamp(Math.round(Number(item.span ?? sizeToSpan[item.size] ?? fallback.span)), 2, 12);
    const widthPct = Number(item.widthPct ?? (span / 12) * 100);
    next.push({
      id: item.id,
      widthPct: clamp(roundTo(widthPct, 0.1), 18, 100),
      span,
      minHeight: clamp(Math.round(Number(item.minHeight ?? fallback.minHeight)), 112, 720),
      visible: item.visible !== false,
    });
    seen.add(item.id);
  }
  for (const fallback of DEFAULT_LAYOUT) {
    if (!seen.has(fallback.id)) {
      next.push({ ...fallback });
    }
  }
  return next;
}

function reorderLayout(layout, sourceId, targetId, insertAfter) {
  const next = [...layout];
  const sourceIndex = next.findIndex((item) => item.id === sourceId);
  if (sourceIndex < 0) {
    return next;
  }
  const [source] = next.splice(sourceIndex, 1);
  const targetIndex = next.findIndex((item) => item.id === targetId);
  next.splice(targetIndex + (insertAfter ? 1 : 0), 0, source);
  return next;
}

function shouldDropAfter(event, target) {
  const rect = target.getBoundingClientRect();
  return event.clientY > rect.top + rect.height / 2 || event.clientX > rect.left + rect.width / 2;
}

function cardClass(id) {
  return ["allocation", "performance-flow", "breakdown"].includes(id) ? "panel" : "metric";
}

function layoutKey(layout) {
  return layout.map((item) => `${item.id}:${item.span}:${item.minHeight}:${item.visible}`).join("|");
}

function getTotals(state) {
  const fx = Number(state.fxRate?.rate || 1);
  const holdings = state.holdings || [];
  const cashKrw = getCashTotalKrw(state);
  const stockValueKrw = holdings.reduce((sum, holding) => sum + getHoldingValues(holding, fx).valueKrw, 0);
  const costKrw = holdings.reduce((sum, holding) => sum + getHoldingValues(holding, fx).costKrw, 0);
  const gainKrw = stockValueKrw - costKrw;
  return {
    valueKrw: stockValueKrw + cashKrw,
    stockValueKrw,
    cashKrw,
    costKrw,
    gainKrw,
    returnRate: costKrw ? gainKrw / costKrw : 0,
  };
}

function getHoldingValues(holding, fx) {
  const multiplier = holding.currency === "USD" ? fx : 1;
  const valueNative = Number(holding.quantity || 0) * Number(holding.price || 0);
  const costNative = Number(holding.quantity || 0) * Number(holding.averageCost || 0);
  return {
    valueKrw: valueNative * multiplier,
    costKrw: costNative * multiplier,
  };
}

function getCashTotalKrw(state) {
  const fx = Number(state.fxRate?.rate || 1);
  return (state.cashBalances || []).reduce((sum, cash) => sum + Number(cash.amount || 0) * (cash.currency === "USD" ? fx : 1), 0);
}

function getAllocationItems(state, dimension = "strategy") {
  if (dimension === "holding") {
    return aggregateAllocationItems(addCashToAllocation(groupByResolver(state, (holding) => holding.name || holding.ticker), state, () => "예수금"));
  }
  if (dimension === "account") {
    return aggregateAllocationItems(addCashToAllocation(groupByResolver(state, (holding) => `${holding.investor} · ${holding.account}`), state, (cash) => `${cash.investor} · ${cash.account}`));
  }
  if (dimension === "investor") {
    return aggregateAllocationItems(addCashToAllocation(groupByResolver(state, (holding) => holding.investor), state, (cash) => cash.investor));
  }
  if (dimension === "accountType") {
    return aggregateAllocationItems(addCashToAllocation(groupByResolver(state, (holding) => formatAccountType(holding.accountType)), state, () => "직접투자 계좌"));
  }
  return aggregateAllocationItems(addCashToAllocation(groupByResolver(state, (holding) => holding.strategy || "기타"), state, () => "예수금"));
}

function groupByResolver(state, resolver) {
  const fx = Number(state.fxRate?.rate || 1);
  const map = new Map();
  for (const holding of state.holdings || []) {
    const label = resolver(holding) || "미분류";
    map.set(label, (map.get(label) || 0) + getHoldingValues(holding, fx).valueKrw);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function addCashToAllocation(items, state, resolver) {
  const fx = Number(state.fxRate?.rate || 1);
  const map = new Map(items.map((item) => [item.label, item.value]));
  for (const cash of state.cashBalances || []) {
    const label = resolver(cash) || "예수금";
    const value = Number(cash.amount || 0) * (cash.currency === "USD" ? fx : 1);
    map.set(label, (map.get(label) || 0) + value);
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

function groupByValue(holdings, state, key) {
  const fx = Number(state.fxRate?.rate || 1);
  const map = new Map();
  for (const holding of holdings) {
    const label = holding[key] || "미분류";
    map.set(label, (map.get(label) || 0) + getHoldingValues(holding, fx).valueKrw);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function donutRings(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return items.map((item, index) => {
    const ratio = total ? item.value / total : 0;
    const dash = ratio * circumference;
    const ring = (
      <circle
        key={item.label}
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke={palette[index % palette.length]}
        strokeWidth="28"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 110 110)"
      />
    );
    offset += dash;
    return ring;
  });
}

function formatKrw(value) {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(value || 0)}원`;
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value || 0);
}

function useCurrencyMode() {
  const [mode, setMode] = useState(() => localStorage.getItem("currencyMode") === "usd" ? "usd" : "krw");
  useEffect(() => {
    const handler = (e) => setMode(e.detail);
    window.addEventListener("currencyModeChange", handler);
    return () => window.removeEventListener("currencyModeChange", handler);
  }, []);
  return mode;
}

function makeFmt(mode, fxRate) {
  if (mode === "krw") return (v) => formatKrw(v);
  const fx = fxRate?.rate || 1;
  return (v) => formatUsd(v / fx);
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits }).format(value || 0);
}

function formatCompactKrw(value) {
  return new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

function formatPercent(value) {
  return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

function formatMonthDay(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatAsOf(value) {
  if (!value || value === "샘플" || value === "Sample") {
    return "샘플";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}


function TopMoverPanel({ state }) {
  const cm = useCurrencyMode();
  const fmt = makeFmt(cm, state.fxRate);
  const marketContext = getCurrentMarketContext();
  if (marketContext.isMarketClosed) {
    return (
      <>
        <div className="section-heading"><h2>오늘의 주인공</h2><span>가격 갱신 기준</span></div>
        <div className="empty-state">미국장 {marketContext.closedReason || "휴장"}</div>
      </>
    );
  }
  const rows = (state.holdings || []).map((h) => ({
    holding: h,
    dailyMove: getHoldingDailyMove(state, h),
  })).filter((r) => r.dailyMove.hasData);
  if (!rows.length) {
    return (
      <>
        <div className="section-heading"><h2>오늘의 주인공</h2><span>가격 갱신 기준</span></div>
        <div className="empty-state">가격 변동 데이터가 없습니다</div>
      </>
    );
  }
  rows.sort((a, b) => Math.abs(b.dailyMove.valueKrw) - Math.abs(a.dailyMove.valueKrw));
  const top = rows[0];
  const h = top.holding;
  const m = top.dailyMove;
  const positive = m.valueKrw >= 0;
  const fallbackLetter = (h.ticker || h.name || "?").replace(/[^A-Za-z0-9가-힣]/g, "")[0]?.toUpperCase() || "?";
  return (
    <>
      <div className="section-heading"><h2>오늘의 주인공</h2><span>가격 갱신 기준</span></div>
      <div className="top-mover-row">
        <span className="ticker-logo" style={{ width: 40, height: 40 }}>
          <img
            src={`https://assets.parqet.com/logos/symbol/${encodeURIComponent(h.ticker)}?format=svg`}
            alt={h.ticker} width="40" height="40"
            onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
          <span className="ticker-logo-fallback" style={{ display: "none", width: 40, height: 40, fontSize: 16 }}>{fallbackLetter}</span>
        </span>
        <div className="top-mover-info">
          <strong>{h.name || h.ticker}</strong>
          <span className="top-mover-meta">{h.ticker} · {h.account}</span>
        </div>
        <div className="top-mover-values">
          <span className={`top-mover-change ${positive ? "positive" : "negative"}`}>{positive ? "+" : ""}{fmt(m.valueKrw)}</span>
          <span className={`top-mover-pct ${positive ? "positive" : "negative"}`}>{formatPercent(m.changePercent)}</span>
        </div>
      </div>
    </>
  );
}


const root = document.querySelector("#dashboardBoard");
if (root) {
  root.classList.add("craft-dashboard-board");
  createRoot(root).render(<CraftDashboardApp />);
}
