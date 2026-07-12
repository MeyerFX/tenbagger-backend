#!/usr/bin/env python3
"""
tenbagger collector — fills the Postgres database from FREE sources.

Sources (all no-cost):
  - yfinance         : prices, fundamentals, balance sheet, dividends  (Yahoo, unofficial)
  - SEC EDGAR        : insider Form 4 transactions (US tickers), official + free
  - exchangerate.host: FX rates, free, no key

Run locally:   python collector.py
Run in CI:      GitHub Actions calls this once a day (see .github/workflows)

ENV VARS required:
  DATABASE_URL   postgres connection string (Supabase → Settings → Database)
  SEC_UA         a contact string SEC requires, e.g. "tenbagger me@example.com"

NOTE ON LICENSING: yfinance scrapes Yahoo and is fine for a personal demo,
but NOT for a commercial product. Swap this module for a licensed feed
(FMP / EOD Historical / Polygon) before charging users. Every other file
in this repo stays the same — only this collector changes.
"""

import os
import sys
import time
import math
import json
import datetime as dt
from typing import Optional

import requests
import psycopg2
import psycopg2.extras

try:
    import yfinance as yf
except ImportError:
    print("Install deps first:  pip install -r requirements.txt", file=sys.stderr)
    raise

# ----- SEED universe: used only to fill the watchlist table on first run -----
# After the first run, manage tickers in the Supabase `watchlist` table —
# no code edits needed. Currency/kind are auto-detected when left empty.
UNIVERSE = [
    # ticker,     currency, kind
    ("AAPL",  "USD", None),
    ("MSFT",  "USD", None),
    ("NVDA",  "USD", None),
    ("KO",    "USD", None),
    ("JNJ",   "USD", None),
    ("XOM",   "USD", None),
    ("NUE",   "USD", None),      # steel — cyclical, exercises the cycle UI
    ("O",     "USD", "reit"),    # Realty Income — REIT path
    ("VT",    "USD", "etf"),     # Vanguard Total World — ETF path
    ("PETR4.SA", "BRL", None),   # Petrobras — Brazil/BRL path
    ("VALE3.SA", "BRL", None),
    ("ITUB4.SA", "BRL", None),
    ("SIVE.ST", "SEK", None),
    ("AAOI",    "USD", None),
    ("ACHR",    "USD", None),
    ("SNDK",    "USD", None),
    ("GGAL",    "USD", None),
    ("SNTI",    "USD", None),
    ("STG.TA",  "ILS", None),
]

SECTOR_FALLBACK_PE = {  # rough industry medians, used when peers are thin
    "Technology": 30, "Consumer Defensive": 18, "Healthcare": 22,
    "Energy": 11, "Basic Materials": 9, "Real Estate": 33,
    "Financial Services": 12, "Industrials": 20, "Utilities": 16,
    "Communication Services": 19, "Consumer Cyclical": 22,
}

COUNTRY_FLAG = {"USD": "🇺🇸 US", "BRL": "🇧🇷 Brazil", "EUR": "🇪🇺 EU", "SEK": "🇸🇪 Sweden", "ILS": "🇮🇱 Israel"}

# rates: units of currency per 1 USD (fetched once per run; fallbacks if API down)
RATES = {"USD": 1.0, "BRL": 5.45, "EUR": 0.92, "SEK": 10.5, "ILS": 3.65, "ARS": 1300.0}

def load_usd_rates():
    try:
        r = requests.get("https://open.er-api.com/v6/latest/USD", timeout=20)
        data = r.json().get("rates", {})
        for c, v in data.items():
            RATES[c] = float(v)
        print(f"  live FX loaded ({len(data)} currencies)")
    except Exception as e:
        print(f"  live FX failed ({e}); using fallbacks")


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def num(x, scale=1.0, nd=2) -> Optional[float]:
    """Safe float with optional scaling; returns None for NaN/None."""
    try:
        if x is None:
            return None
        v = float(x)
        if math.isnan(v) or math.isinf(v):
            return None
        return round(v * scale, nd)
    except (TypeError, ValueError):
        return None


def calc_peg(pe, g):
    if pe and g and pe > 0 and g > 0:
        return round(pe / g, 2)
    return None


def db():
    url = os.environ["DATABASE_URL"]
    return psycopg2.connect(url)


MAG7 = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA"]  # public showcase, always collected


def load_universe(conn):
    """Universe = Mag-7 showcase + union of every user's watchlist.
    Falls back to the legacy global watchlist while migrating."""
    try:
        with conn.cursor() as cur:
            cur.execute("select distinct ticker from user_watchlists")
            rows = [r[0] for r in cur.fetchall()]
        if rows:
            return [(t, None, None) for t in sorted(set(rows) | set(MAG7))]
        print("  user_watchlists empty — falling back to legacy watchlist (+ Mag 7)")
    except Exception as e:
        conn.rollback()
        print(f"  user_watchlists missing ({e}) — falling back to legacy watchlist")
    try:
        with conn.cursor() as cur:
            cur.execute("select ticker, currency, kind from watchlist where active order by ticker")
            rows = cur.fetchall()
        if rows:
            have = {t for (t, _, _) in rows}
            return [(t, c, k) for (t, c, k) in rows] + [(t, None, None) for t in MAG7 if t not in have]
    except Exception as e:
        conn.rollback()
        print(f"  watchlist table missing? ({e}) — run db/watchlist.sql. Using built-in seed.")
        return UNIVERSE
    # table exists but is empty → seed it
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            "insert into watchlist (ticker, currency, kind) values %s on conflict do nothing",
            UNIVERSE,
        )
    conn.commit()
    print(f"  watchlist seeded with {len(UNIVERSE)} tickers")
    return UNIVERSE


# ---------------------------------------------------------------------------
# FX
# ---------------------------------------------------------------------------
def fetch_fx(conn):
    """Free FX: units of each currency per 1 USD — for every currency actually in use."""
    with conn.cursor() as cur:
        cur.execute("select distinct currency from instruments where currency is not null")
        wanted = sorted({r[0] for r in cur.fetchall()} - {"USD"})
    rows = [("USD", 1.0)]
    fallback = {"BRL": 5.45, "EUR": 0.92, "SEK": 10.5, "ILS": 3.65}
    try:
        # open.er-api.com: free, no API key, daily-updated USD rates
        r = requests.get("https://open.er-api.com/v6/latest/USD", timeout=20)
        data = r.json().get("rates", {})
        for c in wanted:
            if c in data:
                rows.append((c, round(float(data[c]), 4)))
            else:
                rows.append((c, fallback.get(c, 1.0)))
    except Exception as e:
        print(f"  FX fetch failed ({e}); using fallbacks")
        for c in wanted:
            rows.append((c, fallback.get(c, 1.0)))
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """insert into fx_rates (currency, per_usd, updated_at)
               values %s
               on conflict (currency) do update
               set per_usd = excluded.per_usd, updated_at = now()""",
            [(c, v, dt.datetime.utcnow()) for c, v in rows],
        )
    conn.commit()
    print(f"  FX updated: {rows}")


# ---------------------------------------------------------------------------
# per-instrument fundamentals + balance sheet
# ---------------------------------------------------------------------------
def collect_instrument(conn, ticker, currency, kind):
    print(f"[{ticker}] fetching…")
    tk = yf.Ticker(ticker)
    info = tk.info or {}
    # TASE (Tel Aviv) quotes come in agorot (ILA = 0.01 shekel) — normalize to ILS
    px_scale = 0.01 if (info.get("currency") == "ILA") else 1.0

    # auto-detect currency & kind when the watchlist row left them empty
    det = (info.get("currency") or "").upper()
    if det == "ILA":
        det = "ILS"
    currency = (currency or det or "USD").upper()
    if not kind:
        qt = (info.get("quoteType") or "").upper()
        if qt == "ETF":
            kind = "etf"
        elif "REIT" in (info.get("industry") or ""):
            kind = "reit"
    try:
        with conn.cursor() as cur:
            cur.execute("update watchlist set currency=%s, kind=%s where ticker=%s", (currency, kind, ticker))
        conn.commit()
    except Exception:
        conn.rollback()

    name = info.get("longName") or info.get("shortName") or ticker
    sector = info.get("sector") or ("Diversified fund" if kind == "etf" else None)
    industry = info.get("industry")
    industry = info.get("industry")

    mkt_cap_local = num(info.get("marketCap"), scale=1e-9)  # → billions
    pe = num(info.get("trailingPE"))
    fwd_pe = num(info.get("forwardPE"))
    ps = num(info.get("priceToSalesTrailing12Months"))
    pb = num(info.get("priceToBook"))
    ev_ebitda = num(info.get("enterpriseToEbitda"))
    eps_growth = num(info.get("earningsGrowth"), scale=100)
    rev_growth = num(info.get("revenueGrowth"), scale=100)
    div_yield = num(info.get("dividendYield"), scale=100) or 0.0
    payout = num(info.get("payoutRatio"), scale=100) or 0.0
    debt_eq = num(info.get("debtToEquity"), scale=0.01)  # yahoo gives % → ratio
    roe = num(info.get("returnOnEquity"), scale=100)
    roa = num(info.get("returnOnAssets"), scale=100)
    net_margin = num(info.get("profitMargins"), scale=100)
    gross_margin = num(info.get("grossMargins"))
    revenue_m = num(info.get("totalRevenue"), scale=1e-6)  # → millions
    ebitda_b = num(info.get("ebitda"), scale=1e-9)
    div_ps = num(info.get("dividendRate"), scale=px_scale) or 0.0
    fwd_eps = num(info.get("forwardEps"), scale=px_scale)
    target_mean = num(info.get("targetMeanPrice"), scale=px_scale)
    target_high = num(info.get("targetHighPrice"), scale=px_scale)
    target_low = num(info.get("targetLowPrice"), scale=px_scale)
    try:
        n_analysts = int(info.get("numberOfAnalystOpinions") or 0) or None
    except (TypeError, ValueError):
        n_analysts = None
    recommendation = (info.get("recommendationKey") or None)
    if recommendation in ("none", "NONE"):
        recommendation = None
    expense_ratio = num(info.get("annualReportExpenseRatio"), scale=100) if kind == "etf" else None

    # ex-dividend date (epoch → readable)
    ex_div = None
    if info.get("exDividendDate"):
        try:
            ex_div = dt.datetime.utcfromtimestamp(info["exDividendDate"]).strftime("%b %d, %Y")
        except Exception:
            ex_div = None

    # Yahoo may report FINANCIAL STATEMENTS in a different currency than the
    # listing (e.g. GGAL: price in USD, statements in ARS). Convert statements
    # into the listing currency so revenue/market-cap ratios make sense.
    fin_ccy = (info.get("financialCurrency") or currency).upper()
    conv = 1.0
    if fin_ccy != currency and fin_ccy in RATES and currency in RATES:
        conv = RATES[currency] / RATES[fin_ccy]
        print(f"  statements in {fin_ccy} -> converting to {currency} (x{conv:.6f})")
    if conv != 1.0:
        if revenue_m is not None: revenue_m = round(revenue_m * conv, 1)
        if ebitda_b is not None: ebitda_b = round(ebitda_b * conv, 3)

    # analyst consensus (free from Yahoo): price targets + recommendation
    target_mean = num(info.get("targetMeanPrice"))
    target_high = num(info.get("targetHighPrice"))
    target_low = num(info.get("targetLowPrice"))
    rec_key = info.get("recommendationKey")
    analysts_n = info.get("numberOfAnalystOpinions")
    try:
        analysts_n = int(analysts_n) if analysts_n is not None else None
    except (TypeError, ValueError):
        analysts_n = None

    forecast_g = eps_growth if eps_growth is not None else rev_growth
    peg = calc_peg(pe, eps_growth)
    sector_pe = SECTOR_FALLBACK_PE.get(sector, 18)
    sector_ps = round(sector_pe / 12, 1)

    # ---- balance sheet (most recent column) ----
    bs = {}
    try:
        sheet = tk.balance_sheet  # DataFrame, columns = periods
        if sheet is not None and not sheet.empty:
            col = sheet.columns[0]
            def b(field):  # billions
                try:
                    return num(sheet.loc[field, col], scale=1e-9)
                except Exception:
                    return None
            bs["cash"] = b("Cash And Cash Equivalents") or b("Cash") or 0
            bs["total_assets"] = b("Total Assets") or 0
            bs["total_liab"] = b("Total Liabilities Net Minority Interest") or b("Total Liab") or 0
            bs["equity"] = b("Stockholders Equity") or b("Total Stockholder Equity") or 0
            bs["lt_debt"] = b("Long Term Debt") or 0
            total_debt = b("Total Debt")
            bs["debt"] = total_debt if total_debt else (bs["lt_debt"] or 0)
            bs["recv"] = b("Receivables") or b("Net Receivables") or 0
            bs["inv"] = b("Inventory") or 0
            bs["phys"] = b("Net PPE") or b("Property Plant Equipment Net") or 0
            bs["ap"] = b("Accounts Payable") or b("Payables") or 0
    except Exception as e:
        print(f"  balance sheet parse failed: {e}")

    # real cost structure from the latest annual income statement (free!)
    opex = None
    try:
        fin0 = tk.financials
        if fin0 is not None and not fin0.empty:
            col0 = fin0.columns[0]
            def m(field):
                try:
                    return num(fin0.loc[field, col0], scale=1e-6, nd=0)
                except Exception:
                    return None
            opex = {
                "fy": int(col0.year),
                "rev": m("Total Revenue"),
                "cor": m("Cost Of Revenue"),
                "gp": m("Gross Profit"),
                "sgna": m("Selling General And Administration"),
                "rnd": m("Research And Development"),
                "opx": m("Operating Expense"),
                "ni": m("Net Income"),
            }
            if not opex.get("rev"):
                opex = None
    except Exception:
        opex = None

    # interest coverage (EBIT / interest expense) when available
    coverage = None
    try:
        fin = tk.financials
        if fin is not None and not fin.empty:
            col = fin.columns[0]
            ebit = fin.loc["EBIT", col] if "EBIT" in fin.index else None
            interest = fin.loc["Interest Expense", col] if "Interest Expense" in fin.index else None
            if ebit and interest and float(interest) != 0:
                coverage = round(abs(float(ebit) / float(interest)), 1)
    except Exception:
        pass

    # real expense breakdown from the income statement (converted to listing ccy)
    opex = None
    try:
        fin2 = tk.financials
        if fin2 is not None and not fin2.empty:
            c0 = fin2.columns[0]
            def li(*names):
                for nm in names:
                    try:
                        v = float(fin2.loc[nm, c0])
                        if v == v:  # not NaN
                            return v
                    except Exception:
                        continue
                return None
            mm = 1e-6 * conv
            opex = {
                "cos": num(li("Cost Of Revenue", "Reconciled Cost Of Revenue"), mm, 0),
                "rnd": num(li("Research And Development", "Research & Development"), mm, 0),
                "sga": num(li("Selling General And Administration", "Selling General Administrative", "Selling General & Administrative"), mm, 0),
                "tax": num(li("Tax Provision", "Income Tax Expense"), mm, 0),
                "interest": num(li("Interest Expense", "Interest Expense Non Operating"), mm, 0),
            }
            if all(v is None for v in opex.values()):
                opex = None
    except Exception:
        opex = None

    # ROIC proxy: net income / (equity + debt)
    roic = None
    if net_margin is not None and revenue_m and bs.get("equity"):
        ni = (net_margin / 100) * revenue_m / 1000  # billions
        invested = (bs.get("equity") or 0) + (bs.get("debt") or 0)
        if invested > 0:
            roic = round(ni / invested * 100, 1)

    if conv != 1.0:
        for kk in list(bs.keys()):
            if bs.get(kk) is not None:
                bs[kk] = round(bs[kk] * conv, 3)

    descr = (info.get("longBusinessSummary") or "")[:240]
    descr_long = info.get("longBusinessSummary") or ""

    # segments: yahoo doesn't expose clean revenue segments for free,
    # so we approximate with a single bucket. The app handles 1–2 segments.
    segments = [["Total revenue", 1.0]]

    # ownership (yahoo gives held % by insiders/institutions)
    inst = num(info.get("heldPercentInstitutions"), scale=100) or 0
    ins = num(info.get("heldPercentInsiders"), scale=100) or 0
    public = max(0, round(100 - inst - ins, 1))
    ownership = {"Institutional": inst, "Insiders": ins, "Public": public}

    row = {
        "ticker": ticker, "name": name, "sector": sector, "industry": industry, "industry": industry,
        "country": COUNTRY_FLAG.get(currency, "🌐"), "currency": currency, "kind": kind,
        "mkt_cap": mkt_cap_local, "pe": pe, "fwd_pe": fwd_pe, "ps": ps, "pb": pb,
        "ev_ebitda": ev_ebitda, "peg": peg, "eps_growth": eps_growth, "rev_growth": rev_growth,
        "forecast_g": forecast_g, "div_yield": div_yield, "payout": payout, "debt_eq": debt_eq,
        "roic": roic, "roe": roe, "roi": roa, "net_margin": net_margin, "gross_margin": gross_margin,
        "revenue_m": revenue_m, "ebitda_b": ebitda_b, "sector_pe": sector_pe, "sector_ps": sector_ps,
        "div_ps": div_ps, "ex_div": ex_div, "expense_ratio": expense_ratio,
        "cash": bs.get("cash"), "debt": bs.get("debt"), "lt_debt": bs.get("lt_debt"),
        "total_liab": bs.get("total_liab"), "total_assets": bs.get("total_assets"),
        "equity": bs.get("equity"), "coverage": coverage, "recv": bs.get("recv"),
        "inv": bs.get("inv"), "phys": bs.get("phys"), "ap": bs.get("ap"),
        "target_mean": target_mean, "target_high": target_high, "target_low": target_low,
        "rec_key": rec_key, "analysts_n": analysts_n, "fin_currency": fin_ccy,
        "descr": descr, "descr_long": descr_long,
        "opex": json.dumps(opex) if opex else None,
        "forward_eps": fwd_eps, "target_mean": target_mean, "target_high": target_high,
        "target_low": target_low, "n_analysts": n_analysts, "recommendation": recommendation,
        "segments": json.dumps(segments), "ownership": json.dumps(ownership),
        "peers": json.dumps([]), "phase": None,
        "opex": json.dumps(opex) if opex else None,
    }
    upsert_instrument(conn, row)
    collect_prices(conn, tk, ticker, px_scale)
    collect_financials(conn, tk, ticker, conv)
    if currency == "USD":
        collect_insiders(conn, tk, ticker)
    print(f"  ✓ {ticker} done")


def upsert_instrument(conn, row):
    cols = list(row.keys())
    placeholders = ", ".join(["%s"] * len(cols))
    updates = ", ".join([f"{c} = excluded.{c}" for c in cols if c != "ticker"])
    sql = (
        f"insert into instruments ({', '.join(cols)}) values ({placeholders}) "
        f"on conflict (ticker) do update set {updates}, updated_at = now()"
    )
    with conn.cursor() as cur:
        cur.execute(sql, [row[c] for c in cols])
    conn.commit()


def collect_prices(conn, tk, ticker, px_scale=1.0, years=5):
    hist = None
    for attempt in (1, 2, 3):
        try:
            hist = tk.history(period=f"{years}y", interval="1d", auto_adjust=True)
        except Exception as e:
            print(f"  history fetch error (try {attempt}): {e}")
            hist = None
        if hist is not None and not hist.empty:
            break
        if attempt < 3:
            print(f"  empty history (try {attempt}) — Yahoo throttling? retrying in 15s")
            time.sleep(15)
    if (hist is None or hist.empty or len(hist) < 200) and years != "max":
        try:
            h2 = tk.history(period="max", interval="1d", auto_adjust=True)
            if h2 is not None and (hist is None or len(h2) > (0 if hist is None else len(hist))):
                hist = h2
                print(f"  thin 5y history — using period=max ({len(hist)} rows)")
        except Exception:
            pass
    if hist is None or hist.empty:
        print("  no price history after retries — keeping previous prices in DB")
        return
    rows = []
    for idx, r in hist.iterrows():
        d = idx.date()
        rows.append((ticker, d, num(r["Close"], scale=px_scale), num(r.get("Volume"), nd=0)))
    with conn.cursor() as cur:
        cur.execute("delete from prices where ticker = %s", (ticker,))
        psycopg2.extras.execute_values(
            cur,
            "insert into prices (ticker, d, close, volume) values %s on conflict do nothing",
            rows, page_size=500,
        )
    conn.commit()
    print(f"  {len(rows)} price rows")


def collect_financials(conn, tk, ticker, conv=1.0):
    try:
        fin = tk.financials              # annual income statement
        cf = tk.cashflow
        if fin is None or fin.empty:
            return
        rows = []
        for col in fin.columns:
            year = col.year
            rev = fin.loc["Total Revenue", col] if "Total Revenue" in fin.index else None
            earn = fin.loc["Net Income", col] if "Net Income" in fin.index else None
            fcf = None
            try:
                if cf is not None and "Free Cash Flow" in cf.index and col in cf.columns:
                    fcf = cf.loc["Free Cash Flow", col]
            except Exception:
                pass
            rows.append((ticker, year, num(rev, 1e-6 * conv, 0), num(earn, 1e-6 * conv, 0), num(fcf, 1e-6 * conv, 0)))
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                """insert into financials_annual (ticker, fiscal_year, revenue, earnings, fcf)
                   values %s on conflict (ticker, fiscal_year) do update
                   set revenue=excluded.revenue, earnings=excluded.earnings, fcf=excluded.fcf""",
                rows,
            )
        conn.commit()
        print(f"  {len(rows)} annual financial rows")
    except Exception as e:
        print(f"  financials failed: {e}")


# ---------------------------------------------------------------------------
# SEC EDGAR — insider Form 4 (US only, free, official)
# ---------------------------------------------------------------------------
def collect_insiders(conn, tk, ticker):
    """Insider buys/sells from Yahoo (same channel as everything else).
    Only rows with a clear direction are stored — grants/exercises are skipped."""
    try:
        df = None
        try:
            df = tk.insider_transactions
        except Exception:
            df = None
        tx = []
        if df is not None and hasattr(df, "empty") and not df.empty:
            for _, r in df.head(40).iterrows():
                try:
                    txt = f"{r.get('Text', '')} {r.get('Transaction', '')}".lower()
                    if "purchase" in txt or "buy" in txt:
                        is_buy = True
                    elif "sale" in txt or "sell" in txt:
                        is_buy = False
                    else:
                        continue  # grants, exercises, gifts: not a signal
                    d = r.get("Start Date")
                    filed = str(d)[:10]
                    if not filed or filed in ("NaT", "None", "nan"):
                        continue
                    sh = r.get("Shares")
                    val = r.get("Value")
                    sh = float(sh) if sh is not None and sh == sh else None
                    val = float(val) if val is not None and val == val else None
                    price = round(val / sh, 2) if sh and val else None
                    name = str(r.get("Insider") or "Insider").title()[:80]
                    role = str(r.get("Position") or "—")[:60]
                    tx.append((ticker, filed, name, role, is_buy,
                               round(sh, 0) if sh else None, price,
                               round(val, 0) if val else None))
                    if len(tx) >= 14:
                        break
                except Exception:
                    continue
        with conn.cursor() as cur:
            cur.execute("delete from insider_tx where ticker = %s", (ticker,))
            if tx:
                psycopg2.extras.execute_values(
                    cur,
                    """insert into insider_tx
                       (ticker, filed_at, insider_name, role, is_buy, shares, price, value_usd)
                       values %s""",
                    tx,
                )
        conn.commit()
        print(f"  {len(tx)} insider buy/sell rows (Yahoo)")
    except Exception as e:
        conn.rollback()
        print(f"  insiders failed: {e}")


# ---------------------------------------------------------------------------
def main():
    conn = db()
    print("== tenbagger collector ==")
    load_usd_rates()
    single = (os.environ.get("TICKER") or "").strip().upper()
    if single:
        # on-demand mode: collect just one ticker (triggered from the app)
        print(f"  single-ticker mode: {single} (cache only — user adds to watchlist in the app)")
        universe = [(single, None, None)]
    else:
        universe = load_universe(conn)
    print(f"  universe: {len(universe)} tickers")
    for ticker, currency, kind in universe:
        try:
            collect_instrument(conn, ticker, currency, kind)
            time.sleep(2.5)  # gentle pacing for Yahoo (CI runners get throttled)
        except Exception as e:
            print(f"!! {ticker} failed: {e}")
            conn.rollback()
    fetch_fx(conn)  # after collection, so auto-detected currencies are included
    conn.close()

    # recompute significant-change alerts from the fresh data
    try:
        import alerts as alerts_mod
        alerts_mod.main()
    except Exception as e:
        print(f"alerts step failed: {e}")
    print("== done ==")


if __name__ == "__main__":
    main()
