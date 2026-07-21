// SPA 진입점.
// Phase 1a: Zustand 스토어가 legacy 의 `stocklio:state` 브리지를 미러링, 대시보드가 스토어를 읽음.
// Phase 1b-1: React 셸(App→Sidebar)이 사이드바를 소유. 나머지 chrome/6탭은 아직 legacy.
// 로드 순서는 기존 index.html 의 스크립트 순서(supabase-auth → app → craft-dashboard)를 재현한다.
import React from "react";
import { createRoot } from "react-dom/client";
import "../supabase-auth.js";
import { initializeStocklioApp } from "../app/stocklio-app.js";
import { connectLegacyBridge } from "./store/useStore.js";
import { App } from "./App.jsx";
import "../craft-dashboard.jsx";

// initialize() 의 첫 render()→publishState() 이전에 브리지 리스너를 붙여야 초기 상태를 놓치지 않는다.
connectLegacyBridge();

// 사이드바 React 셸을 .app-shell 그리드 첫 자리에 마운트한다.
const sidebarMount = document.querySelector("#appShellSidebar");
if (sidebarMount) {
  createRoot(sidebarMount).render(<App />);
}

initializeStocklioApp();
