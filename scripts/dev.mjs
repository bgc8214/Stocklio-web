// 개발용: API 서버(server.mjs, 포트 4173)와 Vite dev server(HMR, 포트 5173)를 함께 띄운다.
// 브라우저는 http://localhost:5173 으로 접속하고, /api 요청은 Vite proxy 가 4173 으로 전달한다.
import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url);

const api = spawn(process.execPath, ["server.mjs"], {
  cwd: root,
  env: { ...process.env, PORT: "4173" },
  stdio: "inherit",
});

const vite = spawn("npx", ["vite"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

function shutdown() {
  api.kill("SIGTERM");
  vite.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
api.on("exit", () => vite.kill("SIGTERM"));
vite.on("exit", () => api.kill("SIGTERM"));
