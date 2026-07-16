import React, { useMemo, useState, useEffect } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid, Area, AreaChart,
  BarChart, PieChart, Pie, Cell, Treemap,
} from "recharts";

/* ============================================================
   TENBAGGER v6 — prototype (all data is fictional)
   USD base · per-stock USD conversion for foreign listings
   options · cycle/turnaround phase · change alerts · EBITDA/ROI
   Sankey revenue breakdown · earnings history · P/E history & vs industry
   ============================================================ */

const C = {
  bg: "#0D1321", panel: "#141C2F", panelSoft: "#1A2440", line: "#243150",
  text: "#E8EDF7", dim: "#8C99B8",
  up: "#34D690", down: "#FF6B6B", warn: "#FFC857",
  accent: "#7AA2FF", violet: "#B58CFF", teal: "#5BD0C8",
};
const FONT_HEAD = "'Sora','Archivo',system-ui,sans-serif";
const FONT_MONO = "'IBM Plex Mono','SFMono-Regular',monospace";

/* fictional FX: units of local currency per 1 USD */
const CCY = {
  USD: { sym: "$", perUSD: 1, label: "USD" },
  BRL: { sym: "R$", perUSD: 5.45, label: "BRL" },
  EUR: { sym: "€", perUSD: 0.92, label: "EUR" },
};

/* ---------- fictional international universe (values in LOCAL currency) ---------- */
const STOCKS = [
  {
    ticker: "NVTK", name: "Novatek Systems", sector: "Technology", country: "🇺🇸 US", currency: "USD",
    mktCap: 46.0, pe: 26.5, sectorPE: 30.0, ps: 7.2, sectorPS: 8.5, evEbitda: 19.0,
    epsGrowth: 29.0, revGrowth: 34.0, forecastG: 26.0,
    divYield: 0.0, debtEq: 0.12, pb: 8.4, roic: 24.0, roe: 28.0, roi: 19.0, netMargin: 21.0,
    revenueM: 6390, grossMargin: 0.72, ebitdaB: 2.1,
    segments: [["Platform subscriptions", 0.78], ["Professional services", 0.22]],
    payout: 0, cyclical: false, recovering: false, assetRich: false,
    cash: 6.8, debt: 0.8, ltDebt: 0.5, totalLiab: 2.4, totalAssets: 7.9, equity: 5.5, coverage: 40, recv: 0.6, inv: 0.05, phys: 0.25, ap: 0.4,
    own: { Institutional: 61, Insiders: 14, Funds: 15, Public: 10 },
    peers: [
      { n: "CloudForge", pe: 35.0, ps: 9.8, pb: 11.0, dy: 0.0, g: 31, mc: 62, h: 5.2, pa: 4.8 },
      { n: "DataSpire", pe: 24.0, ps: 6.1, pb: 7.0, dy: 0.3, g: 18, mc: 18, h: 4.5, pa: 3.9 },
      { n: "Loomstack", pe: 41.0, ps: 12.5, pb: 14.0, dy: 0.0, g: 38, mc: 31, h: 3.1, pa: 4.2 },
    ],
    desc: "Novatek builds the software layer that lets banks and enterprises run AI models on their own data — subscriptions are ~80% of revenue.",
    descLong: "Founded in 2014 and headquartered in Austin, Novatek employs ~2,900 people and serves 400+ enterprises in finance, healthcare and government — sectors that need AI on-premises for regulatory reasons. Net revenue retention runs at 124%, meaning existing customers expand faster than any churn. The company is founder-led (the CEO holds 9%), carries net cash, and its main competitive risk is hyperscalers bundling similar tooling into their clouds.",
    fwdPE: 21.0, divPS: 0, exDiv: null,
    fvFactor: 1.28, insiderBias: 0.5, seed: 11, start: 84, trend: 0.0012, vol: 0.022,
  },
  {
    ticker: "HWFD", name: "Hartwell Foods", sector: "Consumer staples", country: "🇺🇸 US", currency: "USD",
    mktCap: 71.0, pe: 17.5, sectorPE: 16.0, ps: 1.8, sectorPS: 1.5, evEbitda: 10.5,
    epsGrowth: 11.0, revGrowth: 9.5, forecastG: 10.0,
    divYield: 2.9, debtEq: 0.58, pb: 2.8, roic: 14.5, roe: 17.0, roi: 12.0, netMargin: 10.2,
    revenueM: 39400, grossMargin: 0.34, ebitdaB: 7.6,
    segments: [["Packaged foods", 0.64], ["Beverages", 0.36]],
    payout: 48, cyclical: false, recovering: false, assetRich: false,
    cash: 5.9, debt: 14.8, ltDebt: 12.1, totalLiab: 22.3, totalAssets: 47.3, equity: 25.0, coverage: 9, recv: 4.2, inv: 6.8, phys: 21.5, ap: 3.6,
    own: { Institutional: 68, Insiders: 3, Funds: 19, Public: 10 },
    peers: [
      { n: "Granary Co.", pe: 15.0, ps: 1.3, pb: 2.2, dy: 3.8, g: 7, mc: 38, h: 4.4, pa: 3.6 },
      { n: "PurePantry", pe: 19.5, ps: 2.1, pb: 3.3, dy: 2.2, g: 13, mc: 52, h: 4.0, pa: 4.4 },
      { n: "Mills & Vale", pe: 13.2, ps: 1.0, pb: 1.9, dy: 4.6, g: 4, mc: 12, h: 3.4, pa: 2.9 },
    ],
    desc: "Hartwell Foods is one of the largest US packaged-food and beverage groups, with 14 brands that lead their categories.",
    descLong: "Founded in 1923 and headquartered in Chicago, Hartwell employs ~31,000 people and its products sit in 92% of US households. Pricing power has historically run above food inflation, funding 48 consecutive years of dividend payments plus ongoing buybacks. Growth now comes from premium and health-focused lines and from Latin American expansion, while the core portfolio behaves defensively in recessions.",
    fwdPE: 16.0, divPS: 1.68, exDiv: "Jun 28, 2026",
    fvFactor: 1.07, insiderBias: 0.1, seed: 22, start: 58, trend: 0.0005, vol: 0.012,
  },
  {
    ticker: "ENGD3", name: "Energel Distribuição", sector: "Electric utilities", country: "🇧🇷 Brazil", currency: "BRL",
    mktCap: 34.5, pe: 9.2, sectorPE: 10.5, ps: 1.1, sectorPS: 1.3, evEbitda: 6.2,
    epsGrowth: 4.0, revGrowth: 4.8, forecastG: 4.5,
    divYield: 7.4, debtEq: 1.10, pb: 1.4, roic: 9.5, roe: 13.0, roi: 8.0, netMargin: 12.0,
    revenueM: 31400, grossMargin: 0.28, ebitdaB: 9.3,
    segments: [["Regulated distribution", 0.85], ["Transmission", 0.15]],
    payout: 80, cyclical: false, recovering: false, assetRich: false,
    cash: 4.2, debt: 27.1, ltDebt: 22.4, totalLiab: 35.0, totalAssets: 59.6, equity: 24.6, coverage: 3.4, recv: 6.1, inv: 0.8, phys: 38.0, ap: 3.2,
    own: { Institutional: 38, Insiders: 2, Funds: 30, Public: 30 },
    peers: [
      { n: "LuzSul Energia", pe: 10.8, ps: 1.4, pb: 1.6, dy: 6.2, g: 5, mc: 21, h: 3.0, pa: 3.5 },
      { n: "Transvolt", pe: 8.1, ps: 0.9, pb: 1.2, dy: 8.8, g: 2, mc: 12, h: 2.4, pa: 2.8 },
      { n: "Hidronorte", pe: 11.5, ps: 1.5, pb: 1.7, dy: 5.5, g: 6, mc: 28, h: 3.6, pa: 3.9 },
    ],
    desc: "Energel distributes electricity to 8.4 million customers in southern Brazil under a regulated concession running to 2042.",
    descLong: "About 99% of revenue is regulated, with tariffs reset every four years (next review in 2027) over a regulated asset base of ~R$22B. The dividend policy targets a payout of 75%+, which is why the stock trades on yield rather than growth. Pension funds control ~32% of the company. For USD-based investors, the BRL is a second source of volatility on top of the business itself.",
    fwdPE: 8.8, divPS: 1.78, exDiv: "Jul 15, 2026",
    fvFactor: 1.15, insiderBias: 0, seed: 33, start: 24, trend: 0.0002, vol: 0.009,
  },
  {
    ticker: "IRNL", name: "Ironline Steel", sector: "Steel", country: "🇺🇸 US", currency: "USD",
    mktCap: 18.5, pe: 5.8, sectorPE: 8.0, ps: 0.6, sectorPS: 0.7, evEbitda: 4.0,
    epsGrowth: 9.0, revGrowth: -4.0, forecastG: -7.0,
    divYield: 3.8, debtEq: 0.70, pb: 0.95, roic: 12.0, roe: 15.0, roi: 10.0, netMargin: 8.0,
    revenueM: 30800, grossMargin: 0.18, ebitdaB: 5.5,
    segments: [["Flat steel", 0.70], ["Long steel", 0.30]],
    payout: 30, cyclical: true, recovering: false, assetRich: false,
    cash: 3.1, debt: 6.5, ltDebt: 5.2, totalLiab: 9.8, totalAssets: 19.2, equity: 9.4, coverage: 6, recv: 2.4, inv: 4.6, phys: 7.8, ap: 1.9,
    own: { Institutional: 52, Insiders: 8, Funds: 21, Public: 19 },
    peers: [
      { n: "Atlantic Iron", pe: 7.0, ps: 0.7, pb: 1.0, dy: 3.0, g: -2, mc: 14, h: 3.8, pa: 3.2 },
      { n: "Forgeline", pe: 4.9, ps: 0.5, pb: 0.8, dy: 5.2, g: -9, mc: 7, h: 2.2, pa: 2.6 },
      { n: "Continental Mill", pe: 8.8, ps: 0.9, pb: 1.2, dy: 2.5, g: 0, mc: 22, h: 4.1, pa: 3.7 },
    ],
    phase: {
      kind: "cycle", pos: 0.80, label: "Late cycle — at or near the peak",
      note: "Record margins, rock-bottom P/E, insiders selling and steel prices rolling over: the classic peak signature. For cyclicals, the low P/E at the top is the trap, not the bargain.",
    },
    desc: "Ironline is a US flat- and long-steel producer serving construction and autos, with 9 mills and ~6% domestic market share.",
    descLong: "Founded in 1958 and headquartered in Pittsburgh, Ironline employs ~14,000 people and runs 60% of its capacity on electric-arc furnaces. Results swing with steel spreads: the current downcycle is driven by record Chinese exports and softening construction demand. Note the forward P/E (12.5x) sitting far above the trailing P/E (5.8x) — the market already prices a sharp earnings contraction, the classic signature of a cyclical at the peak.",
    fwdPE: 12.5, divPS: 1.18, exDiv: "Jun 20, 2026",
    fvFactor: 0.90, insiderBias: -0.6, seed: 44, start: 31, trend: -0.0002, vol: 0.026, wave: true,
  },
  {
    ticker: "VARJ3", name: "Varejão S.A.", sector: "Retail", country: "🇧🇷 Brazil", currency: "BRL",
    mktCap: 6.2, pe: 0, sectorPE: 18.0, ps: 0.18, sectorPS: 0.6, evEbitda: 8.0,
    epsGrowth: -15.0, revGrowth: 2.0, forecastG: 14.0,
    divYield: 0, debtEq: 1.9, pb: 1.1, roic: 2.0, roe: -3.0, roi: -2.0, netMargin: -1.8,
    revenueM: 34400, grossMargin: 0.24, ebitdaB: 1.6,
    segments: [["Physical stores", 0.67], ["E-commerce", 0.33]],
    payout: 0, cyclical: false, recovering: true, assetRich: false,
    cash: 1.9, debt: 8.7, ltDebt: 6.1, totalLiab: 11.9, totalAssets: 16.5, equity: 4.6, coverage: 0.8, recv: 2.6, inv: 5.4, phys: 4.8, ap: 2.1,
    own: { Institutional: 25, Insiders: 31, Funds: 14, Public: 30 },
    peers: [
      { n: "MegaLoja", pe: 21.0, ps: 0.8, pb: 2.4, dy: 1.1, g: 9, mc: 18, h: 4.2, pa: 4.0 },
      { n: "Comprafácil", pe: 15.5, ps: 0.5, pb: 1.9, dy: 2.0, g: 6, mc: 9, h: 3.5, pa: 3.3 },
      { n: "Rede Popular", pe: 0, ps: 0.25, pb: 0.9, dy: 0, g: -10, mc: 2.1, h: 1.2, pa: 1.0 },
    ],
    phase: {
      kind: "turnaround", stage: 2, steps: ["Crisis", "Stabilization", "Recovery", "Re-rating"],
      label: "Stage 2 of 4 — Stabilization",
      note: "Debt renegotiated and cash burn down 60% YoY, but the company hasn't reached operating breakeven yet. The move into Stage 3 (recovery: positive operating income) is the catalyst the market is waiting for.",
    },
    desc: "Varejão is a Brazilian general-merchandise retailer with 480 stores and a fast-growing e-commerce arm, in the middle of a turnaround.",
    descLong: "Founded in 1987, Varejão brought in new management in 2025, which has closed 120 loss-making stores and renegotiated R$6.1B of long-term debt out to 2028. E-commerce is growing 40% YoY and already represents 33% of sales. Operating breakeven is targeted for Q3 2026; until then the margin for error is thin (interest coverage of 0.8x). Insiders own 31% and have been net buyers — skin in the game on the recovery.",
    fwdPE: 28.0, divPS: 0, exDiv: null,
    fvFactor: 1.20, insiderBias: 0.8, seed: 55, start: 9, trend: -0.0015, vol: 0.030, recoverTail: true,
  },
  {
    ticker: "TERA", name: "Terra Holdings", sector: "Real estate", country: "🇮🇹 Italy", currency: "EUR",
    mktCap: 4.4, pe: 12.0, sectorPE: 13.0, ps: 1.7, sectorPS: 2.0, evEbitda: 10.0,
    epsGrowth: 5.0, revGrowth: 3.5, forecastG: 6.0,
    divYield: 2.2, debtEq: 0.30, pb: 0.45, roic: 6.0, roe: 7.5, roi: 5.0, netMargin: 14.0,
    revenueM: 2590, grossMargin: 0.55, ebitdaB: 0.49,
    segments: [["Rental income", 0.80], ["Asset sales", 0.20]],
    payout: 30, cyclical: false, recovering: false, assetRich: true,
    cash: 0.8, debt: 1.3, ltDebt: 1.1, totalLiab: 1.8, totalAssets: 6.1, equity: 4.3, coverage: 7, recv: 0.3, inv: 0.1, phys: 4.6, ap: 0.2,
    own: { Institutional: 22, Insiders: 40, Funds: 12, Public: 26 },
    peers: [
      { n: "Urbe Properties", pe: 14.0, ps: 2.2, pb: 0.9, dy: 3.0, g: 4, mc: 3.2, h: 3.9, pa: 3.4 },
      { n: "Solida Immobili", pe: 10.5, ps: 1.5, pb: 0.7, dy: 4.2, g: 2, mc: 1.9, h: 4.3, pa: 3.0 },
      { n: "Patio Capital", pe: 16.8, ps: 2.8, pb: 1.2, dy: 1.5, g: 8, mc: 6.0, h: 3.2, pa: 4.1 },
    ],
    desc: "Terra Holdings owns and rents logistics and commercial properties in northern Italy, trading well below appraised asset value.",
    descLong: "The portfolio has 41 properties at ~85% occupancy, with land still carried at 2009 book values — recent disposals have closed 30%+ above book, which is the heart of the asset-play thesis. Leverage is conservative (LTV ~22%). The founding family controls 40%, historically in no hurry to unlock value; the recent entry of an activist fund with 6% pressing for asset sales and buybacks may finally provide the catalyst.",
    fwdPE: 11.3, divPS: 0.14, exDiv: "Jul 03, 2026",
    fvFactor: 1.55, insiderBias: 0.4, seed: 66, start: 6.4, trend: 0.0001, vol: 0.014,
  },
  {
    ticker: "WRLD", name: "World Equity Index ETF", sector: "Diversified fund", country: "🇺🇸 US", currency: "USD", kind: "etf", er: 0.07,
    mktCap: 12.0, pe: 19.0, sectorPE: 19.0, ps: 2.4, sectorPS: 2.4, evEbitda: 12.0,
    epsGrowth: 9.0, revGrowth: 8.0, forecastG: 8.5,
    divYield: 1.8, debtEq: 0.0, pb: 1.0, roic: 12.0, roe: 14.0, roi: 10.0, netMargin: 11.0,
    revenueM: 280, grossMargin: 0.97, ebitdaB: 0.26,
    segments: [["Equity holdings (2,900 stocks)", 0.98], ["Cash & futures", 0.02]],
    payout: 100, cyclical: false, recovering: false, assetRich: false,
    cash: 0.3, debt: 0.0, ltDebt: 0.0, totalLiab: 0.1, totalAssets: 12.1, equity: 12.0, coverage: 99, recv: 0.05, inv: 0.01, phys: 0.01, ap: 0.05,
    own: { Institutional: 40, Insiders: 0, Funds: 25, Public: 35 },
    peers: [
      { n: "Global Core ETF", pe: 18.5, ps: 2.3, pb: 1.0, dy: 2.0, g: 8, mc: 85, h: 5.5, pa: 4.0 },
      { n: "AllWorld Tracker", pe: 19.4, ps: 2.5, pb: 1.0, dy: 1.7, g: 9, mc: 41, h: 5.5, pa: 4.1 },
      { n: "Mega Index Fund", pe: 20.1, ps: 2.6, pb: 1.1, dy: 1.5, g: 10, mc: 120, h: 5.4, pa: 4.3 },
    ],
    desc: "A passive ETF holding ~2,900 stocks across developed and emerging markets, weighted by market cap — instant global diversification at a 0.07% expense ratio.",
    descLong: "The fund tracks a global all-cap index and rebalances quarterly. Ratios shown (P/E, growth, yield) are look-through figures of the underlying portfolio. There is no single-company risk, no insiders, and no turnaround story — the trade-off is that you also can't beat the market with it. It serves as the diversified core that single-stock picks orbit around.",
    fwdPE: 17.6, divPS: 1.84, exDiv: "Jun 24, 2026",
    fvFactor: 1.0, insiderBias: 0, seed: 77, start: 102, trend: 0.0004, vol: 0.010,
  },
  {
    ticker: "LOGR", name: "LogisticRail REIT", sector: "Industrial REIT", country: "🇺🇸 US", currency: "USD", kind: "reit",
    mktCap: 9.5, pe: 31.0, sectorPE: 33.0, ps: 8.0, sectorPS: 9.0, evEbitda: 16.5,
    epsGrowth: 6.0, revGrowth: 7.0, forecastG: 7.0,
    divYield: 4.3, debtEq: 0.85, pb: 1.6, roic: 7.0, roe: 8.0, roi: 6.0, netMargin: 25.0,
    revenueM: 1180, grossMargin: 0.62, ebitdaB: 0.62,
    segments: [["Warehouse leases", 0.82], ["Rail-adjacent land leases", 0.18]],
    payout: 90, cyclical: false, recovering: false, assetRich: false,
    cash: 0.4, debt: 4.1, ltDebt: 3.8, totalLiab: 5.1, totalAssets: 11.0, equity: 5.9, coverage: 3.8, recv: 0.1, inv: 0.02, phys: 9.8, ap: 0.2,
    own: { Institutional: 58, Insiders: 2, Funds: 25, Public: 15 },
    peers: [
      { n: "Prime Logistics Tr.", pe: 29.0, ps: 7.4, pb: 1.5, dy: 4.6, g: 5, mc: 22, h: 3.4, pa: 3.6 },
      { n: "Coastal Industrial", pe: 35.0, ps: 9.8, pb: 1.9, dy: 3.5, g: 9, mc: 14, h: 3.0, pa: 4.2 },
      { n: "Heartland Storage", pe: 26.5, ps: 6.8, pb: 1.3, dy: 5.2, g: 3, mc: 6, h: 3.7, pa: 3.1 },
    ],
    desc: "A US industrial REIT owning 210 warehouses near rail hubs, leased to e-commerce and logistics tenants on 7-year average contracts.",
    descLong: "As a REIT, LogisticRail must distribute at least 90% of taxable income as dividends — which is why the payout looks 'stretched' by normal-company standards but is structurally required. Occupancy runs at 96% with built-in rent escalators of ~3%/yr. The headline P/E overstates the price for REITs; investors typically use FFO multiples instead (P/FFO ≈ 16x here). Main risks: interest rates (refinancing the 0.85 D/E) and e-commerce capex cycles.",
    fwdPE: 28.0, divPS: 1.92, exDiv: "Jun 25, 2026",
    fvFactor: 1.12, insiderBias: 0.1, seed: 88, start: 44, trend: 0.0003, vol: 0.013,
  },
];

/* ---------- news / social / reports (fictional) ---------- */
const FEED = {
  NVTK: {
    news: [
      { src: "TechWire", t: "2h", title: "Novatek lands 5-year AI infrastructure deal with top-10 bank", s: 1 },
      { src: "MarketDesk", t: "1d", title: "Hyperscaler capex guidance lifts the whole AI-infra cohort", s: 1 },
      { src: "The Ledger", t: "3d", title: "Open-source alternatives start pressuring AI tooling prices", s: -1 },
    ],
    social: [
      { p: "Reddit", c: "r/stocks", u: "u/valuation_nerd", t: "5h", txt: "NVTK thesis: PEG under 1 with 84% recurring revenue. Full DCF in the post, tear it apart.", up: 213, bot: 0.03, s: 1 },
      { p: "X", c: null, u: "@fundamentals_only", t: "9h", txt: "Novatek call: management guided 25%+ growth AND higher margin. Rare in this tape.", up: 891, bot: 0.05, s: 1 },
      { p: "Reddit", c: "r/investing", u: "u/skeptic22", t: "1d", txt: "Everyone loves NVTK but nobody mentions the massive founder vesting cliff in 2027.", up: 156, bot: 0.08, s: -1 },
    ],
    bots: [{ p: "X", u: "@vip_signals", txt: "🚀🚀 NVTK about to EXPLODE! Join the VIP group, link in bio 🚀🚀", bot: 0.97 }],
    reports: [
      { site: "Independent Research", kind: "Report", stance: 1, title: "Novatek: the rare compounder", sum: "Initiating with a quality thesis: 24% ROIC, net cash, expanding TAM. Target implies ~30% upside." },
      { site: "Smallcap Forum", kind: "Forum", stance: 0, title: "Official NVTK thread — pg. 47", sum: "Debate on post-2027 growth and stock-option dilution. Community split between hold and trim." },
    ],
  },
  HWFD: {
    news: [
      { src: "MarketDesk", t: "6h", title: "Hartwell announces $2B buyback program", s: 1 },
      { src: "Reuters", t: "2d", title: "Agricultural input costs ease, lifting staples margins", s: 1 },
    ],
    social: [
      { p: "Reddit", c: "r/dividends", u: "u/buyandholdguy", t: "12h", txt: "HWFD is a textbook stalwart. I buy every 10% dip — hasn't failed in 6 years.", up: 98, bot: 0.04, s: 1 },
      { p: "X", c: null, u: "@dividend_growth", t: "1d", txt: "Buyback + growing dividend at Hartwell. Shareholder-friendly management.", up: 312, bot: 0.06, s: 1 },
    ],
    bots: [{ p: "X", u: "@free_signals", txt: "HWFD buy signal confirmed join the channel", bot: 0.92 }],
    reports: [
      { site: "Fund Letter", kind: "Thesis", stance: 1, title: "Why we've held Hartwell for 8 years", sum: "Structural position: dominant brands, pricing power, disciplined payout. We'd only trim above 20x earnings." },
    ],
  },
  ENGD3: {
    news: [
      { src: "Canal Energia", t: "1d", title: "Energel tariff review approved with 6.2% adjustment", s: 1 },
      { src: "Valor", t: "3d", title: "High local rates keep weighing on Brazilian utilities' debt", s: -1 },
    ],
    social: [
      { p: "Reddit", c: "r/passive_income", u: "u/liveoffyield", t: "8h", txt: "ENGD3 paying 7.4% on a regulated contract. Largest position in my income book — FX risk noted.", up: 167, bot: 0.05, s: 1 },
      { p: "X", c: null, u: "@utilities_analyst", t: "2d", txt: "Watch Energel's 80% payout with D/E above 1. Any extra capex squeezes the dividend.", up: 244, bot: 0.04, s: -1 },
    ],
    bots: [{ p: "X", u: "@yield_bot", txt: "EARN 7% A MONTH with ENGD3, click here", bot: 0.98 }],
    reports: [
      { site: "Dividends Forum", kind: "Forum", stance: 0, title: "ENGD3 — sustainable dividend?", sum: "Recurring debate: does the high yield offset zero growth plus BRL exposure? Veterans cap it at 10% of the book." },
    ],
  },
  IRNL: {
    news: [
      { src: "Reuters", t: "4h", title: "Steel prices fall 8% in the quarter on Chinese slowdown", s: -1 },
      { src: "MetalsDaily", t: "2d", title: "Ironline idles two furnaces as order book softens", s: -1 },
    ],
    social: [
      { p: "Reddit", c: "r/investing", u: "u/cycles_and_value", t: "10h", txt: "Reminder: a steelmaker at 6x earnings isn't cheap, it's at the TOP of the cycle.", up: 421, bot: 0.03, s: -1 },
      { p: "X", c: null, u: "@metals_investor", t: "1d", txt: "Ironline's board has been selling for 3 straight months. Insiders know where the cycle is.", up: 506, bot: 0.07, s: -1 },
    ],
    bots: [{ p: "X", u: "@pump_stocks", txt: "IRNL once in a lifetime bottom buy now", bot: 0.95 }],
    reports: [
      { site: "Independent Research", kind: "Report", stance: -1, title: "Ironline: the peak is behind us", sum: "Downgrade to sell: margins normalizing, global inventories high, insiders trimming. The low P/E is the classic cyclical trap." },
    ],
  },
  VARJ3: {
    news: [
      { src: "Brazil Journal", t: "1h", title: "Varejão renegotiates bank debt, buys 24 months of runway", s: 1 },
      { src: "InfoMoney", t: "1d", title: "New CEO closes 120 loss-making stores in turnaround plan", s: 1 },
    ],
    social: [
      { p: "Reddit", c: "r/wallstreetbets", u: "u/turnaround_hunter", t: "3h", txt: "VARJ3: insiders bought R$18M last quarter. In a turnaround I follow the money of those with information.", up: 689, bot: 0.04, s: 1 },
      { p: "X", c: null, u: "@short_seller", t: "7h", txt: "0.8x interest coverage at Varejão. The turnaround needs to happen FAST or dilution is coming.", up: 433, bot: 0.05, s: -1 },
      { p: "Reddit", c: "r/investing", u: "u/maria_cpa", t: "2d", txt: "Went through the balance sheet: cash burn down 60% YoY. The plan is working but margin for error is zero.", up: 287, bot: 0.02, s: 0 },
    ],
    bots: [
      { p: "X", u: "@rocket_stocks", txt: "VARJ3 next 10x!!! don't miss out link in profile", bot: 0.96 },
      { p: "Reddit", u: "u/new_acct_8812", txt: "varj3 going up big trust me", bot: 0.88 },
    ],
    reports: [
      { site: "Turnarounds Forum", kind: "Forum", stance: 1, title: "VARJ3 — quarterly turnaround tracker", sum: "Community checklist: debt renegotiated ✓, cash burn falling ✓, gross margin rising ✓. Next milestone: operating breakeven in Q3." },
    ],
  },
  TERA: {
    news: [
      { src: "Borsa Notizie", t: "5h", title: "Terra Holdings sells logistics warehouse 35% above book value", s: 1 },
      { src: "MarketDesk", t: "2d", title: "Activist fund builds 6% stake in Terra Holdings", s: 1 },
    ],
    social: [
      { p: "Reddit", c: "r/SecurityAnalysis", u: "u/grahamian", t: "6h", txt: "TERA at 0.45x book with land carried at 2009 values. Textbook asset play — only the catalyst was missing. Now there's an activist.", up: 334, bot: 0.03, s: 1 },
      { p: "X", c: null, u: "@hidden_value", t: "1d", txt: "A 40% controlling holder will have to negotiate with the activist. The thesis finally has a clock.", up: 198, bot: 0.06, s: 1 },
    ],
    bots: [{ p: "X", u: "@stock_tips_eu", txt: "TERA will double, trusted source, share this", bot: 0.93 }],
    reports: [
      { site: "Deep Value Blog", kind: "Thesis", stance: 1, title: "Terra: buying €1 for 45 cents", sum: "Sum-of-the-parts points to fair value 2.2x the screen price. Key risk was a controller in no hurry — the activist changes that game." },
    ],
  },
  WRLD: {
    news: [
      { src: "FundWire", t: "1d", title: "Global index funds take in record monthly inflows", s: 1 },
      { src: "MarketDesk", t: "4d", title: "Concentration debate: top-10 stocks now 24% of world index", s: -1 },
    ],
    social: [
      { p: "Reddit", c: "r/Bogleheads", u: "u/stay_the_course", t: "9h", txt: "WRLD at 0.07% expense ratio is the whole game. Everything else in my book is a satellite bet.", up: 540, bot: 0.02, s: 1 },
      { p: "X", c: null, u: "@indexology", t: "2d", txt: "Reminder: the index quietly replaced 38 holdings this quarter. You did nothing and got the upgrade for free.", up: 310, bot: 0.05, s: 1 },
    ],
    bots: [{ p: "X", u: "@etf_pump", txt: "WRLD secret leverage trick click here", bot: 0.96 }],
    reports: [
      { site: "Fund Research Desk", kind: "Report", stance: 1, title: "Core holding review: WRLD", sum: "Tightest tracking error in its class, deep liquidity, securities-lending revenue offsets part of the fee. The default core." },
    ],
  },
  LOGR: {
    news: [
      { src: "REIT Daily", t: "7h", title: "LogisticRail signs 12-year lease with major parcel carrier", s: 1 },
      { src: "MarketDesk", t: "3d", title: "Industrial REITs slip as 10-year yield ticks higher", s: -1 },
    ],
    social: [
      { p: "Reddit", c: "r/dividends", u: "u/income_engineer", t: "11h", txt: "LOGR: 4.3% yield, 96% occupancy, 3% escalators. P/FFO of 16 is fair for rail-adjacent moats.", up: 220, bot: 0.03, s: 1 },
      { p: "X", c: null, u: "@reit_skeptic", t: "1d", txt: "Watch LOGR's 2027 maturity wall. Refinancing 0.85 D/E at today's rates eats two years of dividend growth.", up: 184, bot: 0.04, s: -1 },
    ],
    bots: [{ p: "X", u: "@yield_hunter_bot", txt: "LOGR 12% yield strategy DM me", bot: 0.97 }],
    reports: [
      { site: "Property Research Co.", kind: "Report", stance: 1, title: "LogisticRail: the rail moat is real", sum: "Assets within 2km of intermodal hubs command 18% rent premiums. Buy under P/FFO 15, hold to 18." },
    ],
  },
};

/* ---------- deterministic generators ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function genSeries(s) {
  const rnd = mulberry32(s.seed);
  const n = 1300, out = []; // ~5 years of sessions
  let p = s.start * Math.exp(-s.trend * 1020); // calibrate so the latest price lands near the intended level
  const today = new Date();
  for (let i = 0; i < n; i++) {
    let drift = s.trend;
    if (s.wave) drift += Math.sin(i / 28) * 0.004;
    if (s.recoverTail && i > n - 70) drift = 0.0045;
    p = Math.max(0.5, p * (1 + drift + (rnd() - 0.5) * 2 * s.vol));
    const ret = drift + (rnd() - 0.5) * 2 * s.vol;
    const baseV = 1.5 + s.mktCap / 5; // millions of shares
    const v = +(baseV * (0.55 + rnd() * 0.9) * (1 + Math.abs(ret) * 28)).toFixed(1);
    const d = new Date(today); d.setDate(d.getDate() - Math.round((n - i) * 1.45));
    out.push({
      i, ts: d.getTime(),
      date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      dLong: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      close: +p.toFixed(2), v,
    });
  }
  return out;
}
/* intraday walks for the 1D / 5D views of the live chart */
function genIntraday(s, base) {
  const rnd = mulberry32(s.seed * 41);
  const mk = (npts, lbl) => {
    let p = base * (1 - (rnd() - 0.5) * 0.012);
    const a = [];
    for (let i = 0; i < npts; i++) {
      p = Math.max(0.5, p * (1 + (rnd() - 0.5) * 0.004));
      a.push({ l: lbl(i), p: +p.toFixed(2) });
    }
    a[a.length - 1].p = base;
    return a;
  };
  const d1 = mk(78, (i) => {
    const m = 570 + i * 5, h = Math.floor(m / 60), mm = m % 60;
    return `${h}:${mm.toString().padStart(2, "0")}`;
  });
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const d5 = mk(65, (i) => `${days[Math.floor(i / 13)]} ${10 + Math.floor((i % 13) / 2)}h`);
  return { d1, d5 };
}
/* 10y revenue / earnings / FCF history (local millions) + 5y div & debt */
function genAnnual(s) {
  const rnd = mulberry32(s.seed * 7);
  const years10 = Array.from({ length: 10 }, (_, i) => 2016 + i);
  const g = s.revGrowth / 100;
  const hist = years10.map((y, i) => {
    const back = 9 - i;
    let rev = s.revenueM / Math.pow(1 + Math.max(g, -0.05), back);
    rev *= 1 + (rnd() - 0.5) * 0.08;
    let margin = s.netMargin / 100;
    if (s.recovering) margin = i < 6 ? 0.03 : i < 8 ? -0.06 : -0.018; // crisis then stabilizing
    if (s.wave) margin = (s.netMargin / 100) * (0.4 + 0.8 * (Math.sin(i * 1.1) * 0.5 + 0.5));
    const earn = rev * margin * (1 + (rnd() - 0.5) * 0.2);
    const fcf = earn * (1.1 + (rnd() - 0.5) * 0.5) + rev * 0.005;
    return { y: String(y), rev: +rev.toFixed(0), earn: +earn.toFixed(0), fcf: +fcf.toFixed(0) };
  });
  const years5 = years10.slice(5);
  const divHist = years5.map((y, i) => ({ y: y.y ?? String(y), yield: +(Math.max(0, s.divYield + (rnd() - 0.5) * 1.2 - (s.recovering && i > 1 ? s.divYield : 0))).toFixed(1) }));
  const debtHist = years5.map((y, i) => ({ y: String(y), de: +(Math.max(0.05, s.debtEq * (1 + (2 - i) * 0.08 + (rnd() - 0.5) * 0.06))).toFixed(2) }));
  let f = hist[hist.length - 1].earn;
  const fut = [2026, 2027, 2028].map((y) => { f = f * (1 + s.forecastG / 100); return { y: String(y), proj: +f.toFixed(0) }; });
  return { hist, divHist, debtHist, fut };
}
/* 5y monthly P/E history */
function genPEHist(s) {
  const rnd = mulberry32(s.seed * 17);
  const out = [];
  let pe = Math.max(4, (s.pe > 0 ? s.pe : 15) * (0.8 + rnd() * 0.6));
  for (let i = 0; i < 60; i++) {
    pe = Math.max(3, pe * (1 + (rnd() - 0.5) * 0.09 + ((s.pe > 0 ? s.pe : 15) - pe) * 0.012));
    const d = new Date(); d.setMonth(d.getMonth() - (60 - i));
    out.push({ d: d.toLocaleDateString("en-US", { year: "2-digit", month: "short" }), pe: +pe.toFixed(1) });
  }
  if (s.pe > 0) out[out.length - 1].pe = s.pe;
  return out;
}
/* P/E distribution of the industry (mock histogram) */
function genPEDist(s) {
  const rnd = mulberry32(s.seed * 23);
  const buckets = ["0–10", "10–20", "20–30", "30–40", "40–50", "50–60", "60–80", "80–100", "100+"];
  const mids = [5, 15, 25, 35, 45, 55, 70, 90, 110];
  const counts = buckets.map((_, i) => Math.max(1, Math.round((30 - i * 3) * (0.6 + rnd() * 0.8))));
  const myBucket = s.pe <= 0 ? -1 : mids.findIndex((m, i) => s.pe < (i === mids.length - 1 ? 1e9 : [10, 20, 30, 40, 50, 60, 80, 100][i]));
  return buckets.map((b, i) => ({ b, count: counts[i], mine: i === myBucket }));
}
const INSIDER_NAMES = [["R. Albuquerque", "CEO"], ["M. Tavares", "CFO"], ["L. Hoffmann", "Board"], ["P. Siqueira", "COO"], ["A. Nakamura", "Board"], ["C. Furtado", "VP Sales"]];
function genInsiders(s, lastClose) {
  const rnd = mulberry32(s.seed * 13);
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const flow = months.map((m) => ({ m, net: +(((rnd() - 0.5) + s.insiderBias * 0.55) * 9).toFixed(1) }));
  const tx = [];
  for (let i = 0; i < 6; i++) {
    const [who, role] = INSIDER_NAMES[Math.floor(rnd() * INSIDER_NAMES.length)];
    const buy = rnd() < 0.5 + s.insiderBias * 0.42;
    const qty = Math.floor(5 + rnd() * 120) * 1000;
    const px = +(lastClose * (0.86 + rnd() * 0.22)).toFixed(2);
    const daysAgo = Math.floor(rnd() * 90) + 1;
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    tx.push({ who, role, buy, qty, px, totalLocal: (qty * px) / 1e6, date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }), daysAgo });
  }
  tx.sort((a, b) => a.daysAgo - b.daysAgo);
  const net3m = tx.reduce((a, t) => a + (t.buy ? t.totalLocal : -t.totalLocal), 0);
  const prev3m = -net3m * (rnd() < 0.35 ? 0.6 : -0.4); // mock previous quarter for flip detection
  return { flow, tx, net3m, prev3m };
}

/* ---------- technicals ---------- */
const smaArr = (v, n) => v.map((_, i) => (i < n - 1 ? null : +(v.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n).toFixed(2)));
function emaArr(v, n) { const k = 2 / (n + 1); let prev = v[0]; return v.map((x, i) => (prev = i === 0 ? x : x * k + prev * (1 - k))); }
function rsiArr(v, n = 14) {
  const out = new Array(v.length).fill(null);
  let g = 0, l = 0;
  for (let i = 1; i <= n; i++) { const d = v[i] - v[i - 1]; if (d >= 0) g += d; else l -= d; }
  g /= n; l /= n;
  out[n] = 100 - 100 / (1 + (l === 0 ? 100 : g / l));
  for (let i = n + 1; i < v.length; i++) {
    const d = v[i] - v[i - 1];
    g = (g * (n - 1) + Math.max(d, 0)) / n;
    l = (l * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = +(100 - 100 / (1 + (l === 0 ? 100 : g / l))).toFixed(1);
  }
  return out;
}
function buildTech(series) {
  const closes = series.map((d) => d.close);
  const sma50 = smaArr(closes, 50), sma200 = smaArr(closes, 200), rsi = rsiArr(closes);
  const e12 = emaArr(closes, 12), e26 = emaArr(closes, 26);
  const macd = e12.map((v, i) => v - e26[i]);
  const sig = emaArr(macd, 9);
  const data = series.map((d, i) => ({
    ...d, sma50: sma50[i], sma200: sma200[i], rsi: rsi[i],
    macd: +macd[i].toFixed(3), signal: +sig[i].toFixed(3), hist: +(macd[i] - sig[i]).toFixed(3),
  }));
  const last = data[data.length - 1];
  const win = closes.slice(-60);
  const support = +Math.min(...win).toFixed(2), resistance = +Math.max(...win).toFixed(2);
  const w52 = closes.slice(-252);
  const w52lo = +Math.min(...w52).toFixed(2), w52hi = +Math.max(...w52).toFixed(2);
  const lastV = series[series.length - 1].v;
  const avgV = +(series.slice(-66).reduce((a, d) => a + d.v, 0) / 66).toFixed(1);
  let goldenCross = false, deathCross = false, crossAge = null;
  for (let i = data.length - 30; i < data.length; i++) {
    const a = data[i - 1], b = data[i];
    if (a?.sma50 && a?.sma200 && b?.sma50 && b?.sma200) {
      if (a.sma50 <= a.sma200 && b.sma50 > b.sma200) { goldenCross = true; crossAge = data.length - 1 - i; }
      if (a.sma50 >= a.sma200 && b.sma50 < b.sma200) { deathCross = true; crossAge = data.length - 1 - i; }
    }
  }
  /* sma200 crossing by price in last 15 sessions (for alerts) */
  let priceCross200 = 0;
  for (let i = data.length - 15; i < data.length; i++) {
    const a = data[i - 1], b = data[i];
    if (a?.sma200 && b?.sma200) {
      if (a.close <= a.sma200 && b.close > b.sma200) priceCross200 = 1;
      if (a.close >= a.sma200 && b.close < b.sma200) priceCross200 = -1;
    }
  }
  const aboveSma200 = last.sma200 ? last.close > last.sma200 : null;
  const trendUp = last.sma50 && last.sma200 ? last.sma50 > last.sma200 : null;
  const macdUp = last.macd > last.signal;
  const nearSupport = last.close <= support * 1.04;
  const nearResistance = last.close >= resistance * 0.97;

  /* ---- v2: trend quality, regime, momentum, volume confirmation ---- */
  // % gaps — differentiate a weak fresh cross from an established trend
  const gapMAs = last.sma50 && last.sma200 ? +(((last.sma50 / last.sma200) - 1) * 100).toFixed(1) : null;
  const gapPx200 = last.sma200 ? +(((last.close / last.sma200) - 1) * 100).toFixed(1) : null;
  const gapPx50 = last.sma50 ? +(((last.close / last.sma50) - 1) * 100).toFixed(1) : null;
  // 60-session slopes — a positive cross can persist while the trend is already fading
  const slp = (arr, n = 60) => {
    const a = arr[arr.length - 1], b = arr[arr.length - 1 - n];
    return a != null && b != null && b !== 0 ? +(((a / b) - 1) * 100).toFixed(1) : null;
  };
  const slope50 = data.length > 61 ? slp(sma50) : null;
  const slope200 = data.length > 61 ? slp(sma200) : null;
  // regime — Kaufman Efficiency Ratio over 20 sessions (close-only ADX proxy):
  // net displacement ÷ sum of absolute daily moves. ~1 = clean trend, ~0 = chop.
  let er = null;
  if (closes.length > 21) {
    const w20 = closes.slice(-21);
    let path = 0;
    for (let i = 1; i < w20.length; i++) path += Math.abs(w20[i] - w20[i - 1]);
    er = path > 0 ? +(Math.abs(w20[w20.length - 1] - w20[0]) / path).toFixed(2) : 0;
  }
  const regime = er == null ? null : er >= 0.4 ? "trend" : er >= 0.25 ? "transition" : "range";

  /* ---- ATR(14): Wilder true range when High/Low exist; close-to-close proxy otherwise ----
     the proxy slightly underestimates gappy stocks, but keeps every feature working
     until the collector backfills high/low */
  const hasHL = series.length > 30 && series.slice(-30).every((d) => d.hi != null && d.lo != null);
  let atr = null;
  {
    const w = series.slice(-15);
    if (w.length === 15) {
      let sum = 0, cnt = 0;
      for (let i = 1; i < w.length; i++) {
        const pc = w[i - 1].close;
        const tr = hasHL
          ? Math.max(w[i].hi - w[i].lo, Math.abs(w[i].hi - pc), Math.abs(w[i].lo - pc))
          : Math.abs(w[i].close - pc);
        sum += tr; cnt++;
      }
      if (cnt > 0) atr = +(sum / cnt).toFixed(4);
    }
  }
  const atrPct = atr && last.close > 0 ? +((atr / last.close) * 100).toFixed(1) : null;

  /* ---- ADX(14): the real thing, only when High/Low are in the data ---- */
  let adx = null;
  if (hasHL && series.length > 45) {
    const w = series.slice(-45);
    let trS = 0, pS = 0, mS = 0, dxs = [];
    for (let i = 1; i < w.length; i++) {
      const up = w[i].hi - w[i - 1].hi, dn = w[i - 1].lo - w[i].lo;
      const pDM = up > dn && up > 0 ? up : 0, mDM = dn > up && dn > 0 ? dn : 0;
      const tr = Math.max(w[i].hi - w[i].lo, Math.abs(w[i].hi - w[i - 1].close), Math.abs(w[i].lo - w[i - 1].close));
      if (i <= 14) { trS += tr; pS += pDM; mS += mDM; }
      else {
        trS = trS - trS / 14 + tr; pS = pS - pS / 14 + pDM; mS = mS - mS / 14 + mDM; // Wilder smoothing
        const pDI = trS > 0 ? (pS / trS) * 100 : 0, mDI = trS > 0 ? (mS / trS) * 100 : 0;
        if (pDI + mDI > 0) dxs.push((Math.abs(pDI - mDI) / (pDI + mDI)) * 100);
      }
    }
    if (dxs.length >= 14) adx = Math.round(dxs.slice(-14).reduce((a, b) => a + b, 0) / 14);
  }
  // when the real ADX exists, it decides the regime (>25 trend, 20–25 transition, <20 range)
  const regime2 = adx != null ? (adx > 25 ? "trend" : adx >= 20 ? "transition" : "range") : regime;

  /* ---- support/resistance as ZONES (level ± 0.6×ATR) + automatic Risk/Reward ---- */
  const zoneW = atr ? atr * 0.6 : last.close * 0.01;
  const supZone = [Math.max(0, support - zoneW), support + zoneW];
  // at all-time/period highs the raw resistance ≈ price and R/R degenerates,
  // so project the next resistance one ATR above the breakout level
  const atHighs = last.close >= resistance * 0.99;
  const resLevel = atHighs && atr ? resistance + atr : resistance;
  const resZone = [resLevel - zoneW, resLevel + zoneW];
  const upside = resZone[1] - last.close;
  const downside = last.close - supZone[0];
  const rr = downside > 0 && upside > 0 ? +(upside / downside).toFixed(1) : null;

  const mom121 = closes.length >= 252
    ? +(((closes[closes.length - 22] / closes[closes.length - 252]) - 1) * 100).toFixed(1)
    : null;
  // volume vs its own 20-day average — breakouts without volume are less reliable
  const avgV20 = +(series.slice(-20).reduce((a, d) => a + d.v, 0) / Math.min(20, series.length)).toFixed(2);
  const volRatio = avgV20 > 0 ? +(lastV / avgV20).toFixed(2) : null;
  const dayUp = series.length > 1 ? series[series.length - 1].close >= series[series.length - 2].close : true;

  /* ---- RSI divergence: price makes a higher high but RSI makes a lower high (bearish),
     or lower low with higher RSI (bullish) — trend losing force before the MAs notice ---- */
  let divergence = null; // "bear" | "bull" | null
  {
    const w = data.slice(-90).filter((d) => d.rsi != null);
    const hiP = [], loP = [];
    for (let i = 5; i < w.length - 5; i++) {
      const seg = w.slice(i - 5, i + 6);
      if (w[i].close === Math.max(...seg.map((x) => x.close))) hiP.push(w[i]);
      if (w[i].close === Math.min(...seg.map((x) => x.close))) loP.push(w[i]);
    }
    const recent = (p) => p.i >= data[data.length - 1].i - 20; // pivot must be fresh to be actionable
    if (hiP.length >= 2) {
      const [a, b] = hiP.slice(-2);
      if (recent(b) && b.close > a.close * 1.01 && b.rsi < a.rsi - 3) divergence = "bear";
    }
    if (divergence == null && loP.length >= 2) {
      const [a, b] = loP.slice(-2);
      if (recent(b) && b.close < a.close * 0.99 && b.rsi > a.rsi + 3) divergence = "bull";
    }
  }

  /* ---- stretch percentile: how extended is price vs its SMA200 compared with its own history? ---- */
  let stretchPct = null;
  if (gapPx200 != null) {
    const gaps = [];
    for (let i = 200; i < closes.length; i++) if (sma200[i]) gaps.push(closes[i] / sma200[i] - 1);
    if (gaps.length > 120) {
      const cur = last.close / last.sma200 - 1;
      stretchPct = Math.round((gaps.filter((g) => g < cur).length / gaps.length) * 100);
    }
  }

  /* ---- Trend Score (0–100): direction + quality + strength of the primary trend ---- */
  let trendScore = 0;
  if (trendUp) trendScore += 25; else if (trendUp === false) trendScore -= 5;
  if (gapMAs != null && gapMAs > 0) trendScore += Math.min(10, gapMAs * 1.5);          // consolidated > fresh cross
  if (aboveSma200) trendScore += 15;
  if (gapPx200 != null && gapPx200 > 0) trendScore += Math.min(5, gapPx200 * 0.5);
  if (slope200 != null && slope200 > 0) trendScore += 10;
  if (slope50 != null && slope50 > 0) trendScore += 10;
  if (mom121 != null) trendScore += mom121 > 0 ? 15 : -5;
  if (regime2 === "trend" && (gapMAs == null || gapMAs >= 0)) trendScore += 10;
  else if (regime2 === "range") trendScore -= 5;
  trendScore = Math.round(Math.max(0, Math.min(100, trendScore)));

  /* ---- Entry Score (0–100): is *now* a good moment inside that trend? ---- */
  let entryScore = 50;
  if (last.rsi !== null) {
    if (last.rsi < 30) entryScore += 25; else if (last.rsi < 45) entryScore += 12;
    else if (last.rsi > 70) entryScore -= 25; else if (last.rsi > 60) entryScore -= 10;
  }
  entryScore += macdUp ? 10 : -10;
  if (nearSupport && trendUp) entryScore += 15;
  if (nearResistance && !atHighs) entryScore -= 15;
  if (gapPx50 != null && gapPx50 > 12) entryScore -= 10;                               // extended above SMA50
  if (volRatio != null && volRatio >= 1.5) entryScore += dayUp ? 8 : -8;               // volume confirms the move
  if (regime2 === "range") entryScore -= 8;                                            // MA signals whipsaw in chop
  if (rr != null) { if (rr >= 2) entryScore += 8; else if (rr < 0.8) entryScore -= 8; } // reward vs risk to the zones
  if (divergence === "bear") entryScore -= 10; else if (divergence === "bull") entryScore += 10;
  if (stretchPct != null) { if (stretchPct >= 90) entryScore -= 6; else if (stretchPct <= 15 && trendUp) entryScore += 6; }
  entryScore = Math.round(Math.max(0, Math.min(100, entryScore)));

  /* composite kept for the dial / snowflake momentum axis (−100…+100) */
  const score = Math.round((trendScore * 0.6 + entryScore * 0.4) * 2 - 100);
  const zone = trendScore >= 55 && entryScore >= 45 && regime2 !== "range" ? "BUY ZONE"
    : trendScore <= 30 ? "EXIT ZONE" : "WAIT";
  return {
    data, last, support, resistance, score, zone, w52lo, w52hi, lastV, avgV,
    trendScore, entryScore, regime: regime2, er, adx, atr, atrPct, hasHL, supZone, resZone, rr, atHighs, divergence, stretchPct,
    gapMAs, gapPx200, gapPx50, slope50, slope200, mom121, avgV20, volRatio, dayUp,
    flags: { trendUp, aboveSma200, macdUp, goldenCross, deathCross, crossAge, priceCross200, nearSupport, nearResistance, rsi: last.rsi },
  };
}

/* ---------- backtest engine (shared by the Backtest tab and the per-ticker card) ----------
   ds = array of price series (each an array of {close}), already windowed.
   Both rules pay a 0.1% cost per trade. Rules:
     classic — daily: hold while SMA50 > SMA200 AND price > SMA200
     v2      — weekly regime-filtered entries; daily exits with a buffer that
               scales with each stock's own volatility (1%–3%)                    */
function btEngine(ds, rule) {
  const COST = 0.001;
  const n = Math.min(...ds.map((d) => d.length));
  if (!isFinite(n) || n <= 240) return null;
  ds = ds.map((d) => d.slice(-n));
  const pre = ds.map((d) => {
    const ps = new Float64Array(d.length + 1), pa = new Float64Array(d.length + 1);
    for (let i = 0; i < d.length; i++) {
      ps[i + 1] = ps[i] + d[i].close;
      pa[i + 1] = pa[i] + (i > 0 ? Math.abs(d[i].close - d[i - 1].close) : 0);
    }
    return { ps, pa };
  });
  const smaOf = (si, nn, i) => (i < nn - 1 ? null : (pre[si].ps[i + 1] - pre[si].ps[i + 1 - nn]) / nn);
  const erOf = (si, i) => {
    if (i < 20) return null;
    const path = pre[si].pa[i + 1] - pre[si].pa[i + 1 - 20];
    return path > 0 ? Math.abs(ds[si][i].close - ds[si][i - 20].close) / path : 0;
  };
  const hold = ds.map(() => false);
  let trades = 0, heldDays = 0, totDays = 0;
  let st = 100, bh = 100, pkS = 100, pkB = 100, ddS = 0, ddB = 0; const curve = [];
  for (let i = 210; i < n; i++) {
    let sr = 0, br = 0;
    ds.forEach((d, si) => {
      const ret = d[i].close / d[i - 1].close - 1;
      let cost = 0;
      const a50 = smaOf(si, 50, i - 1), a200 = smaOf(si, 200, i - 1);
      if (rule === "classic") {
        const on = !!(a50 && a200 && a50 > a200 && d[i - 1].close > a200);
        if (on !== hold[si]) { cost = COST; if (on) trades++; }
        hold[si] = on;
      } else if (a50 && a200) {
        if (hold[si]) { // exits checked every day — buffer scales with each stock's own volatility
          const meanAbs = (pre[si].pa[i] - pre[si].pa[i - 14]) / 14;
          const buf = Math.min(0.03, Math.max(0.01, (0.6 * meanAbs) / d[i - 1].close));
          if (d[i - 1].close < a200 * (1 - buf) || a50 < a200 * 0.995) { hold[si] = false; cost = COST; }
        } else if ((i - 210) % 5 === 0) { // entries confirmed weekly, never in a ranging regime
          const e = erOf(si, i - 1);
          if (a50 > a200 && d[i - 1].close > a200 && (e == null || e >= 0.25)) { hold[si] = true; trades++; cost = COST; }
        }
      }
      if (hold[si]) { sr += ret; heldDays++; }
      sr -= cost;
      br += ret; totDays++;
    });
    st *= 1 + sr / ds.length; bh *= 1 + br / ds.length;
    pkS = Math.max(pkS, st); ddS = Math.max(ddS, 1 - st / pkS);
    pkB = Math.max(pkB, bh); ddB = Math.max(ddB, 1 - bh / pkB);
    if (i % 6 === 0) curve.push({ d: ds[0][i].dLong, Strategy: +st.toFixed(1), "Buy & hold": +bh.toFixed(1) });
  }
  return {
    curve, stTot: st - 100, bhTot: bh - 100, ddS: ddS * 100, ddB: ddB * 100, count: ds.length,
    trades, timePct: totDays > 0 ? (heldDays / totDays) * 100 : 0,
    effS: ddS > 0.005 ? (st - 100) / (ddS * 100) : null,
    effB: ddB > 0.005 ? (bh - 100) / (ddB * 100) : null,
    years: +((n - 210) / 252).toFixed(1),
  };
}

/* ---------- alerts: significant changes in fundamentals & technicals ---------- */
function genAlerts(s, tech, annual, insiders) {
  const A = [];
  const F = tech.flags;
  // technical
  if (F.goldenCross) A.push({ kind: "Technical", dir: 1, txt: `Golden cross formed ${F.crossAge} sessions ago — SMA50 crossed above SMA200.` });
  if (F.deathCross) A.push({ kind: "Technical", dir: -1, txt: `Death cross formed ${F.crossAge} sessions ago — SMA50 crossed below SMA200.` });
  if (F.priceCross200 === 1) A.push({ kind: "Technical", dir: 1, txt: "Price reclaimed the 200-day average within the last 15 sessions." });
  if (F.priceCross200 === -1) A.push({ kind: "Technical", dir: -1, txt: "Price lost the 200-day average within the last 15 sessions." });
  if (F.rsi !== null && F.rsi > 70) A.push({ kind: "Technical", dir: -1, txt: `RSI entered overbought territory (${F.rsi}).` });
  if (F.rsi !== null && F.rsi < 30) A.push({ kind: "Technical", dir: 1, txt: `RSI entered oversold territory (${F.rsi}).` });
  if (F.nearResistance) A.push({ kind: "Technical", dir: 0, txt: "Price testing the 60-session resistance — watch for a breakout or rejection." });
  if (F.nearSupport) A.push({ kind: "Technical", dir: 0, txt: "Price testing the 60-session support — a break would invalidate the level." });
  // fundamental
  const h = annual.hist;
  const e0 = h[h.length - 2].earn, e1 = h[h.length - 1].earn;
  if (e0 !== 0) {
    const chg = ((e1 - e0) / Math.abs(e0)) * 100;
    if (chg <= -25) A.push({ kind: "Fundamental", dir: -1, txt: `Earnings fell ${Math.abs(chg).toFixed(0)}% in the latest fiscal year.` });
    if (chg >= 25) A.push({ kind: "Fundamental", dir: 1, txt: `Earnings jumped ${chg.toFixed(0)}% in the latest fiscal year.` });
  }
  const d = annual.debtHist;
  const dChg = (d[d.length - 1].de - d[0].de) / d[0].de;
  if (dChg <= -0.2) A.push({ kind: "Fundamental", dir: 1, txt: `Debt/equity reduced ${Math.abs(dChg * 100).toFixed(0)}% over 5 years (${d[0].de} → ${d[d.length - 1].de}).` });
  if (dChg >= 0.25) A.push({ kind: "Fundamental", dir: -1, txt: `Debt/equity rose ${(dChg * 100).toFixed(0)}% over 5 years (${d[0].de} → ${d[d.length - 1].de}).` });
  const dv = annual.divHist;
  if (dv[dv.length - 2]?.yield > 0 && dv[dv.length - 1].yield === 0) A.push({ kind: "Fundamental", dir: -1, txt: "Dividend suspended in the latest year." });
  if (s.coverage < 1.5) A.push({ kind: "Fundamental", dir: -1, txt: `Interest coverage at ${s.coverage}x — operating income barely covers interest.` });
  if (insiders.net3m > 0 && insiders.prev3m < 0) A.push({ kind: "Fundamental", dir: 1, txt: "Insider net flow flipped from selling to buying this quarter." });
  if (insiders.net3m < 0 && insiders.prev3m > 0) A.push({ kind: "Fundamental", dir: -1, txt: "Insider net flow flipped from buying to selling this quarter." });
  if (s.forecastG < 0) A.push({ kind: "Fundamental", dir: -1, txt: `Consensus now projects earnings contraction (${s.forecastG}%/yr).` });
  return A;
}

/* ---------- options (mock) ---------- */
function genOptions(s, price, tech) {
  const rnd = mulberry32(s.seed * 31);
  const iv = Math.round(s.vol * Math.sqrt(252) * 100 * (s.recovering ? 1.45 : s.wave ? 1.2 : 1));
  const ivRank = Math.min(98, Math.max(5, Math.round(50 + s.insiderBias * -10 + (rnd() - 0.5) * 50 + (s.recovering ? 25 : 0))));
  const t = 30 / 365;
  const sd = price * (iv / 100) * Math.sqrt(t);
  const pc = +Math.min(1.6, Math.max(0.4, 0.85 - tech.score / 220 + (rnd() - 0.5) * 0.15)).toFixed(2);
  const step = price > 100 ? 5 : price > 40 ? 2.5 : price > 15 ? 1 : 0.5;
  const atm = Math.round(price / step) * step;
  const strikes = [-2, -1, 0, 1, 2].map((m) => {
    const K = +(atm + m * step).toFixed(2);
    const timeVal = sd * 0.42 * Math.exp(-Math.abs(K - price) / (sd * 1.15));
    return {
      K, call: +(Math.max(price - K, 0) + timeVal).toFixed(2), put: +(Math.max(K - price, 0) + timeVal).toFixed(2),
      callOI: Math.floor(800 + rnd() * 9000), putOI: Math.floor(800 + rnd() * 9000), atm: m === 0,
    };
  });
  const maxPain = strikes.reduce((a, b) => (b.callOI + b.putOI > a.callOI + a.putOI ? b : a)).K;
  return { iv, ivRank, expMove: sd, pc, strikes, maxPain, atm, step };
}
function optionStrategies(zone, ivRank, supportK, resistK, atm, sym) {
  const f = (v) => `${sym}${v}`;
  if (zone === "BUY ZONE") return [
    { name: "Cash-secured put", tag: "income + entry", det: `Sell the ${f(supportK)} put, 30–45 days out. You collect premium now and, if assigned, you buy the stock at your own technical support level — getting paid to place a limit order.` },
    { name: "Bull call spread", tag: "defined risk", det: `Buy the ${f(atm)} call, sell the ${f(resistK)} call. A capped-risk bet that price travels toward resistance${ivRank > 60 ? "; the short leg also offsets rich IV" : ""}.` },
  ];
  if (zone === "EXIT ZONE") return [
    { name: "Covered call", tag: "for holders", det: `Own the shares? Sell the ${f(resistK)} call, 30 days out. You're paid to do what the technical read suggests anyway — exit near resistance.` },
    { name: "Protective put", tag: "insurance", det: `Buy the ${f(supportK)} put to floor your downside while you decide${ivRank > 60 ? " — IV makes it pricey, consider a collar instead" : ""}.` },
  ];
  return ivRank > 55
    ? [
        { name: "Iron condor", tag: "range play", det: `Sell premium between support and resistance: short the ${f(supportK)} put and ${f(resistK)} call, buy wings beyond. A WAIT zone with rich IV (rank ${ivRank}) is when selling range-bound premium pays.` },
        { name: "Wait in cash", tag: "no trade", det: "Doing nothing is a position. Let price approach support or break resistance before committing capital." },
      ]
    : [
        { name: "Calendar spread", tag: "cheap optionality", det: `IV rank is low (${ivRank}) — options are cheap. Buy longer-dated ${f(atm)} options, sell short-dated against them, and own optionality while the WAIT resolves.` },
        { name: "Wait in cash", tag: "no trade", det: "Doing nothing is a position. Let price approach support or break resistance before committing capital." },
      ];
}

/* ---------- PEG (corrected, neutral explanation) ---------- */
function pegInfo(s) {
  const peg = s.pe > 0 && s.epsGrowth > 0 ? +(s.pe / s.epsGrowth).toFixed(2) : null;
  const denom = (s.epsGrowth > 0 ? s.epsGrowth : 0) + s.divYield;
  const pegy = s.pe > 0 && denom > 0 ? +(s.pe / denom).toFixed(2) : null;
  let band, color;
  if (peg === null) { band = "Not applicable (negative earnings or growth)"; color = C.dim; }
  else if (peg < 0.5) { band = "Growth heavily underpriced"; color = C.up; }
  else if (peg < 1) { band = "Cheap relative to growth (PEG < 1)"; color = C.up; }
  else if (peg <= 1.5) { band = "Growth fairly priced"; color = C.warn; }
  else if (peg <= 2) { band = "Paying up for growth"; color = C.down; }
  else { band = "Expensive relative to growth"; color = C.down; }
  return { peg, pegy, band, color };
}
const calcPeg = (pe, g) => (pe > 0 && g > 0 ? +(pe / g).toFixed(2) : null);

/* ---------- glossary: short explanation for every clickable metric ---------- */
const GLOSSARY = {
  en: {
    "Revenue": "Total sales over the last twelve months, before any costs are deducted.",
    "EBITDA": "Earnings before interest, taxes, depreciation and amortization — a proxy for how much operating cash the business generates.",
    "EBITDA margin": "EBITDA as a percentage of revenue: how much of each sale turns into operating cash.",
    "ROI": "Return on investment — profit generated per unit of total capital invested in the business.",
    "ROIC": "Return on invested capital — like ROI, but counting only capital tied to operations. Above ~12% usually beats the cost of capital, which is where value is created.",
    "ROE": "Net income divided by shareholders' equity: the return generated on the owners' money.",
    "Net margin": "Net income as a percentage of revenue — what's left after every cost, tax and interest payment.",
    "EV/EBITDA": "Enterprise value (market cap + net debt) over EBITDA. A valuation multiple that is neutral to how much debt the company carries.",
    "P/S": "Price-to-sales: market cap divided by revenue. Most useful when earnings are negative or noisy.",
    "Forward P/E": "Price over NEXT year's expected earnings. When it sits above the trailing P/E, the market expects profits to fall — a key cyclical warning.",
    "Dividend / share": "Cash paid out per share over one year, in the displayed currency.",
    "Ex-dividend date": "Own the stock before this date to receive the next dividend. On the date itself, the price typically opens lower by roughly the dividend amount.",
    "PEG": "P/E divided by the expected annual EPS growth rate. Around 1 means growth is fairly priced; below 1, potentially cheap; above 2, you're paying a lot for growth that may not arrive.",
    "P/E": "Price over earnings per share — how many years of current profit you pay for the whole company.",
    "P/B": "Price over book value. Below 1 means paying less than the accounting value of net assets — the core metric for asset plays.",
    "Div. yield": "Annual dividends divided by the share price — the cash return you collect just for holding.",
    "Payout": "Percentage of earnings paid out as dividends. Above ~80% leaves little room for error if profits dip.",
    "Implied vol.": "The volatility that option prices imply for the period ahead. Higher = the market is bracing for bigger swings.",
    "IV rank": "Where today's implied volatility sits inside its own 1-year range (0–100). High rank = options are expensive vs. their history.",
    "Expected move (30d)": "The ± price range the options market is pricing for the next 30 days (one standard deviation).",
    "Put/Call ratio": "Put open interest divided by call open interest. Above 1 = traders are net hedging or bearish; well below 1 = bullish positioning.",
    "Debt to equity ratio": "Total debt divided by shareholders' equity — the classic leverage gauge.",
    "Total debt": "All interest-bearing borrowings, short and long term.",
    "Long-term debt": "Debt maturing beyond 12 months. Safer than short-term debt because refinancing pressure is spread out.",
    "Interest coverage ratio": "Operating income divided by interest expense. Below 2x, profit barely covers interest — a stressed balance sheet.",
    "Cash": "Cash plus short-term investments that can be turned into cash quickly.",
    "Equity": "Assets minus liabilities — the book value that belongs to shareholders.",
    "Total liabilities": "Everything the company owes: debt, payables, provisions and other obligations.",
    "Total assets": "Everything the company owns: cash, receivables, inventory, property and intangibles.",
    "Day's range": "The lowest and highest prices traded so far today, with the marker showing where price sits now.",
    "52-week range": "The lowest and highest prices of the last year. Trading near the top signals momentum; near the bottom, weakness or opportunity.",
    "Volume (today)": "Shares traded today. Spikes versus the average often mark the start or exhaustion of a move.",
    "Avg volume (3M)": "Average daily shares traded over three months — the baseline that makes today's volume meaningful.",
    "ADX (14)": "Average Directional Index — the classic trend-strength gauge, built from daily highs and lows. Above 25 = trending market where MA signals work; below 20 = ranging market where they whipsaw. Direction-agnostic: a strong DOWNTREND also scores high.",
    "ATR (14)": "Average True Range — the average size of a day's full move (including gaps) over 14 sessions, shown here as % of price. It calibrates everything volatility-sensitive: zone widths, exit buffers, what counts as 'stretched'.",
    "Risk/Reward": "Upside to the top of the resistance zone divided by downside to the bottom of the support zone. Above 2 = you risk 1 to make 2+ (favorable); below 0.8 = the reward doesn't pay for the risk.",
    "Trend score": "0–100 rating of the PRIMARY trend: direction (SMA50 vs SMA200), quality (% gaps between price and the averages), strength (60-day slopes), 12-1 momentum and the regime. High = an established, healthy uptrend — it says nothing about whether NOW is a good moment to buy.",
    "Entry score": "0–100 rating of the MOMENT inside the trend: RSI, MACD, distance to support/resistance, how stretched price is above the SMA50, and volume confirmation. A great trend with a low entry score usually means: wait for a pullback.",
    "Regime (ER)": "Kaufman's Efficiency Ratio over 20 sessions: net price displacement divided by the sum of all daily moves. Near 1 = clean trend; near 0 = choppy range. Below 0.25 moving-average signals produce frequent false entries and exits (whipsaw).",
    "Momentum 12-1": "Return over the last 12 months EXCLUDING the most recent month (which tends to mean-revert). The most academically robust momentum measure: positive = the trend still has fuel.",
    "SMA50 vs SMA200": "The % gap between the 50-day and 200-day averages. A fresh cross sits near 0% and fails often; a gap of several percent marks an established trend.",
    "Price vs SMA200": "How far price sits above (+) or below (−) its 200-day average, in %. Deeply positive = strong but possibly stretched; negative = the long-term trend is broken.",
    "SMA slope (60d)": "How much the moving average itself climbed or fell over the last 60 sessions. A cross can stay 'positive' while the averages are already rolling over — slope catches that early.",
    "Volume vs 20d avg": "Today's volume divided by its own 20-day average. Moves on 1.5×+ volume carry conviction; breakouts on thin volume fail more often.",
  },
  pt: {
    "Revenue": "Receita total dos últimos doze meses, antes de qualquer custo ser deduzido.",
    "EBITDA": "Lucro antes de juros, impostos, depreciação e amortização — uma aproximação do caixa operacional que o negócio gera.",
    "EBITDA margin": "EBITDA como porcentagem da receita: quanto de cada venda vira caixa operacional.",
    "ROI": "Retorno sobre o investimento — lucro gerado por unidade de capital total investido no negócio.",
    "ROIC": "Retorno sobre o capital investido — como o ROI, mas contando só o capital ligado às operações. Acima de ~12% costuma superar o custo de capital, que é onde se cria valor.",
    "ROE": "Lucro líquido dividido pelo patrimônio líquido: o retorno gerado sobre o dinheiro dos donos.",
    "Net margin": "Lucro líquido como porcentagem da receita — o que sobra depois de todo custo, imposto e juros.",
    "EV/EBITDA": "Valor da firma (valor de mercado + dívida líquida) sobre o EBITDA. Um múltiplo neutro em relação à dívida que a empresa carrega.",
    "P/S": "Preço/Vendas: valor de mercado dividido pela receita. Mais útil quando o lucro é negativo ou instável.",
    "Forward P/E": "Preço sobre o lucro esperado do PRÓXIMO ano. Quando fica acima do P/L atual, o mercado espera queda nos lucros — um alerta clássico de cíclicas.",
    "Dividend / share": "Dinheiro pago por ação ao longo de um ano, na moeda exibida.",
    "Ex-dividend date": "Tenha a ação antes desta data para receber o próximo dividendo. Na própria data, o preço costuma abrir mais baixo pelo valor do dividendo.",
    "PEG": "P/L dividido pela taxa de crescimento anual esperada do lucro. Perto de 1, o crescimento está precificado de forma justa; abaixo de 1, potencialmente barato; acima de 2, você paga caro por um crescimento que pode não vir.",
    "P/E": "Preço sobre o lucro por ação — quantos anos de lucro atual você paga pela empresa inteira.",
    "P/B": "Preço sobre o valor patrimonial. Abaixo de 1 significa pagar menos que o valor contábil dos ativos líquidos — métrica central para asset plays.",
    "Div. yield": "Dividendos anuais divididos pelo preço da ação — o retorno em caixa só por carregar o papel.",
    "Payout": "Porcentagem do lucro distribuída como dividendos. Acima de ~80% deixa pouca margem de erro se o lucro cair.",
    "Implied vol.": "A volatilidade que os preços das opções implicam para o período à frente. Maior = o mercado se prepara para oscilações maiores.",
    "IV rank": "Onde a volatilidade implícita de hoje está dentro da própria faixa de 1 ano (0–100). Rank alto = opções caras vs. o histórico.",
    "Expected move (30d)": "A faixa de preço ± que o mercado de opções precifica para os próximos 30 dias (um desvio-padrão).",
    "Put/Call ratio": "Contratos de put em aberto sobre contratos de call. Acima de 1 = traders protegidos ou pessimistas; bem abaixo de 1 = posicionamento otimista.",
    "Debt to equity ratio": "Dívida total dividida pelo patrimônio líquido — o medidor clássico de alavancagem.",
    "Total debt": "Toda dívida que paga juros, de curto e longo prazo.",
    "Long-term debt": "Dívida que vence após 12 meses. Mais segura que a de curto prazo porque a pressão de refinanciamento fica diluída.",
    "Interest coverage ratio": "Lucro operacional dividido pela despesa de juros. Abaixo de 2x, o lucro mal cobre os juros — balanço estressado.",
    "Cash": "Caixa mais investimentos de curto prazo que viram dinheiro rapidamente.",
    "Equity": "Ativos menos passivos — o valor contábil que pertence aos acionistas.",
    "Total liabilities": "Tudo o que a empresa deve: dívida, fornecedores, provisões e outras obrigações.",
    "Total assets": "Tudo o que a empresa possui: caixa, recebíveis, estoque, imóveis e intangíveis.",
    "Day's range": "O menor e o maior preço negociados hoje, com o marcador mostrando onde o preço está agora.",
    "52-week range": "O menor e o maior preço do último ano. Negociar perto do topo sinaliza força; perto do fundo, fraqueza ou oportunidade.",
    "Volume (today)": "Ações negociadas hoje. Picos acima da média costumam marcar o início ou a exaustão de um movimento.",
    "Avg volume (3M)": "Média diária de ações negociadas em três meses — a base que dá sentido ao volume de hoje.",
    "ADX (14)": "Average Directional Index — o medidor clássico de força de tendência, construído com as máximas e mínimas diárias. Acima de 25 = mercado em tendência, onde sinais de médias funcionam; abaixo de 20 = lateralização, onde eles violinam. Não tem direção: uma QUEDA forte também pontua alto.",
    "ATR (14)": "Average True Range — o tamanho médio do movimento completo de um dia (incluindo gaps) em 14 pregões, mostrado aqui como % do preço. Ele calibra tudo que é sensível à volatilidade: largura das zonas, folgas de saída, o que conta como 'esticado'.",
    "Risk/Reward": "Potencial até o topo da zona de resistência dividido pelo risco até o fundo da zona de suporte. Acima de 2 = você arrisca 1 para ganhar 2+ (favorável); abaixo de 0,8 = o prêmio não paga o risco.",
    "Trend score": "Nota 0–100 da tendência PRIMÁRIA: direção (SMA50 vs SMA200), qualidade (distâncias % entre preço e médias), força (inclinações de 60 dias), momentum 12-1 e o regime. Alta = tendência de alta estabelecida e saudável — não diz nada sobre AGORA ser um bom momento de compra.",
    "Entry score": "Nota 0–100 do MOMENTO dentro da tendência: RSI, MACD, distância até suporte/resistência, quão esticado o preço está acima da SMA50 e confirmação por volume. Tendência ótima com nota de entrada baixa costuma significar: espere um pullback.",
    "Regime (ER)": "Efficiency Ratio de Kaufman em 20 pregões: deslocamento líquido do preço dividido pela soma de todos os movimentos diários. Perto de 1 = tendência limpa; perto de 0 = lateralização picotada. Abaixo de 0,25, sinais de médias móveis geram entradas e saídas falsas com frequência (violinada).",
    "Momentum 12-1": "Retorno dos últimos 12 meses EXCLUINDO o mês mais recente (que tende a reverter). A medida de momentum mais robusta academicamente: positiva = a tendência ainda tem combustível.",
    "SMA50 vs SMA200": "A distância % entre as médias de 50 e 200 dias. Um cruzamento recém-saído fica perto de 0% e falha com frequência; uma folga de vários por cento marca tendência estabelecida.",
    "Price vs SMA200": "Quanto o preço está acima (+) ou abaixo (−) da média de 200 dias, em %. Muito positivo = forte mas possivelmente esticado; negativo = a tendência de longo prazo está quebrada.",
    "SMA slope (60d)": "Quanto a própria média móvel subiu ou caiu nos últimos 60 pregões. Um cruzamento pode continuar 'positivo' enquanto as médias já estão virando — a inclinação pega isso cedo.",
    "Volume vs 20d avg": "O volume de hoje dividido pela própria média de 20 dias. Movimentos com 1,5×+ de volume carregam convicção; rompimentos com volume fraco falham mais.",
  },
  es: {
    "Revenue": "Ventas totales de los últimos doce meses, antes de deducir costos.",
    "EBITDA": "Beneficio antes de intereses, impuestos, depreciación y amortización — una aproximación del efectivo operativo que genera el negocio.",
    "EBITDA margin": "EBITDA como porcentaje de los ingresos: cuánto de cada venta se convierte en efectivo operativo.",
    "ROI": "Retorno de la inversión — beneficio generado por unidad de capital total invertido en el negocio.",
    "ROIC": "Retorno sobre el capital invertido — como el ROI, pero contando solo el capital ligado a las operaciones. Por encima de ~12% suele superar el costo de capital, donde se crea valor.",
    "ROE": "Beneficio neto dividido por el patrimonio: el retorno generado sobre el dinero de los dueños.",
    "Net margin": "Beneficio neto como porcentaje de los ingresos — lo que queda tras todo costo, impuesto e interés.",
    "EV/EBITDA": "Valor de empresa (capitalización + deuda neta) sobre EBITDA. Un múltiplo neutral respecto a la deuda que carga la empresa.",
    "P/S": "Precio/Ventas: capitalización dividida por ingresos. Más útil cuando el beneficio es negativo o inestable.",
    "Forward P/E": "Precio sobre el beneficio esperado del PRÓXIMO año. Cuando supera al P/E actual, el mercado espera caída de beneficios — una alerta clásica de cíclicas.",
    "Dividend / share": "Efectivo pagado por acción durante un año, en la moneda mostrada.",
    "Ex-dividend date": "Posee la acción antes de esta fecha para cobrar el próximo dividendo. En la fecha, el precio suele abrir más bajo por el monto del dividendo.",
    "PEG": "P/E dividido por la tasa de crecimiento anual esperada del BPA. Cerca de 1, el crecimiento está bien valorado; bajo 1, potencialmente barato; sobre 2, pagas caro por un crecimiento que puede no llegar.",
    "P/E": "Precio sobre beneficio por acción — cuántos años de beneficio actual pagas por toda la empresa.",
    "P/B": "Precio sobre valor en libros. Bajo 1 significa pagar menos que el valor contable de los activos netos — métrica central de los asset plays.",
    "Div. yield": "Dividendos anuales divididos por el precio de la acción — el retorno en efectivo solo por mantenerla.",
    "Payout": "Porcentaje del beneficio distribuido como dividendos. Sobre ~80% deja poco margen de error si el beneficio cae.",
    "Implied vol.": "La volatilidad que los precios de las opciones implican para el período venidero. Mayor = el mercado se prepara para mayores oscilaciones.",
    "IV rank": "Dónde está la volatilidad implícita de hoy dentro de su rango de 1 año (0–100). Rango alto = opciones caras vs. su historial.",
    "Expected move (30d)": "El rango de precio ± que el mercado de opciones valora para los próximos 30 días (una desviación estándar).",
    "Put/Call ratio": "Interés abierto de puts sobre el de calls. Sobre 1 = traders cubiertos o bajistas; muy bajo 1 = posicionamiento alcista.",
    "Debt to equity ratio": "Deuda total dividida por el patrimonio — el medidor clásico de apalancamiento.",
    "Total debt": "Toda deuda con intereses, a corto y largo plazo.",
    "Long-term debt": "Deuda que vence después de 12 meses. Más segura que la de corto plazo porque la presión de refinanciación se reparte.",
    "Interest coverage ratio": "Beneficio operativo dividido por gastos por intereses. Bajo 2x, el beneficio apenas cubre los intereses — balance estresado.",
    "Cash": "Efectivo más inversiones de corto plazo convertibles rápidamente en dinero.",
    "Equity": "Activos menos pasivos — el valor en libros que pertenece a los accionistas.",
    "Total liabilities": "Todo lo que la empresa debe: deuda, proveedores, provisiones y otras obligaciones.",
    "Total assets": "Todo lo que la empresa posee: efectivo, cuentas por cobrar, inventario, propiedades e intangibles.",
    "Day's range": "El precio más bajo y más alto negociado hoy, con el marcador mostrando dónde está el precio ahora.",
    "52-week range": "El precio más bajo y más alto del último año. Negociar cerca del techo señala fuerza; cerca del piso, debilidad u oportunidad.",
    "Volume (today)": "Acciones negociadas hoy. Picos sobre el promedio suelen marcar el inicio o agotamiento de un movimiento.",
    "Avg volume (3M)": "Promedio diario de acciones negociadas en tres meses — la base que da sentido al volumen de hoy.",
    "ADX (14)": "Average Directional Index — el medidor clásico de fuerza de tendencia, construido con máximos y mínimos diarios. Sobre 25 = mercado en tendencia donde las señales de medias funcionan; bajo 20 = lateral, donde dan señales falsas. Sin dirección: una CAÍDA fuerte también puntúa alto.",
    "ATR (14)": "Average True Range — el tamaño medio del movimiento completo de un día (incluyendo gaps) en 14 sesiones, mostrado como % del precio. Calibra todo lo sensible a la volatilidad: ancho de zonas, márgenes de salida, qué cuenta como 'estirado'.",
    "Risk/Reward": "Potencial hasta el techo de la zona de resistencia dividido por el riesgo hasta el piso de la zona de soporte. Sobre 2 = arriesgas 1 para ganar 2+ (favorable); bajo 0,8 = el premio no paga el riesgo.",
    "Trend score": "Nota 0–100 de la tendencia PRIMARIA: dirección (SMA50 vs SMA200), calidad (distancias % entre precio y medias), fuerza (pendientes de 60 días), momentum 12-1 y el régimen. Alta = tendencia alcista establecida y sana — no dice nada sobre si AHORA es buen momento de compra.",
    "Entry score": "Nota 0–100 del MOMENTO dentro de la tendencia: RSI, MACD, distancia a soporte/resistencia, cuán estirado está el precio sobre la SMA50 y confirmación por volumen. Gran tendencia con nota de entrada baja suele significar: espera un retroceso.",
    "Regime (ER)": "Efficiency Ratio de Kaufman en 20 sesiones: desplazamiento neto del precio dividido por la suma de todos los movimientos diarios. Cerca de 1 = tendencia limpia; cerca de 0 = rango picado. Bajo 0,25 las señales de medias móviles generan entradas y salidas falsas con frecuencia.",
    "Momentum 12-1": "Retorno de los últimos 12 meses EXCLUYENDO el mes más reciente (que tiende a revertir). La medida de momentum más robusta académicamente: positiva = la tendencia aún tiene combustible.",
    "SMA50 vs SMA200": "La distancia % entre las medias de 50 y 200 días. Un cruce reciente queda cerca de 0% y falla a menudo; una brecha de varios puntos marca tendencia establecida.",
    "Price vs SMA200": "Cuánto está el precio por encima (+) o por debajo (−) de su media de 200 días, en %. Muy positivo = fuerte pero quizá estirado; negativo = la tendencia de largo plazo está rota.",
    "SMA slope (60d)": "Cuánto subió o bajó la propia media móvil en las últimas 60 sesiones. Un cruce puede seguir 'positivo' mientras las medias ya se doblan — la pendiente lo detecta pronto.",
    "Volume vs 20d avg": "El volumen de hoy dividido por su propia media de 20 días. Movimientos con 1,5×+ de volumen llevan convicción; rupturas con poco volumen fallan más.",
  },
  fr: {
    "Revenue": "Ventes totales des douze derniers mois, avant déduction des coûts.",
    "EBITDA": "Bénéfice avant intérêts, impôts, dépréciation et amortissement — une approximation de la trésorerie opérationnelle générée.",
    "EBITDA margin": "EBITDA en pourcentage du chiffre d'affaires : combien de chaque vente devient trésorerie opérationnelle.",
    "ROI": "Retour sur investissement — bénéfice généré par unité de capital total investi dans l'entreprise.",
    "ROIC": "Retour sur capital investi — comme le ROI, mais seulement le capital lié aux opérations. Au-dessus de ~12%, il dépasse souvent le coût du capital, là où la valeur se crée.",
    "ROE": "Bénéfice net divisé par les capitaux propres : le rendement généré sur l'argent des propriétaires.",
    "Net margin": "Bénéfice net en pourcentage du chiffre d'affaires — ce qui reste après tout coût, impôt et intérêt.",
    "EV/EBITDA": "Valeur d'entreprise (capitalisation + dette nette) sur EBITDA. Un multiple neutre vis-à-vis de la dette portée.",
    "P/S": "Cours/Ventes : capitalisation divisée par le chiffre d'affaires. Surtout utile quand le bénéfice est négatif ou instable.",
    "Forward P/E": "Cours sur le bénéfice attendu de l'année PROCHAINE. Au-dessus du P/E actuel, le marché anticipe une baisse des profits — alerte classique des cycliques.",
    "Dividend / share": "Liquidités versées par action sur un an, dans la devise affichée.",
    "Ex-dividend date": "Détenez l'action avant cette date pour percevoir le prochain dividende. Ce jour-là, le cours ouvre généralement plus bas du montant du dividende.",
    "PEG": "P/E divisé par le taux de croissance annuel attendu du BPA. Vers 1, croissance correctement valorisée ; sous 1, potentiellement bon marché ; au-dessus de 2, vous payez cher une croissance incertaine.",
    "P/E": "Cours sur bénéfice par action — combien d'années de bénéfice actuel vous payez pour toute l'entreprise.",
    "P/B": "Cours sur valeur comptable. Sous 1 signifie payer moins que la valeur comptable des actifs nets — métrique centrale des asset plays.",
    "Div. yield": "Dividendes annuels divisés par le cours — le rendement en liquidités juste en détenant l'action.",
    "Payout": "Pourcentage du bénéfice distribué en dividendes. Au-dessus de ~80%, peu de marge d'erreur si le bénéfice baisse.",
    "Implied vol.": "La volatilité que les prix des options impliquent pour la période à venir. Plus élevée = le marché se prépare à de plus fortes variations.",
    "IV rank": "Où se situe la volatilité implicite du jour dans sa propre fourchette d'un an (0–100). Rang élevé = options chères vs. leur historique.",
    "Expected move (30d)": "La fourchette de prix ± que le marché des options valorise pour les 30 prochains jours (un écart-type).",
    "Put/Call ratio": "Positions ouvertes de puts sur celles de calls. Au-dessus de 1 = traders couverts ou baissiers ; bien en dessous de 1 = positionnement haussier.",
    "Debt to equity ratio": "Dette totale divisée par les capitaux propres — la jauge classique de levier.",
    "Total debt": "Tous les emprunts portant intérêt, à court et long terme.",
    "Long-term debt": "Dette arrivant à échéance au-delà de 12 mois. Plus sûre que la dette court terme car la pression de refinancement est étalée.",
    "Interest coverage ratio": "Bénéfice opérationnel divisé par les charges d'intérêts. Sous 2x, le bénéfice couvre à peine les intérêts — bilan sous tension.",
    "Cash": "Liquidités plus placements à court terme rapidement convertibles.",
    "Equity": "Actifs moins passifs — la valeur comptable qui revient aux actionnaires.",
    "Total liabilities": "Tout ce que l'entreprise doit : dette, fournisseurs, provisions et autres obligations.",
    "Total assets": "Tout ce que l'entreprise possède : liquidités, créances, stocks, immobilier et incorporels.",
    "Day's range": "Les prix les plus bas et les plus hauts négociés aujourd'hui, le marqueur indiquant où se situe le cours.",
    "52-week range": "Les prix les plus bas et les plus hauts de l'année. Près du haut = élan ; près du bas = faiblesse ou opportunité.",
    "Volume (today)": "Actions échangées aujourd'hui. Les pics au-dessus de la moyenne marquent souvent le début ou l'épuisement d'un mouvement.",
    "Avg volume (3M)": "Moyenne quotidienne d'actions échangées sur trois mois — la base qui donne du sens au volume du jour.",
    "ADX (14)": "Average Directional Index — la jauge classique de force de tendance, construite avec les plus hauts et plus bas quotidiens. Au-dessus de 25 = marché en tendance où les signaux de moyennes fonctionnent ; sous 20 = range, où ils donnent de faux signaux. Sans direction : une forte BAISSE score aussi haut.",
    "ATR (14)": "Average True Range — la taille moyenne du mouvement complet d'une journée (gaps inclus) sur 14 séances, en % du prix. Il calibre tout ce qui est sensible à la volatilité : largeur des zones, marges de sortie, ce qui compte comme « étiré ».",
    "Risk/Reward": "Potentiel jusqu'au haut de la zone de résistance divisé par le risque jusqu'au bas de la zone de support. Au-dessus de 2 = vous risquez 1 pour gagner 2+ (favorable) ; sous 0,8 = la récompense ne paie pas le risque.",
    "Trend score": "Note 0–100 de la tendance PRIMAIRE : direction (SMA50 vs SMA200), qualité (écarts % entre prix et moyennes), force (pentes sur 60 jours), momentum 12-1 et régime. Élevée = tendance haussière établie et saine — cela ne dit rien sur le fait que MAINTENANT soit un bon moment d'achat.",
    "Entry score": "Note 0–100 du MOMENT dans la tendance : RSI, MACD, distance au support/résistance, étirement du prix au-dessus de la SMA50 et confirmation par le volume. Grande tendance + note d'entrée basse = attendre un repli, le plus souvent.",
    "Regime (ER)": "Efficiency Ratio de Kaufman sur 20 séances : déplacement net du prix divisé par la somme de tous les mouvements quotidiens. Proche de 1 = tendance nette ; proche de 0 = range haché. Sous 0,25, les signaux de moyennes mobiles produisent souvent de fausses entrées/sorties.",
    "Momentum 12-1": "Rendement des 12 derniers mois HORS le mois le plus récent (qui tend à se retourner). La mesure de momentum la plus robuste académiquement : positive = la tendance a encore du carburant.",
    "SMA50 vs SMA200": "L'écart % entre les moyennes 50 et 200 jours. Un croisement tout frais reste près de 0% et échoue souvent ; un écart de plusieurs % marque une tendance établie.",
    "Price vs SMA200": "De combien le prix est au-dessus (+) ou en dessous (−) de sa moyenne 200 jours, en %. Très positif = fort mais peut-être étiré ; négatif = la tendance de long terme est cassée.",
    "SMA slope (60d)": "De combien la moyenne mobile elle-même a monté ou baissé sur 60 séances. Un croisement peut rester « positif » alors que les moyennes basculent déjà — la pente le repère tôt.",
    "Volume vs 20d avg": "Le volume du jour divisé par sa propre moyenne 20 jours. Les mouvements à 1,5×+ portent de la conviction ; les cassures à faible volume échouent plus souvent.",
  },
  he: {
    "Revenue": "סך המכירות בשנים-עשר החודשים האחרונים, לפני ניכוי עלויות.",
    "EBITDA": "רווח לפני ריבית, מסים, פחת והפחתות — קירוב לתזרים התפעולי שהעסק מייצר.",
    "EBITDA margin": "EBITDA כאחוז מההכנסה: כמה מכל מכירה הופך לתזרים תפעולי.",
    "ROI": "תשואה על ההשקעה — הרווח שנוצר על כל יחידת הון שהושקעה בעסק.",
    "ROIC": "תשואה על ההון המושקע — כמו ROI, אך רק ההון הקשור לפעילות. מעל ~12% בדרך כלל עוקף את עלות ההון, ושם נוצר ערך.",
    "ROE": "רווח נקי חלקי ההון העצמי: התשואה על כספם של הבעלים.",
    "Net margin": "רווח נקי כאחוז מההכנסה — מה שנשאר אחרי כל עלות, מס וריבית.",
    "EV/EBITDA": "שווי הפירמה (שווי שוק + חוב נטו) חלקי EBITDA. מכפיל ניטרלי ביחס לרמת החוב של החברה.",
    "P/S": "מחיר/מכירות: שווי שוק חלקי הכנסה. שימושי במיוחד כשהרווח שלילי או תנודתי.",
    "Forward P/E": "מחיר חלקי הרווח הצפוי לשנה הבאה. כשגבוה מה-P/E הנוכחי, השוק מצפה לירידה ברווחים — אזהרה קלאסית למחזוריות.",
    "Dividend / share": "מזומן ששולם למניה לאורך שנה, במטבע המוצג.",
    "Ex-dividend date": "החזק במניה לפני תאריך זה כדי לקבל את הדיבידנד הבא. בתאריך עצמו המחיר בדרך כלל נפתח נמוך יותר בגובה הדיבידנד.",
    "PEG": "P/E חלקי שיעור צמיחת הרווח השנתי הצפוי. סביב 1 הצמיחה מתומחרת הוגן; מתחת ל-1 פוטנציאלית זול; מעל 2 משלמים ביוקר על צמיחה שאולי לא תגיע.",
    "P/E": "מחיר חלקי רווח למניה — כמה שנות רווח נוכחי משלמים על כל החברה.",
    "P/B": "מחיר חלקי הון עצמי. מתחת ל-1 משמעו תשלום פחות מהערך החשבונאי של הנכסים — מדד מרכזי ל-asset plays.",
    "Div. yield": "דיבידנד שנתי חלקי מחיר המניה — התשואה במזומן רק על החזקת המניה.",
    "Payout": "אחוז הרווח המחולק כדיבידנד. מעל ~80% משאיר מעט מקום לטעות אם הרווח יורד.",
    "Implied vol.": "התנודתיות שמחירי האופציות מגלמים לתקופה הקרובה. גבוהה יותר = השוק נערך לתנודות גדולות יותר.",
    "IV rank": "היכן ממוקמת התנודתיות הגלומה היום בתוך טווח השנה שלה (0–100). דירוג גבוה = אופציות יקרות יחסית להיסטוריה.",
    "Expected move (30d)": "טווח המחיר ± שמגלם שוק האופציות ל-30 הימים הקרובים (סטיית תקן אחת).",
    "Put/Call ratio": "פוזיציות פוט פתוחות חלקי פוזיציות קול. מעל 1 = סוחרים מגודרים או דוביים; הרבה מתחת ל-1 = מיצוב שורי.",
    "Debt to equity ratio": "חוב כולל חלקי ההון העצמי — מדד המינוף הקלאסי.",
    "Total debt": "כל ההלוואות נושאות הריבית, לטווח קצר וארוך.",
    "Long-term debt": "חוב לפירעון מעבר ל-12 חודשים. בטוח יותר מחוב קצר טווח כי לחץ המיחזור מפוזר.",
    "Interest coverage ratio": "רווח תפעולי חלקי הוצאות הריבית. מתחת ל-2x הרווח בקושי מכסה את הריבית — מאזן בלחץ.",
    "Cash": "מזומן בתוספת השקעות לטווח קצר שניתן להמיר במהירות למזומן.",
    "Equity": "נכסים פחות התחייבויות — הערך החשבונאי השייך לבעלי המניות.",
    "Total liabilities": "כל מה שהחברה חייבת: חוב, ספקים, הפרשות והתחייבויות נוספות.",
    "Total assets": "כל מה שיש לחברה: מזומן, חייבים, מלאי, נדל\"ן ונכסים בלתי מוחשיים.",
    "Day's range": "המחיר הנמוך והגבוה שנסחרו היום, כשהסמן מראה היכן המחיר עכשיו.",
    "52-week range": "המחיר הנמוך והגבוה של השנה האחרונה. קרוב לפסגה מסמן מומנטום; קרוב לתחתית, חולשה או הזדמנות.",
    "Volume (today)": "מניות שנסחרו היום. קפיצות מעל הממוצע מסמנות לרוב תחילת מהלך או מיצויו.",
    "Avg volume (3M)": "ממוצע יומי של מניות שנסחרו בשלושה חודשים — הבסיס שנותן משמעות למחזור של היום.",
    "ADX (14)": "Average Directional Index — מד עוצמת המגמה הקלאסי, שנבנה מהשיאים והשפלים היומיים. מעל 25 = שוק במגמה שבו איתותי ממוצעים עובדים; מתחת ל-20 = דשדוש שבו הם מייצרים איתותי שווא. חסר כיוון: גם ירידה חזקה מקבלת ציון גבוה.",
    "ATR (14)": "Average True Range — הגודל הממוצע של התנועה המלאה ביום (כולל פערים) על פני 14 ימי מסחר, מוצג כ-% מהמחיר. הוא מכייל כל מה שרגיש לתנודתיות: רוחב האזורים, מרווחי יציאה, מה נחשב 'מתוח'.",
    "Risk/Reward": "הפוטנציאל עד ראש אזור ההתנגדות חלקי הסיכון עד תחתית אזור התמיכה. מעל 2 = מסכן 1 כדי להרוויח 2+ (נוח); מתחת ל-0.8 = הפרס לא משלם על הסיכון.",
    "Trend score": "ציון 0–100 של המגמה הראשית: כיוון (SMA50 מול SMA200), איכות (מרחקים ב-% בין המחיר לממוצעים), עוצמה (שיפועי 60 יום), מומנטום 12-1 והמשטר. גבוה = מגמת עלייה מבוססת ובריאה — הוא לא אומר דבר על השאלה אם עכשיו זה רגע טוב לקנייה.",
    "Entry score": "ציון 0–100 של הרגע בתוך המגמה: RSI, MACD, מרחק מתמיכה/התנגדות, כמה המחיר מתוח מעל ה-SMA50 ואישור נפח. מגמה מצוינת עם ציון כניסה נמוך בדרך כלל אומרת: חכה לתיקון.",
    "Regime (ER)": "Efficiency Ratio של קאופמן על 20 ימי מסחר: התזוזה נטו של המחיר חלקי סכום כל התנועות היומיות. קרוב ל-1 = מגמה נקייה; קרוב ל-0 = דשדוש קופצני. מתחת ל-0.25 איתותי ממוצעים נעים מייצרים כניסות ויציאות שווא בתדירות גבוהה.",
    "Momentum 12-1": "תשואת 12 החודשים האחרונים ללא החודש האחרון (שנוטה להתהפך). מדד המומנטום החזק ביותר אקדמית: חיובי = למגמה עוד יש דלק.",
    "SMA50 vs SMA200": "המרחק ב-% בין ממוצעי 50 ו-200 הימים. חצייה טרייה יושבת קרוב ל-0% ונכשלת לעיתים קרובות; פער של כמה אחוזים מסמן מגמה מבוססת.",
    "Price vs SMA200": "בכמה המחיר מעל (+) או מתחת (−) לממוצע 200 הימים, ב-%. חיובי מאוד = חזק אך אולי מתוח; שלילי = מגמת הטווח הארוך שבורה.",
    "SMA slope (60d)": "בכמה הממוצע הנע עצמו עלה או ירד ב-60 ימי המסחר האחרונים. חצייה יכולה להישאר 'חיובית' בזמן שהממוצעים כבר מתהפכים — השיפוע תופס זאת מוקדם.",
    "Volume vs 20d avg": "מחזור היום חלקי הממוצע שלו ל-20 יום. תנועות עם 1.5×+ נפח נושאות שכנוע; פריצות בנפח דל נכשלות יותר.",
  },
  ar: {
    "Revenue": "إجمالي المبيعات خلال الاثني عشر شهرًا الماضية، قبل خصم أي تكاليف.",
    "EBITDA": "الأرباح قبل الفوائد والضرائب والإهلاك والاستهلاك — تقريب للنقد التشغيلي الذي يولّده النشاط.",
    "EBITDA margin": "EBITDA كنسبة من الإيرادات: كم من كل عملية بيع يتحول إلى نقد تشغيلي.",
    "ROI": "العائد على الاستثمار — الربح المتولّد لكل وحدة من إجمالي رأس المال المستثمر.",
    "ROIC": "العائد على رأس المال المستثمر — مثل ROI لكن لرأس المال المرتبط بالعمليات فقط. فوق ~12% يتجاوز عادةً تكلفة رأس المال، حيث تُخلق القيمة.",
    "ROE": "صافي الدخل مقسومًا على حقوق المساهمين: العائد على أموال المالكين.",
    "Net margin": "صافي الدخل كنسبة من الإيرادات — ما يتبقى بعد كل تكلفة وضريبة وفائدة.",
    "EV/EBITDA": "قيمة المنشأة (القيمة السوقية + صافي الدين) على EBITDA. مضاعف محايد تجاه حجم دين الشركة.",
    "P/S": "السعر/المبيعات: القيمة السوقية مقسومة على الإيرادات. أكثر فائدة عندما يكون الربح سالبًا أو متقلبًا.",
    "Forward P/E": "السعر على الأرباح المتوقعة للعام المقبل. عندما يتجاوز P/E الحالي، يتوقع السوق انخفاض الأرباح — تحذير كلاسيكي للأسهم الدورية.",
    "Dividend / share": "النقد الموزّع لكل سهم خلال عام، بالعملة المعروضة.",
    "Ex-dividend date": "امتلك السهم قبل هذا التاريخ لتحصل على التوزيع القادم. في التاريخ نفسه يفتح السعر عادةً أقل بمقدار التوزيع.",
    "PEG": "P/E مقسومًا على معدل نمو ربحية السهم السنوي المتوقع. قرب 1 يعني تسعيرًا عادلًا للنمو؛ تحت 1 ربما رخيص؛ فوق 2 تدفع كثيرًا لنمو قد لا يتحقق.",
    "P/E": "السعر على ربحية السهم — كم سنة من الربح الحالي تدفع مقابل الشركة كاملة.",
    "P/B": "السعر على القيمة الدفترية. تحت 1 يعني الدفع أقل من القيمة المحاسبية لصافي الأصول — المقياس الأساسي لصفقات الأصول.",
    "Div. yield": "التوزيعات السنوية مقسومة على سعر السهم — العائد النقدي لمجرد الاحتفاظ بالسهم.",
    "Payout": "نسبة الأرباح الموزّعة كتوزيعات. فوق ~80% تترك هامش خطأ ضئيلًا إذا انخفض الربح.",
    "Implied vol.": "التقلب الذي تشير إليه أسعار الخيارات للفترة المقبلة. أعلى = السوق يستعد لتحركات أكبر.",
    "IV rank": "موضع التقلب الضمني اليوم ضمن نطاقه لعام كامل (0–100). ترتيب مرتفع = الخيارات غالية مقارنة بتاريخها.",
    "Expected move (30d)": "نطاق السعر ± الذي يسعّره سوق الخيارات للثلاثين يومًا القادمة (انحراف معياري واحد).",
    "Put/Call ratio": "عقود البيع المفتوحة على عقود الشراء. فوق 1 = متداولون متحوّطون أو هبوطيون؛ أقل بكثير من 1 = تموضع صعودي.",
    "Debt to equity ratio": "إجمالي الدين مقسومًا على حقوق المساهمين — مقياس الرافعة الكلاسيكي.",
    "Total debt": "كل القروض ذات الفائدة، قصيرة وطويلة الأجل.",
    "Long-term debt": "دين يستحق بعد 12 شهرًا. أكثر أمانًا من قصير الأجل لأن ضغط إعادة التمويل موزّع.",
    "Interest coverage ratio": "الربح التشغيلي مقسومًا على مصروف الفائدة. تحت 2x، الربح يكاد يغطي الفائدة — ميزانية متوترة.",
    "Cash": "النقد بالإضافة إلى الاستثمارات قصيرة الأجل القابلة للتحويل بسرعة إلى نقد.",
    "Equity": "الأصول ناقص الالتزامات — القيمة الدفترية المملوكة للمساهمين.",
    "Total liabilities": "كل ما تدين به الشركة: ديون وموردون ومخصصات والتزامات أخرى.",
    "Total assets": "كل ما تملكه الشركة: نقد وذمم ومخزون وعقارات وأصول غير ملموسة.",
    "Day's range": "أدنى وأعلى سعر تم تداوله اليوم، مع المؤشر يوضح موضع السعر الآن.",
    "52-week range": "أدنى وأعلى سعر خلال العام الماضي. قرب القمة يشير إلى زخم؛ قرب القاع، ضعف أو فرصة.",
    "Volume (today)": "الأسهم المتداولة اليوم. القفزات فوق المتوسط تشير غالبًا إلى بداية حركة أو استنفادها.",
    "Avg volume (3M)": "متوسط الأسهم المتداولة يوميًا خلال ثلاثة أشهر — الأساس الذي يمنح حجم اليوم معناه.",
    "ADX (14)": "Average Directional Index — المقياس الكلاسيكي لقوة الاتجاه، مبني من القمم والقيعان اليومية. فوق 25 = سوق ذو اتجاه تعمل فيه إشارات المتوسطات؛ تحت 20 = سوق عرضي تعطي فيه إشارات كاذبة. بلا اتجاه: الهبوط القوي يسجّل عاليًا أيضًا.",
    "ATR (14)": "Average True Range — متوسط حجم حركة اليوم الكاملة (بما فيها الفجوات) على 14 جلسة، معروض كنسبة من السعر. يعاير كل ما هو حساس للتقلب: عرض المناطق وهوامش الخروج وما يُعد 'ممتدًا'.",
    "Risk/Reward": "الإمكانية حتى قمة منطقة المقاومة مقسومة على المخاطرة حتى قاع منطقة الدعم. فوق 2 = تخاطر بـ1 لتربح 2+ (مواتٍ)؛ تحت 0.8 = المكافأة لا تعوّض المخاطرة.",
    "Trend score": "درجة 0–100 للاتجاه الرئيسي: الاتجاه (SMA50 مقابل SMA200)، الجودة (المسافات % بين السعر والمتوسطات)، القوة (ميول 60 يومًا)، زخم 12-1 والنظام. درجة عالية = اتجاه صاعد راسخ وسليم — وهي لا تقول شيئًا عمّا إذا كان الآن وقتًا جيدًا للشراء.",
    "Entry score": "درجة 0–100 للحظة داخل الاتجاه: RSI وMACD والمسافة إلى الدعم/المقاومة ومدى تمدد السعر فوق SMA50 وتأكيد الحجم. اتجاه ممتاز مع درجة دخول منخفضة يعني عادة: انتظر تصحيحًا.",
    "Regime (ER)": "نسبة كفاءة كاوفمان على 20 جلسة: صافي إزاحة السعر مقسومًا على مجموع كل التحركات اليومية. قرب 1 = اتجاه نظيف؛ قرب 0 = نطاق متقطع. تحت 0.25 تُنتج إشارات المتوسطات المتحركة دخولًا وخروجًا كاذبين بكثرة.",
    "Momentum 12-1": "عائد آخر 12 شهرًا باستثناء الشهر الأخير (الذي يميل للارتداد). أقوى مقياس زخم أكاديميًا: موجب = ما زال لدى الاتجاه وقود.",
    "SMA50 vs SMA200": "المسافة % بين متوسطي 50 و200 يوم. التقاطع الحديث يبقى قرب 0% ويفشل كثيرًا؛ فجوة عدة نقاط مئوية تدل على اتجاه راسخ.",
    "Price vs SMA200": "كم يقع السعر فوق (+) أو تحت (−) متوسط 200 يوم، بالنسبة المئوية. موجب جدًا = قوي لكنه ربما ممتد؛ سالب = اتجاه المدى الطويل مكسور.",
    "SMA slope (60d)": "كم صعد أو هبط المتوسط المتحرك نفسه خلال آخر 60 جلسة. قد يبقى التقاطع 'موجبًا' بينما المتوسطات بدأت تنعطف — الميل يلتقط ذلك مبكرًا.",
    "Volume vs 20d avg": "حجم اليوم مقسومًا على متوسطه لعشرين يومًا. التحركات بحجم 1.5×+ تحمل قناعة؛ الاختراقات بحجم ضعيف تفشل أكثر.",
  },
  ja: {
    "Revenue": "過去12か月の総売上高（コスト控除前）。",
    "EBITDA": "利息・税金・減価償却前の利益。事業が生む営業キャッシュの目安。",
    "EBITDA margin": "売上に対するEBITDAの割合。売上のうちどれだけが営業キャッシュになるか。",
    "ROI": "投資利益率。事業に投じた総資本1単位あたりの利益。",
    "ROIC": "投下資本利益率。ROIに似るが営業に紐づく資本のみで計算。約12%超で資本コストを上回り、価値創造が起きる水準。",
    "ROE": "純利益を自己資本で割った値。株主資金に対する利回り。",
    "Net margin": "売上に対する純利益の割合。あらゆるコスト・税・利息を引いた後に残るもの。",
    "EV/EBITDA": "企業価値（時価総額＋純有利子負債）÷EBITDA。負債水準に中立な評価倍率。",
    "P/S": "株価売上高倍率。時価総額÷売上。利益が赤字や不安定なときに特に有用。",
    "Forward P/E": "翌期予想利益に対する株価。実績PERより高ければ市場は減益を織り込む——景気循環株の典型的な警告。",
    "Dividend / share": "1年間に1株あたり支払われる現金（表示通貨）。",
    "Ex-dividend date": "この日より前に保有すれば次回配当を受け取れる。当日は株価が配当分ほど低く始まるのが通常。",
    "PEG": "PERを予想EPS成長率で割った値。1前後で成長が適正評価、1未満は割安の可能性、2超は実現しないかもしれない成長に高く払っている状態。",
    "P/E": "1株利益に対する株価。現在の利益の何年分で会社全体を買うか。",
    "P/B": "株価純資産倍率。1未満は純資産の簿価より安く買えること——資産株の中核指標。",
    "Div. yield": "年間配当÷株価。保有するだけで得られる現金利回り。",
    "Payout": "利益のうち配当に回す割合。約80%超は減益時の余裕が乏しい。",
    "Implied vol.": "オプション価格が示す今後の予想変動率。高いほど市場は大きな値動きを想定。",
    "IV rank": "当日のインプライドボラティリティが過去1年のレンジ内のどこか（0〜100）。高ランクは過去比で割高なオプション。",
    "Expected move (30d)": "オプション市場が織り込む今後30日の±価格レンジ（1標準偏差）。",
    "Put/Call ratio": "プットの建玉÷コールの建玉。1超はヘッジ・弱気、1を大きく下回ると強気の傾き。",
    "Debt to equity ratio": "総負債÷自己資本。代表的なレバレッジ指標。",
    "Total debt": "短期・長期すべての有利子負債。",
    "Long-term debt": "12か月超で満期を迎える負債。借換え圧力が分散するため短期負債より安全。",
    "Interest coverage ratio": "営業利益÷支払利息。2倍未満では利益が利息をかろうじて賄う水準——財務が逼迫。",
    "Cash": "現金および短期で換金できる短期投資。",
    "Equity": "資産から負債を引いた、株主に帰属する簿価。",
    "Total liabilities": "会社の負う全債務：借入金・買掛金・引当金など。",
    "Total assets": "会社が保有する全資産：現金・売掛金・在庫・不動産・無形資産。",
    "Day's range": "本日これまでの最安値と最高値。マーカーが現在値の位置を示す。",
    "52-week range": "過去1年の最安値と最高値。上限近くは勢い、下限近くは弱さか好機。",
    "Volume (today)": "本日の出来高。平均を上回る急増は動きの始まりや終息を示すことが多い。",
    "Avg volume (3M)": "3か月の1日平均出来高。本日の出来高を意味づける基準。",
    "ADX (14)": "Average Directional Index — 日々の高値・安値から作られる古典的なトレンド強度指標。25超＝移動平均シグナルが機能するトレンド相場、20未満＝ダマシが多いレンジ相場。方向は問わない：強い下降トレンドでも高くなる。",
    "ATR (14)": "Average True Range — ギャップを含む1日の値動き全体の平均（14営業日）を価格比%で表示。ゾーンの幅、手仕舞いの余裕、「伸び切り」の判定など、ボラティリティに敏感なすべてを校正する。",
    "Risk/Reward": "抵抗ゾーン上端までの上値余地を、支持ゾーン下端までの下値リスクで割った値。2超＝1のリスクで2以上を狙う（有利）；0.8未満＝報酬がリスクに見合わない。",
    "Trend score": "主要トレンドの0–100評価：方向（SMA50対SMA200）、質（価格と平均線の%乖離）、強さ（60日傾き）、12-1モメンタム、レジーム。高い＝確立した健全な上昇トレンド。ただし「今」が買い時かどうかは何も語らない。",
    "Entry score": "トレンド内の「今この瞬間」の0–100評価：RSI、MACD、支持線/抵抗線までの距離、SMA50からの乖離、出来高の裏付け。優れたトレンドでエントリースコアが低い場合は通常、押し目待ちが正解。",
    "Regime (ER)": "カウフマンの効率比率（20営業日）：価格の正味変位を日々の値動きの合計で割ったもの。1に近い＝きれいなトレンド、0に近い＝荒れたレンジ。0.25未満では移動平均シグナルがダマシを頻発する。",
    "Momentum 12-1": "直近1か月を除いた過去12か月のリターン（直近月は反転しやすい）。学術的に最も頑健なモメンタム指標：プラス＝トレンドにまだ燃料がある。",
    "SMA50 vs SMA200": "50日と200日平均線の%乖離。クロス直後は0%付近で失敗しやすく、数%の乖離は確立したトレンドを示す。",
    "Price vs SMA200": "価格が200日平均の上（+）か下（−）かを%で示す。大きくプラス＝強いが伸び切りの可能性、マイナス＝長期トレンドの崩れ。",
    "SMA slope (60d)": "移動平均線そのものが直近60営業日でどれだけ上下したか。クロスが「プラス」のままでも平均線はすでに転がり始めていることがある — 傾きはそれを早期に捉える。",
    "Volume vs 20d avg": "本日の出来高を自身の20日平均で割った値。1.5倍以上の出来高を伴う動きは確度が高く、薄商いのブレイクは失敗しやすい。",
  },
  zh: {
    "Revenue": "过去十二个月的总销售额（扣除成本前）。",
    "EBITDA": "息税折旧摊销前利润——衡量企业产生经营性现金的近似指标。",
    "EBITDA margin": "EBITDA占营收的比例：每笔销售有多少转化为经营性现金。",
    "ROI": "投资回报率——每单位投入企业的总资本所产生的利润。",
    "ROIC": "投入资本回报率——类似ROI，但只计入与经营相关的资本。高于约12%通常超过资本成本，即价值创造之处。",
    "ROE": "净利润除以股东权益：对所有者资金产生的回报。",
    "Net margin": "净利润占营收的比例——在所有成本、税费和利息之后剩下的部分。",
    "EV/EBITDA": "企业价值（市值＋净债务）除以EBITDA。对公司债务水平中性的估值倍数。",
    "P/S": "市销率：市值除以营收。在利润为负或波动时最有用。",
    "Forward P/E": "股价除以下一年预期利润。高于当前市盈率时，市场预期利润下滑——周期股的典型警示。",
    "Dividend / share": "一年内每股派发的现金（按显示货币）。",
    "Ex-dividend date": "在此日期前持有才能领取下次股息。当日股价通常按股息金额低开。",
    "PEG": "市盈率除以预期每股收益年增长率。约为1表示增长定价合理；低于1可能偏低估；高于2则为可能无法兑现的增长付出高价。",
    "P/E": "股价除以每股收益——用多少年的当前利润买下整个公司。",
    "P/B": "市净率。低于1意味着低于净资产账面价值买入——资产型股票的核心指标。",
    "Div. yield": "年股息除以股价——仅持有即可获得的现金回报。",
    "Payout": "作为股息派发的利润比例。高于约80%时，利润下滑的容错空间很小。",
    "Implied vol.": "期权价格隐含的未来波动率。越高表示市场预期更大波动。",
    "IV rank": "当日隐含波动率在其一年区间中的位置（0–100）。排名高表示期权相对历史偏贵。",
    "Expected move (30d)": "期权市场对未来30天定价的±价格区间（一个标准差）。",
    "Put/Call ratio": "看跌期权未平仓量除以看涨期权未平仓量。高于1为对冲或看空；远低于1为看多倾向。",
    "Debt to equity ratio": "总债务除以股东权益——经典的杠杆指标。",
    "Total debt": "所有计息借款，包括短期和长期。",
    "Long-term debt": "12个月以后到期的债务。比短期债务更安全，因再融资压力被分散。",
    "Interest coverage ratio": "营业利润除以利息支出。低于2倍时利润勉强覆盖利息——资产负债表承压。",
    "Cash": "现金及可快速变现的短期投资。",
    "Equity": "资产减负债——归属于股东的账面价值。",
    "Total liabilities": "公司所欠的一切：债务、应付账款、准备金及其他义务。",
    "Total assets": "公司拥有的一切：现金、应收款、存货、不动产及无形资产。",
    "Day's range": "今日迄今的最低价和最高价，标记显示当前价格所在。",
    "52-week range": "过去一年的最低价和最高价。接近顶部显示动能；接近底部则是疲软或机会。",
    "Volume (today)": "今日成交股数。高于均值的激增常标志着行情的启动或衰竭。",
    "Avg volume (3M)": "三个月的日均成交股数——使今日成交量有意义的基准。",
    "ADX (14)": "Average Directional Index — 由每日最高价和最低价构建的经典趋势强度指标。高于25＝趋势市场，均线信号有效；低于20＝震荡市场，信号易失真。不分方向：强劲的下跌趋势同样得分很高。",
    "ATR (14)": "Average True Range — 14个交易日内单日完整波动（含跳空）的平均值，以价格百分比显示。它校准一切对波动敏感的东西：区间宽度、离场缓冲、何为「过度延伸」。",
    "Risk/Reward": "至阻力区顶部的上行空间除以至支撑区底部的下行风险。高于2＝冒1的险博2以上的利（有利）；低于0.8＝回报配不上风险。",
    "Trend score": "主趋势的0–100评分：方向（SMA50对SMA200）、质量（价格与均线的%距离）、强度（60日斜率）、12-1动量和行情状态。高分＝已确立的健康上升趋势——但它不说明「现在」是否是好的买点。",
    "Entry score": "趋势内「此刻」的0–100评分：RSI、MACD、距支撑/阻力的距离、价格相对SMA50的乖离、成交量确认。趋势很好但入场分低，通常意味着：等待回调。",
    "Regime (ER)": "考夫曼效率比率（20个交易日）：价格净位移除以每日波动之和。接近1＝干净的趋势；接近0＝杂乱震荡。低于0.25时，均线信号频繁产生假买卖点。",
    "Momentum 12-1": "过去12个月（剔除最近1个月，因其易反转）的回报。学术上最稳健的动量指标：为正＝趋势仍有燃料。",
    "SMA50 vs SMA200": "50日与200日均线的%距离。刚交叉时接近0%且常失败；数个百分点的距离标志趋势已确立。",
    "Price vs SMA200": "价格高于（+）或低于（−）200日均线的百分比。大幅为正＝强劲但可能过度延伸；为负＝长期趋势已破坏。",
    "SMA slope (60d)": "均线本身在最近60个交易日上升或下降了多少。交叉可能仍「为正」而均线已开始拐头——斜率能提早捕捉这一点。",
    "Volume vs 20d avg": "今日成交量除以其20日均量。1.5倍以上放量的走势更有说服力；缩量突破更易失败。",
  },
};
/* fictional event dates */
const EARNINGS_DATES = {
  NVTK: "Jul 22, 2026", HWFD: "Jul 30, 2026", ENGD3: "Aug 06, 2026",
  IRNL: "Jul 17, 2026", VARJ3: "Aug 12, 2026", TERA: "Jul 28, 2026", LOGR: "Jul 24, 2026",
};
const OPTIONS_EXPIRIES = ["Jun 19, 2026", "Jul 17, 2026"];
/* management guidance accuracy (last 8 quarters, % of guidance hit) */
const GUIDANCE = { NVTK: 92, HWFD: 88, ENGD3: 84, IRNL: 71, VARJ3: 65, TERA: 78, WRLD: null, LOGR: 86 };
/* buybacks as a share of earnings */
const BUYBACK_PCT = { NVTK: 0.35, HWFD: 0.30, ENGD3: 0, IRNL: 0.25, VARJ3: 0, TERA: 0.10, WRLD: 0, LOGR: 0 };

/* ---------- i18n: UI chrome in 8 languages (analytical text localizes server-side in production) ---------- */
const LANGS = {
  en: { flag: "🇺🇸 EN", dir: "ltr", t: { nav_stocks: "Stocks", nav_screener: "Screener", nav_compare: "Compare", nav_portfolio: "Portfolio", nav_calendar: "Calendar", nav_backtest: "Backtest", tab_overview: "Overview", tab_valuation: "Valuation", tab_health: "Health", tab_dividends: "Dividends", tab_growth: "Past & Growth", tab_own: "Ownership & Insiders", tab_feed: "News & Social", tab_tech: "Technicals", tab_options: "Options", tab_verdict: "Verdict", tagline: "prototype · fictional data · base currency USD", note: "" } },
  pt: { flag: "🇧🇷 PT", dir: "ltr", t: { nav_stocks: "Ações", nav_screener: "Filtro", nav_compare: "Comparar", nav_portfolio: "Carteira", nav_calendar: "Agenda", nav_backtest: "Backtest", tab_overview: "Visão geral", tab_valuation: "Valuation", tab_health: "Saúde", tab_dividends: "Dividendos", tab_growth: "Passado & Crescimento", tab_own: "Sócios & Insiders", tab_feed: "Notícias & Social", tab_tech: "Análise técnica", tab_options: "Opções", tab_verdict: "Veredito", tagline: "protótipo · dados fictícios · moeda-base USD", note: "Interface traduzida — em produção, o conteúdo analítico chega localizado do servidor." } },
  es: { flag: "🇪🇸 ES", dir: "ltr", t: { nav_stocks: "Acciones", nav_screener: "Filtro", nav_compare: "Comparar", nav_portfolio: "Cartera", nav_calendar: "Agenda", nav_backtest: "Backtest", tab_overview: "Resumen", tab_valuation: "Valoración", tab_health: "Salud", tab_dividends: "Dividendos", tab_growth: "Pasado y Crecimiento", tab_own: "Propiedad e Insiders", tab_feed: "Noticias y Social", tab_tech: "Análisis técnico", tab_options: "Opciones", tab_verdict: "Veredicto", tagline: "prototipo · datos ficticios · moneda base USD", note: "Interfaz traducida — en producción, el contenido analítico llega localizado del servidor." } },
  fr: { flag: "🇫🇷 FR", dir: "ltr", t: { nav_stocks: "Actions", nav_screener: "Filtre", nav_compare: "Comparer", nav_portfolio: "Portefeuille", nav_calendar: "Agenda", nav_backtest: "Backtest", tab_overview: "Aperçu", tab_valuation: "Valorisation", tab_health: "Santé", tab_dividends: "Dividendes", tab_growth: "Passé & Croissance", tab_own: "Actionnariat & Initiés", tab_feed: "Actus & Social", tab_tech: "Analyse technique", tab_options: "Options", tab_verdict: "Verdict", tagline: "prototype · données fictives · devise de base USD", note: "Interface traduite — en production, le contenu analytique arrive localisé du serveur." } },
  he: { flag: "🇮🇱 HE", dir: "rtl", t: { nav_stocks: "מניות", nav_screener: "סינון", nav_compare: "השוואה", nav_portfolio: "תיק", nav_calendar: "יומן", nav_backtest: "בדיקה לאחור", tab_overview: "סקירה", tab_valuation: "הערכת שווי", tab_health: "איתנות", tab_dividends: "דיבידנדים", tab_growth: "עבר וצמיחה", tab_own: "בעלות ומקורבים", tab_feed: "חדשות ורשתות", tab_tech: "ניתוח טכני", tab_options: "אופציות", tab_verdict: "שורה תחתונה", tagline: "אב־טיפוס · נתונים בדיוניים · מטבע בסיס USD", note: "הממשק מתורגם — בגרסת הייצור התוכן האנליטי מגיע מתורגם מהשרת." } },
  ar: { flag: "🇸🇦 AR", dir: "rtl", t: { nav_stocks: "الأسهم", nav_screener: "الفرز", nav_compare: "مقارنة", nav_portfolio: "المحفظة", nav_calendar: "التقويم", nav_backtest: "اختبار رجعي", tab_overview: "نظرة عامة", tab_valuation: "التقييم", tab_health: "الملاءة", tab_dividends: "التوزيعات", tab_growth: "الماضي والنمو", tab_own: "الملكية والمطلعون", tab_feed: "الأخبار والتواصل", tab_tech: "التحليل الفني", tab_options: "الخيارات", tab_verdict: "الخلاصة", tagline: "نموذج أولي · بيانات افتراضية · العملة الأساس USD", note: "الواجهة مترجمة — في الإنتاج يصل المحتوى التحليلي مترجمًا من الخادم." } },
  ja: { flag: "🇯🇵 JA", dir: "ltr", t: { nav_stocks: "銘柄", nav_screener: "スクリーナー", nav_compare: "比較", nav_portfolio: "ポートフォリオ", nav_calendar: "カレンダー", nav_backtest: "バックテスト", tab_overview: "概要", tab_valuation: "バリュエーション", tab_health: "財務健全性", tab_dividends: "配当", tab_growth: "実績と成長", tab_own: "株主とインサイダー", tab_feed: "ニュース・SNS", tab_tech: "テクニカル", tab_options: "オプション", tab_verdict: "総合判定", tagline: "プロトタイプ · 架空データ · 基準通貨 USD", note: "UIは翻訳済み — 本番では分析コンテンツもサーバー側でローカライズされます。" } },
  zh: { flag: "🇨🇳 ZH", dir: "ltr", t: { nav_stocks: "股票", nav_screener: "筛选器", nav_compare: "对比", nav_portfolio: "投资组合", nav_calendar: "日历", nav_backtest: "回测", tab_overview: "概览", tab_valuation: "估值", tab_health: "财务健康", tab_dividends: "股息", tab_growth: "历史与增长", tab_own: "股权与内部人", tab_feed: "新闻与社交", tab_tech: "技术分析", tab_options: "期权", tab_verdict: "综合结论", tagline: "原型 · 虚构数据 · 基准货币 USD", note: "界面已翻译 — 正式版中分析内容将由服务器本地化提供。" } },
};

const LYNCH_TYPES = {
  fast: { name: "Fast Grower", color: C.up, desc: "Small/mid-size company growing earnings 20%+ a year — where the big multi-baggers come from.", strategy: "Hold while PEG < 1 and growth holds; watch for deceleration and rising debt." },
  stalwart: { name: "Stalwart", color: C.accent, desc: "Consolidated giant growing 10–12% a year. Good recession protection.", strategy: "Buy on dips, take profits after 30–50% gains and rotate into another discounted stalwart." },
  slow: { name: "Slow Grower", color: C.dim, desc: "Mature, grows near GDP. Nearly all of the return comes from the dividend.", strategy: "Only worth it for the dividend: demand a high yield, sustainable payout and controlled debt." },
  cyclical: { name: "Cyclical", color: C.warn, desc: "Earnings rise and fall with the economic cycle (steel, mining, autos, airlines).", strategy: "Timing is everything: buy at the cycle bottom (high P/E or losses), sell at the peak (low P/E!)." },
  turnaround: { name: "Turnaround", color: C.violet, desc: "Troubled company with a real shot at recovery. High risk, high reward.", strategy: "Track cash and debt quarter by quarter; exit if the recovery plan stalls." },
  asset: { name: "Asset Play", color: C.teal, desc: "Worth less on the exchange than the assets it holds (real estate, stakes, cash).", strategy: "Buy with a margin of safety to asset value and wait for the catalyst to unlock it." },
  etf: { name: "ETF", color: "#9AB6FF", desc: "A passive fund holding hundreds or thousands of stocks — diversification in a single ticker, no single-company risk.", strategy: "Core holding: buy regularly regardless of timing, keep costs low, and let individual stock picks orbit around it." },
  reit: { name: "REIT", color: "#FFA8C5", desc: "A real estate investment trust — owns income-producing property and must distribute at least 90% of taxable income as dividends.", strategy: "Judge it on FFO (not P/E), occupancy, lease duration and debt maturities. The dividend IS the product; rates are the main enemy." },
};
function classifyLynch(s) {
  if (s.kind === "etf") return "etf";
  if (s.kind === "reit") return "reit";
  const capUSD = (s.mktCap || 0) / (s._perUSD || 1);
  if (s.pb != null && s.pb > 0 && s.pb < 1) return "asset";                       // trading under book value
  if ((s.netMargin != null && s.netMargin < 0) || (!(s.pe > 0) && !(s.fwdPE > 0)))
    return "turnaround";                                                           // pre-profit / recovery story (incl. biotechs)
  if (s.pe > 0 && s.fwdPE > 0 && s.pe / s.fwdPE >= 2.2) return "cyclical";        // trailing P/E >> forward P/E: earnings rebounding (e.g. memory, steel)
  const g = s.epsGrowth ?? s.revGrowth ?? 0;
  if (g >= 20) return "fast";
  if (g >= 9 && capUSD >= 20) return "stalwart";
  if ((s.divYield ?? 0) >= 3.5 && g < 9) return "slow";
  if (capUSD >= 100) return "stalwart";
  return g >= 9 ? "fast" : "slow";
}
function relevantRatios(s, typeKey) {
  const { peg } = pegInfo(s);
  const R = {
    peg: { label: "PEG", v: peg === null ? "n/a" : peg, ok: peg !== null && peg < 1.2, note: "P/E ÷ EPS growth rate" },
    pe: { label: "P/E", v: s.pe > 0 ? s.pe : "neg.", ok: s.pe > 0 && s.pe < s.sectorPE, note: `sector at ${s.sectorPE}` },
    ps: { label: "P/S", v: s.ps, ok: s.ps < s.sectorPS, note: `sector at ${s.sectorPS} — key when earnings are noisy or negative` },
    pb: { label: "P/B", v: s.pb, ok: s.pb < 1, note: s.pb < 1 ? "trading below book value" : "above book value" },
    ev: { label: "EV/EBITDA", v: s.evEbitda, ok: s.evEbitda < 8, note: "capital-structure-neutral multiple" },
    dy: { label: "Div. yield", v: `${s.divYield}%`, ok: s.divYield > 4.5, note: `payout ${s.payout}%` },
    payout: { label: "Payout", v: `${s.payout}%`, ok: s.payout > 0 && s.payout < 70, note: s.payout >= 70 ? "little room for error" : "sustainable range" },
    roic: { label: "ROIC", v: `${s.roic}%`, ok: s.roic >= 12, note: "capital allocation quality" },
  };
  const map = {
    fast: ["peg", "ps", "ev", "roic"], stalwart: ["pe", "peg", "ps", "dy"], slow: ["dy", "payout", "pe", "ps"],
    cyclical: ["ev", "pb", "ps", "pe"], turnaround: ["ps", "ev", "pb", "pe"], asset: ["pb", "ev", "ps", "dy"],
    etf: ["pe", "dy", "ps", "pb"], reit: ["dy", "payout", "ev", "pb"],
  };
  const why = {
    fast: "For a fast grower, raw earnings multiples mislead — PEG and P/S vs. growth tell the real story.",
    stalwart: "For a stalwart, the question is the price paid for stability: P/E vs. sector and a fair PEG.",
    slow: "For a slow grower the dividend IS the thesis: yield, payout safety, then valuation.",
    cyclical: "For a cyclical, P/E is a trap. EV/EBITDA, P/B and P/S read the cycle far better.",
    turnaround: "With negative or depressed earnings, P/E is useless — P/S and EV/EBITDA carry the analysis.",
    asset: "For an asset play, everything orbits P/B: the discount to what the assets are really worth.",
    etf: "For an ETF these are look-through figures of the whole portfolio — what matters most is the expense ratio and the yield.",
    reit: "For a REIT, P/E overstates the price — yield, payout (90% is required by law) and leverage carry the analysis. FFO multiples beat P/E here.",
  };
  return { rows: map[typeKey].map((key) => R[key]), why: why[typeKey] };
}
const clamp6 = (v) => Math.max(0, Math.min(6, +v.toFixed(1)));
function buildScores(s, tech, price, fv) {
  const { peg } = pegInfo(s);
  const discount = 1 - price / fv;
  const valuation = clamp6(
    (discount > 0.25 ? 6 : discount > 0.1 ? 4.5 : discount > -0.05 ? 3 : 1.5) * 0.5 +
    (peg === null ? 1.5 : peg < 1 ? 5.5 : peg <= 1.5 ? 3.5 : 1.5) * 0.5
  );
  const future = clamp6(s.forecastG <= 0 ? 0.8 : s.forecastG / 4.5);
  const past = clamp6((s.roe > 0 ? s.roe / 5 : 0) * 0.6 + (s.netMargin > 0 ? Math.min(6, s.netMargin / 3) : 0) * 0.4);
  const health = clamp6((s.debtEq < 0.3 ? 6 : s.debtEq < 0.7 ? 4.5 : s.debtEq < 1.2 ? 3 : 1.5) * 0.7 + Math.min(6, s.coverage / 4) * 0.3);
  const dividends = clamp6(s.divYield * 0.8 + (s.payout > 0 && s.payout < 70 ? 1 : 0));
  const momentum = clamp6((tech.score + 100) / 33.3);
  return [
    { axis: "Value", v: valuation }, { axis: "Future", v: future }, { axis: "Past", v: past },
    { axis: "Health", v: health }, { axis: "Dividend", v: dividends }, { axis: "Momentum", v: momentum },
  ];
}

/* ---------- portfolio holdings (mock, qty + avg in LOCAL currency) ---------- */
const HOLDINGS = [
  { ticker: "NVTK", qty: 60, avg: 74.0 },
  { ticker: "ENGD3", qty: 900, avg: 22.4 },
  { ticker: "IRNL", qty: 250, avg: 26.5 },
  { ticker: "VARJ3", qty: 1500, avg: 7.9 },
];

/* ---------- UI primitives ---------- */
const Pill = ({ children, color, soft }) => (
  <span className="px-2 py-1 rounded-full text-xs font-semibold"
    style={{ background: soft ? `${color}22` : color, color: soft ? color : "#0D1321", fontFamily: FONT_HEAD, letterSpacing: 0.3 }}>
    {children}
  </span>
);
const Card = ({ title, sub, children, accent }) => (
  <div className="rounded-2xl p-4 sm:p-5" style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: accent ? `0 0 0 1px ${accent}55` : "none" }}>
    {title && (
      <div className="mb-3">
        <div className="text-sm font-bold" style={{ fontFamily: FONT_HEAD, color: C.text }}>{title}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: C.dim }}>{sub}</div>}
      </div>
    )}
    {children}
  </div>
);
const SignalDot = ({ ok }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: ok === true ? C.up : ok === false ? C.down : C.dim }} />
);
const CheckRow = ({ ok, label }) => (
  <div className="flex gap-2.5 items-start"><SignalDot ok={ok} /><div className="text-sm">{label}</div></div>
);
const tooltipStyle = { background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 10, color: C.text, fontSize: 12, fontFamily: FONT_MONO };
const sColor = (s) => (s > 0 ? C.up : s < 0 ? C.down : C.dim);
const sLabel = (s) => (s > 0 ? "bullish" : s < 0 ? "bearish" : "neutral");
const OWN_COLORS = [C.accent, C.up, C.violet, C.dim];
const PIE_COLORS = [C.up, C.accent, C.warn, C.violet, C.teal, C.down];

function EntryDial({ score, zone }) {
  const color = score >= 35 ? C.up : score <= -35 ? C.down : C.warn;
  const pct = (score + 100) / 2;
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-xs uppercase tracking-widest" style={{ color: C.dim }}>Technical read right now</div>
          <div className="text-2xl font-extrabold" style={{ color, fontFamily: FONT_HEAD }}>{zone}</div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: C.dim }}>score</div>
          <div className="text-xl font-bold" style={{ color, fontFamily: FONT_MONO }}>{score > 0 ? `+${score}` : score}</div>
        </div>
      </div>
      <div className="h-2.5 rounded-full relative" style={{ background: `linear-gradient(90deg, ${C.down}, ${C.warn}, ${C.up})`, opacity: 0.9 }}>
        <div className="absolute -top-1 w-1.5 rounded" style={{ left: `calc(${pct}% - 3px)`, height: 18, background: C.text, boxShadow: "0 0 10px rgba(255,255,255,.5)" }} />
      </div>
      <div className="flex justify-between mt-1 text-xs" style={{ color: C.dim }}>
        <span>exit</span><span>wait</span><span>entry</span>
      </div>
    </div>
  );
}
function CycleWave({ pos, color }) {
  const W = 320, H = 90, pad = 10;
  const pts = [];
  for (let i = 0; i <= 100; i++) {
    const x = pad + (i / 100) * (W - 2 * pad);
    const y = H / 2 - Math.sin((i / 100) * Math.PI * 2 - Math.PI / 2) * (H / 2 - pad);
    pts.push(`${x},${y}`);
  }
  const mx = pad + pos * (W - 2 * pad);
  const my = H / 2 - Math.sin(pos * Math.PI * 2 - Math.PI / 2) * (H / 2 - pad);
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full">
      <polyline points={pts.join(" ")} fill="none" stroke={C.line} strokeWidth="2.5" />
      <circle cx={mx} cy={my} r="7" fill={color} stroke={C.text} strokeWidth="2">
        <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
      </circle>
      {[["Bottom", 0], ["Expansion", 0.25], ["Peak", 0.5], ["Contraction", 0.75], ["Bottom", 1]].map(([l, p], i) => (
        <text key={i} x={pad + p * (W - 2 * pad)} y={H + 14} textAnchor="middle" fontSize="9" fill={C.dim} fontFamily={FONT_HEAD}>{l}</text>
      ))}
    </svg>
  );
}
function TurnaroundSteps({ steps, stage, color }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const done = i + 1 < stage, current = i + 1 === stage;
        return (
          <React.Fragment key={s}>
            <div className="flex-1 text-center">
              <div className="mx-auto w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ fontFamily: FONT_MONO, background: current ? color : done ? `${color}33` : C.panelSoft, color: current ? "#0D1321" : done ? color : C.dim, border: `1px solid ${current || done ? color : C.line}` }}>
                {i + 1}
              </div>
              <div className="text-xs mt-1" style={{ color: current ? C.text : C.dim, fontWeight: current ? 700 : 400 }}>{s}</div>
            </div>
            {i < steps.length - 1 && <div className="h-px flex-1" style={{ background: done ? color : C.line, minWidth: 8, marginBottom: 18 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
/* Revenue & expenses breakdown — hand-built 5-stage flow:
   segments → Revenue → (Cost of sales | Gross profit) →
   (R&D | Marketing | Personnel & admin | Other | Earnings) → (Dividends | Retained) */
function FlowBreakdown({ segments, rev, cos, gross, items, earn, profitable, divd, buyb, retained, fmt }) {
  const W = 800, H = 380, nw = 11;
  const colX = [4, 156, 312, 472, 642];
  const scale = 250 / rev;
  const minH = 5;
  const ribbon = (key, sx, sy0, sy1, tx, ty0, ty1, color) => {
    const mx = (sx + tx) / 2;
    return <path key={key} d={`M ${sx} ${sy0} C ${mx} ${sy0} ${mx} ${ty0} ${tx} ${ty0} L ${tx} ${ty1} C ${mx} ${ty1} ${mx} ${sy1} ${sx} ${sy1} Z`} fill={color} opacity="0.30" />;
  };
  // col0: segments
  const gap0 = 16;
  const segH = segments.map((s) => Math.max(minH, s.v * scale));
  let y = (H - (segH.reduce((a, b) => a + b, 0) + gap0 * (segments.length - 1))) / 2;
  const segN = segments.map((s, i) => { const node = { ...s, x: colX[0], y, h: segH[i] }; y += segH[i] + gap0; return node; });
  // col1: revenue
  const revH = rev * scale;
  const revN = { x: colX[1], y: (H - revH) / 2, h: revH };
  // col2: cost of sales + gross profit
  const cosH = Math.max(minH, cos * scale), grossH = Math.max(minH, gross * scale);
  let y2 = (H - (cosH + grossH + 16)) / 2;
  const cosN = { x: colX[2], y: y2, h: cosH };
  const grossN = { x: colX[2], y: y2 + cosH + 16, h: grossH };
  // col3: opex items (+ earnings)
  const col3 = [...items.map((it) => ({ ...it })), ...(profitable ? [{ n: "Earnings", v: earn, c: C.up, earn: true }] : [])];
  const gap3 = 9;
  const col3H = col3.map((it) => Math.max(minH, it.v * scale));
  const tot3 = col3H.reduce((a, b) => a + b, 0) + gap3 * (col3.length - 1);
  let y3 = Math.max(6, grossN.y + (grossN.h - tot3) / 2);
  if (y3 + tot3 > H - 6) y3 = Math.max(6, H - 6 - tot3);
  const col3N = col3.map((it, i) => { const node = { ...it, x: colX[3], y: y3, h: col3H[i] }; y3 += col3H[i] + gap3; return node; });
  // col4: dividends + retained (from earnings)
  const earnNode = col3N.find((n) => n.earn);
  let col4N = [];
  if (earnNode) {
    const parts = [];
    if (divd > 0) parts.push({ n: "Dividends", v: divd, c: C.teal });
    if (buyb > 0) parts.push({ n: "Buybacks", v: buyb, c: "#FF8FD8" });
    if (retained > 0) parts.push({ n: "Retained earnings", v: retained, c: "#2EC27E" });
    const gap4 = 9;
    const hs = parts.map((p) => Math.max(minH, p.v * scale));
    const tot4 = hs.reduce((a, b) => a + b, 0) + gap4 * (parts.length - 1);
    let y4 = Math.max(6, earnNode.y + (earnNode.h - tot4) / 2);
    col4N = parts.map((p, i) => { const node = { ...p, x: colX[4], y: y4, h: hs[i] }; y4 += hs[i] + gap4; return node; });
  }
  // links
  const links = [];
  let accIn = revN.y;
  segN.forEach((s, i) => { links.push(ribbon(`s${i}`, s.x + nw, s.y, s.y + s.h, revN.x, accIn, accIn + s.v * scale, C.accent)); accIn += s.v * scale; });
  links.push(ribbon("cos", revN.x + nw, revN.y, revN.y + cos * scale, cosN.x, cosN.y, cosN.y + cosN.h, C.down));
  links.push(ribbon("gp", revN.x + nw, revN.y + cos * scale, revN.y + revH, grossN.x, grossN.y, grossN.y + grossN.h, C.teal));
  let accG = grossN.y;
  col3N.forEach((n, i) => {
    links.push(ribbon(`o${i}`, grossN.x + nw, accG, accG + n.v * scale, n.x, n.y, n.y + n.h, n.c));
    accG += n.v * scale;
  });
  if (earnNode && col4N.length) {
    let accE = earnNode.y;
    col4N.forEach((n, i) => {
      links.push(ribbon(`d${i}`, earnNode.x + nw, accE, accE + n.v * scale, n.x, n.y, n.y + n.h, n.c));
      accE += n.v * scale;
    });
  }
  const Node = ({ n: node, name, color, val }) => (
    <g>
      <rect x={node.x} y={node.y} width={nw} height={node.h} rx="2" fill={color} />
      <text x={node.x + nw + 4} y={node.y + node.h / 2 - 2} fontSize="9.5" fontWeight="700" fontFamily={FONT_HEAD} fill={C.text}>{name}</text>
      <text x={node.x + nw + 4} y={node.y + node.h / 2 + 9} fontSize="8.5" fontFamily={FONT_MONO} fill={C.dim}>{fmt(val)}</text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {links}
      {segN.map((s, i) => <Node key={`sg${i}`} n={s} name={s.n} color={i === 0 ? C.accent : "#4F74C9"} val={s.v} />)}
      <Node n={revN} name="Revenue" color={C.accent} val={rev} />
      <Node n={cosN} name="Cost of sales" color={C.down} val={cos} />
      <Node n={grossN} name="Gross profit" color={C.teal} val={gross} />
      {col3N.map((n, i) => <Node key={`c3${i}`} n={n} name={n.n} color={n.c} val={n.v} />)}
      {col4N.map((n, i) => <Node key={`c4${i}`} n={n} name={n.n} color={n.c} val={n.v} />)}
    </svg>
  );
}
/* Fundamentals donut — market cap ring vs revenue and earnings arcs */
function FundamentalsDonut({ mktCapM, revM, earnM, fmt }) {
  const R1 = 78, R2 = 56, cx = 100, cy = 100;
  const C1 = 2 * Math.PI * R1, C2 = 2 * Math.PI * R2;
  const fRev = Math.min(1, revM / mktCapM);
  const fE = Math.min(1, Math.abs(earnM) / mktCapM);
  const eColor = earnM >= 0 ? C.teal : C.down;
  return (
    <svg viewBox="0 0 200 200" style={{ width: 190, height: 190 }}>
      <circle cx={cx} cy={cy} r={R1} fill="none" stroke={C.panelSoft} strokeWidth="15" />
      <circle cx={cx} cy={cy} r={R1} fill="none" stroke={C.accent} strokeWidth="15" strokeLinecap="round"
        strokeDasharray={`${fRev * C1} ${C1}`} transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={R2} fill="none" stroke={C.panelSoft} strokeWidth="11" />
      <circle cx={cx} cy={cy} r={R2} fill="none" stroke={eColor} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${fE * C2} ${C2}`} transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="10" fill={C.dim} fontFamily={FONT_HEAD}>Market cap</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="14" fontWeight="700" fill={C.text} fontFamily={FONT_MONO}>{fmt(mktCapM)}</text>
    </svg>
  );
}
/* Live price chart with timeframe selector (1D…Max) */
function PriceChart({ data, intraday, tf, setTf, k, sym }) {
  const TFS = ["1D", "5D", "1M", "YTD", "3M", "6M", "1Y", "5Y", "Max"];
  let pts;
  if (tf === "1D") pts = intraday.d1;
  else if (tf === "5D") pts = intraday.d5;
  else if (tf === "YTD") {
    const jan = new Date(new Date().getFullYear(), 0, 1).getTime();
    pts = data.filter((d) => d.ts >= jan).map((d) => ({ l: d.date, p: d.close }));
  } else {
    const counts = { "1M": 22, "3M": 66, "6M": 130, "1Y": 252, "5Y": 1260, Max: data.length };
    const nLong = counts[tf] > 300;
    pts = data.slice(-counts[tf]).map((d) => ({ l: nLong ? d.dLong : d.date, p: d.close }));
  }
  const conv = pts.map((x) => ({ l: x.l, p: +(x.p * k).toFixed(2) }));
  const first = conv[0]?.p ?? 1, lastP = conv[conv.length - 1]?.p ?? 1;
  const chg = (lastP / first - 1) * 100;
  const up = chg >= 0, col = up ? C.up : C.down;
  return (
    <div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={conv}>
            <defs>
              <linearGradient id="pcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={0.35} />
                <stop offset="100%" stopColor={col} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="l" tick={{ fill: C.dim, fontSize: 9 }} minTickGap={55} />
            <YAxis orientation="right" domain={["auto", "auto"]} tick={{ fill: C.dim, fontSize: 10, fontFamily: FONT_MONO }} width={52} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${sym}${v}`} />
            <Area dataKey="p" name="Price" stroke={col} strokeWidth={2} fill="url(#pcGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
        {TFS.map((t) => (
          <button key={t} onClick={() => setTf(t)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
            style={{ fontFamily: FONT_MONO, background: tf === t ? C.panelSoft : "transparent", border: `1px solid ${tf === t ? C.accent : C.line}`, color: tf === t ? C.text : C.dim }}>
            {t}
          </button>
        ))}
        <span className="ml-auto px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap"
          style={{ fontFamily: FONT_MONO, background: `${col}1c`, color: col }}>
          {up ? "+" : ""}{chg.toLocaleString("en-US", { maximumFractionDigits: chg > 100 ? 0 : 2 })}%
        </span>
      </div>
    </div>
  );
}

/* mini snowflake for competitor cards */
function MiniSnowflake({ data, color, size = 118 }) {
  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="82%">
          <PolarGrid stroke={C.line} />
          <PolarAngleAxis dataKey="axis" tick={false} />
          <Radar dataKey="v" stroke={color} fill={color} fillOpacity={0.5} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
/* range bar (day's range / 52-week range) */
function RangeBar({ lo, hi, cur, fmtLo, fmtHi }) {
  const pct = hi > lo ? Math.min(100, Math.max(0, ((cur - lo) / (hi - lo)) * 100)) : 50;
  return (
    <div>
      <div className="relative h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${C.down}66, ${C.warn}55, ${C.up}66)` }}>
        <div className="absolute -top-1 w-1.5 rounded" style={{ left: `calc(${pct}% - 3px)`, height: 16, background: C.text, boxShadow: "0 0 8px rgba(255,255,255,.5)" }} />
      </div>
      <div className="flex justify-between mt-1.5 text-xs" style={{ color: C.dim, fontFamily: FONT_MONO }}>
        <span>{fmtLo}</span><span>{fmtHi}</span>
      </div>
    </div>
  );
}
/* balance sheet treemap cell — every block numbered, matching the legend */
const BSNode = (props) => {
  const { x, y, width, height, name, value, fill, depth, index, fmt } = props;
  if (depth !== 1) return null;
  const big = width > 86 && height > 42;
  const med = !big && width > 46 && height > 26;
  // adaptive number size so the index ALWAYS fits, even on slivers
  const numSize = Math.max(7, Math.min(11, Math.floor(Math.min(width - 2, height - 2) * 0.7)));
  const fits = width > 9 && height > 9;
  const cx = x + width / 2, cy = y + height / 2;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke={C.bg} strokeWidth={2.5} rx={3} />
      {big && (
        <>
          <text x={x + 8} y={y + 17} fontSize="11" fontWeight="700" fontFamily={FONT_HEAD} fill="#0D1321">{index + 1}. {name}</text>
          <text x={x + 8} y={y + 31} fontSize="10" fontFamily={FONT_MONO} fill="#0D1321" opacity="0.78">{fmt ? fmt(value) : value}</text>
        </>
      )}
      {med && (
        <>
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9.5" fontWeight="700" fontFamily={FONT_MONO} fill="#0D1321">{index + 1}</text>
          <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8" fontFamily={FONT_MONO} fill="#0D1321" opacity="0.78">{fmt ? fmt(value) : value}</text>
        </>
      )}
      {!big && !med && fits && (
        <text x={cx} y={cy + numSize * 0.35} textAnchor="middle" fontSize={numSize} fontWeight="700" fontFamily={FONT_MONO} fill="#0D1321">{index + 1}</text>
      )}
    </g>
  );
};

/* ============================ APP (LIVE DATA) ============================ */
/* Consumes the free backend: /api/universe + /api/prices?ticker=X          */

const API_BASE = "/api";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const FREE_WL = 20;
const MAG7 = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA"];

/* generic currency symbols — any other code falls back to "CODE " prefix */
const SYM = {
  USD: "$", BRL: "R$", EUR: "€", GBP: "£", ILS: "₪", SEK: "kr ", NOK: "kr ", DKK: "kr ",
  JPY: "¥", CNY: "¥", HKD: "HK$", KRW: "₩", INR: "₹", CHF: "CHF ", CAD: "C$", AUD: "A$",
  SGD: "S$", TWD: "NT$", MXN: "MX$", ZAR: "R ", PLN: "zł ", TRY: "₺", ARS: "AR$", THB: "฿",
};
const symOf = (c) => SYM[c] ?? `${c} `;

/* UI strings (fallback to English when a key is missing) */
const XT = {
  en: { seg_link: "📄 Official segment note (10-K on EDGAR) — the real revenue sources", tag: "real market data · updated daily · educational, not investment advice", lastclose: "last close (EOD data)", listed: "Listed in {c} — display:", load_uni: "loading real market data…", load_px: "loading {t} price history…", wl_empty: "Your watchlist is empty — open any stock and tap ☆ to add it.", sig_t: "⚡ Significant changes", sig_sub: "detected by the daily collector", notes_t: "📝 My thesis & notes", notes_sub: "kept in this browser session", notes_ph: "Why you own it — and what would make you sell.", snow_t: "Snowflake", snow_sub: "six dimensions, 0–6 — Momentum comes from the technical read", fsum_t: "Fundamentals summary", fsum_sub: "how revenue and earnings compare to what the market pays", keyfin_t: "Key financials", keyfin_sub: "LTM · {c} · real data", peers_t: "Peers in your universe", peers_sub: "{s} — from the stocks you track", open_w: "open →", whatif_t: "💸 What if I had invested?", whatif_sub: "real price history · excludes taxes & fees", amount: "Amount (USD)", worth: "Worth today", ret_t: "Total return", shares_t: "Shares bought", estdiv: "Est. dividends", buyat: "Buying at {p} back in {d} (local-currency price return).", dcf_t: "Interactive DCF — your assumptions", dcf_sub: "5y EPS growth + 12x terminal, discounted · drag & watch fair value recompute", dcf_g: "EPS growth (next 5y)", dcf_r: "Discount rate", dcf_fv: "your fair value", dcf_up: "implied upside vs. price", peg_t: "PEG thermometer", peg_sub: "P/E ÷ expected annual EPS growth (%)", an_sub: "consensus of {n} analysts (Yahoo) — companies' own guidance isn't in free feeds", an_mean: "Mean target", an_move: "Implied move", an_rate: "Rating", an_range: "Target range vs. current price", an_note: "Analyst targets are opinions, often lag reality, and skew optimistic — treat as one input, not truth.", pevs_t: "P/E vs. peers in your universe", pevs_sub: "peer average {a}x — {t} in blue", rvb_t: "Revenue & expenses breakdown", rvb_sub: "LTM · {c} · R&D and SG&A from real filings — revenue segments (per product/region) still need paid data", hist_t: "Earnings & revenue history", hist_sub: "real annual filings · {c} millions", bs_t: "Balance sheet", bs_sub: "assets vs. liabilities + equity · {c} billions · latest filing", ki_t: "Key information", ki_sub: "latest filing", divy_t: "Dividend yield: {y}%", divy_sub: "position vs. the market", pay_t: "Payout ratio: {p}%", pay_sub: "share of earnings paid out as dividends", sus: "sustainable", str2: "stretched", risk_w: "at risk", reit_note: "REITs must distribute ≥90% of taxable income — a high payout here is structural, not a red flag.", ts_t: "Trading stats", sma_sub: "support {s} · resistance {r} (60 sessions) · real EOD prices", sig2_t: "Signal checklist", sig2_sub: "entry/exit score from the standard reads", ck_tu: "SMA50 above SMA200 — primary uptrend", ck_td: "SMA50 below SMA200 — primary downtrend", ck_pa: "Price above the 200-day average", ck_pb: "Price below the 200-day average", ck_nh: "Not enough history", ck_ovs: "oversold", ck_ovb: "overbought", ck_neu: "neutral", ck_mu: "MACD above signal — positive momentum", ck_md: "MACD below signal — negative momentum", verdict_t: "Hybrid verdict", verdict_sub: "fundamentals + technicals, on real data", v1t: "Solid fundamentals + favorable technicals", v1d: "Thesis and timing point the same way — the setup this hybrid method looks for.", v2t: "Good company, bad moment", v2d: "Fundamentals pass, but the chart doesn't confirm an entry yet.", v3t: "Pretty chart, weak fundamentals", v3d: "Technicals flag an entry, but fundamentals don't support a long-term position.", v4t: "Avoid for now", v4d: "Neither fundamentals nor technicals favor an entry. Keep on the watchlist.", vref: "Reference levels: support {s} · resistance {r}{f}. Educational — not investment advice.", fv_word: " · simple DCF fair value {v}", scr_sub: "fundamental filters over your live universe", res_t: "Results — {a} of {b}", res_sub: "tap a stock for its full analysis and technical zone", all_w: "All", cmp_sub: "best value per row highlighted — real data, USD", snowov_t: "Snowflake overlay", snowov_sub: "fundamental axes (momentum needs each chart loaded)", bt_rule: "rule: long only while SMA50 > SMA200 and price > SMA200 · REAL prices", bt_btn: "▶ Run backtest ({n} histories)", bt_load: "loading price histories… {a}/{b}", bt_err: "Not enough history for this selection — try a wider period or the whole list.", bt_ret: "Strategy return", bt_bh: "Buy & hold", bt_dd: "Strategy max DD", bt_bhdd: "B&H max DD", bt_note: "Real simulation on actual price history, including a 0.1% cost per trade. Past performance never guarantees future results.", bt_scope: "Scope", bt_all: "Whole list", bt_period: "Period", bt_from: "From", bt_to: "To", bt_rerun: "↻ Run again", soon: " — coming soon", cs_note: "This module needs a paid data source. Everything else runs on real, free, daily-updated data.", opt_body: "Live options chains, implied volatility and strategy ideas need a licensed real-time options feed.", soc_t: "Social sentiment — coming soon", soc_b: "Reddit/X sentiment needs paid APIs. The headlines above are real and free.", ins_none: "No open-market buys or sells in the recent filings — only routine grants/exercises.", si: "Sign in", ca: "Create free account", no_acc: "No account? Create one free →", have_acc: "Already have an account? Sign in →", free_note: "Free plan: watchlist up to {w} stocks · 5 new-ticker searches/day.", my_list: "My list", all_cached: "All cached", category: "Category", playbook: "Playbook", ratiosFor: "Key ratios for a {t}", aboutT: "About {n}", thesis_t: "✨ AI-generated thesis", thesis_sub: "built from live metrics, analyst consensus, insiders and technicals — a starting point, not advice", ins_t: "Insider activity", ins_sub: "SEC Form 4 — parsed buys & sells (US listings)", buys: "buys", sells: "sells", grants: "grants/other", ins_note: "Open-market buys (code P) matter most — grants and option exercises are routine compensation.", analyst_t: "Analyst forecast", news_t: "Latest news", fund_score: "fundamental score", tech_read: "technical read", bt_what: "What does the backtest do?", bt_expl: "It replays this app's timing rule (hold a stock only while SMA50 > SMA200 and price > SMA200) over the real price history of everything you track, and compares it with simply buying and holding. It answers: would this timing filter have helped, and with how much smaller drawdowns?", bt_rule_l: "Rule", bt_r_v2: "v2 · regime + buffer", bt_r_classic: "Classic · daily cross", bt_rule2: "rule v2: weekly entries when SMA50 > SMA200, price > SMA200 and the regime isn't ranging · exits checked daily, only when price closes 1.5% below the SMA200 · 0.1% cost per trade · REAL prices", bt_expl2: "Rule v2 attacks the classic filter's biggest weakness — whipsaw in sideways markets — without reacting late to crashes. Entries are confirmed only once a week and skipped when the regime is ranging (Efficiency Ratio < 0.25); exits are checked every day but with a buffer, selling only when price closes 1.5% below the SMA200. Both rules pay a 0.1% cost per trade, so fewer round-trips actually count. Compare with buy & hold on return, drawdown, and return per unit of drawdown.", bt_eff: "Return ÷ max DD", bt_eff_bh: "B&H return ÷ DD", bt_trades: "Entries", bt_time: "Time invested", bt_eff_note: "In strong bull markets, a timing filter rarely beats buy & hold on raw return — its job is earning a similar return with smaller falls. That's what 'Return ÷ max DD' measures: higher is better.", scr_load: "Load technical analysis for the whole list", scr_load_ing: "analyzing", scr_buy: "Technical: BUY", scr_trend: "Trend ≥ 60", bt_csv: "Export curve (CSV)", tbt_t: "Did this signal work on this stock?", tbt_sub: "both rules simulated on this stock's own history ({y} yrs, 0.1% cost per trade) vs simply buying and holding", tbt_cl: "Classic", ck_div_b: "Bearish RSI divergence — price made a higher high, RSI didn't: trend losing force", ck_div_u: "Bullish RSI divergence — price made a lower low, RSI didn't: selling losing force", ck_str_hi: "Price more stretched above its SMA200 than {p}% of its own history — elevated pullback risk", ck_str_lo: "Price closer to its SMA200 than {p}% of its history — rare entry in this trend", sma_sub2: "support zone {s1}–{s2} · resistance zone {r1}–{r2} (60 sessions ± ATR) · real EOD prices", atr_l: "ATR (14)", rr_l: "Risk/Reward", ck_rr_g: "Risk/Reward {r} to the zones — favorable ratio", ck_rr_m: "Risk/Reward {r} — neutral ratio", ck_rr_b: "Risk/Reward {r} — limited upside vs. downside", regime_t: "Regime & trend quality", regime_sub: "Efficiency Ratio (20 sessions) — how cleanly price is moving", reg_range: "Range", reg_trans: "Transition", reg_trend: "Trending", trend_s: "Trend score", entry_s: "Entry score", te_best: "Trend and entry point the same way.", te_pull: "Strong trend, stretched entry — consider waiting for a pullback.", te_ctr: "Attractive entry but weak trend — counter-trend risk.", te_no: "Neither the trend nor the entry looks favorable.", gap_mas: "SMA50 vs SMA200", gap_px: "Price vs SMA200", slope50_l: "SMA50 slope (60d)", slope200_l: "SMA200 slope (60d)", mom_l: "Momentum 12-1", vol20_l: "Volume vs 20d avg", ck_vol_hi: "Volume {x}× the 20-day average — the move has confirmation", ck_vol_lo: "Volume {x}× the 20-day average — weak confirmation", ck_reg_t: "Trending regime (ER {e}) — moving-average signals are reliable here", ck_reg_r: "Range regime (ER {e}) — MA signals prone to whipsaw", ck_reg_x: "Transitional regime (ER {e}) — trend not yet established", ck_mom_u: "12-month momentum positive ({m}%)", ck_mom_d: "12-month momentum negative ({m}%)", refresh_btn: "↻ Refresh", refresh_ing: "updating…", refresh_ok: "updated", refresh_err: "refresh failed — try again in a minute", dev_link: "🔬 Development-stage company — check the latest SEC filings and the News tab." },
  pt: { seg_link: "📄 Nota oficial de segmentos (10-K na EDGAR) — as fontes reais de receita", tag: "dados reais de mercado · atualização diária · educacional, não é recomendação", lastclose: "último fechamento (dados EOD)", listed: "Listada em {c} — exibir:", load_uni: "carregando dados reais de mercado…", load_px: "carregando histórico de {t}…", wl_empty: "Sua watchlist está vazia — abra uma ação e toque em ☆ para adicionar.", sig_t: "⚡ Mudanças relevantes", sig_sub: "detectadas pela coleta diária", notes_t: "📝 Minha tese & anotações", notes_sub: "guardadas nesta sessão do navegador", notes_ph: "Por que você tem essa ação — e o que te faria vender.", snow_t: "Floco de neve", snow_sub: "seis dimensões, 0–6 — Momentum vem da leitura técnica", fsum_t: "Resumo dos fundamentos", fsum_sub: "como receita e lucro se comparam ao que o mercado paga", keyfin_t: "Indicadores financeiros", keyfin_sub: "LTM · {c} · dados reais", peers_t: "Pares no seu universo", peers_sub: "{s} — entre as ações que você acompanha", open_w: "abrir →", whatif_t: "💸 E se eu tivesse investido?", whatif_sub: "histórico real de preços · sem impostos e taxas", amount: "Valor (USD)", worth: "Valor hoje", ret_t: "Retorno total", shares_t: "Ações compradas", estdiv: "Dividendos est.", buyat: "Comprando a {p} em {d} (retorno em moeda local).", dcf_t: "DCF interativo — suas premissas", dcf_sub: "crescimento do LPA 5a + terminal 12x, descontado · arraste e veja o valor justo recalcular", dcf_g: "Crescimento do LPA (5 anos)", dcf_r: "Taxa de desconto", dcf_fv: "seu valor justo", dcf_up: "upside implícito vs. preço", peg_t: "Termômetro PEG", peg_sub: "P/L ÷ crescimento anual esperado do LPA (%)", an_sub: "consenso de {n} analistas (Yahoo) — guidance da própria empresa não existe em feed grátis", an_mean: "Alvo médio", an_move: "Movimento implícito", an_rate: "Recomendação", an_range: "Faixa de alvos vs. preço atual", an_note: "Alvos de analistas são opiniões, chegam atrasados e tendem ao otimismo — trate como um insumo, não verdade.", pevs_t: "P/L vs. pares do seu universo", pevs_sub: "média dos pares {a}x — {t} em azul", rvb_t: "Divisão de receita e despesas", rvb_sub: "LTM · {c} · P&D e SG&A de balanços reais — segmentos de receita (por produto/região) ainda exigem dados pagos", hist_t: "Histórico de lucro e receita", hist_sub: "balanços anuais reais · {c} milhões", bs_t: "Balanço patrimonial", bs_sub: "ativos vs. passivos + patrimônio · {c} bilhões · último balanço", ki_t: "Informações-chave", ki_sub: "último balanço", divy_t: "Dividend yield: {y}%", divy_sub: "posição em relação ao mercado", pay_t: "Payout: {p}%", pay_sub: "fatia do lucro paga em dividendos", sus: "sustentável", str2: "esticado", risk_w: "em risco", reit_note: "REITs precisam distribuir ≥90% do lucro tributável — payout alto aqui é estrutural, não alerta.", ts_t: "Estatísticas de negociação", sma_sub: "suporte {s} · resistência {r} (60 pregões) · preços EOD reais", sig2_t: "Checklist de sinais", sig2_sub: "nota de entrada/saída pelas leituras clássicas", ck_tu: "SMA50 acima da SMA200 — tendência primária de alta", ck_td: "SMA50 abaixo da SMA200 — tendência primária de baixa", ck_pa: "Preço acima da média de 200 dias", ck_pb: "Preço abaixo da média de 200 dias", ck_nh: "Histórico insuficiente", ck_ovs: "sobrevendido", ck_ovb: "sobrecomprado", ck_neu: "neutro", ck_mu: "MACD acima do sinal — momentum positivo", ck_md: "MACD abaixo do sinal — momentum negativo", verdict_t: "Veredito híbrido", verdict_sub: "fundamentos + técnica, sobre dados reais", v1t: "Fundamentos sólidos + técnica favorável", v1d: "Tese e timing apontam na mesma direção — o cenário que este método híbrido procura.", v2t: "Boa empresa, momento ruim", v2d: "Os fundamentos passam, mas o gráfico ainda não confirma a entrada.", v3t: "Gráfico bonito, fundamentos fracos", v3d: "A técnica sinaliza entrada, mas os fundamentos não sustentam posição de longo prazo.", v4t: "Evitar por enquanto", v4d: "Nem fundamentos nem técnica favorecem entrada. Mantenha na watchlist.", vref: "Níveis de referência: suporte {s} · resistência {r}{f}. Educacional — não é recomendação.", fv_word: " · valor justo (DCF simples) {v}", scr_sub: "filtros fundamentalistas sobre seu universo ao vivo", res_t: "Resultados — {a} de {b}", res_sub: "toque numa ação para a análise completa e a zona técnica", all_w: "Todas", cmp_sub: "melhor valor de cada linha destacado — dados reais, USD", snowov_t: "Flocos sobrepostos", snowov_sub: "eixos fundamentalistas (momentum exige cada gráfico carregado)", bt_rule: "regra: comprado apenas com SMA50 > SMA200 e preço > SMA200 · preços REAIS", bt_btn: "▶ Rodar backtest ({n} históricos)", bt_load: "carregando históricos… {a}/{b}", bt_err: "Histórico insuficiente para esta seleção — tente período maior ou a lista inteira.", bt_ret: "Retorno da estratégia", bt_bh: "Comprar e segurar", bt_dd: "Queda máx. (estratégia)", bt_bhdd: "Queda máx. (B&H)", bt_note: "Simulação real sobre o histórico verdadeiro, incluindo custo de 0,1% por trade. Desempenho passado nunca garante o futuro.", bt_scope: "Escopo", bt_all: "Lista inteira", bt_period: "Período", bt_from: "De", bt_to: "Até", bt_rerun: "↻ Rodar de novo", soon: " — em breve", cs_note: "Este módulo exige fonte de dados paga. Todo o resto roda com dados reais, gratuitos e diários.", opt_body: "Cadeias de opções ao vivo, volatilidade implícita e ideias de estratégia exigem feed licenciado em tempo real.", soc_t: "Sentimento social — em breve", soc_b: "Sentimento de Reddit/X exige APIs pagas. As manchetes acima são reais e gratuitas.", ins_none: "Sem compras ou vendas no mercado aberto nos filings recentes — apenas grants/exercícios de rotina.", si: "Entrar", ca: "Criar conta grátis", no_acc: "Sem conta? Crie uma grátis →", have_acc: "Já tem conta? Entrar →", free_note: "Plano grátis: watchlist de até {w} ações · 5 pesquisas novas/dia.", my_list: "Minha lista", all_cached: "Todas em cache", category: "Categoria", playbook: "Estratégia", ratiosFor: "Indicadores-chave para {t}", aboutT: "Sobre a {n}", thesis_t: "✨ Tese gerada por IA", thesis_sub: "montada com métricas reais, consenso de analistas, insiders e técnica — ponto de partida, não recomendação", ins_t: "Atividade de insiders", ins_sub: "SEC Form 4 — compras e vendas extraídas (listagens dos EUA)", buys: "compras", sells: "vendas", grants: "grants/outros", ins_note: "Compras no mercado aberto (código P) são o que importa — grants e exercício de opções são remuneração de rotina.", analyst_t: "Previsão dos analistas", news_t: "Últimas notícias", fund_score: "nota fundamentalista", tech_read: "leitura técnica", bt_what: "O que o backtest faz?", bt_expl: "Ele reexecuta a regra de timing do app (manter a ação apenas enquanto a SMA50 > SMA200 e o preço > SMA200) sobre o histórico real de tudo que você acompanha, e compara com simplesmente comprar e segurar. Responde: esse filtro de timing teria ajudado, e com quedas quanto menores?", bt_rule_l: "Regra", bt_r_v2: "v2 · regime + folga", bt_r_classic: "Clássica · cruzamento diário", bt_rule2: "regra v2: entradas semanais com SMA50 > SMA200, preço > SMA200 e regime fora de lateralização · saída avaliada diariamente, só se o preço fechar 1,5% abaixo da SMA200 · custo de 0,1% por trade · preços REAIS", bt_expl2: "A regra v2 ataca a maior fraqueza do filtro clássico — as violinadas em mercado lateral — sem reagir tarde a quedas fortes. As entradas são confirmadas só uma vez por semana e puladas quando o regime está lateral (Efficiency Ratio < 0,25); as saídas são avaliadas todo dia, mas com folga: só vende quando o preço fecha 1,5% abaixo da SMA200. As duas regras pagam 0,1% de custo por trade, então operar menos conta de verdade. Compare com o buy & hold em retorno, queda máxima e retorno por unidade de queda.", bt_eff: "Retorno ÷ queda máx.", bt_eff_bh: "B&H: retorno ÷ queda", bt_trades: "Entradas", bt_time: "Tempo comprado", bt_eff_note: "Em bull markets fortes, um filtro de timing raramente vence o buy & hold em retorno bruto — o papel dele é entregar retorno parecido com quedas menores. É isso que 'Retorno ÷ queda máx.' mede: quanto maior, melhor.", scr_load: "Carregar análise técnica da lista inteira", scr_load_ing: "analisando", scr_buy: "Técnica: BUY", scr_trend: "Tendência ≥ 60", bt_csv: "Exportar curva (CSV)", tbt_t: "Esse sinal funcionou nesta ação?", tbt_sub: "as duas regras simuladas no histórico desta própria ação ({y} anos, custo de 0,1% por trade) vs simplesmente comprar e segurar", tbt_cl: "Clássica", ck_div_b: "Divergência baixista de RSI — o preço fez topo mais alto, o RSI não: tendência perdendo força", ck_div_u: "Divergência altista de RSI — o preço fez fundo mais baixo, o RSI não: venda perdendo força", ck_str_hi: "Preço mais esticado acima da SMA200 do que em {p}% do próprio histórico — risco elevado de correção", ck_str_lo: "Preço mais perto da SMA200 do que em {p}% do histórico — entrada rara nesta tendência", sma_sub2: "zona de suporte {s1}–{s2} · zona de resistência {r1}–{r2} (60 pregões ± ATR) · preços EOD reais", atr_l: "ATR (14)", rr_l: "Risco/Retorno", ck_rr_g: "Risco/Retorno {r} até as zonas — relação favorável", ck_rr_m: "Risco/Retorno {r} — relação neutra", ck_rr_b: "Risco/Retorno {r} — potencial limitado vs. risco", regime_t: "Regime & qualidade da tendência", regime_sub: "Efficiency Ratio (20 pregões) — quão limpo é o movimento do preço", reg_range: "Lateralização", reg_trans: "Transição", reg_trend: "Tendência", trend_s: "Nota da tendência", entry_s: "Nota de entrada", te_best: "Tendência e entrada apontam na mesma direção.", te_pull: "Tendência forte, entrada esticada — considere aguardar um pullback.", te_ctr: "Entrada atrativa mas tendência fraca — risco de operar contra a maré.", te_no: "Nem a tendência nem a entrada estão favoráveis.", gap_mas: "SMA50 vs SMA200", gap_px: "Preço vs SMA200", slope50_l: "Inclinação SMA50 (60d)", slope200_l: "Inclinação SMA200 (60d)", mom_l: "Momentum 12-1", vol20_l: "Volume vs média 20d", ck_vol_hi: "Volume {x}× a média de 20 dias — movimento com confirmação", ck_vol_lo: "Volume {x}× a média de 20 dias — confirmação fraca", ck_reg_t: "Regime de tendência (ER {e}) — sinais de médias móveis confiáveis aqui", ck_reg_r: "Regime lateral (ER {e}) — sinais de médias sujeitos a violinadas", ck_reg_x: "Regime de transição (ER {e}) — tendência ainda não estabelecida", ck_mom_u: "Momentum de 12 meses positivo ({m}%)", ck_mom_d: "Momentum de 12 meses negativo ({m}%)", refresh_btn: "↻ Atualizar", refresh_ing: "atualizando…", refresh_ok: "atualizado", refresh_err: "falha ao atualizar — tente de novo em um minuto", dev_link: "🔬 Empresa em estágio de desenvolvimento — confira os últimos filings na SEC e a aba de notícias." },
  es: { seg_link: "📄 Nota oficial de segmentos (10-K en EDGAR) — las fuentes reales de ingresos", tag: "datos reales de mercado · actualización diaria · educativo, no es consejo", lastclose: "último cierre (datos EOD)", listed: "Cotiza en {c} — mostrar:", load_uni: "cargando datos reales…", load_px: "cargando historial de {t}…", wl_empty: "Tu watchlist está vacía — abre una acción y toca ☆ para añadirla.", sig_t: "⚡ Cambios relevantes", sig_sub: "detectados por la recolección diaria", notes_t: "📝 Mi tesis y notas", notes_sub: "guardadas en esta sesión", notes_ph: "Por qué la tienes — y qué te haría vender.", snow_t: "Copo de nieve", snow_sub: "seis dimensiones, 0–6 — Momentum viene de la lectura técnica", fsum_t: "Resumen de fundamentos", fsum_sub: "cómo se comparan ingresos y beneficios con lo que paga el mercado", keyfin_t: "Indicadores financieros", keyfin_sub: "LTM · {c} · datos reales", peers_t: "Pares en tu universo", peers_sub: "{s} — entre las acciones que sigues", open_w: "abrir →", whatif_t: "💸 ¿Y si hubiera invertido?", whatif_sub: "historial real · sin impuestos ni comisiones", amount: "Importe (USD)", worth: "Valor hoy", ret_t: "Retorno total", shares_t: "Acciones compradas", estdiv: "Dividendos est.", buyat: "Comprando a {p} en {d} (retorno en moneda local).", dcf_t: "DCF interactivo — tus supuestos", dcf_sub: "crecimiento BPA 5a + terminal 12x, descontado · arrastra y mira recalcular", dcf_g: "Crecimiento BPA (5 años)", dcf_r: "Tasa de descuento", dcf_fv: "tu valor justo", dcf_up: "upside implícito vs. precio", peg_t: "Termómetro PEG", peg_sub: "P/E ÷ crecimiento anual esperado del BPA (%)", an_sub: "consenso de {n} analistas (Yahoo) — la guía de la empresa no está en feeds gratuitos", an_mean: "Objetivo medio", an_move: "Movimiento implícito", an_rate: "Recomendación", an_range: "Rango de objetivos vs. precio", an_note: "Los objetivos de analistas son opiniones, llegan tarde y pecan de optimismo — un insumo, no la verdad.", pevs_t: "P/E vs. pares de tu universo", pevs_sub: "media de pares {a}x — {t} en azul", rvb_t: "Desglose de ingresos y gastos", rvb_sub: "LTM · {c} · I+D y SG&A de estados reales — segmentos de ingresos aún requieren datos de pago", hist_t: "Historial de beneficios e ingresos", hist_sub: "estados anuales reales · {c} millones", bs_t: "Balance", bs_sub: "activos vs. pasivos + patrimonio · {c} miles de millones · último informe", ki_t: "Información clave", ki_sub: "último informe", divy_t: "Rentabilidad por dividendo: {y}%", divy_sub: "posición frente al mercado", pay_t: "Payout: {p}%", pay_sub: "parte del beneficio pagada en dividendos", sus: "sostenible", str2: "forzado", risk_w: "en riesgo", reit_note: "Los REIT deben distribuir ≥90% del beneficio — un payout alto aquí es estructural.", ts_t: "Estadísticas de negociación", sma_sub: "soporte {s} · resistencia {r} (60 sesiones) · precios EOD reales", sig2_t: "Checklist de señales", sig2_sub: "puntuación de entrada/salida con lecturas clásicas", ck_tu: "SMA50 sobre SMA200 — tendencia primaria alcista", ck_td: "SMA50 bajo SMA200 — tendencia primaria bajista", ck_pa: "Precio sobre la media de 200 días", ck_pb: "Precio bajo la media de 200 días", ck_nh: "Historial insuficiente", ck_ovs: "sobrevendido", ck_ovb: "sobrecomprado", ck_neu: "neutral", ck_mu: "MACD sobre la señal — momentum positivo", ck_md: "MACD bajo la señal — momentum negativo", verdict_t: "Veredicto híbrido", verdict_sub: "fundamentos + técnica, con datos reales", v1t: "Fundamentos sólidos + técnica favorable", v1d: "Tesis y timing apuntan igual — el escenario que busca este método híbrido.", v2t: "Buena empresa, mal momento", v2d: "Los fundamentos pasan, pero el gráfico aún no confirma la entrada.", v3t: "Gráfico bonito, fundamentos débiles", v3d: "La técnica señala entrada, pero los fundamentos no sostienen una posición larga.", v4t: "Evitar por ahora", v4d: "Ni fundamentos ni técnica favorecen entrar. Mantén en la watchlist.", vref: "Niveles de referencia: soporte {s} · resistencia {r}{f}. Educativo — no es consejo.", fv_word: " · valor justo (DCF simple) {v}", scr_sub: "filtros fundamentales sobre tu universo en vivo", res_t: "Resultados — {a} de {b}", res_sub: "toca una acción para el análisis completo y su zona técnica", all_w: "Todas", cmp_sub: "mejor valor por fila resaltado — datos reales, USD", snowov_t: "Copos superpuestos", snowov_sub: "ejes fundamentales (momentum requiere cada gráfico)", bt_rule: "regla: largo solo con SMA50 > SMA200 y precio > SMA200 · precios REALES", bt_btn: "▶ Ejecutar backtest ({n} historiales)", bt_load: "cargando historiales… {a}/{b}", bt_err: "Historial insuficiente para esta selección — prueba un período mayor o toda la lista.", bt_ret: "Retorno estrategia", bt_bh: "Comprar y mantener", bt_dd: "Caída máx. (estrategia)", bt_bhdd: "Caída máx. (B&H)", bt_note: "Simulación real sobre historial verdadero, incluyendo un coste del 0,1% por operación. El pasado nunca garantiza el futuro.", bt_scope: "Alcance", bt_all: "Lista completa", bt_period: "Período", bt_from: "Desde", bt_to: "Hasta", bt_rerun: "↻ Ejecutar de nuevo", soon: " — próximamente", cs_note: "Este módulo requiere datos de pago. Todo lo demás usa datos reales, gratuitos y diarios.", opt_body: "Cadenas de opciones en vivo y volatilidad implícita requieren un feed licenciado.", soc_t: "Sentimiento social — próximamente", soc_b: "El sentimiento de Reddit/X requiere APIs de pago. Los titulares de arriba son reales y gratis.", ins_none: "Sin compras ni ventas en mercado abierto en los últimos registros — solo grants/ejercicios rutinarios.", si: "Entrar", ca: "Crear cuenta gratis", no_acc: "¿Sin cuenta? Crea una gratis →", have_acc: "¿Ya tienes cuenta? Entrar →", free_note: "Plan gratis: watchlist de hasta {w} acciones · 5 búsquedas nuevas/día.", my_list: "Mi lista", all_cached: "Todas en caché", category: "Categoría", playbook: "Estrategia", ratiosFor: "Ratios clave para {t}", aboutT: "Sobre {n}", thesis_t: "✨ Tesis generada por IA", thesis_sub: "construida con métricas reales, consenso de analistas, insiders y técnica — punto de partida, no un consejo", ins_t: "Actividad de insiders", ins_sub: "SEC Form 4 — compras y ventas extraídas (cotizadas en EE.UU.)", buys: "compras", sells: "ventas", grants: "grants/otros", ins_note: "Las compras en mercado abierto (código P) son lo que importa — grants y ejercicio de opciones son compensación rutinaria.", analyst_t: "Pronóstico de analistas", news_t: "Últimas noticias", fund_score: "nota fundamental", tech_read: "lectura técnica", bt_what: "¿Qué hace el backtest?", bt_expl: "Reejecuta la regla de timing de la app (mantener la acción solo mientras SMA50 > SMA200 y precio > SMA200) sobre el historial real de todo lo que sigues, y lo compara con comprar y mantener. Responde: ¿habría ayudado este filtro, y con caídas cuánto menores?", bt_rule_l: "Regla", bt_r_v2: "v2 · régimen + margen", bt_r_classic: "Clásica · cruce diario", bt_rule2: "regla v2: entradas semanales con SMA50 > SMA200, precio > SMA200 y régimen no lateral · salida evaluada a diario, solo si el precio cierra 1,5% bajo la SMA200 · coste del 0,1% por operación · precios REALES", bt_expl2: "La regla v2 ataca la mayor debilidad del filtro clásico — las señales falsas en mercados laterales — sin reaccionar tarde a los desplomes. Las entradas se confirman solo una vez por semana y se omiten en régimen lateral (Efficiency Ratio < 0,25); las salidas se evalúan a diario pero con margen: solo vende cuando el precio cierra 1,5% bajo la SMA200. Ambas reglas pagan un 0,1% por operación, así que operar menos cuenta de verdad. Compárala con comprar y mantener en retorno, caída máxima y retorno por unidad de caída.", bt_eff: "Retorno ÷ caída máx.", bt_eff_bh: "B&H: retorno ÷ caída", bt_trades: "Entradas", bt_time: "Tiempo invertido", bt_eff_note: "En mercados alcistas fuertes, un filtro de timing rara vez gana al buy & hold en retorno bruto — su papel es lograr un retorno similar con caídas menores. Eso mide 'Retorno ÷ caída máx.': cuanto mayor, mejor.", scr_load: "Cargar análisis técnico de toda la lista", scr_load_ing: "analizando", scr_buy: "Técnico: BUY", scr_trend: "Tendencia ≥ 60", bt_csv: "Exportar curva (CSV)", tbt_t: "¿Funcionó esta señal en esta acción?", tbt_sub: "ambas reglas simuladas en el propio historial de esta acción ({y} años, coste del 0,1% por operación) vs simplemente comprar y mantener", tbt_cl: "Clásica", ck_div_b: "Divergencia bajista de RSI — el precio hizo un máximo más alto, el RSI no: la tendencia pierde fuerza", ck_div_u: "Divergencia alcista de RSI — el precio hizo un mínimo más bajo, el RSI no: la venta pierde fuerza", ck_str_hi: "Precio más estirado sobre su SMA200 que en el {p}% de su propio historial — riesgo elevado de corrección", ck_str_lo: "Precio más cerca de su SMA200 que en el {p}% de su historial — entrada rara en esta tendencia", sma_sub2: "zona de soporte {s1}–{s2} · zona de resistencia {r1}–{r2} (60 sesiones ± ATR) · precios EOD reales", atr_l: "ATR (14)", rr_l: "Riesgo/Retorno", ck_rr_g: "Riesgo/Retorno {r} hasta las zonas — relación favorable", ck_rr_m: "Riesgo/Retorno {r} — relación neutra", ck_rr_b: "Riesgo/Retorno {r} — potencial limitado frente al riesgo", regime_t: "Régimen y calidad de la tendencia", regime_sub: "Efficiency Ratio (20 sesiones) — qué tan limpio es el movimiento del precio", reg_range: "Lateral", reg_trans: "Transición", reg_trend: "Tendencia", trend_s: "Nota de tendencia", entry_s: "Nota de entrada", te_best: "Tendencia y entrada apuntan en la misma dirección.", te_pull: "Tendencia fuerte, entrada estirada — considera esperar un retroceso.", te_ctr: "Entrada atractiva pero tendencia débil — riesgo de ir contra la corriente.", te_no: "Ni la tendencia ni la entrada son favorables.", gap_mas: "SMA50 vs SMA200", gap_px: "Precio vs SMA200", slope50_l: "Pendiente SMA50 (60d)", slope200_l: "Pendiente SMA200 (60d)", mom_l: "Momentum 12-1", vol20_l: "Volumen vs media 20d", ck_vol_hi: "Volumen {x}× la media de 20 días — movimiento con confirmación", ck_vol_lo: "Volumen {x}× la media de 20 días — confirmación débil", ck_reg_t: "Régimen de tendencia (ER {e}) — las señales de medias móviles son fiables aquí", ck_reg_r: "Régimen lateral (ER {e}) — señales de medias propensas a falsas salidas", ck_reg_x: "Régimen de transición (ER {e}) — tendencia aún no establecida", ck_mom_u: "Momentum de 12 meses positivo ({m}%)", ck_mom_d: "Momentum de 12 meses negativo ({m}%)", refresh_btn: "↻ Actualizar", refresh_ing: "actualizando…", refresh_ok: "actualizado", refresh_err: "fallo al actualizar — inténtalo en un minuto", dev_link: "🔬 Empresa en fase de desarrollo — revisa los últimos filings de la SEC y la pestaña de noticias." },
  fr: { seg_link: "📄 Note officielle des segments (10-K sur EDGAR) — les vraies sources de revenus", tag: "données réelles · mise à jour quotidienne · éducatif, pas un conseil", lastclose: "dernière clôture (EOD)", listed: "Cotée en {c} — afficher :", load_uni: "chargement des données réelles…", load_px: "chargement de l'historique {t}…", wl_empty: "Votre liste est vide — ouvrez une action et touchez ☆.", sig_t: "⚡ Changements notables", sig_sub: "détectés par la collecte quotidienne", notes_t: "📝 Ma thèse & notes", notes_sub: "gardées dans cette session", notes_ph: "Pourquoi vous la détenez — et ce qui vous ferait vendre.", snow_t: "Flocon", snow_sub: "six dimensions, 0–6 — le Momentum vient de la lecture technique", fsum_t: "Résumé des fondamentaux", fsum_sub: "revenus et bénéfices comparés à ce que paie le marché", keyfin_t: "Indicateurs financiers", keyfin_sub: "LTM · {c} · données réelles", peers_t: "Pairs dans votre univers", peers_sub: "{s} — parmi vos actions suivies", open_w: "ouvrir →", whatif_t: "💸 Et si j'avais investi ?", whatif_sub: "historique réel · hors impôts et frais", amount: "Montant (USD)", worth: "Valeur aujourd'hui", ret_t: "Rendement total", shares_t: "Actions achetées", estdiv: "Dividendes est.", buyat: "Achat à {p} en {d} (rendement en monnaie locale).", dcf_t: "DCF interactif — vos hypothèses", dcf_sub: "croissance BPA 5 ans + terminal 12x, actualisé · glissez et regardez recalculer", dcf_g: "Croissance BPA (5 ans)", dcf_r: "Taux d'actualisation", dcf_fv: "votre juste valeur", dcf_up: "hausse implicite vs prix", peg_t: "Thermomètre PEG", peg_sub: "P/E ÷ croissance annuelle attendue du BPA (%)", an_sub: "consensus de {n} analystes (Yahoo) — la guidance des sociétés n'est pas en flux gratuit", an_mean: "Objectif moyen", an_move: "Mouvement implicite", an_rate: "Avis", an_range: "Fourchette d'objectifs vs prix", an_note: "Les objectifs d'analystes sont des opinions, souvent en retard et optimistes — un intrant, pas la vérité.", pevs_t: "P/E vs pairs de votre univers", pevs_sub: "moyenne des pairs {a}x — {t} en bleu", rvb_t: "Décomposition revenus & dépenses", rvb_sub: "LTM · {c} · R&D et SG&A des comptes réels — les segments de revenus exigent des données payantes", hist_t: "Historique bénéfices & revenus", hist_sub: "comptes annuels réels · {c} millions", bs_t: "Bilan", bs_sub: "actifs vs passifs + capitaux · {c} milliards · dernier rapport", ki_t: "Informations clés", ki_sub: "dernier rapport", divy_t: "Rendement du dividende : {y}%", divy_sub: "position face au marché", pay_t: "Taux de distribution : {p}%", pay_sub: "part du bénéfice versée en dividendes", sus: "soutenable", str2: "tendu", risk_w: "à risque", reit_note: "Les REIT doivent distribuer ≥90% du résultat — un payout élevé y est structurel.", ts_t: "Statistiques de marché", sma_sub: "support {s} · résistance {r} (60 séances) · prix EOD réels", sig2_t: "Checklist de signaux", sig2_sub: "score d'entrée/sortie selon les lectures classiques", ck_tu: "SMA50 au-dessus de SMA200 — tendance primaire haussière", ck_td: "SMA50 sous SMA200 — tendance primaire baissière", ck_pa: "Prix au-dessus de la moyenne 200 jours", ck_pb: "Prix sous la moyenne 200 jours", ck_nh: "Historique insuffisant", ck_ovs: "survendu", ck_ovb: "suracheté", ck_neu: "neutre", ck_mu: "MACD au-dessus du signal — momentum positif", ck_md: "MACD sous le signal — momentum négatif", verdict_t: "Verdict hybride", verdict_sub: "fondamentaux + technique, sur données réelles", v1t: "Fondamentaux solides + technique favorable", v1d: "Thèse et timing vont dans le même sens — le scénario recherché par cette méthode.", v2t: "Bonne société, mauvais moment", v2d: "Les fondamentaux passent, mais le graphique ne confirme pas encore l'entrée.", v3t: "Beau graphique, fondamentaux faibles", v3d: "La technique signale une entrée, mais les fondamentaux ne soutiennent pas une position longue.", v4t: "À éviter pour l'instant", v4d: "Ni fondamentaux ni technique ne favorisent l'entrée. Gardez en liste.", vref: "Niveaux de référence : support {s} · résistance {r}{f}. Éducatif — pas un conseil.", fv_word: " · juste valeur (DCF simple) {v}", scr_sub: "filtres fondamentaux sur votre univers en direct", res_t: "Résultats — {a} sur {b}", res_sub: "touchez une action pour l'analyse complète et sa zone technique", all_w: "Toutes", cmp_sub: "meilleure valeur par ligne en évidence — données réelles, USD", snowov_t: "Flocons superposés", snowov_sub: "axes fondamentaux (le momentum exige chaque graphique)", bt_rule: "règle : long seulement si SMA50 > SMA200 et prix > SMA200 · prix RÉELS", bt_btn: "▶ Lancer le backtest ({n} historiques)", bt_load: "chargement des historiques… {a}/{b}", bt_err: "Historique insuffisant pour cette sélection — élargissez la période ou prenez toute la liste.", bt_ret: "Rendement stratégie", bt_bh: "Achat-conservation", bt_dd: "Baisse max (stratégie)", bt_bhdd: "Baisse max (B&H)", bt_note: "Simulation réelle sur historique véritable, incluant un coût de 0,1% par transaction. Le passé ne garantit jamais l'avenir.", bt_scope: "Périmètre", bt_all: "Toute la liste", bt_period: "Période", bt_from: "Du", bt_to: "Au", bt_rerun: "↻ Relancer", soon: " — bientôt", cs_note: "Ce module exige une source payante. Tout le reste tourne sur des données réelles, gratuites et quotidiennes.", opt_body: "Chaînes d'options en direct et volatilité implicite exigent un flux licencié.", soc_t: "Sentiment social — bientôt", soc_b: "Le sentiment Reddit/X exige des API payantes. Les titres ci-dessus sont réels et gratuits.", ins_none: "Aucun achat/vente sur le marché dans les derniers dépôts — seulement des attributions/levées de routine.", si: "Connexion", ca: "Créer un compte gratuit", no_acc: "Pas de compte ? Créez-en un →", have_acc: "Déjà un compte ? Connexion →", free_note: "Plan gratuit : liste jusqu'à {w} actions · 5 recherches/jour.", my_list: "Ma liste", all_cached: "Tout le cache", category: "Catégorie", playbook: "Stratégie", ratiosFor: "Ratios clés pour {t}", aboutT: "À propos de {n}", thesis_t: "✨ Thèse générée par IA", thesis_sub: "bâtie sur des métriques réelles, le consensus des analystes, les initiés et la technique — un point de départ, pas un conseil", ins_t: "Activité des initiés", ins_sub: "SEC Form 4 — achats et ventes extraits (cotations US)", buys: "achats", sells: "ventes", grants: "attributions/autres", ins_note: "Les achats sur le marché (code P) comptent le plus — attributions et levées d'options sont de la rémunération courante.", analyst_t: "Prévision des analystes", news_t: "Dernières actualités", fund_score: "note fondamentale", tech_read: "lecture technique", bt_what: "Que fait le backtest ?", bt_expl: "Il rejoue la règle de timing de l'app (détenir l'action seulement quand SMA50 > SMA200 et prix > SMA200) sur l'historique réel de tout votre suivi, comparé à un simple achat-conservation. Il répond : ce filtre aurait-il aidé, avec des baisses combien plus faibles ?", bt_rule_l: "Règle", bt_r_v2: "v2 · régime + marge", bt_r_classic: "Classique · croisement quotidien", bt_rule2: "règle v2 : entrées hebdomadaires si SMA50 > SMA200, prix > SMA200 et régime non latéral · sortie évaluée chaque jour, seulement si le prix clôture 1,5% sous la SMA200 · coût de 0,1% par transaction · prix RÉELS", bt_expl2: "La règle v2 s'attaque à la principale faiblesse du filtre classique — les faux signaux en marché latéral — sans réagir en retard aux krachs. Les entrées ne sont confirmées qu'une fois par semaine et ignorées en régime de range (Efficiency Ratio < 0,25) ; les sorties sont évaluées chaque jour mais avec une marge : vente seulement si le prix clôture 1,5% sous la SMA200. Les deux règles paient 0,1% par transaction, donc trader moins compte vraiment. Comparez avec l'achat-conservation sur le rendement, la baisse maximale et le rendement par unité de baisse.", bt_eff: "Rendement ÷ baisse max", bt_eff_bh: "B&H : rendement ÷ baisse", bt_trades: "Entrées", bt_time: "Temps investi", bt_eff_note: "Dans les marchés haussiers forts, un filtre de timing bat rarement l'achat-conservation en rendement brut — son rôle est d'obtenir un rendement similaire avec des baisses plus faibles. C'est ce que mesure « Rendement ÷ baisse max » : plus c'est haut, mieux c'est.", scr_load: "Charger l'analyse technique de toute la liste", scr_load_ing: "analyse", scr_buy: "Technique : BUY", scr_trend: "Tendance ≥ 60", bt_csv: "Exporter la courbe (CSV)", tbt_t: "Ce signal a-t-il fonctionné sur cette action ?", tbt_sub: "les deux règles simulées sur l'historique propre de cette action ({y} ans, coût de 0,1% par transaction) vs simplement acheter et conserver", tbt_cl: "Classique", ck_div_b: "Divergence baissière du RSI — le prix a fait un plus haut, pas le RSI : la tendance perd de la force", ck_div_u: "Divergence haussière du RSI — le prix a fait un plus bas, pas le RSI : la vente perd de la force", ck_str_hi: "Prix plus étiré au-dessus de sa SMA200 que dans {p}% de son propre historique — risque de repli élevé", ck_str_lo: "Prix plus proche de sa SMA200 que dans {p}% de son historique — entrée rare dans cette tendance", sma_sub2: "zone de support {s1}–{s2} · zone de résistance {r1}–{r2} (60 séances ± ATR) · prix EOD réels", atr_l: "ATR (14)", rr_l: "Risque/Rendement", ck_rr_g: "Risque/Rendement {r} vers les zones — ratio favorable", ck_rr_m: "Risque/Rendement {r} — ratio neutre", ck_rr_b: "Risque/Rendement {r} — potentiel limité face au risque", regime_t: "Régime & qualité de la tendance", regime_sub: "Efficiency Ratio (20 séances) — la netteté du mouvement du prix", reg_range: "Range", reg_trans: "Transition", reg_trend: "Tendance", trend_s: "Score de tendance", entry_s: "Score d'entrée", te_best: "Tendance et entrée vont dans le même sens.", te_pull: "Tendance forte, entrée tendue — envisagez d'attendre un repli.", te_ctr: "Entrée attrayante mais tendance faible — risque de contre-tendance.", te_no: "Ni la tendance ni l'entrée ne sont favorables.", gap_mas: "SMA50 vs SMA200", gap_px: "Prix vs SMA200", slope50_l: "Pente SMA50 (60j)", slope200_l: "Pente SMA200 (60j)", mom_l: "Momentum 12-1", vol20_l: "Volume vs moy. 20j", ck_vol_hi: "Volume {x}× la moyenne 20 jours — mouvement confirmé", ck_vol_lo: "Volume {x}× la moyenne 20 jours — confirmation faible", ck_reg_t: "Régime de tendance (ER {e}) — signaux de moyennes mobiles fiables ici", ck_reg_r: "Régime de range (ER {e}) — signaux de moyennes sujets aux faux départs", ck_reg_x: "Régime de transition (ER {e}) — tendance pas encore établie", ck_mom_u: "Momentum 12 mois positif ({m}%)", ck_mom_d: "Momentum 12 mois négatif ({m}%)", refresh_btn: "↻ Actualiser", refresh_ing: "mise à jour…", refresh_ok: "actualisé", refresh_err: "échec — réessayez dans une minute", dev_link: "🔬 Société en phase de développement — consultez les derniers dépôts SEC et l'onglet actualités." },
  he: { seg_link: "📄 ביאור המגזרים הרשמי (10-K ב-EDGAR) — מקורות ההכנסה האמיתיים", tag: "נתוני שוק אמיתיים · עדכון יומי · חינוכי, לא המלצה", lastclose: "סגירה אחרונה (EOD)", listed: "נסחרת ב{c} — הצג:", load_uni: "טוען נתוני שוק אמיתיים…", load_px: "טוען היסטוריה של {t}…", wl_empty: "הרשימה ריקה — פתח מניה ולחץ ☆ להוספה.", sig_t: "⚡ שינויים מהותיים", sig_sub: "אותרו באיסוף היומי", notes_t: "📝 התזה וההערות שלי", notes_sub: "נשמרות בסשן זה בדפדפן", notes_ph: "למה אתה מחזיק — ומה יגרום לך למכור.", snow_t: "פתית שלג", snow_sub: "שישה ממדים, 0–6 — המומנטום מגיע מהקריאה הטכנית", fsum_t: "תקציר פונדמנטלי", fsum_sub: "איך הכנסות ורווח מול מה שהשוק משלם", keyfin_t: "מדדים פיננסיים", keyfin_sub: "LTM · {c} · נתונים אמיתיים", peers_t: "עמיתים ביקום שלך", peers_sub: "{s} — מבין המניות שאתה עוקב", open_w: "פתח →", whatif_t: "💸 ומה אם הייתי משקיע?", whatif_sub: "היסטוריית מחירים אמיתית · ללא מס ועמלות", amount: "סכום (USD)", worth: "שווי היום", ret_t: "תשואה כוללת", shares_t: "מניות שנקנו", estdiv: "דיבידנדים משוערים", buyat: "קנייה ב-{p} בתאריך {d} (תשואת מחיר במטבע המקומי).", dcf_t: "DCF אינטראקטיבי — ההנחות שלך", dcf_sub: "צמיחת EPS ל-5 שנים + טרמינל 12x, מהוון · גרור וראה חישוב מחדש", dcf_g: "צמיחת EPS (5 שנים)", dcf_r: "שיעור היוון", dcf_fv: "השווי ההוגן שלך", dcf_up: "אפסייד גלום מול המחיר", peg_t: "מדחום PEG", peg_sub: "מכפיל ÷ צמיחת EPS שנתית צפויה (%)", an_sub: "קונצנזוס של {n} אנליסטים (Yahoo) — הנחיות החברה אינן בפידים חינמיים", an_mean: "יעד ממוצע", an_move: "תזוזה גלומה", an_rate: "המלצה", an_range: "טווח יעדים מול המחיר", an_note: "יעדי אנליסטים הם דעות, מאחרים ונוטים לאופטימיות — קלט אחד, לא אמת.", pevs_t: "מכפיל מול עמיתים ביקום שלך", pevs_sub: "ממוצע עמיתים {a}x — {t} בכחול", rvb_t: "פירוק הכנסות והוצאות", rvb_sub: "LTM · {c} · מו\"פ ו-SG&A מדוחות אמיתיים — פילוח הכנסות דורש נתונים בתשלום", hist_t: "היסטוריית רווח והכנסות", hist_sub: "דוחות שנתיים אמיתיים · {c} מיליונים", bs_t: "מאזן", bs_sub: "נכסים מול התחייבויות + הון · {c} מיליארדים · דוח אחרון", ki_t: "מידע מרכזי", ki_sub: "דוח אחרון", divy_t: "תשואת דיבידנד: {y}%", divy_sub: "מיקום מול השוק", pay_t: "יחס חלוקה: {p}%", pay_sub: "חלק הרווח המחולק כדיבידנד", sus: "בר-קיימא", str2: "מתוח", risk_w: "בסיכון", reit_note: "REIT מחויב לחלק ≥90% מהרווח — חלוקה גבוהה כאן מבנית, לא דגל אדום.", ts_t: "סטטיסטיקות מסחר", sma_sub: "תמיכה {s} · התנגדות {r} (60 ימי מסחר) · מחירי EOD אמיתיים", sig2_t: "צ'קליסט איתותים", sig2_sub: "ציון כניסה/יציאה לפי הקריאות הקלאסיות", ck_tu: "SMA50 מעל SMA200 — מגמה ראשית עולה", ck_td: "SMA50 מתחת SMA200 — מגמה ראשית יורדת", ck_pa: "המחיר מעל ממוצע 200 יום", ck_pb: "המחיר מתחת ממוצע 200 יום", ck_nh: "אין מספיק היסטוריה", ck_ovs: "מכירת-יתר", ck_ovb: "קניית-יתר", ck_neu: "ניטרלי", ck_mu: "MACD מעל הסיגנל — מומנטום חיובי", ck_md: "MACD מתחת לסיגנל — מומנטום שלילי", verdict_t: "פסיקה היברידית", verdict_sub: "פונדמנטלס + טכני, על נתונים אמיתיים", v1t: "פונדמנטלס איתן + טכני תומך", v1d: "התזה והתזמון באותו כיוון — התרחיש שהשיטה מחפשת.", v2t: "חברה טובה, תזמון רע", v2d: "הפונדמנטלס עוברים, אך הגרף עוד לא מאשר כניסה.", v3t: "גרף יפה, פונדמנטלס חלש", v3d: "הטכני מסמן כניסה, אך הפונדמנטלס לא תומך בפוזיציה ארוכה.", v4t: "להימנע בינתיים", v4d: "לא הפונדמנטלס ולא הטכני תומכים בכניסה. השאר ברשימה.", vref: "רמות ייחוס: תמיכה {s} · התנגדות {r}{f}. חינוכי — לא המלצה.", fv_word: " · שווי הוגן (DCF פשוט) {v}", scr_sub: "מסנני פונדמנטלס על היקום החי שלך", res_t: "תוצאות — {a} מתוך {b}", res_sub: "לחץ על מניה לניתוח מלא ולאזור הטכני", all_w: "הכול", cmp_sub: "הערך הטוב בכל שורה מודגש — נתונים אמיתיים, USD", snowov_t: "פתיתים חופפים", snowov_sub: "צירים פונדמנטליים (מומנטום דורש טעינת כל גרף)", bt_rule: "כלל: לונג רק כש-SMA50 > SMA200 והמחיר > SMA200 · מחירים אמיתיים", bt_btn: "▶ הרץ בקטסט ({n} היסטוריות)", bt_load: "טוען היסטוריות… {a}/{b}", bt_err: "אין מספיק היסטוריה לבחירה — נסה תקופה רחבה או את כל הרשימה.", bt_ret: "תשואת האסטרטגיה", bt_bh: "קנה והחזק", bt_dd: "ירידה מרבית (אסטרטגיה)", bt_bhdd: "ירידה מרבית (B&H)", bt_note: "סימולציה אמיתית על היסטוריה אמיתית, כולל עלות של 0.1% לעסקה. העבר אינו מבטיח עתיד.", bt_scope: "היקף", bt_all: "כל הרשימה", bt_period: "תקופה", bt_from: "מ-", bt_to: "עד", bt_rerun: "↻ הרץ שוב", soon: " — בקרוב", cs_note: "המודול דורש מקור בתשלום. כל השאר רץ על נתונים אמיתיים, חינמיים ויומיים.", opt_body: "שרשראות אופציות חיות וסטיית תקן גלומה דורשות פיד מורשה.", soc_t: "סנטימנט חברתי — בקרוב", soc_b: "סנטימנט Reddit/X דורש API בתשלום. הכותרות למעלה אמיתיות וחינמיות.", ins_none: "אין קניות/מכירות בשוק הפתוח בדיווחים האחרונים — רק הענקות/מימושים שגרתיים.", si: "התחברות", ca: "צור חשבון חינם", no_acc: "אין חשבון? צור חינם →", have_acc: "יש חשבון? התחבר →", free_note: "חינם: רשימה עד {w} מניות · 5 חיפושים חדשים ביום.", my_list: "הרשימה שלי", all_cached: "הכול במטמון", category: "קטגוריה", playbook: "אסטרטגיה", ratiosFor: "מדדים מרכזיים ל{t}", aboutT: "על {n}", thesis_t: "✨ תזה שנוצרה על ידי AI", thesis_sub: "נבנתה ממדדים חיים, קונצנזוס אנליסטים, בעלי עניין וטכני — נקודת פתיחה, לא המלצה", ins_t: "פעילות בעלי עניין", ins_sub: "SEC Form 4 — קניות ומכירות מפוענחות (רישומי ארה\"ב)", buys: "קניות", sells: "מכירות", grants: "הענקות/אחר", ins_note: "קניות בשוק הפתוח (קוד P) הן העיקר — הענקות ומימוש אופציות הם תגמול שגרתי.", analyst_t: "תחזית אנליסטים", news_t: "חדשות אחרונות", fund_score: "ציון פונדמנטלי", tech_read: "קריאה טכנית", bt_what: "מה הבקטסט עושה?", bt_expl: "הוא מריץ מחדש את כלל התזמון של האפליקציה (להחזיק רק כאשר SMA50 > SMA200 והמחיר > SMA200) על ההיסטוריה האמיתית של כל מה שאתה עוקב, ומשווה לקנייה והחזקה. הוא עונה: האם המסנן היה עוזר, ובכמה קטנו הירידות?", bt_rule_l: "כלל", bt_r_v2: "v2 · משטר + מרווח", bt_r_classic: "קלאסי · חצייה יומית", bt_rule2: "כלל v2: כניסות שבועיות כש-SMA50 > SMA200, המחיר > SMA200 והמשטר אינו דשדוש · יציאה נבדקת יומית, רק אם המחיר נסגר 1.5% מתחת ל-SMA200 · עלות 0.1% לעסקה · מחירים אמיתיים", bt_expl2: "כלל v2 תוקף את החולשה הגדולה של המסנן הקלאסי — איתותי שווא בשוק מדשדש — בלי להגיב באיחור לקריסות. כניסות מאושרות רק פעם בשבוע ומדולגות כשהמשטר מדשדש (Efficiency Ratio < 0.25); יציאות נבדקות כל יום אך עם מרווח: מוכר רק כשהמחיר נסגר 1.5% מתחת ל-SMA200. שני הכללים משלמים 0.1% לעסקה, כך שפחות עסקאות באמת נחשב. השווה לקנה-והחזק בתשואה, בירידה המרבית ובתשואה ליחידת ירידה.", bt_eff: "תשואה ÷ ירידה מרבית", bt_eff_bh: "B&H: תשואה ÷ ירידה", bt_trades: "כניסות", bt_time: "זמן בפוזיציה", bt_eff_note: "בשוק שורי חזק, מסנן תזמון כמעט אף פעם לא מנצח קנה-והחזק בתשואה גולמית — תפקידו להשיג תשואה דומה עם ירידות קטנות יותר. את זה מודד 'תשואה ÷ ירידה מרבית': גבוה יותר = טוב יותר.", scr_load: "טען ניתוח טכני לכל הרשימה", scr_load_ing: "מנתח", scr_buy: "טכני: BUY", scr_trend: "מגמה ≥ 60", bt_csv: "ייצוא העקומה (CSV)", tbt_t: "האם האיתות הזה עבד במניה הזו?", tbt_sub: "שני הכללים מדומים על ההיסטוריה של המניה עצמה ({y} שנים, עלות 0.1% לעסקה) מול פשוט לקנות ולהחזיק", tbt_cl: "קלאסי", ck_div_b: "סטיית RSI דובית — המחיר עשה שיא גבוה יותר, ה-RSI לא: המגמה מאבדת כוח", ck_div_u: "סטיית RSI שורית — המחיר עשה שפל נמוך יותר, ה-RSI לא: הלחץ למכירה נחלש", ck_str_hi: "המחיר מתוח מעל ה-SMA200 יותר מאשר ב-{p}% מההיסטוריה שלו — סיכון מוגבר לתיקון", ck_str_lo: "המחיר קרוב ל-SMA200 יותר מאשר ב-{p}% מההיסטוריה — כניסה נדירה במגמה הזו", sma_sub2: "אזור תמיכה {s1}–{s2} · אזור התנגדות {r1}–{r2} (60 ימי מסחר ± ATR) · מחירי EOD אמיתיים", atr_l: "ATR (14)", rr_l: "סיכון/סיכוי", ck_rr_g: "סיכון/סיכוי {r} עד האזורים — יחס נוח", ck_rr_m: "סיכון/סיכוי {r} — יחס ניטרלי", ck_rr_b: "סיכון/סיכוי {r} — פוטנציאל מוגבל מול הסיכון", regime_t: "משטר ואיכות המגמה", regime_sub: "Efficiency Ratio (20 ימי מסחר) — עד כמה תנועת המחיר נקייה", reg_range: "דשדוש", reg_trans: "מעבר", reg_trend: "מגמה", trend_s: "ציון מגמה", entry_s: "ציון כניסה", te_best: "המגמה והכניסה באותו כיוון.", te_pull: "מגמה חזקה, כניסה מתוחה — שקול להמתין לתיקון.", te_ctr: "כניסה אטרקטיבית אך מגמה חלשה — סיכון נגד המגמה.", te_no: "לא המגמה ולא הכניסה תומכות.", gap_mas: "SMA50 מול SMA200", gap_px: "מחיר מול SMA200", slope50_l: "שיפוע SMA50 (60 ימים)", slope200_l: "שיפוע SMA200 (60 ימים)", mom_l: "מומנטום 12-1", vol20_l: "נפח מול ממוצע 20 ימים", ck_vol_hi: "נפח {x}× מהממוצע ל-20 יום — למהלך יש אישור", ck_vol_lo: "נפח {x}× מהממוצע ל-20 יום — אישור חלש", ck_reg_t: "משטר מגמה (ER {e}) — איתותי ממוצעים נעים אמינים כאן", ck_reg_r: "משטר דשדוש (ER {e}) — איתותי ממוצעים חשופים לאיתותי שווא", ck_reg_x: "משטר מעבר (ER {e}) — המגמה טרם התבססה", ck_mom_u: "מומנטום 12 חודשים חיובי ({m}%)", ck_mom_d: "מומנטום 12 חודשים שלילי ({m}%)", refresh_btn: "↻ רענן", refresh_ing: "מעדכן…", refresh_ok: "עודכן", refresh_err: "הרענון נכשל — נסה שוב בעוד דקה", dev_link: "🔬 חברה בשלב פיתוח — בדוק את הדיווחים האחרונים ב-SEC ואת לשונית החדשות." },
  ar: { seg_link: "📄 إيضاح القطاعات الرسمي (10-K في EDGAR) — مصادر الإيراد الحقيقية", tag: "بيانات سوق حقيقية · تحديث يومي · تعليمي وليس نصيحة", lastclose: "آخر إغلاق (EOD)", listed: "مدرجة بـ{c} — العرض:", load_uni: "جارٍ تحميل بيانات السوق…", load_px: "جارٍ تحميل تاريخ {t}…", wl_empty: "قائمتك فارغة — افتح سهمًا واضغط ☆ للإضافة.", sig_t: "⚡ تغييرات مهمة", sig_sub: "رصدها الجمع اليومي", notes_t: "📝 أطروحتي وملاحظاتي", notes_sub: "محفوظة في هذه الجلسة", notes_ph: "لماذا تملكه — وما الذي يجعلك تبيع.", snow_t: "ندفة الثلج", snow_sub: "ستة أبعاد، 0–6 — الزخم من القراءة الفنية", fsum_t: "ملخص الأساسيات", fsum_sub: "الإيرادات والأرباح مقابل ما يدفعه السوق", keyfin_t: "المؤشرات المالية", keyfin_sub: "LTM · {c} · بيانات حقيقية", peers_t: "النظراء في كونك", peers_sub: "{s} — من الأسهم التي تتابعها", open_w: "افتح →", whatif_t: "💸 ماذا لو استثمرت؟", whatif_sub: "تاريخ أسعار حقيقي · بدون ضرائب ورسوم", amount: "المبلغ (USD)", worth: "القيمة اليوم", ret_t: "العائد الكلي", shares_t: "الأسهم المشتراة", estdiv: "توزيعات تقديرية", buyat: "الشراء بـ{p} في {d} (عائد بالعملة المحلية).", dcf_t: "DCF تفاعلي — افتراضاتك", dcf_sub: "نمو ربحية السهم 5 سنوات + نهائي 12x مخصوم · اسحب وشاهد الحساب", dcf_g: "نمو ربحية السهم (5 سنوات)", dcf_r: "معدل الخصم", dcf_fv: "قيمتك العادلة", dcf_up: "الارتفاع الضمني مقابل السعر", peg_t: "مقياس PEG", peg_sub: "المكرر ÷ نمو الأرباح السنوي المتوقع (%)", an_sub: "إجماع {n} محللين (Yahoo) — إرشادات الشركات ليست في التغذيات المجانية", an_mean: "الهدف المتوسط", an_move: "الحركة الضمنية", an_rate: "التوصية", an_range: "نطاق الأهداف مقابل السعر", an_note: "أهداف المحللين آراء، متأخرة وتميل للتفاؤل — مدخل واحد لا الحقيقة.", pevs_t: "المكرر مقابل النظراء", pevs_sub: "متوسط النظراء {a}x — {t} بالأزرق", rvb_t: "تفصيل الإيرادات والمصروفات", rvb_sub: "LTM · {c} · البحث والتطوير وSG&A من قوائم حقيقية — تقسيم الإيرادات يتطلب بيانات مدفوعة", hist_t: "تاريخ الأرباح والإيرادات", hist_sub: "قوائم سنوية حقيقية · {c} ملايين", bs_t: "الميزانية", bs_sub: "أصول مقابل خصوم + حقوق · {c} مليارات · آخر تقرير", ki_t: "معلومات أساسية", ki_sub: "آخر تقرير", divy_t: "عائد التوزيع: {y}%", divy_sub: "الموقع مقابل السوق", pay_t: "نسبة التوزيع: {p}%", pay_sub: "حصة الأرباح الموزعة", sus: "مستدام", str2: "مضغوط", risk_w: "في خطر", reit_note: "REIT ملزم بتوزيع ≥90% — التوزيع المرتفع هنا هيكلي.", ts_t: "إحصاءات التداول", sma_sub: "دعم {s} · مقاومة {r} (60 جلسة) · أسعار EOD حقيقية", sig2_t: "قائمة الإشارات", sig2_sub: "نقاط دخول/خروج بالقراءات الكلاسيكية", ck_tu: "SMA50 فوق SMA200 — اتجاه صاعد رئيسي", ck_td: "SMA50 تحت SMA200 — اتجاه هابط رئيسي", ck_pa: "السعر فوق متوسط 200 يوم", ck_pb: "السعر تحت متوسط 200 يوم", ck_nh: "تاريخ غير كافٍ", ck_ovs: "بيع مفرط", ck_ovb: "شراء مفرط", ck_neu: "محايد", ck_mu: "MACD فوق الإشارة — زخم موجب", ck_md: "MACD تحت الإشارة — زخم سالب", verdict_t: "الحكم الهجين", verdict_sub: "أساسيات + فني، على بيانات حقيقية", v1t: "أساسيات متينة + فني مواتٍ", v1d: "الأطروحة والتوقيت بنفس الاتجاه — السيناريو الذي تبحث عنه هذه الطريقة.", v2t: "شركة جيدة، توقيت سيئ", v2d: "الأساسيات تنجح، لكن الرسم لا يؤكد الدخول بعد.", v3t: "رسم جميل، أساسيات ضعيفة", v3d: "الفني يشير لدخول، لكن الأساسيات لا تدعم مركزًا طويلًا.", v4t: "تجنّب حاليًا", v4d: "لا الأساسيات ولا الفني يدعمان الدخول. أبقه بالقائمة.", vref: "مستويات مرجعية: دعم {s} · مقاومة {r}{f}. تعليمي — ليس نصيحة.", fv_word: " · قيمة عادلة (DCF مبسّط) {v}", scr_sub: "مرشحات أساسية على كونك الحي", res_t: "النتائج — {a} من {b}", res_sub: "اضغط على سهم للتحليل الكامل ومنطقته الفنية", all_w: "الكل", cmp_sub: "أفضل قيمة بكل صف مميّزة — بيانات حقيقية، USD", snowov_t: "ندف متراكبة", snowov_sub: "محاور أساسية (الزخم يتطلب تحميل كل رسم)", bt_rule: "القاعدة: شراء فقط عندما SMA50 > SMA200 والسعر > SMA200 · أسعار حقيقية", bt_btn: "▶ شغّل الاختبار ({n} تواريخ)", bt_load: "تحميل التواريخ… {a}/{b}", bt_err: "تاريخ غير كافٍ لهذا الاختيار — جرّب فترة أوسع أو القائمة كاملة.", bt_ret: "عائد الاستراتيجية", bt_bh: "شراء واحتفاظ", bt_dd: "أقصى هبوط (استراتيجية)", bt_bhdd: "أقصى هبوط (B&H)", bt_note: "محاكاة حقيقية على تاريخ حقيقي، شاملة تكلفة 0.1% لكل صفقة. الماضي لا يضمن المستقبل.", bt_scope: "النطاق", bt_all: "كل القائمة", bt_period: "الفترة", bt_from: "من", bt_to: "إلى", bt_rerun: "↻ شغّل مجددًا", soon: " — قريبًا", cs_note: "هذه الوحدة تتطلب مصدرًا مدفوعًا. كل الباقي يعمل ببيانات حقيقية مجانية يومية.", opt_body: "سلاسل الخيارات الحية والتقلب الضمني تتطلب تغذية مرخّصة.", soc_t: "المشاعر الاجتماعية — قريبًا", soc_b: "مشاعر Reddit/X تتطلب API مدفوعة. العناوين أعلاه حقيقية ومجانية.", ins_none: "لا شراء/بيع بالسوق المفتوحة في آخر الإيداعات — فقط منح/ممارسات روتينية.", si: "تسجيل الدخول", ca: "أنشئ حسابًا مجانيًا", no_acc: "بلا حساب؟ أنشئ مجانًا →", have_acc: "لديك حساب؟ ادخل →", free_note: "المجاني: قائمة حتى {w} سهمًا · 5 عمليات بحث جديدة يوميًا.", my_list: "قائمتي", all_cached: "كل المخزّن", category: "الفئة", playbook: "الاستراتيجية", ratiosFor: "النسب الأساسية لـ{t}", aboutT: "عن {n}", thesis_t: "✨ أطروحة مولّدة بالذكاء الاصطناعي", thesis_sub: "مبنية على مقاييس حية وإجماع المحللين والمطّلعين والتحليل الفني — نقطة انطلاق لا نصيحة", ins_t: "نشاط المطّلعين", ins_sub: "SEC Form 4 — شراء وبيع مستخرجة (إدراجات أمريكية)", buys: "شراء", sells: "بيع", grants: "منح/أخرى", ins_note: "الشراء من السوق المفتوحة (رمز P) هو الأهم — المنح وممارسة الخيارات تعويض روتيني.", analyst_t: "توقعات المحللين", news_t: "آخر الأخبار", fund_score: "الدرجة الأساسية", tech_read: "القراءة الفنية", bt_what: "ماذا يفعل الاختبار الرجعي؟", bt_expl: "يعيد تشغيل قاعدة التوقيت (امتلاك السهم فقط عندما SMA50 > SMA200 والسعر > SMA200) على التاريخ الحقيقي لكل ما تتابعه، ويقارنه بالشراء والاحتفاظ. يجيب: هل كان المرشح سيساعد وبانخفاضات أصغر بكم؟", bt_rule_l: "القاعدة", bt_r_v2: "v2 · نظام + هامش", bt_r_classic: "كلاسيكية · تقاطع يومي", bt_rule2: "قاعدة v2: دخول أسبوعي عندما SMA50 > SMA200 والسعر > SMA200 والنظام غير عرضي · الخروج يُقيَّم يوميًا، فقط إذا أغلق السعر 1.5% تحت SMA200 · تكلفة 0.1% لكل صفقة · أسعار حقيقية", bt_expl2: "قاعدة v2 تعالج أكبر ضعف في المرشح الكلاسيكي — الإشارات الكاذبة في السوق العرضي — دون التأخر في الخروج عند الانهيارات. الدخول يُؤكَّد مرة واحدة أسبوعيًا ويُتخطى في النظام العرضي (Efficiency Ratio < 0.25)؛ الخروج يُقيَّم يوميًا لكن بهامش: تبيع فقط عندما يغلق السعر 1.5% تحت SMA200. كلتا القاعدتين تدفعان 0.1% لكل صفقة، فتقليل الصفقات يُحتسب فعلًا. قارن بالشراء والاحتفاظ في العائد وأقصى هبوط والعائد لكل وحدة هبوط.", bt_eff: "العائد ÷ أقصى هبوط", bt_eff_bh: "B&H: العائد ÷ الهبوط", bt_trades: "عمليات دخول", bt_time: "زمن الاستثمار", bt_eff_note: "في الأسواق الصاعدة القوية، نادرًا ما يتفوق مرشح التوقيت على الشراء والاحتفاظ في العائد الخام — دوره تحقيق عائد مماثل مع هبوط أقل. هذا ما يقيسه 'العائد ÷ أقصى هبوط': كلما زاد كان أفضل.", scr_load: "تحميل التحليل الفني للقائمة كاملة", scr_load_ing: "يحلل", scr_buy: "فني: BUY", scr_trend: "اتجاه ≥ 60", bt_csv: "تصدير المنحنى (CSV)", tbt_t: "هل نجحت هذه الإشارة في هذا السهم؟", tbt_sub: "القاعدتان محاكاتان على تاريخ هذا السهم نفسه ({y} سنوات، تكلفة 0.1% لكل صفقة) مقابل الشراء والاحتفاظ ببساطة", tbt_cl: "كلاسيكية", ck_div_b: "انحراف RSI هابط — السعر سجّل قمة أعلى ولم يفعل RSI: الاتجاه يفقد قوته", ck_div_u: "انحراف RSI صاعد — السعر سجّل قاعًا أدنى ولم يفعل RSI: البيع يفقد قوته", ck_str_hi: "السعر ممتد فوق SMA200 أكثر من {p}% من تاريخه — خطر تصحيح مرتفع", ck_str_lo: "السعر أقرب إلى SMA200 من {p}% من تاريخه — دخول نادر في هذا الاتجاه", sma_sub2: "منطقة الدعم {s1}–{s2} · منطقة المقاومة {r1}–{r2} (60 جلسة ± ATR) · أسعار EOD حقيقية", atr_l: "ATR (14)", rr_l: "المخاطرة/العائد", ck_rr_g: "المخاطرة/العائد {r} حتى المناطق — نسبة مواتية", ck_rr_m: "المخاطرة/العائد {r} — نسبة محايدة", ck_rr_b: "المخاطرة/العائد {r} — إمكانية محدودة مقابل المخاطرة", regime_t: "النظام وجودة الاتجاه", regime_sub: "Efficiency Ratio (20 جلسة) — مدى نظافة حركة السعر", reg_range: "نطاق عرضي", reg_trans: "انتقال", reg_trend: "اتجاه", trend_s: "درجة الاتجاه", entry_s: "درجة الدخول", te_best: "الاتجاه والدخول بنفس الاتجاه.", te_pull: "اتجاه قوي ودخول ممتد — فكّر بانتظار تصحيح.", te_ctr: "دخول جذاب لكن الاتجاه ضعيف — خطر معاكسة الاتجاه.", te_no: "لا الاتجاه ولا الدخول مواتيان.", gap_mas: "SMA50 مقابل SMA200", gap_px: "السعر مقابل SMA200", slope50_l: "ميل SMA50 (60 يومًا)", slope200_l: "ميل SMA200 (60 يومًا)", mom_l: "زخم 12-1", vol20_l: "الحجم مقابل متوسط 20 يومًا", ck_vol_hi: "الحجم {x}× متوسط 20 يومًا — الحركة مؤكدة", ck_vol_lo: "الحجم {x}× متوسط 20 يومًا — تأكيد ضعيف", ck_reg_t: "نظام اتجاهي (ER {e}) — إشارات المتوسطات موثوقة هنا", ck_reg_r: "نظام عرضي (ER {e}) — إشارات المتوسطات عرضة للإشارات الكاذبة", ck_reg_x: "نظام انتقالي (ER {e}) — الاتجاه لم يترسّخ بعد", ck_mom_u: "زخم 12 شهرًا موجب ({m}%)", ck_mom_d: "زخم 12 شهرًا سالب ({m}%)", refresh_btn: "↻ تحديث", refresh_ing: "جارٍ التحديث…", refresh_ok: "تم التحديث", refresh_err: "فشل التحديث — حاول بعد دقيقة", dev_link: "🔬 شركة في مرحلة التطوير — راجع أحدث إيداعات SEC ولسان الأخبار." },
  ja: { seg_link: "📄 公式セグメント注記（EDGARの10-K）— 実際の収益源", tag: "実データ · 毎日更新 · 教育目的であり投資助言ではありません", lastclose: "前日終値（EOD）", listed: "{c}上場 — 表示:", load_uni: "実データを読み込み中…", load_px: "{t}の履歴を読み込み中…", wl_empty: "リストは空です — 銘柄を開いて☆で追加。", sig_t: "⚡ 重要な変化", sig_sub: "日次収集で検出", notes_t: "📝 自分のテーゼとメモ", notes_sub: "このブラウザセッションに保存", notes_ph: "保有理由 — そして売る条件。", snow_t: "スノーフレーク", snow_sub: "6次元、0–6 — Momentumはテクニカル判定から", fsum_t: "ファンダメンタルズ要約", fsum_sub: "売上と利益を市場評価と比較", keyfin_t: "主要財務指標", keyfin_sub: "LTM · {c} · 実データ", peers_t: "あなたのユニバースの同業", peers_sub: "{s} — 追跡中の銘柄から", open_w: "開く →", whatif_t: "💸 もし投資していたら？", whatif_sub: "実価格履歴 · 税・手数料除く", amount: "金額（USD）", worth: "現在価値", ret_t: "トータルリターン", shares_t: "取得株数", estdiv: "推定配当", buyat: "{d}に{p}で購入（現地通貨ベース）。", dcf_t: "対話型DCF — あなたの前提", dcf_sub: "EPS成長5年+ターミナル12x割引 · 動かして再計算", dcf_g: "EPS成長率（5年）", dcf_r: "割引率", dcf_fv: "あなたの適正価値", dcf_up: "価格比の含意上昇率", peg_t: "PEG温度計", peg_sub: "PER ÷ 期待年間EPS成長率（%）", an_sub: "{n}名のアナリスト合意（Yahoo）— 会社ガイダンスは無料データにありません", an_mean: "平均目標", an_move: "含意変動", an_rate: "評価", an_range: "目標レンジと現在値", an_note: "アナリスト目標は意見であり遅行し楽観的 — 一材料であり真実ではない。", pevs_t: "同業比PER", pevs_sub: "同業平均{a}x — {t}は青", rvb_t: "収益と費用の内訳", rvb_sub: "LTM · {c} · 研究開発とSG&Aは実開示 — 収益セグメントは有料データが必要", hist_t: "利益・売上の推移", hist_sub: "実年次開示 · {c}百万", bs_t: "バランスシート", bs_sub: "資産 vs 負債+資本 · {c}十億 · 最新開示", ki_t: "主要情報", ki_sub: "最新開示", divy_t: "配当利回り: {y}%", divy_sub: "市場との比較", pay_t: "配当性向: {p}%", pay_sub: "利益のうち配当に回す割合", sus: "持続可能", str2: "無理気味", risk_w: "危険", reit_note: "REITは利益の90%以上を分配義務 — 高い性向は構造的。", ts_t: "売買統計", sma_sub: "支持 {s} · 抵抗 {r}（60営業日）· 実EOD価格", sig2_t: "シグナルチェック", sig2_sub: "定番の読みで入退出スコア", ck_tu: "SMA50がSMA200上 — 主要上昇トレンド", ck_td: "SMA50がSMA200下 — 主要下降トレンド", ck_pa: "価格が200日平均の上", ck_pb: "価格が200日平均の下", ck_nh: "履歴不足", ck_ovs: "売られ過ぎ", ck_ovb: "買われ過ぎ", ck_neu: "中立", ck_mu: "MACDがシグナル上 — 正のモメンタム", ck_md: "MACDがシグナル下 — 負のモメンタム", verdict_t: "ハイブリッド判定", verdict_sub: "実データでファンダ+テクニカル", v1t: "堅固なファンダ + 良好なテクニカル", v1d: "テーゼとタイミングが一致 — この手法が探す局面。", v2t: "良い会社、悪いタイミング", v2d: "ファンダは合格だがチャートは未確認。", v3t: "綺麗なチャート、弱いファンダ", v3d: "テクニカルは入りを示すが長期保有を支えない。", v4t: "当面回避", v4d: "どちらも入りを支持しない。リストで監視。", vref: "参考水準: 支持 {s} · 抵抗 {r}{f}。教育目的 — 助言ではない。", fv_word: " · 簡易DCF適正価値 {v}", scr_sub: "ライブユニバースへのファンダフィルター", res_t: "結果 — {b}中{a}", res_sub: "タップで完全分析とテクニカルゾーン", all_w: "すべて", cmp_sub: "各行の最良値を強調 — 実データ、USD", snowov_t: "スノーフレーク重ね", snowov_sub: "ファンダ軸（モメンタムは各チャート要）", bt_rule: "規則: SMA50 > SMA200 かつ 価格 > SMA200 の間のみ保有 · 実価格", bt_btn: "▶ バックテスト実行（{n}履歴）", bt_load: "履歴読み込み中… {a}/{b}", bt_err: "この選択では履歴不足 — 期間拡大か全リストで。", bt_ret: "戦略リターン", bt_bh: "買い持ち", bt_dd: "最大DD（戦略）", bt_bhdd: "最大DD（B&H）", bt_note: "実履歴での実シミュレーション（取引ごとに0.1%のコストを含む）。過去は未来を保証しない。", bt_scope: "対象", bt_all: "リスト全体", bt_period: "期間", bt_from: "開始", bt_to: "終了", bt_rerun: "↻ 再実行", soon: " — 近日公開", cs_note: "このモジュールは有料データが必要。他はすべて無料の実データで毎日更新。", opt_body: "ライブのオプションチェーンとIVは有料フィードが必要。", soc_t: "ソーシャルセンチメント — 近日", soc_b: "Reddit/Xの分析は有料API。上のニュースは無料で本物。", ins_none: "直近開示に市場での売買なし — 付与/行使のみ。", si: "ログイン", ca: "無料アカウント作成", no_acc: "アカウント未作成？無料で作成 →", have_acc: "アカウントあり？ログイン →", free_note: "無料: リスト{w}銘柄まで · 新規検索1日5件。", my_list: "マイリスト", all_cached: "キャッシュ全体", category: "カテゴリー", playbook: "戦略", ratiosFor: "{t}の重要指標", aboutT: "{n}について", thesis_t: "✨ AI生成テーゼ", thesis_sub: "実データ・アナリスト合意・インサイダー・テクニカルから構築 — 出発点であり助言ではありません", ins_t: "インサイダー動向", ins_sub: "SEC Form 4 — 売買を解析（米国上場）", buys: "買い", sells: "売り", grants: "付与/その他", ins_note: "重要なのは市場での買い（コードP）— 付与やオプション行使は通常の報酬です。", analyst_t: "アナリスト予想", news_t: "最新ニュース", fund_score: "ファンダ評価", tech_read: "テクニカル判定", bt_what: "バックテストとは？", bt_expl: "本アプリのタイミング規則（SMA50 > SMA200 かつ 価格 > SMA200 の間のみ保有）を追跡銘柄の実履歴で再現し、単純な買い持ちと比較します。このフィルターは有効だったか、下落はどれだけ小さかったかに答えます。", bt_rule_l: "ルール", bt_r_v2: "v2 · レジーム+バッファ", bt_r_classic: "クラシック · 日次クロス", bt_rule2: "規則v2: 買いは週次（SMA50 > SMA200、価格 > SMA200、非レンジ相場）· 売りは日次で判定、価格がSMA200を1.5%下回って引けた時のみ · 取引ごとに0.1%のコスト · 実価格", bt_expl2: "規則v2は、クラシックなフィルターの最大の弱点であるレンジ相場のダマシに、暴落への対応を遅らせずに対処します。買いは週1回のみ確認し、レンジ相場（Efficiency Ratio < 0.25）では見送り。売りは毎日判定しますが余裕を持たせ、価格がSMA200を1.5%下回って引けた時だけ手仕舞います。両規則とも取引ごとに0.1%のコストを支払うため、取引回数の少なさが実際に効きます。リターン、最大下落、下落1単位あたりのリターンで買い持ちと比較してください。", bt_eff: "リターン ÷ 最大DD", bt_eff_bh: "B&H: リターン ÷ DD", bt_trades: "エントリー回数", bt_time: "投資時間比率", bt_eff_note: "強い上昇相場では、タイミングフィルターが素のリターンで買い持ちに勝つことはまれです — その役割は、より小さい下落で同等のリターンを得ることです。それを測るのが「リターン ÷ 最大DD」：高いほど良い。", scr_load: "リスト全体のテクニカル分析を読み込む", scr_load_ing: "分析中", scr_buy: "テクニカル: BUY", scr_trend: "トレンド ≥ 60", bt_csv: "曲線をエクスポート（CSV）", tbt_t: "このシグナルはこの銘柄で機能したか？", tbt_sub: "両規則をこの銘柄自身の履歴（{y}年、取引ごとに0.1%のコスト）でシミュレーションし、単純な買い持ちと比較", tbt_cl: "クラシック", ck_div_b: "RSIの弱気ダイバージェンス — 価格は高値更新、RSIは未更新：トレンドの勢いが低下", ck_div_u: "RSIの強気ダイバージェンス — 価格は安値更新、RSIは未更新：売り圧力が低下", ck_str_hi: "SMA200からの乖離が自身の履歴の{p}%を上回る水準 — 押し目リスクが高い", ck_str_lo: "SMA200への近さが履歴の{p}%水準 — このトレンドでは稀なエントリー機会", sma_sub2: "支持ゾーン {s1}–{s2} · 抵抗ゾーン {r1}–{r2}（60営業日 ± ATR）· 実EOD価格", atr_l: "ATR（14）", rr_l: "リスク/リワード", ck_rr_g: "ゾーンまでのリスク/リワード {r} — 有利な比率", ck_rr_m: "リスク/リワード {r} — 中立的な比率", ck_rr_b: "リスク/リワード {r} — リスクに対し限定的な上値", regime_t: "レジームとトレンドの質", regime_sub: "Efficiency Ratio（20営業日）— 価格の動きの整然さ", reg_range: "レンジ", reg_trans: "移行期", reg_trend: "トレンド", trend_s: "トレンドスコア", entry_s: "エントリースコア", te_best: "トレンドとエントリーの方向が一致。", te_pull: "強いトレンドだが伸び切ったエントリー — 押し目待ちを検討。", te_ctr: "魅力的なエントリーだがトレンドが弱い — 逆張りリスク。", te_no: "トレンドもエントリーも好ましくない。", gap_mas: "SMA50 対 SMA200", gap_px: "価格 対 SMA200", slope50_l: "SMA50の傾き（60日）", slope200_l: "SMA200の傾き（60日）", mom_l: "モメンタム12-1", vol20_l: "出来高 対 20日平均", ck_vol_hi: "出来高が20日平均の{x}倍 — 動きに裏付けあり", ck_vol_lo: "出来高が20日平均の{x}倍 — 裏付けが弱い", ck_reg_t: "トレンド相場（ER {e}）— 移動平均シグナルの信頼性が高い", ck_reg_r: "レンジ相場（ER {e}）— 移動平均シグナルはダマシが出やすい", ck_reg_x: "移行期（ER {e}）— トレンド未確立", ck_mom_u: "12か月モメンタムはプラス（{m}%）", ck_mom_d: "12か月モメンタムはマイナス（{m}%）", refresh_btn: "↻ 更新", refresh_ing: "更新中…", refresh_ok: "更新済み", refresh_err: "更新失敗 — 1分後に再試行", dev_link: "🔬 開発段階の企業 — 最新のSEC提出書類とニュースタブを確認してください。" },
  zh: { seg_link: "📄 官方分部附注（EDGAR上的10-K）— 真实的收入来源", tag: "真实市场数据 · 每日更新 · 教育用途，非投资建议", lastclose: "最新收盘（EOD）", listed: "上市货币 {c} — 显示:", load_uni: "正在加载真实数据…", load_px: "正在加载{t}的历史…", wl_empty: "清单为空 — 打开任一股票点☆添加。", sig_t: "⚡ 重大变化", sig_sub: "由每日采集检测", notes_t: "📝 我的论点与笔记", notes_sub: "保存在本浏览器会话", notes_ph: "为何持有 — 以及什么会让你卖出。", snow_t: "雪花图", snow_sub: "六个维度，0–6 — 动量来自技术面", fsum_t: "基本面摘要", fsum_sub: "收入与利润和市场定价的对比", keyfin_t: "关键财务指标", keyfin_sub: "LTM · {c} · 真实数据", peers_t: "你宇宙中的同行", peers_sub: "{s} — 来自你跟踪的股票", open_w: "打开 →", whatif_t: "💸 如果当初投资了？", whatif_sub: "真实价格历史 · 不含税费", amount: "金额（USD）", worth: "今日价值", ret_t: "总回报", shares_t: "买入股数", estdiv: "预估股息", buyat: "于{d}以{p}买入（本币价格回报）。", dcf_t: "交互式DCF — 你的假设", dcf_sub: "5年EPS增长+12x终值折现 · 拖动实时重算", dcf_g: "EPS增长（未来5年）", dcf_r: "折现率", dcf_fv: "你的公允价值", dcf_up: "相对价格的隐含上行", peg_t: "PEG温度计", peg_sub: "市盈率 ÷ 预期年EPS增长（%）", an_sub: "{n}位分析师共识（Yahoo）— 公司自身指引不在免费源", an_mean: "平均目标", an_move: "隐含变动", an_rate: "评级", an_range: "目标区间与现价", an_note: "分析师目标是观点，常滞后且偏乐观 — 仅供参考。", pevs_t: "与同行的市盈率对比", pevs_sub: "同行均值{a}x — {t}为蓝色", rvb_t: "收入与费用拆解", rvb_sub: "LTM · {c} · 研发与SG&A来自真实报表 — 收入分部仍需付费数据", hist_t: "利润与收入历史", hist_sub: "真实年报 · {c}百万", bs_t: "资产负债表", bs_sub: "资产 vs 负债+权益 · {c}十亿 · 最新报表", ki_t: "关键信息", ki_sub: "最新报表", divy_t: "股息率: {y}%", divy_sub: "相对市场的位置", pay_t: "派息率: {p}%", pay_sub: "利润中用于分红的比例", sus: "可持续", str2: "偏紧", risk_w: "有风险", reit_note: "REIT须分配≥90%的应税利润 — 高派息属结构性。", ts_t: "交易统计", sma_sub: "支撑 {s} · 阻力 {r}（60交易日）· 真实EOD价格", sig2_t: "信号清单", sig2_sub: "经典读数的进出评分", ck_tu: "SMA50在SMA200之上 — 主升趋势", ck_td: "SMA50在SMA200之下 — 主降趋势", ck_pa: "价格在200日均线上", ck_pb: "价格在200日均线下", ck_nh: "历史不足", ck_ovs: "超卖", ck_ovb: "超买", ck_neu: "中性", ck_mu: "MACD在信号线上 — 动量为正", ck_md: "MACD在信号线下 — 动量为负", verdict_t: "混合裁决", verdict_sub: "基本面+技术面，基于真实数据", v1t: "基本面扎实 + 技术面有利", v1d: "论点与时机同向 — 正是此混合方法寻找的局面。", v2t: "好公司，坏时机", v2d: "基本面过关，但图形尚未确认入场。", v3t: "图形好看，基本面弱", v3d: "技术面提示入场，但基本面撑不起长期持仓。", v4t: "暂且回避", v4d: "基本面与技术面都不支持入场。留在清单观察。", vref: "参考位: 支撑 {s} · 阻力 {r}{f}。教育用途 — 非建议。", fv_word: " · 简易DCF公允价值 {v}", scr_sub: "对实时宇宙的基本面筛选", res_t: "结果 — {b}中的{a}", res_sub: "点按查看完整分析与技术区间", all_w: "全部", cmp_sub: "每行最优值高亮 — 真实数据，USD", snowov_t: "雪花叠加", snowov_sub: "基本面轴（动量需加载每个图表）", bt_rule: "规则: 仅当SMA50 > SMA200且价格 > SMA200时持有 · 真实价格", bt_btn: "▶ 运行回测（{n}份历史）", bt_load: "加载历史中… {a}/{b}", bt_err: "该选择的历史不足 — 试更长周期或整个清单。", bt_ret: "策略回报", bt_bh: "买入持有", bt_dd: "最大回撤（策略）", bt_bhdd: "最大回撤（B&H）", bt_note: "基于真实历史的真实模拟（含每笔0.1%的交易成本）。过去不保证未来。", bt_scope: "范围", bt_all: "整个清单", bt_period: "周期", bt_from: "从", bt_to: "到", bt_rerun: "↻ 再次运行", soon: " — 敬请期待", cs_note: "该模块需要付费数据源。其余全部基于免费真实数据每日更新。", opt_body: "实时期权链与隐含波动率需要授权行情。", soc_t: "社交情绪 — 敬请期待", soc_b: "Reddit/X情绪需付费API。上方新闻真实且免费。", ins_none: "近期披露无公开市场买卖 — 仅例行授予/行权。", si: "登录", ca: "创建免费账户", no_acc: "没有账户？免费创建 →", have_acc: "已有账户？登录 →", free_note: "免费版: 清单最多{w}只 · 每日5次新搜索。", my_list: "我的清单", all_cached: "全部缓存", category: "类别", playbook: "策略", ratiosFor: "{t}的关键指标", aboutT: "关于{n}", thesis_t: "✨ AI生成论点", thesis_sub: "基于实时指标、分析师共识、内部人和技术面构建 — 是起点而非建议", ins_t: "内部人动向", ins_sub: "SEC Form 4 — 解析的买卖（美国上市）", buys: "买入", sells: "卖出", grants: "授予/其他", ins_note: "公开市场买入（代码P）最重要 — 授予与期权行权属常规薪酬。", analyst_t: "分析师预测", news_t: "最新新闻", fund_score: "基本面评分", tech_read: "技术面判断", bt_what: "回测是做什么的？", bt_expl: "它在你跟踪的全部真实历史上重演本应用的择时规则（仅当SMA50 > SMA200且价格 > SMA200时持有），并与买入持有对比。它回答：该过滤器是否有效，回撤小了多少？", bt_rule_l: "规则", bt_r_v2: "v2 · 行情过滤+缓冲", bt_r_classic: "经典 · 每日交叉", bt_rule2: "规则v2：每周评估买入（SMA50 > SMA200、价格 > SMA200且非震荡行情）· 每日评估卖出，仅当价格收于SMA200下方1.5%时离场 · 每笔交易0.1%成本 · 真实价格", bt_expl2: "规则v2针对经典过滤器最大的弱点 — 震荡行情中的假信号 — 同时不延误对暴跌的反应。买入每周确认一次，震荡行情（Efficiency Ratio < 0.25）时跳过；卖出每日评估但留有缓冲：仅当价格收于SMA200下方1.5%时离场。两种规则每笔交易都支付0.1%成本，因此更少的交易真正有意义。请在回报、最大回撤和单位回撤回报上与买入持有对比。", bt_eff: "回报 ÷ 最大回撤", bt_eff_bh: "B&H：回报 ÷ 回撤", bt_trades: "买入次数", bt_time: "持仓时间占比", bt_eff_note: "在强劲牛市中，择时过滤器很少能在绝对回报上战胜买入持有 — 它的作用是以更小的回撤取得相近的回报。'回报 ÷ 最大回撤'衡量的正是这一点：越高越好。", scr_load: "为整个列表加载技术分析", scr_load_ing: "分析中", scr_buy: "技术面: BUY", scr_trend: "趋势 ≥ 60", bt_csv: "导出曲线（CSV）", tbt_t: "该信号在这只股票上有效吗？", tbt_sub: "两种规则均在该股自身历史（{y}年，每笔交易0.1%成本）上模拟，并与单纯买入持有对比", tbt_cl: "经典", ck_div_b: "RSI顶背离 — 价格创出更高的高点而RSI没有：趋势动能减弱", ck_div_u: "RSI底背离 — 价格创出更低的低点而RSI没有：抛压减弱", ck_str_hi: "价格相对SMA200的乖离高于自身历史的{p}% — 回调风险偏高", ck_str_lo: "价格贴近SMA200的程度处于历史{p}%分位 — 该趋势中少见的入场点", sma_sub2: "支撑区 {s1}–{s2} · 阻力区 {r1}–{r2}（60个交易日 ± ATR）· 真实EOD价格", atr_l: "ATR（14）", rr_l: "风险/回报", ck_rr_g: "至区间的风险/回报 {r} — 比率有利", ck_rr_m: "风险/回报 {r} — 比率中性", ck_rr_b: "风险/回报 {r} — 上行空间相对风险有限", regime_t: "行情状态与趋势质量", regime_sub: "Efficiency Ratio（20个交易日）— 价格走势的干净程度", reg_range: "震荡", reg_trans: "过渡", reg_trend: "趋势", trend_s: "趋势评分", entry_s: "入场评分", te_best: "趋势与入场方向一致。", te_pull: "趋势强劲但入场偏高 — 可考虑等待回调。", te_ctr: "入场点吸引但趋势偏弱 — 逆势风险。", te_no: "趋势和入场均不理想。", gap_mas: "SMA50 对 SMA200", gap_px: "价格 对 SMA200", slope50_l: "SMA50斜率（60日）", slope200_l: "SMA200斜率（60日）", mom_l: "12-1动量", vol20_l: "成交量对20日均量", ck_vol_hi: "成交量为20日均量的{x}倍 — 走势有确认", ck_vol_lo: "成交量为20日均量的{x}倍 — 确认不足", ck_reg_t: "趋势行情（ER {e}）— 均线信号在此可靠", ck_reg_r: "震荡行情（ER {e}）— 均线信号易出假信号", ck_reg_x: "过渡行情（ER {e}）— 趋势尚未确立", ck_mom_u: "12个月动量为正（{m}%）", ck_mom_d: "12个月动量为负（{m}%）", refresh_btn: "↻ 刷新", refresh_ing: "更新中…", refresh_ok: "已更新", refresh_err: "刷新失败 — 一分钟后再试", dev_link: "🔬 处于研发阶段的公司 — 请查看最新SEC文件与新闻标签。" },
};

/* Lynch categories, localized (name / description / playbook) */
const LY = {
  en: null, // falls back to LYNCH_TYPES
  pt: { fast: { n: "Crescimento rápido", d: "Lucros crescendo 20%+ ao ano — os potenciais tenbaggers, com volatilidade à altura.", s: "Compre a crescimento razoável (PEG), acompanhe se a expansão continua e cuidado quando o crescimento desacelerar." }, stalwart: { n: "Gigante sólida", d: "Grande, lucrativa e previsível; cresce um dígito alto. Protege a carteira em quedas.", s: "Compre em correções, venda após ganhos de 30–50% e recomece — não espere multiplicação." }, slow: { n: "Crescimento lento", d: "Madura, cresce pouco e paga dividendos. O retorno vem da renda, não da expansão.", s: "Só vale por dividendo confiável: exija yield alto e payout sustentável." }, cyclical: { n: "Cíclica", d: "Lucros sobem e descem com o ciclo (commodities, chips, indústria). O P/E engana: parece cara no fundo e barata no topo.", s: "Compre no pessimismo do ciclo (P/E alto/negativo) e venda na euforia (P/E baixo). O P/E futuro é a pista." }, turnaround: { n: "Recuperação", d: "Empresa em crise ou pré-lucro (inclui biotechs em desenvolvimento). Alto risco, retorno potencialmente enorme.", s: "Exija caixa para sobreviver e sinais concretos de virada; posição pequena — algumas vão a zero." }, asset: { n: "Jogo de ativos", d: "Vale menos na bolsa do que os ativos que possui (imóveis, caixa, participações).", s: "Compre o desconto sobre o patrimônio e espere o mercado (ou um comprador) enxergar o valor." }, etf: { n: "Fundo (ETF)", d: "Cesta diversificada de ativos — você compra o mercado, não uma empresa.", s: "Foque em custo (expense ratio), o índice que replica e aportes constantes." }, reit: { n: "Imobiliário (REIT)", d: "Fundo imobiliário: obrigado a distribuir ≥90% do lucro — máquina de renda.", s: "Avalie por dividendos, ocupação e custo da dívida; sensível a juros." } },
  es: { fast: { n: "Crecimiento rápido", d: "Beneficios creciendo 20%+ anual — potenciales tenbaggers, con volatilidad acorde.", s: "Compra a crecimiento razonable (PEG), vigila que la expansión continúe y cuidado cuando desacelere." }, stalwart: { n: "Gigante sólida", d: "Grande, rentable y predecible; crece un dígito alto. Protege la cartera en caídas.", s: "Compra en correcciones, vende tras 30–50% y repite — no esperes multiplicación." }, slow: { n: "Crecimiento lento", d: "Madura, crece poco y paga dividendos. El retorno viene de la renta.", s: "Solo vale por el dividendo fiable: exige yield alto y payout sostenible." }, cyclical: { n: "Cíclica", d: "Beneficios suben y bajan con el ciclo. El P/E engaña: cara en el suelo, barata en el techo.", s: "Compra en el pesimismo del ciclo y vende en la euforia. El P/E futuro es la pista." }, turnaround: { n: "Recuperación", d: "Empresa en crisis o pre-beneficio (incluye biotechs en desarrollo). Alto riesgo, retorno potencialmente enorme.", s: "Exige caja para sobrevivir y señales concretas de giro; posición pequeña." }, asset: { n: "Juego de activos", d: "Vale menos en bolsa que sus activos (inmuebles, caja, participaciones).", s: "Compra el descuento sobre el patrimonio y espera a que el mercado lo reconozca." }, etf: { n: "Fondo (ETF)", d: "Cesta diversificada — compras el mercado, no una empresa.", s: "Céntrate en costes, el índice replicado y aportes constantes." }, reit: { n: "Inmobiliario (REIT)", d: "Debe distribuir ≥90% del beneficio — máquina de renta.", s: "Valóralo por dividendos, ocupación y coste de la deuda; sensible a tipos." } },
  fr: { fast: { n: "Croissance rapide", d: "Bénéfices en hausse de 20%+ par an — les tenbaggers potentiels, volatilité à l'avenant.", s: "Achetez à croissance raisonnable (PEG), surveillez que l'expansion continue, prudence quand elle ralentit." }, stalwart: { n: "Valeur solide", d: "Grande, rentable, prévisible ; croissance à un chiffre élevé. Protège en baisse.", s: "Achetez sur repli, vendez après 30–50% et recommencez — pas de multiplication à attendre." }, slow: { n: "Croissance lente", d: "Mature, croît peu, paie des dividendes. Le rendement vient du revenu.", s: "Ne vaut que par un dividende fiable : exigez un rendement élevé et un payout tenable." }, cyclical: { n: "Cyclique", d: "Les bénéfices suivent le cycle. Le P/E trompe : chère au creux, bon marché au sommet.", s: "Achetez dans le pessimisme du cycle, vendez dans l'euphorie. Le P/E prévisionnel est l'indice." }, turnaround: { n: "Retournement", d: "Société en crise ou pré-bénéfice (biotechs en développement incluses). Risque élevé, gain potentiellement énorme.", s: "Exigez du cash pour survivre et des signes concrets de redressement ; petite position." }, asset: { n: "Jeu d'actifs", d: "Vaut moins en bourse que ses actifs (immobilier, cash, participations).", s: "Achetez la décote sur l'actif net et attendez que le marché la voie." }, etf: { n: "Fonds (ETF)", d: "Panier diversifié — vous achetez le marché, pas une société.", s: "Priorité aux frais, à l'indice répliqué et aux versements réguliers." }, reit: { n: "Immobilier (REIT)", d: "Doit distribuer ≥90% du résultat — machine à revenus.", s: "Jugez sur dividendes, occupation et coût de la dette ; sensible aux taux." } },
  he: { fast: { n: "צמיחה מהירה", d: "רווחים צומחים 20%+ בשנה — טנבאגרים פוטנציאליים, עם תנודתיות בהתאם.", s: "קנה בצמיחה במחיר סביר (PEG), עקוב שההתרחבות נמשכת והיזהר כשהצמיחה מאטה." }, stalwart: { n: "ענקית יציבה", d: "גדולה, רווחית וצפויה; צומחת חד-ספרתי גבוה. מגינה על התיק בירידות.", s: "קנה בתיקונים, מכור אחרי 30–50% והתחל מחדש — אל תצפה להכפלות." }, slow: { n: "צמיחה איטית", d: "בוגרת, צומחת מעט ומחלקת דיבידנד. התשואה מגיעה מהכנסה.", s: "שווה רק בזכות דיבידנד אמין: דרוש תשואה גבוהה ופיצול בר-קיימא." }, cyclical: { n: "מחזורית", d: "הרווחים עולים ויורדים עם המחזור. המכפיל מטעה: יקר בתחתית, זול בפסגה.", s: "קנה בפסימיות של המחזור ומכור באופוריה. המכפיל העתידי הוא הרמז." }, turnaround: { n: "התאוששות", d: "חברה במשבר או טרום-רווח (כולל ביוטק בפיתוח). סיכון גבוה, פוטנציאל עצום.", s: "דרוש מזומן לשרוד וסימני מפנה קונקרטיים; פוזיציה קטנה." }, asset: { n: "משחק נכסים", d: "שווה בבורסה פחות מהנכסים שבבעלותה (נדל\"ן, מזומן, החזקות).", s: "קנה את הדיסקאונט על ההון והמתן שהשוק יראה את הערך." }, etf: { n: "קרן (ETF)", d: "סל מפוזר — אתה קונה את השוק, לא חברה.", s: "התמקד בדמי ניהול, במדד המשוכפל ובהפקדות קבועות." }, reit: { n: "נדל\"ן (REIT)", d: "חייב לחלק ≥90% מהרווח — מכונת הכנסה.", s: "שפוט לפי דיבידנד, תפוסה ועלות חוב; רגיש לריבית." } },
  ar: { fast: { n: "نمو سريع", d: "أرباح تنمو 20%+ سنويًا — مرشح ليكون تنباغر، بتقلب موازٍ.", s: "اشترِ النمو بسعر معقول (PEG)، وراقب استمرار التوسع، واحذر عند التباطؤ." }, stalwart: { n: "عملاق راسخ", d: "كبيرة ومربحة ويمكن التنبؤ بها؛ تنمو برقم أحادي مرتفع. تحمي المحفظة في الهبوط.", s: "اشترِ في التصحيحات وبِع بعد 30–50% وكرّر — لا تنتظر المضاعفات." }, slow: { n: "نمو بطيء", d: "ناضجة، نمو ضعيف وتوزع أرباحًا. العائد من الدخل.", s: "قيمتها في التوزيع الموثوق: اشترط عائدًا مرتفعًا ونسبة توزيع مستدامة." }, cyclical: { n: "دورية", d: "الأرباح تصعد وتهبط مع الدورة. المكرر مضلل: غالية في القاع رخيصة في القمة.", s: "اشترِ في تشاؤم الدورة وبِع في النشوة. المكرر المستقبلي هو الدليل." }, turnaround: { n: "تعافٍ", d: "شركة متعثرة أو قبل الربحية (تشمل البيوتك قيد التطوير). خطر عالٍ وعائد محتمل ضخم.", s: "اشترط سيولة للبقاء وإشارات تحول ملموسة؛ مركز صغير." }, asset: { n: "لعبة أصول", d: "قيمتها في السوق أقل من أصولها (عقارات، نقد، حصص).", s: "اشترِ الخصم على الأصول وانتظر أن يراه السوق." }, etf: { n: "صندوق (ETF)", d: "سلة متنوعة — تشتري السوق لا شركة.", s: "ركّز على الرسوم والمؤشر المتّبع والمساهمات المنتظمة." }, reit: { n: "عقاري (REIT)", d: "ملزم بتوزيع ≥90% من الأرباح — آلة دخل.", s: "قيّمه بالتوزيعات والإشغال وكلفة الدين؛ حساس للفائدة." } },
  ja: { fast: { n: "急成長株", d: "利益が年20%超で成長 — テンバガー候補、ただし変動も大きい。", s: "適正な価格の成長（PEG）で買い、拡大の継続を確認し、減速時は警戒。" }, stalwart: { n: "優良大型株", d: "大きく、収益性が高く予測可能。高い一桁成長。下落局面で守りになる。", s: "押し目で買い、30〜50%上昇で売って繰り返す — 倍増は期待しない。" }, slow: { n: "低成長株", d: "成熟し成長は僅か、配当を出す。リターンはインカムから。", s: "信頼できる配当があってこそ：高利回りと持続可能な配当性向を要求。" }, cyclical: { n: "景気循環株", d: "利益が景気で上下。PERは逆に出る：底で割高、天井で割安に見える。", s: "悲観の底で買い、熱狂で売る。予想PERが手掛かり。" }, turnaround: { n: "業績回復株", d: "危機下または黒字化前（開発段階のバイオ含む）。高リスク・高リターン。", s: "生き残る現金と具体的な好転サインを要求；小さく張る。" }, asset: { n: "資産株", d: "保有資産（不動産・現金・持分）より安く取引される。", s: "純資産へのディスカウントを買い、市場が気づくのを待つ。" }, etf: { n: "ファンド（ETF）", d: "分散されたバスケット — 企業でなく市場を買う。", s: "コスト、連動指数、定期積立に集中。" }, reit: { n: "不動産（REIT）", d: "利益の90%以上を分配義務 — インカムマシン。", s: "分配金・稼働率・負債コストで評価；金利に敏感。" } },
  zh: { fast: { n: "快速成长", d: "利润每年增长20%以上 — 潜在的十倍股，波动同样剧烈。", s: "以合理价格买入成长（PEG），跟踪扩张是否持续，减速时要小心。" }, stalwart: { n: "稳健大盘", d: "大型、盈利且可预测；高个位数增长。下跌时保护组合。", s: "回调时买入，涨30–50%后卖出再来 — 别指望翻倍。" }, slow: { n: "缓慢增长", d: "成熟、增长有限、派息。回报来自收入。", s: "只因可靠股息而值得：要求高收益率和可持续派息率。" }, cyclical: { n: "周期股", d: "利润随周期起落。市盈率会骗人：谷底显贵，顶部显便宜。", s: "在周期悲观时买入，狂热时卖出。预期市盈率是线索。" }, turnaround: { n: "困境反转", d: "陷入危机或尚未盈利（含研发期生物科技）。高风险，潜在回报巨大。", s: "要求足以生存的现金和具体反转信号；小仓位。" }, asset: { n: "资产型", d: "市值低于其持有资产（地产、现金、股权）。", s: "买入对净资产的折价，等市场发现价值。" }, etf: { n: "基金（ETF）", d: "分散的一篮子 — 买的是市场而非公司。", s: "关注费率、跟踪的指数与定期投入。" }, reit: { n: "房地产（REIT）", d: "须分配≥90%利润 — 收入机器。", s: "按股息、出租率与债务成本评估；对利率敏感。" } },
};

/* thesis phrases, translated — filled with {placeholders} */
const fillT = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const TH = {
  en: { industry: "It operates in {ind}.", posTop: "It is the largest player among your tracked peers ({mc} market cap).", posMid: "A mid-sized player among your tracked peers ({mc}).", posSmall: "A smaller player among your tracked peers ({mc}).", revexp: "Consensus expects revenue moving ~{g}%/yr.", devstage: "Development-stage: products aren't generating meaningful revenue yet — trial phases and timelines aren't in free data, so check the latest filings and news.", intro: "{name} — {type}{sector}.", valBelow: "Trades ~{d}% below a simple DCF fair value — some margin of safety.", valAbove: "Trades ~{d}% above fair value — optimism is already priced in.", valNear: "Trades near a simple DCF fair value.", pegCheap: "PEG {p}: growth looks underpriced.", pegFair: "PEG {p}: growth fairly priced.", pegRich: "PEG {p}: paying up for growth.", analyst: "{n} analysts, mean target {t} ({u}% implied, rating: {r}).", rebound: "The market is pricing a ~{x}% earnings jump ahead (trailing vs. forward P/E).", balSolid: "Solid balance sheet (D/E {d}).", balRisk: "The balance sheet is the key risk (interest coverage {c}x).", balMod: "Moderate leverage (D/E {d}).", insBuy: "Insiders have been net buyers lately ({b} buys vs {s} sells).", insSell: "Insiders have been net sellers lately ({s} sells vs {b} buys).", techGood: "The chart is technically constructive.", techBad: "The chart is technically weak.", techNeut: "The chart is technically neutral.", fwd: "If consensus growth (~{g}%/yr) lands, earnings compound ~{c}% over 3 years.", alignYes: "Fundamentals and timing align reasonably well.", alignNo: "The pieces don't fully line up yet — patience or small sizing." },
  pt: { industry: "Atua em {ind}.", posTop: "É a maior entre os pares que você acompanha ({mc} de valor de mercado).", posMid: "Porte médio entre os pares acompanhados ({mc}).", posSmall: "Uma das menores entre os pares acompanhados ({mc}).", revexp: "O consenso espera receita variando ~{g}%/ano.", devstage: "Estágio de desenvolvimento: os produtos ainda não geram receita relevante — fases de testes e prazos não constam em dados gratuitos; confira os filings e as notícias.", intro: "{name} — {type}{sector}.", valBelow: "Negocia ~{d}% abaixo de um valor justo (DCF simples) — alguma margem de segurança.", valAbove: "Negocia ~{d}% acima do valor justo — o otimismo já está no preço.", valNear: "Negocia perto de um valor justo (DCF simples).", pegCheap: "PEG {p}: crescimento parece barato.", pegFair: "PEG {p}: crescimento precificado de forma justa.", pegRich: "PEG {p}: pagando caro pelo crescimento.", analyst: "{n} analistas, alvo médio {t} ({u}% implícito, recomendação: {r}).", rebound: "O mercado precifica um salto de ~{x}% nos lucros à frente (P/L atual vs. futuro).", balSolid: "Balanço sólido (D/E {d}).", balRisk: "O balanço é o principal risco (cobertura de juros {c}x).", balMod: "Alavancagem moderada (D/E {d}).", insBuy: "Insiders compraram na ponta recente ({b} compras vs {s} vendas).", insSell: "Insiders venderam na ponta recente ({s} vendas vs {b} compras).", techGood: "O gráfico está tecnicamente construtivo.", techBad: "O gráfico está tecnicamente fraco.", techNeut: "O gráfico está tecnicamente neutro.", fwd: "Se o crescimento do consenso (~{g}%/ano) se confirmar, o lucro acumula ~{c}% em 3 anos.", alignYes: "Fundamentos e timing se alinham razoavelmente.", alignNo: "As peças ainda não se encaixam — paciência ou posição pequena." },
  es: { industry: "Opera en {ind}.", posTop: "Es la mayor entre tus pares seguidos ({mc} de capitalización).", posMid: "Tamaño medio entre los pares seguidos ({mc}).", posSmall: "Una de las menores entre los pares seguidos ({mc}).", revexp: "El consenso espera ingresos moviéndose ~{g}%/año.", devstage: "Fase de desarrollo: los productos aún no generan ingresos relevantes — fases y plazos de ensayos no están en datos gratuitos; revisa filings y noticias.", intro: "{name} — {type}{sector}.", valBelow: "Cotiza ~{d}% por debajo de un valor justo (DCF simple) — algo de margen de seguridad.", valAbove: "Cotiza ~{d}% por encima del valor justo — el optimismo ya está en el precio.", valNear: "Cotiza cerca de un valor justo (DCF simple).", pegCheap: "PEG {p}: el crecimiento parece barato.", pegFair: "PEG {p}: crecimiento bien valorado.", pegRich: "PEG {p}: pagando caro por el crecimiento.", analyst: "{n} analistas, objetivo medio {t} ({u}% implícito, recomendación: {r}).", rebound: "El mercado descuenta un salto de ~{x}% en beneficios (P/E actual vs. futuro).", balSolid: "Balance sólido (D/E {d}).", balRisk: "El balance es el riesgo clave (cobertura de intereses {c}x).", balMod: "Apalancamiento moderado (D/E {d}).", insBuy: "Los insiders compraron recientemente ({b} compras vs {s} ventas).", insSell: "Los insiders vendieron recientemente ({s} ventas vs {b} compras).", techGood: "El gráfico es técnicamente constructivo.", techBad: "El gráfico es técnicamente débil.", techNeut: "El gráfico es técnicamente neutral.", fwd: "Si el crecimiento del consenso (~{g}%/año) se cumple, el beneficio acumula ~{c}% en 3 años.", alignYes: "Fundamentales y timing se alinean razonablemente.", alignNo: "Las piezas aún no encajan — paciencia o posición pequeña." },
  fr: { industry: "Elle opère dans {ind}.", posTop: "C'est le plus grand acteur parmi vos pairs suivis ({mc} de capitalisation).", posMid: "Acteur de taille moyenne parmi vos pairs suivis ({mc}).", posSmall: "Un acteur plus petit parmi vos pairs suivis ({mc}).", revexp: "Le consensus attend un chiffre d'affaires évoluant de ~{g}%/an.", devstage: "Phase de développement : les produits ne génèrent pas encore de revenus significatifs — phases d'essais et délais absents des données gratuites ; consultez les dépôts et les actualités.", intro: "{name} — {type}{sector}.", valBelow: "S'échange ~{d}% sous une juste valeur (DCF simple) — une marge de sécurité.", valAbove: "S'échange ~{d}% au-dessus de la juste valeur — l'optimisme est déjà dans le prix.", valNear: "S'échange près d'une juste valeur (DCF simple).", pegCheap: "PEG {p} : la croissance semble sous-évaluée.", pegFair: "PEG {p} : croissance correctement valorisée.", pegRich: "PEG {p} : la croissance se paie cher.", analyst: "{n} analystes, objectif moyen {t} ({u}% implicite, avis : {r}).", rebound: "Le marché anticipe un bond de ~{x}% des bénéfices (P/E courant vs. prévisionnel).", balSolid: "Bilan solide (D/E {d}).", balRisk: "Le bilan est le risque clé (couverture des intérêts {c}x).", balMod: "Levier modéré (D/E {d}).", insBuy: "Les initiés ont récemment acheté ({b} achats vs {s} ventes).", insSell: "Les initiés ont récemment vendu ({s} ventes vs {b} achats).", techGood: "Le graphique est techniquement constructif.", techBad: "Le graphique est techniquement faible.", techNeut: "Le graphique est techniquement neutre.", fwd: "Si la croissance du consensus (~{g}%/an) se réalise, le bénéfice cumule ~{c}% sur 3 ans.", alignYes: "Fondamentaux et timing s'alignent raisonnablement.", alignNo: "Les pièces ne s'emboîtent pas encore — patience ou petite position." },
  he: { industry: "פועלת בתחום {ind}.", posTop: "הגדולה מבין העמיתים שאתה עוקב ({mc} שווי שוק).", posMid: "בגודל בינוני בין העמיתים במעקב ({mc}).", posSmall: "מהקטנות בין העמיתים במעקב ({mc}).", revexp: "הקונצנזוס מצפה להכנסות משתנות ~{g}% בשנה.", devstage: "שלב פיתוח: המוצרים עוד לא מייצרים הכנסה משמעותית — שלבי ניסויים ולוחות זמנים אינם בנתונים חינמיים; בדוק דיווחים וחדשות.", intro: "{name} — {type}{sector}.", valBelow: "נסחרת ~{d}% מתחת לשווי הוגן (DCF פשוט) — מרווח ביטחון מסוים.", valAbove: "נסחרת ~{d}% מעל השווי ההוגן — האופטימיות כבר במחיר.", valNear: "נסחרת קרוב לשווי הוגן (DCF פשוט).", pegCheap: "PEG {p}: הצמיחה נראית זולה.", pegFair: "PEG {p}: הצמיחה מתומחרת הוגן.", pegRich: "PEG {p}: משלמים ביוקר על הצמיחה.", analyst: "{n} אנליסטים, יעד ממוצע {t} ({u}% גלום, המלצה: {r}).", rebound: "השוק מתמחר זינוק של ~{x}% ברווחים (מכפיל נוכחי מול עתידי).", balSolid: "מאזן איתן (D/E {d}).", balRisk: "המאזן הוא הסיכון המרכזי (כיסוי ריבית {c}x).", balMod: "מינוף מתון (D/E {d}).", insBuy: "בעלי עניין קנו לאחרונה ({b} קניות מול {s} מכירות).", insSell: "בעלי עניין מכרו לאחרונה ({s} מכירות מול {b} קניות).", techGood: "הגרף חיובי טכנית.", techBad: "הגרף חלש טכנית.", techNeut: "הגרף ניטרלי טכנית.", fwd: "אם צמיחת הקונצנזוס (~{g}% בשנה) תתממש, הרווח יצטבר ~{c}% בשלוש שנים.", alignYes: "הפונדמנטלס והתזמון מתיישרים סביר.", alignNo: "החלקים עוד לא מתחברים — סבלנות או פוזיציה קטנה." },
  ar: { industry: "تعمل في {ind}.", posTop: "الأكبر بين نظرائك المتابَعين ({mc} قيمة سوقية).", posMid: "حجم متوسط بين النظراء المتابَعين ({mc}).", posSmall: "من الأصغر بين النظراء المتابَعين ({mc}).", revexp: "يتوقع الإجماع إيرادات تتحرك ~{g}% سنويًا.", devstage: "مرحلة تطوير: المنتجات لا تدرّ إيرادات مهمة بعد — مراحل التجارب والجداول غير متاحة مجانًا؛ راجع الإيداعات والأخبار.", intro: "{name} — {type}{sector}.", valBelow: "يتداول ~{d}% دون القيمة العادلة (DCF مبسّط) — هامش أمان ما.", valAbove: "يتداول ~{d}% فوق القيمة العادلة — التفاؤل في السعر بالفعل.", valNear: "يتداول قرب القيمة العادلة (DCF مبسّط).", pegCheap: "PEG {p}: النمو يبدو رخيصًا.", pegFair: "PEG {p}: النمو مسعّر بعدل.", pegRich: "PEG {p}: تدفع كثيرًا مقابل النمو.", analyst: "{n} محللين، هدف متوسط {t} ({u}% ضمني، التوصية: {r}).", rebound: "السوق يسعّر قفزة ~{x}% في الأرباح (مكرر حالي مقابل مستقبلي).", balSolid: "ميزانية متينة (D/E {d}).", balRisk: "الميزانية هي الخطر الرئيسي (تغطية الفائدة {c}x).", balMod: "رافعة معتدلة (D/E {d}).", insBuy: "المطّلعون اشتروا مؤخرًا ({b} شراء مقابل {s} بيع).", insSell: "المطّلعون باعوا مؤخرًا ({s} بيع مقابل {b} شراء).", techGood: "الرسم البياني إيجابي فنيًا.", techBad: "الرسم البياني ضعيف فنيًا.", techNeut: "الرسم البياني محايد فنيًا.", fwd: "إذا تحقق نمو الإجماع (~{g}% سنويًا)، تتراكم الأرباح ~{c}% خلال 3 سنوات.", alignYes: "الأساسيات والتوقيت متوافقان بشكل معقول.", alignNo: "القطع لا تتطابق بعد — صبر أو مركز صغير." },
  ja: { industry: "{ind}分野で事業を展開。", posTop: "追跡中の同業内で最大手（時価総額{mc}）。", posMid: "追跡中の同業内で中堅（{mc}）。", posSmall: "追跡中の同業内では小規模（{mc}）。", revexp: "コンセンサスは売上が年約{g}%で推移すると予想。", devstage: "開発段階：製品はまだ有意な売上を生んでいない — 試験フェーズや時期は無料データに含まれないため、最新の提出書類とニュースを確認。", intro: "{name} — {type}{sector}。", valBelow: "簡易DCFの適正価値を約{d}%下回る水準 — 一定の安全余地。", valAbove: "適正価値を約{d}%上回る水準 — 楽観は織り込み済み。", valNear: "簡易DCFの適正価値近辺で推移。", pegCheap: "PEG {p}：成長は割安に見える。", pegFair: "PEG {p}：成長は適正評価。", pegRich: "PEG {p}：成長に高値を払う状態。", analyst: "アナリスト{n}名、平均目標{t}（含意{u}%、評価：{r}）。", rebound: "市場は利益の約{x}%の急回復を織り込む（実績vs予想PER）。", balSolid: "財務は健全（D/E {d}）。", balRisk: "財務が最大のリスク（利息カバレッジ{c}倍）。", balMod: "レバレッジは中程度（D/E {d}）。", insBuy: "インサイダーは直近買い越し（買{b}件 vs 売{s}件）。", insSell: "インサイダーは直近売り越し（売{s}件 vs 買{b}件）。", techGood: "チャートはテクニカルに良好。", techBad: "チャートはテクニカルに弱い。", techNeut: "チャートはテクニカルに中立。", fwd: "コンセンサス成長（年約{g}%）が実現すれば、3年で利益は約{c}%増。", alignYes: "ファンダメンタルズとタイミングは概ね一致。", alignNo: "まだ条件が揃わない — 待つか小さく。", },
  zh: { industry: "所处行业：{ind}。", posTop: "在你跟踪的同行中规模最大（市值{mc}）。", posMid: "在跟踪的同行中属中等规模（{mc}）。", posSmall: "在跟踪的同行中规模较小（{mc}）。", revexp: "共识预期营收每年变动约{g}%。", devstage: "研发阶段：产品尚未产生可观收入 — 试验阶段与时间表不在免费数据中；请查看最新文件与新闻。", intro: "{name} — {type}{sector}。", valBelow: "较简易DCF公允价值低约{d}% — 具备一定安全边际。", valAbove: "较公允价值高约{d}% — 乐观已计入价格。", valNear: "接近简易DCF公允价值。", pegCheap: "PEG {p}：增长显得便宜。", pegFair: "PEG {p}：增长定价合理。", pegRich: "PEG {p}：为增长付出高价。", analyst: "{n}位分析师，平均目标价{t}（隐含{u}%，评级：{r}）。", rebound: "市场正在定价约{x}%的盈利跃升（当前vs预期市盈率）。", balSolid: "资产负债表稳健（D/E {d}）。", balRisk: "资产负债表是主要风险（利息保障{c}倍）。", balMod: "杠杆适中（D/E {d}）。", insBuy: "内部人近期净买入（{b}买 vs {s}卖）。", insSell: "内部人近期净卖出（{s}卖 vs {b}买）。", techGood: "技术面偏积极。", techBad: "技术面偏弱。", techNeut: "技术面中性。", fwd: "若共识增长（约{g}%/年）兑现，3年盈利累计约{c}%。", alignYes: "基本面与时机基本一致。", alignNo: "条件尚未齐备 — 耐心或小仓位。", },
};

function seriesFromPrices(prices) {
  const out = (prices || []).map((p, i) => {
    const dt = new Date(p.d);
    return {
      i, ts: dt.getTime(),
      date: dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      dLong: dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      close: +p.close, v: +(p.v || 0) / 1e6,
      hi: p.high == null ? null : +p.high, lo: p.low == null ? null : +p.low,
    };
  });
  // pad short histories so SMA200/RSI have room (young/thin listings) —
  // padCount lets the charts hide the artificial flat prefix
  let padCount = 0;
  while (out.length > 0 && out.length < 230) { out.unshift({ ...out[0] }); padCount++; }
  return { series: out.map((d, i) => ({ ...d, i })), padCount };
}

/* fundamentals-only 5-axis scores (no price history needed) */
function scores5(s) {
  const { peg } = pegInfo(s);
  const value = clamp6(((s.pe > 0 && s.pe < s.sectorPE ? 4.5 : 2.5) + (peg !== null && peg < 1 ? 5.5 : peg !== null && peg <= 1.5 ? 3.5 : 1.5)) / 2);
  const future = clamp6(s.forecastG <= 0 ? 0.8 : s.forecastG / 4.5);
  const past = clamp6((s.roe > 0 ? s.roe / 5 : 0) * 0.6 + (s.netMargin > 0 ? Math.min(6, s.netMargin / 3) : 0) * 0.4);
  const health = clamp6((s.debtEq < 0.3 ? 6 : s.debtEq < 0.7 ? 4.5 : s.debtEq < 1.2 ? 3 : 1.5) * 0.7 + Math.min(6, (s.coverage || 0) / 4) * 0.3);
  const dividend = clamp6(s.divYield * 0.8 + (s.payout > 0 && s.payout < 70 ? 1 : 0));
  return [
    { axis: "Value", v: value }, { axis: "Future", v: future }, { axis: "Past", v: past },
    { axis: "Health", v: health }, { axis: "Dividend", v: dividend },
  ];
}

function NewsTab({ ticker, name, tt }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    setItems(null);
    fetch(`${API_BASE}/news?ticker=${encodeURIComponent(ticker)}&name=${encodeURIComponent(name || "")}`)
      .then((r) => r.json()).then((d) => alive && setItems(d.items || []))
      .catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [ticker]);
  return (
    <div className="space-y-4">
      <Card title={tt ? tt("news_t") : "Latest news"} sub="Google News" accent={C.accent}>
        {items === null ? (
          <div className="py-6 text-center text-sm animate-pulse" style={{ color: C.dim }}>loading headlines…</div>
        ) : items.length === 0 ? (
          <div className="py-4 text-sm" style={{ color: C.dim }}>No recent headlines found for this ticker.</div>
        ) : (
          <div className="space-y-1">
            {items.map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
                className="block py-2.5" style={{ borderBottom: `1px solid ${C.line}`, textDecoration: "none" }}>
                <div className="text-sm leading-snug" style={{ color: C.text }}>{n.title}</div>
                <div className="text-xs mt-0.5" style={{ color: C.dim, fontFamily: FONT_MONO }}>
                  {n.source}{n.date ? ` · ${new Date(n.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>
      <Card title={tt ? tt("soc_t") : "Social sentiment — coming soon"}>
        <p className="text-sm" style={{ color: C.dim }}>{tt ? tt("soc_b") : "Reddit/X sentiment needs paid APIs."}</p>
      </Card>
    </div>
  );
}

const ComingSoon = ({ title, body, soon, note }) => (
  <Card title={`${title}${soon || " — coming soon"}`} accent={C.violet}>
    <p className="text-sm leading-relaxed" style={{ color: C.dim }}>{body}</p>
    <div className="mt-3 text-xs p-3 rounded-xl" style={{ background: C.panelSoft, color: C.dim }}>
      {note || "This module needs a paid data source. Everything else runs on real, free, daily-updated data."}
    </div>
  </Card>
);

/* 🔎 Search any ticker — cached ones open instantly; new ones need login + quota */
function SearchTicker({ stocks, session, onOpen, onNeedAuth, onCollected }) {
  const [val, setVal] = useState("");
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");

  const poll = (ticker, tries = 0) => {
    if (tries > 14) { setState("error"); setMsg(`${ticker} queued — taking longer than usual; it will appear soon.`); return; }
    setTimeout(async () => {
      try {
        const d = await (await fetch(`${API_BASE}/universe?v=${Date.now()}`)).json();
        if ((d.stocks || []).some((s) => s.ticker === ticker)) {
          setState("done"); setMsg(`${ticker} ready!`); onCollected?.(ticker);
          setTimeout(() => { setState("idle"); setMsg(""); setVal(""); }, 2000);
        } else { setMsg(`Collecting ${ticker}…`); poll(ticker, tries + 1); }
      } catch { poll(ticker, tries + 1); }
    }, 15000);
  };

  const submit = async () => {
    const ticker = val.trim().toUpperCase();
    if (!ticker) return;
    if (!/^[A-Z0-9][A-Z0-9.\-]{0,11}$/.test(ticker)) { setState("error"); setMsg("Invalid ticker (Yahoo format: AAPL, PETR4.SA, 7203.T)"); return; }
    const hit = stocks.find((s) => s.ticker === ticker);
    if (hit) { onOpen(ticker); setVal(""); setState("idle"); setMsg(""); return; }
    if (!session) { onNeedAuth("Create a free account to search new tickers (5/day)."); return; }
    setState("sending"); setMsg("Checking…");
    try {
      const r = await fetch(`${API_BASE}/search-ticker`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ticker }),
      });
      const d = await r.json();
      if (r.status === 401) { onNeedAuth("Please sign in again to search new tickers."); setState("idle"); setMsg(""); return; }
      if (r.status === 429) { setState("error"); setMsg(d.error); return; }
      if (!r.ok || d.error) { setState("error"); setMsg(d.error || `Failed (${r.status})`); return; }
      if (d.exists) { onCollected?.(ticker); onOpen(ticker); setVal(""); setState("idle"); setMsg(""); return; }
      setState("waiting"); setMsg(`Collecting ${ticker}… (~2 min${d.remaining == null ? "" : ` · ${d.remaining} searches left today`})`); poll(ticker);
    } catch (e) { setState("error"); setMsg(String(e)); }
  };

  const busy = state === "sending" || state === "waiting";
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !busy && submit()}
        placeholder="🔎 search ticker (AAPL, WEGE3.SA…)" disabled={busy}
        className="px-2.5 py-2 rounded-xl text-sm" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text, outline: "none", width: 230, fontFamily: FONT_MONO }} />
      <button onClick={submit} disabled={busy || !val.trim()}
        className="px-3 py-2 rounded-xl text-sm font-bold"
        style={{ background: busy ? C.panelSoft : C.accent, color: busy ? C.dim : "#0D1321", cursor: busy ? "wait" : "pointer" }}>
        {busy ? "…" : "Go"}
      </button>
      {msg && <span className="text-xs" style={{ color: state === "error" ? C.down : state === "done" ? C.up : C.dim }}>
        {state === "waiting" && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse" style={{ background: C.accent }} />}{msg}
      </span>}
    </div>
  );
}

/* 🔐 email + password auth */
function AuthPanel({ open, note, onClose, tt }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const go = async () => {
    setBusy(true); setMsg("");
    try {
      const { error } = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password: pw })
        : await supabase.auth.signUp({ email, password: pw });
      if (error) setMsg(error.message);
      else onClose();
    } catch (e) { setMsg(String(e)); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(5,8,16,0.75)" }} onClick={onClose}>
      <div className="rounded-2xl p-5 w-full max-w-sm" style={{ background: C.panel, border: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <div className="text-lg font-extrabold" style={{ fontFamily: FONT_HEAD }}>{mode === "signin" ? (tt ? tt("si") : "Sign in") : (tt ? tt("ca") : "Create free account")}</div>
          <button onClick={onClose} className="px-2 py-0.5 rounded-lg text-sm" style={{ border: `1px solid ${C.line}`, color: C.dim }}>✕</button>
        </div>
        {note && <div className="text-xs mb-3" style={{ color: C.dim }}>{note}</div>}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" type="email" autoComplete="email"
          className="w-full px-3 py-2.5 rounded-xl text-sm mb-2" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text, outline: "none" }} />
        <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="password (6+ chars)" type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          onKeyDown={(e) => e.key === "Enter" && !busy && go()}
          className="w-full px-3 py-2.5 rounded-xl text-sm mb-3" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text, outline: "none" }} />
        {msg && <div className="text-xs mb-2" style={{ color: C.down }}>{msg}</div>}
        <button onClick={go} disabled={busy || !email || pw.length < 6}
          className="w-full py-2.5 rounded-xl text-sm font-bold mb-2"
          style={{ background: C.up, color: "#0D1321", fontFamily: FONT_HEAD, opacity: busy || !email || pw.length < 6 ? 0.6 : 1 }}>
          {busy ? "…" : mode === "signin" ? (tt ? tt("si") : "Sign in") : (tt ? tt("ca") : "Create account")}
        </button>
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
          className="w-full py-2 text-xs" style={{ color: C.accent }}>
          {mode === "signin" ? (tt ? tt("no_acc") : "No account? Create one free →") : (tt ? tt("have_acc") : "Already have an account? Sign in →")}
        </button>
        <div className="text-xs mt-2 text-center" style={{ color: C.dim }}>{tt ? fillT(tt("free_note"), { w: FREE_WL }) : `Free plan: up to ${FREE_WL} stocks`}</div>
      </div>
    </div>
  );
}

/* 🎁 redeem a premium voucher */
function RedeemPanel({ open, session, onClose, onPremium }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const go = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`${API_BASE}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (!r.ok || d.error) setMsg(d.error || `Failed (${r.status})`);
      else { setMsg("🎉 Premium activated — no watchlist or search limits!"); setTimeout(() => { onPremium(); }, 1400); }
    } catch (e) { setMsg(String(e)); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(5,8,16,0.75)" }} onClick={onClose}>
      <div className="rounded-2xl p-5 w-full max-w-sm" style={{ background: C.panel, border: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-2">
          <div className="text-lg font-extrabold" style={{ fontFamily: FONT_HEAD }}>🎁 Redeem code</div>
          <button onClick={onClose} className="px-2 py-0.5 rounded-lg text-sm" style={{ border: `1px solid ${C.line}`, color: C.dim }}>✕</button>
        </div>
        <div className="text-xs mb-3" style={{ color: C.dim }}>Got a premium code? Redeem it here to unlock unlimited watchlist and searches.</div>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE-HERE"
          onKeyDown={(e) => e.key === "Enter" && !busy && go()}
          className="w-full px-3 py-2.5 rounded-xl text-sm mb-3" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text, outline: "none", fontFamily: FONT_MONO }} />
        {msg && <div className="text-xs mb-2" style={{ color: msg.startsWith("🎉") ? C.up : C.down }}>{msg}</div>}
        <button onClick={go} disabled={busy || code.trim().length < 3}
          className="w-full py-2.5 rounded-xl text-sm font-bold"
          style={{ background: C.warn, color: "#0D1321", fontFamily: FONT_HEAD, opacity: busy || code.trim().length < 3 ? 0.6 : 1 }}>
          {busy ? "…" : "Redeem"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [universe, setUniverse] = useState({ stocks: [], loading: true, error: null });
  const [ticker, setTicker] = useState(null);
  const [tab, setTab] = useState("overview");
  const [view, setView] = useState("analysis");
  const [showNative, setShowNative] = useState(false);
  const [tf, setTf] = useState("1Y");
  const [showAbout, setShowAbout] = useState(false);
  const [term, setTerm] = useState(null);
  const [notes, setNotes] = useState({});
  const [dcfG, setDcfG] = useState(10);
  const [dcfR, setDcfR] = useState(10);
  const [lang, setLang] = useState("en");
  const [light, setLight] = useState(false);
  const [cmpA, setCmpA] = useState(null);
  const [cmpB, setCmpB] = useState(null);
  const [simAmt, setSimAmt] = useState(1000);
  const [simTf, setSimTf] = useState("1Y");
  const [scr, setScr] = useState({ cat: "all", peg1: false, hiYield: false });
  const [hist, setHist] = useState({});          // { [ticker]: {series, financials, insiders, alerts} }
  const [btState, setBtState] = useState({ status: "idle", done: 0, total: 0, result: null });
  const [btScope, setBtScope] = useState("ALL");
  const [btRule, setBtRule] = useState("v2");
  const [btPeriod, setBtPeriod] = useState("Max");
  const [btFrom, setBtFrom] = useState("");
  const [btTo, setBtTo] = useState("");
  useEffect(() => { setBtState({ status: "idle", done: 0, total: 0, result: null }); }, [btScope, btPeriod, btFrom, btTo, btRule]);
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authNote, setAuthNote] = useState("");
  const [wl, setWl] = useState([]);
  const [wlMsg, setWlMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [chipMode, setChipMode] = useState("featured");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (data.session) setChipMode("mine"); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setChipMode(s ? "mine" : "featured"); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadWl = async () => {
    if (!session) { setWl([]); setIsAdmin(false); setIsPremium(false); return; }
    const { data } = await supabase.from("user_watchlists").select("ticker").order("added_at");
    setWl((data || []).map((r) => r.ticker));
    const { data: adm } = await supabase.from("app_admins").select("user_id");
    setIsAdmin((adm || []).length > 0);
    const { data: prem } = await supabase.from("premium_users").select("user_id");
    setIsPremium((prem || []).length > 0);
  };
  useEffect(() => { loadWl(); }, [session]);

  const inWl = (tk2) => wl.includes(tk2);
  const toggleWl = async (tk2) => {
    if (!session) { setAuthNote("Create a free account to build your watchlist (up to " + FREE_WL + " stocks)."); setAuthOpen(true); return; }
    setWlMsg("");
    if (inWl(tk2)) {
      await supabase.from("user_watchlists").delete().eq("ticker", tk2);
      setWl(wl.filter((x) => x !== tk2));
    } else {
      const { error } = await supabase.from("user_watchlists").insert({ user_id: session.user.id, ticker: tk2 });
      if (error) setWlMsg(error.message && error.message.includes("WATCHLIST_LIMIT") ? `Watchlist full — the free plan holds ${FREE_WL} stocks.` : (error.message || "error"));
      // (admins never hit the cap — the database trigger exempts them)
      else setWl([...wl, tk2]);
    }
  };

  const L = LANGS[lang];
  const t = (k) => (XT[lang] && XT[lang][k]) ?? L.t[k] ?? LANGS.en.t[k] ?? XT.en[k] ?? k;

  const loadUniverse = () => fetch(`${API_BASE}/universe?v=${Date.now()}`).then((r) => r.json()).then((d) => {
    if (d.error) setUniverse({ stocks: [], loading: false, error: d.error });
    else {
      setUniverse({ stocks: d.stocks, loading: false, error: null });
      setTicker((cur) => cur && d.stocks.some((s) => s.ticker === cur) ? cur : (d.stocks.find((s) => MAG7.includes(s.ticker)) ?? d.stocks[0])?.ticker ?? null);
      setCmpA((c) => c ?? d.stocks[0]?.ticker); setCmpB((c) => c ?? d.stocks[1]?.ticker ?? d.stocks[0]?.ticker);
    }
  }).catch((e) => setUniverse({ stocks: [], loading: false, error: String(e) }));
  useEffect(() => { loadUniverse(); }, []);

  const fetchHistory = (tk) => {
    if (hist[tk]) return Promise.resolve(hist[tk]);
    return fetch(`${API_BASE}/prices?ticker=${encodeURIComponent(tk)}`).then((r) => r.json()).then((d) => {
      const sp = seriesFromPrices(d.prices);
      const entry = { series: sp.series, padCount: sp.padCount, financials: d.financials || [], insiders: d.insiders || [], alerts: d.alerts || [] };
      setHist((h) => ({ ...h, [tk]: entry }));
      return entry;
    });
  };
  useEffect(() => { if (ticker) fetchHistory(ticker); }, [ticker]);

  /* ↻ on-demand price refresh — pulls the latest quote from /api/quote (Yahoo, server-side)
     and merges it into the cached series, so charts/technicals recompute instantly
     without waiting for the daily collector. 60s cooldown per ticker. */
  const [refreshState, setRefreshState] = useState({}); // { [ticker]: { status, at } }
  const refreshPrice = async (tk) => {
    const rs = refreshState[tk];
    if (rs?.status === "loading" || (rs?.at && Date.now() - rs.at < 60000)) return;
    setRefreshState((m) => ({ ...m, [tk]: { status: "loading", at: rs?.at || 0 } }));
    try {
      const d = await (await fetch(`${API_BASE}/quote?ticker=${encodeURIComponent(tk)}`)).json();
      if (d.error || !d.candles?.length) throw new Error(d.error || "no data");
      setHist((h) => {
        const cur = h[tk];
        if (!cur) return h;
        const series = [...cur.series];
        const dayOf = (ts) => new Date(ts).toISOString().slice(0, 10);
        for (const c of d.candles) {
          const key = dayOf(c.ts);
          const dt = new Date(c.ts);
          const pt = {
            ts: c.ts,
            date: dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
            dLong: dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            close: +c.close, v: +(c.volume || 0) / 1e6,
            hi: c.high == null ? null : +c.high, lo: c.low == null ? null : +c.low,
          };
          const idx = series.findIndex((p) => dayOf(p.ts) === key);
          if (idx >= 0) series[idx] = { ...series[idx], ...pt };            // intraday update of an existing day
          else if (c.ts > series[series.length - 1].ts) series.push(pt);    // brand-new session
        }
        return { ...h, [tk]: { ...cur, series: series.map((p, i) => ({ ...p, i })) } };
      });
      setRefreshState((m) => ({ ...m, [tk]: { status: "ok", at: Date.now() } }));
    } catch {
      setRefreshState((m) => ({ ...m, [tk]: { status: "err", at: Date.now() } }));
    }
  };

  const STOCKS = universe.stocks;
  const stock = STOCKS.find((s) => s.ticker === ticker);
  const H = ticker ? hist[ticker] : null;
  const ready = stock && H && H.series && H.series.length > 0;

  useEffect(() => { if (stock) { setDcfG(stock.forecastG > 0 ? Math.round(stock.forecastG) : 8); setDcfR(10); } }, [ticker, stock?.forecastG]);

  /* ---------- everything below only when a stock + its history are loaded ---------- */
  const tech = useMemo(() => (ready ? buildTech(H.series) : null), [ready, H]);
  /* per-ticker signal backtest: "did this system work on THIS stock?" — runs both
     rules on the cached history (no extra requests) */
  const tickerBT = useMemo(() => {
    if (!ready || H.series.length < 300 || (H.padCount || 0) >= 30) return null;
    const v2 = btEngine([H.series], "v2"), cl = btEngine([H.series], "classic");
    return v2 && cl ? { v2, cl } : null;
  }, [ready, H]);
  const chartData = useMemo(() => {
    if (!tech) return null;
    const pc = H?.padCount || 0;
    if (!pc) return tech.data;
    return tech.data.map((d, i) => (i < pc ? { ...d, close: null, sma50: null, sma200: null, v: 0 } : d));
  }, [tech, H]);
  const last = tech ? tech.last : null;
  const perUSD = stock?._perUSD || 1;
  const isForeign = stock && stock.currency !== "USD";
  const useNative = isForeign && showNative;
  const k = useNative ? 1 : 1 / perUSD;
  const sym = useNative ? symOf(stock?.currency) : "$";
  const money = (v, d = 2) => v == null ? "n/a" : `${sym}${(v * k).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
  const moneyB = (v) => v == null ? "n/a" : `${sym}${(v * k).toFixed(1)}B`;
  const moneyM = (v) => v == null ? "n/a" : `${sym}${(v * k) >= 1000 ? ((v * k) / 1000).toFixed(1) + "B" : (v * k).toFixed(0) + "M"}`;

  const eps0 = stock ? (stock.pe > 0 && last ? last.close / stock.pe : stock.fwdPE > 0 && last ? last.close / stock.fwdPE : null) : null;
  const dcfCalc = (g, r) => { if (eps0 == null) return null; let v = 0, e = eps0; for (let i = 1; i <= 5; i++) { e *= 1 + g / 100; v += e / Math.pow(1 + r / 100, i); } return +(v + (e * 12) / Math.pow(1 + r / 100, 5)).toFixed(2); };
  const fv = useMemo(() => (ready ? (dcfCalc(stock.forecastG > 0 ? stock.forecastG : 8, 10) ?? last.close) : null), [ready, ticker]);
  const dcfFV = useMemo(() => dcfCalc(dcfG, dcfR), [dcfG, dcfR, ticker, eps0]);

  const scores = useMemo(() => (ready && fv ? buildScores(stock, tech, last.close, fv) : null), [ready, fv]);
  const typeKey = stock ? classifyLynch(stock) : "slow";
  const type = LYNCH_TYPES[typeKey];
  const typeLoc = (LY[lang] && LY[lang][typeKey]) || { n: type.name, d: type.desc, s: type.strategy };
  const peg = stock ? pegInfo(stock) : null;
  const ratios = stock ? relevantRatios(stock, typeKey) : null;
  const fundAvg = scores ? +(scores.slice(0, 5).reduce((a, b) => a + b.v, 0) / 5).toFixed(1) : null;

  const annual = useMemo(() => {
    if (!H || !H.financials?.length) return null;
    const rows = H.financials.map((f) => ({ y: String(f.fiscal_year), rev: +f.revenue || 0, earn: +f.earnings || 0, fcf: f.fcf == null ? null : +f.fcf }));
    let e = rows[rows.length - 1]?.earn || 0;
    const fut = [1, 2, 3].map((n) => { e *= 1 + ((stock?.forecastG ?? 8) > 0 ? stock.forecastG : 8) / 100; return { y: String(new Date().getFullYear() + n), proj: Math.round(e) }; });
    return { hist: rows, fut };
  }, [H, ticker]);

  const alerts = (H?.alerts || []).map((a) => ({ kind: a.kind, dir: a.direction, txt: a.txt }));
  const insBuys = (H?.insiders || []).filter((x) => x.is_buy === true).length;
  const insSells = (H?.insiders || []).filter((x) => x.is_buy === false).length;
  const capUSD = stock ? (stock.mktCap || 0) / (stock._perUSD || 1) : 0;
  const revUSD = stock ? (stock.revenueM || 0) / (stock._perUSD || 1) : 0;
  const devStage = stock ? (stock.netMargin != null && stock.netMargin < 0 && revUSD < 150) : false;
  const intraday = useMemo(() => (ready ? genIntraday({ seed: 7, ...stock }, last.close) : null), [ready, ticker]);

  const flow = useMemo(() => {
    if (!stock || !stock.revenueM || stock.netMargin == null) return null;
    const rev = stock.revenueM;
    const segs = (stock.segments || [["Total revenue", 1]]).slice(0, 2).map(([n, sh]) => ({ n, v: rev * sh }));
    const o = stock.opex || {};
    const gm = stock.grossMargin && stock.grossMargin > 0 && stock.grossMargin < 1 ? stock.grossMargin : 0.35;
    const cos = o.cos > 0 ? o.cos : rev * (1 - gm);
    const gross = Math.max(0, rev - cos);
    const earn = rev * (stock.netMargin / 100);
    const profitable = earn > 0;
    let items = [];
    if (o.rnd > 0) items.push({ n: "Research & development", v: o.rnd, c: C.violet });
    if (o.sga > 0) items.push({ n: "Selling, general & admin", v: o.sga, c: C.warn });
    const known = items.reduce((a, d) => a + d.v, 0);
    const rest = Math.max(0, (profitable ? gross - earn : gross) - known);
    if (rest > 0) items.push({ n: "Other exp., interest & tax", v: rest, c: "#8899AA" });
    if (items.length === 0) items = [{ n: "Operating & other exp.", v: Math.max(profitable ? gross - earn : gross, 0), c: C.warn }];
    const divd = profitable && stock.payout > 0 ? earn * Math.min(stock.payout, 100) / 100 : 0;
    return { segments: segs, rev, cos, gross, items, earn, profitable, divd, buyb: 0, retained: profitable ? Math.max(0, earn - divd) : 0 };
  }, [ticker, stock]);

  /* balance sheet (guards: null → 0; fold slivers) */
  const bs = useMemo(() => {
    if (!stock || !stock.totalAssets) return null;
    const g = (x) => Math.max(0, +x || 0);
    const otherA = Math.max(0, g(stock.totalAssets) - g(stock.cash) - g(stock.recv) - g(stock.inv) - g(stock.phys));
    const otherL = Math.max(0, g(stock.totalLiab) - g(stock.debt) - g(stock.ap));
    const fold = (arr, oFill, oName) => {
      const tot = arr.reduce((a, d) => a + d.size, 0); if (tot <= 0) return [];
      const th = tot * 0.04, keep = arr.filter((d) => d.size >= th);
      const folded = arr.filter((d) => d.size < th).reduce((a, d) => a + d.size, 0);
      if (folded > 0) { const ex = keep.find((d) => d.name === oName); if (ex) ex.size += folded; else keep.push({ name: oName, size: folded, fill: oFill }); }
      return keep;
    };
    return {
      assets: fold([
        { name: "Cash & ST investments", size: g(stock.cash), fill: "#2EC27E" },
        { name: "Receivables", size: g(stock.recv), fill: "#27B374" },
        { name: "Inventory", size: g(stock.inv), fill: "#2FCB85" },
        { name: "Physical assets", size: g(stock.phys), fill: "#1FA468" },
        { name: "LT & other assets", size: otherA, fill: "#36D78E" },
      ].filter((d) => d.size > 0.005), "#36D78E", "LT & other assets"),
      liab: fold([
        { name: "Equity", size: g(stock.equity), fill: "#2EC27E" },
        { name: "Other liabilities", size: otherL, fill: "#27B374" },
        { name: "Accounts payable", size: g(stock.ap), fill: "#1FA468" },
        { name: "Long-term debt", size: g(stock.ltDebt), fill: C.down },
        { name: "Short-term debt", size: Math.max(0, g(stock.debt) - g(stock.ltDebt)), fill: "#FF9090" },
      ].filter((d) => d.size > 0.005), "#27B374", "Other liabilities"),
    };
  }, [ticker, stock]);

  /* peers = other stocks in your universe with the same sector */
  const peers = useMemo(() => stock ? STOCKS.filter((s) => s.ticker !== stock.ticker && s.sector && s.sector === stock.sector).slice(0, 4) : [], [ticker, STOCKS]);
  const competitors = useMemo(() => {
    if (!stock) return [];
    const mk = (s, me) => { const d = scores5(s); const avg = d.reduce((a, b) => a + b.v, 0) / 5; return { n: s.name, tk: s.ticker, mc: s.mktCap, per: s._perUSD || 1, data: d, me, color: avg >= 3.5 ? C.up : avg >= 2.5 ? C.warn : C.down }; };
    return [mk(stock, true), ...peers.map((p) => mk(p, false))];
  }, [ticker, peers]);
  const peBars = useMemo(() => [stock, ...peers].filter((s) => s && s.pe > 0).map((s) => ({ n: s.name.slice(0, 18), pe: +s.pe.toFixed(1), me: s.ticker === ticker })).sort((a, b) => b.pe - a.pe), [ticker, peers]);
  const peAvg = peBars.filter((r) => !r.me).length ? +(peBars.filter((r) => !r.me).reduce((a, r) => a + r.pe, 0) / peBars.filter((r) => !r.me).length).toFixed(1) : null;

  const sim = useMemo(() => {
    if (!ready) return null;
    const s = H.series, counts = { "1Y": 252, "3Y": 756, "5Y": 1260, Max: s.length };
    const i0 = Math.max(0, s.length - counts[simTf]);
    const amtLocal = simAmt * perUSD;                      // USD budget converted to the listing currency
    const shares = amtLocal / s[i0].close, endValLocal = shares * last.close;
    return { startPx: s[i0].close, shares, endValUSD: endValLocal / perUSD, totalRet: (endValLocal / amtLocal - 1) * 100, div: (stock.divYield / 100) * simAmt * (Math.min(counts[simTf], s.length) / 252), startDate: s[i0].dLong };
  }, [ready, simAmt, simTf, ticker]);

  const aiThesis = useMemo(() => {
    if (!ready || !fv) return "";
    const P = TH[lang] || TH.en;
    const pg = peg.peg, disc = (1 - last.close / fv) * 100, parts = [];
    parts.push(fillT(P.intro, { name: stock.name, type: typeLoc.n, sector: stock.kind ? "" : stock.sector ? ` · ${stock.sector}` : "" }));
    if (stock.industry) parts.push(fillT(P.industry, { ind: stock.industry }));
    if (peers.length >= 1 && !stock.kind) {
      const peerCaps = peers.map((p) => (p.mktCap || 0) / (p._perUSD || 1)).sort((a, b) => a - b);
      const med = peerCaps[Math.floor(peerCaps.length / 2)];
      const mc = `$${capUSD.toFixed(1)}B`;
      parts.push(capUSD >= peerCaps[peerCaps.length - 1] ? fillT(P.posTop, { mc }) : capUSD >= med ? fillT(P.posMid, { mc }) : fillT(P.posSmall, { mc }));
    }
    if (stock.revGrowth != null && Math.abs(stock.revGrowth) > 1) parts.push(fillT(P.revexp, { g: stock.revGrowth.toFixed(0) }));
    if (devStage) parts.push(P.devstage);
    if (eps0 != null) parts.push(disc > 8 ? fillT(P.valBelow, { d: Math.abs(disc).toFixed(0) }) : disc < -8 ? fillT(P.valAbove, { d: Math.abs(disc).toFixed(0) }) : P.valNear);
    if (pg !== null) parts.push(pg < 1 ? fillT(P.pegCheap, { p: pg }) : pg <= 1.5 ? fillT(P.pegFair, { p: pg }) : fillT(P.pegRich, { p: pg }));
    if (stock.targetMean > 0 && stock.analystsN > 0)
      parts.push(fillT(P.analyst, { n: stock.analystsN, t: money(stock.targetMean), u: `${stock.targetMean > last.close ? "+" : ""}${(((stock.targetMean / last.close) - 1) * 100).toFixed(0)}`, r: (stock.recKey || "n/a").replace("_", " ") }));
    if (stock.pe > 0 && stock.fwdPE > 0 && stock.pe / stock.fwdPE >= 1.5)
      parts.push(fillT(P.rebound, { x: ((stock.pe / stock.fwdPE - 1) * 100).toFixed(0) }));
    if (stock.debtEq != null)
      parts.push(stock.debtEq < 0.7 ? fillT(P.balSolid, { d: stock.debtEq.toFixed(2) }) : (stock.coverage ?? 9) < 1.5 ? fillT(P.balRisk, { c: stock.coverage }) : fillT(P.balMod, { d: stock.debtEq.toFixed(2) }));
    if (insBuys + insSells >= 2 && insBuys !== insSells)
      parts.push(insBuys > insSells ? fillT(P.insBuy, { b: insBuys, s: insSells }) : fillT(P.insSell, { b: insBuys, s: insSells }));
    parts.push(tech.zone === "BUY ZONE" ? P.techGood : tech.zone === "EXIT ZONE" ? P.techBad : P.techNeut);
    if (stock.forecastG > 0)
      parts.push(fillT(P.fwd, { g: stock.forecastG.toFixed(0), c: ((Math.pow(1 + stock.forecastG / 100, 3) - 1) * 100).toFixed(0) }));
    parts.push(fundAvg >= 3.5 && tech.zone !== "EXIT ZONE" ? P.alignYes : P.alignNo);
    return parts.join(" ");
  }, [ready, fv, ticker, lang, H, peers]);

  /* screener (fundamentals-only; tap a result for its technical zone) */
  /* screener: technical dimension — loads every history once (cached, same as the
     backtest) and computes Trend/Entry/regime per ticker, so the list can filter
     "good company AND in an uptrend" without opening stocks one by one */
  const [scrTech, setScrTech] = useState({ status: "idle", done: 0, total: 0, map: null });
  const loadScreenerTech = async () => {
    if (scrTech.status === "loading") return;
    setScrTech({ status: "loading", done: 0, total: STOCKS.length, map: null });
    const map = {};
    for (const s of STOCKS) {
      try {
        const e = await fetchHistory(s.ticker);
        if (e.series.length > 230 && (e.padCount || 0) < 30) {
          const tt = buildTech(e.series);
          map[s.ticker] = { t: tt.trendScore, e: tt.entryScore, z: tt.zone, r: tt.regime };
        }
      } catch {}
      setScrTech((b) => ({ ...b, done: b.done + 1 }));
    }
    setScrTech({ status: "done", done: STOCKS.length, total: STOCKS.length, map });
  };

  const screened = STOCKS.filter((s) => {
    const tk2 = classifyLynch(s), p = pegInfo(s).peg;
    const base = (scr.cat === "all" || tk2 === scr.cat) && (!scr.peg1 || (p !== null && p < 1)) && (!scr.hiYield || s.divYield >= 3);
    if (!base) return false;
    if (scr.techBuy && scrTech.map) { const m = scrTech.map[s.ticker]; if (!m || m.z !== "BUY ZONE") return false; }
    if (scr.hiTrend && scrTech.map) { const m = scrTech.map[s.ticker]; if (!m || m.t < 60) return false; }
    return true;
  });

  /* backtest across the whole universe (loads every history once, cached).
     Both rules pay a 0.1% cost per trade (entry or exit) — this is what makes
     "fewer trades" actually count. Two rules:
       classic — daily: hold while SMA50 > SMA200 AND price > SMA200 (the original)
       v2      — asymmetric: entries confirmed WEEKLY and only outside ranging
                 regimes (ER20 ≥ 0.25); exits checked DAILY (risk management
                 shouldn't wait for Friday) but with a buffer — sell only when
                 price closes 1.5% below the SMA200, or SMA50 slips 0.5% below
                 SMA200 → fewer whipsaw round-trips without exiting crashes late */
  const runBacktest = async () => {
    const list = btScope === "ALL" ? STOCKS : STOCKS.filter((s) => s.ticker === btScope);
    setBtState({ status: "loading", done: 0, total: list.length, result: null });
    const all = [];
    for (const s of list) {
      try { const e = await fetchHistory(s.ticker); if (e.series.length > 230 && (e.padCount || 0) < 30) all.push(e.series); } catch {}
      setBtState((b) => ({ ...b, done: b.done + 1 }));
    }
    // period / date window
    const t0 = btFrom ? new Date(btFrom).getTime() : null;
    const t1 = btTo ? new Date(btTo).getTime() : null;
    let ds0 = all;
    if (t0 || t1) {
      const start0 = t0 ? t0 - 300 * 24 * 3600 * 1000 : null; // buffer so SMAs exist at the start date
      ds0 = ds0.map((d) => d.filter((p) => (!start0 || p.ts >= start0) && (!t1 || p.ts <= t1)));
    } else if (btPeriod !== "Max") {
      const days = ({ "1Y": 252, "3Y": 756 }[btPeriod] || 252) + 210;
      ds0 = ds0.map((d) => d.slice(-days));
    }
    ds0 = ds0.filter((d) => d.length > 240);
    const result = ds0.length ? btEngine(ds0, btRule) : null;
    if (!result) { setBtState({ status: "error", done: 0, total: 0, result: null }); return; }
    setBtState({ status: "done", done: result.count, total: result.count, result });
  };

  const Term = ({ children, tk }) => (
    <button onClick={(e) => { e.stopPropagation(); setTerm(tk || children); }} className="text-left"
      style={{ color: "inherit", fontSize: "inherit", fontFamily: "inherit", borderBottom: `1px dotted ${C.dim}99`, cursor: "help" }}>{children}</button>
  );

  const TABS = [
    ["overview", t("tab_overview")], ["val", t("tab_valuation")], ["health", t("tab_health")], ["div", t("tab_dividends")],
    ["growth", t("tab_growth")], ["tech", t("tab_tech")], ["feed", t("tab_feed")], ["opt", t("tab_options")], ["verdict", t("tab_verdict")],
  ];

  /* ---------------- render ---------------- */
  if (universe.loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, color: C.text }}>
      <div className="text-center">
        <div className="text-2xl font-extrabold mb-2" style={{ fontFamily: FONT_HEAD }}>ten<span style={{ color: C.up }}>bagger</span></div>
        <div className="text-sm animate-pulse" style={{ color: C.dim }}>{XT.en.load_uni}</div>
      </div>
    </div>
  );
  if (universe.error) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: C.bg, color: C.text }}>
      <div className="max-w-md text-center">
        <div className="text-lg font-bold mb-2">Backend unreachable</div>
        <div className="text-sm" style={{ color: C.dim }}>{universe.error}</div>
      </div>
    </div>
  );

  return (
    <div dir={L.dir} className="min-h-screen px-3 py-4 sm:px-6 sm:py-6" style={{ background: C.bg, color: C.text, filter: light ? "invert(0.92) hue-rotate(180deg)" : "none" }}>
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ fontFamily: FONT_HEAD }}>ten<span style={{ color: C.up }}>bagger</span></div>
            <div className="text-xs" style={{ color: C.dim }}>{t("tag")}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl overflow-hidden overflow-x-auto" style={{ border: `1px solid ${C.line}` }}>
              {[["analysis", t("nav_stocks")], ["screener", t("nav_screener")], ["compare", t("nav_compare")], ["backtest", t("nav_backtest")]].map(([v, l]) => (
                <button key={v} onClick={() => setView(v)} className="px-3 py-2 text-sm font-bold whitespace-nowrap"
                  style={{ fontFamily: FONT_HEAD, background: view === v ? C.panelSoft : "transparent", color: view === v ? C.text : C.dim }}>{l}</button>
              ))}
            </div>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="px-2 py-2 rounded-xl text-sm font-bold"
              style={{ fontFamily: FONT_HEAD, background: C.panel, border: `1px solid ${C.line}`, color: C.text, outline: "none" }}>
              {Object.entries(LANGS).map(([code, l]) => <option key={code} value={code} style={{ background: C.panel }}>{l.flag}</option>)}
            </select>
            <button onClick={() => setLight(!light)} className="px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${C.line}`, color: C.text }}>{light ? "☀️" : "🌙"}</button>
            {session ? (<>
              {!(isAdmin || isPremium) && (
                <button onClick={() => setRedeemOpen(true)} title="Redeem a premium code"
                  className="px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${C.line}` }}>🎁</button>
              )}
              {(isAdmin || isPremium) && <Pill color={C.warn} soft>{isAdmin ? "ADMIN" : "PREMIUM"}</Pill>}
              <button onClick={() => supabase.auth.signOut()} className="px-3 py-2 rounded-xl text-xs font-bold" title={session.user.email}
                style={{ border: `1px solid ${C.line}`, color: C.dim, fontFamily: FONT_HEAD }}>
                {(session.user.email || "").split("@")[0]} · sign out
              </button>
            </>) : (
              <button onClick={() => { setAuthNote(""); setAuthOpen(true); }} className="px-3 py-2 rounded-xl text-sm font-bold"
                style={{ background: C.up, color: "#0D1321", fontFamily: FONT_HEAD }}>{t("si")}</button>
            )}
          </div>
        </div>

        <div className="mb-3 flex items-center gap-3 flex-wrap">
          <SearchTicker stocks={STOCKS} session={session}
            onOpen={(tk2) => { setTicker(tk2); setView("analysis"); setTab("overview"); setShowNative(false); }}
            onNeedAuth={(n) => { setAuthNote(n); setAuthOpen(true); }}
            onCollected={(tk2) => { loadUniverse(); setTicker(tk2); setView("analysis"); setTab("overview"); }} />
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {(session
              ? [["mine", `★ ${t("my_list")} (${wl.length}${isAdmin || isPremium ? "" : `/${FREE_WL}`})`], ["featured", "✨ Mag 7"], ["all", t("all_cached")]]
              : [["featured", "✨ Magnificent 7"], ["all", t("all_cached")]]
            ).map(([m, l]) => (
              <button key={m} onClick={() => setChipMode(m)} className="px-3 py-2 text-xs font-bold"
                style={{ fontFamily: FONT_HEAD, background: chipMode === m ? C.panelSoft : "transparent", color: chipMode === m ? C.text : C.dim }}>{l}</button>
            ))}
          </div>
          {!session && <span className="text-xs" style={{ color: C.dim }}>✨ Featured: the Magnificent 7 — create a free account to track your own stocks.</span>}
          {wlMsg && <span className="text-xs" style={{ color: C.warn }}>{wlMsg}</span>}
        </div>
        {L.note && <div className="mb-3 text-xs px-3 py-2 rounded-xl" style={{ background: `${C.accent}12`, border: `1px solid ${C.accent}33`, color: C.dim }}>{L.note}</div>}

        {view === "analysis" && (
          <>
            <div className="flex flex-wrap gap-2 pb-2 mb-3">
              {(chipMode === "mine" && session ? STOCKS.filter((s) => wl.includes(s.ticker)) : chipMode === "featured" ? STOCKS.filter((s) => MAG7.includes(s.ticker)) : STOCKS).map((s) => (
                <button key={s.ticker} onClick={() => { setTicker(s.ticker); setShowNative(false); setShowAbout(false); setTab("overview"); }}
                  className="px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap"
                  style={{ fontFamily: FONT_MONO, background: s.ticker === ticker ? C.panelSoft : "transparent", border: `1px solid ${s.ticker === ticker ? C.accent : C.line}`, color: s.ticker === ticker ? C.text : C.dim }}>
                  {s.ticker}
                </button>
              ))}
            </div>

            {chipMode === "mine" && session && wl.length === 0 && (
              <Card><div className="py-6 text-center text-sm" style={{ color: C.dim }}>{t("wl_empty")}</div></Card>
            )}
            {!ready ? (
              <Card><div className="py-10 text-center text-sm animate-pulse" style={{ color: C.dim }}>{fillT(t("load_px"), { t: ticker })}</div></Card>
            ) : (
              <>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-extrabold" style={{ fontFamily: FONT_HEAD }}>{stock.name}</span>
                        <button onClick={() => toggleWl(stock.ticker)} title={inWl(stock.ticker) ? "Remove from my watchlist" : "Add to my watchlist"}
                          className="text-xl leading-none" style={{ color: inWl(stock.ticker) ? C.warn : C.dim, cursor: "pointer" }}>
                          {inWl(stock.ticker) ? "★" : "☆"}
                        </button>
                        <Pill color={type.color} soft>{typeLoc.n}</Pill>
                        {alerts.length > 0 && <Pill color={C.warn} soft>⚡ {alerts.length}</Pill>}
                      </div>
                      <div className="text-xs mt-1" style={{ color: C.dim }}>
                        {stock.country} · {stock.sector || "—"} · mkt cap {moneyB(stock.mktCap)} · {ticker}
                      </div>
                      {isForeign && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs" style={{ color: C.dim }}>{fillT(t("listed"), { c: stock.currency })}</span>
                          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                            {[["USD", false], [stock.currency, true]].map(([l, nat]) => (
                              <button key={l} onClick={() => setShowNative(nat)} className="px-2.5 py-1 text-xs font-bold"
                                style={{ fontFamily: FONT_MONO, background: showNative === nat ? C.panelSoft : "transparent", color: showNative === nat ? C.up : C.dim }}>{l}</button>
                            ))}
                          </div>
                          {!useNative && <span className="text-xs" style={{ color: C.dim, fontFamily: FONT_MONO }}>@ {symOf(stock.currency)}{perUSD.toFixed(2)}/$</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ fontFamily: FONT_MONO }}>{money(last.close)}</div>
                      <div className="text-xs" style={{ color: C.dim }}>{t("lastclose")}</div>
                      {(() => {
                        const rs = refreshState[ticker] || {};
                        const cooling = rs.at && Date.now() - rs.at < 60000 && rs.status !== "loading";
                        return (
                          <button onClick={() => refreshPrice(ticker)} disabled={rs.status === "loading" || cooling}
                            className="mt-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ fontFamily: FONT_HEAD, border: `1px solid ${C.line}`, background: "transparent",
                              color: rs.status === "err" ? C.down : rs.status === "ok" && cooling ? C.up : C.dim,
                              opacity: rs.status === "loading" || cooling ? 0.7 : 1,
                              cursor: rs.status === "loading" || cooling ? "default" : "pointer" }}>
                            {rs.status === "loading" ? t("refresh_ing")
                              : rs.status === "err" && cooling ? t("refresh_err")
                              : rs.status === "ok" && cooling ? `✓ ${t("refresh_ok")} ${new Date(rs.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                              : t("refresh_btn")}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </Card>

                <div className="mt-4"><Card><PriceChart data={chartData} intraday={intraday} tf={tf} setTf={setTf} k={k} sym={sym} /></Card></div>

                <div className="flex flex-wrap gap-2 my-4">
                  {TABS.map(([key, l]) => (
                    <button key={key} onClick={() => setTab(key)} className="px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap"
                      style={{ fontFamily: FONT_HEAD, background: tab === key ? C.panelSoft : C.panel, border: `1px solid ${tab === key ? C.accent : C.line}`, color: tab === key ? C.text : C.dim }}>{l}</button>
                  ))}
                </div>

                {tab === "overview" && (
                  <div className="space-y-4">
                    {alerts.length > 0 && (
                      <Card title={t("sig_t")} sub={t("sig_sub")} accent={C.warn}>
                        <div className="space-y-2.5">
                          {alerts.map((a, i) => (
                            <div key={i} className="flex gap-2.5 items-start"><SignalDot ok={a.dir > 0 ? true : a.dir < 0 ? false : null} />
                              <div className="text-sm"><span className="text-xs px-1.5 py-0.5 rounded mr-1.5" style={{ background: a.kind === "Technical" ? `${C.accent}22` : `${C.violet}22`, color: a.kind === "Technical" ? C.accent : C.violet, fontFamily: FONT_MONO }}>{a.kind}</span>{a.txt}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {stock.desc && (
                      <Card title={fillT(t("aboutT"), { n: stock.name })}>
                        <p className="text-sm leading-relaxed">{stock.desc}{!showAbout && stock.descLong && stock.descLong.length > 250 ? "…" : ""}</p>
                        {showAbout && stock.descLong && <p className="text-sm leading-relaxed mt-3" style={{ color: C.dim }}>{stock.descLong}</p>}
                        {stock.descLong && stock.descLong.length > 250 && (
                          <button onClick={() => setShowAbout(!showAbout)} className="mt-3 text-xs px-3 py-1.5 rounded-lg font-bold" style={{ border: `1px solid ${C.line}`, color: C.accent, fontFamily: FONT_HEAD }}>
                            {showAbout ? "Show less ▲" : "More details ▼"}
                          </button>
                        )}
                        {lang !== "en" && (stock.descLong || stock.desc) && (
                          <a href={`https://translate.google.com/?sl=en&tl=${lang === "zh" ? "zh-CN" : lang === "he" ? "iw" : lang}&text=${encodeURIComponent((stock.descLong || stock.desc).slice(0, 1400))}&op=translate`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-block mt-3 ml-2 text-xs px-3 py-1.5 rounded-lg font-bold"
                            style={{ border: `1px solid ${C.line}`, color: C.teal, fontFamily: FONT_HEAD, textDecoration: "none" }}>
                            🌐 {L.flag}
                          </a>
                        )}
                      </Card>
                    )}

                    <Card title={t("notes_t")} sub={t("notes_sub")}>
                      <textarea value={notes[ticker] ?? ""} onChange={(e) => setNotes({ ...notes, [ticker]: e.target.value })}
                        placeholder={t("notes_ph")} rows={3}
                        className="w-full p-3 rounded-xl text-sm" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text, fontFamily: FONT_HEAD, resize: "vertical", outline: "none" }} />
                    </Card>

                    <Card title={t("thesis_t")} sub={t("thesis_sub")} accent={C.violet}>
                      <p className="text-sm leading-relaxed">{aiThesis}</p>
                      {devStage && stock.currency === "USD" && (
                        <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker=${ticker}&type=&dateb=&owner=include&count=10`}
                          target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs px-3 py-1.5 rounded-lg font-bold"
                          style={{ border: `1px solid ${C.line}`, color: C.teal, fontFamily: FONT_HEAD, textDecoration: "none" }}>
                          {t("dev_link")}
                        </a>
                      )}
                    </Card>

                    {scores && (
                      <Card title={t("snow_t")} sub={t("snow_sub")}>
                        <div style={{ height: 260 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={scores} outerRadius="76%">
                              <PolarGrid stroke={C.line} /><PolarAngleAxis dataKey="axis" tick={{ fill: C.dim, fontSize: 11, fontFamily: FONT_HEAD }} />
                              <Radar dataKey="v" stroke={C.up} fill={C.up} fillOpacity={0.35} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-6 gap-1 text-center">
                          {scores.map((s) => (<div key={s.axis}><div className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: s.v >= 4 ? C.up : s.v >= 2.5 ? C.warn : C.down }}>{s.v}</div><div style={{ color: C.dim, fontSize: 10 }}>{s.axis}</div></div>))}
                        </div>
                      </Card>
                    )}

                    {stock.mktCap != null && stock.revenueM != null && (
                      <Card title={t("fsum_t")} sub={t("fsum_sub")}>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="mx-auto sm:mx-0"><FundamentalsDonut mktCapM={stock.mktCap * 1000} revM={stock.revenueM} earnM={stock.revenueM * (stock.netMargin ?? 0) / 100} fmt={moneyM} /></div>
                          <div className="flex-1 min-w-44 space-y-2.5">
                            {[["Market cap", moneyM(stock.mktCap * 1000), C.panelSoft, C.text], ["Revenue (LTM)", moneyM(stock.revenueM), C.accent, C.accent],
                              ["Earnings (LTM)", stock.netMargin != null ? (stock.netMargin > 0 ? moneyM(stock.revenueM * stock.netMargin / 100) : `−${moneyM(Math.abs(stock.revenueM * stock.netMargin / 100))}`) : "n/a", stock.netMargin > 0 ? C.teal : C.down, stock.netMargin > 0 ? C.teal : C.down],
                            ].map(([l, v, sw, tc]) => (
                              <div key={l} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2" style={{ color: C.dim }}><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: sw, border: `1px solid ${C.line}` }} />{l}</span>
                                <span className="font-bold" style={{ fontFamily: FONT_MONO, color: tc }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    <Card title={t("keyfin_t")} sub={fillT(t("keyfin_sub"), { c: useNative ? stock.currency : "USD" })}>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          ["Revenue", moneyM(stock.revenueM), C.accent],
                          ["EBITDA", moneyB(stock.ebitdaB), C.teal],
                          ["P/E", stock.pe > 0 ? `${stock.pe.toFixed(1)}x` : "neg.", stock.pe > 0 && stock.pe < stock.sectorPE ? C.up : C.warn],
                          ["Forward P/E", stock.fwdPE > 0 ? `${stock.fwdPE.toFixed(1)}x` : "n/a", stock.pe > 0 && stock.fwdPE > stock.pe ? C.down : stock.fwdPE > 0 ? C.up : C.dim],
                          ["PEG", peg.peg ?? "n/a", peg.color],
                          ["P/S", stock.ps != null ? `${stock.ps.toFixed(1)}x` : "n/a", C.text],
                          ["ROE", stock.roe != null ? `${stock.roe.toFixed(1)}%` : "n/a", stock.roe >= 15 ? C.up : stock.roe > 0 ? C.warn : C.down],
                          ["ROIC", stock.roic != null ? `${stock.roic.toFixed(1)}%` : "n/a", stock.roic >= 12 ? C.up : C.warn],
                          ["Net margin", stock.netMargin != null ? `${stock.netMargin.toFixed(1)}%` : "n/a", stock.netMargin > 10 ? C.up : stock.netMargin > 0 ? C.warn : C.down],
                          ["Dividend / share", stock.divPS > 0 ? money(stock.divPS) : "—", stock.divPS > 0 ? C.teal : C.dim],
                          ["Ex-dividend date", stock.exDiv ?? "—", stock.exDiv ? C.text : C.dim],
                          ["Div. yield", `${(stock.divYield ?? 0).toFixed(1)}%`, stock.divYield > 3 ? C.up : C.text],
                        ].map(([l, v, c]) => (
                          <div key={l} className="p-2 rounded-lg" style={{ background: C.panelSoft }}>
                            <div className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</div>
                            <div className="text-xs" style={{ color: C.dim }}><Term>{l}</Term></div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card title={`${t("category")}: ${typeLoc.n}`} sub="Peter Lynch framework" accent={type.color}>
                      <p className="text-sm leading-relaxed mb-3">{typeLoc.d}</p>
                      <div className="p-3 rounded-xl text-sm leading-relaxed" style={{ background: `${type.color}14`, border: `1px solid ${type.color}44` }}>
                        <span className="font-bold" style={{ color: type.color }}>{t("playbook")}: </span>{typeLoc.s}
                      </div>
                    </Card>

                    {competitors.length > 1 && (
                      <Card title={t("peers_t")} sub={fillT(t("peers_sub"), { s: stock.sector })}>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {competitors.map((c) => (
                            <button key={c.tk} onClick={() => { if (!c.me) { setTicker(c.tk); setTab("overview"); setShowNative(false); } }}
                              className="shrink-0 text-center p-2 rounded-xl" style={{ background: c.me ? C.panelSoft : "transparent", border: `1px solid ${c.me ? C.accent : C.line}`, width: 138, cursor: c.me ? "default" : "pointer" }}>
                              <MiniSnowflake data={c.data} color={c.color} />
                              <div className="text-xs font-bold truncate px-1" style={{ fontFamily: FONT_HEAD }}>{c.n}{c.me ? " ★" : ""}</div>
                              <div className="text-xs" style={{ color: C.dim, fontFamily: FONT_MONO }}>${((c.mc || 0) / c.per).toFixed(1)}B</div>
                              {!c.me && <div className="text-xs mt-0.5" style={{ color: C.accent }}>{t("open_w")}</div>}
                            </button>
                          ))}
                        </div>
                      </Card>
                    )}

                    {sim && (
                      <Card title={t("whatif_t")} sub={t("whatif_sub")}>
                        <div className="flex flex-wrap items-end gap-3 mb-3">
                          <div>
                            <div className="text-xs mb-1" style={{ color: C.dim }}>{t("amount")}</div>
                            <div className="flex items-center gap-1"><span style={{ color: C.dim, fontFamily: FONT_MONO }}>$</span>
                              <input type="number" value={simAmt} min={100} step={100} onChange={(e) => setSimAmt(Math.max(0, +e.target.value))}
                                className="w-28 p-2 rounded-lg text-sm" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text, fontFamily: FONT_MONO, outline: "none" }} /></div>
                          </div>
                          <div className="flex gap-1.5">
                            {["1Y", "3Y", "5Y", "Max"].map((tx) => (
                              <button key={tx} onClick={() => setSimTf(tx)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                                style={{ fontFamily: FONT_MONO, background: simTf === tx ? C.panelSoft : "transparent", border: `1px solid ${simTf === tx ? C.accent : C.line}`, color: simTf === tx ? C.text : C.dim }}>{tx}</button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          {[[t("worth"), `$${sim.endValUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, sim.totalRet >= 0 ? C.up : C.down],
                            [t("ret_t"), `${sim.totalRet >= 0 ? "+" : ""}${sim.totalRet.toFixed(0)}%`, sim.totalRet >= 0 ? C.up : C.down],
                            [t("shares_t"), sim.shares.toFixed(2), C.text],
                            [t("estdiv"), stock.divYield > 0 ? `$${sim.div.toFixed(0)}` : "—", C.teal],
                          ].map(([l, v, c]) => (
                            <div key={l} className="p-2.5 rounded-lg" style={{ background: C.panelSoft }}>
                              <div className="text-base font-extrabold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</div>
                              <div className="text-xs mt-0.5" style={{ color: C.dim }}>{l}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs" style={{ color: C.dim }}>{fillT(t("buyat"), { p: money(sim.startPx), d: sim.startDate })}</div>
                      </Card>
                    )}
                  </div>
                )}

                {tab === "val" && (
                  <div className="space-y-4">
                    {eps0 == null ? (
                      <Card title="Valuation" sub="not meaningful yet"><p className="text-sm" style={{ color: C.dim }}>Both trailing and forward earnings are negative or unavailable, so earnings-based valuation (P/E, PEG, DCF) doesn't apply. Watch P/S ({stock.ps != null ? `${stock.ps.toFixed(1)}x` : "n/a"}) and the balance sheet instead.</p></Card>
                    ) : (
                      <>
                        <Card title={t("dcf_t")} sub={t("dcf_sub")}>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-xs mb-1"><span style={{ color: C.dim }}>{t("dcf_g")}</span><span style={{ fontFamily: FONT_MONO, color: C.up }}>{dcfG}%/yr</span></div>
                              <input type="range" min="0" max="40" step="1" value={dcfG} onChange={(e) => setDcfG(+e.target.value)} className="w-full" style={{ accentColor: C.up }} />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1"><span style={{ color: C.dim }}>{t("dcf_r")}</span><span style={{ fontFamily: FONT_MONO, color: C.warn }}>{dcfR}%/yr</span></div>
                              <input type="range" min="6" max="20" step="0.5" value={dcfR} onChange={(e) => setDcfR(+e.target.value)} className="w-full" style={{ accentColor: C.warn }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="p-3 rounded-xl text-center" style={{ background: C.panelSoft }}>
                              <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: dcfFV > last.close ? C.up : C.down }}>{money(dcfFV)}</div>
                              <div className="text-xs mt-0.5" style={{ color: C.dim }}>{t("dcf_fv")}</div>
                            </div>
                            <div className="p-3 rounded-xl text-center" style={{ background: C.panelSoft }}>
                              <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: dcfFV > last.close ? C.up : C.down }}>{dcfFV > last.close ? "+" : ""}{(((dcfFV / last.close) - 1) * 100).toFixed(0)}%</div>
                              <div className="text-xs mt-0.5" style={{ color: C.dim }}>{t("dcf_up")}</div>
                            </div>
                          </div>
                        </Card>
                        <Card title={t("peg_t")} sub={t("peg_sub")}>
                          <div className="flex items-end justify-between mb-3">
                            <div>
                              <div className="text-3xl font-extrabold" style={{ fontFamily: FONT_MONO, color: peg.color }}>{peg.peg ?? "n/a"}</div>
                              <div className="text-sm font-semibold" style={{ color: peg.color }}>{peg.band}</div>
                            </div>
                            <div className="text-right text-xs" style={{ color: C.dim, fontFamily: FONT_MONO }}>P/E {stock.pe > 0 ? stock.pe.toFixed(1) : "neg."} ÷ g {stock.epsGrowth != null ? stock.epsGrowth.toFixed(0) : "?"}%</div>
                          </div>
                        </Card>
                      </>
                    )}
                    {stock.targetMean > 0 && (
                      <Card title={t("analyst_t")} sub={fillT(t("an_sub"), { n: stock.analystsN ?? "?" })} accent={C.teal}>
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                          {[[t("an_mean"), money(stock.targetMean), stock.targetMean > last.close ? C.up : C.down],
                            [t("an_move"), `${stock.targetMean > last.close ? "+" : ""}${(((stock.targetMean / last.close) - 1) * 100).toFixed(0)}%`, stock.targetMean > last.close ? C.up : C.down],
                            [t("an_rate"), (stock.recKey || "n/a").replace("_", " "), stock.recKey && stock.recKey.includes("buy") ? C.up : stock.recKey === "hold" ? C.warn : C.down],
                          ].map(([l, v, c]) => (
                            <div key={l} className="p-2.5 rounded-lg" style={{ background: C.panelSoft }}>
                              <div className="text-base font-extrabold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</div>
                              <div className="text-xs mt-0.5" style={{ color: C.dim }}>{l}</div>
                            </div>
                          ))}
                        </div>
                        {stock.targetLow > 0 && stock.targetHigh > 0 && (
                          <>
                            <div className="text-xs mb-1.5" style={{ color: C.dim }}>{t("an_range")}</div>
                            <RangeBar lo={Math.min(stock.targetLow, last.close)} hi={Math.max(stock.targetHigh, last.close)} cur={last.close}
                              fmtLo={money(stock.targetLow)} fmtHi={money(stock.targetHigh)} />
                          </>
                        )}
                        <div className="mt-2 text-xs" style={{ color: C.dim }}>{t("an_note")}</div>
                      </Card>
                    )}
                    {ratios && (
                      <Card title={fillT(t("ratiosFor"), { t: typeLoc.n })} sub={ratios.why} accent={type.color}>
                        <div className="grid grid-cols-2 gap-2">
                          {ratios.rows.map((r) => (
                            <div key={r.label} className="p-3 rounded-xl" style={{ background: C.panelSoft }}>
                              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: C.dim }}><Term>{r.label}</Term></span><SignalDot ok={r.ok} /></div>
                              <div className="text-lg font-extrabold" style={{ fontFamily: FONT_MONO }}>{r.v}</div>
                              <div className="text-xs leading-snug" style={{ color: C.dim }}>{r.note}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                    {peBars.length > 1 && peAvg && (
                      <Card title={t("pevs_t")} sub={fillT(t("pevs_sub"), { a: peAvg, t: ticker })}>
                        <div style={{ height: 46 * peBars.length + 30 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={peBars} margin={{ left: 4, right: 40 }}>
                              <CartesianGrid stroke={C.line} strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" tick={{ fill: C.dim, fontSize: 10, fontFamily: FONT_MONO }} />
                              <YAxis type="category" dataKey="n" width={128} tick={{ fill: C.dim, fontSize: 10, fontFamily: FONT_HEAD }} />
                              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}x`} />
                              <ReferenceLine x={peAvg} stroke={C.warn} strokeDasharray="4 4" />
                              <Bar dataKey="pe" name="P/E" radius={[0, 5, 5, 0]}>
                                {peBars.map((r, i) => <Cell key={i} fill={r.me ? C.accent : `${C.up}99`} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {tab === "health" && (
                  <div className="space-y-4">
                    {H.insiders && H.insiders.length > 0 && (
                      <Card title={t("ins_t")} sub={t("ins_sub")} accent={insBuys > insSells ? C.up : insSells > insBuys ? C.down : undefined}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 rounded-lg text-center flex-1" style={{ background: `${C.up}14`, border: `1px solid ${C.up}33` }}>
                            <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: C.up }}>{insBuys}</div>
                            <div className="text-xs" style={{ color: C.dim }}>{t("buys")}</div>
                          </div>
                          <div className="p-2.5 rounded-lg text-center flex-1" style={{ background: `${C.down}14`, border: `1px solid ${C.down}33` }}>
                            <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: C.down }}>{insSells}</div>
                            <div className="text-xs" style={{ color: C.dim }}>{t("sells")}</div>
                          </div>
                        </div>
                        {insBuys + insSells === 0 ? (
                          <div className="text-sm py-2" style={{ color: C.dim }}>{t("ins_none")}</div>
                        ) : (
                          <div className="space-y-1">
                            {H.insiders.filter((x) => x.is_buy != null).slice(0, 8).map((x, i) => (
                              <div key={i} className="flex items-center justify-between gap-2 text-xs py-1.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                                <span className="truncate" style={{ color: C.text }}>{x.insider_name || "Insider"}<span style={{ color: C.dim }}>{x.role && x.role !== "—" ? ` · ${x.role}` : ""}</span></span>
                                <span className="flex items-center gap-2 shrink-0" style={{ fontFamily: FONT_MONO }}>
                                  {x.is_buy === true ? <Pill color={C.up} soft>BUY</Pill> : <Pill color={C.down} soft>SELL</Pill>}
                                  {x.value_usd > 0 && <span style={{ color: x.is_buy ? C.up : C.down }}>${x.value_usd >= 1e6 ? `${(x.value_usd / 1e6).toFixed(1)}M` : `${(x.value_usd / 1e3).toFixed(0)}k`}</span>}
                                  <span style={{ color: C.dim }}>{x.filed_at}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-xs" style={{ color: C.dim }}>{t("ins_note")}</div>
                      </Card>
                    )}
                    {stock.kind === "etf" ? (
                      <Card title="Fund composition" sub="an ETF holds securities, not a corporate balance sheet">
                        <div className="space-y-2">
                          {[["Net assets", moneyB(stock.totalAssets || stock.mktCap)], ["Expense ratio", stock.er != null ? `${stock.er}%/yr` : "n/a"], ["Distribution yield", `${(stock.divYield ?? 0).toFixed(1)}%`]].map(([l, v]) => (
                            <div key={l} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                              <span className="text-sm" style={{ color: C.dim }}>{l}</span><span className="text-sm font-bold" style={{ fontFamily: FONT_MONO }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ) : bs && bs.assets.length > 0 ? (
                      <Card title={t("bs_t")} sub={fillT(t("bs_sub"), { c: useNative ? stock.currency : "USD" })}>
                        <div className="text-xs font-bold mb-1.5" style={{ fontFamily: FONT_HEAD, color: C.dim }}>ASSETS · {moneyB(stock.totalAssets)}</div>
                        <div style={{ height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <Treemap data={bs.assets.map((d) => ({ ...d, size: +(d.size * k).toFixed(2) }))} dataKey="size" isAnimationActive={false} content={<BSNode fmt={(v) => `${sym}${v}B`} />}>
                              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${sym}${v}B`} />
                            </Treemap>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 mb-1">
                          {bs.assets.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 truncate" style={{ color: C.dim }}><span className="w-2 h-2 rounded-sm inline-block shrink-0" style={{ background: d.fill }} />{i + 1}. {d.name}</span>
                              <span style={{ fontFamily: FONT_MONO }}>{sym}{(d.size * k).toFixed(1)}B</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs font-bold mb-1.5 mt-4" style={{ fontFamily: FONT_HEAD, color: C.dim }}>LIABILITIES + EQUITY</div>
                        <div style={{ height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <Treemap data={bs.liab.map((d) => ({ ...d, size: +(d.size * k).toFixed(2) }))} dataKey="size" isAnimationActive={false} content={<BSNode fmt={(v) => `${sym}${v}B`} />}>
                              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${sym}${v}B`} />
                            </Treemap>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                          {bs.liab.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 truncate" style={{ color: C.dim }}><span className="w-2 h-2 rounded-sm inline-block shrink-0" style={{ background: d.fill }} />{i + 1}. {d.name}</span>
                              <span style={{ fontFamily: FONT_MONO }}>{sym}{(d.size * k).toFixed(1)}B</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ) : (
                      <Card title="Balance sheet"><p className="text-sm" style={{ color: C.dim }}>Balance-sheet detail isn't available from the free feed for this listing.</p></Card>
                    )}
                    <Card title={t("ki_t")} sub={t("ki_sub")}>
                      <div className="space-y-0.5">
                        {[["Debt to equity ratio", stock.debtEq != null ? `${(stock.debtEq * 100).toFixed(0)}%` : "n/a", stock.debtEq < 0.7 ? C.up : stock.debtEq < 1.2 ? C.warn : C.down],
                          ["Total debt", moneyB(stock.debt), C.text], ["Long-term debt", moneyB(stock.ltDebt), C.text],
                          ["Interest coverage ratio", stock.coverage != null ? `${stock.coverage}x` : "n/a", (stock.coverage ?? 9) >= 5 ? C.up : (stock.coverage ?? 9) >= 2 ? C.warn : C.down],
                          ["Cash", moneyB(stock.cash), C.text], ["Equity", moneyB(stock.equity), C.text],
                          ["Total liabilities", moneyB(stock.totalLiab), C.text], ["Total assets", moneyB(stock.totalAssets), C.text],
                        ].map(([l, v, c]) => (
                          <div key={l} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                            <span className="text-sm" style={{ color: C.dim }}><Term>{l}</Term></span>
                            <span className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {tab === "div" && (
                  <div className="space-y-4">
                    <Card title={fillT(t("divy_t"), { y: (stock.divYield ?? 0).toFixed(1) })} sub={t("divy_sub")}>
                      {(() => { const low = 1.5, high = 4.5, max = 10, pos = Math.min(1, (stock.divYield ?? 0) / max) * 100; return (
                        <div>
                          <div className="relative h-3 rounded-full overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                            <div className="absolute inset-y-0 left-0" style={{ width: `${(low / max) * 100}%`, background: `${C.down}55` }} />
                            <div className="absolute inset-y-0" style={{ left: `${(low / max) * 100}%`, width: `${((high - low) / max) * 100}%`, background: `${C.warn}44` }} />
                            <div className="absolute inset-y-0" style={{ left: `${(high / max) * 100}%`, right: 0, background: `${C.up}55` }} />
                            <div className="absolute top-0 bottom-0 w-1 rounded" style={{ left: `calc(${pos}% - 2px)`, background: C.text }} />
                          </div>
                          <div className="flex justify-between mt-1 text-xs" style={{ color: C.dim }}><span>low (&lt;{low}%)</span><span>high (&gt;{high}%)</span></div>
                        </div>); })()}
                    </Card>
                    <Card title={fillT(t("pay_t"), { p: stock.payout != null ? stock.payout.toFixed(0) : "n/a" })} sub={t("pay_sub")}>
                      {(() => { const max = 110, pos = Math.min(1, (stock.payout ?? 0) / max) * 100; return (
                        <div>
                          <div className="relative h-3 rounded-full overflow-hidden flex" style={{ border: `1px solid ${C.line}` }}>
                            <div style={{ width: `${(60 / max) * 100}%`, background: `${C.up}55` }} /><div style={{ width: `${(20 / max) * 100}%`, background: `${C.warn}44` }} /><div style={{ flex: 1, background: `${C.down}55` }} />
                            {stock.payout > 0 && <div className="absolute top-0 bottom-0 w-1 rounded" style={{ left: `calc(${pos}% - 2px)`, background: C.text }} />}
                          </div>
                          <div className="flex justify-between mt-1 text-xs" style={{ color: C.dim }}><span>{t("sus")}</span><span>{t("str2")}</span><span>{t("risk_w")}</span></div>
                        </div>); })()}
                      <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                        <div className="p-2 rounded-lg" style={{ background: C.panelSoft }}><div className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: stock.divPS > 0 ? C.teal : C.dim }}>{stock.divPS > 0 ? money(stock.divPS) : "—"}</div><div className="text-xs" style={{ color: C.dim }}><Term tk="Dividend / share">dividend / share</Term></div></div>
                        <div className="p-2 rounded-lg" style={{ background: C.panelSoft }}><div className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: stock.exDiv ? C.text : C.dim }}>{stock.exDiv ?? "—"}</div><div className="text-xs" style={{ color: C.dim }}><Term tk="Ex-dividend date">ex-dividend date</Term></div></div>
                      </div>
                      {stock.kind === "reit" && <div className="mt-3 text-xs p-3 rounded-xl" style={{ background: C.panelSoft, color: C.dim }}>{t("reit_note")}</div>}
                    </Card>
                  </div>
                )}

                {tab === "growth" && (
                  <div className="space-y-4">
                    {flow && <Card title={t("rvb_t")} sub={fillT(t("rvb_sub"), { c: useNative ? stock.currency : "USD" })}>
                      <FlowBreakdown {...flow} fmt={moneyM} />
                      {!flow.profitable && <div className="mt-2 text-xs p-3 rounded-xl" style={{ background: `${C.down}12`, color: C.down, border: `1px solid ${C.down}33` }}>Expenses exceed gross profit: net result is a loss of {moneyM(Math.abs(flow.earn))} (LTM).</div>}
                      {stock.currency === "USD" && (
                        <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker=${ticker}&type=10-K&dateb=&owner=include&count=5`}
                          target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs px-3 py-1.5 rounded-lg font-bold"
                          style={{ border: `1px solid ${C.line}`, color: C.teal, fontFamily: FONT_HEAD, textDecoration: "none" }}>
                          {t("seg_link")}
                        </a>
                      )}
                    </Card>}
                    {annual && annual.hist.length > 1 ? (
                      <Card title={t("hist_t")} sub={fillT(t("hist_sub"), { c: useNative ? stock.currency : "USD" })}>
                        <div style={{ height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={annual.hist.map((h) => ({ y: h.y, Revenue: +(h.rev * k).toFixed(0), Earnings: +(h.earn * k).toFixed(0), FCF: h.fcf == null ? null : +(h.fcf * k).toFixed(0) }))}>
                              <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="y" tick={{ fill: C.dim, fontSize: 10 }} /><YAxis tick={{ fill: C.dim, fontSize: 10, fontFamily: FONT_MONO }} width={50} />
                              <Tooltip contentStyle={tooltipStyle} formatter={(v) => v == null ? "n/a" : `${sym}${(+v).toLocaleString("en-US")}M`} />
                              <ReferenceLine y={0} stroke={C.line} />
                              <Area dataKey="Revenue" stroke={C.accent} fill={C.accent} fillOpacity={0.12} dot={false} strokeWidth={1.8} />
                              <Line dataKey="Earnings" stroke={C.up} dot={false} strokeWidth={1.6} />
                              <Line dataKey="FCF" stroke={"#FF6BB5"} dot={false} strokeWidth={1.6} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex gap-4 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>
                          <span style={{ color: C.accent }}>— Revenue</span><span style={{ color: C.up }}>— Earnings</span><span style={{ color: "#FF6BB5" }}>— FCF</span>
                        </div>
                      </Card>
                    ) : <Card title="Earnings & revenue history"><p className="text-sm" style={{ color: C.dim }}>Annual filings not available from the free feed for this listing.</p></Card>}
                  </div>
                )}

                {tab === "tech" && (
                  <div className="space-y-4">
                    <Card title={t("ts_t")}>
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1.5"><span style={{ color: C.dim }}><Term tk="52-week range">52-week range</Term></span>
                            <span style={{ fontFamily: FONT_MONO, color: (last.close - tech.w52lo) / Math.max(1e-9, tech.w52hi - tech.w52lo) > 0.8 ? C.up : C.text }}>{(((last.close - tech.w52lo) / Math.max(1e-9, tech.w52hi - tech.w52lo)) * 100).toFixed(0)}% of range</span></div>
                          <RangeBar lo={tech.w52lo} hi={tech.w52hi} cur={last.close} fmtLo={money(tech.w52lo)} fmtHi={money(tech.w52hi)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg text-center" style={{ background: C.panelSoft }}><div className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: tech.lastV > tech.avgV * 1.5 ? C.warn : C.text }}>{tech.lastV.toFixed(1)}M</div><div className="text-xs" style={{ color: C.dim }}><Term tk="Volume (today)">volume</Term></div></div>
                          <div className="p-2.5 rounded-lg text-center" style={{ background: C.panelSoft }}><div className="text-sm font-bold" style={{ fontFamily: FONT_MONO }}>{tech.avgV.toFixed(1)}M</div><div className="text-xs" style={{ color: C.dim }}><Term tk="Avg volume (3M)">avg 3M</Term></div></div>
                        </div>
                      </div>
                    </Card>
                    <Card title="Price · SMA50 · SMA200" sub={fillT(t("sma_sub2"), { s1: money(tech.supZone[0]), s2: money(tech.supZone[1]), r1: money(tech.resZone[0]), r2: money(tech.resZone[1]) })}>
                      <div style={{ height: 230 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData.slice(-280).map((d) => ({ ...d, close: +(d.close * k).toFixed(2), sma50: d.sma50 == null ? null : +(d.sma50 * k).toFixed(2), sma200: d.sma200 == null ? null : +(d.sma200 * k).toFixed(2) }))}>
                            <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: C.dim, fontSize: 10 }} minTickGap={50} />
                            <YAxis domain={["auto", "auto"]} tick={{ fill: C.dim, fontSize: 10, fontFamily: FONT_MONO }} width={46} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <ReferenceLine y={+(tech.support * k).toFixed(2)} stroke={C.up} strokeDasharray="4 4" />
                            <ReferenceLine y={+(tech.resistance * k).toFixed(2)} stroke={C.down} strokeDasharray="4 4" />
                            <Line dataKey="close" name="Price" stroke={C.text} dot={false} strokeWidth={1.6} />
                            <Line dataKey="sma50" name="SMA50" stroke={C.accent} dot={false} strokeWidth={1.4} />
                            <Line dataKey="sma200" name="SMA200" stroke={C.warn} dot={false} strokeWidth={1.4} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ height: 76 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.slice(-280)} margin={{ top: 4 }}>
                            <XAxis dataKey="date" hide /><YAxis tick={{ fill: C.dim, fontSize: 9, fontFamily: FONT_MONO }} width={42} unit="M" />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}M shares`} />
                            <Bar dataKey="v" name="Volume">{chartData.slice(-280).map((d, i, arr) => <Cell key={i} fill={i === 0 || d.close >= arr[i - 1].close ? `${C.up}88` : `${C.down}88`} />)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                    <Card title={t("regime_t")} sub={t("regime_sub")} accent={tech.regime === "trend" ? C.up : tech.regime === "range" ? C.warn : C.accent}>
                      {/* regime pill + ER */}
                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        <Pill color={tech.regime === "trend" ? C.up : tech.regime === "range" ? C.warn : C.accent} soft>
                          {tech.regime === "trend" ? t("reg_trend") : tech.regime === "range" ? t("reg_range") : t("reg_trans")}
                        </Pill>
                        <span className="text-xs" style={{ color: C.dim, fontFamily: FONT_MONO }}>
                          {tech.adx != null
                            ? <Term tk="ADX (14)">ADX {tech.adx}</Term>
                            : <Term tk="Regime (ER)">ER {tech.er ?? "—"}</Term>}
                        </span>
                      </div>
                      {/* Trend vs Entry — one great trend can still be a bad moment to buy */}
                      <div className="grid grid-cols-2 gap-3">
                        {[[t("trend_s"), tech.trendScore, "Trend score"], [t("entry_s"), tech.entryScore, "Entry score"]].map(([lb, v, tk]) => (
                          <div key={lb} className="p-3 rounded-xl" style={{ background: C.panelSoft }}>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs" style={{ color: C.dim }}><Term tk={tk}>{lb}</Term></span>
                              <span className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: v >= 60 ? C.up : v >= 40 ? C.warn : C.down }}>{v}</span>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full" style={{ background: C.line }}>
                              <div className="h-1.5 rounded-full" style={{ width: `${v}%`, background: v >= 60 ? C.up : v >= 40 ? C.warn : C.down }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs p-3 rounded-xl" style={{ background: C.panelSoft, color: C.dim }}>
                        {tech.trendScore >= 55 && tech.entryScore >= 50 ? t("te_best")
                          : tech.trendScore >= 55 ? t("te_pull")
                          : tech.entryScore >= 55 ? t("te_ctr") : t("te_no")}
                      </div>
                      {/* quality metrics — magnitude, not just direction */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {[
                          [t("gap_mas"), tech.gapMAs, "%", "SMA50 vs SMA200"], [t("gap_px"), tech.gapPx200, "%", "Price vs SMA200"],
                          [t("mom_l"), tech.mom121, "%", "Momentum 12-1"], [t("slope50_l"), tech.slope50, "%", "SMA slope (60d)"],
                          [t("slope200_l"), tech.slope200, "%", "SMA slope (60d)"], [t("vol20_l"), tech.volRatio, "×", "Volume vs 20d avg"],
                          [t("atr_l"), tech.atrPct, "%v", "ATR (14)"], [t("rr_l"), tech.rr, "rr", "Risk/Reward"],
                        ].map(([lb, v, u, tk]) => (
                          <div key={lb} className="p-2.5 rounded-lg text-center" style={{ background: C.panelSoft }}>
                            <div className="text-sm font-bold" style={{ fontFamily: FONT_MONO,
                              color: v == null ? C.dim
                                : u === "×" ? (v >= 1.5 ? C.warn : C.text)
                                : u === "%v" ? C.text
                                : u === "rr" ? (v >= 2 ? C.up : v < 0.8 ? C.down : C.warn)
                                : v > 0 ? C.up : v < 0 ? C.down : C.text }}>
                              {v == null ? "—" : u === "rr" ? `${v}` : `${u === "%" && v > 0 ? "+" : ""}${v}${u === "%v" ? "%" : u}`}
                            </div>
                            <div className="text-xs" style={{ color: C.dim }}><Term tk={tk}>{lb}</Term></div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    {tickerBT && (
                      <Card title={t("tbt_t")} sub={fillT(t("tbt_sub"), { y: tickerBT.v2.years })} accent={tickerBT.v2.effS != null && tickerBT.v2.effB != null && tickerBT.v2.effS > tickerBT.v2.effB ? C.up : C.warn}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs" style={{ fontFamily: FONT_MONO }}>
                            <thead>
                              <tr style={{ color: C.dim }}>
                                <th className="text-left py-1.5 font-normal" style={{ fontFamily: FONT_HEAD }}>{t("bt_rule_l")}</th>
                                <th className="text-right py-1.5 font-normal">{t("bt_ret")}</th>
                                <th className="text-right py-1.5 font-normal">{t("bt_dd")}</th>
                                <th className="text-right py-1.5 font-normal">{t("bt_eff")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[["v2", tickerBT.v2.stTot, tickerBT.v2.ddS, tickerBT.v2.effS],
                                [t("tbt_cl"), tickerBT.cl.stTot, tickerBT.cl.ddS, tickerBT.cl.effS],
                                ["B&H", tickerBT.v2.bhTot, tickerBT.v2.ddB, tickerBT.v2.effB],
                              ].map(([lb, r, dd, eff], i) => (
                                <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                                  <td className="py-1.5 font-bold" style={{ fontFamily: FONT_HEAD, color: i === 2 ? C.dim : C.text }}>{lb}</td>
                                  <td className="text-right py-1.5" style={{ color: r >= 0 ? C.up : C.down }}>{r >= 0 ? "+" : ""}{r.toFixed(0)}%</td>
                                  <td className="text-right py-1.5" style={{ color: C.dim }}>−{dd.toFixed(0)}%</td>
                                  <td className="text-right py-1.5 font-bold" style={{ color: eff == null ? C.dim : eff === Math.max(tickerBT.v2.effS ?? -9, tickerBT.cl.effS ?? -9, tickerBT.v2.effB ?? -9) ? C.up : C.text }}>{eff == null ? "—" : `${eff.toFixed(2)}×`}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-2 text-xs" style={{ color: C.dim }}>
                          v2: {tickerBT.v2.trades} {t("bt_trades").toLowerCase()} · {tickerBT.v2.timePct.toFixed(0)}% {t("bt_time").toLowerCase()} · {t("bt_eff_note")}
                        </div>
                      </Card>
                    )}
                    <Card title={t("sig2_t")} sub={t("sig2_sub")}>
                      <EntryDial score={tech.score} zone={tech.zone} />
                      <div className="mt-4 space-y-2.5">
                        {[
                          { ok: tech.regime === "trend" ? true : tech.regime === "range" ? false : null,
                            txt: fillT(tech.regime === "trend" ? t("ck_reg_t") : tech.regime === "range" ? t("ck_reg_r") : t("ck_reg_x"), { e: tech.er ?? "—" }) },
                          { ok: tech.flags.trendUp,
                            txt: (tech.flags.trendUp == null ? t("ck_nh") : tech.flags.trendUp ? t("ck_tu") : t("ck_td")) + (tech.gapMAs != null ? ` (${tech.gapMAs > 0 ? "+" : ""}${tech.gapMAs}%)` : "") },
                          { ok: tech.flags.aboveSma200,
                            txt: (tech.flags.aboveSma200 == null ? t("ck_nh") : tech.flags.aboveSma200 ? t("ck_pa") : t("ck_pb")) + (tech.gapPx200 != null ? ` (${tech.gapPx200 > 0 ? "+" : ""}${tech.gapPx200}%)` : "") },
                          tech.mom121 == null ? null : { ok: tech.mom121 > 0, txt: fillT(tech.mom121 > 0 ? t("ck_mom_u") : t("ck_mom_d"), { m: tech.mom121 }) },
                          { ok: tech.flags.rsi < 30 ? true : tech.flags.rsi > 70 ? false : null, txt: `RSI(14) = ${tech.flags.rsi ?? "—"} · ${tech.flags.rsi < 30 ? t("ck_ovs") : tech.flags.rsi > 70 ? t("ck_ovb") : t("ck_neu")}` },
                          { ok: tech.flags.macdUp, txt: tech.flags.macdUp ? t("ck_mu") : t("ck_md") },
                          tech.volRatio == null ? null : { ok: tech.volRatio >= 1.5 ? (tech.dayUp ? true : false) : null,
                            txt: fillT(tech.volRatio >= 1.2 ? t("ck_vol_hi") : t("ck_vol_lo"), { x: tech.volRatio }) },
                          tech.rr == null ? null : { ok: tech.rr >= 2 ? true : tech.rr < 0.8 ? false : null,
                            txt: fillT(tech.rr >= 2 ? t("ck_rr_g") : tech.rr < 0.8 ? t("ck_rr_b") : t("ck_rr_m"), { r: tech.rr }) },
                          tech.divergence == null ? null : { ok: tech.divergence === "bull",
                            txt: tech.divergence === "bull" ? t("ck_div_u") : t("ck_div_b") },
                          tech.stretchPct == null || (tech.stretchPct < 90 && tech.stretchPct > 15) ? null : {
                            ok: tech.stretchPct >= 90 ? false : tech.flags.trendUp ? true : null,
                            txt: fillT(tech.stretchPct >= 90 ? t("ck_str_hi") : t("ck_str_lo"), { p: tech.stretchPct }) },
                        ].filter(Boolean).map((s, i) => <CheckRow key={i} ok={s.ok} label={s.txt} />)}
                      </div>
                    </Card>
                  </div>
                )}

                {tab === "feed" && <NewsTab ticker={ticker} name={stock.name} tt={t} />}
                {tab === "opt" && <ComingSoon title={t("tab_options")} body={t("opt_body")} soon={t("soon")} note={t("cs_note")} />}

                {tab === "verdict" && scores && (
                  <div className="space-y-4">
                                        {(() => {
                      const verdict = fundAvg >= 3.5 && tech.zone === "BUY ZONE" ? { t: t("v1t"), c: C.up, d: t("v1d") }
                        : fundAvg >= 3.5 ? { t: t("v2t"), c: C.warn, d: t("v2d") }
                        : tech.zone === "BUY ZONE" ? { t: t("v3t"), c: C.warn, d: t("v3d") }
                        : { t: t("v4t"), c: C.down, d: t("v4d") };
                      return (
                        <Card title={t("verdict_t")} sub={t("verdict_sub")} accent={verdict.c}>
                          <div className="text-xl font-extrabold mb-1" style={{ fontFamily: FONT_HEAD, color: verdict.c }}>{verdict.t}</div>
                          <p className="text-sm leading-relaxed" style={{ color: C.dim }}>{verdict.d}</p>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="p-3 rounded-xl text-center" style={{ background: C.panelSoft }}><div className="text-2xl font-extrabold" style={{ fontFamily: FONT_MONO, color: fundAvg >= 3.5 ? C.up : fundAvg >= 2.5 ? C.warn : C.down }}>{fundAvg}/6</div><div className="text-xs mt-0.5" style={{ color: C.dim }}>{t("fund_score")}</div></div>
                            <div className="p-3 rounded-xl text-center" style={{ background: C.panelSoft }}><div className="text-2xl font-extrabold" style={{ fontFamily: FONT_MONO, color: tech.zone === "BUY ZONE" ? C.up : tech.zone === "EXIT ZONE" ? C.down : C.warn }}>{tech.zone}</div><div className="text-xs mt-0.5" style={{ color: C.dim }}>{t("tech_read")} · {t("trend_s")} {tech.trendScore} · {t("entry_s")} {tech.entryScore}</div></div>
                          </div>
                          <div className="mt-3 text-xs p-3 rounded-xl" style={{ background: C.panelSoft, color: C.dim }}>
                            {fillT(t("vref"), { s: money(tech.support), r: money(tech.resistance), f: fv ? fillT(t("fv_word"), { v: money(fv) }) : "" })}
                          </div>
                        </Card>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === "screener" && (
          <div className="space-y-4">
            <Card title={t("nav_screener")} sub={t("scr_sub")} accent={C.accent}>
              <div className="space-y-3">
                <div className="flex gap-1.5 flex-wrap">
                  {[["all", t("all_w")], ...Object.entries(LYNCH_TYPES).map(([key2, ty]) => [key2, (LY[lang] && LY[lang][key2] && LY[lang][key2].n) || ty.name])].map(([key2, l]) => (
                    <button key={key2} onClick={() => setScr({ ...scr, cat: key2 })} className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                      style={{ fontFamily: FONT_HEAD, background: scr.cat === key2 ? C.panelSoft : "transparent", border: `1px solid ${scr.cat === key2 ? C.accent : C.line}`, color: scr.cat === key2 ? C.text : C.dim }}>{l}</button>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[["peg1", "PEG < 1"], ["hiYield", "Yield ≥ 3%"]].map(([key2, l]) => (
                    <button key={key2} onClick={() => setScr({ ...scr, [key2]: !scr[key2] })} className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                      style={{ fontFamily: FONT_HEAD, background: scr[key2] ? `${C.up}22` : "transparent", border: `1px solid ${scr[key2] ? C.up : C.line}`, color: scr[key2] ? C.up : C.dim }}>{scr[key2] ? "✓ " : ""}{l}</button>
                  ))}
                  {scrTech.status === "done" && [["techBuy", t("scr_buy")], ["hiTrend", t("scr_trend")]].map(([key2, l]) => (
                    <button key={key2} onClick={() => setScr({ ...scr, [key2]: !scr[key2] })} className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                      style={{ fontFamily: FONT_HEAD, background: scr[key2] ? `${C.up}22` : "transparent", border: `1px solid ${scr[key2] ? C.up : C.line}`, color: scr[key2] ? C.up : C.dim }}>{scr[key2] ? "✓ " : ""}{l}</button>
                  ))}
                </div>
                {scrTech.status !== "done" && (
                  <button onClick={loadScreenerTech} disabled={scrTech.status === "loading"}
                    className="px-3 py-2 rounded-lg text-xs font-bold w-full sm:w-auto"
                    style={{ fontFamily: FONT_HEAD, border: `1px solid ${C.accent}`, background: "transparent", color: C.accent, opacity: scrTech.status === "loading" ? 0.7 : 1 }}>
                    {scrTech.status === "loading" ? `${t("scr_load_ing")} ${scrTech.done}/${scrTech.total}…` : `⚡ ${t("scr_load")}`}
                  </button>
                )}
              </div>
            </Card>
            <Card title={fillT(t("res_t"), { a: screened.length, b: STOCKS.length })} sub={t("res_sub")}>
              <div className="space-y-2">
                {screened.map((s) => {
                  const k2 = classifyLynch(s), p = pegInfo(s).peg, ty = LYNCH_TYPES[k2];
                  const tyn = (LY[lang] && LY[lang][k2] && LY[lang][k2].n) || ty.name;
                  return (
                    <button key={s.ticker} onClick={() => { setTicker(s.ticker); setView("analysis"); setTab("overview"); setShowNative(false); }}
                      className="w-full text-left p-3 rounded-xl" style={{ background: C.panelSoft }}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div><span className="text-sm font-bold" style={{ fontFamily: FONT_MONO }}>{s.ticker}</span><span className="text-xs ml-2" style={{ color: C.dim }}>{s.name} · {s.country}</span></div>
                        <Pill color={ty.color} soft>{tyn}</Pill>
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs flex-wrap" style={{ fontFamily: FONT_MONO, color: C.dim }}>
                        <span>PEG <span style={{ color: p !== null && p < 1 ? C.up : C.text }}>{p ?? "n/a"}</span></span>
                        <span>P/E <span style={{ color: C.text }}>{s.pe > 0 ? s.pe.toFixed(1) : "neg."}</span></span>
                        <span>yield <span style={{ color: C.text }}>{(s.divYield ?? 0).toFixed(1)}%</span></span>
                        <span>mkt cap <span style={{ color: C.text }}>${((s.mktCap || 0) / (s._perUSD || 1)).toFixed(1)}B</span></span>
                        {scrTech.map && scrTech.map[s.ticker] && (() => {
                          const m = scrTech.map[s.ticker];
                          return (<>
                            <span>T <span style={{ color: m.t >= 60 ? C.up : m.t >= 40 ? C.warn : C.down, fontWeight: 700 }}>{m.t}</span></span>
                            <span>E <span style={{ color: m.e >= 60 ? C.up : m.e >= 40 ? C.warn : C.down, fontWeight: 700 }}>{m.e}</span></span>
                            <span style={{ color: m.z === "BUY ZONE" ? C.up : m.z === "EXIT ZONE" ? C.down : C.warn, fontWeight: 700 }}>{m.z}</span>
                          </>);
                        })()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {view === "compare" && cmpA && cmpB && (() => {
          const A = STOCKS.find((s) => s.ticker === cmpA) || STOCKS[0];
          const B = STOCKS.find((s) => s.ticker === cmpB) || STOCKS[0];
          const rows = [
            { l: "Market cap (USD)", a: `$${((A.mktCap || 0) / (A._perUSD || 1)).toFixed(1)}B`, b: `$${((B.mktCap || 0) / (B._perUSD || 1)).toFixed(1)}B`, av: (A.mktCap || 0) / (A._perUSD || 1), bv: (B.mktCap || 0) / (B._perUSD || 1), hi: "max" },
            { l: "P/E", a: A.pe > 0 ? `${A.pe.toFixed(1)}x` : "neg.", b: B.pe > 0 ? `${B.pe.toFixed(1)}x` : "neg.", av: A.pe > 0 ? A.pe : 1e9, bv: B.pe > 0 ? B.pe : 1e9, hi: "min" },
            { l: "PEG", a: pegInfo(A).peg ?? "n/a", b: pegInfo(B).peg ?? "n/a", av: pegInfo(A).peg ?? 1e9, bv: pegInfo(B).peg ?? 1e9, hi: "min" },
            { l: "Div. yield", a: `${(A.divYield ?? 0).toFixed(1)}%`, b: `${(B.divYield ?? 0).toFixed(1)}%`, av: A.divYield ?? 0, bv: B.divYield ?? 0, hi: "max" },
            { l: "Fwd growth", a: A.forecastG != null ? `${A.forecastG.toFixed(0)}%` : "n/a", b: B.forecastG != null ? `${B.forecastG.toFixed(0)}%` : "n/a", av: A.forecastG ?? -1e9, bv: B.forecastG ?? -1e9, hi: "max" },
            { l: "ROIC", a: A.roic != null ? `${A.roic.toFixed(1)}%` : "n/a", b: B.roic != null ? `${B.roic.toFixed(1)}%` : "n/a", av: A.roic ?? -1e9, bv: B.roic ?? -1e9, hi: "max" },
            { l: "Net margin", a: A.netMargin != null ? `${A.netMargin.toFixed(1)}%` : "n/a", b: B.netMargin != null ? `${B.netMargin.toFixed(1)}%` : "n/a", av: A.netMargin ?? -1e9, bv: B.netMargin ?? -1e9, hi: "max" },
            { l: "Debt/Equity", a: A.debtEq != null ? A.debtEq.toFixed(2) : "n/a", b: B.debtEq != null ? B.debtEq.toFixed(2) : "n/a", av: A.debtEq ?? 1e9, bv: B.debtEq ?? 1e9, hi: "min" },
          ];
          const winA = (r) => r.hi && r.av !== r.bv && (r.hi === "max" ? r.av > r.bv : r.av < r.bv);
          const winB = (r) => r.hi && r.av !== r.bv && (r.hi === "max" ? r.bv > r.av : r.bv < r.av);
          const radar = ["Value", "Future", "Past", "Health", "Dividend"].map((axis, i) => ({ axis, [A.ticker]: scores5(A)[i].v, [B.ticker]: scores5(B)[i].v }));
          return (
            <div className="space-y-4">
              <Card title={t("nav_compare")} sub={t("cmp_sub")}>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[[cmpA, setCmpA, C.accent], [cmpB, setCmpB, C.violet]].map(([val, setter, col], idx) => (
                    <select key={idx} value={val} onChange={(e) => setter(e.target.value)} className="p-2 rounded-lg text-sm font-bold"
                      style={{ background: C.panelSoft, border: `1px solid ${col}`, color: C.text, fontFamily: FONT_HEAD, outline: "none" }}>
                      {STOCKS.map((s) => <option key={s.ticker} value={s.ticker} style={{ background: C.panel }}>{s.ticker} — {s.name}</option>)}
                    </select>
                  ))}
                </div>
                <div className="space-y-0.5">
                  {rows.map((r) => (
                    <div key={r.l} className="grid grid-cols-3 items-center py-2 text-sm" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span className="text-right pr-3" style={{ fontFamily: FONT_MONO, color: winA(r) ? C.up : C.text, fontWeight: winA(r) ? 700 : 400 }}>{r.a}</span>
                      <span className="text-center text-xs" style={{ color: C.dim }}>{r.l}</span>
                      <span className="text-left pl-3" style={{ fontFamily: FONT_MONO, color: winB(r) ? C.up : C.text, fontWeight: winB(r) ? 700 : 400 }}>{r.b}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title={t("snowov_t")} sub={t("snowov_sub")}>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radar} outerRadius="76%">
                      <PolarGrid stroke={C.line} /><PolarAngleAxis dataKey="axis" tick={{ fill: C.dim, fontSize: 11, fontFamily: FONT_HEAD }} />
                      <Radar dataKey={A.ticker} stroke={C.accent} fill={C.accent} fillOpacity={0.3} />
                      <Radar dataKey={B.ticker} stroke={C.violet} fill={C.violet} fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 justify-center text-xs" style={{ fontFamily: FONT_MONO }}>
                  <span style={{ color: C.accent }}>■ {A.ticker}</span><span style={{ color: C.violet }}>■ {B.ticker}</span>
                </div>
              </Card>
            </div>
          );
        })()}

        {view === "backtest" && (
          <div className="space-y-4">
            <Card title={t("bt_what")} accent={C.accent}>
              <p className="text-sm leading-relaxed" style={{ color: C.dim }}>{btRule === "v2" ? t("bt_expl2") : t("bt_expl")}</p>
            </Card>
            <Card title={t("nav_backtest")} sub={btRule === "v2" ? t("bt_rule2") : t("bt_rule")} accent={C.up}>
              <div className="flex flex-wrap items-end gap-3 mb-3">
                <div>
                  <div className="text-xs mb-1" style={{ color: C.dim }}>{t("bt_rule_l")}</div>
                  <div className="flex gap-1.5">
                    {[["v2", t("bt_r_v2")], ["classic", t("bt_r_classic")]].map(([r, l]) => (
                      <button key={r} onClick={() => setBtRule(r)} className="px-2.5 py-2 rounded-lg text-xs font-bold"
                        style={{ fontFamily: FONT_HEAD, background: btRule === r ? C.panelSoft : "transparent", border: `1px solid ${btRule === r ? C.accent : C.line}`, color: btRule === r ? C.text : C.dim }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: C.dim }}>{t("bt_scope")}</div>
                  <select value={btScope} onChange={(e) => setBtScope(e.target.value)} className="p-2 rounded-lg text-sm font-bold"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text, fontFamily: FONT_MONO, outline: "none" }}>
                    <option value="ALL" style={{ background: C.panel }}>{t("bt_all")}</option>
                    {STOCKS.map((s) => <option key={s.ticker} value={s.ticker} style={{ background: C.panel }}>{s.ticker}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: C.dim }}>{t("bt_period")}</div>
                  <div className="flex gap-1.5">
                    {["1Y", "3Y", "Max"].map((p) => (
                      <button key={p} onClick={() => { setBtPeriod(p); setBtFrom(""); setBtTo(""); }} className="px-2.5 py-2 rounded-lg text-xs font-bold"
                        style={{ fontFamily: FONT_MONO, background: btPeriod === p && !btFrom && !btTo ? C.panelSoft : "transparent", border: `1px solid ${btPeriod === p && !btFrom && !btTo ? C.accent : C.line}`, color: btPeriod === p && !btFrom && !btTo ? C.text : C.dim }}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: C.dim }}>{t("bt_from")} / {t("bt_to")}</div>
                  <div className="flex gap-1.5">
                    <input type="date" value={btFrom} onChange={(e) => setBtFrom(e.target.value)} className="p-2 rounded-lg text-xs"
                      style={{ background: C.panelSoft, border: `1px solid ${btFrom ? C.accent : C.line}`, color: C.text, fontFamily: FONT_MONO, outline: "none" }} />
                    <input type="date" value={btTo} onChange={(e) => setBtTo(e.target.value)} className="p-2 rounded-lg text-xs"
                      style={{ background: C.panelSoft, border: `1px solid ${btTo ? C.accent : C.line}`, color: C.text, fontFamily: FONT_MONO, outline: "none" }} />
                  </div>
                </div>
              </div>
              {btState.status === "idle" && (
                <button onClick={runBacktest} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.up, color: "#0D1321", fontFamily: FONT_HEAD }}>
                  {fillT(t("bt_btn"), { n: btScope === "ALL" ? STOCKS.length : 1 })}
                </button>
              )}
              {btState.status === "loading" && <div className="text-sm animate-pulse" style={{ color: C.dim }}>{fillT(t("bt_load"), { a: btState.done, b: btState.total })}</div>}
              {btState.status === "error" && <div className="text-sm" style={{ color: C.down }}>{t("bt_err")}</div>}
              {btState.status === "done" && btState.result && (
                <>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={btState.result.curve}>
                        <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="d" tick={{ fill: C.dim, fontSize: 9 }} minTickGap={55} /><YAxis tick={{ fill: C.dim, fontSize: 10, fontFamily: FONT_MONO }} width={40} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line dataKey="Strategy" stroke={C.up} dot={false} strokeWidth={2} />
                        <Line dataKey="Buy & hold" stroke={C.dim} dot={false} strokeWidth={1.5} strokeDasharray="5 4" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
                    {[[t("bt_ret"), `${btState.result.stTot >= 0 ? "+" : ""}${btState.result.stTot.toFixed(0)}%`, C.up],
                      [t("bt_bh"), `${btState.result.bhTot >= 0 ? "+" : ""}${btState.result.bhTot.toFixed(0)}%`, C.dim],
                      [t("bt_dd"), `−${btState.result.ddS.toFixed(0)}%`, btState.result.ddS < btState.result.ddB ? C.up : C.warn],
                      [t("bt_bhdd"), `−${btState.result.ddB.toFixed(0)}%`, C.dim],
                    ].map(([l, v, c]) => (
                      <div key={l} className="p-2.5 rounded-lg" style={{ background: C.panelSoft }}>
                        <div className="text-base font-extrabold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.dim }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-center">
                    {[[t("bt_eff"), btState.result.effS == null ? "—" : `${btState.result.effS.toFixed(2)}×`,
                        btState.result.effS != null && btState.result.effB != null && btState.result.effS > btState.result.effB ? C.up : C.text],
                      [t("bt_eff_bh"), btState.result.effB == null ? "—" : `${btState.result.effB.toFixed(2)}×`, C.dim],
                      [t("bt_trades"), `${btState.result.trades}`, C.text],
                      [t("bt_time"), `${btState.result.timePct.toFixed(0)}%`, C.text],
                    ].map(([l, v, c]) => (
                      <div key={l} className="p-2.5 rounded-lg" style={{ background: C.panelSoft }}>
                        <div className="text-base font-extrabold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.dim }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs p-3 rounded-xl leading-relaxed" style={{ background: C.panelSoft, color: C.dim }}>
                    {t("bt_eff_note")} {t("bt_note")}
                  </div>
                  <button onClick={() => {
                      const rows = [["date", "strategy", "buy_hold"], ...btState.result.curve.map((c) => [c.d, c.Strategy, c["Buy & hold"]])];
                      const csv = rows.map((r) => r.join(",")).join("\n");
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                      a.download = `tenbagger-backtest-${btScope}-${btRule}.csv`;
                      a.click(); URL.revokeObjectURL(a.href);
                    }}
                    className="mt-2 px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ fontFamily: FONT_HEAD, border: `1px solid ${C.line}`, background: "transparent", color: C.dim }}>
                    ⬇ {t("bt_csv")}
                  </button>
                  <button onClick={runBacktest} className="mt-3 px-4 py-2 rounded-xl text-sm font-bold" style={{ border: `1px solid ${C.line}`, color: C.accent, fontFamily: FONT_HEAD }}>
                    {t("bt_rerun")}
                  </button>
                </>
              )}
            </Card>
          </div>
        )}

        <AuthPanel open={authOpen} note={authNote} onClose={() => setAuthOpen(false)} tt={t} />
        <RedeemPanel open={redeemOpen} session={session} onClose={() => setRedeemOpen(false)}
          onPremium={() => { setIsPremium(true); setRedeemOpen(false); }} />
        {term && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(5,8,16,0.7)" }} onClick={() => setTerm(null)}>
            <div className="rounded-2xl p-5 w-full max-w-sm" style={{ background: C.panel, border: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-base font-extrabold" style={{ fontFamily: FONT_HEAD }}>{term}</div>
                <button onClick={() => setTerm(null)} className="px-2 py-0.5 rounded-lg text-sm" style={{ border: `1px solid ${C.line}`, color: C.dim }}>✕</button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.dim }}>
                {(GLOSSARY[lang] && GLOSSARY[lang][term]) || GLOSSARY.en[term] || "Definition coming soon."}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-center leading-relaxed px-4" style={{ color: C.dim }}>
          Prices & fundamentals: Yahoo Finance (EOD, unofficial) · Insiders: SEC EDGAR · FX: open.er-api.com · Educational project, not investment advice.
        </div>
      </div>
    </div>
  );
}
