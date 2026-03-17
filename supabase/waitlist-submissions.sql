-- ============================================================
-- waitlist_submissions
-- Stores email captures from the homepage hero (pre-launch).
-- No auth FK — anyone can submit.
-- ============================================================

create table public.waitlist_submissions (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  first_name  text,
  role        text not null default 'lender',
  created_at  timestamptz default now()
);

-- RLS: disable reads for public; allow anonymous inserts
alter table public.waitlist_submissions enable row level security;

create policy "Anyone can submit to waitlist"
  on public.waitlist_submissions for insert
  to anon, authenticated
  with check (true);

-- Only service role (admin dashboard) can read
-- No select policy = no public reads
