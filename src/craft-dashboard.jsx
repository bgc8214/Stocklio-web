import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Editor, Frame, Element, useNode } from "@craftjs/core";

const DEFAULT_LAYOUT = [
  { id: "total-value", span: 3, minHeight: 128, visible: true },
  { id: "total-cost", span: 3, minHeight: 128, visible: true },
  { id: "total-gain", span: 3, minHeight: 128, visible: true },
  { id: "cash-total", span: 3, minHeight: 128, visible: true },
  { id: "fx-rate", span: 3, minHeight: 128, visible: true },
  { id: "allocation", span: 6, minHeight: 320, visible: true },
  { id: "performance-flow", span: 6, minHeight: 320, visible: true },
  { id: "breakdown", span: 6, minHeight: 320, visible: true },
];

const LABELS = {
  "total-value": "총 자산",
  "total-cost": "주식 매입금액",
  "total-gain": "평가손익",
  "cash-total": "예수금",
  "fx-rate": "USD/KRW",
  allocation: "자산 비중",
  "performance-flow": "성과 흐름",
  breakdown: "상세 분해",
};

const palette = ["#1f7a5b", "#3366a8", "#a97819", "#7b5aa6", "#b94343"];

function CraftDashboardApp() {
  const [state, setState] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/state")
      .then((response) => response.json())
      .then(setState)
      .catch(() => setState(window.StocklioApp?.getState?.() || null));

    const handleState = (event) => setState(event.detail);
    window.addEventListener("stocklio:state", handleState);
    return () => window.removeEventListener("stocklio:state", handleState);
  }, []);

  const layout = useMemo(() => normalizeLayout(state?.dashboardLayout), [state?.dashboardLayout]);
  const visibleCount = layout.filter((item) => item.visible !== false).length;

  const saveLayout = useCallback(
    (nextLayout) => {
      const normalized = normalizeLayout(nextLayout);
      setState((current) => (current ? { ...current, dashboardLayout: normalized } : current));
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
    editButton.textContent = editing ? "편집 완료" : "레이아웃 편집";
    status.textContent = editing ? `${visibleCount}/${layout.length} 카드 표시 · Craft.js 캔버스 편집 중` : `${visibleCount}/${layout.length} 카드 표시`;
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
    <Editor enabled={editing} resolver={{ CraftCard, CraftCanvas }}>
      <Frame key={`${layoutKey(layout)}:${editing}`}>
        <Element is={CraftCanvas} canvas>
          {layout.map((item) =>
            item.visible === false && !editing ? null : (
              <Element
                key={item.id}
                is={CraftCard}
                canvas={false}
                item={item}
                appState={state}
                editing={editing}
                layout={layout}
                saveLayout={saveLayout}
              />
            ),
          )}
        </Element>
      </Frame>
    </Editor>
  );
}

function CraftCanvas({ children }) {
  return <>{children}</>;
}

function CraftCard({ item, appState, editing, layout, saveLayout }) {
  const {
    connectors: { connect, drag },
  } = useNode();
  const [draft, setDraft] = useState(null);

  const activeItem = draft || item;
  const style = {
    "--card-span": activeItem.span,
    "--card-min-height": `${activeItem.minHeight}px`,
  };

  const handleResizeStart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const card = event.currentTarget.closest("[data-dashboard-card]");
    const start = {
      x: event.clientX,
      y: event.clientY,
      span: item.span,
      height: card.getBoundingClientRect().height,
    };
    const columnWidth = getDashboardColumnWidth();
    const handleMove = (moveEvent) => {
      const next = {
        ...item,
        span: clamp(start.span + Math.round((moveEvent.clientX - start.x) / columnWidth), 2, 12),
        minHeight: clamp(Math.round(start.height + moveEvent.clientY - start.y), 112, 720),
      };
      setDraft(next);
    };
    const handleUp = (upEvent) => {
      window.removeEventListener("pointermove", handleMove);
      const next = {
        ...item,
        span: clamp(start.span + Math.round((upEvent.clientX - start.x) / columnWidth), 2, 12),
        minHeight: clamp(Math.round(start.height + upEvent.clientY - start.y), 112, 720),
      };
      setDraft(null);
      saveLayout(layout.map((layoutItem) => (layoutItem.id === item.id ? next : layoutItem)));
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  };

  const handleDragStart = (event) => {
    if (!editing || event.target.closest(".layout-resize-handle, button")) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
  };

  const handleDrop = (event) => {
    if (!editing) {
      return;
    }
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === item.id) {
      return;
    }
    saveLayout(reorderLayout(layout, sourceId, item.id, shouldDropAfter(event, event.currentTarget)));
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
      ref={(node) => node && connect(drag(node))}
      className={className}
      data-dashboard-card={item.id}
      draggable={editing}
      onDragStart={handleDragStart}
      onDragOver={(event) => editing && event.preventDefault()}
      onDrop={handleDrop}
      style={style}
    >
      {editing ? (
        <div className="layout-controls">
          <span className="layout-drag-handle">이동</span>
          <span className="layout-card-label">{LABELS[item.id] || item.id}</span>
          <span className="layout-size-readout">
            {activeItem.span}/12 · {Math.round(activeItem.minHeight)}px
          </span>
          <button className="ghost layout-visibility-button" type="button" onClick={handleToggle}>
            {item.visible === false ? "표시" : "숨김"}
          </button>
          <span className="layout-resize-handle" onPointerDown={handleResizeStart} aria-label="카드 크기 조절" />
        </div>
      ) : null}
      <CardContent id={item.id} state={appState} />
    </article>
  );
}

function CardContent({ id, state }) {
  const totals = getTotals(state);
  if (id === "total-value") {
    return <Metric label="총 자산" value={formatKrw(totals.valueKrw)} hint={`주식 ${formatKrw(totals.stockValueKrw)} · 예수금 ${formatKrw(totals.cashKrw)}`} />;
  }
  if (id === "total-cost") {
    return <Metric label="주식 매입금액" value={formatKrw(totals.costKrw)} hint="평단 기준" />;
  }
  if (id === "total-gain") {
    return <Metric label="평가손익" value={formatKrw(totals.gainKrw)} hint={formatPercent(totals.returnRate)} tone={totals.gainKrw >= 0 ? "positive" : "negative"} />;
  }
  if (id === "cash-total") {
    return <Metric label="예수금" value={formatKrw(totals.cashKrw)} hint="총자산에 포함" />;
  }
  if (id === "fx-rate") {
    return <Metric label="USD/KRW" value={formatNumber(state.fxRate?.rate || 0, 2)} hint={`${state.fxRate?.source || "가격 데이터"} · ${formatAsOf(state.fxRate?.asOf)}`} />;
  }
  if (id === "allocation") {
    return <AllocationPanel state={state} />;
  }
  if (id === "performance-flow") {
    return <PerformancePanel state={state} />;
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
  const items = getAllocationItems(state);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <>
      <div className="section-heading">
        <h2>자산 비중</h2>
        <span>전략별</span>
      </div>
      <div className="donut-wrap">
        <svg viewBox="0 0 220 220" role="img" aria-label="자산 비중 차트">
          <circle cx="110" cy="110" r="78" fill="none" stroke="#e6ebe5" strokeWidth="28" />
          {donutRings(items)}
          <text x="110" y="106" textAnchor="middle" fontSize="19" fontWeight="800" fill="#17211b">
            {items.length}
          </text>
          <text x="110" y="130" textAnchor="middle" fontSize="12" fill="#66736b">
            전략
          </text>
        </svg>
        <div className="legend">
          {items.map((item, index) => (
            <div className="legend-row" key={item.label}>
              <span className="swatch" style={{ background: palette[index % palette.length] }} />
              <span>{item.label}</span>
              <strong>{formatPercent(total ? item.value / total : 0)}</strong>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PerformancePanel({ state }) {
  const points = [...(state.portfolioSnapshots || [])].slice(-8);
  if (!points.length) {
    return <div className="empty-state">저장된 성과 스냅샷이 없습니다</div>;
  }
  const latest = points[points.length - 1];
  const first = points[0];
  const previous = points[points.length - 2];
  const dailyChange = previous ? latest.totalValueKrw - previous.totalValueKrw : 0;
  const periodChange = latest.totalValueKrw - first.totalValueKrw;
  const max = Math.max(...points.map((point) => point.totalValueKrw));
  const min = Math.min(...points.map((point) => point.totalValueKrw));
  const span = Math.max(1, max - min);
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
      </div>
      <div className="bar-chart" aria-label="성과 차트">
        {points.map((point, index) => {
          const previousPoint = points[index - 1];
          const change = previousPoint ? point.totalValueKrw - previousPoint.totalValueKrw : 0;
          const height = Math.max(42, Math.round(((point.totalValueKrw - min) / span) * 120) + 52);
          return (
            <div className="bar" key={point.id || point.date}>
              <div className="bar-value">{formatCompactKrw(point.totalValueKrw)}</div>
              <div className="bar-fill" style={{ height }} title={formatKrw(point.totalValueKrw)} />
              <span>{formatShortDate(point.date)}</span>
              <small className={change >= 0 ? "positive" : "negative"}>{previousPoint ? formatCompactKrw(change) : "-"}</small>
            </div>
          );
        })}
      </div>
    </>
  );
}

function BreakdownPanel({ state }) {
  const rows = [...groupByValue(state.holdings || [], state, "investor"), ...groupByValue(state.holdings || [], state, "accountType")];
  return (
    <>
      <div className="section-heading">
        <h2>상세 분해</h2>
        <span>투자자와 계좌 유형</span>
      </div>
      <div className="breakdown-list">
        {rows.map((item, index) => (
          <div className="breakdown-row" key={`${item.label}-${index}`}>
            <span className="swatch" style={{ background: palette[index % palette.length] }} />
            <span>{item.label}</span>
            <strong>{formatKrw(item.value)}</strong>
          </div>
        ))}
      </div>
    </>
  );
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
    next.push({
      id: item.id,
      span: clamp(Math.round(Number(item.span ?? sizeToSpan[item.size] ?? fallback.span)), 2, 12),
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

function getDashboardColumnWidth() {
  const board = document.querySelector("#dashboardBoard");
  if (!board) {
    return 1;
  }
  const styles = getComputedStyle(board);
  const columns = styles.gridTemplateColumns.split(" ").filter(Boolean);
  const columnCount = columns.length || 1;
  const gap = Number.parseFloat(styles.columnGap || "0") || 0;
  return Math.max(1, (board.clientWidth - gap * (columnCount - 1)) / columnCount + gap);
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

function getAllocationItems(state) {
  const grouped = groupByValue(state.holdings || [], state, "strategy");
  const cash = getCashTotalKrw(state);
  if (cash > 0) {
    grouped.push({ label: "예수금", value: cash });
  }
  return grouped.sort((a, b) => b.value - a.value);
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
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value || 0);
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

const root = document.querySelector("#dashboardBoard");
if (root) {
  createRoot(root).render(<CraftDashboardApp />);
}
