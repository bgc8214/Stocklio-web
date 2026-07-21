// SPA 진입점. Phase 0에서는 빌드 파이프라인만 Vite로 전환하고 동작은 기존 vanilla 앱을 그대로 유지한다.
// 로드 순서는 기존 index.html의 스크립트 순서(supabase-auth → app → craft-dashboard)를 재현한다.
// 이후 Phase에서 이 파일이 <App/>을 마운트하는 방식으로 교체된다.
import "../supabase-auth.js";
import { initializeStocklioApp } from "../app/stocklio-app.js";
import "../craft-dashboard.jsx";

initializeStocklioApp();
