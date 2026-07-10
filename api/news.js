// GET /api/news?ticker=AAPL&name=Apple — latest headlines via Google News RSS
// Free, no API key. Proxied server-side because browsers block RSS cross-origin.

export default async function handler(req, res) {
  const ticker = String(req.query.ticker || "").toUpperCase().slice(0, 12);
  const name = String(req.query.name || "").slice(0, 60);
  if (!/^[A-Z0-9][A-Z0-9.\-]{0,11}$/.test(ticker))
    return res.status(400).json({ error: "invalid ticker" });
  try {
    const q = encodeURIComponent(`${name || ticker} stock`);
    const rss = await fetch(
      `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`,
      { headers: { "User-Agent": "Mozilla/5.0 (tenbagger-news)" } }
    ).then((r) => r.text());

    const items = [];
    const rx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = rx.exec(rss)) && items.length < 12) {
      const block = m[1];
      const pick = (tag) => {
        const c = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
        if (c) return c[1].trim();
        const p = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return p ? p[1].trim() : "";
      };
      const title = pick("title").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      const link = pick("link");
      const source = pick("source");
      const date = pick("pubDate");
      if (title && link) items.push({ title, link, source, date });
    }
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=600");
    res.status(200).json({ ticker, items });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
