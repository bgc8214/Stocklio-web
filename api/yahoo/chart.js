export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "method not allowed" });
    return;
  }

  const { searchParams } = new URL(request.url, `https://${request.headers.host || "localhost"}`);
  const symbol = String(searchParams.get("symbol") || "").trim().toUpperCase();
  if (!/^[A-Z0-9.^=-]{1,20}$/.test(symbol)) {
    response.status(400).json({ error: "valid symbol is required" });
    return;
  }

  const rangeParam = searchParams.get("range") || "1d";
  const intervalParam = searchParams.get("interval") || "1d";
  const ALLOWED_RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y"];
  const ALLOWED_INTERVALS = ["1m", "5m", "15m", "1h", "1d", "1wk"];
  const range = ALLOWED_RANGES.includes(rangeParam) ? rangeParam : "1d";
  const interval = ALLOWED_INTERVALS.includes(intervalParam) ? intervalParam : "1d";

  const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  yahooUrl.searchParams.set("interval", interval);
  yahooUrl.searchParams.set("range", range);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const yahooResponse = await fetch(yahooUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "stocklio-web/1.0",
      },
      signal: controller.signal,
    });
    const contentType = yahooResponse.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      response.status(502).json({ error: "price provider returned non-json response" });
      return;
    }
    const data = await yahooResponse.json();
    const cacheSeconds = range === "1d" ? 300 : 3600;
    response.setHeader("Cache-Control", `s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`);
    response.status(yahooResponse.status).json(data);
  } catch (error) {
    response.status(error.name === "AbortError" ? 504 : 502).json({ error: "price provider unavailable" });
  } finally {
    clearTimeout(timeout);
  }
}
