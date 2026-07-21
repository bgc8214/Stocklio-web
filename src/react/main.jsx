// SPA 진입점.
// Phase 1a: 빌드/동작은 기존 vanilla 앱이 담당하고, 새로 도입한 Zustand 스토어가
// legacy 의 `stocklio:state` 브리지를 미러링한다. 대시보드(React)는 이 스토어를 읽는다.
// 로드 순서는 기존 index.html 의 스크립트 순서(supabase-auth → app → craft-dashboard)를 재현한다.
import "../supabase-auth.js";
import { initializeStocklioApp } from "../app/stocklio-app.js";
import { connectLegacyBridge } from "./store/useStore.js";
import "../craft-dashboard.jsx";

// initialize() 의 첫 render()→publishState() 이전에 브리지 리스너를 붙여야
// 초기 상태 이벤트를 놓치지 않는다.
connectLegacyBridge();
initializeStocklioApp();
