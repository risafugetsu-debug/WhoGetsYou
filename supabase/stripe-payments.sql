-- Stripe Connect accounts (one per post-bride)
create table if not exists public.stripe_accounts (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id    text not null,
  onboarding_complete  boolean not null default false,
  created_at           timestamptz default now()
);

alter table public.stripe_accounts enable row level security;

create policy "Users can read own stripe account"
  on public.stripe_accounts for select
  to authenticated using (auth.uid() = user_id);

create policy "Users can insert own stripe account"
  on public.stripe_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stripe account"
  on public.stripe_accounts for update
  using (auth.uid() = user_id);

-- Bookings (one per accepted interest)
create table if not exists public.bookings (
  id                          uuid primary key default gen_random_uuid(),
  interest_id                 uuid references public.interests(id) on delete cascade not null unique,
  listing_id                  uuid references public.gown_listings(id) on delete cascade not null,
  pre_bride_id                uuid references auth.users(id) not null,
  post_bride_id               uuid references auth.users(id) not null,
  rental_days                 integer not null,
  amount_cents                integer not null,
  platform_fee_cents          integer not null,
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  stripe_transfer_id          text,
  status                      text not null default 'pending_payment'
                              check (status in ('pending_payment', 'booked', 'completed', 'refunded')),
  created_at                  timestamptz default now(),
  paid_at                     timestamptz,
  completed_at                timestamptz
);

alter table public.bookings enable row level security;

create policy "Pre-brides can read own bookings"
  on public.bookings for select
  to authenticated using (auth.uid() = pre_bride_id or auth.uid() = post_bride_id);
