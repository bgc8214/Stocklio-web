import React from "react";
import { useStore } from "../store/useStore.js";

// index.html 의 #sampleDataBanner 를 이식.
// 표시 규칙(legacy renderAuth + setView 조합에서 도출):
//  - 로그인 상태면 항상 숨김
//  - Supabase 설정됨 & 비로그인 → 모든 탭에서 표시
//  - Supabase 미설정 & 비로그인 → 대시보드에서만 표시
export function SampleDataBanner() {
  const auth = useStore((s) => s.auth);
  const activeView = useStore((s) => s.activeView);
  const actions = useStore((s) => s.actions);
  const visible = !auth.signedIn && (auth.configured || activeView === "dashboard");

  return (
    <div id="sampleDataBanner" className="sample-data-banner" hidden={!visible}>
      <span>
        지금 보이는 데이터는 <strong>예시 데이터</strong>입니다. 로그인하면 내 포트폴리오가 저장됩니다.
      </span>
      <button className="small-button" type="button" onClick={() => actions.openLoginDialog?.()}>
        로그인
      </button>
    </div>
  );
}
