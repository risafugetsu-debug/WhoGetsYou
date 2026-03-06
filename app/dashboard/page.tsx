'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Profile {
  first_name: string;
  role: 'post-bride' | 'pre-bride';
  created_at: string;
}

interface MeasurementRow {
  unit_system: string;
  height: number;
  neck_to_waist: number;
  shoulder_width: number;
  bust_top: number;
  under_bust: number;
  waist: number;
  high_hip: number;
  low_hip: number;
  arm_length: number;
}

interface GownListing {
  id: string;
  neckline: string;
  silhouette: string;
  materials: string[];
  condition: string;
  condition_notes: string;
  wedding_borough: string;
  wedding_date: string;
  price_1day: number | null;
  price_3day: number | null;
  price_7day: number | null;
  retail_price: number | null;
  is_available: boolean;
}

interface StylePreferences {
  necklines: string[];
  silhouettes: string[];
  materials: string[];
  wedding_borough: string;
  wedding_date: string | null;
  date_undecided: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRow | null>(null);
  const [listing, setListing] = useState<GownListing | null>(null);
  const [preferences, setPreferences] = useState<StylePreferences | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => i !== null ? (i + 1) % photoUrls.length : null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => i !== null ? (i - 1 + photoUrls.length) % photoUrls.length : null);
    }
    if (lightboxIndex !== null) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, photoUrls.length]);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/sign-in');
        return;
      }

      const userId = session.user.id;

      const [profileRes, measurementsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('measurements').select('*').eq('user_id', userId).single(),
      ]);

      if (profileRes.error || !profileRes.data) {
        router.replace('/sign-in');
        return;
      }

      setProfile(profileRes.data as Profile);
      setMeasurements(measurementsRes.data as MeasurementRow | null);

      if (profileRes.data.role === 'post-bride') {
        const { data } = await supabase
          .from('gown_listings')
          .select('*')
          .eq('user_id', userId)
          .single();
        setListing(data as GownListing | null);

        if (data?.id) {
          const { data: photosData } = await supabase
            .from('gown_photos')
            .select('storage_path')
            .eq('listing_id', data.id)
            .order('created_at');

          const paths = (photosData ?? []).map((p: { storage_path: string }) => p.storage_path);
          if (paths.length > 0) {
            const { data: signedData } = await supabase.storage
              .from('gown-photos')
              .createSignedUrls(paths, 3600);
            setPhotoUrls(
              (signedData ?? []).filter((e) => e.signedUrl).map((e) => e.signedUrl)
            );
          }
        }
      } else {
        const { data } = await supabase
          .from('style_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
        setPreferences(data as StylePreferences | null);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function toggleAvailability() {
    if (!listing) return;
    const newStatus = !listing.is_available;

    // Update local state immediately for fast UI feedback
    setListing({ ...listing, is_available: newStatus });

    // Make request to Supabase
    const { error } = await supabase
      .from('gown_listings')
      .update({ is_available: newStatus })
      .eq('id', listing.id);

    if (error) {
      // Revert if it fails
      setListing({ ...listing, is_available: !newStatus });
      alert('Failed to update availability. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  if (!profile) return null;

  const unit = measurements?.unit_system ?? 'cm';

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-rose)]">
            {profile.role === 'post-bride' ? 'Post-bride' : 'Pre-bride'}
          </p>
          <h1 className="mt-1 text-3xl font-light tracking-wide text-[var(--color-charcoal)]">
            Hi, {profile.first_name}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {/* Measurements card */}
        {measurements && (
          <Section title="Your measurements" editHref="/edit/measurements">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <Stat label="Height" value={unit === 'in' ? `${Math.floor(measurements.height / 12)} ft ${Math.round(measurements.height % 12)} in` : `${measurements.height} cm`} />
              <Stat label="Neck to waist" value={`${measurements.neck_to_waist} ${unit}`} />
              <Stat label="Shoulder width" value={`${measurements.shoulder_width} ${unit}`} />
              <Stat label="Bust (upper)" value={`${measurements.bust_top} ${unit}`} />
              <Stat label="Under bust" value={`${measurements.under_bust} ${unit}`} />
              <Stat label="Waist" value={`${measurements.waist} ${unit}`} />
              <Stat label="High hip" value={`${measurements.high_hip} ${unit}`} />
              <Stat label="Low hip" value={`${measurements.low_hip} ${unit}`} />
              <Stat label="Arm length" value={`${measurements.arm_length} ${unit}`} />
            </div>
          </Section>
        )}

        {/* Post-bride: gown listing */}
        {profile.role === 'post-bride' && listing && (
          <Section title="Your gown listing" editHref="/edit/listing">
            {photoUrls.length > 0 && (
              <div className="mb-5 space-y-2">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-[var(--color-blush)] cursor-zoom-in block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrls[0]} alt="Gown" className="h-full w-full object-cover" />
                </button>
                {photoUrls.length > 1 && (
                  <div className={`grid gap-2 ${photoUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {photoUrls.slice(1).map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i + 1)}
                        className="aspect-square overflow-hidden rounded-lg bg-[var(--color-blush)] cursor-zoom-in block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Gown photo ${i + 2}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Tag>{listing.neckline}</Tag>
                <Tag>{listing.silhouette}</Tag>
                {listing.materials.map((m) => <Tag key={m}>{m}</Tag>)}
              </div>
              <Stat label="Condition" value={listing.condition} />
              {listing.condition_notes && (
                <Stat label="Notes" value={listing.condition_notes} />
              )}
              <Stat label="Wedding location" value={`${listing.wedding_borough}, New York`} />
              <Stat label="Wedding date" value={new Date(listing.wedding_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
              {(listing.retail_price || listing.price_1day || listing.price_3day || listing.price_7day) && (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Pricing</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    {listing.retail_price && (
                      <span className="text-sm text-stone-400 line-through">${listing.retail_price.toLocaleString()} retail</span>
                    )}
                    {listing.price_1day && <span className="text-sm font-medium text-[var(--color-charcoal)]">${listing.price_1day} / 1 day</span>}
                    {listing.price_3day && <span className="text-sm font-medium text-[var(--color-charcoal)]">${listing.price_3day} / 3 days</span>}
                    {listing.price_7day && <span className="text-sm font-medium text-[var(--color-charcoal)]">${listing.price_7day} / 7+ days</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-[var(--color-border)] pt-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-charcoal)]">Listing Status</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {listing.is_available
                    ? 'Your gown is visible to pre-brides.'
                    : 'Your gown is currently hidden from matches.'}
                </p>
              </div>
              <button
                onClick={toggleAvailability}
                className={`min-w-[120px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${listing.is_available
                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : 'bg-[var(--color-rose)] text-white hover:bg-[var(--color-rose-dark)]'
                  }`}
              >
                {listing.is_available ? 'Take off market' : 'Make available'}
              </button>
            </div>
          </Section>
        )}

        {/* Pre-bride: style preferences */}
        {profile.role === 'pre-bride' && preferences && (
          <Section title="Your style preferences" editHref="/edit/preferences">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">Necklines</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.necklines.map((n) => <Tag key={n}>{n}</Tag>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">Silhouettes</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.silhouettes.map((s) => <Tag key={s}>{s}</Tag>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">Fabrics</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.materials.map((m) => <Tag key={m}>{m}</Tag>)}
                </div>
              </div>
              {preferences.date_undecided ? (
                <Stat label="Wedding date" value="Not yet decided" />
              ) : preferences.wedding_date ? (
                <Stat label="Wedding date" value={new Date(preferences.wedding_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
              ) : null}
              {preferences.wedding_borough && (
                <Stat label="Wedding location" value={`${preferences.wedding_borough}, New York`} />
              )}
            </div>
          </Section>
        )}

        {profile.role === 'pre-bride' ? (
          <Link
            href="/matches"
            className="flex items-center justify-between rounded-2xl border border-[var(--color-rose)] bg-[var(--color-blush)] px-6 py-5 transition-colors hover:bg-[var(--color-blush-dark)]"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--color-rose)]">Ready</p>
              <p className="mt-0.5 text-base font-medium text-[var(--color-charcoal)]">Browse your matched gowns</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Ranked by fit and style compatibility</p>
            </div>
            <span className="text-xl text-[var(--color-rose)]">→</span>
          </Link>
        ) : (
          <Link
            href="/interests"
            className="flex items-center justify-between rounded-2xl border border-[var(--color-rose)] bg-[var(--color-blush)] px-6 py-5 transition-colors hover:bg-[var(--color-blush-dark)]"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--color-rose)]">Inbox</p>
              <p className="mt-0.5 text-base font-medium text-[var(--color-charcoal)]">See who&apos;s interested in your gown</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Pre-brides who expressed interest, ranked by compatibility</p>
            </div>
            <span className="text-xl text-[var(--color-rose)]">→</span>
          </Link>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrls[lightboxIndex]}
            alt="Gown"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Close */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white transition-colors hover:bg-white/25"
          >
            ×
          </button>

          {/* Prev */}
          {photoUrls.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + photoUrls.length) % photoUrls.length); }}
              className="absolute left-5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            >
              ‹
            </button>
          )}

          {/* Next */}
          {photoUrls.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photoUrls.length); }}
              className="absolute right-5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            >
              ›
            </button>
          )}

          {/* Counter */}
          {photoUrls.length > 1 && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/50">
              {lightboxIndex + 1} / {photoUrls.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, editHref, children }: { title: string; editHref?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-[var(--color-muted)]">{title}</h2>
        {editHref && (
          <Link href={editHref} className="text-xs text-[var(--color-rose)] hover:underline transition-colors">
            Edit
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[var(--color-charcoal)]">{value}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-blush)] px-3 py-1 text-xs text-[var(--color-charcoal)]">
      {children}
    </span>
  );
}
