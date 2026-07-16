// GET /api/lookup?q=apple — resolve a company NAME (or partial ticker) into
// ticker candidates via Yahoo's search API, server-side (no CORS).
// Returns up to 6 equities: [{ symbol, name, exch }]
export default async function handler(req, res) {
  const q = String(req.query.q || "").trim();
  if (q.length < 2 || q.length > 40) { res.status(200).json({ results: [] }); return; }
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (tenbagger lookup)", Accept: "application/json" } });
    if (!r.ok) throw new Error(`yahoo ${r.status}`);
    const j = await r.json();
    const results = (j.quotes || [])
      .filter((x) => x.quoteType === "EQUITY" && x.symbol)
      .slice(0, 6)
      .map((x) => ({
        symbol: String(x.symbol).toUpperCase(),
        name: x.shortname || x.longname || x.symbol,
        exch: x.exchDisp || x.exchange || "",
      }));
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600"); // names don't change — cache 24h
    res.status(200).json({ results });
  } catch (e) {
    res.status(200).json({ results: [], error: String(e.message || e) });
  }
}
