#!/usr/bin/env python3
"""
alerts.py — recompute significant-change alerts from the data already
in Postgres, mirroring the front-end's genAlerts() rules.

Called at the end of the collector run (or as its own scheduled step).
Keeps the app's ⚡ feature working on real data.

Rules implemented (technical + fundamental):
  - golden / death cross (SMA50 vs SMA200) in the last 30 sessions
  - price reclaiming / losing the 200-day average (last 15 sessions)
  - RSI(14) entering overbought (>70) or oversold (<30)
  - earnings up/down >25% in the latest fiscal year
  - interest coverage below 1.5x
  - consensus forecasting earnings contraction
"""

import os
import datetime as dt
import psycopg2
import psycopg2.extras


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def sma(vals, n, i):
    if i < n - 1:
        return None
    return sum(vals[i - n + 1:i + 1]) / n


def rsi(vals, n=14):
    if len(vals) <= n:
        return None
    gains, losses = 0.0, 0.0
    for k in range(1, n + 1):
        d = vals[k] - vals[k - 1]
        gains += max(d, 0); losses += max(-d, 0)
    g, l = gains / n, losses / n
    for k in range(n + 1, len(vals)):
        d = vals[k] - vals[k - 1]
        g = (g * (n - 1) + max(d, 0)) / n
        l = (l * (n - 1) + max(-d, 0)) / n
    if l == 0:
        return 100.0
    rs = g / l
    return round(100 - 100 / (1 + rs), 1)


def compute_for(conn, ticker):
    out = []
    with conn.cursor() as cur:
        cur.execute("select close from prices where ticker=%s order by d asc", (ticker,))
        closes = [float(r[0]) for r in cur.fetchall()]
    if len(closes) >= 210:
        # crosses in last 30 sessions
        for i in range(len(closes) - 30, len(closes)):
            a50, a200 = sma(closes, 50, i - 1), sma(closes, 200, i - 1)
            b50, b200 = sma(closes, 50, i), sma(closes, 200, i)
            if None in (a50, a200, b50, b200):
                continue
            if a50 <= a200 and b50 > b200:
                out.append(("Technical", 1, f"Golden cross {len(closes)-1-i} sessions ago — SMA50 crossed above SMA200."))
            if a50 >= a200 and b50 < b200:
                out.append(("Technical", -1, f"Death cross {len(closes)-1-i} sessions ago — SMA50 crossed below SMA200."))
        # price vs SMA200 in last 15
        for i in range(len(closes) - 15, len(closes)):
            a200, b200 = sma(closes, 200, i - 1), sma(closes, 200, i)
            if None in (a200, b200):
                continue
            if closes[i - 1] <= a200 and closes[i] > b200:
                out.append(("Technical", 1, "Price reclaimed the 200-day average within the last 15 sessions."))
            if closes[i - 1] >= a200 and closes[i] < b200:
                out.append(("Technical", -1, "Price lost the 200-day average within the last 15 sessions."))
        r = rsi(closes)
        if r is not None and r > 70:
            out.append(("Technical", -1, f"RSI entered overbought territory ({r})."))
        if r is not None and r < 30:
            out.append(("Technical", 1, f"RSI entered oversold territory ({r})."))

    # fundamentals
    with conn.cursor() as cur:
        cur.execute("""select fiscal_year, earnings from financials_annual
                       where ticker=%s order by fiscal_year asc""", (ticker,))
        fin = cur.fetchall()
        cur.execute("select coverage, forecast_g from instruments where ticker=%s", (ticker,))
        meta = cur.fetchone()
    if len(fin) >= 2 and fin[-2][1] not in (None, 0):
        e0, e1 = float(fin[-2][1]), float(fin[-1][1])
        if e0 != 0:
            chg = (e1 - e0) / abs(e0) * 100
            if chg <= -25:
                out.append(("Fundamental", -1, f"Earnings fell {abs(chg):.0f}% in the latest fiscal year."))
            if chg >= 25:
                out.append(("Fundamental", 1, f"Earnings jumped {chg:.0f}% in the latest fiscal year."))
    if meta:
        coverage, fg = meta
        if coverage is not None and float(coverage) < 1.5:
            out.append(("Fundamental", -1, f"Interest coverage at {coverage}x — operating income barely covers interest."))
        if fg is not None and float(fg) < 0:
            out.append(("Fundamental", -1, f"Consensus projects earnings contraction ({fg}%/yr)."))
    return out


def main():
    conn = db()
    with conn.cursor() as cur:
        cur.execute("select ticker from instruments")
        tickers = [r[0] for r in cur.fetchall()]
    for tk in tickers:
        alerts = compute_for(conn, tk)
        with conn.cursor() as cur:
            cur.execute("delete from alerts where ticker=%s", (tk,))
            if alerts:
                psycopg2.extras.execute_values(
                    cur,
                    "insert into alerts (ticker, kind, direction, txt) values %s",
                    [(tk, k, d, t) for (k, d, t) in alerts],
                )
        conn.commit()
        print(f"{tk}: {len(alerts)} alerts")
    conn.close()


if __name__ == "__main__":
    main()
