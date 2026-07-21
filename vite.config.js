import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      // /api 는 로컬 API 서버(server.mjs, 포트 4173)로 프록시한다.
      "/api": "http://localhost:4173",
    },
  },
});
