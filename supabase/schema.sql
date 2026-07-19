-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query)

create table if not exists app_state (
  id smallint primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);

-- The backend uses the Supabase service role key, which bypasses Row Level
-- Security entirely — so RLS does not need to be configured for this table.
-- If you'd rather enable RLS for defense-in-depth, uncomment the lines below
-- (the service role key still bypasses RLS regardless):
--
-- alter table app_state enable row level security;
