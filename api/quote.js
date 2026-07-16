// ============================================================
// tenbagger API — /api/quote?ticker=XXXX
// On-demand price refresh: fetches the latest daily candles for
// ONE ticker straight from Yahoo (server-side, so no CORS) and
// returns them in the shape the app merges into its series.
//
// Optionally persists the fresh closes into Supabase `prices`
// when SUPABASE_SERVICE_KEY is set (anon key is read-only via
// RLS, so writes need the service role key — keep it server-only).
//
// Drop this file at /api/quote.js in the same Vercel project as
// universe.js. Env used:
//   SUPABASE_URL          (already set for universe.js)
//   SUPABASE_SERVICE_KEY  (optional — enables persistence)
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // optional

const UA = "Mozilla/5.0 (tenbagger quote refresh)";

export default async function handler(req, res) {
  const raw = String(req.query.ticker || "").trim().toUpperCase();
  // allow letters, digits, dots and dashes only (PETR4.SA, STG.TA, BRK-B…)
  if (!raw || !/^[A-Z0-9.\-]{1,12}$/.test(raw)) {
    res.status(400).json({ error: "bad ticker" });
    return;
  }

  // range=5d (default) refreshes the last close; range=max bootstraps the FULL
  // history for tickers the daily collector hasn't reached yet (new searches).
  const RANGES = new Set(["5d", "1mo", "1y", "5y", "max"]);
  const range = RANGES.has(String(req.query.range || "")) ? String(req.query.range) : "5d";

  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(raw)}` +
      `?range=${range}&interval=1d&includePrePost=false`;
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!r.ok) throw new Error(`yahoo ${r.status}`);
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    if (!result) throw new Error(j?.chart?.error?.description || "no chart data");

    const meta = result.meta || {};
    // TASE quotes come in agorot (ILA = 0.01 ILS) — same normalization the collector applies
    const scale = meta.currency === "ILA" ? 0.01 : 1;
    const currency = meta.currency === "ILA" ? "ILS" : meta.currency || null;

    const ts = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};
    const closes = q.close || [];
    const vols = q.volume || [];
    const highs = q.high || [];
    const lows = q.low || [];

    const candles = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c == null || !isFinite(c)) continue; // Yahoo pads live sessions with nulls
      candles.push({
        ts: ts[i] * 1000,
        d: new Date(ts[i] * 1000).toISOString().slice(0, 10),
        close: +(c * scale).toFixed(4),
        volume: vols[i] == null ? null : Math.round(vols[i]),
        high: highs[i] == null || !isFinite(highs[i]) ? null : +(highs[i] * scale).toFixed(4),
        low: lows[i] == null || !isFinite(lows[i]) ? null : +(lows[i] * scale).toFixed(4),
      });
    }
    if (candles.length === 0) throw new Error("empty candles");

    // fire-and-forget persistence, so the next full page load (and other
    // users) also see the fresh close — only when the service key exists
    if (SUPABASE_URL && SERVICE_KEY) {
      const rows = candles.map((c) => ({ ticker: raw, d: c.d, close: c.close, volume: c.volume, high: c.high, low: c.low }));
      const hdrs = {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      };
      for (let i = 0; i < rows.length; i += 500) {
        fetch(`${SUPABASE_URL}/rest/v1/prices?on_conflict=ticker,d`, {
          method: "POST", headers: hdrs, body: JSON.stringify(rows.slice(i, i + 500)),
        }).catch(() => {});
      }
    }

    res.setHeader("Cache-Control", range === "5d" ? "s-maxage=60, stale-while-revalidate=30" : "s-maxage=3600"); // 1-min cache on refresh; 1h on backfills
    res.status(200).json({
      ticker: raw,
      currency,
      price: candles[candles.length - 1].close,
      marketState: meta.marketState || null,
      updatedAt: new Date().toISOString(),
      candles,
    });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
