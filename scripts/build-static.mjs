import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

await execFileAsync("npx", ["vite", "build"], {
  cwd: new URL("..", import.meta.url),
  stdio: "inherit",
});

const root = new URL("..", import.meta.url);
const dist = new URL("dist/", root);
if (process.env.VERCEL_ENV === "production") {
  const missing = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_PUBLIC_SITE_URL"].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  }
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ["index.html", "app.js", "styles.css", "landing.html"]) {
  await cp(new URL(file, root), new URL(file, dist));
}
await mkdir(new URL("src/", dist), { recursive: true });
await cp(new URL("src/app/", root), new URL("src/app/", dist), { recursive: true });
await cp(new URL("src/domain/", root), new URL("src/domain/", dist), { recursive: true });
await cp(new URL("assets/", root), new URL("assets/", dist), { recursive: true });
const publicDir = new URL("public/", root);
const publicExists = await stat(publicDir).then(() => true).catch(() => false);
if (publicExists) {
  await cp(publicDir, dist, { recursive: true });
}

const indexPath = new URL("index.html", dist);
const html = await readFile(indexPath, "utf8");
await writeFile(
  indexPath,
  html
    .replaceAll("%VITE_SUPABASE_URL%", process.env.VITE_SUPABASE_URL || "")
    .replaceAll("%VITE_SUPABASE_ANON_KEY%", process.env.VITE_SUPABASE_ANON_KEY || "")
    .replaceAll("%VITE_PUBLIC_SITE_URL%", process.env.VITE_PUBLIC_SITE_URL || ""),
);
