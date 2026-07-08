-- ============================================================
-- watchlist: manage your stock universe WITHOUT code changes.
-- Run this once in the Supabase SQL Editor.
--
-- To ADD a stock later:  Table Editor → watchlist → Insert row
--   → type just the ticker (currency & kind are auto-detected).
-- To REMOVE a stock:     set active = false (or delete the row).
-- The daily collector picks changes up automatically.
-- ============================================================

create table if not exists watchlist (
  ticker    text primary key,     -- Yahoo format: AAPL, PETR4.SA, STG.TA, SIVE.ST
  currency  text,                 -- optional: auto-detected if empty
  kind      text,                 -- optional: 'etf' | 'reit', auto-detected
  active    boolean not null default true,
  added_at  timestamptz not null default now()
);

alter table watchlist enable row level security;
drop policy if exists "public read" on watchlist;
create policy "public read" on watchlist for select using (true);

-- seed with the current universe (safe to re-run: does nothing if already present)
insert into watchlist (ticker, currency, kind) values
  ('AAPL',     'USD', null),
  ('MSFT',     'USD', null),
  ('NVDA',     'USD', null),
  ('KO',       'USD', null),
  ('JNJ',      'USD', null),
  ('XOM',      'USD', null),
  ('NUE',      'USD', null),
  ('O',        'USD', 'reit'),
  ('VT',       'USD', 'etf'),
  ('PETR4.SA', 'BRL', null),
  ('VALE3.SA', 'BRL', null),
  ('ITUB4.SA', 'BRL', null),
  ('SIVE.ST',  'SEK', null),
  ('AAOI',     'USD', null),
  ('ACHR',     'USD', null),
  ('SNDK',     'USD', null),
  ('GGAL',     'USD', null),
  ('SNTI',     'USD', null),
  ('STG.TA',   'ILS', null)
on conflict (ticker) do nothing;
