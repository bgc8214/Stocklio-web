export const STORAGE_KEY = "stock-portfolio-lab-state";
export const CACHE_PREFIX = "stock-portfolio-lab-yahoo-cache-v2";
export const QUOTE_CACHE_TTL_MS = 5 * 60 * 1000;
export const FX_CACHE_TTL_MS = 60 * 60 * 1000;
export const AUTO_PRICE_REFRESH_TTL_MS = 10 * 60 * 1000;
export const DATA_VERSION = 6;
export const AUTH_READY_TIMEOUT_MS = 1800;

export const palette = ["#1F4431", "#3366a8", "#a97819", "#7b5aa6", "#b94343"];

export const dashboardCardLabels = {
  "total-value": "총자산",
  "total-cost": "주식 매입금액",
  "total-gain": "주식 평가손익",
  "cash-total": "예수금",
  "fx-rate": "환율",
  allocation: "자산 비중",
  "performance-flow": "성과 흐름",
  breakdown: "오늘 변동 원인",
  "top-mover": "오늘의 주인공",
};

export const DEFAULT_HOLDING_SORT = "value-desc";
export const DEFAULT_CASH_FLOW_SORT = "date-desc";

export const viewCopy = {
  dashboard: { title: "대시보드", subtitle: "포트폴리오 현황" },
  holdings: { title: "보유 종목", subtitle: "" },
  accounts: { title: "계좌", subtitle: "예수금 관리와 계좌 현황" },
  performance: { title: "성과", subtitle: "누적 수익과 일별 증감" },
  cashflows: { title: "입출금", subtitle: "입출금 · 배당 · 수수료 기록" },
  automation: { title: "설정", subtitle: "알림, 백업, 동기화" },
  simulator: { title: "시뮬레이터", subtitle: "만약 이 방식으로 투자했다면" },
};

export const dashboardSizeToSpan = {
  small: 3,
  medium: 4,
  wide: 6,
  full: 12,
};

export const defaultDashboardLayout = [
  { id: "total-value", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-cost", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "total-gain", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "cash-total", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "fx-rate", widthPct: 25, span: 3, minHeight: 128, visible: true },
  { id: "allocation", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "performance-flow", widthPct: 100, span: 12, minHeight: 360, visible: true },
  { id: "breakdown", widthPct: 50, span: 6, minHeight: 320, visible: true },
  { id: "top-mover", widthPct: 50, span: 6, minHeight: 160, visible: true },
];
