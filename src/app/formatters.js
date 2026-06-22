export function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatKrw(value) {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(value || 0)}원`;
}

export function formatMoney(value, currency = "USD") {
  return currency === "KRW" ? formatKrw(value) : formatUsd(value);
}

export function formatCompactKrw(value) {
  const abs = Math.abs(value || 0);
  if (abs >= 100000000) {
    return `${formatNumber((value || 0) / 100000000, 1)}억`;
  }
  if (abs >= 10000) {
    return `${formatNumber((value || 0) / 10000, 0)}만`;
  }
  return formatKrw(value);
}

// 통화 모드에 따라 금액 표시: "usd" → 달러 원본, "krw" → 원화 환산
export function formatMoneyByMode(value, holdingCurrency, displayMode, fxRate) {
  if (displayMode === "krw") {
    const krwValue = holdingCurrency === "USD" ? (value || 0) * (fxRate || 1) : (value || 0);
    return formatKrw(krwValue);
  }
  return formatMoney(value, holdingCurrency);
}

// 변동금액 표시: 토스 스타일 — 부호 포함, 통화 기호 없이 숫자만
// valueKrw/valueUsd 중 displayMode에 맞게 이미 변환된 값을 받는다
export function formatChangePrefixed(value, isKrw) {
  const n = value || 0;
  const sign = n >= 0 ? "+" : "";
  if (isKrw) {
    return `${sign}${new Intl.NumberFormat("ko-KR").format(Math.round(n))}`;
  }
  return `${sign}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n)}`;
}

// 손익처럼 holdingCurrency 기준 값을 받아 displayMode에 맞게 환산 후 부호 포함 포맷
export function formatChangeByMode(value, holdingCurrency, displayMode, fxRate) {
  if (displayMode === "krw") {
    const krwValue = holdingCurrency === "USD" ? (value || 0) * (fxRate || 1) : (value || 0);
    return formatChangePrefixed(krwValue, true);
  }
  return formatChangePrefixed(value, holdingCurrency === "KRW");
}

export function formatChartLabel(value) {
  return Number(value || 0) === 0 ? "0" : formatNumber(value, 0);
}

export function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value || 0);
}

export function formatPercent(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatAsOf(value) {
  if (!value || value === "샘플") {
    return value || "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getMonth() + 1}. ${date.getDate()}.`;
}

export function formatMonthDay(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
