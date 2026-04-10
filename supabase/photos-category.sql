-- Add category column to gown_photos
-- Existing rows default to 'detail'
alter table public.gown_photos
  add column if not exists category text not null default 'detail'
  check (category in ('worn', 'detail', 'condition'));

-- Create gown_videos table (one video per listing)
create table if not exists public.gown_videos (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.gown_listings(id) on delete cascade not null unique,
  storage_path  text not null,
  created_at    timestamptz default now()
);

alter table public.gown_videos enable row level security;

create policy "Authenticated users can view videos"
  on public.gown_videos for select
  to authenticated using (true);

create policy "Post-brides can insert own video"
  on public.gown_videos for insert
  with check (
    auth.uid() = (select user_id from public.gown_listings where id = listing_id)
  );

create policy "Post-brides can update own video"
  on public.gown_videos for update
  using (
    auth.uid() = (select user_id from public.gown_listings where id = listing_id)
  );

create policy "Post-brides can delete own video"
  on public.gown_videos for delete
  using (
    auth.uid() = (select user_id from public.gown_listings where id = listing_id)
  );
