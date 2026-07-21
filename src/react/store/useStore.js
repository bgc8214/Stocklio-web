// Phase 1a: 앱 전역 상태의 단일 진입점.
//
// 이 단계에서는 아직 legacy stocklio-app.js 가 상태의 주인(writer)이다.
// 이 스토어는 legacy 가 dispatch 하는 `stocklio:state` 이벤트를 구독해
// portfolio state 를 read-only 로 미러링한다. React 뷰(현재는 대시보드)는
// window.StocklioApp 을 직접 참조하지 않고 이 스토어를 통해 상태를 읽는다.
//
// 이후 Phase 에서 legacy plumbing 을 걷어내며 이 스토어가 실제 writer 로
// 승격된다(mutate/persist 액션 추가). 지금은 브리지 미러이므로 stocklio-app.js
// 의 저장/렌더 로직은 건드리지 않는다.
import { create } from "zustand";

export const useStore = create((set) => ({
  // portfolio state (holdings/accounts/cashFlows/... version=6). 최초 로드 전에는 null.
  portfolio: null,
  // stocklio:state 이벤트마다 증가 — 동일 참조가 아닌 경우에도 재계산을 강제할 때 사용.
  revision: 0,
  setPortfolio: (portfolio) =>
    set((prev) => ({ portfolio, revision: prev.revision + 1 })),
}));

// legacy 브리지를 스토어로 연결한다. main.jsx 에서 앱 부트스트랩 직후 한 번 호출한다.
export function connectLegacyBridge() {
  const { setPortfolio } = useStore.getState();
  // 초기 상태: legacy 가 이미 publishState() 를 호출했을 수 있으므로 즉시 흡수.
  const initial = window.StocklioApp?.getState?.();
  if (initial) {
    setPortfolio(initial);
  }
  const handleState = (event) => setPortfolio(event.detail);
  window.addEventListener("stocklio:state", handleState);
  return () => window.removeEventListener("stocklio:state", handleState);
}
