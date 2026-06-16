# tenbagger — free-tier real-data backend

This turns your prototype into a **real, hosted demo with real market data,
updated daily, at $0/month** — within the free tiers of Supabase, GitHub
Actions and Vercel. No credit card needed for the demo level.

```
┌─────────────┐   daily cron    ┌──────────────┐   reads    ┌─────────────┐
│ GitHub      │ ───────────────▶│  Supabase    │◀───────────│  Vercel API │
│ Actions     │  collector.py   │  Postgres    │  REST/anon │ /api/*      │
│ (free CI)   │  yfinance+EDGAR │  (free 500MB)│            │ (free)      │
└─────────────┘                 └──────────────┘            └──────┬──────┘
                                                                    │ fetch
                                                             ┌──────▼──────┐
                                                             │ React app   │
                                                             │ (Vercel/    │
                                                             │  Netlify)   │
                                                             └─────────────┘
```

## What's free, and the honest limits

| Layer | Free option | Limit you should know |
|---|---|---|
| Database | Supabase free | 500 MB, pauses after 1 week idle (a daily cron keeps it awake) |
| Cron / collector | GitHub Actions | unlimited on public repos; 2,000 min/mo private (job ≈ 3 min) |
| API + hosting | Vercel Hobby | plenty for a demo; non-commercial |
| Prices + fundamentals | yfinance (Yahoo) | **end-of-day, unofficial, non-commercial** |
| Insiders (US) | SEC EDGAR | official & unlimited (be polite: set SEC_UA) |
| FX | exchangerate.host | free, no key |
| Real-time quotes | — | **not free** (exchanges license this); EOD only here |
| Brazil fundamentals | yfinance `.SA` | spotty quality; CVM open-data is the licensed path later |

> ⚠️ **Licensing:** yfinance is fine for a personal/portfolio demo, not for a
> commercial product. When you monetize, swap `collector.py` for a licensed
> feed (Financial Modeling Prep, EOD Historical, Polygon). **Nothing else in
> this repo changes** — the DB schema and API are feed-agnostic.

---

## Setup (≈ 30 minutes, no coding)

### 1. Database — Supabase
1. Create a free project at supabase.com.
2. Open **SQL Editor**, paste `db/schema.sql`, run it.
3. **Settings → Database** → copy the **connection string** (`DATABASE_URL`).
4. **Settings → API** → copy the **Project URL** and the **anon public key**.

### 2. Collector — GitHub Actions
1. Push this folder to a **GitHub repo** (public = unlimited free minutes).
2. **Settings → Secrets and variables → Actions** → add:
   - `DATABASE_URL` = the Supabase connection string
   - `SEC_UA` = `"tenbagger your-email@example.com"` (SEC requires a contact)
3. **Actions** tab → run **daily-collect** once manually (workflow_dispatch).
   After ~3 min your tables fill with real data.

### 3. API — Vercel
1. Import the repo at vercel.com (root = this folder).
2. Add env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
3. Deploy. Test: `https://YOUR.vercel.app/api/universe` → JSON of real stocks.

### 4. Wire the React app
In your `App()` (the tenbagger artifact), replace the hard-coded `STOCKS`:

```jsx
import { useUniverse, useTickerHistory, annualFromReal } from "./web-adapter/dataLayer";

export default function App() {
  const { stocks: STOCKS, fx, loading, error } = useUniverse();
  if (loading) return <div>Loading market data…</div>;
  if (error)   return <div>Backend error: {error}</div>;
  // ...the rest of your component is unchanged — STOCKS now holds real data.
}
```

For real price charts on the selected ticker:

```jsx
const live = useTickerHistory(ticker);
const series = live.series ?? genSeries(stock);     // real history, fallback to synthetic
const tech = buildTech(series);                     // your existing function — untouched
```

Set `VITE_API_BASE` to your Vercel URL (or use a Vercel rewrite so `/api`
points at it). Done — the app now runs on real, daily-updated data.

---

## What stays synthetic (and why that's fine for a demo)
- **Intraday 1D/5D**: needs a real-time feed; the app still generates these.
- **Revenue segments / opex split** (R&D, marketing…): not in free fundamentals.
- **Options chains**: no free real-time source; the app's mock chain remains.
- **Social/news (Reddit/X)**: paid APIs; keep the curated mock or add a free
  RSS news feed later.

These are exactly the modules that need **paid** APIs in production — so the
free demo cleanly shows everything *except* the parts that cost money, which
makes the "what we'd license next" conversation concrete for investors.

---

## File map
```
db/schema.sql                  Postgres tables + read-only RLS
collector/collector.py         yfinance + EDGAR + FX → Postgres
collector/alerts.py            recomputes ⚡ change-alerts from real data
collector/requirements.txt     pip deps
.github/workflows/daily-collect.yml   the free daily cron
api/universe.js                serverless: full universe in the app's shape
api/prices.js                  serverless: real price/financials/insiders per ticker
web-adapter/dataLayer.js       React hooks to drop into the app
```
