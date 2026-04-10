'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { scoreListing, MeasurementRow, GownListing, StylePreferencesRow } from '@/lib/matching';

interface RawListing extends GownListing {
  available_from: string | null;
  available_until: string | null;
}

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

function formatHeight(totalInches: number): string {
  const ft = Math.floor(totalInches / 12);
  const ins = Math.round(totalInches % 12);
  return `${ft}'${ins}"`;
}

function formatMeasurement(value: number, unit: string): string {
  if (!value) return '—';
  return unit === 'in' ? `${value}"` : `${value} cm`;
}

function formatAvailability(from: string | null, until: string | null): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', opts);
  if (from && until) return `${fmt(from)} – ${fmt(until)}`;
  if (from) return `From ${fmt(from)}`;
  if (until) return `Until ${fmt(until)}`;
  return '';
}

export default function ListingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInterested, setIsInterested] = useState(false);
  const [pending, setPending] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [selectedWornIndex, setSelectedWornIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }

      const userId = session.user.id;

      const [profileRes, listingRes] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', userId).single(),
        supabase.from('gown_listings').select('*').eq('id', id).single(),
      ]);

      if (listingRes.error || !listingRes.data) {
        setError('Listing not found.');
        setLoading(false);
        return;
      }

      const listing = listingRes.data as RawListing;
      const viewerRole = profileRes.data?.role as 'pre-bride' | 'post-bride';
      const isOwnListing = listing.user_id === userId;

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

      const postBrideMeasurements = postMeasurementsRes.data as MeasurementRow | null;
      let fitScore = 0, styleScore = 0, combinedScore = 0, fitLabel = '';

      if (viewerRole === 'pre-bride' && !isOwnListing) {
        const [myMeasurementsRes, myPrefsRes, interestRes] = await Promise.all([
          supabase.from('measurements').select('*').eq('user_id', userId).single(),
          supabase.from('style_preferences').select('*').eq('user_id', userId).single(),
          supabase.from('interests').select('id').eq('pre_bride_id', userId).eq('listing_id', id).maybeSingle(),
        ]);

        if (myMeasurementsRes.data && myPrefsRes.data && postBrideMeasurements) {
          const scored = scoreListing(
            myMeasurementsRes.data as MeasurementRow,
            myPrefsRes.data as StylePreferencesRow,
            postBrideMeasurements,
            listing,
          );
          fitScore = scored.fitScore;
          styleScore = scored.styleScore;
          combinedScore = scored.combinedScore;
          fitLabel = scored.fitLabel;
        }

        setIsInterested(!!interestRes.data);
      }

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
      setLoading(false);
    }

    load();
  }, [id, router]);

  async function expressInterest() {
    if (!data) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setPending(true);
    setInterestError(null);
    const { error: insertError } = await supabase.from('interests').insert({
      pre_bride_id: session.user.id,
      listing_id: data.listing.id,
      post_bride_id: data.listing.user_id,
    });
    if (insertError) {
      setInterestError('Something went wrong — please try again');
    } else {
      setIsInterested(true);
    }
    setPending(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6">
        <p className="text-sm text-red-500">{error ?? 'Something went wrong.'}</p>
      </div>
    );
  }

  const { listing, postBrideFirstName, wornUrls, detailUrls, conditionUrls, videoUrl, viewerRole, isOwnListing, fitScore, styleScore, combinedScore, fitLabel, postBrideMeasurements } = data;
  const showScore = viewerRole === 'pre-bride' && !isOwnListing;
  const availabilityText = formatAvailability(listing.available_from, listing.available_until);

  const scoreBg =
    combinedScore >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    combinedScore >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
    combinedScore >= 55 ? 'bg-[var(--color-blush)] text-[var(--color-rose)] border-[var(--color-blush-dark)]' :
    'bg-stone-50 text-stone-600 border-stone-200';

  const measurements = postBrideMeasurements ? [
    { label: 'Height', value: formatHeight(postBrideMeasurements.height) },
    { label: 'Bust', value: formatMeasurement(postBrideMeasurements.bust_top, postBrideMeasurements.unit_system) },
    { label: 'Under bust', value: formatMeasurement(postBrideMeasurements.under_bust, postBrideMeasurements.unit_system) },
    { label: 'Waist', value: formatMeasurement(postBrideMeasurements.waist, postBrideMeasurements.unit_system) },
    { label: 'High hip', value: formatMeasurement(postBrideMeasurements.high_hip, postBrideMeasurements.unit_system) },
    { label: 'Hips', value: formatMeasurement(postBrideMeasurements.low_hip, postBrideMeasurements.unit_system) },
    { label: 'Shoulder', value: formatMeasurement(postBrideMeasurements.shoulder_width, postBrideMeasurements.unit_system) },
    { label: 'Neck to waist', value: formatMeasurement(postBrideMeasurements.neck_to_waist, postBrideMeasurements.unit_system) },
    { label: 'Arm length', value: formatMeasurement(postBrideMeasurements.arm_length, postBrideMeasurements.unit_system) },
  ] : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href={viewerRole === 'pre-bride' ? '/matches' : '/dashboard'}
          className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          ← {viewerRole === 'pre-bride' ? 'Matches' : 'Dashboard'}
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
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

            {wornUrls.length === 0 && (
              <div className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                No worn photo yet
              </div>
            )}

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

        {/* Details */}
        <div className="space-y-6">
          <div>
            <p className="text-xs text-[var(--color-muted)]">Listed by {postBrideFirstName}</p>
            <h1 className="mt-1 text-2xl font-light tracking-wide text-[var(--color-charcoal)]">
              {listing.neckline} · {listing.silhouette}
            </h1>
            {showScore && (
              <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${scoreBg}`}>
                {combinedScore}% match
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">Fabric</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.materials.map((m) => (
                <span key={m} className="rounded-full border border-[var(--color-border)] bg-[var(--color-blush)] px-3 py-1 text-xs text-[var(--color-charcoal)]">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {measurements.length > 0 && (
            <div>
              <p className="mb-3 text-xs uppercase tracking-wider text-[var(--color-muted)]">Size details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {measurements.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-[var(--color-muted)]">{label}</p>
                    <p className="text-sm text-[var(--color-charcoal)]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-[var(--color-muted)]">Condition</p>
            <p className="text-sm text-[var(--color-charcoal)]">{listing.condition}</p>
            {listing.condition_notes && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">{listing.condition_notes}</p>
            )}
          </div>

          {(listing.price_1day || listing.price_3day || listing.price_7day) && (
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <div className="flex items-center justify-between bg-[var(--color-blush)] px-4 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-charcoal)]">Rental pricing</p>
                {listing.retail_price && (
                  <span className="text-xs text-stone-400 line-through">${listing.retail_price.toLocaleString()} retail</span>
                )}
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {listing.price_1day && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-[var(--color-charcoal)]">1 day</p>
                    <p className="text-sm font-medium text-[var(--color-charcoal)]">${listing.price_1day}</p>
                  </div>
                )}
                {listing.price_3day && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-[var(--color-charcoal)]">3 days</p>
                    <p className="text-sm font-medium text-[var(--color-charcoal)]">${listing.price_3day}</p>
                  </div>
                )}
                {listing.price_7day && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-[var(--color-charcoal)]">7+ days</p>
                    <p className="text-sm font-medium text-[var(--color-charcoal)]">${listing.price_7day}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {listing.retail_price && !(listing.price_1day || listing.price_3day || listing.price_7day) && (
            <div>
              <p className="text-xs text-[var(--color-muted)]">Retail value</p>
              <p className="mt-0.5 text-sm text-stone-400 line-through">${listing.retail_price.toLocaleString()}</p>
            </div>
          )}

          <div className="space-y-2">
            {listing.borough && (
              <div>
                <p className="text-xs text-[var(--color-muted)]">Pickup area</p>
                <p className="mt-0.5 text-sm text-[var(--color-charcoal)]">{listing.borough}, New York</p>
              </div>
            )}
            {availabilityText && (
              <div>
                <p className="text-xs text-[var(--color-muted)]">Available</p>
                <p className="mt-0.5 text-sm text-[var(--color-charcoal)]">{availabilityText}</p>
              </div>
            )}
          </div>

          {showScore && (
            <div className="rounded-xl bg-[var(--color-blush)] px-4 py-4">
              <p className="mb-3 text-xs font-medium text-[var(--color-charcoal)]">{fitLabel}</p>
              <div className="space-y-2">
                <ScoreBar label="Fit" value={fitScore} />
                <ScoreBar label="Style" value={styleScore} />
              </div>
            </div>
          )}

          {viewerRole === 'pre-bride' && !isOwnListing && (
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
          )}
          {interestError && (
            <p className="text-xs text-red-500 text-center">{interestError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs text-[var(--color-muted)]">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-[var(--color-blush-dark)] h-1.5">
        <div className="h-full rounded-full bg-[var(--color-rose)] transition-all" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-xs text-[var(--color-muted)]">{value}%</span>
    </div>
  );
}
