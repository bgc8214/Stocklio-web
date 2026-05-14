export default async function handler(_request, response) {
  response.setHeader("Cache-Control", "no-store");
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const hasAutomationSecret = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.CRON_SECRET);
  const checks = {
    supabaseEnv: Boolean(process.env.VITE_SUPABASE_URL && supabaseKey),
    supabaseTable: false,
    automationEnv: hasAutomationSecret,
    automationRuns: false,
  };
  let supabaseStatus = "not_configured";
  let automationStatus = hasAutomationSecret ? "not_checked" : "missing_server_secret";
  let lastAutomationRun = null;

  if (checks.supabaseEnv) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const url = new URL("/rest/v1/portfolio_states", process.env.VITE_SUPABASE_URL);
      url.searchParams.set("select", "user_id");
      url.searchParams.set("limit", "1");
      const supabaseResponse = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          authorization: `Bearer ${supabaseKey}`,
        },
        signal: controller.signal,
      });
      checks.supabaseTable = supabaseResponse.ok;
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const runUrl = new URL("/rest/v1/automation_runs", process.env.VITE_SUPABASE_URL);
        runUrl.searchParams.set("select", "started_at,finished_at,status,message");
        runUrl.searchParams.set("order", "started_at.desc");
        runUrl.searchParams.set("limit", "1");
        const runsResponse = await fetch(runUrl, {
          headers: {
            apikey: supabaseKey,
            authorization: `Bearer ${supabaseKey}`,
          },
          signal: controller.signal,
        });
        checks.automationRuns = runsResponse.ok;
        automationStatus = runsResponse.ok ? "ready" : `error_${runsResponse.status}`;
        if (runsResponse.ok) {
          const runs = await runsResponse.json();
          lastAutomationRun = Array.isArray(runs) ? runs[0] || null : null;
        }
      }
      supabaseStatus = supabaseResponse.ok ? "ready" : `error_${supabaseResponse.status}`;
    } catch (error) {
      supabaseStatus = error.name === "AbortError" ? "timeout" : "error";
      automationStatus = error.name === "AbortError" ? "timeout" : "error";
    } finally {
      clearTimeout(timeout);
    }
  }

  const ok = checks.supabaseEnv && checks.supabaseTable;
  response.status(ok ? 200 : 503).json({
    ok,
    mode: "vercel-static",
    storage: "supabase",
    checks,
    supabaseStatus,
    automationStatus,
    lastAutomationRun,
    api: ["yahoo/chart", "health", "cron/daily-snapshot"],
  });
}
