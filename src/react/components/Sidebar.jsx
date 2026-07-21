import React, { useState } from "react";
import { useStore } from "../store/useStore.js";
import { useTheme } from "../hooks/useTheme.js";

// index.html 의 <aside class="sidebar"> 마크업을 1:1 로 이식한 컴포넌트.
// CSS(styles/layout-nav.css)가 class·data 속성에 강결합돼 있으므로 구조를 그대로 재현한다.
const TABS = [
  { id: "dashboard", icon: "📊", mobile: "홈", label: "대시보드" },
  { id: "holdings", icon: "📈", mobile: "종목", label: "보유 종목" },
  { id: "accounts", icon: "🏦", mobile: "계좌", label: "계좌" },
  { id: "performance", icon: "📉", mobile: "성과", label: "성과" },
  { id: "cashflows", icon: "💸", mobile: "입출금", label: "입출금" },
  { id: "automation", icon: "🔔", mobile: "설정", label: "설정" },
  { id: "simulator", icon: "🎬", mobile: "시뮬", label: "시뮬레이터" },
];
const MORE_TABS = ["cashflows", "automation", "simulator"];

export function Sidebar() {
  const activeView = useStore((s) => s.activeView);
  const currencyMode = useStore((s) => s.currencyMode);
  const actions = useStore((s) => s.actions);
  const { theme, toggle: toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setView = (id) => actions.setView?.(id);
  const moreActive = MORE_TABS.includes(activeView);
  const isDark = theme === "dark";

  return (
    <aside className="sidebar" aria-label="투자일지 메뉴">
      <div className="sidebar-inner">
        <div className="sidebar-brand">
          <img className="brand-mark" src="assets/tuja-ilji-icon-192.png" alt="" aria-hidden="true" />
          <div className="brand-lockup">
            <h1>투자일지</h1>
          </div>
        </div>
        <nav className="view-tabs" aria-label="메뉴">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeView === tab.id ? "active" : undefined}
              data-view-tab={tab.id}
              data-nav-icon={tab.icon}
              data-mobile-label={tab.mobile}
              onClick={() => setView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            className={`nav-more-btn${moreActive ? " active" : ""}`}
            id="navMoreBtn"
            data-mobile-label="더보기"
            aria-expanded={drawerOpen}
            aria-controls="navMoreDrawer"
            onClick={() => setDrawerOpen((v) => !v)}
          >
            •••
          </button>
        </nav>
        <div className={`nav-more-drawer${drawerOpen ? " open" : ""}`} id="navMoreDrawer" hidden={!drawerOpen}>
          <div className="nav-more-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="nav-more-sheet">
            <div className="nav-more-sheet-handle" />
            <div className="nav-more-sheet-items">
              {MORE_TABS.map((id) => {
                const tab = TABS.find((t) => t.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`nav-more-item${activeView === id ? " active" : ""}`}
                    data-view-tab={id}
                    onClick={() => {
                      setView(id);
                      setDrawerOpen(false);
                    }}
                  >
                    <span className="nav-more-icon">{tab.icon}</span>
                    <span className="nav-more-name">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="nav-more-sheet-footer">
              <button className="theme-toggle nav-more-theme-toggle" type="button" aria-label="테마 전환" onClick={toggleTheme}>
                <span className="theme-toggle-icon">{isDark ? "☀️" : "🌙"}</span>
                <span>{isDark ? "라이트 모드" : "다크 모드"}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="sidebar-foot">
          <div className="currency-toggle" id="currencyToggle" role="group" aria-label="통화 표시 선택">
            <button
              type="button"
              className={`currency-toggle-btn${currencyMode === "usd" ? " active" : ""}`}
              data-currency-mode="usd"
              onClick={() => actions.applyCurrencyMode?.("usd")}
            >
              $
            </button>
            <button
              type="button"
              className={`currency-toggle-btn${currencyMode === "krw" ? " active" : ""}`}
              data-currency-mode="krw"
              onClick={() => actions.applyCurrencyMode?.("krw")}
            >
              원
            </button>
          </div>
          <button className="theme-toggle" type="button" aria-label="테마 전환" onClick={toggleTheme}>
            <span className="theme-toggle-icon">{isDark ? "☀️" : "🌙"}</span>
            <span>{isDark ? "라이트 모드" : "다크 모드"}</span>
          </button>
          <span>엑셀 가져오기</span>
          <strong>자동 가격 · 일일 알림</strong>
        </div>
      </div>
    </aside>
  );
}
