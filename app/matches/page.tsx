'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  rankListings,
  ScoredListing,
  MeasurementRow,
  GownListing,
  StylePreferencesRow,
} from '@/lib/matching';

type ScoreTierKey = '85+' | '70+' | '55+' | '<55';

const SCORE_TIERS: { key: ScoreTierKey; label: string; colorClass: string; activeClass: string }[] = [
  { key: '85+', label: '85+ Perfect', colorClass: 'text-emerald-700', activeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { key: '70+', label: '70+ Great',   colorClass: 'text-blue-700',    activeClass: 'border-blue-200 bg-blue-50 text-blue-700' },
  { key: '55+', label: '55+ Good',    colorClass: 'text-[var(--color-rose)]', activeClass: 'border-[var(--color-blush-dark)] bg-[var(--color-blush)] text-[var(--color-rose)]' },
  { key: '<55', label: '<55 Fair',    colorClass: 'text-stone-500',   activeClass: 'border-stone-200 bg-stone-50 text-stone-600' },
];

interface ListingWithPhoto extends ScoredListing {
  postBrideFirstName: string;
  postBrideEmail: string;
  photoUrl: string | null;
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<ListingWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [interestErrors, setInterestErrors] = useState<Map<string, string>>(new Map());
  const [sortBy, setSortBy] = useState<'combined' | 'fit' | 'style'>('combined');
  const [filterCondition, setFilterCondition] = useState<string | null>(null);
  const [filterSilhouette, setFilterSilhouette] = useState<string | null>(null);
  const [filterScore, setFilterScore] = useState<ScoreTierKey | null>(null);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const displayed = useMemo(() => {
    let result = [...matches];
    if (filterScore === '85+') result = result.filter((m) => m.combinedScore >= 85);
    else if (filterScore === '70+') result = result.filter((m) => m.combinedScore >= 70 && m.combinedScore < 85);
    else if (filterScore === '55+') result = result.filter((m) => m.combinedScore >= 55 && m.combinedScore < 70);
    else if (filterScore === '<55') result = result.filter((m) => m.combinedScore < 55);
    if (filterCondition) result = result.filter((m) => m.listing.condition === filterCondition);
    if (filterSilhouette) result = result.filter((m) => m.listing.silhouette === filterSilhouette);
    if (sortBy === 'fit') result.sort((a, b) => b.fitScore - a.fitScore);
    else if (sortBy === 'style') result.sort((a, b) => b.styleScore - a.styleScore);
    else result.sort((a, b) => b.combinedScore - a.combinedScore);
    return result;
  }, [matches, sortBy, filterCondition, filterSilhouette, filterScore]);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }

      const userId = session.user.id;

      // Verify this user is a pre-bride
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'pre-bride') {
        router.replace('/dashboard');
        return;
      }

      // Fetch pre-bride's own data
      const [measurementsRes, prefsRes] = await Promise.all([
        supabase.from('measurements').select('*').eq('user_id', userId).single(),
        supabase.from('style_preferences').select('*').eq('user_id', userId).single(),
      ]);

      if (measurementsRes.error || prefsRes.error) {
        setError('Could not load your profile. Please try again.');
        setLoading(false);
        return;
      }

      const myMeasurements = measurementsRes.data as MeasurementRow;
      const myPreferences = prefsRes.data as StylePreferencesRow;

      // Fetch all post-bride listings (not the current user's)
      const { data: listingsData, error: listingsError } = await supabase
        .from('gown_listings')
        .select('*')
        .neq('user_id', userId)
        .eq('is_available', true);

      if (listingsError || !listingsData || listingsData.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const listings = listingsData as GownListing[];
      const postBrideIds = listings.map((l) => l.user_id);
      const listingIds = listings.map((l) => l.id);

      // Fetch post-bride measurements, profiles, photos, and existing interests in parallel
      const [postMeasurementsRes, postProfilesRes, photosRes, interestsRes] = await Promise.all([
        supabase.from('measurements').select('*').in('user_id', postBrideIds),
        supabase.from('profiles').select('id, first_name, email').in('id', postBrideIds),
        supabase.from('gown_photos').select('listing_id, storage_path').in('listing_id', listingIds),
        supabase.from('interests').select('listing_id, accepted_at').eq('pre_bride_id', userId),
      ]);

      const postMeasurementsMap = new Map<string, MeasurementRow>(
        (postMeasurementsRes.data ?? []).map((m: MeasurementRow) => [m.user_id, m])
      );

      const profileMap = new Map<string, { firstName: string; email: string }>(
        (postProfilesRes.data ?? []).map((p: { id: string; first_name: string; email: string }) => [
          p.id,
          { firstName: p.first_name, email: p.email ?? '' },
        ])
      );

      // First photo per listing
      const firstPhotoMap = new Map<string, string>();
      for (const photo of (photosRes.data ?? [])) {
        if (!firstPhotoMap.has(photo.listing_id)) {
          firstPhotoMap.set(photo.listing_id, photo.storage_path);
        }
      }

      const interestRows = (interestsRes.data ?? []) as { listing_id: string; accepted_at: string | null }[];
      setInterestedIds(new Set(interestRows.map((i) => i.listing_id)));
      setAcceptedIds(new Set(interestRows.filter((i) => !!i.accepted_at).map((i) => i.listing_id)));

      // Score and rank
      const ranked = rankListings(myMeasurements, myPreferences, listings, postMeasurementsMap);

      // Get signed URLs for first photos in one batch call
      const pathsNeeded = ranked
        .map((r) => firstPhotoMap.get(r.listing.id))
        .filter((p): p is string => !!p);

      const signedUrlMap = new Map<string, string>();

      if (pathsNeeded.length > 0) {
        const { data: signedData } = await supabase.storage
          .from('gown-photos')
          .createSignedUrls(pathsNeeded, 3600);

        for (const entry of signedData ?? []) {
          if (entry.signedUrl && entry.path) signedUrlMap.set(entry.path, entry.signedUrl);
        }
      }

      const result: ListingWithPhoto[] = ranked.map((r) => {
        const photoPath = firstPhotoMap.get(r.listing.id);
        const profile = profileMap.get(r.listing.user_id);
        return {
          ...r,
          postBrideFirstName: profile?.firstName ?? 'A bride',
          postBrideEmail: profile?.email ?? '',
          photoUrl: photoPath ? (signedUrlMap.get(photoPath) ?? null) : null,
        };
      });

      setMatches(result);
      setLoading(false);
    }

    load();
  }, [router]);

  async function expressInterest(listingId: string, postBrideId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setPendingId(listingId);
    const { error: insertError } = await supabase.from('interests').insert({
      pre_bride_id: session.user.id,
      listing_id: listingId,
      post_bride_id: postBrideId,
    });
    if (insertError) {
      setInterestErrors((prev) => new Map([...prev, [listingId, 'Something went wrong — please try again']]));
    } else {
      setInterestedIds((prev) => new Set([...prev, listingId]));
      setInterestErrors((prev) => { const next = new Map(prev); next.delete(listingId); return next; });
    }
    setPendingId(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Finding your matches…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const anyFilterActive = !!(filterScore || filterCondition || filterSilhouette);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-2 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-light tracking-wide text-[var(--color-charcoal)]">
        Gowns matched for you
      </h1>

      {/* Fit score legend — clickable tier filters */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="text-[var(--color-muted)]">Match score:</span>
        {SCORE_TIERS.map(({ key, label, colorClass, activeClass }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilterScore(filterScore === key ? null : key)}
            className={`rounded-full px-2.5 py-1 transition-colors border ${
              filterScore === key
                ? activeClass
                : `border-transparent ${colorClass} hover:border-current`
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowScoreInfo((s) => !s)}
          className="ml-1 text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
          aria-label="How scores work"
        >
          ⓘ
        </button>
      </div>

      {/* Scoring explainer panel */}
      {showScoreInfo && (
        <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-blush)] px-5 py-4 text-xs text-[var(--color-charcoal)] space-y-3">
          <div className="flex items-start justify-between">
            <p className="font-medium text-sm">How match scores work</p>
            <button
              type="button"
              onClick={() => setShowScoreInfo(false)}
              className="text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
            >
              ✕
            </button>
          </div>
          <div>
            <p className="font-medium mb-1">Fit score <span className="font-normal text-[var(--color-muted)]">(70% of total)</span></p>
            <p className="text-[var(--color-muted)] leading-relaxed">
              Compares your body measurements against the dress&apos;s original owner across 7 dimensions — bust, low hip, waist, height, under-bust, high hip, and shoulder width. Each is weighted by how difficult that area is to alter: shoulder seams are the tightest tolerance (±2 cm), while hem length is the most forgiving (±8 cm).
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">Style score <span className="font-normal text-[var(--color-muted)]">(30% of total)</span></p>
            <p className="text-[var(--color-muted)] leading-relaxed">
              Matches your neckline, silhouette, and fabric preferences against the gown&apos;s actual details. Each of the three factors contributes equally; material overlap is scored as a fraction — e.g. 2 of your 3 preferred fabrics = 67%.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1.5">Score guide</p>
            <div className="space-y-0.5">
              <p><span className="text-emerald-700 font-medium">85+ Perfect</span> — minimal alteration expected</p>
              <p><span className="text-blue-700 font-medium">70+ Great</span> — minor alterations likely</p>
              <p><span className="text-[var(--color-rose)] font-medium">55+ Good</span> — moderate alterations may be needed</p>
              <p><span className="text-stone-500 font-medium">&lt;55 Fair</span> — significant alterations or style differences</p>
            </div>
          </div>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[var(--color-muted)]">
            No matches yet — you&apos;re one of the first. Check back as more post-brides join.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-[var(--color-rose)] hover:underline"
          >
            Back to home
          </Link>
        </div>
      ) : (
        <>
          {/* Sort + filter bar */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[var(--color-muted)]">
                {displayed.length} {displayed.length === 1 ? 'gown' : 'gowns'} matched
              </p>
              <div className="flex rounded-full border border-[var(--color-border)] p-0.5 text-xs">
                {(['combined', 'fit', 'style'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSortBy(s)}
                    className={`rounded-full px-3 py-1.5 transition-colors ${sortBy === s
                        ? 'bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-charcoal)]'
                      }`}
                  >
                    {s === 'combined' ? 'Best match' : s === 'fit' ? 'Best fit' : 'Best style'}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['Pristine', 'Excellent', 'Very Good', 'Good'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterCondition(filterCondition === c ? null : c)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${filterCondition === c
                      ? 'bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                      : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                    }`}
                >
                  {c}
                </button>
              ))}
              <div className="shrink-0 w-px bg-[var(--color-border)] mx-1" />
              {['A-line', 'Ball Gown', 'Mermaid', 'Trumpet', 'Sheath/Column', 'Empire', 'Tea-length'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterSilhouette(filterSilhouette === s ? null : s)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${filterSilhouette === s
                      ? 'bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                      : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {displayed.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-[var(--color-muted)]">No gowns match those filters.</p>
              {anyFilterActive && (
                <button
                  type="button"
                  onClick={() => { setFilterCondition(null); setFilterSilhouette(null); setFilterScore(null); }}
                  className="mt-3 text-sm text-[var(--color-rose)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayed.map((match) => (
                <MatchCard
                  key={match.listing.id}
                  match={match}
                  isInterested={interestedIds.has(match.listing.id)}
                  isAccepted={acceptedIds.has(match.listing.id)}
                  isPending={pendingId === match.listing.id}
                  interestError={interestErrors.get(match.listing.id) ?? null}
                  onExpressInterest={() => expressInterest(match.listing.id, match.listing.user_id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MatchCard({
  match,
  isInterested,
  isAccepted,
  isPending,
  interestError,
  onExpressInterest,
}: {
  match: ListingWithPhoto;
  isInterested: boolean;
  isAccepted: boolean;
  isPending: boolean;
  interestError: string | null;
  onExpressInterest: () => void;
}) {
  const { listing, fitScore, styleScore, combinedScore, fitLabel, postBrideFirstName, postBrideEmail, photoUrl } = match;

  const scoreBg =
    combinedScore >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
      combinedScore >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
        combinedScore >= 55 ? 'bg-[var(--color-blush)] text-[var(--color-rose)] border-[var(--color-blush-dark)]' :
          'bg-stone-50 text-stone-600 border-stone-200';

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--background)] transition-shadow hover:shadow-md cursor-pointer">
      <Link href={`/listings/${listing.id}`} className="absolute inset-0 z-[1]" aria-label={`View ${listing.neckline} ${listing.silhouette} gown`} />
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full bg-[var(--color-blush)]">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={`${listing.neckline} ${listing.silhouette} gown`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl opacity-30">👗</span>
          </div>
        )}

        {/* Score badge */}
        <div className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-medium ${scoreBg}`}>
          {combinedScore}% match
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-[var(--color-muted)]">Listed by {postBrideFirstName}</p>

        <h3 className="mt-1 text-base font-medium text-[var(--color-charcoal)]">
          {listing.neckline} · {listing.silhouette}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.materials.map((m) => (
            <span
              key={m}
              className="rounded-full bg-[var(--color-blush)] px-2.5 py-0.5 text-xs text-[var(--color-charcoal)]"
            >
              {m}
            </span>
          ))}
        </div>

        <div className="mt-3 space-y-1 text-xs text-[var(--color-muted)]">
          <p>Condition: <span className="text-[var(--color-charcoal)]">{listing.condition}</span></p>
          <p>Location: <span className="text-[var(--color-charcoal)]">{listing.wedding_borough}, NYC</span></p>
          {(listing.price_1day || listing.retail_price) && (
            <p className="flex items-baseline gap-2">
              {listing.price_1day && (
                <span>From: <span className="font-medium text-[var(--color-charcoal)]">${listing.price_1day} / day</span></span>
              )}
              {listing.retail_price && (
                <span className="text-stone-400 line-through">${listing.retail_price.toLocaleString()}</span>
              )}
            </p>
          )}
        </div>

        {/* Fit breakdown */}
        <div className="mt-4 rounded-xl bg-[var(--color-blush)] px-4 py-3">
          <p className="mb-2 text-xs font-medium text-[var(--color-charcoal)]">{fitLabel}</p>
          <div className="space-y-1.5">
            <ScoreBar label="Fit" value={fitScore} />
            <ScoreBar label="Style" value={styleScore} />
          </div>
        </div>

        {isAccepted ? (
          <div className="relative z-[2] mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium text-emerald-700">She accepted your interest ✓</p>
            {postBrideEmail && (
              <p className="mt-1 text-sm text-emerald-800">
                Reach out:{' '}
                <a
                  href={`mailto:${postBrideEmail}`}
                  className="font-medium underline hover:no-underline"
                >
                  {postBrideEmail}
                </a>
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={isInterested || isPending}
            onClick={onExpressInterest}
            className={`relative z-[2] mt-2 w-full rounded-full py-2.5 text-sm font-medium transition-colors ${isInterested
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
                : isPending
                  ? 'border border-[var(--color-border)] bg-[var(--color-blush)] text-[var(--color-muted)] cursor-wait'
                  : 'border border-[var(--color-rose)] bg-[var(--color-rose)] text-white hover:bg-[var(--color-rose-dark)] cursor-pointer'
              }`}
          >
            {isInterested ? 'Interest sent ✓' : isPending ? 'Sending…' : 'Express interest'}
          </button>
        )}
        {interestError && (
          <p className="mt-1 text-center text-xs text-red-500">{interestError}</p>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs text-[var(--color-muted)]">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-[var(--color-blush-dark)] h-1.5">
        <div
          className="h-full rounded-full bg-[var(--color-rose)] transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-[var(--color-muted)]">{value}%</span>
    </div>
  );
}
