/**
 * 투자 시뮬레이터 계산 엔진
 * 브라우저, 로컬 서버, Vercel Function에서 동일하게 사용한다.
 *
 * 가격 데이터 형식: { date: "YYYY-MM-DD", close: number, adjClose: number }[]
 */

/**
 * 가격 행 배열에서 날짜 기준 맵을 만든다.
 * adjClose가 없으면 close를 fallback으로 사용하고 hasFallback 플래그를 표시한다.
 */
export function buildPriceMap(rows) {
  const map = new Map();
  let hasFallback = false;
  for (const row of rows) {
    const price = row.adjClose ?? row.close ?? null;
    if (price === null || price <= 0) continue;
    if (row.adjClose == null) hasFallback = true;
    map.set(row.date, price);
  }
  return { map, hasFallback };
}

/**
 * 정렬된 날짜 배열에서 targetDate 이상의 가장 가까운 거래일 날짜를 반환한다.
 * 없으면 null을 반환한다.
 */
export function findNextTradingDate(sortedDates, targetDate) {
  for (const d of sortedDates) {
    if (d >= targetDate) return d;
  }
  return null;
}

/**
 * 가격 데이터를 정규화한다.
 * - adjClose 우선, 없으면 close fallback
 * - 날짜 오름차순 정렬
 * - 유효 범위(start~end) 필터링
 * - 실제 시작일(상장일)이 start보다 늦으면 actualStart를 조정
 */
export function normalizePriceRows(rows, start, end) {
  const sorted = [...rows]
    .filter((r) => {
      const p = r.adjClose ?? r.close ?? null;
      return p !== null && p > 0 && r.date >= start && r.date <= end;
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const hasFallback = sorted.some((r) => r.adjClose == null);
  const actualStart = sorted.length > 0 ? sorted[0].date : null;

  return { rows: sorted, hasFallback, actualStart };
}

/**
 * 일시 투자 시뮬레이션
 *
 * @param {object} params
 * @param {{ date: string, close: number, adjClose?: number }[]} params.priceRows
 * @param {number} params.investAmount - 투자 원금 (KRW 또는 USD)
 * @param {string} params.start - 시작일 YYYY-MM-DD
 * @param {string} params.end  - 종료일 YYYY-MM-DD
 * @returns {SimulationResult}
 */
export function simulateLumpSum({ priceRows, investAmount, start, end }) {
  const { rows, hasFallback, actualStart } = normalizePriceRows(priceRows, start, end);
  if (rows.length < 2) {
    return errorResult("데이터가 충분하지 않습니다.", hasFallback, actualStart);
  }

  const buyPrice = rows[0].adjClose ?? rows[0].close;
  const shares = investAmount / buyPrice;

  const points = rows.map((r) => {
    const price = r.adjClose ?? r.close;
    return {
      date: r.date,
      principal: investAmount,
      value: shares * price,
    };
  });

  return buildResult(points, investAmount, hasFallback, actualStart);
}

/**
 * 정액 적립식 시뮬레이션
 *
 * @param {object} params
 * @param {{ date: string, close: number, adjClose?: number }[]} params.priceRows
 * @param {number} params.monthlyAmount - 매 적립 금액
 * @param {string} params.start
 * @param {string} params.end
 * @param {"monthly"|"weekly"|"daily"} params.frequency
 * @returns {SimulationResult}
 */
export function simulateDCA({ priceRows, monthlyAmount, start, end, frequency = "monthly" }) {
  const { rows, hasFallback, actualStart } = normalizePriceRows(priceRows, start, end);
  if (rows.length < 2) {
    return errorResult("데이터가 충분하지 않습니다.", hasFallback, actualStart);
  }

  const dateSet = new Set(rows.map((r) => r.date));
  const sortedDates = rows.map((r) => r.date);
  const priceByDate = new Map(rows.map((r) => [r.date, r.adjClose ?? r.close]));

  const buyDates = getBuyDates(sortedDates, start, end, frequency);

  let totalShares = 0;
  let totalPrincipal = 0;
  const buys = new Map();

  for (const buyDate of buyDates) {
    const tradingDate = findNextTradingDate(sortedDates, buyDate);
    if (!tradingDate) continue;
    const price = priceByDate.get(tradingDate);
    if (!price) continue;
    const shares = monthlyAmount / price;
    totalShares += shares;
    totalPrincipal += monthlyAmount;
    buys.set(tradingDate, (buys.get(tradingDate) || 0) + shares);
  }

  if (totalShares === 0) {
    return errorResult("매수 가능한 데이터가 없습니다.", hasFallback, actualStart);
  }

  let cumulativeShares = 0;
  let cumulativePrincipal = 0;
  const points = [];

  for (const row of rows) {
    const price = row.adjClose ?? row.close;
    if (buys.has(row.date)) {
      cumulativeShares += buys.get(row.date);
      cumulativePrincipal += monthlyAmount * Math.round(buys.get(row.date) * price / monthlyAmount);
    }
    // principal을 날짜별로 재계산 (누적 매수 금액 기준)
    points.push({
      date: row.date,
      principal: cumulativePrincipal,
      value: cumulativeShares * price,
    });
  }

  // principal을 정확하게 누적 투자금으로 보정
  let runningPrincipal = 0;
  let runningShares = 0;
  const correctedPoints = [];
  const buyDatesSorted = [...buys.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  let buyIdx = 0;

  for (const row of rows) {
    const price = row.adjClose ?? row.close;
    while (buyIdx < buyDatesSorted.length && buyDatesSorted[buyIdx][0] <= row.date) {
      const [, addedShares] = buyDatesSorted[buyIdx];
      const actualBuyPrice = priceByDate.get(buyDatesSorted[buyIdx][0]);
      runningShares += addedShares;
      runningPrincipal += addedShares * actualBuyPrice;
      buyIdx++;
    }
    correctedPoints.push({
      date: row.date,
      principal: runningPrincipal,
      value: runningShares * price,
    });
  }

  return buildResult(correctedPoints, runningPrincipal, hasFallback, actualStart);
}

/**
 * 몰빵 vs 적립식 비교
 *
 * @param {object} params
 * @param {{ date: string, close: number, adjClose?: number }[]} params.priceRows
 * @param {number} params.totalAmount - 총 투자금
 * @param {string} params.start
 * @param {string} params.end
 * @param {"monthly"|"weekly"|"daily"} params.frequency
 * @returns {{ lumpSum: SimulationResult, dca: SimulationResult }}
 */
export function simulateLumpSumVsDCA({ priceRows, totalAmount, start, end, frequency = "monthly" }) {
  const { rows } = normalizePriceRows(priceRows, start, end);
  const sortedDates = rows.map((r) => r.date);
  const buyDates = getBuyDates(sortedDates, start, end, frequency);

  // 실제 거래일이 존재하는 매수 날짜만 카운트해 분할 금액을 계산한다
  const executableCount = buyDates.filter((d) => findNextTradingDate(sortedDates, d) !== null).length;
  const periodCount = executableCount || 1;
  const monthlyAmount = totalAmount / periodCount;

  const lumpSum = simulateLumpSum({ priceRows, investAmount: totalAmount, start, end });
  const dca = simulateDCA({ priceRows, monthlyAmount, start, end, frequency });

  return { lumpSum, dca };
}

/**
 * 다중 종목 비교
 * 각 종목에 동일 투자금을 일시 투자하는 시나리오
 *
 * @param {object[]} items - [{ symbol, priceRows, investAmount }]
 * @param {string} start
 * @param {string} end
 * @returns {{ symbol: string, result: SimulationResult }[]}
 */
export function simulateMultiSymbol({ items, start, end }) {
  return items.map(({ symbol, priceRows, investAmount }) => ({
    symbol,
    result: simulateLumpSum({ priceRows, investAmount, start, end }),
  }));
}

/**
 * 최대 낙폭(MDD) 계산
 * @param {number[]} values - 시계열 평가금액 배열
 * @returns {number} 0 ~ 1 사이의 낙폭 비율 (예: 0.35 = 35% 하락)
 */
export function calcMaxDrawdown(values) {
  let peak = -Infinity;
  let maxDD = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = peak > 0 ? (peak - v) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

// ─── 내부 헬퍼 ────────────────────────────────────────────────────

/**
 * @typedef {object} SimulationPoint
 * @property {string} date
 * @property {number} principal
 * @property {number} value
 */

/**
 * @typedef {object} SimulationResult
 * @property {boolean} ok
 * @property {string|null} error
 * @property {string|null} actualStart
 * @property {boolean} hasFallback  - adjClose 없어서 close 사용 여부
 * @property {SimulationPoint[]} points
 * @property {number} totalPrincipal
 * @property {number} finalValue
 * @property {number} gain
 * @property {number} returnRate
 * @property {number} maxDrawdown
 */

function buildResult(points, totalPrincipal, hasFallback, actualStart) {
  if (!points.length) {
    return errorResult("계산 결과가 없습니다.", hasFallback, actualStart);
  }
  const finalValue = points[points.length - 1].value;
  const gain = finalValue - totalPrincipal;
  const returnRate = totalPrincipal > 0 ? gain / totalPrincipal : 0;
  const maxDrawdown = calcMaxDrawdown(points.map((p) => p.value));

  return {
    ok: true,
    error: null,
    actualStart,
    hasFallback,
    points,
    totalPrincipal,
    finalValue,
    gain,
    returnRate,
    maxDrawdown,
  };
}

function errorResult(message, hasFallback = false, actualStart = null) {
  return {
    ok: false,
    error: message,
    actualStart,
    hasFallback,
    points: [],
    totalPrincipal: 0,
    finalValue: 0,
    gain: 0,
    returnRate: 0,
    maxDrawdown: 0,
  };
}

/**
 * 적립 주기에 따라 매수 대상 날짜 문자열 배열을 반환한다.
 * 실제 거래일 여부는 findNextTradingDate로 보정한다.
 */
function getBuyDates(sortedTradingDates, start, end, frequency) {
  const dates = [];
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (frequency === "monthly") {
    let cur = new Date(startDate);
    cur.setDate(1);
    while (cur <= endDate) {
      const s = formatDate(cur);
      if (s >= start && s <= end) dates.push(s);
      cur.setMonth(cur.getMonth() + 1);
    }
  } else if (frequency === "weekly") {
    let cur = new Date(startDate);
    while (cur <= endDate) {
      dates.push(formatDate(cur));
      cur.setDate(cur.getDate() + 7);
    }
  } else {
    // daily: 실제 거래일 그대로 사용
    return sortedTradingDates.filter((d) => d >= start && d <= end);
  }

  return dates;
}

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
