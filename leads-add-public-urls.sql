-- Add public URL columns for convenience
alter table public.leads
  add column if not exists marker_url text null,
  add column if not exists video_url text null;
