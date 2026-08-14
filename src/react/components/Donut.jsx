import React from "react";
import { palette } from "../../app/constants.js";
import { formatKrw, formatPercent } from "../../app/formatters.js";

// dashboard-view.renderDonut/renderAllocationLegend 를 JSX 로 이식한 도넛+범례.
export function Donut({ items, centerLabel, radius = 78, strokeWidth = 28, center = 110, compact = false }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const rings = items.map((item, index) => {
    const ratio = total ? item.value / total : 0;
    const dash = ratio * circumference;
    const ring = (
      <circle
        key={item.label}
        cx={center} cy={center} r={radius} fill="none"
        stroke={palette[index % palette.length]} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    );
    offset += dash;
    return ring;
  });
  const viewBox = center === 90 ? "0 0 180 180" : "0 0 220 220";
  return (
    <>
      <svg viewBox={viewBox} role="img" aria-label="자산 비중 차트">
        <circle cx={center} cy={center} r={radius} fill="none" style={{ stroke: "var(--line)" }} strokeWidth={strokeWidth} />
        {rings}
        <text x={center} y={center - 4} textAnchor="middle" fontSize={center === 90 ? 17 : 19} fontWeight="800" style={{ fill: "var(--value)" }}>{items.length}</text>
        <text x={center} y={center + 18} textAnchor="middle" fontSize="12" style={{ fill: "var(--muted)" }}>{centerLabel}</text>
      </svg>
      <div className={compact ? "legend compact-legend" : "legend"}>
        {items.length ? items.map((item, index) => {
          const pct = total ? item.value / total : 0;
          return (
            <div className="legend-row" key={item.label}>
              <span className="swatch" style={{ background: palette[index % palette.length] }} />
              <span title={item.label}>{item.label}</span>
              <strong>{formatPercent(pct)}{compact ? null : <small>{formatKrw(item.value)}</small>}</strong>
            </div>
          );
        }) : <div className="empty-state">표시할 자산이 없습니다</div>}
      </div>
    </>
  );
}
