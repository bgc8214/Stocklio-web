// 앱 전역 상태의 단일 진입점.
//
// 관심사별 단일 writer 원칙:
// - portfolio data: 아직 legacy stocklio-app.js 가 writer 다. legacy 가 dispatch 하는
//   `stocklio:state` 이벤트를 이 스토어가 read-only 로 미러링한다(Phase 1a).
// - UI chrome 상태(activeView/currencyMode/auth/sync/toast/page title): React 셸이
//   소유한다. legacy 는 setView/renderAuth/showOperationToast 등에서 이 스토어로
//   상태를 push 하고, 사용자 액션은 store.actions(legacy 가 등록)로 delegate 한다(Phase 1b).
import { create } from "zustand";

export const useStore = create((set) => ({
  // ── portfolio (legacy 미러, read-only) ─────────────────────────
  portfolio: null,
  revision: 0,
  setPortfolio: (portfolio) => set((prev) => ({ portfolio, revision: prev.revision + 1 })),

  // ── UI chrome 상태 (React 셸 소유) ─────────────────────────────
  activeView: "dashboard",
  currencyMode: localStorage.getItem("currencyMode") === "usd" ? "usd" : "krw",
  pageTitle: "대시보드",
  pageSubtitle: "포트폴리오 현황",
  auth: { configured: false, signedIn: false, user: null },
  sync: { status: "idle", message: "" },
  toast: { visible: false, title: "", detail: "", tone: "info" },
  // sr-only 상태 라인(providerStatus/lastUpdated).
  status: { title: "준비됨", detail: "작업 내역 없음" },
  // 로그인/이메일 다이얼로그 open 상태 + 이메일 프리필.
  loginDialogOpen: false,
  emailDialogOpen: false,
  emailPrefill: "",

  setActiveView: (activeView, pageTitle, pageSubtitle) =>
    set((prev) => ({
      activeView,
      pageTitle: pageTitle ?? prev.pageTitle,
      pageSubtitle: pageSubtitle ?? prev.pageSubtitle,
    })),
  setCurrencyMode: (currencyMode) => set({ currencyMode }),
  setAuth: (auth) => set({ auth }),
  setSync: (sync) => set({ sync }),
  setToast: (toast) => set((prev) => ({ toast: { ...prev.toast, ...toast } })),
  setStatus: (status) => set({ status }),
  setLoginDialog: (loginDialogOpen) => set({ loginDialogOpen }),
  setEmailDialog: (emailDialogOpen, emailPrefill) =>
    set((prev) => ({ emailDialogOpen, emailPrefill: emailPrefill ?? prev.emailPrefill })),

  // ── legacy 가 등록하는 imperative 액션 (React 셸이 호출) ─────────
  // { setView, refreshPrices, saveSnapshot, openLoginDialog, signOut,
  //   signInWithGoogle, signInWithNaver, signInWithEmail, applyCurrencyMode, addHolding }
  actions: {},
  registerActions: (actions) => set((prev) => ({ actions: { ...prev.actions, ...actions } })),
}));

// legacy 의 portfolio 브리지(`stocklio:state`)를 스토어로 연결한다.
// main.jsx 에서 앱 부트스트랩 직전에 한 번 호출한다.
export function connectLegacyBridge() {
  const { setPortfolio } = useStore.getState();
  const initial = window.StocklioApp?.getState?.();
  if (initial) {
    setPortfolio(initial);
  }
  const handleState = (event) => setPortfolio(event.detail);
  window.addEventListener("stocklio:state", handleState);
  return () => window.removeEventListener("stocklio:state", handleState);
}
