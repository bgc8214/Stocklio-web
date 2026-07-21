import React, { useEffect, useRef } from "react";
import { useStore } from "../store/useStore.js";

// index.html 의 #loginDialog 를 이식. store.loginDialogOpen 으로 showModal/close 를 제어한다.
export function LoginDialog() {
  const open = useStore((s) => s.loginDialogOpen);
  const actions = useStore((s) => s.actions);
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.hidden = false;
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const close = () => actions.closeLoginDialog?.();

  return (
    <dialog
      id="loginDialog"
      className="login-dialog"
      aria-labelledby="loginDialogTitle"
      ref={ref}
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
      onCancel={(event) => {
        // ESC 로 닫힐 때 store 상태 동기화
        event.preventDefault();
        close();
      }}
    >
      <div className="login-card">
        <div className="login-dialog-heading">
          <div>
            <strong id="loginDialogTitle">투자일지 로그인</strong>
            <span>포트폴리오를 클라우드에 저장하고 자동 알림을 받을 수 있습니다.</span>
          </div>
          <button className="ghost small-button" type="button" aria-label="로그인 창 닫기" onClick={close}>
            닫기
          </button>
        </div>
        <div className="login-options" aria-label="로그인 방식">
          <button
            className="login-provider-button login-provider-naver"
            type="button"
            onClick={() => actions.signInWithNaver?.()}
          >
            <span aria-hidden="true">N</span>
            <strong>네이버로 로그인</strong>
          </button>
          <button
            className="login-provider-button login-provider-google"
            type="button"
            onClick={() => actions.signInWithGoogle?.()}
          >
            <span aria-hidden="true">G</span>
            <strong>Google로 로그인</strong>
          </button>
          <button
            className="login-provider-button login-provider-email"
            type="button"
            onClick={() => actions.openEmailDialog?.()}
          >
            <span aria-hidden="true">@</span>
            <strong>이메일로 로그인</strong>
          </button>
        </div>
        <p className="login-dialog-note">
          네이버 앱 안에서는 Google 로그인이 제한될 수 있어 네이버 로그인이나 이메일 로그인을 권장합니다.
        </p>
      </div>
    </dialog>
  );
}
