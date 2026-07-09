// POST /api/redeem   { "code": "FAMILIA-2026" }   (requires login)
// Validates the voucher (uses left + not expired), grants premium to the
// logged-in account and decrements the voucher.
// Env vars used: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

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

  const code = String((req.body || {}).code || "").trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9\-]{2,39}$/.test(code))
    return res.status(400).json({ error: "invalid code format" });

  const user = await getUser(req);
  if (!user || !user.id) return res.status(401).json({ error: "sign in to redeem a code" });

  const svc = {
    apikey: process.env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  };

  // already premium? nothing to burn
  const already = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/premium_users?user_id=eq.${user.id}&select=user_id`,
    { headers: svc }
  ).then((r) => r.json());
  if (Array.isArray(already) && already.length > 0)
    return res.status(200).json({ premium: true, note: "account is already premium" });

  // valid voucher?
  const nowIso = new Date().toISOString();
  const vs = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&uses_left=gt.0&or=(expires_at.is.null,expires_at.gt.${nowIso})&select=code,uses_left`,
    { headers: svc }
  ).then((r) => r.json());
  if (!Array.isArray(vs) || vs.length === 0)
    return res.status(404).json({ error: "invalid, expired or fully used code" });
  const v = vs[0];

  // grant premium
  const ins = await fetch(`${process.env.SUPABASE_URL}/rest/v1/premium_users`, {
    method: "POST",
    headers: { ...svc, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ user_id: user.id, code }),
  });
  if (!ins.ok) return res.status(500).json({ error: `grant failed (${ins.status})` });

  // burn one use
  await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}`,
    { method: "PATCH", headers: svc, body: JSON.stringify({ uses_left: v.uses_left - 1 }) }
  );

  res.status(200).json({ premium: true });
}
