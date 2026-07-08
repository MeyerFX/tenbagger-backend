// POST /api/add-ticker   { "ticker": "TSLA" }
// 1) inserts the ticker into the Supabase watchlist (server-side key)
// 2) fires an immediate single-ticker collection on GitHub Actions
// Data lands in the database ~1–2 minutes later.
//
// Required Vercel env vars (Settings → Environment Variables):
//   SUPABASE_URL          your project URL
//   SUPABASE_SERVICE_KEY  the service_role secret key (NEVER in the frontend)
//   GH_PAT                GitHub fine-grained token with Actions read+write
//   APP_ADD_KEY           (optional) shared secret; if set, requests must
//                         send header  x-app-key: <value>

const GH_REPO = "MeyerFX/tenbagger-backend";
const WORKFLOW = "daily-collect.yml";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const APP_KEY = process.env.APP_ADD_KEY;
  if (APP_KEY && req.headers["x-app-key"] !== APP_KEY)
    return res.status(401).json({ error: "unauthorized" });

  const ticker = String((req.body || {}).ticker || "").trim().toUpperCase();
  // Yahoo-style tickers: letters/digits plus . and - (AAPL, PETR4.SA, STG.TA)
  if (!/^[A-Z0-9][A-Z0-9.\-]{0,11}$/.test(ticker))
    return res.status(400).json({ error: "invalid ticker format" });

  // 1) upsert into watchlist
  const sb = await fetch(`${process.env.SUPABASE_URL}/rest/v1/watchlist`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ ticker, active: true }),
  });
  if (!sb.ok)
    return res.status(500).json({ error: `watchlist insert failed (${sb.status})` });

  // 2) trigger the single-ticker collection
  const gh = await fetch(
    `https://api.github.com/repos/${GH_REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GH_PAT}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "tenbagger-app",
      },
      body: JSON.stringify({ ref: "main", inputs: { ticker } }),
    }
  );
  if (gh.status !== 204) {
    const t = await gh.text();
    return res
      .status(500)
      .json({ error: `workflow trigger failed (${gh.status}): ${t.slice(0, 160)}` });
  }

  res.status(200).json({
    ok: true,
    ticker,
    note: "Collection started — data lands in ~1–2 minutes.",
  });
}
