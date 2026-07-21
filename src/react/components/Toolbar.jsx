import React from "react";
import { useStore } from "../store/useStore.js";

// index.html 의 <section class="toolbar"> 를 이식.
// title/subtitle, sr-only 상태 라인, auth 패널(로그인/로그아웃 + sync 상태)을 store 로 구동한다.
export function Toolbar() {
  const pageTitle = useStore((s) => s.pageTitle);
  const pageSubtitle = useStore((s) => s.pageSubtitle);
  const status = useStore((s) => s.status);
  const auth = useStore((s) => s.auth);
  const sync = useStore((s) => s.sync);
  const actions = useStore((s) => s.actions);

  const authLabel = auth.user?.name || auth.user?.email || "";
  const showSync = auth.signedIn && sync.message;
  // 로그인 버튼: Supabase 미설정이면 숨김, 로그인 상태면 숨김.
  const showLogin = auth.configured && !auth.signedIn;
  const showLogout = auth.configured && auth.signedIn;

  return (
    <section className="toolbar" aria-label="포트폴리오 작업">
      <div className="page-heading">
        <strong id="pageTitle">{pageTitle}</strong>
        <span id="pageSubtitle">{pageSubtitle}</span>
      </div>
      <div className="toolbar-actions">
        <div className="status-panel sr-only" aria-live="polite">
          <span id="providerStatus">{status.title}</span>
          <span id="lastUpdated">{status.detail}</span>
        </div>
        <div className="auth-panel">
          <span id="authStatus">{auth.signedIn ? authLabel : ""}</span>
          <span
            id="syncStatus"
            className="sync-status"
            hidden={!showSync}
            data-sync-status={sync.status}
          >
            {sync.message}
          </span>
          <button
            id="openLoginButton"
            className="small-button"
            type="button"
            hidden={!showLogin}
            onClick={() => actions.openLoginDialog?.()}
          >
            로그인
          </button>
          <button
            id="logoutButton"
            className="ghost small-button"
            type="button"
            hidden={!showLogout}
            onClick={() => actions.signOut?.()}
          >
            로그아웃
          </button>
        </div>
      </div>
    </section>
  );
}
