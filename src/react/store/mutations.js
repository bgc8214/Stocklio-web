// 포팅된 React 탭이 portfolio state 를 변경할 때 쓰는 헬퍼.
// legacy 가 등록한 store.actions.mutate 를 통해 save+render+publish 로 브리지에 반영한다.
// (legacy 가 Phase 8 까지 단일 writer 이므로 직접 store.portfolio 를 쓰지 않는다.)
import { useStore } from "./useStore.js";

export function mutate(fn) {
  useStore.getState().actions.mutate?.(fn);
}

export function makeId() {
  return useStore.getState().actions.makeId?.() ?? crypto.randomUUID();
}

export function todayKey() {
  return useStore.getState().actions.todayKey?.() ?? new Date().toISOString().slice(0, 10);
}

export function setStatus(title, detail) {
  useStore.getState().actions.setStatus?.(title, detail);
}

export function showToast(title, detail, tone = "info") {
  useStore.getState().actions.showOperationToast?.(title, detail, tone);
}
