export default async function handler(_request, response) {
  response.setHeader("Cache-Control", "no-store");
  const checks = {
    supabaseEnv: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
    supabaseTable: false,
  };
  let supabaseStatus = "not_configured";

  if (checks.supabaseEnv) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const url = new URL("/rest/v1/portfolio_states", process.env.VITE_SUPABASE_URL);
      url.searchParams.set("select", "user_id");
      url.searchParams.set("limit", "1");
      const supabaseResponse = await fetch(url, {
        headers: {
          apikey: process.env.VITE_SUPABASE_ANON_KEY,
          authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      });
      checks.supabaseTable = supabaseResponse.ok;
      supabaseStatus = supabaseResponse.ok ? "ready" : `error_${supabaseResponse.status}`;
    } catch (error) {
      supabaseStatus = error.name === "AbortError" ? "timeout" : "error";
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
    api: ["yahoo/chart", "health"],
  });
}
