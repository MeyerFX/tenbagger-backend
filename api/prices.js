// GET /api/prices?ticker=AAPL — daily close+volume history, financials, insiders, alerts
// NOTE: Supabase caps responses at 1000 rows, so we fetch the NEWEST 1000
// days (≈4 years) in descending order and flip them back to ascending.
// (The old version asked ascending and silently got the OLDEST 1000 days,
//  which froze charts and prices about one year in the past.)
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
export default async function handler(req, res) {
  const ticker = (req.query.ticker || "").toUpperCase();
  if (!ticker) return res.status(400).json({ error: "ticker required" });
  try {
    const H = { apikey: ANON, Authorization: `Bearer ${ANON}` };
    const [pr, fin, ins, al] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/prices?ticker=eq.${ticker}&select=d,close,volume,high,low&order=d.desc&limit=1000`,
        { headers: H }).then((r) => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/financials_annual?ticker=eq.${ticker}&select=fiscal_year,revenue,earnings,fcf&order=fiscal_year.asc`,
        { headers: H }).then((r) => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/insider_tx?ticker=eq.${ticker}&select=*&order=filed_at.desc&limit=20`,
        { headers: H }).then((r) => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/alerts?ticker=eq.${ticker}&select=*&order=created_at.desc&limit=20`,
        { headers: H }).then((r) => r.json()),
    ]);
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");
    res.status(200).json({
      ticker,
      prices: (Array.isArray(pr) ? pr : []).reverse()
        .map((p) => ({
          d: p.d, close: Number(p.close), v: Number(p.volume || 0),
          // high/low feed real ATR/ADX and the support/resistance zones;
          // null until the collector backfills them — the app has fallbacks
          high: p.high == null ? null : Number(p.high),
          low: p.low == null ? null : Number(p.low),
        })),
      financials: fin,
      insiders: ins,
      alerts: al,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
