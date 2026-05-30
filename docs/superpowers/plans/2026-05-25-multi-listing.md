# Multi-Listing Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow post-brides to list multiple gowns, replacing the one-listing-per-user constraint with an unlimited card grid on the dashboard.

**Architecture:** Drop the `UNIQUE` constraint on `gown_listings.user_id`, parameterise the edit route by listing ID, add a creation route at `/listings/new`, and update the dashboard to render a 2-column card grid with per-card availability toggling and a dashed "+Add gown" card.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript 5 · Tailwind CSS v4 · Supabase (auth, Postgres, Storage)

---

## File Map

| Action | Path |
|--------|------|
| Create | `supabase/multi-listing.sql` |
| Create | `app/edit/listing/[id]/page.tsx` |
| Delete | `app/edit/listing/page.tsx` |
| Create | `app/listings/new/page.tsx` |
| Modify | `app/dashboard/page.tsx` |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/multi-listing.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/multi-listing.sql

-- Allow multiple listings per user
ALTER TABLE public.gown_listings DROP CONSTRAINT gown_listings_user_id_key;

-- Allow post-brides to delete their own listings
CREATE POLICY "Post-brides can delete own listing"
  ON public.gown_listings FOR DELETE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Apply to live Supabase project**

Open the Supabase dashboard → SQL editor → paste and run the file contents. Verify in Table Editor that `gown_listings` no longer shows a unique index on `user_id`.

- [ ] **Step 3: Commit**

```bash
git add supabase/multi-listing.sql
git commit -m "db: drop unique constraint on gown_listings.user_id, add delete policy"
```

---

## Task 2: Parameterise the Edit Route

Replace `/edit/listing/page.tsx` (fetches by `user_id`) with `/edit/listing/[id]/page.tsx` (fetches by listing `id`).

**Files:**
- Create: `app/edit/listing/[id]/page.tsx`
- Delete: `app/edit/listing/page.tsx`

- [ ] **Step 1: Create `app/edit/listing/[id]/page.tsx`**

Copy the full contents of `app/edit/listing/page.tsx` verbatim, then apply the three changes below.

**Change 1 — component signature** (line 30, was `export default function EditListingPage()`):

```tsx
export default function EditListingPage({ params }: { params: { id: string } }) {
```

**Change 2 — fetch by listing id** (inside `useEffect → load()`, replace the block that fetches the listing):

```tsx
const { data } = await supabase
  .from('gown_listings')
  .select('*')
  .eq('id', params.id)
  .single();

if (!data || data.user_id !== session.user.id) {
  router.replace('/dashboard');
  return;
}
```

**Change 3 — update by listing id** (inside `handleSubmit`, replace `.eq('user_id', session.user.id)`):

```tsx
const { error } = await supabase.from('gown_listings').update({
  neckline: form.neckline,
  silhouette: form.silhouette,
  materials: form.materials,
  condition: form.condition,
  condition_notes: form.condition_notes,
  borough: form.borough,
  wedding_date: form.wedding_date,
  price_1day: form.price_1day ? parseFloat(form.price_1day) : null,
  price_3day: form.price_3day ? parseFloat(form.price_3day) : null,
  price_7day: form.price_7day ? parseFloat(form.price_7day) : null,
  retail_price: form.retail_price ? parseFloat(form.retail_price) : null,
}).eq('id', params.id);
```

- [ ] **Step 2: Delete the old route**

```bash
rm app/edit/listing/page.tsx
```

- [ ] **Step 3: Verify**

Run `npm run build`. Expected: clean build with no type errors. Navigate to `/edit/listing/[a-valid-listing-id]` and confirm the form loads and saves correctly. Navigating to `/edit/listing/[an-id-from-another-user]` should redirect to `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add app/edit/listing/
git commit -m "feat: parameterise edit listing route by listing id"
```

---

## Task 3: Create `/listings/new`

**Files:**
- Create: `app/listings/new/page.tsx`

- [ ] **Step 1: Create `app/listings/new/page.tsx`**

This is the same form as `/edit/listing/[id]` but INSERTs instead of UPDATEs. No pre-loading of existing data.

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  NECKLINE_OPTIONS,
  SILHOUETTE_OPTIONS,
  FABRIC_OPTIONS,
  CONDITION_OPTIONS,
  NYC_BOROUGHS,
} from '@/types/user';
import PhotoUploadStep from '@/components/signup/PhotoUploadStep';

interface FormState {
  neckline: string;
  silhouette: string;
  materials: string[];
  condition: string;
  condition_notes: string;
  borough: string;
  wedding_date: string;
  price_1day: string;
  price_3day: string;
  price_7day: string;
  retail_price: string;
}

export default function NewListingPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    neckline: '',
    silhouette: '',
    materials: [],
    condition: '',
    condition_notes: '',
    borough: '',
    wedding_date: '',
    price_1day: '',
    price_3day: '',
    price_7day: '',
    retail_price: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [newWornFiles, setNewWornFiles] = useState<File[]>([]);
  const [newDetailFiles, setNewDetailFiles] = useState<File[]>([]);
  const [newConditionFiles, setNewConditionFiles] = useState<File[]>([]);
  const [photoErrors, setPhotoErrors] = useState<{ worn?: string; detail?: string }>({});

  function toggleMaterial(m: string) {
    setForm((f) => ({
      ...f,
      materials: f.materials.includes(m)
        ? f.materials.filter((x) => x !== m)
        : [...f.materials, m],
    }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.neckline) e.neckline = 'Required';
    if (!form.silhouette) e.silhouette = 'Required';
    if (form.materials.length === 0) e.materials = 'Select at least one fabric';
    if (!form.condition) e.condition = 'Required';
    if (!form.borough) e.borough = 'Required';
    if (!form.wedding_date) e.wedding_date = 'Required';
    setErrors(e);

    const newPhotoErrors: { worn?: string; detail?: string } = {};
    if (newWornFiles.length < 1) newPhotoErrors.worn = 'At least one worn photo is required';
    if (newDetailFiles.length < 2) newPhotoErrors.detail = 'At least two dress photos are required';
    setPhotoErrors(newPhotoErrors);

    return Object.keys(e).length === 0 && Object.keys(newPhotoErrors).length === 0;
  }

  async function uploadPhotos(files: File[], category: 'worn' | 'detail' | 'condition', listingId: string) {
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${listingId}/${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('gown-photos').upload(path, file);
      if (!uploadError) {
        await supabase.from('gown_photos').insert({ listing_id: listingId, storage_path: path, category });
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: newListing, error } = await supabase
      .from('gown_listings')
      .insert({
        user_id: session.user.id,
        neckline: form.neckline,
        silhouette: form.silhouette,
        materials: form.materials,
        condition: form.condition,
        condition_notes: form.condition_notes,
        borough: form.borough,
        wedding_date: form.wedding_date,
        price_1day: form.price_1day ? parseFloat(form.price_1day) : null,
        price_3day: form.price_3day ? parseFloat(form.price_3day) : null,
        price_7day: form.price_7day ? parseFloat(form.price_7day) : null,
        retail_price: form.retail_price ? parseFloat(form.retail_price) : null,
      })
      .select('id')
      .single();

    if (!error && newListing) {
      await uploadPhotos(newWornFiles, 'worn', newListing.id);
      await uploadPhotos(newDetailFiles, 'detail', newListing.id);
      await uploadPhotos(newConditionFiles, 'condition', newListing.id);
      router.push('/dashboard');
    }

    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <Link href="/dashboard" className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">List another gown</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Neckline */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Neckline</p>
          <div className="flex flex-wrap gap-2">
            {NECKLINE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((f) => ({ ...f, neckline: n }))}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  form.neckline === n
                    ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                    : 'border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {errors.neckline && <p className="mt-1 text-xs text-red-500">{errors.neckline}</p>}
        </div>

        {/* Silhouette */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Silhouette</p>
          <div className="flex flex-wrap gap-2">
            {SILHOUETTE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, silhouette: s }))}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  form.silhouette === s
                    ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                    : 'border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.silhouette && <p className="mt-1 text-xs text-red-500">{errors.silhouette}</p>}
        </div>

        {/* Fabrics */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Fabric</p>
          <div className="flex flex-wrap gap-2">
            {FABRIC_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMaterial(m)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  form.materials.includes(m)
                    ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                    : 'border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {errors.materials && <p className="mt-1 text-xs text-red-500">{errors.materials}</p>}
        </div>

        {/* Condition */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Condition</p>
          <div className="flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, condition: c }))}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  form.condition === c
                    ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                    : 'border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {errors.condition && <p className="mt-1 text-xs text-red-500">{errors.condition}</p>}
        </div>

        {/* Condition notes */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-charcoal)]">
            Condition notes <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <textarea
            value={form.condition_notes}
            onChange={(e) => setForm((f) => ({ ...f, condition_notes: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-charcoal)]"
            placeholder="Any alterations, stains, repairs…"
          />
        </div>

        {/* Borough */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Borough</p>
          <div className="flex flex-wrap gap-2">
            {NYC_BOROUGHS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setForm((f) => ({ ...f, borough: b }))}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  form.borough === b
                    ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                    : 'border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)]'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          {errors.borough && <p className="mt-1 text-xs text-red-500">{errors.borough}</p>}
        </div>

        {/* Wedding date */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-charcoal)]">Wedding date</label>
          <input
            type="date"
            value={form.wedding_date}
            onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-1 focus:ring-[var(--color-charcoal)]"
          />
          {errors.wedding_date && <p className="mt-1 text-xs text-red-500">{errors.wedding_date}</p>}
        </div>

        {/* Pricing */}
        <div>
          <p className="mb-1 text-sm font-medium text-[var(--color-charcoal)]">Set Your Rental Price</p>
          <p className="mb-4 text-xs text-[var(--color-muted)] leading-relaxed">
            Dresses priced at 10–20% of retail tend to rent. At that range, a $2,000 dress lists at $200–$400 — competitive enough to attract serious pre-brides, while putting money back in your pocket.
          </p>
          <div className="space-y-3">
            {(['price_1day', 'price_3day', 'price_7day', 'retail_price'] as const).map((field) => (
              <div key={field} className="flex items-center gap-3">
                <span className="w-28 text-xs text-[var(--color-muted)]">
                  {field === 'price_1day' ? '1 day' : field === 'price_3day' ? '3 days' : field === 'price_7day' ? '7+ days' : 'Retail value'}
                </span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">$</span>
                  <input
                    type="number"
                    min="0"
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pl-7 pr-4 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-1 focus:ring-[var(--color-charcoal)]"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <p className="mb-4 text-sm font-medium text-[var(--color-charcoal)]">Photos</p>
          <PhotoUploadStep
            label="Worn photo"
            category="worn"
            existingPhotos={[]}
            newFiles={newWornFiles}
            onNewFiles={setNewWornFiles}
            onDeleteExisting={() => {}}
            error={photoErrors.worn}
          />
          <div className="mt-4">
            <PhotoUploadStep
              label="Dress photos"
              category="detail"
              existingPhotos={[]}
              newFiles={newDetailFiles}
              onNewFiles={setNewDetailFiles}
              onDeleteExisting={() => {}}
              error={photoErrors.detail}
            />
          </div>
          <div className="mt-4">
            <PhotoUploadStep
              label="Condition photos"
              category="condition"
              existingPhotos={[]}
              newFiles={newConditionFiles}
              onNewFiles={setNewConditionFiles}
              onDeleteExisting={() => {}}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--color-charcoal)] py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'List this gown'}
        </button>
      </form>
    </div>
  );
}
```

> **Note:** Check the exact prop names accepted by `PhotoUploadStep` in `components/signup/PhotoUploadStep.tsx` and adjust if they differ from what's used above.

- [ ] **Step 2: Verify `PhotoUploadStep` props**

Open `components/signup/PhotoUploadStep.tsx` and confirm the props interface matches what's used in Step 1. Fix any mismatches.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: clean build. Fix any type errors before proceeding.

- [ ] **Step 4: Manual verify**

Run `npm run dev`, sign in as a post-bride, navigate to `/listings/new`. Fill the form and submit. Confirm a new row appears in `gown_listings` in Supabase and redirects to `/dashboard`.

- [ ] **Step 5: Commit**

```bash
git add app/listings/new/page.tsx
git commit -m "feat: add /listings/new creation route for additional gown listings"
```

---

## Task 4: Update Dashboard — Card Grid

**Files:**
- Modify: `app/dashboard/page.tsx`

This is the largest change. Follow these steps precisely.

- [ ] **Step 1: Update state declarations**

Remove these four lines from the top of `DashboardPage`:

```tsx
const [listing, setListing] = useState<GownListing | null>(null);
const [photoUrls, setPhotoUrls] = useState<string[]>([]);
const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
const [hasWornPhoto, setHasWornPhoto] = useState(false);
```

Replace with:

```tsx
const [listings, setListings] = useState<GownListing[]>([]);
const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
```

- [ ] **Step 2: Remove the lightbox keyboard handler**

Delete the entire `useEffect` block that references `lightboxIndex`:

```tsx
// DELETE THIS ENTIRE BLOCK:
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') setLightboxIndex(null);
    if (e.key === 'ArrowRight') setLightboxIndex((i) => i !== null ? (i + 1) % photoUrls.length : null);
    if (e.key === 'ArrowLeft') setLightboxIndex((i) => i !== null ? (i - 1 + photoUrls.length) % photoUrls.length : null);
  }
  if (lightboxIndex !== null) window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [lightboxIndex, photoUrls.length]);
```

- [ ] **Step 3: Update the data fetch for post-brides**

Inside the `load()` function, replace this block:

```tsx
// REPLACE THIS:
const { data } = await supabase
  .from('gown_listings')
  .select('*')
  .eq('user_id', userId)
  .single();
setListing(data as GownListing | null);

// ...stripe fetch...

if (data?.id) {
  const { data: photosData } = await supabase
    .from('gown_photos')
    .select('storage_path, category')
    .eq('listing_id', data.id)
    .order('created_at');

  setHasWornPhoto(
    (photosData ?? []).some((p: { storage_path: string; category: string }) => p.category === 'worn')
  );

  const paths = (photosData ?? []).map((p: { storage_path: string; category: string }) => p.storage_path);
  if (paths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from('gown-photos')
      .createSignedUrls(paths, 3600);
    setPhotoUrls(
      (signedData ?? []).filter((e) => e.signedUrl).map((e) => e.signedUrl)
    );
  }
}
```

With:

```tsx
const { data: listingsData } = await supabase
  .from('gown_listings')
  .select('*')
  .eq('user_id', userId)
  .order('created_at');

const allListings = (listingsData ?? []) as GownListing[];
setListings(allListings);

// Fetch one thumbnail (first worn photo) per listing
const ids = allListings.map((l) => l.id);
if (ids.length > 0) {
  const { data: photosData } = await supabase
    .from('gown_photos')
    .select('listing_id, storage_path')
    .in('listing_id', ids)
    .eq('category', 'worn')
    .order('created_at');

  const firstPhotos = new Map<string, string>();
  for (const photo of (photosData ?? []) as { listing_id: string; storage_path: string }[]) {
    if (!firstPhotos.has(photo.listing_id)) {
      firstPhotos.set(photo.listing_id, photo.storage_path);
    }
  }

  if (firstPhotos.size > 0) {
    const { data: signedData } = await supabase.storage
      .from('gown-photos')
      .createSignedUrls([...firstPhotos.values()], 3600);

    const urlMap = new Map(
      (signedData ?? [])
        .filter((e) => e.signedUrl && e.path)
        .map((e) => [e.path!, e.signedUrl!])
    );

    const thumbMap = new Map<string, string>();
    for (const [listingId, path] of firstPhotos) {
      const url = urlMap.get(path);
      if (url) thumbMap.set(listingId, url);
    }
    setThumbnails(thumbMap);
  }
}
```

The stripe fetch block between the two sections above stays unchanged — leave it in place.

- [ ] **Step 4: Update `toggleAvailability`**

Replace the existing `toggleAvailability` function with a per-listing version:

```tsx
async function toggleAvailability(listingId: string) {
  const target = listings.find((l) => l.id === listingId);
  if (!target) return;
  const newStatus = !target.is_available;

  setListings((prev) =>
    prev.map((l) => l.id === listingId ? { ...l, is_available: newStatus } : l)
  );

  const { error } = await supabase
    .from('gown_listings')
    .update({ is_available: newStatus })
    .eq('id', listingId);

  if (error) {
    setListings((prev) =>
      prev.map((l) => l.id === listingId ? { ...l, is_available: !newStatus } : l)
    );
    alert('Failed to update availability. Please try again.');
  }
}
```

- [ ] **Step 5: Replace the listing section in JSX**

Find and delete the entire block:

```tsx
{/* Post-bride: gown listing */}
{profile.role === 'post-bride' && listing && (
  <Section title="Your gown listing" editHref="/edit/listing">
    {/* ... all contents ... */}
  </Section>
)}
```

Replace it with the card grid:

```tsx
{/* Post-bride: gown listings grid */}
{profile.role === 'post-bride' && (
  <div>
    <p className="mb-4 text-xs uppercase tracking-widest text-[var(--color-muted)]">Your gowns</p>
    <div className="grid grid-cols-2 gap-3">
      {listings.map((l) => (
        <div key={l.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-white">
          <Link href={`/edit/listing/${l.id}`} className="block">
            <div className="aspect-square bg-[var(--color-blush)]">
              {thumbnails.get(l.id) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnails.get(l.id)}
                  alt={`${l.silhouette} ${l.neckline} gown`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-xs text-[var(--color-muted)]">No photo</span>
                </div>
              )}
            </div>
            <div className="px-3 pt-3">
              <p className="text-sm font-medium text-[var(--color-charcoal)] truncate">
                {l.silhouette} · {l.neckline}
              </p>
              {l.price_1day != null && (
                <p className="text-xs text-[var(--color-muted)] mt-0.5">${l.price_1day}/day</p>
              )}
            </div>
          </Link>
          <div className="px-3 py-3 flex items-center justify-between">
            <span className={`text-xs font-medium ${l.is_available ? 'text-[var(--color-rose)]' : 'text-[var(--color-muted)]'}`}>
              {l.is_available ? 'Available' : 'Paused'}
            </span>
            <button
              onClick={() => toggleAvailability(l.id)}
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors underline"
            >
              {l.is_available ? 'Pause' : 'Unpause'}
            </button>
          </div>
        </div>
      ))}

      {/* Add gown card */}
      <Link
        href="/listings/new"
        className="rounded-xl border-2 border-dashed border-[var(--color-rose)] bg-[#fdf8f6] flex flex-col items-center justify-center gap-2 min-h-[180px] hover:bg-[var(--color-blush)] transition-colors"
      >
        <span className="text-2xl text-[var(--color-rose)]">+</span>
        <span className="text-xs font-medium text-[var(--color-rose)]">Add gown</span>
      </Link>
    </div>
  </div>
)}
```

- [ ] **Step 6: Update the Stripe prompt condition**

Find:

```tsx
{profile.role === 'post-bride' && listing && stripeStatus !== 'connected' && (
```

Replace with:

```tsx
{profile.role === 'post-bride' && listings.length > 0 && stripeStatus !== 'connected' && (
```

- [ ] **Step 7: Run build**

```bash
npm run build
```

Expected: clean build. Fix any remaining references to `listing`, `photoUrls`, `lightboxIndex`, or `hasWornPhoto` — they should all be gone.

- [ ] **Step 8: Manual verify**

Run `npm run dev`. Sign in as a post-bride. Confirm:
- All existing listings appear as cards
- Thumbnails load from the worn photo category
- Pause/Unpause toggles work per card without page refresh
- "+Add gown" card appears at the end and navigates to `/listings/new`
- Clicking a listing card navigates to `/edit/listing/[id]` with the correct data pre-loaded

- [ ] **Step 9: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: replace single listing section with multi-listing card grid"
```

---

## Task 5: Update `docs/state.md`

- [ ] **Step 1: Update the routes table and recent changes in `docs/state.md`**

In the Routes table, update the `/dashboard` and `/edit/listing` rows and add two new rows:

```markdown
| `/dashboard`         | ✅ | Post-bride: card grid of all listings + "+Add gown" card. Pre-bride: style preferences. |
| `/edit/listing/[id]` | ✅ | Edit a specific gown listing by ID |
| `/listings/new`      | ✅ | Create an additional gown listing |
```

Remove the old `/edit/listing` row.

Add to Recent Changes:

```markdown
| May 2026 | Multi-listing support. Dropped UNIQUE on gown_listings.user_id. Dashboard replaced with card grid. /edit/listing → /edit/listing/[id]. Added /listings/new. |
```

- [ ] **Step 2: Commit**

```bash
git add docs/state.md
git commit -m "docs: update state.md for multi-listing routes"
```
