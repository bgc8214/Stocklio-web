export function getDailyMoveRows({ holdings = [], fxRate = 1, marketContext = null } = {}) {
  if (marketContext?.isMarketClosed) {
    return [];
  }

  // 동일 ticker는 계좌 불문하고 합산
  const byTicker = new Map();
  for (const holding of holdings) {
    const move = getHoldingDailyMove(holding, fxRate);
    if (!move.hasData) continue;
    const key = holding.ticker;
    if (byTicker.has(key)) {
      const existing = byTicker.get(key);
      existing.quantity += Number(holding.quantity || 0);
      existing.value += move.valueKrw;
      existing.priceEffectKrw += move.priceEffectKrw;
      existing.fxEffectKrw += move.fxEffectKrw;
    } else {
      byTicker.set(key, {
        id: holding.id,
        name: holding.name || holding.ticker,
        ticker: holding.ticker,
        quantity: Number(holding.quantity || 0),
        value: move.valueKrw,
        priceEffectKrw: move.priceEffectKrw,
        fxEffectKrw: move.fxEffectKrw,
        changePercent: move.changePercent,
        hasData: true,
      });
    }
  }

  const rows = [...byTicker.values()]
    .filter((item) => item.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const grossMoveKrw = rows.reduce((sum, row) => sum + Math.abs(row.value), 0);
  return rows.map((row) => ({
    ...row,
    contributionShare: grossMoveKrw ? Math.abs(row.value) / grossMoveKrw : 0,
  }));
}

export function getHoldingDailyMove(holding, fxRate = 1, marketContext = null) {
  if (marketContext?.isMarketClosed) {
    return { hasData: false, valueKrw: 0, priceEffectKrw: 0, fxEffectKrw: 0, changePercent: 0 };
  }
  const priceChange = Number(holding.priceChange);
  const changePercent = Number(holding.priceChangePercent || 0);
  if (!Number.isFinite(priceChange)) {
    return { hasData: false, valueKrw: 0, priceEffectKrw: 0, fxEffectKrw: 0, changePercent: 0 };
  }
  const currentFx = resolveCurrentFx(fxRate);
  const previousFx = resolvePreviousFx(fxRate);
  const quantity = Number(holding.quantity || 0);
  const currentPrice = Number(holding.price);
  const previousPrice = Number.isFinite(Number(holding.previousClose))
    ? Number(holding.previousClose)
    : Number.isFinite(currentPrice)
      ? currentPrice - priceChange
      : null;
  const isUsd = holding.currency === "USD";
  const nativePriceEffect = quantity * priceChange;
  const priceEffectKrw = nativePriceEffect * (isUsd ? previousFx : 1);
  const fxEffectKrw = isUsd && Number.isFinite(currentPrice)
    ? quantity * currentPrice * (currentFx - previousFx)
    : 0;

  return {
    hasData: true,
    valueKrw: priceEffectKrw + fxEffectKrw,
    priceEffectKrw,
    fxEffectKrw,
    changePercent,
    previousPrice,
  };
}

function resolveCurrentFx(fxRate) {
  if (typeof fxRate === "object" && fxRate) {
    return Number(fxRate.rate || 1);
  }
  return Number(fxRate || 1);
}

function resolvePreviousFx(fxRate) {
  if (typeof fxRate === "object" && fxRate) {
    return Number(fxRate.previousClose || fxRate.rate || 1);
  }
  return Number(fxRate || 1);
}
