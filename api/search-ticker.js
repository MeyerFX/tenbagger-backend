// POST /api/search-ticker   { "ticker": "TSLA" }   (requires login)
// - If the ticker is already in the shared cache → { exists: true } (free, no limit used)
// - Otherwise: checks the user's daily quota (5 NEW tickers/day), logs the
//   search, and fires an immediate single-ticker collection (~1–2 min).
//
// Vercel env vars used: SUPABASE_URL, SUPABASE_ANON_KEY,
//                       SUPABASE_SERVICE_KEY, GH_PAT

const GH_REPO = "MeyerFX/tenbagger-backend";
const WORKFLOW = "daily-collect.yml";
const DAILY_LIMIT = 5;

async function getUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const ticker = String((req.body || {}).ticker || "").trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.\-]{0,11}$/.test(ticker))
    return res.status(400).json({ error: "invalid ticker format" });

  const svc = {
    apikey: process.env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  };

  // already cached? then it's just a read — no login or quota needed
  const ex = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/instruments?ticker=eq.${ticker}&select=ticker`,
    { headers: svc }
  ).then((r) => r.json());
  if (Array.isArray(ex) && ex.length > 0) return res.status(200).json({ exists: true, ticker });

  // new ticker → requires an account
  const user = await getUser(req);
  if (!user || !user.id) return res.status(401).json({ error: "login required to search new tickers" });

  // admins bypass the daily quota entirely
  const adm = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/app_admins?user_id=eq.${user.id}&select=user_id`,
    { headers: svc }
  ).then((r) => r.json()).catch(() => []);
  const isAdmin = Array.isArray(adm) && adm.length > 0;

  // premium (voucher) accounts also bypass the quota
  const prem = isAdmin ? [] : await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/premium_users?user_id=eq.${user.id}&select=user_id`,
    { headers: svc }
  ).then((r) => r.json()).catch(() => []);
  const noLimit = isAdmin || (Array.isArray(prem) && prem.length > 0);

  let remaining = null;
  if (!noLimit) {
    // daily quota (resets at 00:00 UTC)
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const todays = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/search_log?user_id=eq.${user.id}&searched_at=gte.${since.toISOString()}&select=id`,
      { headers: svc }
    ).then((r) => r.json());
    if (Array.isArray(todays) && todays.length >= DAILY_LIMIT)
      return res.status(429).json({ error: `Daily limit reached: ${DAILY_LIMIT} new tickers/day on the free plan. Resets at 00:00 UTC.` });
    // log the search
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/search_log`, {
      method: "POST", headers: svc,
      body: JSON.stringify({ user_id: user.id, ticker }),
    });
    remaining = DAILY_LIMIT - todays.length - 1;
  }

  // fire the on-demand collection
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
    return res.status(500).json({ error: `collection trigger failed (${gh.status}): ${t.slice(0, 140)}` });
  }

  res.status(200).json({ queued: true, ticker, remaining });
}
