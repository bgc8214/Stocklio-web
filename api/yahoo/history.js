// GET /api/yahoo/history?symbol=QQQ&start=2010-01-01&end=2026-05-24&interval=1mo
export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "method not allowed" });
    return;
  }

  const { searchParams } = new URL(request.url, `https://${request.headers.host || "localhost"}`);
  const symbol = String(searchParams.get("symbol") || "").trim().toUpperCase();

  if (!/^[A-Z0-9.^=\-]{1,20}$/.test(symbol)) {
    response.status(400).json({ error: "valid symbol is required" });
    return;
  }

  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";
  const interval = searchParams.get("interval") || "1mo";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    response.status(400).json({ error: "start and end must be YYYY-MM-DD" });
    return;
  }

  if (!["1d", "1wk", "1mo"].includes(interval)) {
    response.status(400).json({ error: "interval must be 1d, 1wk, or 1mo" });
    return;
  }

  const period1 = Math.floor(new Date(start).getTime() / 1000);
  const period2 = Math.floor(new Date(end).getTime() / 1000) + 86400;

  const yahooUrl = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
  );
  yahooUrl.searchParams.set("period1", String(period1));
  yahooUrl.searchParams.set("period2", String(period2));
  yahooUrl.searchParams.set("interval", interval);
  yahooUrl.searchParams.set("events", "div,splits");
  yahooUrl.searchParams.set("includeAdjustedClose", "true");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

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

    if (!yahooResponse.ok) {
      const msg = data?.chart?.error?.description || "price provider error";
      response.status(yahooResponse.status === 404 ? 404 : 502).json({ error: msg });
      return;
    }

    const result = data?.chart?.result?.[0];
    if (!result) {
      response.status(404).json({ error: `no data found for symbol: ${symbol}` });
      return;
    }

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const adjCloses = result.indicators?.adjclose?.[0]?.adjclose || [];
    const currency = result.meta?.currency || "USD";

    const rows = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      const adjClose = adjCloses[i] ?? null;
      if (close == null || close <= 0) continue;
      const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
      rows.push({ date, close, adjClose: adjClose != null && adjClose > 0 ? adjClose : null });
    }

    if (rows.length === 0) {
      response.status(404).json({ error: `no price data for ${symbol} in the requested range` });
      return;
    }

    // 과거 데이터는 길게 캐시한다 (오늘 날짜 이전 데이터는 변하지 않음)
    response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    response.status(200).json({
      symbol,
      currency,
      source: "Yahoo Finance",
      rows,
    });
  } catch (error) {
    response
      .status(error.name === "AbortError" ? 504 : 502)
      .json({ error: "price provider unavailable" });
  } finally {
    clearTimeout(timeout);
  }
}
