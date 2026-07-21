import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore.js";

// index.html 의 #emailLoginDialog 를 이식. 제출 시 store.actions.signInWithEmail 을 호출한다.
export function EmailLoginDialog() {
  const open = useStore((s) => s.emailDialogOpen);
  const prefill = useStore((s) => s.emailPrefill);
  const actions = useStore((s) => s.actions);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setEmail(prefill || "");
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.hidden = false;
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, prefill]);

  const close = () => actions.closeEmailDialog?.();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await actions.signInWithEmail?.(email);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      id="emailLoginDialog"
      className="email-login-dialog"
      aria-labelledby="emailLoginTitle"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <form id="emailLoginForm" onSubmit={handleSubmit}>
        <div>
          <strong id="emailLoginTitle">이메일로 로그인</strong>
          <span>메일로 받은 링크를 열면 투자일지에 로그인됩니다.</span>
        </div>
        <label>
          이메일
          <input
            ref={inputRef}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <div className="dialog-actions">
          <button className="ghost small-button" type="button" onClick={close}>
            취소
          </button>
          <button className="small-button" type="submit" disabled={submitting}>
            로그인 링크 받기
          </button>
        </div>
      </form>
    </dialog>
  );
}
