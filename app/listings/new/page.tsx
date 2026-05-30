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
  const [showPricingTips, setShowPricingTips] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [newWornFiles, setNewWornFiles] = useState<File[]>([]);
  const [newDetailFiles, setNewDetailFiles] = useState<File[]>([]);
  const [newConditionFiles, setNewConditionFiles] = useState<File[]>([]);
  const [photoErrors, setPhotoErrors] = useState<{ worn?: string; detail?: string }>({});

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'post-bride') { router.replace('/dashboard'); }
    }
    checkAuth();
  }, [router]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

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

          <div className="grid grid-cols-3 gap-3 mb-4">
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
            newPhotos={newWornFiles}
            onNewPhotosChange={setNewWornFiles}
            error={photoErrors.worn}
          />

          <PhotoUploadStep
            title="The Dress"
            description="Show the dress in detail."
            hint="Try: front, back, side, flat lay, close-up of detail"
            minPhotos={2}
            newPhotos={newDetailFiles}
            onNewPhotosChange={setNewDetailFiles}
            error={photoErrors.detail}
          />

          <PhotoUploadStep
            title="Condition"
            description="Photos of any wear, alterations, or damage."
            optional
            newPhotos={newConditionFiles}
            onNewPhotosChange={setNewConditionFiles}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--color-charcoal)] py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'List gown'}
        </button>
      </form>
    </div>
  );
}
