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
    `📊 투자일지 ${date} ${titlePrefix}`,
    "",
    `총자산  ${formatCompact(snapshot.totalValueKrw)}`,
    `전일 대비  ${formatSignedCompact(dayChangeKrw)}`,
  ];

  // 입출금이 있을 때만 분리 표시, 없으면 한 줄로
  if (netInflowKrw !== 0) {
    lines.push(`투자손익  ${formatSignedCompact(investmentChangeKrw)}`);
    lines.push(`입출금  ${formatSignedCompact(netInflowKrw)}`);
  }

  lines.push(`주식 ${formatCompact(totals.stockValueKrw)} · 예수금 ${formatCompact(totals.cashKrw)}`);

  if (shouldExplainMovers && moveBreakdown.hasData) {
    const fxPart = Math.abs(moveBreakdown.fxEffectKrw) >= 1000000
      ? ` · 환율 ${formatSignedCompact(moveBreakdown.fxEffectKrw)}`
      : "";
    lines.push(`가격 ${formatSignedCompact(moveBreakdown.priceEffectKrw)}${fxPart}`);
    const insight = getFxInsight({ investmentChangeKrw, priceEffectKrw: moveBreakdown.priceEffectKrw, fxEffectKrw: moveBreakdown.fxEffectKrw });
    if (insight) lines.push(`💬 ${insight}`);
  }

  if (topMovers.length) {
    lines.push("", "▸ 변동 상위");
    for (const mover of topMovers) {
      const pct = Number.isFinite(mover.changePercent) ? ` ${formatPercent(mover.changePercent)}` : "";
      const fx = Math.abs(mover.fxEffectKrw) >= 1000000
        ? ` (환율 ${formatSignedCompact(mover.fxEffectKrw)})`
        : "";
      lines.push(`${mover.name}  ${formatSignedCompact(mover.valueKrw)}${pct}${fx}`);
    }
  } else if (marketContext?.isMarketClosed) {
    lines.push("", `미국장 ${marketContext.closedReason || "휴장"} · 종목별 변동 없음`);
  }

  // 목표가/손절가 알림
  const priceAlerts = [];
  for (const h of state.holdings || []) {
    const price = Number(h.price || 0);
    if (h.targetPrice && price >= Number(h.targetPrice)) {
      priceAlerts.push(`🎯 ${h.name || h.ticker}: 목표가 도달 (${formatCompact(price)})`);
    }
    if (h.stopLoss && price > 0 && price <= Number(h.stopLoss)) {
      priceAlerts.push(`⚠️ ${h.name || h.ticker}: 손절가 이하 (${formatCompact(price)})`);
    }
  }
  if (priceAlerts.length) {
    lines.push("", "▸ 알림");
    lines.push(...priceAlerts);
  }

  if (siteUrl) {
    lines.push("", siteUrl.replace(/\/$/, ""));
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
  return {
    hasData: holdingRows.length > 0 || cashFxEffectKrw !== 0,
    priceEffectKrw,
    holdingFxEffectKrw,
    cashFxEffectKrw,
    fxEffectKrw,
    totalExplainedKrw: priceEffectKrw + fxEffectKrw,
  };
}

function getHoldingMoveRows(state) {
  const fxRate = Number(state.fxRate?.rate || state.fxRate || 1);
  const previousFx = Number(state.fxRate?.previousClose || state.fxRate?.rate || fxRate);
  const rowsByTicker = new Map();
  for (const holding of state.holdings || []) {
    const quantity = Number(holding.quantity || 0);
    if (!quantity) continue;
    const price = Number(holding.price || 0);
    // priceChange 우선, 없으면 price - previousClose로 직접 계산
    const pc = holding.priceChange;
    const prevClose = Number(holding.previousClose || 0);
    let priceChange;
    if (pc !== null && pc !== undefined && pc !== "" && Number.isFinite(Number(pc))) {
      priceChange = Number(pc);
    } else if (prevClose > 0 && price > 0) {
      priceChange = price - prevClose;
    } else {
      // 이전 종가도 없으면 가격 효과는 0으로 처리 (FX 효과는 여전히 계산)
      priceChange = 0;
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

// 억/만 단위 compact 표시 (텔레그램용)
export function formatCompact(value) {
  const n = Math.abs(Number(value || 0));
  if (n >= 1e8) return `₩${(n / 1e8).toFixed(2)}억`;
  if (n >= 1e4) return `₩${Math.round(n / 1e4).toLocaleString("ko-KR")}만`;
  return formatKrw(value);
}

export function formatSignedCompact(value) {
  const n = Number(value || 0);
  const sign = n >= 0 ? "+" : "-";
  const abs = Math.abs(n);
  if (abs >= 1e8) return `${sign}₩${(abs / 1e8).toFixed(2)}억`;
  if (abs >= 1e4) return `${sign}₩${Math.round(abs / 1e4).toLocaleString("ko-KR")}만`;
  return formatSignedKrw(value);
}

export function formatPercent(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}
