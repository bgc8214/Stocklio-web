import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

const LAYER_ORDER = [
  "base",
  "layout",
  "dashboard",
  "holdings",
  "accounts",
  "cashflows",
  "performance",
  "automation",
  "simulator",
  "theme",
  "responsive",
];

const SOURCE_FILES = [
  "styles/base.css",
  "styles/layout-nav.css",
  "styles/layout-login.css",
  "styles/layout-common.css",
  "styles/layout-drawer.css",
  "styles/dashboard.css",
  "styles/holdings.css",
  "styles/accounts.css",
  "styles/cashflows.css",
  "styles/performance.css",
  "styles/automation.css",
  "styles/simulator.css",
  "styles/theme.css",
];

export async function buildCss() {
  const header = `/* 이 파일은 자동 생성된다. styles/*.css를 고치고 \`npm run build:css\`를 실행할 것.
   생성기: scripts/build-css.mjs */
@layer ${LAYER_ORDER.join(", ")};

`;
  const parts = await Promise.all(
    SOURCE_FILES.map((file) => readFile(new URL(file, root), "utf8")),
  );
  const output = header + parts.join("\n");
  await writeFile(new URL("styles.css", root), output);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildCss();
  console.log("Built styles.css from styles/*.css");
}
