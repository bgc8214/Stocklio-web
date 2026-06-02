import { formatMonthDay } from "./formatters.js";

export function getSnapshotRows(portfolioSnapshots = []) {
  const snapshots = [...portfolioSnapshots].sort((a, b) => a.date.localeCompare(b.date));
  const monthRunningGain = new Map();
  const monthRunningInflow = new Map();
  return snapshots.map((snapshot, index) => {
    const previous = snapshots[index - 1];
    const dailyChangeKrw = previous ? snapshot.totalValueKrw - previous.totalValueKrw : 0;
    const netInflowKrw = Number(snapshot.netInflowKrw || 0);
    const investmentGainKrw = previous ? dailyChangeKrw - netInflowKrw : 0;
    const dailyReturn = previous?.totalValueKrw ? investmentGainKrw / previous.totalValueKrw : 0;
    const month = snapshot.date.slice(0, 7);
    const monthGain = (monthRunningGain.get(month) || 0) + investmentGainKrw;
    const monthInflow = (monthRunningInflow.get(month) || 0) + netInflowKrw;
    monthRunningGain.set(month, monthGain);
    monthRunningInflow.set(month, monthInflow);
    return {
      ...snapshot,
      dailyChangeKrw,
      netInflowKrw,
      investmentGainKrw,
      dailyReturn,
      monthToDateInvestmentGainKrw: monthGain,
      monthToDateNetInflowKrw: monthInflow,
    };
  });
}

export function filterSnapshotRows(rows, range) {
  if (!rows.length || range === "all") {
    return rows;
  }
  const latest = rows[rows.length - 1];
  const latestDate = new Date(`${latest.date}T00:00:00`);
  if (range === "ytd") {
    const year = latest.date.slice(0, 4);
    return rows.filter((row) => row.date.startsWith(year));
  }
  const days = range === "7d" ? 7 : 30;
  const minTime = latestDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000;
  return rows.filter((row) => new Date(`${row.date}T00:00:00`).getTime() >= minTime);
}

export function getMonthlyRows(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const month = row.date.slice(0, 7);
    if (!grouped.has(month)) {
      grouped.set(month, []);
    }
    grouped.get(month).push(row);
  }
  return [...grouped.entries()].map(([month, monthRows]) => {
    const first = monthRows[0];
    const last = monthRows[monthRows.length - 1];
    const changeKrw = last.totalValueKrw - first.totalValueKrw;
    const netInflowKrw = monthRows.reduce((sum, row) => sum + row.netInflowKrw, 0);
    const investmentGainKrw = changeKrw - netInflowKrw;
    return {
      month,
      startValueKrw: first.totalValueKrw,
      endValueKrw: last.totalValueKrw,
      changeKrw,
      netInflowKrw,
      investmentGainKrw,
      returnRate: first.totalValueKrw ? investmentGainKrw / first.totalValueKrw : 0,
    };
  });
}

export function getPerformanceStats(rows) {
  const latest = rows[rows.length - 1];
  const first = rows[0];
  const periodChangeKrw = latest.totalValueKrw - first.totalValueKrw;
  const netInflowKrw = rows.reduce((sum, row, index) => sum + (index === 0 ? 0 : row.netInflowKrw), 0);
  const investmentGainKrw = periodChangeKrw - netInflowKrw;
  const latestMonth = latest.date.slice(0, 7);
  const monthRows = rows.filter((row) => row.date.startsWith(latestMonth));
  const monthFirst = monthRows[0] || latest;
  const monthChangeKrw = latest.totalValueKrw - monthFirst.totalValueKrw;
  const monthNetInflowKrw = monthRows.reduce((sum, row, index) => sum + (index === 0 ? 0 : row.netInflowKrw), 0);
  const monthToDateGainKrw = monthChangeKrw - monthNetInflowKrw;
  let peak = rows[0]?.totalValueKrw || 0;
  let maxDrawdownKrw = 0;
  let maxDrawdownRate = 0;
  for (const row of rows) {
    peak = Math.max(peak, row.totalValueKrw);
    const drawdown = row.totalValueKrw - peak;
    if (drawdown < maxDrawdownKrw) {
      maxDrawdownKrw = drawdown;
      maxDrawdownRate = peak ? drawdown / peak : 0;
    }
  }
  return {
    latest,
    first,
    periodChangeKrw,
    netInflowKrw,
    investmentGainKrw,
    periodReturn: first.totalValueKrw ? investmentGainKrw / first.totalValueKrw : 0,
    monthToDateGainKrw,
    monthToDateReturn: monthFirst.totalValueKrw ? monthToDateGainKrw / monthFirst.totalValueKrw : 0,
    maxDrawdownKrw,
    maxDrawdownRate,
  };
}

export function getAvailableMonths(rows) {
  const seen = new Set();
  const months = [];
  for (const row of rows) {
    const ym = row.date.slice(0, 7);
    if (!seen.has(ym)) { seen.add(ym); months.push(ym); }
  }
  return months;
}

export function getNumbersChartSource(rows, allRows = rows, targetYearMonth = null) {
  const latest = rows[rows.length - 1];
  if (!latest) {
    return { points: [], rows: [], monthLabel: "", yearLabel: "" };
  }
  const ym = targetYearMonth || latest.date.slice(0, 7);
  const year = ym.slice(0, 4);
  const month = ym.slice(5, 7);
  const monthRows = rows.filter((row) => row.date.startsWith(`${year}-${month}`));
  let yearCumulativeKrw = 0;
  let monthCumulativeKrw = 0;
  const yearRows = allRows.filter((row) => row.date <= latest.date && row.date.startsWith(year));
  const yearGainByDate = new Map();
  for (const row of yearRows) {
    yearCumulativeKrw += row.investmentGainKrw;
    yearGainByDate.set(row.date, yearCumulativeKrw);
  }
  const points = monthRows.map((row) => {
    monthCumulativeKrw += row.investmentGainKrw;
    return {
      date: row.date,
      label: formatMonthDay(row.date),
      yearCumulativeMan: Math.round((yearGainByDate.get(row.date) || 0) / 10000),
      monthCumulativeMan: Math.round(monthCumulativeKrw / 10000),
      dailyMan: Math.round(row.investmentGainKrw / 10000),
    };
  });
  const shortYear = `${year.slice(2)}년`;
  const monthNumber = Number(month);
  return {
    points,
    yearLabel: `${shortYear} 누적수익`,
    monthLabel: `${monthNumber}월 누적 수익`,
    rows: [
      { label: `${shortYear} 누적 수익`, values: points.map((point) => point.yearCumulativeMan) },
      { label: `${monthNumber}월 누적 수익`, values: points.map((point) => point.monthCumulativeMan) },
      { label: "일일 수익", values: points.map((point) => point.dailyMan) },
    ],
  };
}

export function getAccountPerformanceRows(accountSnapshots = [], rows = []) {
  const snapshots = [...accountSnapshots].sort((a, b) => a.date.localeCompare(b.date));
  if (!snapshots.length || !rows.length) {
    return [];
  }
  const dateSet = new Set(rows.map((row) => row.date));
  const availableDates = unique(snapshots.map((snapshot) => snapshot.date).filter((date) => dateSet.has(date)));
  const latestDate = availableDates[availableDates.length - 1];
  const previousDate = availableDates[availableDates.length - 2];
  const firstDate = availableDates[0];
  if (!latestDate) {
    return [];
  }
  const byDateKey = new Map(snapshots.map((snapshot) => [`${snapshot.date}|||${snapshot.investor}|||${snapshot.account}`, snapshot]));
  return snapshots
    .filter((snapshot) => snapshot.date === latestDate)
    .map((latest) => {
      const key = `${latest.investor}|||${latest.account}`;
      const previous = previousDate ? byDateKey.get(`${previousDate}|||${key}`) : null;
      const first = firstDate ? byDateKey.get(`${firstDate}|||${key}`) : null;
      return {
        investor: latest.investor,
        account: latest.account,
        latestValueKrw: Number(latest.totalAssetsKrw || 0),
        dailyChangeKrw: previous ? Number(latest.totalAssetsKrw || 0) - Number(previous.totalAssetsKrw || 0) : 0,
        periodChangeKrw: first ? Number(latest.totalAssetsKrw || 0) - Number(first.totalAssetsKrw || 0) : 0,
        stockValueKrw: Number(latest.stockValueKrw || 0),
        cashKrw: Number(latest.cashKrw || 0),
        returnRate: Number(latest.returnRate || 0),
      };
    })
    .sort((a, b) => Math.abs(b.periodChangeKrw) - Math.abs(a.periodChangeKrw));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
