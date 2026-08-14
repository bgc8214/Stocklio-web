import React, { useEffect, useRef } from "react";
import { formatNumber } from "../../app/formatters.js";

// 차트 시리즈 색상(사용자 선호로 기존 색상 유지).
const SERIES_YEAR = "#4f7f36"; // 연 누적(green)
const SERIES_MONTH = "#1d6fa4"; // 월 누적(blue)
const SERIES_DAILY = "#c7433d"; // 일일 손익(red)

// performance-view.js 의 Chart.js 월별 손익 차트를 얇게 래핑한다.
// UMD 전역 window.Chart 를 useEffect 안에서 그대로 사용하고, cleanup 에서 destroy 한다.
export function MonthlyFlowChart({ source }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !window.Chart || !source?.points?.length) {
      return undefined;
    }
    const ctx = canvas.getContext("2d");
    if (window.ChartDataLabels) {
      window.Chart.register(window.ChartDataLabels);
    }
    const labelFormatter = (value) => (value != null ? formatNumber(value, 0) : "");
    const chart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: source.points.map((point) => point.label),
        datasets: [
          {
            label: source.yearLabel,
            data: source.points.map((point) => point.yearCumulativeMan),
            borderColor: SERIES_YEAR,
            backgroundColor: "rgba(190, 224, 166, 0.55)",
            borderWidth: 2.5,
            fill: "origin",
            pointRadius: 0,
            pointHitRadius: 10,
            tension: 0,
            datalabels: { align: "top", anchor: "end", color: SERIES_YEAR, font: { weight: "bold", size: 10 }, formatter: labelFormatter },
          },
          {
            label: source.monthLabel,
            data: source.points.map((point) => point.monthCumulativeMan),
            borderColor: SERIES_MONTH,
            backgroundColor: "rgba(93, 169, 233, 0.35)",
            borderWidth: 2.5,
            fill: false,
            pointRadius: 3,
            pointHitRadius: 10,
            tension: 0,
            datalabels: { align: "bottom", anchor: "end", color: SERIES_MONTH, font: { size: 10 }, formatter: labelFormatter },
          },
          {
            label: "일일 손익",
            data: source.points.map((point) => point.dailyMan),
            borderColor: SERIES_DAILY,
            backgroundColor: "rgba(199, 67, 61, 0.35)",
            borderWidth: 2,
            fill: false,
            pointRadius: 3,
            pointHitRadius: 10,
            tension: 0,
            datalabels: {
              align: (context) => (context.dataset.data[context.dataIndex] >= 0 ? "top" : "bottom"),
              anchor: (context) => (context.dataset.data[context.dataIndex] >= 0 ? "end" : "start"),
              color: "#c7433d",
              font: { size: 10 },
              formatter: labelFormatter,
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 16, bottom: 8 } },
        plugins: {
          legend: { display: true, position: "bottom" },
          tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${formatNumber(item.parsed.y, 0)}만원` } },
          datalabels: { display: true },
        },
        scales: { y: { ticks: { callback: (v) => formatNumber(v, 0) } } },
      },
    });
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [source]);

  return <canvas ref={canvasRef} aria-label="일별 투자손익 및 월/연 누적 차트" />;
}
