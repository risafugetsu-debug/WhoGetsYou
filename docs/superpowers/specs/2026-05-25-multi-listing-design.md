# Multi-Listing Support
*Spec date: 2026-05-25*

## Overview

Allow post-brides to list multiple gowns (e.g. main gown, reception dress, dance dress) and boutiques to list their inventory. One flat platform rate for all users — no account tiers, no rate differentiation. Dashboard shows a photo-forward card grid of all listings.

---

## Database

**Migration:** Drop the `UNIQUE` constraint on `gown_listings.user_id`. Add a `DELETE` RLS policy for post-brides so they can remove their own listings.

```sql
-- Drop unique constraint (currently enforces one listing per user)
ALTER TABLE public.gown_listings DROP CONSTRAINT gown_listings_user_id_key;

-- Allow post-brides to delete their own listings
CREATE POLICY "Post-brides can delete own listing"
  ON public.gown_listings FOR DELETE
  USING (auth.uid() = user_id);
```

No other schema changes needed. Insert/update RLS policies already use `user_id = auth.uid()` with no uniqueness assumption.

---

## Routes

| Route | Change | Notes |
|-------|--------|-------|
| `/edit/listing` | Rename → `/edit/listing/[id]` | Add dynamic `[id]` segment; fetch by listing `id` not `user_id` |
| `/listings/new` | New | Same form as edit listing; inserts a new row on submit; redirects to `/dashboard` |
| `/dashboard` | Update | Fetch all listings for user (drop `.single()`); render card grid |

**Signup flow:** Post-brides still create their first listing during onboarding — untouched. The signup listing creation redirects to `/dashboard` after, which now shows the new card grid.

**Matches / interests / `/listings/[id]`:** No changes needed — these already operate per listing ID.

**Hardcoded edit link:** The dashboard currently has `editHref="/edit/listing"` — must be updated to `/edit/listing/${listing.id}` per card.

---

## Dashboard UI

### Listing section (post-bride only)

Replace the existing single-listing section with a 2-column card grid.

**Each card:**
- Photo thumbnail — first photo from `gown_photos` for this listing; grey placeholder if none uploaded
- `Silhouette · Neckline` (e.g. "A-line · Sweetheart")
- `price_1day` value (e.g. "$350/day"); omitted if not set
- Available / Paused badge
- Availability toggle button — pause/unpause without leaving the dashboard
- Clicking the card body → `/edit/listing/[id]`

**"+Add gown" card:**
- Dashed border, rose accent
- Sits at the end of the grid
- Clicking → `/listings/new`

### Empty state

If a post-bride has no listings (edge case — signup creates one, but handle gracefully): show only the "+Add gown" card with a short prompt ("List your first gown to start getting matches").

---

## `/listings/new` — Creation Route

Identical form fields to `/edit/listing/[id]`. On submit:
- INSERT a new row into `gown_listings` with `user_id = session.user.id`
- Handle photo uploads the same way as the edit flow
- On success: redirect to `/dashboard`
- On error: show inline validation (same pattern as edit page)

No draft state — the listing is created on submit only.

---

## `/edit/listing/[id]` — Updated Edit Route

- Receives listing `id` from the URL param
- Fetches by `id` (not `user_id`) — verifies ownership via RLS (update policy checks `auth.uid() = user_id`)
- If listing not found or belongs to another user: redirect to `/dashboard`
- All other behaviour unchanged from current `/edit/listing`

---

## What Doesn't Change

- Matching algorithm — already scores per listing ID
- Sign-up listing creation flow
- Pre-bride dashboard, matches, interests, `/listings/[id]` detail page
- Pricing guidance copy (strategy.md)
- RLS insert/update policies
