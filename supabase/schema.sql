-- ============================================================
-- WhoGetsYou — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================


-- 1. PROFILES
-- Linked to Supabase Auth users. Created on sign-up.
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  first_name  text not null,
  role        text not null check (role in ('post-bride', 'pre-bride')),
  created_at  timestamptz default now()
);


-- 2. MEASUREMENTS
-- One row per user. Both post-brides and pre-brides fill this out.
create table public.measurements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null unique,
  unit_system     text not null check (unit_system in ('cm', 'in')) default 'cm',
  height          numeric not null,
  neck_to_waist   numeric not null,
  shoulder_width  numeric not null,
  bust_top        numeric not null,
  under_bust      numeric not null,
  waist           numeric not null,
  high_hip        numeric not null,
  low_hip         numeric not null,
  arm_length      numeric not null,
  created_at      timestamptz default now()
);


-- 3. GOWN LISTINGS
-- One row per post-bride. Describes their dress.
create table public.gown_listings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete cascade not null unique,
  neckline         text not null,
  silhouette       text not null,
  materials        text[] not null default '{}',
  condition        text not null check (condition in ('Pristine', 'Excellent', 'Very Good', 'Good')),
  condition_notes  text default '',
  wedding_city     text not null default 'New York',
  wedding_borough  text not null,
  wedding_date     date not null,
  created_at       timestamptz default now()
);


-- 4. GOWN PHOTOS
-- Multiple photos per gown listing.
create table public.gown_photos (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.gown_listings(id) on delete cascade not null,
  storage_path  text not null,
  created_at    timestamptz default now()
);


-- 5. STYLE PREFERENCES
-- One row per pre-bride. Describes what she's looking for.
create table public.style_preferences (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id) on delete cascade not null unique,
  necklines           text[] not null default '{}',
  silhouettes         text[] not null default '{}',
  materials           text[] not null default '{}',
  wedding_city        text default 'New York',
  wedding_borough     text default '',
  wedding_date        date,
  date_undecided      boolean default false,
  profile_photo_path  text default '',
  created_at          timestamptz default now()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.measurements      enable row level security;
alter table public.gown_listings     enable row level security;
alter table public.gown_photos       enable row level security;
alter table public.style_preferences enable row level security;


-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- Measurements
create policy "Users can view own measurements"
  on public.measurements for select
  using (auth.uid() = user_id);

create policy "Users can insert own measurements"
  on public.measurements for insert
  with check (auth.uid() = user_id);

create policy "Users can update own measurements"
  on public.measurements for update
  using (auth.uid() = user_id);


-- Gown listings (readable by all authenticated users for matching)
create policy "Authenticated users can view listings"
  on public.gown_listings for select
  to authenticated
  using (true);

create policy "Post-brides can insert own listing"
  on public.gown_listings for insert
  with check (auth.uid() = user_id);

create policy "Post-brides can update own listing"
  on public.gown_listings for update
  using (auth.uid() = user_id);


-- Gown photos (readable by all authenticated users)
create policy "Authenticated users can view photos"
  on public.gown_photos for select
  to authenticated
  using (true);

create policy "Post-brides can insert own photos"
  on public.gown_photos for insert
  with check (
    auth.uid() = (select user_id from public.gown_listings where id = listing_id)
  );


-- Style preferences
create policy "Users can view own preferences"
  on public.style_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.style_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.style_preferences for update
  using (auth.uid() = user_id);
