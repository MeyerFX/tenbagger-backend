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
  let score = 0;
  if (trendUp) score += 25; else if (trendUp === false) score -= 25;
  if (aboveSma200) score += 15; else if (aboveSma200 === false) score -= 15;
  if (last.rsi !== null) {
    if (last.rsi < 30) score += 25; else if (last.rsi < 45) score += 10;
    else if (last.rsi > 70) score -= 25; else if (last.rsi > 60) score -= 10;
  }
  if (macdUp) score += 15; else score -= 15;
  if (goldenCross) score += 15;
  if (deathCross) score -= 15;
  if (nearSupport && trendUp) score += 10;
  if (nearResistance) score -= 10;
  score = Math.max(-100, Math.min(100, score));
  const zone = score >= 35 ? "BUY ZONE" : score <= -35 ? "EXIT ZONE" : "WAIT";
  return {
    data, last, support, resistance, score, zone, w52lo, w52hi, lastV, avgV,
    flags: { trendUp, aboveSma200, macdUp, goldenCross, deathCross, crossAge, priceCross200, nearSupport, nearResistance, rsi: last.rsi },
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

/* thesis phrases, translated — filled with {placeholders} */
const fillT = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const TH = {
  en: { intro: "{name} — {type}{sector}.", valBelow: "Trades ~{d}% below a simple DCF fair value — some margin of safety.", valAbove: "Trades ~{d}% above fair value — optimism is already priced in.", valNear: "Trades near a simple DCF fair value.", pegCheap: "PEG {p}: growth looks underpriced.", pegFair: "PEG {p}: growth fairly priced.", pegRich: "PEG {p}: paying up for growth.", analyst: "{n} analysts, mean target {t} ({u}% implied, rating: {r}).", rebound: "The market is pricing a ~{x}% earnings jump ahead (trailing vs. forward P/E).", balSolid: "Solid balance sheet (D/E {d}).", balRisk: "The balance sheet is the key risk (interest coverage {c}x).", balMod: "Moderate leverage (D/E {d}).", insBuy: "Insiders have been net buyers lately ({b} buys vs {s} sells).", insSell: "Insiders have been net sellers lately ({s} sells vs {b} buys).", techGood: "The chart is technically constructive.", techBad: "The chart is technically weak.", techNeut: "The chart is technically neutral.", fwd: "If consensus growth (~{g}%/yr) lands, earnings compound ~{c}% over 3 years.", alignYes: "Fundamentals and timing align reasonably well.", alignNo: "The pieces don't fully line up yet — patience or small sizing." },
  pt: { intro: "{name} — {type}{sector}.", valBelow: "Negocia ~{d}% abaixo de um valor justo (DCF simples) — alguma margem de segurança.", valAbove: "Negocia ~{d}% acima do valor justo — o otimismo já está no preço.", valNear: "Negocia perto de um valor justo (DCF simples).", pegCheap: "PEG {p}: crescimento parece barato.", pegFair: "PEG {p}: crescimento precificado de forma justa.", pegRich: "PEG {p}: pagando caro pelo crescimento.", analyst: "{n} analistas, alvo médio {t} ({u}% implícito, recomendação: {r}).", rebound: "O mercado precifica um salto de ~{x}% nos lucros à frente (P/L atual vs. futuro).", balSolid: "Balanço sólido (D/E {d}).", balRisk: "O balanço é o principal risco (cobertura de juros {c}x).", balMod: "Alavancagem moderada (D/E {d}).", insBuy: "Insiders compraram na ponta recente ({b} compras vs {s} vendas).", insSell: "Insiders venderam na ponta recente ({s} vendas vs {b} compras).", techGood: "O gráfico está tecnicamente construtivo.", techBad: "O gráfico está tecnicamente fraco.", techNeut: "O gráfico está tecnicamente neutro.", fwd: "Se o crescimento do consenso (~{g}%/ano) se confirmar, o lucro acumula ~{c}% em 3 anos.", alignYes: "Fundamentos e timing se alinham razoavelmente.", alignNo: "As peças ainda não se encaixam — paciência ou posição pequena." },
  es: { intro: "{name} — {type}{sector}.", valBelow: "Cotiza ~{d}% por debajo de un valor justo (DCF simple) — algo de margen de seguridad.", valAbove: "Cotiza ~{d}% por encima del valor justo — el optimismo ya está en el precio.", valNear: "Cotiza cerca de un valor justo (DCF simple).", pegCheap: "PEG {p}: el crecimiento parece barato.", pegFair: "PEG {p}: crecimiento bien valorado.", pegRich: "PEG {p}: pagando caro por el crecimiento.", analyst: "{n} analistas, objetivo medio {t} ({u}% implícito, recomendación: {r}).", rebound: "El mercado descuenta un salto de ~{x}% en beneficios (P/E actual vs. futuro).", balSolid: "Balance sólido (D/E {d}).", balRisk: "El balance es el riesgo clave (cobertura de intereses {c}x).", balMod: "Apalancamiento moderado (D/E {d}).", insBuy: "Los insiders compraron recientemente ({b} compras vs {s} ventas).", insSell: "Los insiders vendieron recientemente ({s} ventas vs {b} compras).", techGood: "El gráfico es técnicamente constructivo.", techBad: "El gráfico es técnicamente débil.", techNeut: "El gráfico es técnicamente neutral.", fwd: "Si el crecimiento del consenso (~{g}%/año) se cumple, el beneficio acumula ~{c}% en 3 años.", alignYes: "Fundamentales y timing se alinean razonablemente.", alignNo: "Las piezas aún no encajan — paciencia o posición pequeña." },
  fr: { intro: "{name} — {type}{sector}.", valBelow: "S'échange ~{d}% sous une juste valeur (DCF simple) — une marge de sécurité.", valAbove: "S'échange ~{d}% au-dessus de la juste valeur — l'optimisme est déjà dans le prix.", valNear: "S'échange près d'une juste valeur (DCF simple).", pegCheap: "PEG {p} : la croissance semble sous-évaluée.", pegFair: "PEG {p} : croissance correctement valorisée.", pegRich: "PEG {p} : la croissance se paie cher.", analyst: "{n} analystes, objectif moyen {t} ({u}% implicite, avis : {r}).", rebound: "Le marché anticipe un bond de ~{x}% des bénéfices (P/E courant vs. prévisionnel).", balSolid: "Bilan solide (D/E {d}).", balRisk: "Le bilan est le risque clé (couverture des intérêts {c}x).", balMod: "Levier modéré (D/E {d}).", insBuy: "Les initiés ont récemment acheté ({b} achats vs {s} ventes).", insSell: "Les initiés ont récemment vendu ({s} ventes vs {b} achats).", techGood: "Le graphique est techniquement constructif.", techBad: "Le graphique est techniquement faible.", techNeut: "Le graphique est techniquement neutre.", fwd: "Si la croissance du consensus (~{g}%/an) se réalise, le bénéfice cumule ~{c}% sur 3 ans.", alignYes: "Fondamentaux et timing s'alignent raisonnablement.", alignNo: "Les pièces ne s'emboîtent pas encore — patience ou petite position." },
  he: { intro: "{name} — {type}{sector}.", valBelow: "נסחרת ~{d}% מתחת לשווי הוגן (DCF פשוט) — מרווח ביטחון מסוים.", valAbove: "נסחרת ~{d}% מעל השווי ההוגן — האופטימיות כבר במחיר.", valNear: "נסחרת קרוב לשווי הוגן (DCF פשוט).", pegCheap: "PEG {p}: הצמיחה נראית זולה.", pegFair: "PEG {p}: הצמיחה מתומחרת הוגן.", pegRich: "PEG {p}: משלמים ביוקר על הצמיחה.", analyst: "{n} אנליסטים, יעד ממוצע {t} ({u}% גלום, המלצה: {r}).", rebound: "השוק מתמחר זינוק של ~{x}% ברווחים (מכפיל נוכחי מול עתידי).", balSolid: "מאזן איתן (D/E {d}).", balRisk: "המאזן הוא הסיכון המרכזי (כיסוי ריבית {c}x).", balMod: "מינוף מתון (D/E {d}).", insBuy: "בעלי עניין קנו לאחרונה ({b} קניות מול {s} מכירות).", insSell: "בעלי עניין מכרו לאחרונה ({s} מכירות מול {b} קניות).", techGood: "הגרף חיובי טכנית.", techBad: "הגרף חלש טכנית.", techNeut: "הגרף ניטרלי טכנית.", fwd: "אם צמיחת הקונצנזוס (~{g}% בשנה) תתממש, הרווח יצטבר ~{c}% בשלוש שנים.", alignYes: "הפונדמנטלס והתזמון מתיישרים סביר.", alignNo: "החלקים עוד לא מתחברים — סבלנות או פוזיציה קטנה." },
  ar: { intro: "{name} — {type}{sector}.", valBelow: "يتداول ~{d}% دون القيمة العادلة (DCF مبسّط) — هامش أمان ما.", valAbove: "يتداول ~{d}% فوق القيمة العادلة — التفاؤل في السعر بالفعل.", valNear: "يتداول قرب القيمة العادلة (DCF مبسّط).", pegCheap: "PEG {p}: النمو يبدو رخيصًا.", pegFair: "PEG {p}: النمو مسعّر بعدل.", pegRich: "PEG {p}: تدفع كثيرًا مقابل النمو.", analyst: "{n} محللين، هدف متوسط {t} ({u}% ضمني، التوصية: {r}).", rebound: "السوق يسعّر قفزة ~{x}% في الأرباح (مكرر حالي مقابل مستقبلي).", balSolid: "ميزانية متينة (D/E {d}).", balRisk: "الميزانية هي الخطر الرئيسي (تغطية الفائدة {c}x).", balMod: "رافعة معتدلة (D/E {d}).", insBuy: "المطّلعون اشتروا مؤخرًا ({b} شراء مقابل {s} بيع).", insSell: "المطّلعون باعوا مؤخرًا ({s} بيع مقابل {b} شراء).", techGood: "الرسم البياني إيجابي فنيًا.", techBad: "الرسم البياني ضعيف فنيًا.", techNeut: "الرسم البياني محايد فنيًا.", fwd: "إذا تحقق نمو الإجماع (~{g}% سنويًا)، تتراكم الأرباح ~{c}% خلال 3 سنوات.", alignYes: "الأساسيات والتوقيت متوافقان بشكل معقول.", alignNo: "القطع لا تتطابق بعد — صبر أو مركز صغير." },
  ja: { intro: "{name} — {type}{sector}。", valBelow: "簡易DCFの適正価値を約{d}%下回る水準 — 一定の安全余地。", valAbove: "適正価値を約{d}%上回る水準 — 楽観は織り込み済み。", valNear: "簡易DCFの適正価値近辺で推移。", pegCheap: "PEG {p}：成長は割安に見える。", pegFair: "PEG {p}：成長は適正評価。", pegRich: "PEG {p}：成長に高値を払う状態。", analyst: "アナリスト{n}名、平均目標{t}（含意{u}%、評価：{r}）。", rebound: "市場は利益の約{x}%の急回復を織り込む（実績vs予想PER）。", balSolid: "財務は健全（D/E {d}）。", balRisk: "財務が最大のリスク（利息カバレッジ{c}倍）。", balMod: "レバレッジは中程度（D/E {d}）。", insBuy: "インサイダーは直近買い越し（買{b}件 vs 売{s}件）。", insSell: "インサイダーは直近売り越し（売{s}件 vs 買{b}件）。", techGood: "チャートはテクニカルに良好。", techBad: "チャートはテクニカルに弱い。", techNeut: "チャートはテクニカルに中立。", fwd: "コンセンサス成長（年約{g}%）が実現すれば、3年で利益は約{c}%増。", alignYes: "ファンダメンタルズとタイミングは概ね一致。", alignNo: "まだ条件が揃わない — 待つか小さく。", },
  zh: { intro: "{name} — {type}{sector}。", valBelow: "较简易DCF公允价值低约{d}% — 具备一定安全边际。", valAbove: "较公允价值高约{d}% — 乐观已计入价格。", valNear: "接近简易DCF公允价值。", pegCheap: "PEG {p}：增长显得便宜。", pegFair: "PEG {p}：增长定价合理。", pegRich: "PEG {p}：为增长付出高价。", analyst: "{n}位分析师，平均目标价{t}（隐含{u}%，评级：{r}）。", rebound: "市场正在定价约{x}%的盈利跃升（当前vs预期市盈率）。", balSolid: "资产负债表稳健（D/E {d}）。", balRisk: "资产负债表是主要风险（利息保障{c}倍）。", balMod: "杠杆适中（D/E {d}）。", insBuy: "内部人近期净买入（{b}买 vs {s}卖）。", insSell: "内部人近期净卖出（{s}卖 vs {b}买）。", techGood: "技术面偏积极。", techBad: "技术面偏弱。", techNeut: "技术面中性。", fwd: "若共识增长（约{g}%/年）兑现，3年盈利累计约{c}%。", alignYes: "基本面与时机基本一致。", alignNo: "条件尚未齐备 — 耐心或小仓位。", },
};

function seriesFromPrices(prices) {
  const out = (prices || []).map((p, i) => {
    const dt = new Date(p.d);
    return {
      i, ts: dt.getTime(),
      date: dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      dLong: dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      close: +p.close, v: +(p.v || 0) / 1e6,
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

function NewsTab({ ticker, name }) {
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
      <Card title="Latest news" sub="Google News · links open the original source" accent={C.accent}>
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
      <Card title="Social sentiment — coming soon">
        <p className="text-sm" style={{ color: C.dim }}>Reddit/X sentiment and the bot filter need paid APIs. Headlines above are real and free.</p>
      </Card>
    </div>
  );
}

const ComingSoon = ({ title, body }) => (
  <Card title={`${title} — coming soon`} accent={C.violet}>
    <p className="text-sm leading-relaxed" style={{ color: C.dim }}>{body}</p>
    <div className="mt-3 text-xs p-3 rounded-xl" style={{ background: C.panelSoft, color: C.dim }}>
      This module needs a paid data source in production. Everything else on this site runs on real, free, daily-updated data.
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
function AuthPanel({ open, note, onClose }) {
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
          <div className="text-lg font-extrabold" style={{ fontFamily: FONT_HEAD }}>{mode === "signin" ? "Sign in" : "Create free account"}</div>
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
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
          className="w-full py-2 text-xs" style={{ color: C.accent }}>
          {mode === "signin" ? "No account? Create one free →" : "Already have an account? Sign in →"}
        </button>
        <div className="text-xs mt-2 text-center" style={{ color: C.dim }}>Free plan: watchlist up to {FREE_WL} stocks · 5 new-ticker searches/day.</div>
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
  const t = (k) => L.t[k] ?? LANGS.en.t[k] ?? k;

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

  const STOCKS = universe.stocks;
  const stock = STOCKS.find((s) => s.ticker === ticker);
  const H = ticker ? hist[ticker] : null;
  const ready = stock && H && H.series && H.series.length > 0;

  useEffect(() => { if (stock) { setDcfG(stock.forecastG > 0 ? Math.round(stock.forecastG) : 8); setDcfR(10); } }, [ticker, stock?.forecastG]);

  /* ---------- everything below only when a stock + its history are loaded ---------- */
  const tech = useMemo(() => (ready ? buildTech(H.series) : null), [ready, H]);
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
    parts.push(fillT(P.intro, { name: stock.name, type: type.name, sector: stock.kind ? "" : stock.sector ? ` · ${stock.sector}` : "" }));
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
  }, [ready, fv, ticker, lang, H]);

  /* screener (fundamentals-only; tap a result for its technical zone) */
  const screened = STOCKS.filter((s) => {
    const tk2 = classifyLynch(s), p = pegInfo(s).peg;
    return (scr.cat === "all" || tk2 === scr.cat) && (!scr.peg1 || (p !== null && p < 1)) && (!scr.hiYield || s.divYield >= 3);
  });

  /* backtest across the whole universe (loads every history once, cached) */
  const runBacktest = async () => {
    setBtState({ status: "loading", done: 0, total: STOCKS.length, result: null });
    const all = [];
    for (const s of STOCKS) {
      try { const e = await fetchHistory(s.ticker); if (e.series.length > 230 && (e.padCount || 0) < 30) all.push(e.series); } catch {}
      setBtState((b) => ({ ...b, done: b.done + 1 }));
    }
    if (all.length < 2) { setBtState({ status: "error", done: 0, total: 0, result: null }); return; }
    const n = Math.min(...all.map((d) => d.length));
    const ds = all.map((d) => d.slice(-n));
    let st = 100, bh = 100, pkS = 100, pkB = 100, ddS = 0, ddB = 0; const curve = [];
    const smaAt = (d, nn, i) => { if (i < nn - 1) return null; let s2 = 0; for (let j = i - nn + 1; j <= i; j++) s2 += d[j].close; return s2 / nn; };
    for (let i = 210; i < n; i++) {
      let sr = 0, br = 0;
      ds.forEach((d) => {
        const ret = d[i].close / d[i - 1].close - 1;
        const a50 = smaAt(d, 50, i - 1), a200 = smaAt(d, 200, i - 1);
        sr += a50 && a200 && a50 > a200 && d[i - 1].close > a200 ? ret : 0; br += ret;
      });
      st *= 1 + sr / ds.length; bh *= 1 + br / ds.length;
      pkS = Math.max(pkS, st); ddS = Math.max(ddS, 1 - st / pkS);
      pkB = Math.max(pkB, bh); ddB = Math.max(ddB, 1 - bh / pkB);
      if (i % 6 === 0) curve.push({ d: ds[0][i].dLong, Strategy: +st.toFixed(1), "Buy & hold": +bh.toFixed(1) });
    }
    setBtState({ status: "done", done: all.length, total: all.length, result: { curve, stTot: st - 100, bhTot: bh - 100, ddS: ddS * 100, ddB: ddB * 100, count: all.length } });
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
        <div className="text-sm animate-pulse" style={{ color: C.dim }}>loading real market data…</div>
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
            <div className="text-xs" style={{ color: C.dim }}>real market data · updated daily · educational, not investment advice</div>
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
                style={{ background: C.up, color: "#0D1321", fontFamily: FONT_HEAD }}>Sign in</button>
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
              ? [["mine", `★ My list (${wl.length}${isAdmin || isPremium ? "" : `/${FREE_WL}`})`], ["featured", "✨ Mag 7"], ["all", "All cached"]]
              : [["featured", "✨ Magnificent 7"], ["all", "All cached"]]
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
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {(chipMode === "mine" && session ? STOCKS.filter((s) => wl.includes(s.ticker)) : chipMode === "featured" ? STOCKS.filter((s) => MAG7.includes(s.ticker)) : STOCKS).map((s) => (
                <button key={s.ticker} onClick={() => { setTicker(s.ticker); setShowNative(false); setShowAbout(false); setTab("overview"); }}
                  className="px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap"
                  style={{ fontFamily: FONT_MONO, background: s.ticker === ticker ? C.panelSoft : "transparent", border: `1px solid ${s.ticker === ticker ? C.accent : C.line}`, color: s.ticker === ticker ? C.text : C.dim }}>
                  {s.ticker}
                </button>
              ))}
            </div>

            {chipMode === "mine" && session && wl.length === 0 && (
              <Card><div className="py-6 text-center text-sm" style={{ color: C.dim }}>Your watchlist is empty — open any stock and tap ☆ to add it (up to {FREE_WL} on the free plan).</div></Card>
            )}
            {!ready ? (
              <Card><div className="py-10 text-center text-sm animate-pulse" style={{ color: C.dim }}>loading {ticker} price history…</div></Card>
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
                        <Pill color={type.color} soft>{type.name}</Pill>
                        {alerts.length > 0 && <Pill color={C.warn} soft>⚡ {alerts.length}</Pill>}
                      </div>
                      <div className="text-xs mt-1" style={{ color: C.dim }}>
                        {stock.country} · {stock.sector || "—"} · mkt cap {moneyB(stock.mktCap)} · {ticker}
                      </div>
                      {isForeign && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs" style={{ color: C.dim }}>Listed in {stock.currency} — display:</span>
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
                      <div className="text-xs" style={{ color: C.dim }}>last close (EOD data)</div>
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
                      <Card title="⚡ Significant changes" sub="detected by the daily collector" accent={C.warn}>
                        <div className="space-y-2.5">
                          {alerts.map((a, i) => (
                            <div key={i} className="flex gap-2.5 items-start"><SignalDot ok={a.dir > 0 ? true : a.dir < 0 ? false : null} />
                              <div className="text-sm"><span className="text-xs px-1.5 py-0.5 rounded mr-1.5" style={{ background: a.kind === "Technical" ? `${C.accent}22` : `${C.violet}22`, color: a.kind === "Technical" ? C.accent : C.violet, fontFamily: FONT_MONO }}>{a.kind}</span>{a.txt}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {H.insiders && H.insiders.length > 0 && (
                      <Card title="Insider activity" sub="SEC Form 4 — parsed buys & sells (US listings)" accent={insBuys > insSells ? C.up : insSells > insBuys ? C.down : undefined}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 rounded-lg text-center flex-1" style={{ background: `${C.up}14`, border: `1px solid ${C.up}33` }}>
                            <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: C.up }}>{insBuys}</div>
                            <div className="text-xs" style={{ color: C.dim }}>buys</div>
                          </div>
                          <div className="p-2.5 rounded-lg text-center flex-1" style={{ background: `${C.down}14`, border: `1px solid ${C.down}33` }}>
                            <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: C.down }}>{insSells}</div>
                            <div className="text-xs" style={{ color: C.dim }}>sells</div>
                          </div>
                          <div className="p-2.5 rounded-lg text-center flex-1" style={{ background: C.panelSoft }}>
                            <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: C.dim }}>{H.insiders.length - insBuys - insSells}</div>
                            <div className="text-xs" style={{ color: C.dim }}>grants/other</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {H.insiders.slice(0, 6).map((x, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-xs py-1.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                              <span className="truncate" style={{ color: C.text }}>{x.insider_name || "Insider"}<span style={{ color: C.dim }}>{x.role && x.role !== "—" ? ` · ${x.role}` : ""}</span></span>
                              <span className="flex items-center gap-2 shrink-0" style={{ fontFamily: FONT_MONO }}>
                                {x.is_buy === true && <Pill color={C.up} soft>BUY</Pill>}
                                {x.is_buy === false && <Pill color={C.down} soft>SELL</Pill>}
                                {x.is_buy == null && <Pill color={C.dim} soft>grant</Pill>}
                                {x.value_usd > 0 && <span style={{ color: x.is_buy ? C.up : C.down }}>${x.value_usd >= 1e6 ? `${(x.value_usd / 1e6).toFixed(1)}M` : `${(x.value_usd / 1e3).toFixed(0)}k`}</span>}
                                <span style={{ color: C.dim }}>{x.filed_at}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs" style={{ color: C.dim }}>Open-market buys (code P) matter most — grants and option exercises are routine compensation.</div>
                      </Card>
                    )}
                    {stock.desc && (
                      <Card title={`About ${stock.name}`}>
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

                    <Card title="📝 My thesis & notes" sub="kept in this browser session">
                      <textarea value={notes[ticker] ?? ""} onChange={(e) => setNotes({ ...notes, [ticker]: e.target.value })}
                        placeholder="Why you own it — and what would make you sell." rows={3}
                        className="w-full p-3 rounded-xl text-sm" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text, fontFamily: FONT_HEAD, resize: "vertical", outline: "none" }} />
                    </Card>

                    <Card title="✨ AI-generated thesis" sub="assembled from the live metrics below — a starting point, not advice" accent={C.violet}>
                      <p className="text-sm leading-relaxed">{aiThesis}</p>
                    </Card>

                    {scores && (
                      <Card title="Snowflake" sub="six dimensions, 0–6 — Momentum comes from the technical read">
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
                      <Card title="Fundamentals summary" sub="how revenue and earnings compare to what the market pays">
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

                    <Card title="Key financials" sub={`LTM · ${useNative ? stock.currency : "USD"} · real data`}>
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

                    <Card title={`Category: ${type.name}`} sub="classified by growth, size, cyclicality and assets (Peter Lynch framework)" accent={type.color}>
                      <p className="text-sm leading-relaxed mb-3">{type.desc}</p>
                      <div className="p-3 rounded-xl text-sm leading-relaxed" style={{ background: `${type.color}14`, border: `1px solid ${type.color}44` }}>
                        <span className="font-bold" style={{ color: type.color }}>Playbook: </span>{type.strategy}
                      </div>
                    </Card>

                    {competitors.length > 1 && (
                      <Card title="Peers in your universe" sub={`${stock.sector} — from the stocks you track`}>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {competitors.map((c) => (
                            <button key={c.tk} onClick={() => { if (!c.me) { setTicker(c.tk); setTab("overview"); setShowNative(false); } }}
                              className="shrink-0 text-center p-2 rounded-xl" style={{ background: c.me ? C.panelSoft : "transparent", border: `1px solid ${c.me ? C.accent : C.line}`, width: 138, cursor: c.me ? "default" : "pointer" }}>
                              <MiniSnowflake data={c.data} color={c.color} />
                              <div className="text-xs font-bold truncate px-1" style={{ fontFamily: FONT_HEAD }}>{c.n}{c.me ? " ★" : ""}</div>
                              <div className="text-xs" style={{ color: C.dim, fontFamily: FONT_MONO }}>${((c.mc || 0) / c.per).toFixed(1)}B</div>
                              {!c.me && <div className="text-xs mt-0.5" style={{ color: C.accent }}>open →</div>}
                            </button>
                          ))}
                        </div>
                      </Card>
                    )}

                    {sim && (
                      <Card title="💸 What if I had invested?" sub="real price history · excludes taxes & fees">
                        <div className="flex flex-wrap items-end gap-3 mb-3">
                          <div>
                            <div className="text-xs mb-1" style={{ color: C.dim }}>Amount (USD)</div>
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
                          {[["Worth today", `$${sim.endValUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, sim.totalRet >= 0 ? C.up : C.down],
                            ["Total return", `${sim.totalRet >= 0 ? "+" : ""}${sim.totalRet.toFixed(0)}%`, sim.totalRet >= 0 ? C.up : C.down],
                            ["Shares bought", sim.shares.toFixed(2), C.text],
                            ["Est. dividends", stock.divYield > 0 ? `$${sim.div.toFixed(0)}` : "—", C.teal],
                          ].map(([l, v, c]) => (
                            <div key={l} className="p-2.5 rounded-lg" style={{ background: C.panelSoft }}>
                              <div className="text-base font-extrabold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</div>
                              <div className="text-xs mt-0.5" style={{ color: C.dim }}>{l}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs" style={{ color: C.dim }}>Buying at {money(sim.startPx)} back in {sim.startDate} (local-currency price return).</div>
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
                        <Card title="Interactive DCF — your assumptions" sub="5y EPS growth + 12x terminal, discounted · drag & watch fair value recompute">
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-xs mb-1"><span style={{ color: C.dim }}>EPS growth (next 5y)</span><span style={{ fontFamily: FONT_MONO, color: C.up }}>{dcfG}%/yr</span></div>
                              <input type="range" min="0" max="40" step="1" value={dcfG} onChange={(e) => setDcfG(+e.target.value)} className="w-full" style={{ accentColor: C.up }} />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1"><span style={{ color: C.dim }}>Discount rate</span><span style={{ fontFamily: FONT_MONO, color: C.warn }}>{dcfR}%/yr</span></div>
                              <input type="range" min="6" max="20" step="0.5" value={dcfR} onChange={(e) => setDcfR(+e.target.value)} className="w-full" style={{ accentColor: C.warn }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="p-3 rounded-xl text-center" style={{ background: C.panelSoft }}>
                              <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: dcfFV > last.close ? C.up : C.down }}>{money(dcfFV)}</div>
                              <div className="text-xs mt-0.5" style={{ color: C.dim }}>your fair value</div>
                            </div>
                            <div className="p-3 rounded-xl text-center" style={{ background: C.panelSoft }}>
                              <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, color: dcfFV > last.close ? C.up : C.down }}>{dcfFV > last.close ? "+" : ""}{(((dcfFV / last.close) - 1) * 100).toFixed(0)}%</div>
                              <div className="text-xs mt-0.5" style={{ color: C.dim }}>implied upside vs. price</div>
                            </div>
                          </div>
                        </Card>
                        <Card title="PEG thermometer" sub="P/E ÷ expected annual EPS growth (%)">
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
                      <Card title="Analyst forecast" sub={`consensus of ${stock.analystsN ?? "?"} analysts (Yahoo) — companies' own guidance isn't in free feeds`} accent={C.teal}>
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                          {[["Mean target", money(stock.targetMean), stock.targetMean > last.close ? C.up : C.down],
                            ["Implied move", `${stock.targetMean > last.close ? "+" : ""}${(((stock.targetMean / last.close) - 1) * 100).toFixed(0)}%`, stock.targetMean > last.close ? C.up : C.down],
                            ["Rating", (stock.recKey || "n/a").replace("_", " "), stock.recKey && stock.recKey.includes("buy") ? C.up : stock.recKey === "hold" ? C.warn : C.down],
                          ].map(([l, v, c]) => (
                            <div key={l} className="p-2.5 rounded-lg" style={{ background: C.panelSoft }}>
                              <div className="text-base font-extrabold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</div>
                              <div className="text-xs mt-0.5" style={{ color: C.dim }}>{l}</div>
                            </div>
                          ))}
                        </div>
                        {stock.targetLow > 0 && stock.targetHigh > 0 && (
                          <>
                            <div className="text-xs mb-1.5" style={{ color: C.dim }}>Target range vs. current price</div>
                            <RangeBar lo={Math.min(stock.targetLow, last.close)} hi={Math.max(stock.targetHigh, last.close)} cur={last.close}
                              fmtLo={money(stock.targetLow)} fmtHi={money(stock.targetHigh)} />
                          </>
                        )}
                        <div className="mt-2 text-xs" style={{ color: C.dim }}>Analyst targets are opinions, often lag reality, and skew optimistic — treat as one input, not truth.</div>
                      </Card>
                    )}
                    {ratios && (
                      <Card title={`Key ratios for a ${type.name}`} sub={ratios.why} accent={type.color}>
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
                      <Card title="P/E vs. peers in your universe" sub={`peer average ${peAvg}x — ${ticker} in blue`}>
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
                      <Card title="Balance sheet" sub={`assets vs. liabilities + equity · ${useNative ? stock.currency : "USD"} billions · latest filing`}>
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
                    <Card title="Key information" sub="latest filing">
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
                    <Card title={`Dividend yield: ${(stock.divYield ?? 0).toFixed(1)}%`} sub="position vs. the market">
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
                    <Card title={`Payout ratio: ${stock.payout != null ? stock.payout.toFixed(0) : "n/a"}%`} sub="share of earnings paid out as dividends">
                      {(() => { const max = 110, pos = Math.min(1, (stock.payout ?? 0) / max) * 100; return (
                        <div>
                          <div className="relative h-3 rounded-full overflow-hidden flex" style={{ border: `1px solid ${C.line}` }}>
                            <div style={{ width: `${(60 / max) * 100}%`, background: `${C.up}55` }} /><div style={{ width: `${(20 / max) * 100}%`, background: `${C.warn}44` }} /><div style={{ flex: 1, background: `${C.down}55` }} />
                            {stock.payout > 0 && <div className="absolute top-0 bottom-0 w-1 rounded" style={{ left: `calc(${pos}% - 2px)`, background: C.text }} />}
                          </div>
                          <div className="flex justify-between mt-1 text-xs" style={{ color: C.dim }}><span>sustainable</span><span>stretched</span><span>at risk</span></div>
                        </div>); })()}
                      <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                        <div className="p-2 rounded-lg" style={{ background: C.panelSoft }}><div className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: stock.divPS > 0 ? C.teal : C.dim }}>{stock.divPS > 0 ? money(stock.divPS) : "—"}</div><div className="text-xs" style={{ color: C.dim }}><Term tk="Dividend / share">dividend / share</Term></div></div>
                        <div className="p-2 rounded-lg" style={{ background: C.panelSoft }}><div className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: stock.exDiv ? C.text : C.dim }}>{stock.exDiv ?? "—"}</div><div className="text-xs" style={{ color: C.dim }}><Term tk="Ex-dividend date">ex-dividend date</Term></div></div>
                      </div>
                      {stock.kind === "reit" && <div className="mt-3 text-xs p-3 rounded-xl" style={{ background: C.panelSoft, color: C.dim }}>REITs must distribute ≥90% of taxable income — a high payout here is structural, not a red flag.</div>}
                    </Card>
                  </div>
                )}

                {tab === "growth" && (
                  <div className="space-y-4">
                    {flow && <Card title="Revenue & expenses breakdown" sub={`LTM · ${useNative ? stock.currency : "USD"} · R&D and SG&A from real filings — revenue SEGMENTS (per product/region) still need paid data`}>
                      <FlowBreakdown {...flow} fmt={moneyM} />
                      {!flow.profitable && <div className="mt-2 text-xs p-3 rounded-xl" style={{ background: `${C.down}12`, color: C.down, border: `1px solid ${C.down}33` }}>Expenses exceed gross profit: net result is a loss of {moneyM(Math.abs(flow.earn))} (LTM).</div>}
                    </Card>}
                    {annual && annual.hist.length > 1 ? (
                      <Card title="Earnings & revenue history" sub={`real annual filings · ${useNative ? stock.currency : "USD"} millions`}>
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
                    <Card title="Trading stats">
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
                    <Card title="Price · SMA50 · SMA200" sub={`support ${money(tech.support)} · resistance ${money(tech.resistance)} (60 sessions) · real EOD prices`}>
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
                    <Card title="Signal checklist" sub="entry/exit score from the standard reads">
                      <EntryDial score={tech.score} zone={tech.zone} />
                      <div className="mt-4 space-y-2.5">
                        {[
                          { ok: tech.flags.trendUp, txt: tech.flags.trendUp == null ? "Not enough history" : tech.flags.trendUp ? "SMA50 above SMA200 — primary uptrend" : "SMA50 below SMA200 — primary downtrend" },
                          { ok: tech.flags.aboveSma200, txt: tech.flags.aboveSma200 == null ? "Not enough history" : tech.flags.aboveSma200 ? "Price above the 200-day average" : "Price below the 200-day average" },
                          { ok: tech.flags.rsi < 30 ? true : tech.flags.rsi > 70 ? false : null, txt: `RSI(14) = ${tech.flags.rsi ?? "—"} · ${tech.flags.rsi < 30 ? "oversold" : tech.flags.rsi > 70 ? "overbought" : "neutral"}` },
                          { ok: tech.flags.macdUp, txt: tech.flags.macdUp ? "MACD above signal — positive momentum" : "MACD below signal — negative momentum" },
                        ].map((s, i) => <CheckRow key={i} ok={s.ok} label={s.txt} />)}
                      </div>
                    </Card>
                  </div>
                )}

                {tab === "feed" && <NewsTab ticker={ticker} name={stock.name} />}
                {tab === "opt" && <ComingSoon title={t("tab_options")} body="Live options chains, implied volatility and strategy ideas need a licensed real-time options feed. Coming with the first paid data tier." />}

                {tab === "verdict" && scores && (
                  <div className="space-y-4">
                    {(() => {
                      const verdict = fundAvg >= 3.5 && tech.zone === "BUY ZONE" ? { t: "Solid fundamentals + favorable technicals", c: C.up, d: "Thesis and timing point the same way — the setup this hybrid method looks for." }
                        : fundAvg >= 3.5 ? { t: "Good company, bad moment", c: C.warn, d: "Fundamentals pass, but the chart doesn't confirm an entry yet." }
                        : tech.zone === "BUY ZONE" ? { t: "Pretty chart, weak fundamentals", c: C.warn, d: "Technicals flag an entry, but fundamentals don't support a long-term position." }
                        : { t: "Avoid for now", c: C.down, d: "Neither fundamentals nor technicals favor an entry. Keep on the watchlist." };
                      return (
                        <Card title="Hybrid verdict" sub="fundamentals + technicals, on real data" accent={verdict.c}>
                          <div className="text-xl font-extrabold mb-1" style={{ fontFamily: FONT_HEAD, color: verdict.c }}>{verdict.t}</div>
                          <p className="text-sm leading-relaxed" style={{ color: C.dim }}>{verdict.d}</p>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="p-3 rounded-xl text-center" style={{ background: C.panelSoft }}><div className="text-2xl font-extrabold" style={{ fontFamily: FONT_MONO, color: fundAvg >= 3.5 ? C.up : fundAvg >= 2.5 ? C.warn : C.down }}>{fundAvg}/6</div><div className="text-xs mt-0.5" style={{ color: C.dim }}>fundamental score</div></div>
                            <div className="p-3 rounded-xl text-center" style={{ background: C.panelSoft }}><div className="text-2xl font-extrabold" style={{ fontFamily: FONT_MONO, color: tech.score >= 35 ? C.up : tech.score <= -35 ? C.down : C.warn }}>{tech.zone}</div><div className="text-xs mt-0.5" style={{ color: C.dim }}>technical read ({tech.score > 0 ? "+" : ""}{tech.score})</div></div>
                          </div>
                          <div className="mt-3 text-xs p-3 rounded-xl" style={{ background: C.panelSoft, color: C.dim }}>
                            Reference levels: support {money(tech.support)} · resistance {money(tech.resistance)}{fv ? ` · simple DCF fair value ${money(fv)}` : ""}. Educational — not investment advice.
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
            <Card title={t("nav_screener")} sub="fundamental filters over your live universe" accent={C.accent}>
              <div className="space-y-3">
                <div className="flex gap-1.5 flex-wrap">
                  {[["all", "All"], ...Object.entries(LYNCH_TYPES).map(([key2, ty]) => [key2, ty.name])].map(([key2, l]) => (
                    <button key={key2} onClick={() => setScr({ ...scr, cat: key2 })} className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                      style={{ fontFamily: FONT_HEAD, background: scr.cat === key2 ? C.panelSoft : "transparent", border: `1px solid ${scr.cat === key2 ? C.accent : C.line}`, color: scr.cat === key2 ? C.text : C.dim }}>{l}</button>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[["peg1", "PEG < 1"], ["hiYield", "Yield ≥ 3%"]].map(([key2, l]) => (
                    <button key={key2} onClick={() => setScr({ ...scr, [key2]: !scr[key2] })} className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                      style={{ fontFamily: FONT_HEAD, background: scr[key2] ? `${C.up}22` : "transparent", border: `1px solid ${scr[key2] ? C.up : C.line}`, color: scr[key2] ? C.up : C.dim }}>{scr[key2] ? "✓ " : ""}{l}</button>
                  ))}
                </div>
              </div>
            </Card>
            <Card title={`Results — ${screened.length} of ${STOCKS.length}`} sub="tap a stock for its full analysis and technical zone">
              <div className="space-y-2">
                {screened.map((s) => {
                  const p = pegInfo(s).peg, ty = LYNCH_TYPES[classifyLynch(s)];
                  return (
                    <button key={s.ticker} onClick={() => { setTicker(s.ticker); setView("analysis"); setTab("overview"); setShowNative(false); }}
                      className="w-full text-left p-3 rounded-xl" style={{ background: C.panelSoft }}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div><span className="text-sm font-bold" style={{ fontFamily: FONT_MONO }}>{s.ticker}</span><span className="text-xs ml-2" style={{ color: C.dim }}>{s.name} · {s.country}</span></div>
                        <Pill color={ty.color} soft>{ty.name}</Pill>
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs flex-wrap" style={{ fontFamily: FONT_MONO, color: C.dim }}>
                        <span>PEG <span style={{ color: p !== null && p < 1 ? C.up : C.text }}>{p ?? "n/a"}</span></span>
                        <span>P/E <span style={{ color: C.text }}>{s.pe > 0 ? s.pe.toFixed(1) : "neg."}</span></span>
                        <span>yield <span style={{ color: C.text }}>{(s.divYield ?? 0).toFixed(1)}%</span></span>
                        <span>mkt cap <span style={{ color: C.text }}>${((s.mktCap || 0) / (s._perUSD || 1)).toFixed(1)}B</span></span>
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
              <Card title={t("nav_compare")} sub="best value per row highlighted — real data, USD">
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
              <Card title="Snowflake overlay" sub="fundamental axes (momentum needs each chart loaded)">
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
            <Card title={t("nav_backtest")} sub="rule: long only while SMA50 > SMA200 and price > SMA200; equal weight across your universe · REAL prices" accent={C.up}>
              {btState.status === "idle" && (
                <button onClick={runBacktest} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.up, color: "#0D1321", fontFamily: FONT_HEAD }}>
                  ▶ Load {STOCKS.length} histories & run backtest
                </button>
              )}
              {btState.status === "loading" && <div className="text-sm animate-pulse" style={{ color: C.dim }}>loading price histories… {btState.done}/{btState.total}</div>}
              {btState.status === "error" && <div className="text-sm" style={{ color: C.down }}>Not enough histories loaded — try again.</div>}
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
                    {[["Strategy return", `${btState.result.stTot >= 0 ? "+" : ""}${btState.result.stTot.toFixed(0)}%`, C.up],
                      ["Buy & hold", `${btState.result.bhTot >= 0 ? "+" : ""}${btState.result.bhTot.toFixed(0)}%`, C.dim],
                      ["Strategy max DD", `−${btState.result.ddS.toFixed(0)}%`, btState.result.ddS < btState.result.ddB ? C.up : C.warn],
                      ["B&H max DD", `−${btState.result.ddB.toFixed(0)}%`, C.dim],
                    ].map(([l, v, c]) => (
                      <div key={l} className="p-2.5 rounded-lg" style={{ background: C.panelSoft }}>
                        <div className="text-base font-extrabold" style={{ fontFamily: FONT_MONO, color: c }}>{v}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.dim }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs p-3 rounded-xl leading-relaxed" style={{ background: C.panelSoft, color: C.dim }}>
                    Real simulation over your {btState.result.count} tracked stocks' actual price history (no transaction costs). Past performance never guarantees future results.
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        <AuthPanel open={authOpen} note={authNote} onClose={() => setAuthOpen(false)} />
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
