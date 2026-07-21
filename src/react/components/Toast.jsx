import React from "react";
import { useStore } from "../store/useStore.js";

// index.html 의 #operationToast 를 이식. store.toast 로 구동. 자동 숨김 타이머는
// legacy showOperationToast 가 store.setToast({visible:false}) 를 스케줄해 처리한다.
export function Toast() {
  const toast = useStore((s) => s.toast);
  return (
    <div
      id="operationToast"
      className="operation-toast"
      role="status"
      aria-live="polite"
      hidden={!toast.visible}
      data-tone={toast.tone}
    >
      <strong id="operationToastTitle">{toast.title}</strong>
      <span id="operationToastDetail">{toast.detail}</span>
    </div>
  );
}
