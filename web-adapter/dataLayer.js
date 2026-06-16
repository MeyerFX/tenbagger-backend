// ============================================================
// tenbagger — front-end data layer (drop into your React app)
//
// Replaces the hard-coded STOCKS array with LIVE data from your
// free backend, while keeping ALL your existing analysis code
// (buildTech, buildScores, genAnnual fallback, etc.) intact.
//
// Usage in App():
//   const { stocks, fx, loading, error } = useUniverse();
//   if (loading) return <Splash/>;
//   // then use `stocks` exactly like the old STOCKS constant.
//
// And for real price history on the selected ticker:
//   const live = useTickerHistory(ticker);
//   // live.series → feed straight into buildTech(...)
// ============================================================

import { useEffect, useState } from "react";

// Point this at your deployed API (Vercel URL). During local dev,
// you can run `vercel dev` and use http://localhost:3000.
const API_BASE = import.meta?.env?.VITE_API_BASE || "/api";

// ---- the whole universe, once ----
export function useUniverse() {
  const [state, setState] = useState({ stocks: [], fx: {}, loading: true, error: null });
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/universe`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.error) setState({ stocks: [], fx: {}, loading: false, error: d.error });
        else setState({ stocks: d.stocks, fx: d.fx, loading: false, error: null });
      })
      .catch((e) => alive && setState({ stocks: [], fx: {}, loading: false, error: String(e) }));
    return () => { alive = false; };
  }, []);
  return state;
}

// ---- real daily history for one ticker ----
// Returns { series, financials, insiders, alerts } where `series`
// is shaped EXACTLY like your genSeries() output so buildTech() works:
//   [{ i, ts, date, dLong, close, v }, ...]
export function useTickerHistory(ticker) {
  const [data, setData] = useState({ series: null, financials: [], insiders: [], alerts: [], loading: true });
  useEffect(() => {
    if (!ticker) return;
    let alive = true;
    setData((d) => ({ ...d, loading: true }));
    fetch(`${API_BASE}/prices?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const series = (d.prices || []).map((p, i) => {
          const dt = new Date(p.d);
          return {
            i,
            ts: dt.getTime(),
            date: dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
            dLong: dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            close: p.close,
            v: p.v / 1e6, // millions of shares, matching the app
          };
        });
        setData({ series, financials: d.financials || [], insiders: d.insiders || [], alerts: d.alerts || [], loading: false });
      })
      .catch(() => alive && setData((d) => ({ ...d, loading: false })));
    return () => { alive = false; };
  }, [ticker]);
  return data;
}

// ---- convert real annual financials → the app's genAnnual() shape ----
// Your genAnnual returns { hist, divHist, debtHist, fut }. With real data
// you get `hist` for free; divHist/debtHist/fut can fall back to your
// existing synthetic generators until you wire historical balance sheets.
export function annualFromReal(financials, stock, genAnnualFallback) {
  const fallback = genAnnualFallback(stock);
  if (!financials || financials.length === 0) return fallback;
  const hist = financials.map((f) => ({
    y: String(f.fiscal_year),
    rev: Number(f.revenue) || 0,
    earn: Number(f.earnings) || 0,
    fcf: Number(f.fcf) || 0,
  }));
  // project forward from the latest real earnings using consensus growth
  let e = hist[hist.length - 1]?.earn || 0;
  const fut = [1, 2, 3].map((n) => {
    e = e * (1 + (stock.forecastG || 8) / 100);
    return { y: String(new Date().getFullYear() + n), proj: Math.round(e) };
  });
  return { ...fallback, hist, fut };
}
