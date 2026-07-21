import React from "react";

// holdings-view.tickerLogoHtml 를 JSX 로 이식. Parqet 로고 + 실패 시 컬러 폴백 이니셜.
const LOGO_COLORS = [
  "#1d6fa4", "#e8572a", "#2e7d32", "#7b1fa2", "#c62828",
  "#00695c", "#283593", "#f57f17", "#4e342e", "#37474f",
];
const KR_ETF_PROVIDER_SYMBOLS = {
  KODEX: "005930.KS", TIGER: "006800.KS", ACE: "071050.KS", RISE: "RISE",
  HANARO: "086790.KS", 하나1Q: "086790.KS", SOL: "055550.KS", ARIRANG: "000370.KS", KINDEX: "071050.KS",
};

function resolveLogoSymbol(ticker, name) {
  if (/^\d{6}\.KS$/.test(ticker)) return ticker;
  const fullName = (name || ticker || "").trim();
  for (const [prefix, sym] of Object.entries(KR_ETF_PROVIDER_SYMBOLS)) {
    if (fullName.startsWith(prefix + " ") || fullName === prefix) return sym;
  }
  return (ticker || name || "").replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

export function TickerLogo({ ticker, name, size = 36 }) {
  const symbol = resolveLogoSymbol(ticker, name);
  const fallbackLetter = (ticker || name || "?").replace(/[^A-Za-z0-9가-힣]/g, "")[0]?.toUpperCase() || "?";
  const colorKey = (ticker || name || "").toUpperCase();
  const colorIdx = [...colorKey].reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length;
  const bg = LOGO_COLORS[colorIdx];
  const imgUrl = `https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol)}?format=svg`;
  return (
    <span className="ticker-logo" style={{ width: size, height: size }}>
      <img
        src={imgUrl} alt={ticker || name} width={size} height={size}
        onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }}
      />
      <span className="ticker-logo-fallback" style={{ display: "none", background: bg, width: size, height: size, fontSize: Math.round(size * 0.42) }}>{fallbackLetter}</span>
    </span>
  );
}
