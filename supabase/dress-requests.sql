-- ============================================================
-- dress_requests
-- Stores pre-bride dress requests from /dress-request page.
-- No auth FK — no login required to submit.
-- Feeds the Demand Intelligence Loop.
-- ============================================================

create table public.dress_requests (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  email          text not null,
  wedding_month  text,           -- stored as 'YYYY-MM' from <input type="month">
  borough        text not null,
  size_range     text not null,
  silhouettes    text[] not null default '{}',
  necklines      text[] not null default '{}',
  rental_budget  text not null,
  designer_vibe  text,
  created_at     timestamptz default now()
);

-- RLS: allow anonymous inserts; no public reads
alter table public.dress_requests enable row level security;

create policy "Anyone can submit a dress request"
  on public.dress_requests for insert
  to anon, authenticated
  with check (true);

-- Only service role (admin dashboard) can read
-- No select policy = no public reads
