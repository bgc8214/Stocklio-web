import { useEffect, useState } from "react";

// 뷰포트 폭 기준 모바일 여부 — 회전/리사이즈를 구독한다.
// (모듈 스코프에서 window.innerWidth 를 한 번만 읽으면 리사이즈가 반영되지 않는다)
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}
