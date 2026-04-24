# Stripe Connect Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow pre-brides to pay through the platform to confirm a rental booking, with 80% automatically transferred to the post-bride's connected Stripe account after the rental completes.

**Architecture:** Stripe Connect Express for post-bride payout accounts; Stripe Checkout (hosted page) for pre-bride payments. Platform collects full payment, holds it, then manually transfers 80% when the post-bride marks the rental complete. A `bookings` table tracks state: `pending_payment → booked → completed`. API routes use a service-role Supabase client to verify user identity from a Bearer token and bypass RLS for booking writes.

**Tech Stack:** Stripe Node SDK, Next.js 16 App Router route handlers, Supabase service role client, TypeScript 5

---

## Env Vars Required

Add these to `.env.local` (dev) and Vercel (prod) before starting:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...          # from Stripe dashboard after creating webhook
NEXT_PUBLIC_APP_URL=http://localhost:3000  # https://whogetsyou.com in prod
SUPABASE_SERVICE_ROLE_KEY=...            # from Supabase → Settings → API
```

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/stripe.ts` | Create | Stripe singleton |
| `lib/supabase-server.ts` | Create | Service-role Supabase client + user token verification for API routes |
| `supabase/stripe-payments.sql` | Create | `stripe_accounts` + `bookings` tables with RLS |
| `app/api/stripe/connect/route.ts` | Create | POST: create/retrieve Express account + return onboarding URL |
| `app/api/stripe/checkout/route.ts` | Create | POST: create Checkout Session for booking |
| `app/api/stripe/webhook/route.ts` | Create | POST: handle `checkout.session.completed` and `account.updated` |
| `app/api/stripe/payout/route.ts` | Create | POST: transfer 80% to post-bride after rental complete |
| `app/dashboard/page.tsx` | Modify | Show "Set up payouts" CTA for post-brides without connected Stripe account |
| `app/interests/page.tsx` | Modify | After accepting interest, create booking; add "Mark rental complete" for booked listings |
| `app/listings/[id]/page.tsx` | Modify | Show rental duration selector + "Complete booking" CTA when interest accepted |
| `app/booking/[id]/page.tsx` | Create | Booking confirmation page shown after successful Stripe Checkout |

---

## Task 1: Install Stripe, Create Lib Files, DB Migration

**Files:**
- Create: `lib/stripe.ts`
- Create: `lib/supabase-server.ts`
- Create: `supabase/stripe-payments.sql`

- [ ] **Step 1: Install Stripe**

```bash
npm install stripe
```

Expected: `stripe` appears in `package.json` dependencies.

- [ ] **Step 2: Create `lib/stripe.ts`**

```ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});
```

- [ ] **Step 3: Create `lib/supabase-server.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getUserFromToken(token: string) {
  const admin = createAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
```

- [ ] **Step 4: Create `supabase/stripe-payments.sql`**

```sql
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
```

- [ ] **Step 5: Run migration in Supabase SQL Editor**

Go to Supabase → SQL Editor → paste the full contents of `supabase/stripe-payments.sql` → Run.

Verify:
```sql
select table_name from information_schema.tables
where table_name in ('stripe_accounts', 'bookings');
```
Expected: two rows.

- [ ] **Step 6: Commit**

```bash
git add lib/stripe.ts lib/supabase-server.ts supabase/stripe-payments.sql package.json package-lock.json
git commit -m "feat: install stripe, add lib helpers, add bookings + stripe_accounts migration"
```

---

## Task 2: Post-bride Stripe Connect Onboarding API

**Files:**
- Create: `app/api/stripe/connect/route.ts`

When a post-bride calls this endpoint (POST with Bearer token), it creates a Stripe Express account if none exists and returns a Stripe-hosted onboarding URL. The post-bride visits that URL to set up their bank account for payouts.

- [ ] **Step 1: Create `app/api/stripe/connect/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient, getUserFromToken } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('stripe_accounts')
    .select('stripe_account_id, onboarding_complete')
    .eq('user_id', user.id)
    .single();

  let accountId = existing?.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express' });
    accountId = account.id;
    await admin.from('stripe_accounts').insert({
      user_id: user.id,
      stripe_account_id: accountId,
      onboarding_complete: false,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/dashboard?stripe=refresh`,
    return_url: `${appUrl}/dashboard?stripe=connected`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: link.url });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/connect/route.ts
git commit -m "feat: post-bride Stripe Connect onboarding API"
```

---

## Task 3: Dashboard — "Set up payouts" CTA for Post-brides

**Files:**
- Modify: `app/dashboard/page.tsx`

Add a check for whether the post-bride has a connected Stripe account. If not, show a card prompting them to set it up. If onboarding is complete, show a green "Payouts connected" badge.

- [ ] **Step 1: Add stripe account state to `app/dashboard/page.tsx`**

After the existing state declarations (around line 58), add:

```tsx
const [stripeStatus, setStripeStatus] = useState<'none' | 'pending' | 'connected'>('none');
```

- [ ] **Step 2: Load stripe account status inside `load()` in `app/dashboard/page.tsx`**

Inside the `if (profileRes.data.role === 'post-bride')` block (around line 96), after setting the listing, add:

```tsx
const { data: stripeData } = await supabase
  .from('stripe_accounts')
  .select('onboarding_complete')
  .eq('user_id', userId)
  .single();

if (!stripeData) {
  setStripeStatus('none');
} else if (stripeData.onboarding_complete) {
  setStripeStatus('connected');
} else {
  setStripeStatus('pending');
}
```

- [ ] **Step 3: Add `connectStripe` function to `app/dashboard/page.tsx`**

After `toggleAvailability()` (around line 159), add:

```tsx
async function connectStripe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const res = await fetch('/api/stripe/connect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const { url, error } = await res.json();
  if (error) { alert('Could not start Stripe setup. Please try again.'); return; }
  window.location.href = url;
}
```

- [ ] **Step 4: Read the URL param on return from Stripe in `app/dashboard/page.tsx`**

At the top of the component (after the `useRouter()` call), add:

```tsx
const searchParams = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search)
  : null;
const stripeReturn = searchParams?.get('stripe');
```

Then add a `useEffect` that re-checks stripe status when `stripeReturn === 'connected'`:

```tsx
useEffect(() => {
  if (stripeReturn !== 'connected') return;
  async function recheckStripe() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('stripe_accounts')
      .select('onboarding_complete')
      .eq('user_id', session.user.id)
      .single();
    if (data?.onboarding_complete) setStripeStatus('connected');
    else setStripeStatus('pending');
  }
  recheckStripe();
}, [stripeReturn]);
```

- [ ] **Step 5: Render the Stripe CTA in the JSX of `app/dashboard/page.tsx`**

Inside the `{profile.role === 'post-bride' && listing && (` block, after the closing `</Section>` tag (around line 296), add:

```tsx
{stripeStatus !== 'connected' && (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-blush)] px-4 py-4">
    <p className="text-sm font-medium text-[var(--color-charcoal)]">
      {stripeStatus === 'pending' ? 'Finish setting up payouts' : 'Set up payouts to receive rent'}
    </p>
    <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">
      {stripeStatus === 'pending'
        ? 'Your Stripe account setup is incomplete. Finish it so pre-brides can book your gown.'
        : 'Connect a bank account so pre-brides can pay you directly through the platform.'}
    </p>
    <button
      type="button"
      onClick={connectStripe}
      className="mt-3 inline-block rounded-full bg-[var(--color-rose)] px-4 py-1.5 text-xs text-white transition-colors hover:bg-[var(--color-rose-dark)]"
    >
      {stripeStatus === 'pending' ? 'Finish setup →' : 'Connect Stripe →'}
    </button>
  </div>
)}

{stripeStatus === 'connected' && (
  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
    <span className="text-xs font-medium text-emerald-700">Payouts connected ✓</span>
    <span className="text-xs text-emerald-600">You&apos;ll receive 80% of each rental.</span>
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: dashboard Stripe Connect CTA for post-brides"
```

---

## Task 4: Checkout API + Rental Duration Selector on Listing Page

**Files:**
- Create: `app/api/stripe/checkout/route.ts`
- Modify: `app/listings/[id]/page.tsx`

When a pre-bride's interest has been accepted, show a rental duration selector (1/3/7 days) and a "Complete booking" button. Clicking it calls the checkout API which creates a Stripe Checkout Session and redirects the pre-bride to pay.

- [ ] **Step 1: Create `app/api/stripe/checkout/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient, getUserFromToken } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, rentalDays } = await req.json() as { listingId: string; rentalDays: 1 | 3 | 7 };
  if (!listingId || ![1, 3, 7].includes(rentalDays)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get listing and verify interest was accepted
  const [listingRes, interestRes] = await Promise.all([
    admin.from('gown_listings').select('*').eq('id', listingId).single(),
    admin.from('interests')
      .select('id, accepted_at, post_bride_id: listing_id(user_id)')
      .eq('pre_bride_id', user.id)
      .eq('listing_id', listingId)
      .not('accepted_at', 'is', null)
      .single(),
  ]);

  if (!listingRes.data || !interestRes.data) {
    return NextResponse.json({ error: 'Listing or interest not found' }, { status: 404 });
  }

  const listing = listingRes.data;
  const priceMap: Record<number, number | null> = {
    1: listing.price_1day,
    3: listing.price_3day,
    7: listing.price_7day,
  };
  const priceUsd = priceMap[rentalDays];
  if (!priceUsd) return NextResponse.json({ error: 'Price not set for this duration' }, { status: 400 });

  const amountCents = priceUsd * 100;
  const platformFeeCents = Math.round(amountCents * 0.20);

  // Get post-bride's stripe account
  const postBrideId = (interestRes.data.post_bride_id as unknown as { user_id: string }).user_id;
  const { data: stripeAccount } = await admin
    .from('stripe_accounts')
    .select('stripe_account_id, onboarding_complete')
    .eq('user_id', postBrideId)
    .single();

  if (!stripeAccount?.onboarding_complete) {
    return NextResponse.json({ error: 'Seller has not set up payouts yet' }, { status: 400 });
  }

  // Check if booking already exists
  const { data: existingBooking } = await admin
    .from('bookings')
    .select('id, status, stripe_checkout_session_id')
    .eq('interest_id', interestRes.data.id)
    .single();

  if (existingBooking?.status === 'booked' || existingBooking?.status === 'completed') {
    return NextResponse.json({ error: 'Already booked' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Wedding gown rental — ${rentalDays} day${rentalDays > 1 ? 's' : ''}`,
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${appUrl}/booking/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/listings/${listingId}`,
    metadata: {
      interest_id: interestRes.data.id,
      listing_id: listingId,
      pre_bride_id: user.id,
      post_bride_id: postBrideId,
      rental_days: rentalDays.toString(),
      amount_cents: amountCents.toString(),
      platform_fee_cents: platformFeeCents.toString(),
      post_bride_stripe_account_id: stripeAccount.stripe_account_id,
    },
  });

  // Upsert booking record
  if (existingBooking) {
    await admin.from('bookings').update({
      stripe_checkout_session_id: session.id,
    }).eq('id', existingBooking.id);
  } else {
    await admin.from('bookings').insert({
      interest_id: interestRes.data.id,
      listing_id: listingId,
      pre_bride_id: user.id,
      post_bride_id: postBrideId,
      rental_days: rentalDays,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      stripe_checkout_session_id: session.id,
      status: 'pending_payment',
    });
  }

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 2: Add `isAccepted` state + rental duration state to `app/listings/[id]/page.tsx`**

The file already has `isInterested` state. Add:

```tsx
const [rentalDays, setRentalDays] = useState<1 | 3 | 7>(1);
const [bookingPending, setBookingPending] = useState(false);
const [bookingError, setBookingError] = useState<string | null>(null);
const [isAccepted, setIsAccepted] = useState(false);
```

- [ ] **Step 3: Load `isAccepted` status in `load()` in `app/listings/[id]/page.tsx`**

In the existing `interestRes` fetch (around line 128–129), update the select to include `accepted_at`:

```tsx
supabase.from('interests').select('id, accepted_at').eq('pre_bride_id', userId).eq('listing_id', id).maybeSingle(),
```

Then after `setIsInterested(!!interestRes.data)`, add:

```tsx
setIsAccepted(!!interestRes.data?.accepted_at);
```

- [ ] **Step 4: Add `handleBooking` function to `app/listings/[id]/page.tsx`**

After the `expressInterest` function (around line 185), add:

```tsx
async function handleBooking() {
  if (!data) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  setBookingPending(true);
  setBookingError(null);
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ listingId: data.listing.id, rentalDays }),
  });
  const json = await res.json();
  if (!res.ok || !json.url) {
    setBookingError(json.error ?? 'Could not start checkout. Please try again.');
    setBookingPending(false);
    return;
  }
  window.location.href = json.url;
}
```

- [ ] **Step 5: Replace the CTA block in `app/listings/[id]/page.tsx`**

Find the block that starts with `{viewerRole === 'pre-bride' && !isOwnListing && (` (around line 455). Replace it with:

```tsx
{viewerRole === 'pre-bride' && !isOwnListing && (
  <div className="space-y-3">
    {isAccepted ? (
      <>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-medium text-emerald-700">Your interest was accepted ✓</p>
          <p className="mt-1 text-xs text-emerald-600">Select how many days and complete your booking below.</p>
        </div>

        {/* Rental duration selector */}
        {(listing.price_1day || listing.price_3day || listing.price_7day) && (
          <div className="flex gap-2">
            {([1, 3, 7] as const).filter((d) => {
              const p = d === 1 ? listing.price_1day : d === 3 ? listing.price_3day : listing.price_7day;
              return !!p;
            }).map((d) => {
              const price = d === 1 ? listing.price_1day : d === 3 ? listing.price_3day : listing.price_7day;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRentalDays(d)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-center transition-colors ${
                    rentalDays === d
                      ? 'border-[var(--color-rose)] bg-[var(--color-blush)] text-[var(--color-rose)]'
                      : 'border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                  }`}
                >
                  <p className="text-xs text-[var(--color-muted)]">{d} day{d > 1 ? 's' : ''}</p>
                  <p className="text-sm font-medium">${price}</p>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={bookingPending}
          onClick={handleBooking}
          className={`w-full rounded-full py-3 text-sm font-medium transition-colors ${
            bookingPending
              ? 'border border-[var(--color-border)] bg-[var(--color-blush)] text-[var(--color-muted)] cursor-wait'
              : 'bg-[var(--color-rose)] text-white hover:bg-[var(--color-rose-dark)] cursor-pointer'
          }`}
        >
          {bookingPending ? 'Redirecting to payment…' : 'Complete booking →'}
        </button>
        {bookingError && (
          <p className="text-xs text-red-500 text-center">{bookingError}</p>
        )}
      </>
    ) : (
      <>
        <button
          type="button"
          disabled={isInterested || pending}
          onClick={expressInterest}
          className={`w-full rounded-full py-3 text-sm font-medium transition-colors ${
            isInterested
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
              : pending
              ? 'border border-[var(--color-border)] bg-[var(--color-blush)] text-[var(--color-muted)] cursor-wait'
              : 'border border-[var(--color-rose)] bg-[var(--color-rose)] text-white hover:bg-[var(--color-rose-dark)] cursor-pointer'
          }`}
        >
          {isInterested ? 'Interest sent ✓' : pending ? 'Sending…' : 'Express interest'}
        </button>
        {isInterested && (
          <p className="text-center text-xs text-[var(--color-muted)]">Waiting for the seller to accept.</p>
        )}
        {interestError && (
          <p className="text-xs text-red-500 text-center">{interestError}</p>
        )}
      </>
    )}
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add app/api/stripe/checkout/route.ts app/listings/[id]/page.tsx
git commit -m "feat: checkout API + rental duration selector + Complete booking CTA on listing page"
```

---

## Task 5: Stripe Webhook + Booking Confirmation Page

**Files:**
- Create: `app/api/stripe/webhook/route.ts`
- Create: `app/booking/[id]/page.tsx`

The webhook handles two events:
- `checkout.session.completed` → mark booking as `booked`, record `paid_at` and `stripe_payment_intent_id`
- `account.updated` → mark `onboarding_complete = true` when Stripe confirms the Express account is active

- [ ] **Step 1: Create `app/api/stripe/webhook/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { interest_id } = session.metadata ?? {};
    if (!interest_id) return NextResponse.json({ ok: true });

    await admin.from('bookings').update({
      status: 'booked',
      stripe_payment_intent_id: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
      paid_at: new Date().toISOString(),
    }).eq('stripe_checkout_session_id', session.id);
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    if (account.details_submitted) {
      await admin.from('stripe_accounts').update({
        onboarding_complete: true,
      }).eq('stripe_account_id', account.id);
    }
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Register the webhook in Stripe dashboard**

Go to Stripe Dashboard → Developers → Webhooks → Add endpoint.

- Endpoint URL: `https://whogetsyou.com/api/stripe/webhook`
- Events to listen for: `checkout.session.completed`, `account.updated`

Copy the signing secret and add it to Vercel env vars as `STRIPE_WEBHOOK_SECRET`.

For local dev, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copy the `whsec_...` it prints and set as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

- [ ] **Step 3: Create `app/booking/[id]/page.tsx`**

This page is shown after Stripe Checkout succeeds. The `[id]` is the Stripe Checkout Session ID.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'pending' | 'not_found'>('loading');

  useEffect(() => {
    async function check() {
      const { data } = await supabase
        .from('bookings')
        .select('status, listing_id, rental_days, amount_cents')
        .eq('stripe_checkout_session_id', id)
        .single();

      if (!data) { setStatus('not_found'); return; }
      if (data.status === 'booked' || data.status === 'completed') {
        setStatus('confirmed');
      } else {
        // Webhook may not have arrived yet — poll once after 2s
        setTimeout(async () => {
          const { data: retry } = await supabase
            .from('bookings')
            .select('status')
            .eq('stripe_checkout_session_id', id)
            .single();
          setStatus(retry?.status === 'booked' || retry?.status === 'completed' ? 'confirmed' : 'pending');
        }, 2000);
      }
    }
    check();
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Confirming your booking…</p>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 text-center">
        <div className="space-y-3">
          <p className="text-sm text-red-500">Booking not found.</p>
          <Link href="/matches" className="text-sm text-[var(--color-rose)] hover:underline">Back to matches</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center space-y-4">
      <p className="text-4xl">🌸</p>
      <h1 className="text-2xl font-light text-[var(--color-charcoal)]">
        {status === 'confirmed' ? 'Booking confirmed' : 'Payment received'}
      </h1>
      <p className="text-sm text-[var(--color-muted)] leading-relaxed">
        {status === 'confirmed'
          ? 'Your booking is confirmed. The seller will be in touch to arrange the handover.'
          : 'Your payment was received. Your booking is being confirmed — this usually takes a moment.'}
      </p>
      <Link
        href="/matches"
        className="mt-4 inline-block rounded-full bg-[var(--color-rose)] px-8 py-3 text-sm text-white transition-colors hover:bg-[var(--color-rose-dark)]"
      >
        Back to matches
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/stripe/webhook/route.ts app/booking/[id]/page.tsx
git commit -m "feat: Stripe webhook handler + booking confirmation page"
```

---

## Task 6: Post-bride Marks Rental Complete + Payout Release

**Files:**
- Create: `app/api/stripe/payout/route.ts`
- Modify: `app/interests/page.tsx`

After the dress is returned, the post-bride clicks "Mark rental complete" on her `/interests` page. This calls the payout API which transfers 80% of the booking amount to her Stripe Express account.

- [ ] **Step 1: Create `app/api/stripe/payout/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient, getUserFromToken } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await req.json() as { bookingId: string };
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('post_bride_id', user.id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.status !== 'booked') return NextResponse.json({ error: 'Booking is not in booked state' }, { status: 400 });

  const { data: stripeAccount } = await admin
    .from('stripe_accounts')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single();

  if (!stripeAccount) return NextResponse.json({ error: 'No Stripe account found' }, { status: 400 });

  const payoutCents = booking.amount_cents - booking.platform_fee_cents;

  const transfer = await stripe.transfers.create({
    amount: payoutCents,
    currency: 'usd',
    destination: stripeAccount.stripe_account_id,
    transfer_group: bookingId,
    metadata: { booking_id: bookingId },
  });

  await admin.from('bookings').update({
    status: 'completed',
    stripe_transfer_id: transfer.id,
    completed_at: new Date().toISOString(),
  }).eq('id', bookingId);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Load bookings alongside interests in `app/interests/page.tsx`**

In the `load()` function, after fetching `interestsData`, add a parallel fetch for bookings:

```tsx
const interestIds = interestsData.map((i: { id: string }) => i.id);

const { data: bookingsData } = await supabase
  .from('bookings')
  .select('id, interest_id, status, amount_cents, rental_days')
  .in('interest_id', interestIds);

const bookingMap = new Map(
  (bookingsData ?? []).map((b: { interest_id: string; id: string; status: string; amount_cents: number; rental_days: number }) =>
    [b.interest_id, b]
  )
);
```

- [ ] **Step 3: Add booking fields to `InterestedPreBride` interface in `app/interests/page.tsx`**

Update the interface:

```tsx
interface InterestedPreBride {
  interestId: string;
  preBrideId: string;
  firstName: string;
  email: string;
  createdAt: string;
  isAccepted: boolean;
  fitScore: number;
  styleScore: number;
  combinedScore: number;
  fitLabel: string;
  necklines: string[];
  silhouettes: string[];
  materials: string[];
  bookingId: string | null;
  bookingStatus: 'pending_payment' | 'booked' | 'completed' | 'refunded' | null;
  bookingAmountCents: number | null;
  bookingRentalDays: number | null;
}
```

- [ ] **Step 4: Populate booking fields when building `result` in `app/interests/page.tsx`**

In the `result.push({...})` call, add:

```tsx
bookingId: bookingMap.get(interest.id)?.id ?? null,
bookingStatus: bookingMap.get(interest.id)?.status ?? null,
bookingAmountCents: bookingMap.get(interest.id)?.amount_cents ?? null,
bookingRentalDays: bookingMap.get(interest.id)?.rental_days ?? null,
```

- [ ] **Step 5: Add `completingId` state + `handleMarkComplete` function to `app/interests/page.tsx`**

Add `completingId` state at the component level, alongside the existing `acceptingId` state:

```tsx
const [completingId, setCompletingId] = useState<string | null>(null);
```

Then after the `handleAccept` function, add:

```tsx
async function handleMarkComplete(bookingId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  setCompletingId(bookingId);
  const res = await fetch('/api/stripe/payout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ bookingId }),
  });
  if (res.ok) {
    setInterested((prev) =>
      prev.map((pb) => pb.bookingId === bookingId ? { ...pb, bookingStatus: 'completed' } : pb)
    );
  }
  setCompletingId(null);
}
```

- [ ] **Step 6: Update `InterestCard` in `app/interests/page.tsx` to show booking state**

Add `bookingId`, `bookingStatus`, `bookingAmountCents`, `bookingRentalDays`, `isCompleting`, `onMarkComplete` props to `InterestCard`:

```tsx
function InterestCard({
  preBride,
  isAccepting,
  isCompleting,
  onAccept,
  onMarkComplete,
}: {
  preBride: InterestedPreBride;
  isAccepting: boolean;
  isCompleting: boolean;
  onAccept: () => void;
  onMarkComplete: () => void;
}) {
```

Inside `InterestCard`, replace the `{/* Accept / accepted state */}` block with:

```tsx
<div className="mt-5 space-y-3">
  {preBride.bookingStatus === 'completed' ? (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-xs font-medium text-emerald-700">Rental complete ✓</p>
      <p className="mt-1 text-xs text-emerald-600">
        ${((preBride.bookingAmountCents ?? 0) * 0.8 / 100).toFixed(0)} has been transferred to your account.
      </p>
    </div>
  ) : preBride.bookingStatus === 'booked' ? (
    <>
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-xs font-medium text-blue-700">Booking confirmed — payment received ✓</p>
        <p className="mt-1 text-xs text-blue-600">
          {preBride.bookingRentalDays} day{(preBride.bookingRentalDays ?? 1) > 1 ? 's' : ''} ·
          ${((preBride.bookingAmountCents ?? 0) / 100).toFixed(0)} total ·
          You receive ${((preBride.bookingAmountCents ?? 0) * 0.8 / 100).toFixed(0)}
        </p>
      </div>
      <button
        type="button"
        disabled={isCompleting}
        onClick={onMarkComplete}
        className={`w-full rounded-full py-2.5 text-sm font-medium transition-colors ${
          isCompleting
            ? 'border border-[var(--color-border)] bg-[var(--color-blush)] text-[var(--color-muted)] cursor-wait'
            : 'border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer'
        }`}
      >
        {isCompleting ? 'Processing…' : 'Mark rental complete'}
      </button>
    </>
  ) : preBride.bookingStatus === 'pending_payment' ? (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-blush)] px-4 py-3">
      <p className="text-xs font-medium text-[var(--color-charcoal)]">Waiting for payment</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{firstName} has been notified and can complete the booking.</p>
    </div>
  ) : preBride.isAccepted ? (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-xs font-medium text-emerald-700">You accepted her interest ✓</p>
      {email && (
        <p className="mt-1 text-sm text-emerald-800">
          Reach out:{' '}
          <a href={`mailto:${email}`} className="font-medium underline hover:no-underline">{email}</a>
        </p>
      )}
    </div>
  ) : (
    <button
      type="button"
      disabled={isAccepting}
      onClick={onAccept}
      className={`w-full rounded-full py-2.5 text-sm font-medium transition-colors ${
        isAccepting
          ? 'border border-[var(--color-border)] bg-[var(--color-blush)] text-[var(--color-muted)] cursor-wait'
          : 'border border-[var(--color-rose)] bg-[var(--color-rose)] text-white hover:bg-[var(--color-rose-dark)] cursor-pointer'
      }`}
    >
      {isAccepting ? 'Accepting…' : `Accept ${firstName}'s interest`}
    </button>
  )}
</div>
```

- [ ] **Step 7: Update the `InterestCard` render call to pass new props**

Find where `<InterestCard>` is rendered (in the `interested.map(...)` block) and update:

```tsx
<InterestCard
  key={pb.interestId}
  preBride={pb}
  isAccepting={acceptingId === pb.interestId}
  isCompleting={completingId === pb.bookingId}
  onAccept={() => handleAccept(pb.interestId)}
  onMarkComplete={() => { if (pb.bookingId) handleMarkComplete(pb.bookingId); }}
/>
```

- [ ] **Step 8: Update `handleAccept` to also create a booking record in `app/interests/page.tsx`**

Replace the existing `handleAccept` function:

```tsx
async function handleAccept(interestId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  setAcceptingId(interestId);

  await supabase
    .from('interests')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', interestId);

  // Create a pending booking record so pre-bride can proceed to checkout
  const interest = interested.find((pb) => pb.interestId === interestId);
  if (interest) {
    await supabase.from('bookings').upsert({
      interest_id: interestId,
      listing_id: interest.preBrideId, // filled below
      pre_bride_id: interest.preBrideId,
      post_bride_id: session.user.id,
      rental_days: 1,
      amount_cents: 0,
      platform_fee_cents: 0,
      status: 'pending_payment',
    }, { onConflict: 'interest_id', ignoreDuplicates: true });
  }

  setInterested((prev) =>
    prev.map((pb) => pb.interestId === interestId
      ? { ...pb, isAccepted: true, bookingStatus: 'pending_payment' }
      : pb
    )
  );
  setAcceptingId(null);
}
```

**Note:** The booking amount/days will be 0 here — it gets updated to real values when the pre-bride creates the Stripe Checkout session in the checkout API. The DB record here just ensures the row exists so the checkout API can upsert it.

Actually, the checkout API already handles the upsert. So `handleAccept` should NOT insert a booking. Remove the booking insert from `handleAccept` — just update the interest's `accepted_at` and update local state:

```tsx
async function handleAccept(interestId: string) {
  setAcceptingId(interestId);
  await supabase
    .from('interests')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', interestId);
  setInterested((prev) =>
    prev.map((pb) => pb.interestId === interestId
      ? { ...pb, isAccepted: true }
      : pb
    )
  );
  setAcceptingId(null);
}
```

- [ ] **Step 9: Commit**

```bash
git add app/api/stripe/payout/route.ts app/interests/page.tsx
git commit -m "feat: post-bride marks rental complete + payout release to Stripe Express account"
```

---

## Task 7: Push, Configure Env Vars, and Smoke Test

- [ ] **Step 1: Add env vars to Vercel**

Go to Vercel → WhoGetsYou project → Settings → Environment Variables. Add:
- `STRIPE_SECRET_KEY` — from Stripe Dashboard → Developers → API keys (use live key for prod, test key for staging)
- `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret
- `NEXT_PUBLIC_APP_URL` — `https://whogetsyou.com`
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Settings → API → service_role key (keep secret — never expose to client)

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Smoke test the full flow**

Using Stripe test cards (`4242 4242 4242 4242`, any future expiry, any CVC):

1. Sign in as post-bride → Dashboard → "Connect Stripe →" → complete Stripe Express onboarding (use test mode)
2. Sign in as pre-bride → `/matches` → click listing → "Express interest"
3. Sign in as post-bride → `/interests` → accept the interest
4. Sign in as pre-bride → `/listings/[id]` → select duration → "Complete booking →" → pay with test card
5. Redirected to `/booking/{session_id}` → should show "Booking confirmed"
6. Sign in as post-bride → `/interests` → should show "Booking confirmed — payment received ✓"
7. Post-bride clicks "Mark rental complete" → should show "Rental complete ✓" + transfer amount
