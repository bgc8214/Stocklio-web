export default async function handler(request, response) {
  const { searchParams } = new URL(request.url, `https://${request.headers.host || "localhost"}`);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    response.status(400).json({ error: "symbol is required" });
    return;
  }

  const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  yahooUrl.searchParams.set("interval", "1d");
  yahooUrl.searchParams.set("range", "1d");

  const yahooResponse = await fetch(yahooUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "stocklio-web/1.0",
    },
  });
  const data = await yahooResponse.json();
  response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  response.status(yahooResponse.status).json(data);
}
