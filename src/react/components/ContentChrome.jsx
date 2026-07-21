import React from "react";
import { Toolbar } from "./Toolbar.jsx";
import { SampleDataBanner } from "./SampleDataBanner.jsx";
import { Toast } from "./Toast.jsx";
import { LoginDialog } from "./LoginDialog.jsx";
import { EmailLoginDialog } from "./EmailLoginDialog.jsx";

// .content 상단의 chrome(툴바/배너/토스트/다이얼로그)을 React 로 소유한다.
// display:contents 마운트 래퍼 안에서 렌더되므로 .toolbar 의 sticky 컨텍스트가
// .content 기준으로 유지된다. 이 뒤에 오는 legacy 뷰 섹션들은 index.html 에 남아 있다.
export function ContentChrome() {
  return (
    <>
      <Toolbar />
      <SampleDataBanner />
      <Toast />
      <LoginDialog />
      <EmailLoginDialog />
    </>
  );
}
