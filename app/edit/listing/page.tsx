'use client';

import { useEffect, useState } from 'react';
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

interface FormState {
  neckline: string;
  silhouette: string;
  materials: string[];
  condition: string;
  condition_notes: string;
  wedding_borough: string;
  wedding_date: string;
  price_1day: string;
  price_3day: string;
  price_7day: string;
  retail_price: string;
}

interface ExistingPhoto {
  id: string;
  storage_path: string;
  signedUrl: string;
}

export default function EditListingPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    neckline: '',
    silhouette: '',
    materials: [],
    condition: '',
    condition_notes: '',
    wedding_borough: '',
    wedding_date: '',
    price_1day: '',
    price_3day: '',
    price_7day: '',
    retail_price: '',
  });
  const [listingId, setListingId] = useState<string | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<Set<string>>(new Set());
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [photoError, setPhotoError] = useState('');

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
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setListingId(data.id);
        setForm({
          neckline: data.neckline,
          silhouette: data.silhouette,
          materials: data.materials,
          condition: data.condition,
          condition_notes: data.condition_notes ?? '',
          wedding_borough: data.wedding_borough,
          wedding_date: data.wedding_date,
          price_1day: data.price_1day != null ? String(data.price_1day) : '',
          price_3day: data.price_3day != null ? String(data.price_3day) : '',
          price_7day: data.price_7day != null ? String(data.price_7day) : '',
          retail_price: data.retail_price != null ? String(data.retail_price) : '',
        });

        const { data: photosData } = await supabase
          .from('gown_photos')
          .select('id, storage_path')
          .eq('listing_id', data.id)
          .order('created_at');

        const photos = (photosData ?? []) as { id: string; storage_path: string }[];
        if (photos.length > 0) {
          const { data: signedData } = await supabase.storage
            .from('gown-photos')
            .createSignedUrls(photos.map((p) => p.storage_path), 3600);

          const urlMap = new Map(
            (signedData ?? [])
              .filter((e) => e.signedUrl && e.path)
              .map((e) => [e.path, e.signedUrl])
          );

          setExistingPhotos(
            photos.map((p) => ({
              id: p.id,
              storage_path: p.storage_path,
              signedUrl: urlMap.get(p.storage_path) ?? '',
            }))
          );
        }
      }

      setLoading(false);
    }
    load();
  }, [router]);

  function toggleMaterial(m: string) {
    setForm((f) => ({
      ...f,
      materials: f.materials.includes(m)
        ? f.materials.filter((x) => x !== m)
        : [...f.materials, m],
    }));
  }

  function removeExistingPhoto(id: string) {
    setDeletedPhotoIds((prev) => new Set([...prev, id]));
  }

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setNewPhotoFiles((prev) => [...prev, ...files]);
    setNewPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    setPhotoError('');
    e.target.value = '';
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(newPhotoPreviews[index]);
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.neckline) e.neckline = 'Required';
    if (!form.silhouette) e.silhouette = 'Required';
    if (form.materials.length === 0) e.materials = 'Select at least one fabric';
    if (!form.condition) e.condition = 'Required';
    if (!form.wedding_borough) e.wedding_borough = 'Required';
    if (!form.wedding_date) e.wedding_date = 'Required';
    setErrors(e);

    const totalPhotos = existingPhotos.filter((p) => !deletedPhotoIds.has(p.id)).length + newPhotoFiles.length;
    const pErr = totalPhotos === 0 ? 'At least one photo is required' : '';
    setPhotoError(pErr);

    return Object.keys(e).length === 0 && pErr === '';
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
      wedding_borough: form.wedding_borough,
      wedding_date: form.wedding_date,
      price_1day: form.price_1day ? parseFloat(form.price_1day) : null,
      price_3day: form.price_3day ? parseFloat(form.price_3day) : null,
      price_7day: form.price_7day ? parseFloat(form.price_7day) : null,
      retail_price: form.retail_price ? parseFloat(form.retail_price) : null,
    }).eq('user_id', session.user.id);

    if (!error && listingId) {
      // Delete removed photos
      if (deletedPhotoIds.size > 0) {
        const toDelete = existingPhotos.filter((p) => deletedPhotoIds.has(p.id));
        await supabase.storage.from('gown-photos').remove(toDelete.map((p) => p.storage_path));
        await supabase.from('gown_photos').delete().in('id', [...deletedPhotoIds]);
      }

      // Upload new photos
      for (const file of newPhotoFiles) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${session.user.id}/${listingId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('gown-photos').upload(path, file);
        if (!uploadError) {
          await supabase.from('gown_photos').insert({ listing_id: listingId, storage_path: path });
        }
      }
    }

    setSaving(false);
    router.push('/dashboard');
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  const visibleExisting = existingPhotos.filter((p) => !deletedPhotoIds.has(p.id));

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
          <p className="mb-1 text-sm font-medium text-[var(--color-charcoal)]">
            Rental pricing <span className="text-[var(--color-muted)] font-normal">(optional)</span>
          </p>
          <p className="mb-3 text-xs text-[var(--color-muted)]">Set your rates per rental period. Leave blank to discuss pricing directly.</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'price_1day', label: '1 day' },
              { key: 'price_3day', label: '3 days' },
              { key: 'price_7day', label: '7+ days' },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] pl-7 pr-3 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
                    placeholder="—"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Borough */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">Wedding borough</label>
          <select
            value={form.wedding_borough}
            onChange={(e) => setForm((f) => ({ ...f, wedding_borough: e.target.value }))}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
          >
            <option value="">Select borough</option>
            {NYC_BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.wedding_borough && <p className="mt-1 text-xs text-red-500">{errors.wedding_borough}</p>}
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
        <div>
          <p className="mb-1 text-sm font-medium text-[var(--color-charcoal)]">Photos</p>
          {photoError
            ? <p className="mb-3 text-xs text-red-500">{photoError}</p>
            : <p className="mb-3 text-xs text-[var(--color-muted)]">At least one photo is required.</p>
          }

          {(visibleExisting.length > 0 || newPhotoPreviews.length > 0) && (
            <div className={`mb-3 grid gap-2 ${
              visibleExisting.length + newPhotoPreviews.length === 1 ? 'grid-cols-1' :
              visibleExisting.length + newPhotoPreviews.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {visibleExisting.map((photo) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--color-blush)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.signedUrl} alt="Gown photo" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(photo.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newPhotoPreviews.map((url, i) => (
                <div key={`new-${i}`} className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--color-blush)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="New photo" className="h-full w-full object-cover" />
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-[var(--color-rose)] px-1.5 py-0.5 text-[10px] text-white">New</div>
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(i)}
                    className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-5 text-sm text-[var(--color-muted)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]">
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handlePhotoFileChange}
            />
            + Add photos
          </label>
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
