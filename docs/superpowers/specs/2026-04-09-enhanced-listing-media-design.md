# Enhanced Listing Media — Design Spec
*Created: Apr 9 2026*

## Problem

Pre-brides hesitate to commit to a listing because of two gaps:
- **Aesthetics** — they can't tell what the dress really looks like on a body
- **Trust** — they can't verify the dress is in good condition or that the post-bride is legitimate

The current `gown_photos` table has no structure — any photo goes in as a flat list. Photos are not categorised and the listing detail page (`/listings/[id]`) is incomplete.

## Solution

Restructure photo upload into three semantic categories, and build the listing detail page around the **worn photo as the hero** — the post-bride's wedding day photo of herself in the dress. This is WhoGetsYou's unique advantage over generic rental platforms: every post-bride already has professional or high-quality photos of the dress being worn.

Fit uncertainty is handled separately by the measurement matching algorithm — this feature targets aesthetics and trust only.

---

## Data Model

### `gown_photos` — add `category` column

```sql
alter table public.gown_photos
  add column category text not null default 'detail'
  check (category in ('worn', 'detail', 'condition'));
```

Categories:
- `worn` — dress being worn (wedding day, bridal shoot, fitting). Required: min 1.
- `detail` — dress angles (front, back, side, flat lay, close-up). Required: min 2.
- `condition` — any wear, damage, or alterations. Optional.

### `gown_videos` — new table

```sql
create table public.gown_videos (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.gown_listings(id) on delete cascade not null unique,
  storage_path  text not null,
  created_at    timestamptz default now()
);

-- RLS
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
```

### Storage structure

```
gown-photos/{listing_id}/{category}/{filename}
gown-videos/{listing_id}/{filename}
```

One video per listing (enforced by `unique` on `listing_id`).

---

## Upload Flow — Post-Bride (`PhotoUploadStep.tsx` + `/edit/listing`)

The upload step is restructured into three sequential sections:

### Section 1 — "On the Day" (required)
- Upload 1–3 worn photos
- Prompt: *"Share a photo of you in your dress — from your wedding day, bridal shoot, or fitting."*
- Optional: add a short video clip (mp4, max 30s / ~50MB)
- Cannot advance without at least 1 worn photo

### Section 2 — "The Dress" (required)
- Upload 2–6 detail photos
- Prompt suggests angles: front, back, side, close-up of detail
- Guidance only — no rigid per-angle enforcement
- Cannot advance without at least 2 photos

### Section 3 — "Condition" (optional)
- Upload 0–4 condition photos
- Pre-populated prompt references whatever condition rating was already entered
- Skippable — shown as "optional" clearly

The same three-section structure applies in `/edit/listing` for post-brides updating their listing after signup.

---

## Listing Detail Page — Pre-Bride View (`/listings/[id]`)

Layout top-to-bottom:

1. **Hero** — worn photo(s) displayed large. If a video exists, a play button overlays the first worn photo. Clicking any opens a lightbox/modal.
2. **"The Dress" gallery** — horizontal scroll of detail photos below the hero. Tap to expand into lightbox.
3. **Condition strip** — small thumbnails of condition photos (if any) + condition rating badge + condition notes.
4. **Dress details** — neckline, silhouette, materials, size derived from measurements, price tiers, borough.
5. **Fit score** — measurement match percentage with breakdown (already calculated in `lib/matching.ts`).
6. **Action** — "Express Interest" button.

The worn photo leads because a real bride wearing the dress on her wedding day is more emotionally compelling and trust-building than a flat dress photo.

---

## Edge Cases

### Existing listings (no category on photos)
- Migration: all existing `gown_photos` rows default to `detail` via the `default 'detail'` on the new column.
- No backfill needed — the default handles it automatically.
- Post-brides are shown a soft dashboard prompt: *"Add a wedding day photo to get more interest."* Not forced.

### Listing with no worn photo
- Listing still shows and is browsable.
- Hero falls back to the first `detail` photo.
- Small badge shown: *"No worn photo yet"* — signals the gap to pre-brides without blocking the post-bride from going live.

### Video upload failure
- Video is never blocking — if upload fails, the listing saves without it.
- An inline error message is shown; the post-bride can retry later from `/edit/listing`.

---

## What This Does Not Cover
- Physical try-on scheduling or fee handling (separate feature)
- 3D model generation (not pursued — quality insufficient for fashion context)
- Pre-bride profile photos (existing separate field in `style_preferences`)
