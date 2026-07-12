-- DaySync — Supabase setup.
-- Paste this whole file into your Supabase project's SQL Editor and hit Run.
-- It creates the one table the app needs and locks it down so each person can
-- only ever touch their OWN row.

-- One row per user, holding their entire schedule blob.
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: without this, the public anon key could read everyone's
-- data. With it, every query is automatically filtered to the signed-in user.
alter table public.user_data enable row level security;

-- Drop-and-recreate so this file is safe to run more than once.
drop policy if exists "read own data"   on public.user_data;
drop policy if exists "insert own data" on public.user_data;
drop policy if exists "update own data" on public.user_data;
drop policy if exists "delete own data" on public.user_data;

create policy "read own data"   on public.user_data
  for select using (auth.uid() = user_id);

create policy "insert own data" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "update own data" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own data" on public.user_data
  for delete using (auth.uid() = user_id);
