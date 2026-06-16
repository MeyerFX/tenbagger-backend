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

# ----- the universe you want to track (edit freely) -----
# Mix of US and Brazil so the multi-currency features stay exercised.
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
]

SECTOR_FALLBACK_PE = {  # rough industry medians, used when peers are thin
    "Technology": 30, "Consumer Defensive": 18, "Healthcare": 22,
    "Energy": 11, "Basic Materials": 9, "Real Estate": 33,
    "Financial Services": 12, "Industrials": 20, "Utilities": 16,
    "Communication Services": 19, "Consumer Cyclical": 22,
}

COUNTRY_FLAG = {"USD": "🇺🇸 US", "BRL": "🇧🇷 Brazil", "EUR": "🇪🇺 EU"}


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


# ---------------------------------------------------------------------------
# FX
# ---------------------------------------------------------------------------
def fetch_fx(conn):
    """Free FX: units of each currency per 1 USD."""
    wanted = sorted({c for _, c, _ in UNIVERSE if c != "USD"})
    rows = [("USD", 1.0)]
    try:
        r = requests.get(
            "https://api.exchangerate.host/latest",
            params={"base": "USD", "symbols": ",".join(wanted)},
            timeout=20,
        )
        data = r.json().get("rates", {})
        for c in wanted:
            if c in data:
                rows.append((c, round(float(data[c]), 4)))
    except Exception as e:
        print(f"  FX fetch failed ({e}); using fallbacks")
        fallback = {"BRL": 5.45, "EUR": 0.92}
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

    name = info.get("longName") or info.get("shortName") or ticker
    sector = info.get("sector") or ("Diversified fund" if kind == "etf" else None)

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
    div_ps = num(info.get("dividendRate")) or 0.0
    expense_ratio = num(info.get("annualReportExpenseRatio"), scale=100) if kind == "etf" else None

    # ex-dividend date (epoch → readable)
    ex_div = None
    if info.get("exDividendDate"):
        try:
            ex_div = dt.datetime.utcfromtimestamp(info["exDividendDate"]).strftime("%b %d, %Y")
        except Exception:
            ex_div = None

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

    # ROIC proxy: net income / (equity + debt)
    roic = None
    if net_margin is not None and revenue_m and bs.get("equity"):
        ni = (net_margin / 100) * revenue_m / 1000  # billions
        invested = (bs.get("equity") or 0) + (bs.get("debt") or 0)
        if invested > 0:
            roic = round(ni / invested * 100, 1)

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
        "ticker": ticker, "name": name, "sector": sector,
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
        "descr": descr, "descr_long": descr_long,
        "segments": json.dumps(segments), "ownership": json.dumps(ownership),
        "peers": json.dumps([]), "phase": None,
    }
    upsert_instrument(conn, row)
    collect_prices(conn, tk, ticker)
    collect_financials(conn, tk, ticker)
    if currency == "USD":
        collect_insiders(conn, ticker)
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


def collect_prices(conn, tk, ticker, years=5):
    hist = tk.history(period=f"{years}y", interval="1d", auto_adjust=True)
    if hist is None or hist.empty:
        print("  no price history")
        return
    rows = []
    for idx, r in hist.iterrows():
        d = idx.date()
        rows.append((ticker, d, num(r["Close"]), num(r.get("Volume"), nd=0)))
    with conn.cursor() as cur:
        cur.execute("delete from prices where ticker = %s", (ticker,))
        psycopg2.extras.execute_values(
            cur,
            "insert into prices (ticker, d, close, volume) values %s on conflict do nothing",
            rows, page_size=500,
        )
    conn.commit()
    print(f"  {len(rows)} price rows")


def collect_financials(conn, tk, ticker):
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
            rows.append((ticker, year, num(rev, 1e-6, 0), num(earn, 1e-6, 0), num(fcf, 1e-6, 0)))
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
def collect_insiders(conn, ticker):
    ua = os.environ.get("SEC_UA", "tenbagger demo contact@example.com")
    headers = {"User-Agent": ua}
    try:
        # map ticker → CIK
        m = requests.get("https://www.sec.gov/files/company_tickers.json",
                         headers=headers, timeout=20).json()
        cik = None
        for v in m.values():
            if v["ticker"].upper() == ticker.upper():
                cik = str(v["cik_str"]).zfill(10)
                break
        if not cik:
            return
        # recent filings
        subs = requests.get(f"https://data.sec.gov/submissions/CIK{cik}.json",
                            headers=headers, timeout=20).json()
        recent = subs.get("filings", {}).get("recent", {})
        forms = recent.get("form", [])
        dates = recent.get("filingDate", [])
        # We only count Form 4 occurrences here as a lightweight signal.
        # (Parsing each Form 4 XML for exact share counts is possible but
        #  heavier; this keeps the free job fast. Swap in full parsing later.)
        tx = []
        for form, date in list(zip(forms, dates))[:40]:
            if form == "4":
                tx.append((ticker, date, "Insider (Form 4)", "—", None, None, None, None))
        if tx:
            with conn.cursor() as cur:
                cur.execute("delete from insider_tx where ticker = %s", (ticker,))
                psycopg2.extras.execute_values(
                    cur,
                    """insert into insider_tx
                       (ticker, filed_at, insider_name, role, is_buy, shares, price, value_usd)
                       values %s""",
                    tx,
                )
            conn.commit()
            print(f"  {len(tx)} insider Form-4 filings")
        time.sleep(0.2)  # be polite to SEC
    except Exception as e:
        print(f"  insider fetch failed: {e}")


# ---------------------------------------------------------------------------
def main():
    conn = db()
    print("== tenbagger collector ==")
    fetch_fx(conn)
    for ticker, currency, kind in UNIVERSE:
        try:
            collect_instrument(conn, ticker, currency, kind)
            time.sleep(1.0)  # gentle pacing for Yahoo
        except Exception as e:
            print(f"!! {ticker} failed: {e}")
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
