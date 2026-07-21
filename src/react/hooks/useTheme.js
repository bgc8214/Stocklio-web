import { useEffect, useState } from "react";

// 테마 상태를 document.documentElement.dataset.theme 와 localStorage 에 동기화한다.
// 초기 테마는 index.html <head> 의 인라인 스크립트가 이미 적용했으므로 여기서는 읽어온다.
export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light",
  );
  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("stocklio-theme", next);
      return next;
    });
  };
  // 외부(예: OS 설정)에서 dataset.theme 가 바뀌는 경우는 없지만, 마운트 시 한 번 동기화.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return { theme, toggle };
}
