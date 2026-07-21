import { cp, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // .env is optional; local demo mode works without it.
}

const execFileAsync = promisify(execFile);
const root = new URL("..", import.meta.url);
const dist = new URL("dist/", root);

if (process.env.VERCEL_ENV === "production") {
  const missing = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_PUBLIC_SITE_URL"].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  }
}

// Vite 가 dist/ 를 통째로 생성한다(해시 번들 + index.html 재작성 + public/ 복사).
// %VITE_*% 문자열 치환은 더 이상 필요 없다 — supabase-auth.js 가 import.meta.env 를 직접 읽는다.
await execFileAsync("npx", ["vite", "build"], {
  cwd: root,
  stdio: "inherit",
});

// landing.html 은 Vite 진입점이 아니므로 별도로 복사한다.
const landing = new URL("landing.html", root);
const landingExists = await stat(landing).then(() => true).catch(() => false);
if (landingExists) {
  await cp(landing, new URL("landing.html", dist));
}
