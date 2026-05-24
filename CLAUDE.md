# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start local server at http://localhost:4173
npm run build        # Vite build (outputs to dist/ and assets/)
npm run check        # JS syntax check + domain tests + build

npm test             # Domain unit tests (Node native test module)
npm run test:product # Playwright E2E smoke tests (requires running server)
npm run test:migration # Python migration tests

npm run verify       # Full pipeline: check + migration tests + product smoke tests
```

To run a single domain test, use Node's `--test-name-pattern` flag:
```bash
node --test --test-name-pattern "getTotals" tests/domain.test.mjs
```

## Architecture

**Shared domain layer** is the key architectural pattern. `src/domain/portfolio-core.js` exports calculation functions (`getTotals`, `buildPortfolioSnapshot`, `buildAccountSnapshots`, `normalizeDashboardLayout`) that are imported by the browser SPA, the local Node server (`server.mjs`), and the Vercel serverless functions. Changes to this file affect all three environments.

**Dual storage model:**
- Local dev: SQLite via Node's native `DatabaseSync` at `data/portfolio.db` (gitignored)
- Production: Supabase PostgreSQL with JSONB `portfolio_states` table + RLS
- State has a `STATE_VERSION = 6` constant — increment when the state shape changes

**Frontend** is a single-file SPA (`index.html` + `src/app/stocklio-app.js`). There is no React router — the entire app lives in `stocklio-app.js` (~3300 lines). Two modules are compiled separately by Vite as ES library builds: `src/craft-dashboard.jsx` (Craft.js dashboard editor) and `src/supabase-auth.js` (auth integration), output to `assets/`.

**API layer** (`api/`) contains Vercel serverless functions:
- `yahoo/chart.js` — price/FX proxy with 5-min price / 1-hr FX caching (no API key needed)
- `yahoo/search.js` — ticker search autocomplete
- `cron/daily-snapshot.js` — runs at UTC 22:00 (07:00 KST) via Vercel Cron, iterates all users using `SUPABASE_SERVICE_ROLE_KEY`
- `health.js` — check automation env vars and status

**Local automation loop** in `server.mjs` runs every 15 minutes, checks trading conditions against `Asia/Seoul` time, and upserts daily snapshots via the same domain functions as the Vercel cron.

## Key Constraints

- Do not generate financial advice, buy/sell recommendations, or profit guarantees anywhere in the codebase.
- Original Numbers/XLSX files and row-level financial data go only in gitignored paths: `data/private/`, `imports/private/`, `exports/`.
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in browser code or any `.env` file that could be committed — Vercel server environment only.
- The codebase is ES modules throughout (`"type": "module"` in package.json). Use `.mjs` extensions or `import/export` syntax.

## Environment Variables

| Variable | Where used |
|---|---|
| `VITE_SUPABASE_URL` | Vite build + browser |
| `VITE_SUPABASE_ANON_KEY` | Vite build + browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel server only (cron, multi-user automation) |
| `CRON_SECRET` | Vercel cron endpoint auth header |

Without Supabase vars, the app runs in local demo mode (login button disabled).

## Workspace Docs

Detailed design decisions live in `_workspace/stock-portfolio/` (numbered 01–13) and `docs/harness/stock-portfolio/team-spec.md`. The domain model is in `02_domain_model.md`; the full automation design is in `06_full_automation_plan.md`.
