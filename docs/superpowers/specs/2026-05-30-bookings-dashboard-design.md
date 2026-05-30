# Bookings Dashboard — WhoGetsYou

**Date:** 2026-05-30
**Status:** Approved

## Overview

Add a "Your bookings" section to the existing `/dashboard` page for both user roles. Pre-brides see the gowns they've booked and payment status. Post-brides see who has rented their gowns and can release payment once the gown has been returned.

The entire feature is a UI addition only — all backend APIs and the `bookings` table already exist.

---

## What Already Exists

- `bookings` table in Supabase with columns: `id`, `interest_id`, `listing_id`, `pre_bride_id`, `post_bride_id`, `rental_days`, `amount_cents`, `platform_fee_cents`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `stripe_transfer_id`, `status`, `paid_at`, `completed_at`
- `POST /api/stripe/payout` — transfers `amount_cents - platform_fee_cents` to the post-bride's connected Stripe account, sets `status = 'completed'`
- Booking flow UI on listing detail page (pre-bride selects days, clicks "Complete booking →")
- Stripe Connect onboarding on dashboard (post-bride)

---

## Data Fetching

Added to the existing `load()` function in `DashboardPage`:

**Pre-bride:** query `bookings` where `pre_bride_id = userId`, joined with `gown_listings` (`neckline`, `silhouette`) via `listing_id`.

**Post-bride:** query `bookings` where `post_bride_id = userId`, joined with `gown_listings` (`neckline`, `silhouette`) via `listing_id`.

Both queries order by `created_at` descending (newest first).

---

## UI

A new `Section` block at the bottom of the dashboard, matching the existing `Section` component exactly (rounded border, `text-xs uppercase tracking-widest` header, consistent padding).

### Booking row layout

Each booking is a single horizontal row:

| Column | Pre-bride | Post-bride |
|---|---|---|
| Gown label | `{silhouette} · {neckline}` — links to `/listings/{id}` | same |
| Status badge | colored pill | colored pill |
| Rental duration | `1 day` / `3 days` / `7 days` | same |
| Amount | Amount paid (`amount_cents / 100`) | Amount earned (`(amount_cents - platform_fee_cents) / 100`) |
| Action | — | "Release payment →" button (booked status only) |

### Status badge colors

| Status | Label | Color |
|---|---|---|
| `pending_payment` | Awaiting payment | Amber |
| `booked` | Confirmed | Emerald |
| `completed` | Completed | Stone/muted |

### Empty state

"No bookings yet." in `text-[var(--color-muted)]` when the bookings array is empty.

---

## Payout Action

When a post-bride clicks "Release payment →" on a `booked` row:

1. Button disables and shows "Releasing…"
2. `POST /api/stripe/payout` called with `{ bookingId }`
3. On success: row status flips to `completed` in local state (no refetch)
4. On error: button re-enables, inline error message shown below the row

No confirmation dialog needed — the API already guards against double-release (`status !== 'booked'` check in the route).

---

## Files Changed

```
app/dashboard/page.tsx   ← only file modified
```

No new files, no new API routes, no database schema changes.

---

## Out of Scope

- Email notifications on booking events
- Booking cancellations / refunds
- Pre-bride payout visibility beyond status
- Pagination (assume low booking volume at launch)
