import {
  escapeHtml,
  formatAsOf,
  formatCompactKrw,
  formatKrw,
  formatMonthDay,
  formatNumber,
  formatPercent,
  formatShortDate,
} from "./formatters.js";
import { palette } from "./constants.js";
import {
  filterSnapshotRows,
  getAccountPerformanceRows as selectAccountPerformanceRows,
  getAvailableMonths,
  getMonthlyRows as selectMonthlyRows,
  getNumbersChartSource,
  getPerformanceStats,
  getSnapshotRows as selectSnapshotRows,
} from "./performance-selectors.js";

let _ctx;

// 벤치마크 캐시
const benchmarkCache = new Map();
const BENCHMARK_TTL = 3600_000;

async function fetchBenchmarkData(symbol, startDate) {
  const cacheKey = `${symbol}:${startDate}`;
  const cached = benchmarkCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < BENCHMARK_TTL) return cached.data;
  try {
    const diffDays = (Date.now() - new Date(startDate).getTime()) / 86400000;
    const range = diffDays <= 35 ? "1mo" : diffDays <= 100 ? "3mo" : diffDays <= 200 ? "6mo" : "1y";
    const res = await fetch(`/api/yahoo/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=1d`);
    if (!res.ok) return null;
    const json = await res.json();
    const timestamps = json?.chart?.result?.[0]?.timestamp || [];
    const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    if (!timestamps.length) return null;
    const map = new Map();
    timestamps.forEach((ts, i) => {
      if (Number.isFinite(closes[i])) map.set(new Date(ts * 1000).toISOString().slice(0, 10), closes[i]);
    });
    benchmarkCache.set(cacheKey, { data: map, ts: Date.now() });
    return map;
  } catch { return null; }
}

// 모듈 내부 상태
let numbersPerformanceChart = null;
let selectedNumbersMonth = null; // "YYYY-MM" or null (= latest)

export function init(ctx) {
  _ctx = ctx;
}

export function getSelectedNumbersMonth() {
  return selectedNumbersMonth;
}

function getFilteredSnapshotRows() {
  const state = _ctx.getState();
  const els = _ctx.els;
  const rows = selectSnapshotRows(state.portfolioSnapshots);
  const range = els.performanceRange?.value || "all";
  return filterSnapshotRows(rows, range);
}

function getSnapshotRows() {
  const state = _ctx.getState();
  return selectSnapshotRows(state.portfolioSnapshots);
}

export function renderPerformance() {
  const els = _ctx.els;
  const points = getFilteredSnapshotRows().slice(-8);
  if (!points.length) {
    els.performanceStats.innerHTML = "";
    els.performanceChart.innerHTML = `<div class="empty-state">성과 기록이 아직 없습니다</div>`;
    renderPerformanceDetails([]);
    return;
  }
  const latest = points[points.length - 1];
  const first = points[0];
  const previous = points[points.length - 2];
  const periodChange = latest.totalValueKrw - first.totalValueKrw;
  const dailyChange = previous ? latest.totalValueKrw - previous.totalValueKrw : 0;
  els.performanceStats.innerHTML = `
    <div><span>최근 총자산</span><strong>${formatKrw(latest.totalValueKrw)}</strong></div>
    <div><span>최근 일 증감</span><strong class="${dailyChange >= 0 ? "positive" : "negative"}">${formatKrw(dailyChange)}</strong></div>
    <div><span>표시기간 증감</span><strong class="${periodChange >= 0 ? "positive" : "negative"}">${formatKrw(periodChange)}</strong></div>
  `;
  const max = Math.max(...points.map((point) => point.totalValueKrw));
  const min = Math.min(...points.map((point) => point.totalValueKrw));
  const span = Math.max(1, max - min);
  els.performanceChart.innerHTML = points
    .map((point, index) => {
      const previousPoint = points[index - 1];
      const change = previousPoint ? point.totalValueKrw - previousPoint.totalValueKrw : 0;
      const height = Math.max(42, Math.round(((point.totalValueKrw - min) / span) * 120) + 52);
      return `<div class="bar">
        <div class="bar-value">${formatCompactKrw(point.totalValueKrw)}</div>
        <div class="bar-fill" style="height:${height}px" title="${formatKrw(point.totalValueKrw)}"></div>
        <span>${formatShortDate(point.date)}</span>
        <small class="${change >= 0 ? "positive" : "negative"}">${previousPoint ? formatCompactKrw(change) : "-"}</small>
      </div>`;
    })
    .join("");
  renderPerformanceDetails(getFilteredSnapshotRows());
}

function renderPerformanceDetails(rows) {
  const els = _ctx.els;
  if (!rows.length) {
    els.performanceDetailStats.innerHTML = "";
    els.performanceTrendChart.innerHTML = `<div class="empty-state">성과 기록이 아직 없습니다</div>`;
    els.performanceWaterfall.innerHTML = `<div class="empty-state">분석할 데이터가 없습니다</div>`;
    els.performanceInsight.innerHTML = "";
    els.accountPerformanceBody.innerHTML = `<tr><td colspan="7">계좌별 스냅샷이 없습니다</td></tr>`;
    els.strategyPerformanceBody.innerHTML = `<tr><td colspan="6">보유 종목이 없습니다</td></tr>`;
    return;
  }

  const stats = getPerformanceStats(rows);
  els.performanceDetailStats.innerHTML = `
    <div><span>기간 증감</span><strong class="${stats.periodChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(stats.periodChangeKrw)}</strong><small>${formatPercent(stats.periodReturn)}</small></div>
    <div><span>입출금</span><strong>${formatKrw(stats.netInflowKrw)}</strong><small>외부 현금흐름</small></div>
    <div><span>투자손익</span><strong class="${stats.investmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(stats.investmentGainKrw)}</strong><small>증감 - 입출금</small></div>
    <div><span>월 누적</span><strong class="${stats.monthToDateGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(stats.monthToDateGainKrw)}</strong><small>${formatPercent(stats.monthToDateReturn)}</small></div>
    <div><span>최대 낙폭</span><strong class="${stats.maxDrawdownKrw >= 0 ? "positive" : "negative"}">${formatKrw(stats.maxDrawdownKrw)}</strong><small>${formatPercent(stats.maxDrawdownRate)}</small></div>
  `;

  els.performanceTrendChart.innerHTML = renderTrendChart(rows);
  renderNumbersPerformanceChart(rows);
  els.performanceWaterfall.innerHTML = renderWaterfall(stats);
  els.performanceInsight.innerHTML = renderPerformanceInsights(stats);
  renderAccountPerformance(rows);
  renderStrategyPerformance();
}

function renderNumbersMonthNav(rows) {
  const navEl = document.getElementById("numbersMonthNav");
  if (!navEl) return;
  const allRows = getSnapshotRows();
  const months = getAvailableMonths(allRows);
  if (months.length <= 1) { navEl.hidden = true; return; }
  navEl.hidden = false;
  const latestYm = allRows[allRows.length - 1]?.date.slice(0, 7);
  const active = selectedNumbersMonth || latestYm;
  navEl.innerHTML = `<select class="numbers-month-select" aria-label="월 선택">
    ${months.slice().reverse().map((ym) => {
      const [y, m] = ym.split("-");
      const label = `${y}년 ${Number(m)}월`;
      return `<option value="${ym}"${ym === active ? " selected" : ""}>${label}</option>`;
    }).join("")}
  </select>`;
  navEl.querySelector(".numbers-month-select").addEventListener("change", (e) => {
    selectedNumbersMonth = e.target.value;
    renderNumbersPerformanceChart(rows);
  });
}

function renderNumbersPerformanceChart(rows) {
  const els = _ctx.els;
  renderNumbersMonthNav(rows);
  const source = getNumbersChartSource(rows, getSnapshotRows(), selectedNumbersMonth);
  if (!source.points.length) {
    els.numbersChartCaption.textContent = "월간 성과 데이터 없음";
    els.numbersSourceHead.innerHTML = "";
    els.numbersSourceBody.innerHTML = `<tr><td>선택 기간에 월간 차트를 만들 스냅샷이 없습니다</td></tr>`;
    if (numbersPerformanceChart) {
      numbersPerformanceChart.destroy();
      numbersPerformanceChart = null;
    }
    return;
  }

  els.numbersChartCaption.textContent = `${source.monthLabel} · 단위 만원`;
  els.numbersSourceHead.innerHTML = `<tr><th></th>${source.points.map((point) => `<th>${escapeHtml(point.label)}</th>`).join("")}</tr>`;
  els.numbersSourceBody.innerHTML = source.rows
    .map((row) => `<tr><th>${escapeHtml(row.label)}</th>${row.values.map((value) => `<td>${formatNumber(value, 0)}</td>`).join("")}</tr>`)
    .join("");

  if (!window.Chart || !window.ChartDataLabels) {
    els.numbersChartCaption.textContent = `${source.monthLabel} · 차트 라이브러리 로드 대기`;
    return;
  }

  const ctx = els.numbersPerformanceChart.getContext("2d");
  if (numbersPerformanceChart) {
    numbersPerformanceChart.destroy();
  }
  window.Chart.register(window.ChartDataLabels);
  numbersPerformanceChart = new window.Chart(ctx, {
    type: "line",
    data: {
      labels: source.points.map((point) => point.label),
      datasets: [
        {
          label: source.yearLabel,
          data: source.points.map((point) => point.yearCumulativeMan),
          borderColor: "#4f7f36",
          backgroundColor: "rgba(190, 224, 166, 0.72)",
          borderWidth: 4,
          fill: "origin",
          pointRadius: 0,
          pointHitRadius: 10,
          tension: 0,
          datalabels: {
            align: "top",
            anchor: "end",
            color: "#4f7f36",
            font: { weight: "bold", size: 11 },
            formatter: (value) => (value != null ? formatNumber(value, 0) : ""),
          },
        },
        {
          label: source.monthLabel,
          data: source.points.map((point) => point.monthMan),
          borderColor: "#1d6fa4",
          backgroundColor: "rgba(93, 169, 233, 0.22)",
          borderWidth: 3,
          fill: "origin",
          pointRadius: 3,
          pointHitRadius: 10,
          tension: 0,
          datalabels: {
            align: "bottom",
            anchor: "start",
            color: "#1d6fa4",
            font: { size: 10 },
            formatter: (value) => (value != null ? formatNumber(value, 0) : ""),
          },
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: { display: true, position: "bottom" },
        datalabels: { display: true },
      },
      scales: {
        y: { ticks: { callback: (v) => formatNumber(v, 0) } },
      },
    },
  });
}


export function renderTopMover() {
  const el = document.getElementById("topMoverContent");
  if (!el) return;
  const state = _ctx.getState();
  const rows = (state.holdings || []).map((h) => ({
    holding: h,
    dailyMove: _ctx.getHoldingDailyMove(h),
  })).filter((r) => r.dailyMove.hasData);
  if (!rows.length) {
    el.innerHTML = `<div class="empty-state">가격 변동 데이터가 없습니다</div>`;
    return;
  }
  rows.sort((a, b) => Math.abs(b.dailyMove.valueKrw) - Math.abs(a.dailyMove.valueKrw));
  const top = rows[0];
  const h = top.holding;
  const m = top.dailyMove;
  const positive = m.valueKrw >= 0;
  const fallbackLetter = escapeHtml((h.ticker || h.name || "?").replace(/[^A-Za-z0-9가-힣]/g, "")[0]?.toUpperCase() || "?");
  el.innerHTML = `
    <div class="top-mover-row">
      <span class="ticker-logo" style="width:40px;height:40px">
        <img src="https://assets.parqet.com/logos/symbol/${encodeURIComponent(h.ticker)}?format=svg"
          alt="${escapeHtml(h.ticker)}" width="40" height="40"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="ticker-logo-fallback" style="display:none;width:40px;height:40px;font-size:16px">${fallbackLetter}</span>
      </span>
      <div class="top-mover-info">
        <strong>${escapeHtml(h.name || h.ticker)}</strong>
        <span class="top-mover-meta">${escapeHtml(h.ticker)} · ${escapeHtml(h.account)}</span>
      </div>
      <div class="top-mover-values">
        <span class="${positive ? "positive" : "negative"} top-mover-change">${positive ? "+" : ""}${formatKrw(m.valueKrw)}</span>
        <span class="${positive ? "positive" : "negative"} top-mover-pct">${formatPercent(m.changePercent)}</span>
      </div>
    </div>`;
}

export function renderBreakdown() {
  const els = _ctx.els;
  const marketContext = _ctx.getCurrentMarketContext();
  const movers = _ctx.getDailyMoveRows().slice(0, 5);
  const refreshImpact = _ctx.getRecentPriceRefreshImpact();
  if (!movers.length) {
    if (marketContext.isMarketClosed) {
      const fallback = renderBreakdownFallback();
      els.breakdownList.innerHTML = `
        <div class="daily-move-empty">
          <strong>미국장 ${escapeHtml(marketContext.closedReason || "휴장")}에는 새 종목별 변동을 표시하지 않습니다</strong>
          <span>${escapeHtml(marketContext.label)}입니다. 총자산 변화가 있다면 입출금 또는 환율/현금 변화일 수 있습니다.</span>
        </div>
        <div class="breakdown-subtitle">구성 참고</div>
        ${fallback}
      `;
      return;
    }
    if (refreshImpact?.rows?.length) {
      els.breakdownList.innerHTML = renderPriceRefreshImpact(refreshImpact);
      return;
    }
    const fallback = renderBreakdownFallback();
    els.breakdownList.innerHTML = `
      <div class="daily-move-empty">
        <strong>가격 갱신 후 원인을 분석할 수 있습니다</strong>
        <span>전일 대비 가격 데이터가 없는 캐시나 일부 종목 실패가 있으면 원인 분석이 제한됩니다. 가격을 다시 가져오면 새 데이터로 분석합니다.</span>
      </div>
      <div class="breakdown-subtitle">구성 참고</div>
      ${fallback}
    `;
    return;
  }
  const netMove = movers.reduce((sum, item) => sum + item.value, 0);
  const priceEffect = movers.reduce((sum, item) => sum + item.priceEffectKrw, 0);
  const fxEffect = movers.reduce((sum, item) => sum + item.fxEffectKrw, 0);
  const insight = dailyMoveInsight(movers, netMove, priceEffect, fxEffect);
  els.breakdownList.innerHTML = `
    <div class="daily-move-summary">
      <span>오늘 추정 변동</span>
      <strong class="${netMove >= 0 ? "positive" : "negative"}">${formatKrw(netMove)}</strong>
      <small>가격 ${priceEffect >= 0 ? "+" : ""}${formatCompactKrw(priceEffect)} · 환율 ${fxEffect >= 0 ? "+" : ""}${formatCompactKrw(fxEffect)}</small>
    </div>
    <div class="daily-move-insight">${escapeHtml(insight)}</div>
    ${movers.map((item) => dailyMoveRow(item)).join("")}
    ${refreshImpact && Math.abs(refreshImpact.totalDeltaKrw) > Math.max(100000, Math.abs(netMove) * 3) ? renderPriceRefreshImpact(refreshImpact, { compact: true }) : ""}
  `;
}

function renderBreakdownFallback() {
  const state = _ctx.getState();
  const { formatAccountType } = _ctx;
  const investors = _ctx.groupByValue(state.holdings, "investor");
  const accountTypes = _ctx.groupByValue(state.holdings.map((holding) => ({ ...holding, accountType: formatAccountType(holding.accountType) })), "accountType");
  return [
    ...investors.map((item, index) => breakdownRow(item, index)),
    ...accountTypes.map((item, index) => breakdownRow(item, index + investors.length)),
  ].join("");
}

function renderPriceRefreshImpact(impact, { compact = false } = {}) {
  const rows = (impact.rows || []).slice(0, compact ? 3 : 5);
  const title = compact ? "이번 가격 갱신 전후" : "최근 가격 갱신 영향";
  return `
    <div class="daily-move-summary price-refresh-impact">
      <span>${title}</span>
      <strong class="${impact.totalDeltaKrw >= 0 ? "positive" : "negative"}">${impact.totalDeltaKrw >= 0 ? "+" : ""}${formatKrw(impact.totalDeltaKrw)}</strong>
      <small>${formatAsOf(impact.at)} · 갱신 전 ${formatCompactKrw(impact.previousTotalKrw)} → 갱신 후 ${formatCompactKrw(impact.nextTotalKrw)}</small>
    </div>
    <div class="daily-move-insight">${escapeHtml(priceRefreshImpactInsight(impact))}</div>
    ${rows.map((item) => priceRefreshImpactRow(item)).join("")}
  `;
}

export function renderSnapshots() {
  const els = _ctx.els;
  const dayFilter = els.snapshotDayFilter?.value || "all";
  const base = getFilteredSnapshotRows();
  const filtered = dayFilter === "7d" ? base.slice(-7) : dayFilter === "30d" ? base.slice(-30) : base;
  const rows = filtered.slice().reverse();
  els.snapshotsBody.innerHTML = rows
    .map((row) => `<tr>
      <td data-label="날짜">${escapeHtml(row.date)}</td>
      <td data-label="총자산">${formatKrw(row.totalValueKrw)}</td>
      <td data-label="일 증감" class="${row.dailyChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.dailyChangeKrw)}</td>
      <td data-label="투자손익" class="${row.investmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.investmentGainKrw)}</td>
      <td data-label="일 수익률" class="${row.dailyReturn >= 0 ? "positive" : "negative"}">${formatPercent(row.dailyReturn)}</td>
      <td data-label="월 누적" class="${row.monthToDateInvestmentGainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.monthToDateInvestmentGainKrw)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="6">성과 기록이 아직 없습니다</td></tr>`;
}

export function renderMonthlySummary() {
  const els = _ctx.els;
  const rows = selectMonthlyRows(getFilteredSnapshotRows()).reverse();
  els.monthlySummaryBody.innerHTML = rows
    .map((row) => `<tr>
      <td data-label="월" class="${row.changeKrw >= 0 ? "positive" : "negative"}">${escapeHtml(row.month)}</td>
      <td data-label="월초 총자산">${formatKrw(row.startValueKrw)}</td>
      <td data-label="월말 총자산">${formatKrw(row.endValueKrw)}</td>
      <td data-label="월 증감" class="${row.changeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.changeKrw)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="4">한 달치 기록이 쌓이면 월별 분석이 시작됩니다</td></tr>`;
}

function renderAccountPerformance(rows) {
  const state = _ctx.getState();
  const els = _ctx.els;
  const accountRows = selectAccountPerformanceRows(state.accountSnapshots, rows);
  els.accountPerformanceBody.innerHTML = accountRows
    .map((row) => `<tr>
      <td data-label="계좌">${escapeHtml(row.account)}<small>${escapeHtml(row.investor)}</small></td>
      <td data-label="최근 총액">${formatKrw(row.latestValueKrw)}</td>
      <td data-label="일 증감" class="${row.dailyChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.dailyChangeKrw)}</td>
      <td data-label="기간 증감" class="${row.periodChangeKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.periodChangeKrw)}</td>
      <td data-label="주식">${formatKrw(row.stockValueKrw)}</td>
      <td data-label="예수금">${formatKrw(row.cashKrw)}</td>
      <td data-label="수익률" class="${row.returnRate >= 0 ? "positive" : "negative"}">${formatPercent(row.returnRate)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="7">계좌별 성과 기록이 없습니다</td></tr>`;
}

function renderStrategyPerformance() {
  const els = _ctx.els;
  const rows = getStrategyPerformanceRows();
  els.strategyPerformanceBody.innerHTML = rows
    .map((row) => `<tr>
      <td data-label="전략">${escapeHtml(row.strategy)}</td>
      <td data-label="평가금액">${formatKrw(row.valueKrw)}</td>
      <td data-label="비중">${formatPercent(row.weight)}</td>
      <td data-label="평가손익" class="${row.gainKrw >= 0 ? "positive" : "negative"}">${formatKrw(row.gainKrw)}</td>
      <td data-label="수익률" class="${row.returnRate >= 0 ? "positive" : "negative"}">${formatPercent(row.returnRate)}</td>
      <td data-label="종목 수">${formatNumber(row.count)}</td>
    </tr>`)
    .join("") || `<tr><td colspan="6">보유 종목이 없습니다</td></tr>`;
}

function breakdownRow(item, index) {
  return `<div class="breakdown-row">
    <span class="swatch" style="background:${palette[index % palette.length]}"></span>
    <span>${escapeHtml(item.label)}</span>
    <strong>${formatKrw(item.value)}</strong>
  </div>`;
}

function dailyMoveRow(item) {
  const share = Number.isFinite(item.contributionShare) ? Math.abs(item.contributionShare) : 0;
  const detail = Math.abs(item.fxEffectKrw) >= 1000
    ? `가격 ${item.priceEffectKrw >= 0 ? "+" : ""}${formatCompactKrw(item.priceEffectKrw)} · 환율 ${item.fxEffectKrw >= 0 ? "+" : ""}${formatCompactKrw(item.fxEffectKrw)}`
    : `${formatNumber(item.quantity, 4)}주 · ${formatPercent(item.changePercent)}`;
  return `<div class="daily-move-row">
    <div>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.ticker)} · ${detail} · 영향 ${formatPercent(share)}</small>
    </div>
    <span class="${item.value >= 0 ? "positive" : "negative"}">${item.value >= 0 ? "+" : ""}${formatKrw(item.value)}</span>
  </div>`;
}

function dailyMoveInsight(movers, netMove, priceEffect, fxEffect) {
  const top = movers.slice(0, 2).map((item) => item.name).filter(Boolean);
  if (!top.length || Math.abs(netMove) < 1000) {
    return "오늘 가격 변동 데이터가 없습니다.";
  }
  const direction = netMove >= 0 ? "증가" : "하락";
  const main = top.join(", ");
  if (Math.abs(fxEffect) > Math.abs(priceEffect) * 0.35) {
    const fxDirection = fxEffect >= 0 ? "환율 상승" : "환율 하락";
    return `오늘 ${direction}는 ${main}와 ${fxDirection} 영향이 큽니다.`;
  }
  return `오늘 ${direction}는 ${main}의 가격 변동이 대부분 설명합니다.`;
}

function priceRefreshImpactRow(item) {
  const before = formatCompactKrw(item.beforeValueKrw);
  const after = formatCompactKrw(item.afterValueKrw);
  return `<div class="daily-move-row">
    <div>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.ticker)} · ${before} → ${after}</small>
    </div>
    <span class="${item.deltaKrw >= 0 ? "positive" : "negative"}">${item.deltaKrw >= 0 ? "+" : ""}${formatKrw(item.deltaKrw)}</span>
  </div>`;
}

function priceRefreshImpactInsight(impact) {
  const rows = impact.rows || [];
  const top = rows[0];
  if (!top || Math.abs(impact.totalDeltaKrw) < 1000) {
    return "이번 가격 갱신으로 평가금액 변화가 거의 없었습니다.";
  }
  const direction = impact.totalDeltaKrw >= 0 ? "증가" : "감소";
  return `이번 ${direction}는 ${top.name} 등 Yahoo 가격으로 바뀐 종목 영향이 큽니다.`;
}

export function exportPerformanceCsv() {
  const rows = getFilteredSnapshotRows();
  if (!rows.length) {
    _ctx.showOperationToast("내보내기 실패", "성과 데이터가 없습니다", "error");
    return;
  }
  const header = ["날짜", "총자산(원)", "일 증감(원)", "입출금(원)", "투자손익(원)", "일 수익률", "월 누적(원)"];
  const csvRows = rows.slice().reverse().map((row) => [
    row.date,
    row.totalValueKrw,
    row.dailyChangeKrw ?? "",
    row.netInflowKrw ?? "",
    row.investmentGainKrw ?? "",
    row.dailyReturn != null ? (row.dailyReturn * 100).toFixed(2) + "%" : "",
    row.monthToDateInvestmentGainKrw ?? "",
  ]);
  const csv = [header, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stocklio-performance-${_ctx.todayKey()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  _ctx.showOperationToast("성과 내보내기 완료", `${rows.length}개 일자 CSV`, "success");
}

export function copyPerformanceSummary() {
  const els = _ctx.els;
  const rows = getFilteredSnapshotRows();
  if (!rows.length) {
    _ctx.showOperationToast("복사 실패", "성과 데이터가 없습니다", "error");
    return;
  }
  const stats = getPerformanceStats(rows);
  const lines = [
    `성과 요약 (${els.performanceRange?.options[els.performanceRange.selectedIndex]?.text ?? ""})`,
    `최근 총자산: ${formatKrw(stats.latest.totalValueKrw)} (${escapeHtml(stats.latest.date)})`,
    `기간 증감: ${formatKrw(stats.periodChangeKrw)} (${formatPercent(stats.periodReturn)})`,
    `투자손익: ${formatKrw(stats.investmentGainKrw)}`,
    `월 누적: ${formatKrw(stats.monthToDateGainKrw)} (${formatPercent(stats.monthToDateReturn)})`,
    `최대 낙폭: ${formatKrw(stats.maxDrawdownKrw)} (${formatPercent(stats.maxDrawdownRate)})`,
  ];
  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    _ctx.showOperationToast("요약 복사 완료", "클립보드에 복사했습니다", "success");
  }).catch(() => {
    _ctx.showOperationToast("복사 실패", "클립보드 접근이 거부되었습니다", "error");
  });
}

export function renderTrendChart(rows) {
  const chartRows = rows.slice(-30);
  if (chartRows.length < 2) {
    return `<div class="empty-state">하루만 더 지나면 추이 차트가 그려집니다</div>`;
  }
  // 비동기로 벤치마크 로드 후 차트 업데이트
  const startDate = chartRows[0].date;
  Promise.all([
    fetchBenchmarkData("^GSPC", startDate),
    fetchBenchmarkData("^KS11", startDate),
  ]).then(([sp500, kospi]) => {
    const el = document.getElementById("performanceTrendChart");
    if (el && (sp500 || kospi)) el.innerHTML = buildTrendChartSvg(chartRows, sp500, kospi);
  }).catch(() => {});
  return buildTrendChartSvg(chartRows, null, null);
}

function buildTrendChartSvg(chartRows, sp500Map, kospiMap) {
  const width = 720;
  const height = 230;
  const padding = { top: 22, right: 38, bottom: 34, left: 78 };
  const values = chartRows.map((row) => row.totalValueKrw);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const xFor = (index) => padding.left + (index / Math.max(1, chartRows.length - 1)) * (width - padding.left - padding.right);
  const yFor = (value) => padding.top + ((max - value) / span) * (height - padding.top - padding.bottom);
  const line = chartRows.map((row, index) => `${xFor(index)},${yFor(row.totalValueKrw)}`).join(" ");
  const area = `${padding.left},${height - padding.bottom} ${line} ${width - padding.right},${height - padding.bottom}`;
  const labels = [chartRows[0], chartRows[Math.floor(chartRows.length / 2)], chartRows[chartRows.length - 1]];
  const tickCount = 5;
  const valueLabels = Array.from({ length: tickCount }, (_, index) => max - (span / (tickCount - 1)) * index);
  const lastRow = chartRows[chartRows.length - 1];
  const lastX = xFor(chartRows.length - 1);
  const lastY = yFor(lastRow.totalValueKrw);
  const pointGroups = chartRows
    .map((row, index) => {
      const x = xFor(index);
      const y = yFor(row.totalValueKrw);
      const previous = chartRows[index - 1];
      const dailyChange = Number(row.dailyChangeKrw ?? (previous ? row.totalValueKrw - previous.totalValueKrw : 0));
      const tooltipWidth = 160;
      const tooltipHeight = 64;
      const tooltipX = Math.max(padding.left, Math.min(width - padding.right - tooltipWidth, x - tooltipWidth / 2));
      const tooltipY = Math.max(6, y - tooltipHeight - 12);
      const isPositive = dailyChange >= 0;
      const arrow = isPositive ? "▲" : "▼";
      const changeClass = isPositive ? "tooltip-positive" : "tooltip-negative";
      const dateStr = escapeHtml(formatMonthDay(row.date));
      return `<g class="trend-point-group" tabindex="0" aria-label="${escapeHtml(`${row.date} 총자산 ${formatKrw(row.totalValueKrw)}, 일 증감 ${isPositive ? "+" : ""}${formatKrw(dailyChange)}`)}">
        <circle class="trend-hit" cx="${x}" cy="${y}" r="13"></circle>
        <circle class="trend-point" cx="${x}" cy="${y}" r="2.5"></circle>
        <g class="trend-tooltip" transform="translate(${tooltipX} ${tooltipY})">
          <rect width="${tooltipWidth}" height="${tooltipHeight}" rx="8"></rect>
          <text class="tooltip-date" x="12" y="19">${dateStr}</text>
          <text class="tooltip-value" x="12" y="38">${escapeHtml(formatKrw(row.totalValueKrw))}</text>
          <text class="${changeClass}" x="12" y="56">${arrow} ${escapeHtml(formatKrw(Math.abs(dailyChange)))}</text>
        </g>
      </g>`;
    })
    .join("");
  // MDD 구간
  let mddStart = 0, mddEnd = 0, peak = values[0], peakIdx = 0, maxDrop = 0;
  values.forEach((v, i) => {
    if (v > peak) { peak = v; peakIdx = i; }
    const drop = peak > 0 ? (peak - v) / peak : 0;
    if (drop > maxDrop) { maxDrop = drop; mddStart = peakIdx; mddEnd = i; }
  });
  const mddRect = maxDrop > 0.005 && mddEnd > mddStart
    ? `<rect class="mdd-zone" x="${xFor(mddStart)}" y="${padding.top}" width="${xFor(mddEnd) - xFor(mddStart)}" height="${height - padding.top - padding.bottom}"/>`
    : "";

  // 벤치마크 선 (첫 날 기준 정규화)
  const buildBenchmarkLine = (map, cssClass) => {
    if (!map) return "";
    const pts = chartRows.map((row) => map.get(row.date) ?? null);
    const firstValid = pts.find((p) => p != null);
    if (!firstValid || !values[0]) return "";
    const norm = pts.map((p, i) => p != null ? `${xFor(i)},${yFor(values[0] * (p / firstValid))}` : null).filter(Boolean);
    return norm.length >= 2 ? `<polyline class="${cssClass}" points="${norm.join(" ")}"/>` : "";
  };

  // 범례
  const legendItems = [
    sp500Map ? `<line class="benchmark-sp500" x1="0" y1="6" x2="18" y2="6"/><text class="legend-label" x="22" y="10">S&amp;P500</text>` : "",
    kospiMap ? `<line class="benchmark-kospi" x1="${sp500Map ? 72 : 0}" y1="6" x2="${sp500Map ? 90 : 18}" y2="6"/><text class="legend-label" x="${sp500Map ? 94 : 22}" y="10">KOSPI</text>` : "",
  ].filter(Boolean).join("");
  const legend = legendItems ? `<g class="benchmark-legend" transform="translate(${padding.left + 6},${padding.top + 4})">${legendItems}</g>` : "";

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="총자산 추이">
      ${valueLabels
        .map((value) => `<polyline class="trend-grid" points="${padding.left},${yFor(value)} ${width - padding.right},${yFor(value)}"></polyline>`)
        .join("")}
      ${mddRect}
      ${buildBenchmarkLine(sp500Map, "benchmark-sp500")}
      ${buildBenchmarkLine(kospiMap, "benchmark-kospi")}
      <polygon class="trend-area" points="${area}"></polygon>
      <polyline class="trend-line" points="${line}"></polyline>
      ${pointGroups}
      ${legend}
      <text class="trend-last-label" x="${Math.min(width - padding.right - 4, lastX + 8)}" y="${Math.max(16, lastY - 10)}" text-anchor="end">${formatCompactKrw(lastRow.totalValueKrw)}</text>
      ${labels
        .map((row, index) => `<text class="trend-label" x="${xFor(index === 0 ? 0 : index === 1 ? Math.floor((chartRows.length - 1) / 2) : chartRows.length - 1)}" y="${height - 10}" text-anchor="${index === 0 ? "start" : index === 1 ? "middle" : "end"}">${formatShortDate(row.date)}</text>`)
        .join("")}
      ${valueLabels
        .map((value) => `<text class="trend-value-label" x="10" y="${yFor(value) + 4}">${formatCompactKrw(value)}</text>`)
        .join("")}
    </svg>
  `;
}

export function renderWaterfall(stats) {
  const items = [
    { label: "총 증감", value: stats.periodChangeKrw, tone: stats.periodChangeKrw >= 0 ? "positive" : "negative" },
    { label: "입출금", value: stats.netInflowKrw, tone: "neutral" },
    { label: "투자손익", value: stats.investmentGainKrw, tone: stats.investmentGainKrw >= 0 ? "positive" : "negative" },
  ];
  const max = Math.max(1, ...items.map((item) => Math.abs(item.value)));
  return items
    .map((item) => {
      const width = Math.max(6, Math.round((Math.abs(item.value) / max) * 100));
      return `<div class="waterfall-row">
        <span>${escapeHtml(item.label)}</span>
        <div class="waterfall-track"><b class="${item.tone}" style="width:${width}%"></b></div>
        <strong class="${item.tone === "negative" ? "negative" : item.tone === "positive" ? "positive" : ""}">${formatKrw(item.value)}</strong>
      </div>`;
    })
    .join("");
}

export function renderPerformanceInsights(stats) {
  const flowShare = stats.periodChangeKrw ? stats.netInflowKrw / stats.periodChangeKrw : 0;
  const gainLabel = stats.investmentGainKrw >= 0 ? "투자손익이 총자산 증가에 기여했습니다" : "투자손익이 총자산을 낮췄습니다";
  return `
    <div><strong>기간 해석</strong><span>${gainLabel}. 입출금 보정 후 수익률은 ${formatPercent(stats.periodReturn)}입니다.</span></div>
    <div><strong>현금흐름 영향</strong><span>총 증감 중 입출금 비중은 ${Number.isFinite(flowShare) ? formatPercent(flowShare) : "0.00%"}입니다.</span></div>
    <div><strong>리스크</strong><span>선택 기간 최대 낙폭은 ${formatKrw(stats.maxDrawdownKrw)} (${formatPercent(stats.maxDrawdownRate)})입니다.</span></div>
  `;
}

export function getStrategyPerformanceRows() {
  const state = _ctx.getState();
  const totals = _ctx.getTotals(state.holdings);
  return _ctx.groupByValue(state.holdings, "strategy")
    .map((item) => {
      const holdings = state.holdings.filter((holding) => holding.strategy === item.label);
      const costKrw = holdings.reduce((sum, holding) => sum + _ctx.getHoldingValues(holding).costKrw, 0);
      const gainKrw = holdings.reduce((sum, holding) => sum + _ctx.getHoldingValues(holding).gainKrw, 0);
      return {
        strategy: item.label,
        valueKrw: item.value,
        weight: totals.stockValueKrw ? item.value / totals.stockValueKrw : 0,
        gainKrw,
        returnRate: costKrw ? gainKrw / costKrw : 0,
        count: holdings.length,
      };
    })
    .sort((a, b) => b.valueKrw - a.valueKrw);
}
