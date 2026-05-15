export function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatKrw(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value || 0);
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
