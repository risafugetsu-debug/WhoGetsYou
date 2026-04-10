# Enhanced Listing Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure gown photo upload into three semantic categories (worn, detail, condition), add optional video, and rebuild the listing detail page so the post-bride's worn wedding photo is the hero.

**Architecture:** Add a `category` column to `gown_photos` and a new `gown_videos` table. `PhotoUploadStep.tsx` becomes a reusable single-category uploader; `/edit/listing` renders it three times. `/listings/[id]` fetches photos by category and displays them in a layered layout: worn hero → detail gallery → condition strip → details → fit score → CTA.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, Supabase (postgres + storage)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/photos-category.sql` | Create | Migration: add `category` to `gown_photos`, create `gown_videos` table |
| `components/signup/PhotoUploadStep.tsx` | Modify | Single-category photo uploader — handles existing + new files, optional video |
| `app/edit/listing/page.tsx` | Modify | Three-section upload (worn/detail/condition) + video, category-aware save |
| `app/listings/[id]/page.tsx` | Modify | Category-aware photo fetch, worn hero, detail gallery, condition strip, video |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/photos-category.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
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
```

Save this to `supabase/photos-category.sql`.

- [ ] **Step 2: Run the migration in Supabase**

Go to Supabase dashboard → SQL Editor → paste the contents of `supabase/photos-category.sql` → Run.

Verify by running:
```sql
select column_name, data_type, column_default
from information_schema.columns
where table_name = 'gown_photos' and column_name = 'category';
```
Expected: one row with `column_name = 'category'`, `data_type = 'text'`, `column_default = '''detail'''`

Also verify:
```sql
select table_name from information_schema.tables where table_name = 'gown_videos';
```
Expected: one row.

- [ ] **Step 3: Commit**

```bash
git add supabase/photos-category.sql
git commit -m "feat: add category to gown_photos, create gown_videos table"
```

---

## Task 2: Restructure PhotoUploadStep Component

**Files:**
- Modify: `components/signup/PhotoUploadStep.tsx`

This component is currently an orphan (not imported anywhere). Replace it entirely with a generic single-category section uploader. It will be rendered three times in `/edit/listing` — once per category.

- [ ] **Step 1: Replace PhotoUploadStep.tsx with the new implementation**

```tsx
'use client';

import { useRef } from 'react';

export interface ExistingPhoto {
  id: string;
  signedUrl: string;
}

interface PhotoUploadStepProps {
  title: string;
  description: string;
  hint?: string;          // e.g. "Try: front, back, side, flat lay"
  optional?: boolean;
  minPhotos?: number;     // defaults to 0 if optional, 1 otherwise
  maxPhotos?: number;     // defaults to 10
  existingPhotos?: ExistingPhoto[];
  onRemoveExisting?: (id: string) => void;
  newPhotos: File[];
  onNewPhotosChange: (photos: File[]) => void;
  error?: string;
}

export default function PhotoUploadStep({
  title,
  description,
  hint,
  optional = false,
  minPhotos,
  maxPhotos = 10,
  existingPhotos = [],
  onRemoveExisting,
  newPhotos,
  onNewPhotosChange,
  error,
}: PhotoUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const effectiveMin = minPhotos ?? (optional ? 0 : 1);
  const totalCount = existingPhotos.length + newPhotos.length;
  const canAddMore = totalCount < maxPhotos;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = maxPhotos - totalCount;
    onNewPhotosChange([...newPhotos, ...images.slice(0, remaining)]);
  }

  function removeNew(index: number) {
    onNewPhotosChange(newPhotos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-medium text-[var(--color-charcoal)]">{title}</h3>
          {optional && (
            <span className="text-xs text-[var(--color-muted)]">optional</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">{description}</p>
        {hint && (
          <p className="mt-1 text-xs text-[var(--color-muted)] italic">{hint}</p>
        )}
        {!optional && effectiveMin > 0 && (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            At least {effectiveMin} photo required
          </p>
        )}
      </div>

      {/* Photo grid */}
      {(existingPhotos.length > 0 || newPhotos.length > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {existingPhotos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--color-blush)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.signedUrl} alt="Gown photo" className="h-full w-full object-cover" />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(photo.id)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {newPhotos.map((file, i) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={`new-${i}`} className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--color-blush)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`New photo ${i + 1}`} className="h-full w-full object-cover" />
                <div className="absolute left-1.5 top-1.5 rounded-full bg-[var(--color-rose)] px-1.5 py-0.5 text-[10px] text-white">New</div>
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      {canAddMore && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-4 text-sm text-[var(--color-muted)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]"
          >
            + Add {totalCount > 0 ? 'more ' : ''}photos
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/signup/PhotoUploadStep.tsx
git commit -m "refactor: restructure PhotoUploadStep as generic single-category uploader"
```

---

## Task 3: Update /edit/listing — Three-Section Upload + Video

**Files:**
- Modify: `app/edit/listing/page.tsx`

Replace the flat photo section with three `PhotoUploadStep` instances (worn / detail / condition) and add a video upload field. Update the save logic to write `category` on each photo row and handle the video.

- [ ] **Step 1: Update imports and state at the top of EditListingPage**

Replace the existing `ExistingPhoto` interface and state declarations with:

```tsx
import PhotoUploadStep, { ExistingPhoto } from '@/components/signup/PhotoUploadStep';
```

Remove the old `ExistingPhoto` interface from the file (it was defined inline — now comes from the component).

Replace the photo/video state block (after `const [showTooltip, setShowTooltip] = useState(false);`) with:

```tsx
  // Categorised existing photos loaded from DB
  const [existingWorn, setExistingWorn] = useState<ExistingPhoto[]>([]);
  const [existingDetail, setExistingDetail] = useState<ExistingPhoto[]>([]);
  const [existingCondition, setExistingCondition] = useState<ExistingPhoto[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<Set<string>>(new Set());

  // New files selected by user, not yet uploaded
  const [newWornFiles, setNewWornFiles] = useState<File[]>([]);
  const [newDetailFiles, setNewDetailFiles] = useState<File[]>([]);
  const [newConditionFiles, setNewConditionFiles] = useState<File[]>([]);

  // Video
  const [existingVideoPath, setExistingVideoPath] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [deleteVideo, setDeleteVideo] = useState(false);

  // Photo errors per section
  const [photoErrors, setPhotoErrors] = useState<{ worn?: string; detail?: string }>({});
```

- [ ] **Step 2: Update the load() function to fetch photos by category and video**

Replace the photo loading block inside `load()` (after `setListingId(data.id)` / `setForm(...)`) with:

```tsx
        const { data: photosData } = await supabase
          .from('gown_photos')
          .select('id, storage_path, category')
          .eq('listing_id', data.id)
          .order('created_at');

        const photos = (photosData ?? []) as { id: string; storage_path: string; category: string }[];

        if (photos.length > 0) {
          const { data: signedData } = await supabase.storage
            .from('gown-photos')
            .createSignedUrls(photos.map((p) => p.storage_path), 3600);

          const urlMap = new Map(
            (signedData ?? [])
              .filter((e) => e.signedUrl && e.path)
              .map((e) => [e.path, e.signedUrl])
          );

          const toExisting = (p: { id: string; storage_path: string }) => ({
            id: p.id,
            signedUrl: urlMap.get(p.storage_path) ?? '',
          });

          setExistingWorn(photos.filter((p) => p.category === 'worn').map(toExisting));
          setExistingDetail(photos.filter((p) => p.category === 'detail').map(toExisting));
          setExistingCondition(photos.filter((p) => p.category === 'condition').map(toExisting));
        }

        // Load video if exists
        const { data: videoData } = await supabase
          .from('gown_videos')
          .select('storage_path')
          .eq('listing_id', data.id)
          .maybeSingle();

        if (videoData?.storage_path) {
          setExistingVideoPath(videoData.storage_path);
          const { data: signedVideo } = await supabase.storage
            .from('gown-videos')
            .createSignedUrl(videoData.storage_path, 3600);
          if (signedVideo?.signedUrl) setExistingVideoUrl(signedVideo.signedUrl);
        }
```

- [ ] **Step 3: Update validate() to check worn and detail minimums**

Replace the photo validation inside `validate()`:

```tsx
    // Photo validation
    const newPhotoErrors: { worn?: string; detail?: string } = {};
    const wornCount = existingWorn.filter((p) => !deletedPhotoIds.has(p.id)).length + newWornFiles.length;
    const detailCount = existingDetail.filter((p) => !deletedPhotoIds.has(p.id)).length + newDetailFiles.length;
    if (wornCount < 1) newPhotoErrors.worn = 'At least one worn photo is required';
    if (detailCount < 2) newPhotoErrors.detail = 'At least two dress photos are required';
    setPhotoErrors(newPhotoErrors);

    return Object.keys(e).length === 0 && Object.keys(newPhotoErrors).length === 0;
```

Also remove the old `const [photoError, setPhotoError] = useState('');` line from state and remove the old `totalPhotos` check.

- [ ] **Step 4: Update handleSubmit() to upload photos with category and handle video**

Replace the photo/video handling block inside `handleSubmit()` (after the listing update succeeds):

```tsx
    if (!error && listingId) {
      // Delete removed photos from storage and DB
      if (deletedPhotoIds.size > 0) {
        // Re-fetch storage paths for the deleted IDs (ExistingPhoto only stores signedUrl, not path)
        const { data: deletedRows } = await supabase
          .from('gown_photos')
          .select('id, storage_path')
          .in('id', [...deletedPhotoIds]);
        if (deletedRows && deletedRows.length > 0) {
          await supabase.storage.from('gown-photos').remove(deletedRows.map((r: { storage_path: string }) => r.storage_path));
        }
        await supabase.from('gown_photos').delete().in('id', [...deletedPhotoIds]);
      }

      // Upload new photos with their category
      async function uploadPhotos(files: File[], category: 'worn' | 'detail' | 'condition') {
        for (const file of files) {
          const ext = file.name.split('.').pop() ?? 'jpg';
          const path = `${listingId}/${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('gown-photos').upload(path, file);
          if (!uploadError) {
            await supabase.from('gown_photos').insert({ listing_id: listingId, storage_path: path, category });
          }
        }
      }

      await uploadPhotos(newWornFiles, 'worn');
      await uploadPhotos(newDetailFiles, 'detail');
      await uploadPhotos(newConditionFiles, 'condition');

      // Handle video
      if (deleteVideo && existingVideoPath) {
        await supabase.storage.from('gown-videos').remove([existingVideoPath]);
        await supabase.from('gown_videos').delete().eq('listing_id', listingId);
        setExistingVideoPath(null);
        setExistingVideoUrl(null);
        setDeleteVideo(false);
      }

      if (newVideoFile) {
        const ext = newVideoFile.name.split('.').pop() ?? 'mp4';
        const path = `${listingId}/${Date.now()}.${ext}`;
        const { error: videoUploadError } = await supabase.storage.from('gown-videos').upload(path, newVideoFile);
        if (!videoUploadError) {
          await supabase.from('gown_videos').upsert({ listing_id: listingId, storage_path: path });
        }
      }
    }
```

- [ ] **Step 5: Replace the photos section in the JSX**

Find the `{/* Photos */}` comment block in the JSX (around line 496–550) and replace the entire div with:

```tsx
        {/* Photos */}
        <div className="space-y-8">
          <h2 className="text-base font-medium text-[var(--color-charcoal)]">Photos</h2>

          <PhotoUploadStep
            title="On the Day"
            description="A photo of you wearing the dress — from your wedding day, bridal shoot, or fitting."
            minPhotos={1}
            existingPhotos={existingWorn.filter((p) => !deletedPhotoIds.has(p.id))}
            onRemoveExisting={(id) => setDeletedPhotoIds((prev) => new Set([...prev, id]))}
            newPhotos={newWornFiles}
            onNewPhotosChange={setNewWornFiles}
            error={photoErrors.worn}
          />

          <PhotoUploadStep
            title="The Dress"
            description="Show the dress in detail."
            hint="Try: front, back, side, flat lay, close-up of detail"
            minPhotos={2}
            existingPhotos={existingDetail.filter((p) => !deletedPhotoIds.has(p.id))}
            onRemoveExisting={(id) => setDeletedPhotoIds((prev) => new Set([...prev, id]))}
            newPhotos={newDetailFiles}
            onNewPhotosChange={setNewDetailFiles}
            error={photoErrors.detail}
          />

          <PhotoUploadStep
            title="Condition"
            description="Photos of any wear, alterations, or damage."
            optional
            existingPhotos={existingCondition.filter((p) => !deletedPhotoIds.has(p.id))}
            onRemoveExisting={(id) => setDeletedPhotoIds((prev) => new Set([...prev, id]))}
            newPhotos={newConditionFiles}
            onNewPhotosChange={setNewConditionFiles}
          />

          {/* Video */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-medium text-[var(--color-charcoal)]">Video <span className="text-xs text-[var(--color-muted)] font-normal">optional</span></h3>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">A short clip (up to 30 seconds) of the dress.</p>
            </div>

            {existingVideoUrl && !deleteVideo ? (
              <div className="relative overflow-hidden rounded-xl bg-black aspect-video max-w-xs">
                <video src={existingVideoUrl} controls className="h-full w-full object-contain" />
                <button
                  type="button"
                  onClick={() => setDeleteVideo(true)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                >
                  ×
                </button>
              </div>
            ) : newVideoFile ? (
              <div className="relative overflow-hidden rounded-xl bg-black aspect-video max-w-xs">
                <video src={URL.createObjectURL(newVideoFile)} controls className="h-full w-full object-contain" />
                <button
                  type="button"
                  onClick={() => setNewVideoFile(null)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-4 text-sm text-[var(--color-muted)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]">
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNewVideoFile(file);
                    e.target.value = '';
                  }}
                />
                + Add video
              </label>
            )}
          </div>
        </div>
```

- [ ] **Step 6: Commit**

```bash
git add app/edit/listing/page.tsx
git commit -m "feat: categorised photo upload and optional video in edit listing"
```

---

## Task 4: Update Listing Detail Page — Worn Hero + Galleries + Video

**Files:**
- Modify: `app/listings/[id]/page.tsx`

Fetch photos by category, fetch video, rebuild the layout: worn hero (with video overlay) → detail gallery → condition strip → details → fit score → CTA.

- [ ] **Step 1: Update the data types and load function**

Replace the `PageData` interface with:

```tsx
interface PageData {
  listing: RawListing;
  postBrideFirstName: string;
  wornUrls: string[];
  detailUrls: string[];
  conditionUrls: string[];
  videoUrl: string | null;
  viewerRole: 'pre-bride' | 'post-bride';
  isOwnListing: boolean;
  fitScore: number;
  styleScore: number;
  combinedScore: number;
  fitLabel: string;
  postBrideMeasurements: MeasurementRow | null;
}
```

Replace the photo fetch inside `load()`:

```tsx
      const [postBrideProfileRes, photosRes, postMeasurementsRes, videoRes] = await Promise.all([
        supabase.from('profiles').select('first_name').eq('id', listing.user_id).single(),
        supabase.from('gown_photos').select('storage_path, category').eq('listing_id', id).order('created_at'),
        supabase.from('measurements').select('*').eq('user_id', listing.user_id).single(),
        supabase.from('gown_videos').select('storage_path').eq('listing_id', id).maybeSingle(),
      ]);

      const photos = (photosRes.data ?? []) as { storage_path: string; category: string }[];
      const wornPaths = photos.filter((p) => p.category === 'worn').map((p) => p.storage_path);
      const detailPaths = photos.filter((p) => p.category === 'detail').map((p) => p.storage_path);
      const conditionPaths = photos.filter((p) => p.category === 'condition').map((p) => p.storage_path);
      const allPaths = photos.map((p) => p.storage_path);

      let wornUrls: string[] = [];
      let detailUrls: string[] = [];
      let conditionUrls: string[] = [];

      if (allPaths.length > 0) {
        const { data: signedData } = await supabase.storage
          .from('gown-photos')
          .createSignedUrls(allPaths, 3600);
        const urlMap = new Map(
          (signedData ?? []).filter((e) => e.signedUrl && e.path).map((e) => [e.path, e.signedUrl])
        );
        wornUrls = wornPaths.map((p) => urlMap.get(p) ?? '').filter(Boolean);
        detailUrls = detailPaths.map((p) => urlMap.get(p) ?? '').filter(Boolean);
        conditionUrls = conditionPaths.map((p) => urlMap.get(p) ?? '').filter(Boolean);
      }

      let videoUrl: string | null = null;
      if (videoRes.data?.storage_path) {
        const { data: signedVideo } = await supabase.storage
          .from('gown-videos')
          .createSignedUrl(videoRes.data.storage_path, 3600);
        videoUrl = signedVideo?.signedUrl ?? null;
      }
```

Update the `setData` call to use the new fields:

```tsx
      setData({
        listing,
        postBrideFirstName: postBrideProfileRes.data?.first_name ?? 'A bride',
        wornUrls,
        detailUrls,
        conditionUrls,
        videoUrl,
        viewerRole,
        isOwnListing,
        fitScore,
        styleScore,
        combinedScore,
        fitLabel,
        postBrideMeasurements,
      });
```

Remove the old `photoUrls` state and `selectedPhotoIndex` state — they are replaced.

Add `selectedWornIndex` state:
```tsx
  const [selectedWornIndex, setSelectedWornIndex] = useState(0);
```

- [ ] **Step 2: Add video state**

```tsx
  const [videoOpen, setVideoOpen] = useState(false);
```

- [ ] **Step 3: Replace the photo gallery JSX with the new layout**

Replace the entire `{/* Photo gallery */}` div (the left column of the grid) with:

```tsx
        {/* Media column */}
        <div className="space-y-4">

          {/* Hero: worn photo(s) with optional video overlay */}
          <div className="relative">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-[var(--color-blush)]">
              {wornUrls.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={wornUrls[selectedWornIndex]}
                  alt={`${listing.neckline} ${listing.silhouette} gown worn`}
                  className="h-full w-full object-cover"
                />
              ) : detailUrls.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detailUrls[0]}
                  alt={`${listing.neckline} ${listing.silhouette} gown`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl opacity-30">👗</span>
                </div>
              )}
            </div>

            {/* No worn photo badge */}
            {wornUrls.length === 0 && (
              <div className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                No worn photo yet
              </div>
            )}

            {/* Video play button */}
            {videoUrl && !videoOpen && (
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
              >
                ▶ Watch video
              </button>
            )}
          </div>

          {/* Video modal */}
          {videoOpen && videoUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setVideoOpen(false)}>
              <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <video src={videoUrl} controls autoPlay className="w-full rounded-xl" />
                <button
                  type="button"
                  onClick={() => setVideoOpen(false)}
                  className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-[var(--color-charcoal)] shadow"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Worn photo thumbnail strip (if multiple) */}
          {wornUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {wornUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedWornIndex(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg transition-all ${
                    i === selectedWornIndex
                      ? 'ring-2 ring-[var(--color-rose)] ring-offset-1'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Worn photo ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Detail photos — horizontal scroll */}
          {detailUrls.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">The dress</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {detailUrls.map((url, i) => (
                  <div key={i} className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-[var(--color-blush)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Dress detail ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Condition photos strip */}
          {conditionUrls.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">Condition photos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {conditionUrls.map((url, i) => (
                  <div key={i} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--color-blush)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Condition photo ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
```

- [ ] **Step 4: Update the destructure at the top of the return statement**

Replace:
```tsx
  const { listing, postBrideFirstName, photoUrls, viewerRole, isOwnListing, fitScore, styleScore, combinedScore, fitLabel, postBrideMeasurements } = data;
```
With:
```tsx
  const { listing, postBrideFirstName, wornUrls, detailUrls, conditionUrls, videoUrl, viewerRole, isOwnListing, fitScore, styleScore, combinedScore, fitLabel, postBrideMeasurements } = data;
```

- [ ] **Step 5: Commit**

```bash
git add app/listings/[id]/page.tsx
git commit -m "feat: category-aware photo layout with worn hero, detail gallery, video on listing detail"
```

---

## Task 5: Dashboard Prompt for Missing Worn Photo

**Files:**
- Modify: `app/dashboard/page.tsx`

Show a soft nudge to post-brides who have a listing but no worn photo yet.

- [ ] **Step 1: Add worn photo check in the dashboard load() function**

In `app/dashboard/page.tsx`, inside the post-bride data load branch, after fetching `gown_photos`, add a check:

```tsx
const hasWornPhoto = (photosData ?? []).some(
  (p: { storage_path: string; category?: string }) => p.category === 'worn'
);
setPostBrideData((prev) => prev ? { ...prev, hasWornPhoto } : null);
```

This requires adding `category` to the photos select:
```tsx
const { data: photosData } = await supabase
  .from('gown_photos')
  .select('storage_path, category')
  .eq('listing_id', listingId);
```

And adding `hasWornPhoto: boolean` to the post-bride data state shape.

- [ ] **Step 2: Render the nudge in the dashboard JSX**

Inside the post-bride dashboard view, after the listing summary card, add:

```tsx
{!postBrideData.hasWornPhoto && (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-blush)] px-4 py-4">
    <p className="text-sm font-medium text-[var(--color-charcoal)]">Add a wedding day photo</p>
    <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">
      Listings with a worn photo get more interest. Share one from your wedding day or bridal shoot.
    </p>
    <Link
      href="/edit/listing"
      className="mt-3 inline-block rounded-full border border-[var(--color-rose)] px-4 py-1.5 text-xs text-[var(--color-rose)] transition-colors hover:bg-[var(--color-rose)] hover:text-white"
    >
      Add photo →
    </Link>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: nudge post-brides without a worn photo to add one from dashboard"
```

---

## Task 6: Push and Verify

- [ ] **Step 1: Push to GitHub**

```bash
git push
```

Vercel will auto-deploy. Watch the build at vercel.com/dashboard — expect ~1–2 minutes.

- [ ] **Step 2: Verify in Supabase**

Run this in Supabase SQL Editor to confirm migration applied:
```sql
select id, storage_path, category from gown_photos limit 10;
```
All existing rows should have `category = 'detail'`.

- [ ] **Step 3: Smoke test edit listing**

Sign in as a post-bride at whogetsyou.com → Dashboard → Edit listing. Confirm:
- Three photo sections appear: "On the Day", "The Dress", "Condition"
- "On the Day" and "The Dress" show "required" / minimum hints
- "Condition" shows "optional"
- Video upload field appears
- Save without a worn photo shows the error "At least one worn photo is required"
- Save with photos succeeds and dashboard shows updated listing

- [ ] **Step 4: Smoke test listing detail**

Navigate to `/listings/{any-id}` as a pre-bride. Confirm:
- Worn photo shows as hero (or detail fallback with "No worn photo yet" badge)
- Detail photos appear in horizontal scroll
- Condition photos appear below details
- If a video exists, "▶ Watch video" button overlays the hero
