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
import { ContentChrome } from "./components/ContentChrome.jsx";
import { AccountsView } from "./views/AccountsView.jsx";
import { CashflowsView } from "./views/CashflowsView.jsx";
import "../craft-dashboard.jsx";

// initialize() 의 첫 render()→publishState() 이전에 브리지 리스너를 붙여야 초기 상태를 놓치지 않는다.
connectLegacyBridge();

// 사이드바 React 셸을 .app-shell 그리드 첫 자리에 마운트한다.
const sidebarMount = document.querySelector("#appShellSidebar");
if (sidebarMount) {
  createRoot(sidebarMount).render(<App />);
}

// .content 상단 chrome(툴바/배너/토스트/다이얼로그)을 마운트한다.
const chromeMount = document.querySelector("#contentChromeMount");
if (chromeMount) {
  createRoot(chromeMount).render(<ContentChrome />);
}

// 포팅된 탭 뷰를 각 마운트 지점(data-view)에 렌더한다. 표시는 legacy setView 가 토글한다.
const accountsMount = document.querySelector("#accountsViewMount");
if (accountsMount) {
  createRoot(accountsMount).render(<AccountsView />);
}

const cashflowsMount = document.querySelector("#cashflowsViewMount");
if (cashflowsMount) {
  createRoot(cashflowsMount).render(<CashflowsView />);
}

initializeStocklioApp();
