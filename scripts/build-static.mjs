import { cp, mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

await execFileAsync("npx", ["vite", "build"], {
  cwd: new URL("..", import.meta.url),
  stdio: "inherit",
});

const root = new URL("..", import.meta.url);
const dist = new URL("dist/", root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ["index.html", "app.js", "styles.css"]) {
  await cp(new URL(file, root), new URL(file, dist));
}
await cp(new URL("assets/", root), new URL("assets/", dist), { recursive: true });
