'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  NECKLINE_OPTIONS,
  SILHOUETTE_OPTIONS,
  FABRIC_OPTIONS,
  CONDITION_OPTIONS,
  NYC_BOROUGHS,
} from '@/types/user';
import PhotoUploadStep, { ExistingPhoto } from '@/components/signup/PhotoUploadStep';

interface FormState {
  neckline: string;
  silhouette: string;
  materials: string[];
  condition: string;
  condition_notes: string;
  borough: string;
  wedding_date: string;
  price_3day: string;
  price_7day: string;
  price_14day: string;
  retail_price: string;
}

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormState>({
    neckline: '',
    silhouette: '',
    materials: [],
    condition: '',
    condition_notes: '',
    borough: '',
    wedding_date: '',
    price_3day: '',
    price_7day: '',
    price_14day: '',
    retail_price: '',
  });
  const [listingId, setListingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showPricingTips, setShowPricingTips] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [existingWorn, setExistingWorn] = useState<ExistingPhoto[]>([]);
  const [existingDetail, setExistingDetail] = useState<ExistingPhoto[]>([]);
  const [existingCondition, setExistingCondition] = useState<ExistingPhoto[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<Set<string>>(new Set());
  const [newWornFiles, setNewWornFiles] = useState<File[]>([]);
  const [newDetailFiles, setNewDetailFiles] = useState<File[]>([]);
  const [newConditionFiles, setNewConditionFiles] = useState<File[]>([]);
  const [existingVideoPath, setExistingVideoPath] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [deleteVideo, setDeleteVideo] = useState(false);
  const [photoErrors, setPhotoErrors] = useState<{ worn?: string; detail?: string }>({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'post-bride') { router.replace('/dashboard'); return; }

      const { data } = await supabase
        .from('gown_listings')
        .select('*')
        .eq('id', id)
        .single();

      if (!data || data.user_id !== session.user.id) {
        router.replace('/dashboard');
        return;
      }

      if (data) {
        setListingId(data.id);
        setForm({
          neckline: data.neckline,
          silhouette: data.silhouette,
          materials: data.materials,
          condition: data.condition,
          condition_notes: data.condition_notes ?? '',
          borough: data.borough,
          wedding_date: data.wedding_date,
          price_3day: data.price_3day != null ? String(data.price_3day) : '',
          price_7day: data.price_7day != null ? String(data.price_7day) : '',
          price_14day: data.price_14day != null ? String(data.price_14day) : '',
          retail_price: data.retail_price != null ? String(data.retail_price) : '',
        });

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
      }

      setLoading(false);
    }
    load();
  }, [router, id]);

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
    const wornCount = existingWorn.filter((p) => !deletedPhotoIds.has(p.id)).length + newWornFiles.length;
    const detailCount = existingDetail.filter((p) => !deletedPhotoIds.has(p.id)).length + newDetailFiles.length;
    if (wornCount < 1) newPhotoErrors.worn = 'At least one worn photo is required';
    if (detailCount < 2) newPhotoErrors.detail = 'At least two dress photos are required';
    setPhotoErrors(newPhotoErrors);

    return Object.keys(e).length === 0 && Object.keys(newPhotoErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('gown_listings').update({
      neckline: form.neckline,
      silhouette: form.silhouette,
      materials: form.materials,
      condition: form.condition,
      condition_notes: form.condition_notes,
      borough: form.borough,
      wedding_date: form.wedding_date,
      price_3day: form.price_3day ? parseFloat(form.price_3day) : null,
      price_7day: form.price_7day ? parseFloat(form.price_7day) : null,
      price_14day: form.price_14day ? parseFloat(form.price_14day) : null,
      retail_price: form.retail_price ? parseFloat(form.retail_price) : null,
    }).eq('id', id);

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

    if (!error && listingId) {
      if (deletedPhotoIds.size > 0) {
        const { data: deletedRows } = await supabase
          .from('gown_photos')
          .select('id, storage_path')
          .in('id', [...deletedPhotoIds]);
        if (deletedRows && deletedRows.length > 0) {
          await supabase.storage.from('gown-photos').remove(deletedRows.map((r: { storage_path: string }) => r.storage_path));
        }
        await supabase.from('gown_photos').delete().in('id', [...deletedPhotoIds]);
      }

      await uploadPhotos(newWornFiles, 'worn');
      await uploadPhotos(newDetailFiles, 'detail');
      await uploadPhotos(newConditionFiles, 'condition');

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

    setSaving(false);
    if (!error) {
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-4xl mb-6">🤍</p>
        <h1 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)] mb-4">
          Your dress is listed.
        </h1>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-3">
          Pre-brides who match your measurements will see it first.
        </p>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-8">
          One thing to know: renters won&apos;t be able to alter the dress, so the fit match matters.
          We&apos;ve already handled that — anyone who reaches out will be within your size range.
        </p>
        <Link
          href="/dashboard"
          className="rounded-full bg-[var(--color-charcoal)] px-8 py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)]"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <Link href="/dashboard" className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">Edit gown listing</h1>

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
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  form.neckline === n
                    ? 'bg-[var(--color-rose)] text-white'
                    : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {errors.neckline && <p className="mt-1.5 text-xs text-red-500">{errors.neckline}</p>}
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
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  form.silhouette === s
                    ? 'bg-[var(--color-rose)] text-white'
                    : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.silhouette && <p className="mt-1.5 text-xs text-red-500">{errors.silhouette}</p>}
        </div>

        {/* Materials */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Fabric / Material</p>
          <div className="flex flex-wrap gap-2">
            {FABRIC_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMaterial(m)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  form.materials.includes(m)
                    ? 'bg-[var(--color-rose)] text-white'
                    : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {errors.materials && <p className="mt-1.5 text-xs text-red-500">{errors.materials}</p>}
        </div>

        {/* Condition */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Condition</p>
          <div className="space-y-2">
            {CONDITION_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, condition: value }))}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  form.condition === value
                    ? 'border-[var(--color-rose)] bg-[var(--color-blush)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-rose)]'
                }`}
              >
                <p className="text-sm font-medium text-[var(--color-charcoal)]">{label}</p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{description}</p>
              </button>
            ))}
          </div>
          {errors.condition && <p className="mt-1.5 text-xs text-red-500">{errors.condition}</p>}
        </div>

        {/* Condition notes */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">
            Condition notes <span className="text-[var(--color-muted)] font-normal">(optional)</span>
          </label>
          <textarea
            value={form.condition_notes}
            onChange={(e) => setForm((f) => ({ ...f, condition_notes: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors resize-none"
          />
        </div>

        {/* Retail value */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">
            Retail value <span className="text-[var(--color-muted)] font-normal">(optional)</span>
          </label>
          <p className="mb-3 text-xs text-[var(--color-muted)]">The original purchase price. Shown crossed out so renters can see how much they save.</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">$</span>
            <input
              type="number"
              step="1"
              min="0"
              value={form.retail_price}
              onChange={(e) => setForm((f) => ({ ...f, retail_price: e.target.value }))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] pl-7 pr-3 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
              placeholder="e.g. 3200"
            />
          </div>
        </div>

        {/* Rental pricing */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-[var(--color-charcoal)]">Set Your Rental Price</p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTooltip((v) => !v)}
                className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-muted)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] transition-colors"
                aria-label="Pricing info"
              >
                ?
              </button>
              {showTooltip && (
                <div className="absolute left-6 top-0 z-10 w-64 rounded-xl border border-[var(--color-border)] bg-white p-3 text-xs text-[var(--color-muted)] shadow-md leading-relaxed">
                  We can&apos;t set your price for you — but here&apos;s what we&apos;ve seen: dresses priced above 30% of retail get significantly fewer inquiries. Pre-brides comparing options will choose the dress that fits and makes financial sense. Pricing competitively is your best visibility tool.
                </div>
              )}
            </div>
          </div>
          <p className="mb-3 text-xs text-[var(--color-muted)]">You set the price. We&apos;ll tell you what tends to work.</p>

          {/* Guidance card */}
          <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-blush)] px-4 py-3 text-xs text-[var(--color-charcoal)] leading-relaxed">
            Dresses priced at <span className="font-medium">10–20% of retail</span> tend to rent.
            At that range, a $2,000 dress lists at $200–$400 — competitive enough to attract serious pre-brides,
            while putting money back in your pocket from something sitting in a bag.
          </div>

          {/* Guidance on tiered pricing */}
          <div className="mb-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-xs text-[var(--color-muted)] leading-relaxed space-y-1">
            <p><span className="font-medium text-[var(--color-charcoal)]">3 days</span> — standard NYC wedding. Set your base price here.</p>
            <p><span className="font-medium text-[var(--color-charcoal)]">7 days</span> — destination or multi-day. Slightly lower per-day rate encourages longer bookings.</p>
            <p><span className="font-medium text-[var(--color-charcoal)]">14 days</span> — extended trip or multiple events. Best value rate.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-2">
            {([
              { key: 'price_3day', label: '3 days', days: 3 },
              { key: 'price_7day', label: '7 days', days: 7 },
              { key: 'price_14day', label: '14 days', days: 14 },
            ] as const).map(({ key, label, days }) => {
              const val = parseFloat(form[key]);
              const perDay = !isNaN(val) && val > 0 ? Math.round(val / days) : null;
              return (
              <div key={key}>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form[key]}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => {
                        const next: typeof f = { ...f, [key]: v };
                        if (key === 'price_3day' && v) {
                          const base = parseFloat(v);
                          if (!isNaN(base)) {
                            if (!f.price_7day) next.price_7day = String(Math.round(base / 3 * 7 * 0.90));
                            if (!f.price_14day) next.price_14day = String(Math.round(base / 3 * 14 * 0.80));
                          }
                        }
                        return next;
                      });
                    }}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] pl-7 pr-3 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
                    placeholder="—"
                  />
                </div>
                {perDay && <p className="mt-1 text-xs text-[var(--color-muted)]">${perDay}/day</p>}
              </div>
              );
            })}
          </div>

          {/* Expandable pricing tips */}
          <button
            type="button"
            onClick={() => setShowPricingTips((v) => !v)}
            className="flex items-center gap-1 text-xs text-[var(--color-rose)] hover:text-[var(--color-rose-dark)] transition-colors"
          >
            <span>{showPricingTips ? '▾' : '▸'}</span>
            Pricing tips
          </button>
          {showPricingTips && (
            <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-4 text-xs text-[var(--color-muted)] leading-relaxed space-y-4">
              <div>
                <p className="font-medium text-[var(--color-charcoal)] mb-1">What renters are thinking about</p>
                <p>Pre-brides on WhoGetsYou are comparing rental cost to alterations + dry cleaning on a secondhand dress — typically $300–$600. Your rental price competes with that math. The closer you are to that range, the easier the decision is for her.</p>
              </div>
              <div>
                <p className="font-medium text-[var(--color-charcoal)] mb-1">Fit is already handled — price is the last variable</p>
                <p>Because WhoGetsYou matches by measurements first, pre-brides who see your dress already fit your dress. You&apos;re not competing against 200 listings. You&apos;re the shortlist. A competitive price closes it.</p>
              </div>
              <div>
                <p className="font-medium text-[var(--color-charcoal)] mb-1">You keep the dress</p>
                <p>This isn&apos;t consignment. Your dress comes back to you. Whatever you earn is clear profit from something you weren&apos;t using.</p>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-[var(--color-muted)] leading-relaxed">
            WhoGetsYou takes a small service fee from each completed rental to keep the platform running.
            The prices you set above are what renters pay — your earnings will reflect the fee deduction.{' '}
            <a href="/faq#payments" className="text-[var(--color-rose)] hover:underline">Learn more</a>
          </p>
        </div>

        {/* Borough */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">Your borough</label>
          <select
            value={form.borough}
            onChange={(e) => setForm((f) => ({ ...f, borough: e.target.value }))}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
          >
            <option value="">Select borough</option>
            {NYC_BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.borough && <p className="mt-1 text-xs text-red-500">{errors.borough}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">Wedding date</label>
          <input
            type="date"
            value={form.wedding_date}
            onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
          />
          {errors.wedding_date && <p className="mt-1 text-xs text-red-500">{errors.wedding_date}</p>}
        </div>

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

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--color-charcoal)] py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save listing'}
        </button>
      </form>
    </div>
  );
}
