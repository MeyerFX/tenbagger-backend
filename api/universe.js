// ============================================================
// tenbagger API — one serverless endpoint that returns the
// universe in the EXACT shape the React app expects.
//
// Deploy free on Vercel (vercel.com) or Cloudflare Workers.
// For Vercel: drop this in /api/universe.js of a Vercel project,
// set env SUPABASE_URL and SUPABASE_ANON_KEY, deploy.
//
// The app then fetches GET /api/universe instead of using the
// hard-coded STOCKS array. Series/intraday stay generated client-side
// from the price rows, OR you can extend this to send full history.
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;       // https://xxxx.supabase.co
const ANON = process.env.SUPABASE_ANON_KEY;          // public anon key (read-only via RLS)

async function sb(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!r.ok) throw new Error(`supabase ${path}: ${r.status}`);
  return r.json();
}

// strip NaN/Infinity that Postgres may serialize as the string "NaN"
function cleanNums(o) {
  for (const k in o) {
    const v = o[k];
    if (v === "NaN" || v === "Infinity" || v === "-Infinity") o[k] = null;
    else if (typeof v === "number" && !Number.isFinite(v)) o[k] = null;
  }
  return o;
}

// map a DB row → the object shape the front-end's STOCKS array uses
function toStock(r, fx) {
  return cleanNums({
    ticker: r.ticker,
    name: r.name,
    sector: r.sector,
    industry: r.industry || null,
    country: r.country,
    currency: r.currency,
    kind: r.kind || undefined,
    er: r.expense_ratio || undefined,
    mktCap: r.mkt_cap,
    pe: r.pe ?? 0,
    fwdPE: r.fwd_pe ?? 0,
    ps: r.ps ?? 0,
    pb: r.pb ?? 0,
    evEbitda: r.ev_ebitda ?? 0,
    epsGrowth: r.eps_growth ?? 0,
    revGrowth: r.rev_growth ?? 0,
    forecastG: r.forecast_g ?? 0,
    estEpsG: r.est_eps_g ?? null,  // analyst FY+1 EPS growth — normalized base, immune to impairment noise
    divYield: r.div_yield ?? 0,
    payout: r.payout ?? 0,
    debtEq: r.debt_eq ?? 0,
    roic: r.roic == null ? null : Number(r.roic),  // null = junk-guarded (secondary listings) → app shows n/a, not a fake 0%
    roe: r.roe ?? 0,
    roi: r.roi ?? 0,
    netMargin: r.net_margin ?? 0,
    grossMargin: r.gross_margin ?? 0.3,
    revenueM: r.revenue_m ?? 0,
    ebitdaB: r.ebitda_b ?? 0,
    sectorPE: r.sector_pe ?? 18,
    sectorPS: r.sector_ps ?? 1.5,
    divPS: r.div_ps ?? 0,
    exDiv: r.ex_div || null,
    cash: r.cash ?? 0, debt: r.debt ?? 0, ltDebt: r.lt_debt ?? 0,
    totalLiab: r.total_liab ?? 0, totalAssets: r.total_assets ?? 0,
    equity: r.equity ?? 0, coverage: r.coverage ?? 5,
    recv: r.recv ?? 0, inv: r.inv ?? 0, phys: r.phys ?? 0, ap: r.ap ?? 0,
    fwdEps: r.forward_eps,
    nAnalysts: r.n_analysts, recommendation: r.recommendation || null,
    targetMean: r.target_mean == null ? null : Number(r.target_mean),
    targetHigh: r.target_high == null ? null : Number(r.target_high),
    targetLow: r.target_low == null ? null : Number(r.target_low),
    recKey: r.rec_key || null,
    analystsN: r.analysts_n == null ? null : Number(r.analysts_n),
    desc: r.descr || "",
    descLong: r.descr_long || "",
    segments: r.segments || [["Total revenue", 1.0]],
    opex: r.opex || null,
    own: r.ownership || { Institutional: 50, Insiders: 5, Public: 45 },
    peers: r.peers || [],
    phase: r.phase || undefined,
    // FX so the client can convert local → USD
    _perUSD: fx[r.currency] ?? 1,
  });
}

export default async function handler(req, res) {
  try {
    const [instruments, fxRows] = await Promise.all([
      sb("instruments?select=*&order=mkt_cap.desc"),
      sb("fx_rates?select=*"),
    ]);
    const fx = Object.fromEntries(fxRows.map((f) => [f.currency, Number(f.per_usd)]));
    const stocks = instruments.map((r) => toStock(r, fx));

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=60"); // short cache so new tickers show up fast
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ updatedAt: new Date().toISOString(), fx, stocks });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
