import { getTotals } from "./portfolio-core.js";

export function buildDailyDigest({ state, snapshot, previousSnapshot, date, siteUrl = "", marketContext = null }) {
  const totals = getTotals({
    holdings: state.holdings || [],
    cashBalances: state.cashBalances || [],
    fxRate: Number(state.fxRate?.rate || state.fxRate || 1),
  });
  const dayChangeKrw = previousSnapshot
    ? Number(snapshot.totalValueKrw || 0) - Number(previousSnapshot.totalValueKrw || 0)
    : 0;
  const netInflowKrw = Number(snapshot.netInflowKrw || 0);
  const investmentChangeKrw = dayChangeKrw - netInflowKrw;
  const shouldExplainMovers = !marketContext?.isMarketClosed;
  const moveBreakdown = shouldExplainMovers ? getMoveBreakdown(state) : createEmptyMoveBreakdown();
  const topMovers = shouldExplainMovers ? getTopMovers(state, 3) : [];
  const titlePrefix = marketContext?.isMarketClosed ? "휴장일 기준 요약" : "마감 요약";
  const lines = [
    `투자일지 ${date} ${titlePrefix}`,
    "",
    `총자산: ${formatKrw(snapshot.totalValueKrw)}`,
    `${marketContext?.isMarketClosed ? "스냅샷 전일 대비" : "전일 대비"}: ${formatSignedKrw(dayChangeKrw)}`,
    `투자손익 추정: ${formatSignedKrw(investmentChangeKrw)}`,
    `입출금 영향: ${formatSignedKrw(netInflowKrw)}`,
    `주식: ${formatKrw(totals.stockValueKrw)} · 예수금: ${formatKrw(totals.cashKrw)}`,
  ];

  if (shouldExplainMovers && moveBreakdown.hasData) {
    const breakdownLine = `변동 분해: 가격 ${formatSignedKrw(moveBreakdown.priceEffectKrw)} · 환율 ${formatSignedKrw(moveBreakdown.fxEffectKrw)}`;
    const explainedTotal = moveBreakdown.totalExplainedKrw;
    const unexplained = dayChangeKrw - explainedTotal;
    const missingNote = moveBreakdown.missingCount > 0
      ? ` (${moveBreakdown.missingCount}개 종목 가격 미반영, 미설명 ${formatSignedKrw(unexplained)})`
      : "";
    lines.push(breakdownLine + missingNote);
    const insight = getFxInsight({ investmentChangeKrw, priceEffectKrw: moveBreakdown.priceEffectKrw, fxEffectKrw: moveBreakdown.fxEffectKrw });
    if (insight) {
      lines.push(`해석: ${insight}`);
    }
  }

  if (marketContext?.label) {
    lines.push(`가격 기준: ${marketContext.label}`);
  }

  if (topMovers.length) {
    lines.push("", "변동 원인 상위");
    for (const mover of topMovers) {
      const details = [
        formatSignedKrw(mover.valueKrw),
        Number.isFinite(mover.changePercent) ? formatPercent(mover.changePercent) : "",
        formatMoverBreakdown(mover),
      ].filter(Boolean);
      lines.push(`- ${mover.name}: ${details.join(" · ")}`);
    }
  } else if (marketContext?.isMarketClosed) {
    lines.push("", `변동 원인: 미국장 ${marketContext.closedReason || "휴장"}으로 새 종목별 변동을 표시하지 않습니다`);
  } else {
    lines.push("", "변동 원인: 가격 변동 데이터가 아직 없습니다");
  }

  if (siteUrl) {
    lines.push("", `자세히 보기: ${siteUrl.replace(/\/$/, "")}`);
  }

  return {
    title: `${date} 투자일지 ${titlePrefix}`,
    text: lines.join("\n"),
    metrics: {
      totalValueKrw: Number(snapshot.totalValueKrw || 0),
      dayChangeKrw,
      netInflowKrw,
      investmentChangeKrw,
      cashKrw: totals.cashKrw,
      stockValueKrw: totals.stockValueKrw,
      marketClosed: Boolean(marketContext?.isMarketClosed),
      priceEffectKrw: moveBreakdown.priceEffectKrw,
      fxEffectKrw: moveBreakdown.fxEffectKrw,
      cashFxEffectKrw: moveBreakdown.cashFxEffectKrw,
    },
    topMovers,
  };
}

export function shouldSendDailyDigest(settings, digest) {
  if (!settings?.telegram_enabled || !settings?.daily_digest_enabled) {
    return false;
  }
  const threshold = Number(settings.large_move_threshold_krw || 0);
  if (threshold > 0 && Math.abs(digest.metrics.dayChangeKrw) < threshold) {
    return false;
  }
  return true;
}

export function getTopMovers(state, limit = 3) {
  return getHoldingMoveRows(state)
    .filter((item) => item.valueKrw !== 0)
    .sort((a, b) => Math.abs(b.valueKrw) - Math.abs(a.valueKrw))
    .slice(0, limit);
}

export function getMoveBreakdown(state) {
  const holdingRows = getHoldingMoveRows(state);
  const fxRate = Number(state.fxRate?.rate || state.fxRate || 1);
  const previousFx = Number(state.fxRate?.previousClose || state.fxRate?.rate || fxRate);
  const cashFxEffectKrw = (state.cashBalances || []).reduce((sum, cash) => {
    return cash.currency === "USD" ? sum + Number(cash.amount || 0) * (fxRate - previousFx) : sum;
  }, 0);
  const priceEffectKrw = holdingRows.reduce((sum, item) => sum + item.priceEffectKrw, 0);
  const holdingFxEffectKrw = holdingRows.reduce((sum, item) => sum + item.fxEffectKrw, 0);
  const fxEffectKrw = holdingFxEffectKrw + cashFxEffectKrw;
  // priceChange가 없어서 계산에서 빠진 종목 수 (가격 갱신 실패)
  const missingCount = (state.holdings || []).filter((h) => {
    const q = Number(h.quantity || 0);
    if (!q) return false;
    // null / undefined / "" / NaN 은 모두 "미반영"으로 간주
    const pc = h.priceChange;
    return pc === null || pc === undefined || pc === "" || !Number.isFinite(Number(pc));
  }).length;
  return {
    hasData: holdingRows.length > 0 || cashFxEffectKrw !== 0,
    priceEffectKrw,
    holdingFxEffectKrw,
    cashFxEffectKrw,
    fxEffectKrw,
    totalExplainedKrw: priceEffectKrw + fxEffectKrw,
    missingCount,
  };
}

function getHoldingMoveRows(state) {
  const fxRate = Number(state.fxRate?.rate || state.fxRate || 1);
  const previousFx = Number(state.fxRate?.previousClose || state.fxRate?.rate || fxRate);
  const rowsByTicker = new Map();
  for (const holding of state.holdings || []) {
    const quantity = Number(holding.quantity || 0);
    const pc = holding.priceChange;
    const priceChange = Number(pc);
    const price = Number(holding.price || 0);
    if (!quantity || pc === null || pc === undefined || pc === "" || !Number.isFinite(priceChange)) {
      continue;
    }

    const ticker = String(holding.ticker || holding.name || "").trim();
    const key = ticker ? ticker.toUpperCase() : String(holding.id);
    const isUsd = holding.currency === "USD";
    const priceEffectKrw = quantity * priceChange * (isUsd ? previousFx : 1);
    const fxEffectKrw = isUsd ? quantity * price * (fxRate - previousFx) : 0;
    const changePercent = Number(holding.priceChangePercent || 0);
    const existing = rowsByTicker.get(key);

    if (existing) {
      existing.quantity += quantity;
      existing.valueKrw += priceEffectKrw + fxEffectKrw;
      existing.priceEffectKrw += priceEffectKrw;
      existing.fxEffectKrw += fxEffectKrw;
      if (Number.isFinite(changePercent) && !Number.isFinite(existing.changePercent)) {
        existing.changePercent = changePercent;
      }
      continue;
    }

    rowsByTicker.set(key, {
      id: ticker || holding.id,
      name: holding.name || ticker,
      ticker,
      quantity,
      valueKrw: priceEffectKrw + fxEffectKrw,
      priceEffectKrw,
      fxEffectKrw,
      changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    });
  }

  return [...rowsByTicker.values()];
}

function createEmptyMoveBreakdown() {
  return {
    hasData: false,
    priceEffectKrw: 0,
    holdingFxEffectKrw: 0,
    cashFxEffectKrw: 0,
    fxEffectKrw: 0,
    totalExplainedKrw: 0,
  };
}

function getFxInsight({ investmentChangeKrw, priceEffectKrw, fxEffectKrw }) {
  const absPrice = Math.abs(priceEffectKrw);
  const absFx = Math.abs(fxEffectKrw);
  if (absFx < 1000 || absFx < absPrice * 0.25) {
    return "";
  }
  if (priceEffectKrw < 0 && fxEffectKrw > 0 && investmentChangeKrw >= 0) {
    return "주가는 하락했지만 USD/KRW 상승이 총자산을 끌어올렸습니다.";
  }
  if (priceEffectKrw > 0 && fxEffectKrw < 0 && investmentChangeKrw <= 0) {
    return "주가는 상승했지만 USD/KRW 하락이 총자산을 눌렀습니다.";
  }
  return fxEffectKrw > 0
    ? "USD/KRW 상승 영향이 총자산 변동에 크게 반영됐습니다."
    : "USD/KRW 하락 영향이 총자산 변동에 크게 반영됐습니다.";
}

function formatMoverBreakdown(mover) {
  if (Math.abs(mover.fxEffectKrw) < 1000) {
    return "";
  }
  return `가격 ${formatSignedKrw(mover.priceEffectKrw)}, 환율 ${formatSignedKrw(mover.fxEffectKrw)}`;
}

export function formatKrw(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatSignedKrw(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : "-"}${formatKrw(Math.abs(number))}`;
}

export function formatPercent(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}
