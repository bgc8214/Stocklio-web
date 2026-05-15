import { readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const roots = ["app.js", "server.mjs", "api", "src/app"];
const files = [];

for (const root of roots) {
  await collectJavaScriptFiles(root);
}

for (const file of files.sort()) {
  await execFileAsync("node", ["--check", file]);
}

async function collectJavaScriptFiles(path) {
  if (path.endsWith(".js") || path.endsWith(".mjs")) {
    files.push(path);
    return;
  }
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const nextPath = `${path}/${entry.name}`;
    if (entry.isDirectory()) {
      await collectJavaScriptFiles(nextPath);
    } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".mjs"))) {
      files.push(nextPath);
    }
  }
}
