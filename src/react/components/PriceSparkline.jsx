import React from "react";

// 1년 종가 스파크라인 — 상세 차트가 아니라 추세 파악용이라 축·툴팁 없이
// 선 + 영역 + 52주 최고가 마커 + 마지막 종가 마커만 그리는 순수 SVG.
const W = 320;
const H = 72;
const PAD = 5;

export function PriceSparkline({ points }) {
  if (!Array.isArray(points) || points.length < 2) {
    return null;
  }
  const closes = points.map((p) => Number(p.close));
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const x = (i) => PAD + (i / (closes.length - 1)) * (W - PAD * 2);
  const y = (c) => H - PAD - ((c - min) / span) * (H - PAD * 2);
  const line = closes.map((c, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(c).toFixed(1)}`).join(" ");
  const area = `${line} L${x(closes.length - 1).toFixed(1)} ${H - PAD} L${x(0).toFixed(1)} ${H - PAD} Z`;
  const hi = closes.indexOf(max);
  const last = closes.length - 1;
  return (
    <svg className="price-sparkline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="최근 1년 종가 추이">
      <path className="price-sparkline-area" d={area} />
      <path className="price-sparkline-line" d={line} vectorEffect="non-scaling-stroke" />
      <circle className="price-sparkline-high" cx={x(hi).toFixed(1)} cy={y(max).toFixed(1)} r="3" />
      <circle className="price-sparkline-last" cx={x(last).toFixed(1)} cy={y(closes[last]).toFixed(1)} r="2.5" />
    </svg>
  );
}
