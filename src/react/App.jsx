import React from "react";
import { Sidebar } from "./components/Sidebar.jsx";

// Phase 1b-1: React 셸은 현재 사이드바만 소유한다.
// 툴바/auth/다이얼로그/6탭 섹션은 아직 legacy(index.html + stocklio-app.js)가 소유한다.
// .app-shell 그리드의 첫 컬럼(사이드바) 자리에 이 컴포넌트가 렌더된다.
export function App() {
  return <Sidebar />;
}
