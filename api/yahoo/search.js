export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "method not allowed" });
    return;
  }

  const { searchParams } = new URL(request.url, `https://${request.headers.host || "localhost"}`);
  const query = String(searchParams.get("q") || "").trim();
  if (query.length < 2 || query.length > 50) {
    response.status(400).json({ error: "search query must be 2-50 characters" });
    return;
  }

  const yahooUrl = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  yahooUrl.searchParams.set("q", query);
  yahooUrl.searchParams.set("quotesCount", "12");
  yahooUrl.searchParams.set("newsCount", "0");
  yahooUrl.searchParams.set("enableFuzzyQuery", "true");
  yahooUrl.searchParams.set("quotesQueryId", "tss_match_phrase_query");

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
      response.status(502).json({ error: "search provider returned non-json response" });
      return;
    }
    const data = await yahooResponse.json();
    response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    response.status(yahooResponse.status).json(normalizeYahooSearch(data, query));
  } catch (error) {
    response.status(error.name === "AbortError" ? 504 : 502).json({ error: "search provider unavailable" });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeYahooSearch(data, query) {
  const preferKoreanExchange = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(query) || /^[0-9]{4,6}$/.test(query);
  const results = (data?.quotes || [])
    .filter((quote) => quote?.symbol && quote.quoteType !== "CURRENCY")
    .sort((a, b) => {
      const aKorean = /\.(KS|KQ)$/i.test(a.symbol || "") ? 1 : 0;
      const bKorean = /\.(KS|KQ)$/i.test(b.symbol || "") ? 1 : 0;
      return preferKoreanExchange ? bKorean - aKorean : 0;
    })
    .slice(0, 10)
    .map((quote) => ({
      symbol: String(quote.symbol || "").toUpperCase(),
      name: quote.shortname || quote.longname || quote.name || quote.symbol,
      exchange: quote.exchDisp || quote.exchange || "",
      type: quote.typeDisp || quote.quoteType || "",
    }));
  return { results };
}
