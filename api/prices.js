// GET /api/prices?ticker=AAPL  → real daily close+volume history (5y)
// Deploy alongside universe.js on Vercel.

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const ticker = (req.query.ticker || "").toUpperCase();
  if (!ticker) return res.status(400).json({ error: "ticker required" });
  try {
    const [pr, fin, ins, al] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/prices?ticker=eq.${ticker}&select=d,close,volume&order=d.asc`,
        { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } }).then((r) => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/financials_annual?ticker=eq.${ticker}&select=fiscal_year,revenue,earnings,fcf&order=fiscal_year.asc`,
        { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } }).then((r) => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/insider_tx?ticker=eq.${ticker}&select=*&order=filed_at.desc&limit=20`,
        { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } }).then((r) => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/alerts?ticker=eq.${ticker}&select=*&order=created_at.desc&limit=20`,
        { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } }).then((r) => r.json()),
    ]);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).json({
      ticker,
      prices: pr.map((p) => ({ d: p.d, close: Number(p.close), v: Number(p.volume || 0) })),
      financials: fin,
      insiders: ins,
      alerts: al,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
