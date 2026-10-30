// 이메일용 상세 일일 리포트 — 텔레그램 다이제스트(요약)보다 깊은 버전.
// 종목별 변동 전체, 보유 비중, 계좌별 현황, 기간 성과(7일/30일/연초)까지 담는다.
// cron(Vercel)에서 Resend 로 발송하며, 모든 수치는 기록과 동일하게 "실시간 환율" 기준이다.
import {
  getHoldingValues,
  getImpliedExternalFlowKrw,
  getNetInflowKrwBetween,
  getTotals,
  groupByAccount,
} from "./portfolio-core.js";
import {
  formatCompact,
  formatPercent,
  formatSignedCompact,
  getHoldingMoveRows,
  getMoveBreakdown,
} from "./notification-core.js";

const UP = "#c7433d";   // 상승(빨강) — 앱과 동일 컨벤션
const DOWN = "#2f67b1"; // 하락(파랑)
const MUTED = "#6a766f";
const INK = "#1c1814";
const LINE = "#e5ddd2";

export function buildDailyEmailDigest({ state, snapshot, previousSnapshot, date, siteUrl = "", marketContext = null }) {
  const fxRate = Number(state.fxRate?.rate || 1);
  const totals = getTotals({ holdings: state.holdings || [], cashBalances: state.cashBalances || [], fxRate });
  const dayChangeKrw = previousSnapshot
    ? Number(snapshot.totalValueKrw || 0) - Number(previousSnapshot.totalValueKrw || 0)
    : 0;
  const recordedInflowKrw = previousSnapshot && Array.isArray(state.cashFlows)
    ? getNetInflowKrwBetween(state.cashFlows, previousSnapshot.date, snapshot.date || date)
    : Number(snapshot.netInflowKrw || 0);
  const implied = previousSnapshot ? getImpliedExternalFlowKrw(previousSnapshot, snapshot) : { externalFlowKrw: 0, tradeEffectKrw: null, estimated: false };
  const inflowEstimated = !recordedInflowKrw && implied.estimated;
  const netInflowKrw = inflowEstimated ? implied.externalFlowKrw : recordedInflowKrw;
  const investmentChangeKrw = dayChangeKrw - netInflowKrw;
  const marketClosed = Boolean(marketContext?.isMarketClosed);
  const breakdown = marketClosed ? null : getMoveBreakdown(state);
  const moveRows = marketClosed ? [] : getHoldingMoveRows(state)
    .filter((row) => row.valueKrw !== 0)
    .sort((a, b) => Math.abs(b.valueKrw) - Math.abs(a.valueKrw));

  const holdingsAgg = aggregateHoldings(state, fxRate, totals.valueKrw);
  const accounts = groupByAccount(state)
    .slice()
    .sort((a, b) => b.valueKrw - a.valueKrw);
  const periods = [
    ["최근 7일", periodPerformance(state.portfolioSnapshots, snapshot, 7)],
    ["최근 30일", periodPerformance(state.portfolioSnapshots, snapshot, 30)],
    ["연초 대비", periodPerformance(state.portfolioSnapshots, snapshot, "ytd")],
  ].filter(([, perf]) => perf);

  const subject = `투자일지 ${date} 리포트 · 총자산 ${formatCompact(snapshot.totalValueKrw)} (${formatSignedCompact(dayChangeKrw)})`;

  const summaryRows = [
    ["총자산", formatWon(snapshot.totalValueKrw), INK],
    ["전일 대비", signedWon(dayChangeKrw), signColor(dayChangeKrw)],
    ["투자손익", signedWon(investmentChangeKrw), signColor(investmentChangeKrw)],
  ];
  if (netInflowKrw !== 0) {
    summaryRows.push([`입출금${inflowEstimated ? " (추정)" : ""}`, signedWon(netInflowKrw), INK]);
  }
  if (inflowEstimated && Math.abs(implied.tradeEffectKrw || 0) >= 1_000_000) {
    summaryRows.push(["└ 매매(수량 변화)", signedWon(implied.tradeEffectKrw), MUTED]);
  }
  summaryRows.push(["주식", formatWon(totals.stockValueKrw), INK]);
  summaryRows.push(["예수금", formatWon(totals.cashKrw), INK]);
  summaryRows.push(["USD/KRW", `${fxRate.toLocaleString("ko-KR")}원`, MUTED]);
  if (breakdown?.hasData) {
    summaryRows.push(["가격 효과", signedWon(breakdown.priceEffectKrw), signColor(breakdown.priceEffectKrw)]);
    summaryRows.push(["환율 효과", signedWon(breakdown.fxEffectKrw), signColor(breakdown.fxEffectKrw)]);
  }

  const html = [
    `<div style="max-width:640px;margin:0 auto;padding:20px 14px;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:${INK};">`,
    `<h2 style="margin:0 0 2px;font-size:20px;">📊 투자일지 ${marketClosed ? "휴장일" : "마감"} 리포트</h2>`,
    `<p style="margin:0 0 16px;color:${MUTED};font-size:13px;">${date}${marketClosed ? ` · 미국장 ${escapeHtml(marketContext?.closedReason || "휴장")} — ${escapeHtml(marketContext?.latestTradingDate || "")} 종가 기준` : " · 미국장 마감 기준"}</p>`,

    section("요약"),
    `<table style="width:100%;border-collapse:collapse;font-size:14px;">`,
    ...summaryRows.map(([label, value, color]) =>
      `<tr><td style="padding:5px 0;color:${MUTED};">${label}</td><td style="padding:5px 0;text-align:right;font-weight:700;color:${color};">${value}</td></tr>`),
    `</table>`,

    ...(moveRows.length ? [
      section(`종목별 일 변동 (${moveRows.length}종목)`),
      `<table style="width:100%;border-collapse:collapse;font-size:13px;">`,
      `<tr style="color:${MUTED};font-size:12px;"><td style="padding:4px 0;border-bottom:1px solid ${LINE};">종목</td><td style="text-align:right;border-bottom:1px solid ${LINE};">일 변동</td><td style="text-align:right;border-bottom:1px solid ${LINE};">등락</td><td style="text-align:right;border-bottom:1px solid ${LINE};">가격</td><td style="text-align:right;border-bottom:1px solid ${LINE};">환율</td></tr>`,
      ...moveRows.map((row) =>
        `<tr><td style="padding:5px 0;border-bottom:1px solid ${LINE};">${escapeHtml(row.name || row.ticker)}</td>` +
        `<td style="text-align:right;border-bottom:1px solid ${LINE};font-weight:700;color:${signColor(row.valueKrw)};">${signedWon(row.valueKrw)}</td>` +
        `<td style="text-align:right;border-bottom:1px solid ${LINE};color:${signColor(row.changePercent)};">${formatPercent(row.changePercent)}</td>` +
        `<td style="text-align:right;border-bottom:1px solid ${LINE};color:${MUTED};">${signedCompactWon(row.priceEffectKrw)}</td>` +
        `<td style="text-align:right;border-bottom:1px solid ${LINE};color:${MUTED};">${signedCompactWon(row.fxEffectKrw)}</td></tr>`),
      `</table>`,
    ] : [section("종목별 일 변동"), `<p style="font-size:13px;color:${MUTED};">미국장 휴장으로 종목별 변동이 없습니다.</p>`]),

    section("보유 비중"),
    `<table style="width:100%;border-collapse:collapse;font-size:13px;">`,
    `<tr style="color:${MUTED};font-size:12px;"><td style="padding:4px 0;border-bottom:1px solid ${LINE};">종목</td><td style="text-align:right;border-bottom:1px solid ${LINE};">평가금액</td><td style="text-align:right;border-bottom:1px solid ${LINE};">수익률</td><td style="text-align:right;border-bottom:1px solid ${LINE};">비중</td></tr>`,
    ...holdingsAgg.map((row) =>
      `<tr><td style="padding:5px 0;border-bottom:1px solid ${LINE};">${escapeHtml(row.name)}</td>` +
      `<td style="text-align:right;border-bottom:1px solid ${LINE};">${formatWon(row.valueKrw)}</td>` +
      `<td style="text-align:right;border-bottom:1px solid ${LINE};font-weight:700;color:${signColor(row.returnRate)};">${formatPercent(row.returnRate)}</td>` +
      `<td style="text-align:right;border-bottom:1px solid ${LINE};color:${MUTED};">${formatPercent(row.weight)}</td></tr>`),
    `</table>`,

    section("계좌별 현황"),
    `<table style="width:100%;border-collapse:collapse;font-size:13px;">`,
    ...accounts.map((account) =>
      `<tr><td style="padding:5px 0;border-bottom:1px solid ${LINE};">${escapeHtml(account.investor)} · ${escapeHtml(account.account)}</td>` +
      `<td style="text-align:right;border-bottom:1px solid ${LINE};">${formatWon(account.valueKrw)}</td>` +
      `<td style="text-align:right;border-bottom:1px solid ${LINE};font-weight:700;color:${signColor(account.returnRate)};">${formatPercent(account.returnRate)}</td></tr>`),
    `</table>`,

    ...(periods.length ? [
      section("기간 성과"),
      `<table style="width:100%;border-collapse:collapse;font-size:13px;">`,
      `<tr style="color:${MUTED};font-size:12px;"><td style="padding:4px 0;border-bottom:1px solid ${LINE};">기간</td><td style="text-align:right;border-bottom:1px solid ${LINE};">투자손익</td><td style="text-align:right;border-bottom:1px solid ${LINE};">수익률</td><td style="text-align:right;border-bottom:1px solid ${LINE};">입출금</td></tr>`,
      ...periods.map(([label, perf]) =>
        `<tr><td style="padding:5px 0;border-bottom:1px solid ${LINE};">${label}<span style="color:${MUTED};font-size:11px;"> (${perf.baseDate}~)</span></td>` +
        `<td style="text-align:right;border-bottom:1px solid ${LINE};font-weight:700;color:${signColor(perf.gainKrw)};">${signedWon(perf.gainKrw)}</td>` +
        `<td style="text-align:right;border-bottom:1px solid ${LINE};color:${signColor(perf.returnRate)};">${formatPercent(perf.returnRate)}</td>` +
        `<td style="text-align:right;border-bottom:1px solid ${LINE};color:${MUTED};">${perf.inflowKrw ? signedWon(perf.inflowKrw) : "—"}</td></tr>`),
      `</table>`,
    ] : []),

    siteUrl ? `<p style="margin:18px 0 0;font-size:13px;"><a href="${siteUrl}" style="color:#3366ff;">투자일지 열기 →</a></p>` : "",
    `<p style="margin:10px 0 0;color:${MUTED};font-size:11px;">모든 수치는 실시간 환율 기준 기록입니다. 기간 성과의 투자손익은 기록된 입출금을 차감한 값입니다.</p>`,
    `</div>`,
  ].join("\n");

  const text = [
    `투자일지 ${date} 리포트`,
    `총자산 ${formatCompact(snapshot.totalValueKrw)} · 전일 대비 ${formatSignedCompact(dayChangeKrw)} · 투자손익 ${formatSignedCompact(investmentChangeKrw)}`,
    siteUrl,
  ].join("\n");

  return { subject, html, text };
}

function aggregateHoldings(state, fxRate, totalValueKrw) {
  const byName = new Map();
  for (const holding of state.holdings || []) {
    const key = holding.ticker || holding.name;
    const values = getHoldingValues(holding, fxRate);
    const entry = byName.get(key) || { name: holding.name || holding.ticker, valueKrw: 0, costKrw: 0 };
    entry.valueKrw += values.valueKrw;
    entry.costKrw += values.costKrw;
    byName.set(key, entry);
  }
  return [...byName.values()]
    .map((entry) => ({
      ...entry,
      returnRate: entry.costKrw ? (entry.valueKrw - entry.costKrw) / entry.costKrw : 0,
      weight: totalValueKrw ? entry.valueKrw / totalValueKrw : 0,
    }))
    .sort((a, b) => b.valueKrw - a.valueKrw);
}

// 기간 성과 — 기준일 이전의 가장 최근 스냅샷을 기초로, 구간의 기록된 netInflow 를 차감한 투자손익.
function periodPerformance(snapshots = [], endSnapshot, period) {
  if (!endSnapshot?.date || !Array.isArray(snapshots) || snapshots.length < 2) return null;
  const end = endSnapshot;
  let cutoff;
  if (period === "ytd") {
    cutoff = `${end.date.slice(0, 4)}-01-01`;
  } else {
    const endMs = Date.parse(`${end.date}T00:00:00Z`);
    cutoff = new Date(endMs - period * 24 * 3600 * 1000).toISOString().slice(0, 10);
  }
  const base = [...snapshots]
    .filter((item) => item.date <= cutoff && item.date < end.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
  if (!base) return null;
  const inflowKrw = [...snapshots]
    .filter((item) => item.date > base.date && item.date <= end.date)
    .reduce((sum, item) => sum + Number(item.netInflowKrw || 0), 0);
  const gainKrw = Number(end.totalValueKrw || 0) - Number(base.totalValueKrw || 0) - inflowKrw;
  return {
    baseDate: base.date,
    gainKrw,
    inflowKrw,
    returnRate: Number(base.totalValueKrw) ? gainKrw / Number(base.totalValueKrw) : 0,
  };
}

function formatWon(value) {
  return `${Math.round(Number(value || 0)).toLocaleString("ko-KR")}원`;
}

function signedWon(value) {
  const number = Math.round(Number(value || 0));
  return `${number >= 0 ? "+" : "-"}${Math.abs(number).toLocaleString("ko-KR")}원`;
}

function signedCompactWon(value) {
  return Math.abs(Number(value || 0)) < 1000 ? "—" : formatSignedCompact(value);
}

function signColor(value) {
  const number = Number(value || 0);
  return number > 0 ? UP : number < 0 ? DOWN : MUTED;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function section(title) {
  return `<h3 style="margin:22px 0 8px;font-size:15px;color:${INK};border-bottom:2px solid ${INK};padding-bottom:4px;">${title}</h3>`;
}
