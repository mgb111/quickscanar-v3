-- Leads table for CTA uploads and support requests
-- Run in Supabase SQL editor or psql against your project

-- Extension (usually enabled by default)
create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- person
  name text not null,
  email text not null,
  -- message
  subject text not null,
  message text not null,
  -- associations
  user_id uuid null,
  marker_key text null,
  video_key text null,
  -- metadata
  source text not null default 'cta_upload',
  status text not null default 'new'
);

-- Indexes
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_email_idx on public.leads(email);
create index if not exists leads_user_id_idx on public.leads(user_id);

-- RLS: Keep table private (service role bypasses RLS)
alter table public.leads enable row level security;

-- Optional: if you want authenticated users to see only their own leads (comment out if not needed)
-- create policy "leads select own" on public.leads
--   for select
--   to authenticated
--   using (auth.uid() = user_id);

-- No insert/update/delete policy for regular users by default.
-- Admin dashboards should use service role keys (server-side) which bypass RLS.
