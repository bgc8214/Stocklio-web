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
  const topMovers = shouldExplainMovers ? getTopMovers(state, 3) : [];
  const titlePrefix = marketContext?.isMarketClosed ? "휴장일 기준 요약" : "마감 요약";
  const lines = [
    `Stocklio ${date} ${titlePrefix}`,
    "",
    `총자산: ${formatKrw(snapshot.totalValueKrw)}`,
    `${marketContext?.isMarketClosed ? "스냅샷 전일 대비" : "전일 대비"}: ${formatSignedKrw(dayChangeKrw)}`,
    `투자손익 추정: ${formatSignedKrw(investmentChangeKrw)}`,
    `입출금 영향: ${formatSignedKrw(netInflowKrw)}`,
    `주식: ${formatKrw(totals.stockValueKrw)} · 예수금: ${formatKrw(totals.cashKrw)}`,
  ];

  if (marketContext?.label) {
    lines.push(`가격 기준: ${marketContext.label}`);
  }

  if (topMovers.length) {
    lines.push("", "변동 원인 상위");
    for (const mover of topMovers) {
      const details = [
        formatSignedKrw(mover.valueKrw),
        Number.isFinite(mover.changePercent) ? formatPercent(mover.changePercent) : "",
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
    title: `${date} Stocklio ${titlePrefix}`,
    text: lines.join("\n"),
    metrics: {
      totalValueKrw: Number(snapshot.totalValueKrw || 0),
      dayChangeKrw,
      netInflowKrw,
      investmentChangeKrw,
      cashKrw: totals.cashKrw,
      stockValueKrw: totals.stockValueKrw,
      marketClosed: Boolean(marketContext?.isMarketClosed),
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
  const fxRate = Number(state.fxRate?.rate || state.fxRate || 1);
  const previousFx = Number(state.fxRate?.previousClose || state.fxRate?.rate || fxRate);
  return (state.holdings || [])
    .map((holding) => {
      const quantity = Number(holding.quantity || 0);
      const priceChange = Number(holding.priceChange);
      const price = Number(holding.price || 0);
      if (!Number.isFinite(priceChange) || !quantity) {
        return null;
      }
      const isUsd = holding.currency === "USD";
      const priceEffectKrw = quantity * priceChange * (isUsd ? previousFx : 1);
      const fxEffectKrw = isUsd ? quantity * price * (fxRate - previousFx) : 0;
      return {
        id: holding.id,
        name: holding.name || holding.ticker,
        ticker: holding.ticker,
        valueKrw: priceEffectKrw + fxEffectKrw,
        priceEffectKrw,
        fxEffectKrw,
        changePercent: Number(holding.priceChangePercent || 0),
      };
    })
    .filter((item) => item && item.valueKrw !== 0)
    .sort((a, b) => Math.abs(b.valueKrw) - Math.abs(a.valueKrw))
    .slice(0, limit);
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
