import React, { useMemo, useState } from "react";
import { useStore } from "../store/useStore.js";
import { getTotals, holdingValues, getAllocationItems } from "../store/selectors.js";
import { showToast } from "../store/mutations.js";
import { MonthlyFlowChart } from "../components/MonthlyFlowChart.jsx";
import { Donut } from "../components/Donut.jsx";
import { formatKrw, formatCompactKrw, formatNumber, formatPercent, formatShortDate, formatMonthDay } from "../../app/formatters.js";
import {
  filterSnapshotRows,
  getSnapshotRows as selectSnapshotRows,
  getMonthlyRows as selectMonthlyRows,
  getAvailableMonths,
  getMonthlyFlowChartSource,
  getPerformanceStats,
  getAccountPerformanceRows as selectAccountPerformanceRows,
  downsampleToWeekly,
} from "../../app/performance-selectors.js";

const RANGE_LABELS = { all: "전체 기간", ytd: "올해", "30d": "최근 30일", "7d": "최근 7일" };

// 손익 색: 양수=상승(빨강), 음수=하락(파랑), 0=중립. 0을 상승색으로 칠하지 않는다.
const signClass = (v) => (v > 0 ? "positive" : v < 0 ? "negative" : undefined);

export function PerformanceView() {
  const state = useStore((s) => s.portfolio);
  const [range, setRange] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [contributionView, setContributionView] = useState("account");
  const [selectedFlowMonth, setSelectedFlowMonth] = useState(null);

  const allRows = useMemo(() => selectSnapshotRows(state?.portfolioSnapshots), [state]);
  const rows = useMemo(() => filterSnapshotRows(allRows, range), [allRows, range]);

  const stats = rows.length > 0 ? getPerformanceStats(rows) : null;
  // 입금/출금 기록이 하나도 없으면 투자손익(= 증감 − 입출금)이 부풀려질 수 있음을 안내한다.
  const hasExternalFlows = useMemo(
    () => (state?.cashFlows || []).some((f) => f.type === "deposit" || f.type === "withdrawal"),
    [state],
  );

  // 월별 손익 차트
  const flowSource = useMemo(
    () => getMonthlyFlowChartSource(rows, allRows, selectedFlowMonth),
    [rows, allRows, selectedFlowMonth],
  );
  const availableMonths = useMemo(() => getAvailableMonths(allRows), [allRows]);
  const latestYm = allRows[allRows.length - 1]?.date.slice(0, 7);
  const activeMonth = selectedFlowMonth || latestYm;

  // 스냅샷/월별 테이블
  const snapshotRows = useMemo(() => {
    const base = dayFilter === "7d" ? rows.slice(-7) : dayFilter === "30d" ? rows.slice(-30) : rows;
    return base.slice().reverse();
  }, [rows, dayFilter]);
  const monthlyRows = useMemo(() => selectMonthlyRows(rows).reverse(), [rows]);

  // 기여 분석
  const strategyRows = useMemo(() => getStrategyPerformanceRows(state), [state]);
  const accountRows = useMemo(() => selectAccountPerformanceRows(state?.accountSnapshots, rows), [state, rows]);

  const copySummary = () => {
    if (!stats) { showToast("복사 실패", "성과 데이터가 없습니다", "error"); return; }
    const lines = [
      `성과 요약 (${RANGE_LABELS[range]})`,
      `최근 총자산: ${formatKrw(stats.latest.totalValueKrw)} (${stats.latest.date})`,
      `기간 증감: ${formatKrw(stats.periodChangeKrw)} (${formatPercent(stats.periodReturn)})`,
      `투자손익: ${formatKrw(stats.investmentGainKrw)}`,
      `월 누적: ${formatKrw(stats.monthToDateGainKrw)} (${formatPercent(stats.monthToDateReturn)})`,
      `최대 낙폭: ${formatKrw(stats.maxDrawdownKrw)} (${formatPercent(stats.maxDrawdownRate)})`,
    ];
    navigator.clipboard.writeText(lines.join("\n"))
      .then(() => showToast("요약 복사 완료", "클립보드에 복사했습니다", "success"))
      .catch(() => showToast("복사 실패", "클립보드 접근이 거부되었습니다", "error"));
  };

  const exportCsv = () => {
    if (!rows.length) { showToast("내보내기 실패", "성과 데이터가 없습니다", "error"); return; }
    const header = ["날짜", "총자산(원)", "일 증감(원)", "입출금(원)", "투자손익(원)", "일 수익률", "월 누적(원)"];
    const csvRows = rows.slice().reverse().map((row) => [
      row.date, row.totalValueKrw, row.dailyChangeKrw ?? "", row.netInflowKrw ?? "", row.investmentGainKrw ?? "",
      row.dailyReturn != null ? (row.dailyReturn * 100).toFixed(2) + "%" : "", row.monthToDateInvestmentGainKrw ?? "",
    ]);
    const csv = [header, ...csvRows].map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stocklio-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("성과 내보내기 완료", `${rows.length}개 일자 CSV`, "success");
  };

  return (
    <section className="performance-view" data-view="performance">
      <div className="performance-header panel">
        <div className="performance-header-left">
          <h2>성과 분석</h2>
          <span>총자산, 투자손익, 현금흐름 보정을 한 화면에서 확인</span>
        </div>
        <div className="performance-header-actions">
          <select aria-label="성과 기간" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="all">전체 기간</option>
            <option value="ytd">올해</option>
            <option value="30d">최근 30일</option>
            <option value="7d">최근 7일</option>
          </select>
          <button className="secondary" type="button" onClick={copySummary}>요약 복사</button>
          <button className="primary" type="button" onClick={exportCsv}>CSV 내보내기</button>
        </div>
      </div>

      <div className="performance-kpi-row panel">
        <div className="performance-detail-stats">
          {stats ? (
            <>
              <div><span>기간 증감</span><strong className={signClass(stats.periodChangeKrw)}>{formatKrw(stats.periodChangeKrw)}</strong><small>{formatPercent(stats.periodReturn)}</small></div>
              <div><span>입출금</span><strong>{formatKrw(stats.netInflowKrw)}</strong><small>외부 현금흐름</small></div>
              <div><span>투자손익</span><strong className={signClass(stats.investmentGainKrw)}>{formatKrw(stats.investmentGainKrw)}</strong><small>증감 - 입출금</small></div>
              <div><span>월 누적</span><strong className={signClass(stats.monthToDateGainKrw)}>{formatKrw(stats.monthToDateGainKrw)}</strong><small>{formatPercent(stats.monthToDateReturn)}</small></div>
              <div><span>최대 낙폭</span><strong className={signClass(stats.maxDrawdownKrw)}>{formatKrw(stats.maxDrawdownKrw)}</strong><small>{formatPercent(stats.maxDrawdownRate)}</small></div>
            </>
          ) : null}
        </div>
      </div>

      {stats && !hasExternalFlows ? (
        <div className="perf-flow-warning panel" role="note">
          <span className="perf-flow-warning-icon" aria-hidden="true">⚠️</span>
          <div className="perf-flow-warning-body">
            <strong>입출금 기록이 없어 투자손익이 부풀려질 수 있어요</strong>
            <span>매달 납입·인출을 <b>입출금 탭</b>에 기록하면 “투자손익 = 총자산 증감 − 입출금”이 정확해집니다.</span>
          </div>
        </div>
      ) : null}

      <div className="panel performance-chart-panel performance-full-panel">
        <div className="section-heading">
          <div>
            <h2>손익 흐름</h2>
            <span>{flowSource.points.length ? `${flowSource.monthLabel} · 단위 만원` : "손익 데이터 없음"}</span>
          </div>
          {availableMonths.length > 1 ? (
            <div className="monthly-flow-month-nav" aria-label="월 선택">
              <select className="monthly-flow-month-select" aria-label="월 선택" value={activeMonth} onChange={(e) => setSelectedFlowMonth(e.target.value)}>
                {availableMonths.slice().reverse().map((ym) => {
                  const [y, m] = ym.split("-");
                  return <option key={ym} value={ym}>{y}년 {Number(m)}월</option>;
                })}
              </select>
            </div>
          ) : null}
        </div>
        <div className={`monthly-flow-chart-wrap${flowSource.points.length > 0 && flowSource.points.length < 3 ? " is-sparse" : ""}`}>
          {flowSource.points.length ? <MonthlyFlowChart source={flowSource} /> : <div className="empty-state">선택 기간에 표시할 스냅샷이 없습니다</div>}
        </div>
        {flowSource.points.length > 0 && flowSource.points.length < 3 ? (
          <p className="monthly-flow-hint">아직 이 달의 스냅샷이 적어요. 매일 기록이 쌓이면 추세가 채워집니다.</p>
        ) : null}
        {flowSource.points.length ? (
          <details className="monthly-flow-source-details">
            <summary>표로 보기</summary>
            <div className="table-wrap monthly-flow-source-wrap">
              <table className="monthly-flow-source-table">
                <caption>일별 투자손익 상세</caption>
                <thead>
                  <tr><th /> {flowSource.points.map((p) => <th key={p.date}>{p.label}</th>)}</tr>
                </thead>
                <tbody>
                  {flowSource.rows.map((row) => (
                    <tr key={row.label}><th>{row.label}</th>{row.values.map((v, i) => <td key={i}>{formatNumber(v, 0)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </div>

      <div className="performance-tables-row">
        <div className="panel performance-detail-panel" style={{ alignSelf: "start" }}>
          <div className="section-heading"><h2>월별 요약</h2><span>스냅샷 집계 기준</span></div>
          <div className="table-wrap compact tall">
            <table>
              <thead><tr><th>월</th><th>월초 총자산</th><th>월말 총자산</th><th>월 증감</th></tr></thead>
              <tbody>
                {monthlyRows.length ? monthlyRows.map((row) => (
                  <tr key={row.month}>
                    <td data-label="월">{row.month}</td>
                    <td data-label="월초 총자산">{formatKrw(row.startValueKrw)}</td>
                    <td data-label="월말 총자산">{formatKrw(row.endValueKrw)}</td>
                    <td data-label="월 증감" className={signClass(row.changeKrw)}>{formatKrw(row.changeKrw)}</td>
                  </tr>
                )) : <tr><td colSpan={4}>한 달치 기록이 쌓이면 월별 분석이 시작됩니다</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel performance-detail-panel" style={{ alignSelf: "start" }}>
          <div className="section-heading">
            <div><h2>일별 성과</h2><span>일별 스냅샷 기준</span></div>
            <select aria-label="일별 성과 날짜 범위" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
              <option value="all">전체 일자</option>
              <option value="30d">최근 30일</option>
              <option value="7d">최근 7일</option>
            </select>
          </div>
          <div className="table-wrap compact tall">
            <table>
              <thead><tr><th>날짜</th><th>총자산</th><th>일 증감</th><th>투자손익</th><th>일 수익률</th><th>월 누적</th></tr></thead>
              <tbody>
                {snapshotRows.length ? snapshotRows.map((row) => (
                  <tr key={row.date}>
                    <td data-label="날짜">{row.date}</td>
                    <td data-label="총자산">{formatKrw(row.totalValueKrw)}</td>
                    <td data-label="일 증감" className={signClass(row.dailyChangeKrw)}>{formatKrw(row.dailyChangeKrw)}</td>
                    <td data-label="투자손익" className={signClass(row.investmentGainKrw)}>{formatKrw(row.investmentGainKrw)}</td>
                    <td data-label="일 수익률" className={signClass(row.dailyReturn)}>{formatPercent(row.dailyReturn)}</td>
                    <td data-label="월 누적" className={signClass(row.monthToDateInvestmentGainKrw)}>{formatKrw(row.monthToDateInvestmentGainKrw)}</td>
                  </tr>
                )) : <tr><td colSpan={6}>성과 기록이 아직 없습니다</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <details className="panel performance-detail-panel performance-full-panel" open>
        <summary><h2>자산 구성 분석</h2><span>현재 평가금액 기준</span></summary>
        <div className="allocation-overview-grid">
          <AllocationArticle title="전략별" sub="투자 의도" items={getAllocationItems(state, "strategy")} center="전략" />
          <AllocationArticle title="종목별" sub="상위 보유" items={getAllocationItems(state, "holding")} center="종목" />
          <AllocationArticle title="계좌별" sub="운용 위치" items={getAllocationItems(state, "account")} center="계좌" />
          <AllocationArticle title="계좌 유형" sub="직접투자/연금" items={getAllocationItems(state, "accountType")} center="유형" />
        </div>
      </details>

      <details className="panel performance-detail-panel performance-full-panel" open>
        <summary>
          <div className="section-heading-title">
            <h2>기여 분석</h2>
            <span>{contributionView === "account" ? "선택 기간 총자산 증감에 대한 계좌별 기여" : "현재 보유 기준 전략별 평가손익"}</span>
          </div>
          <div className="segmented-control compact-segmented contribution-view-toggle" role="group" aria-label="기여 분석 기준" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={contributionView === "account" ? "is-active" : undefined} onClick={() => setContributionView("account")}>계좌별</button>
            <button type="button" className={contributionView === "strategy" ? "is-active" : undefined} onClick={() => setContributionView("strategy")}>전략별</button>
          </div>
        </summary>
        <div className="contribution-list">
          {contributionView === "strategy" ? <StrategyContribution rows={strategyRows} /> : <AccountContribution rows={accountRows} />}
        </div>
      </details>

      <details className="panel performance-detail-panel performance-full-panel">
        <summary><h2>총자산 추세</h2><span>입출금 보정 후 누적 자산 금액의 변화를 확인합니다.</span></summary>
        <div className="trend-chart" aria-label="총자산 추이 차트">
          <TrendChart rows={rows} />
        </div>
      </details>
    </section>
  );
}

function AllocationArticle({ title, sub, items, center }) {
  return (
    <article>
      <div className="mini-chart-heading"><strong>{title}</strong><span>{sub}</span></div>
      <div className="mini-donut-wrap">
        <Donut items={items} centerLabel={center} radius={60} strokeWidth={22} center={90} compact />
      </div>
    </article>
  );
}

function StrategyContribution({ rows }) {
  if (!rows.length) return <div className="empty-state">보유 종목이 없습니다</div>;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.gainKrw)), 1);
  return rows.map((row) => {
    const cls = signClass(row.gainKrw);
    const sign = row.gainKrw > 0 ? "+" : "";
    return (
      <div className="contribution-row" key={row.strategy}>
        <div className="contribution-row-head">
          <div><strong>{row.strategy}</strong><small>{formatPercent(row.weight)} · {formatNumber(row.count)}개 · {formatKrw(row.valueKrw)}</small></div>
          <strong className={cls}>{sign}{formatKrw(row.gainKrw)} ({sign}{formatPercent(row.returnRate)})</strong>
        </div>
        <div className="contribution-bar"><span style={{ width: `${Math.min(100, (Math.abs(row.gainKrw) / maxAbs) * 100)}%` }} /></div>
      </div>
    );
  });
}

function AccountContribution({ rows }) {
  if (!rows.length) return <div className="empty-state">계좌별 성과 기록이 없습니다</div>;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.periodChangeKrw)), 1);
  return rows.map((row) => (
    <div className="contribution-row" key={`${row.investor}-${row.account}`}>
      <div className="contribution-row-head">
        <div><strong>{row.account}</strong><small>{row.investor} · {formatKrw(row.latestValueKrw)}</small></div>
        <strong className={signClass(row.periodChangeKrw)}>{formatKrw(row.periodChangeKrw)}</strong>
      </div>
      <div className="contribution-bar"><span style={{ width: `${Math.min(100, (Math.abs(row.periodChangeKrw) / maxAbs) * 100)}%` }} /></div>
    </div>
  ));
}

function getStrategyPerformanceRows(state) {
  const totals = getTotals(state);
  const holdings = state?.holdings || [];
  const map = new Map();
  for (const h of holdings) {
    const label = h.strategy || "기타";
    map.set(label, (map.get(label) || 0) + holdingValues(state, h).valueKrw);
  }
  return [...map.entries()].map(([label, value]) => {
    const groupHoldings = holdings.filter((h) => (h.strategy || "기타") === label);
    const costKrw = groupHoldings.reduce((sum, h) => sum + holdingValues(state, h).costKrw, 0);
    const gainKrw = groupHoldings.reduce((sum, h) => sum + holdingValues(state, h).gainKrw, 0);
    return {
      strategy: label,
      valueKrw: value,
      weight: totals.stockValueKrw ? value / totals.stockValueKrw : 0,
      gainKrw,
      returnRate: costKrw ? gainKrw / costKrw : 0,
      count: groupHoldings.length,
    };
  }).sort((a, b) => b.valueKrw - a.valueKrw);
}

// performance-view.buildTrendChartSvg 를 JSX 로 이식.
function TrendChart({ rows }) {
  if (rows.length < 2) {
    return <div className="empty-state">하루만 더 지나면 추이 차트가 그려집니다</div>;
  }
  const { points: chartRows, isDownsampled } = downsampleToWeekly(rows);
  const isMobile = window.innerWidth <= 640;
  const width = isMobile ? 380 : 1200;
  const height = isMobile ? 300 : 260;
  const padding = isMobile ? { top: 26, right: 16, bottom: 40, left: 60 } : { top: 22, right: 48, bottom: 34, left: 88 };
  const values = chartRows.map((r) => r.totalValueKrw);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const xFor = (i) => padding.left + (i / Math.max(1, chartRows.length - 1)) * (width - padding.left - padding.right);
  const yFor = (v) => padding.top + ((max - v) / span) * (height - padding.top - padding.bottom);
  const line = chartRows.map((r, i) => `${xFor(i)},${yFor(r.totalValueKrw)}`).join(" ");
  const area = `${padding.left},${height - padding.bottom} ${line} ${width - padding.right},${height - padding.bottom}`;
  const tickCount = isMobile ? 4 : 5;
  const valueLabels = Array.from({ length: tickCount }, (_, i) => max - (span / (tickCount - 1)) * i);
  const changeLabel = isDownsampled ? "주간 증감" : "일 증감";
  const gainLabel = isDownsampled ? "주간 투자손익" : "투자손익";
  const labelRows = [chartRows[0], chartRows[Math.floor(chartRows.length / 2)], chartRows[chartRows.length - 1]];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="총자산 추이">
      {valueLabels.map((v, i) => (
        <polyline key={`grid-${i}`} className="trend-grid" points={`${padding.left},${yFor(v)} ${width - padding.right},${yFor(v)}`} />
      ))}
      <polygon className="trend-area" points={area} />
      <polyline className="trend-line" points={line} />
      {!isMobile && chartRows.map((row, i) => {
        const x = xFor(i);
        const y = yFor(row.totalValueKrw);
        const isAbove = y > padding.top + (height - padding.top - padding.bottom) / 2;
        return <text key={`plabel-${i}`} className="trend-point-label" x={x} y={isAbove ? y - 10 : y + 16} textAnchor="middle">{formatCompactKrw(row.totalValueKrw)}</text>;
      })}
      {chartRows.map((row, i) => {
        const x = xFor(i);
        const y = yFor(row.totalValueKrw);
        const prev = chartRows[i - 1];
        const dc = Number(row.dailyChangeKrw ?? (prev ? row.totalValueKrw - prev.totalValueKrw : 0));
        const gain = Number(row.investmentGainKrw || 0);
        const dr = Number(row.dailyReturn || 0);
        const tw = 168, th = 96;
        const tx = Math.max(padding.left, Math.min(width - padding.right - tw, x - tw / 2));
        const ty = Math.max(6, y - th - 12);
        const pos = dc >= 0;
        return (
          <g key={`pt-${i}`} className="trend-point-group" tabIndex={0} aria-label={`${row.date} 총자산 ${formatKrw(row.totalValueKrw)}, ${changeLabel} ${pos ? "+" : ""}${formatKrw(dc)}, ${gainLabel} ${formatKrw(gain)}, 수익률 ${formatPercent(dr)}`}>
            <circle className="trend-hit" cx={x} cy={y} r="13" />
            <circle className="trend-point" cx={x} cy={y} r="2.5" />
            <g className="trend-tooltip" transform={`translate(${tx} ${ty})`}>
              <rect width={tw} height={th} rx="8" />
              <text className="tooltip-date" x="12" y="19">{isDownsampled ? `${formatMonthDay(row.weekStartDate || row.date)} 주` : formatMonthDay(row.date)}</text>
              <text className="tooltip-value" x="12" y="38">{formatKrw(row.totalValueKrw)}</text>
              <text className={pos ? "tooltip-positive" : "tooltip-negative"} x="12" y="56">{pos ? "▲" : "▼"} {formatKrw(Math.abs(dc))}</text>
              <text className={gain >= 0 ? "tooltip-positive" : "tooltip-negative"} x="12" y="74">{gainLabel} {formatKrw(gain)}</text>
              <text className="tooltip-return" x="12" y="90">수익률 {formatPercent(dr)}</text>
            </g>
          </g>
        );
      })}
      {labelRows.map((row, i) => (
        <text key={`xl-${i}`} className="trend-label" x={xFor(i === 0 ? 0 : i === 1 ? Math.floor((chartRows.length - 1) / 2) : chartRows.length - 1)} y={height - 10} textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"}>{formatShortDate(row.date)}</text>
      ))}
      {valueLabels.map((v, i) => (
        <text key={`vl-${i}`} className="trend-value-label" x="10" y={yFor(v) + 4}>{formatCompactKrw(v)}</text>
      ))}
    </svg>
  );
}
