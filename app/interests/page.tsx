'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { scoreListing, MeasurementRow, GownListing, StylePreferencesRow } from '@/lib/matching';

interface InterestedPreBride {
  interestId: string;
  preBrideId: string;
  firstName: string;
  email: string;
  createdAt: string;
  isAccepted: boolean;
  fitScore: number;
  styleScore: number;
  combinedScore: number;
  fitLabel: string;
  necklines: string[];
  silhouettes: string[];
  materials: string[];
  bookingId: string | null;
  bookingStatus: 'pending_payment' | 'booked' | 'completed' | 'refunded' | null;
  bookingAmountCents: number | null;
  bookingRentalDays: number | null;
}

export default function InterestsPage() {
  const router = useRouter();
  const [interested, setInterested] = useState<InterestedPreBride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }

      const userId = session.user.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'post-bride') {
        router.replace('/dashboard');
        return;
      }

      const [listingRes, myMeasurementsRes] = await Promise.all([
        supabase.from('gown_listings').select('*').eq('user_id', userId).single(),
        supabase.from('measurements').select('*').eq('user_id', userId).single(),
      ]);

      if (listingRes.error || myMeasurementsRes.error) {
        setError('Could not load your listing. Please try again.');
        setLoading(false);
        return;
      }

      const myListing = listingRes.data as GownListing;
      const myMeasurements = myMeasurementsRes.data as MeasurementRow;

      const { data: interestsData } = await supabase
        .from('interests')
        .select('id, pre_bride_id, created_at, accepted_at')
        .eq('listing_id', myListing.id)
        .order('created_at', { ascending: false });

      if (!interestsData || interestsData.length === 0) {
        setInterested([]);
        setLoading(false);
        return;
      }

      const interestIds = interestsData.map((i: { id: string }) => i.id);

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, interest_id, status, amount_cents, rental_days')
        .in('interest_id', interestIds);

      const bookingMap = new Map(
        (bookingsData ?? []).map((b: {
          interest_id: string; id: string; status: string;
          amount_cents: number; rental_days: number;
        }) => [b.interest_id, b])
      );

      const preBrideIds = interestsData.map((i: { pre_bride_id: string }) => i.pre_bride_id);

      const [profilesRes, measurementsRes, prefsRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name, email').in('id', preBrideIds),
        supabase.from('measurements').select('*').in('user_id', preBrideIds),
        supabase.from('style_preferences').select('*').in('user_id', preBrideIds),
      ]);

      const profileMap = new Map<string, { firstName: string; email: string }>(
        (profilesRes.data ?? []).map((p: { id: string; first_name: string; email: string }) => [
          p.id,
          { firstName: p.first_name, email: p.email ?? '' },
        ])
      );
      const measurementsMap = new Map<string, MeasurementRow>(
        (measurementsRes.data ?? []).map((m: MeasurementRow) => [m.user_id, m])
      );
      const prefsMap = new Map<string, StylePreferencesRow & { user_id: string }>(
        (prefsRes.data ?? []).map((p: StylePreferencesRow & { user_id: string }) => [p.user_id, p])
      );

      const result: InterestedPreBride[] = [];

      for (const interest of interestsData) {
        const preMeasurements = measurementsMap.get(interest.pre_bride_id);
        const prefs = prefsMap.get(interest.pre_bride_id);
        if (!preMeasurements || !prefs) continue;

        const scored = scoreListing(preMeasurements, prefs, myMeasurements, myListing);
        const profile = profileMap.get(interest.pre_bride_id);

        result.push({
          interestId: interest.id,
          preBrideId: interest.pre_bride_id,
          firstName: profile?.firstName ?? 'A bride',
          email: profile?.email ?? '',
          createdAt: interest.created_at,
          isAccepted: !!interest.accepted_at,
          fitScore: scored.fitScore,
          styleScore: scored.styleScore,
          combinedScore: scored.combinedScore,
          fitLabel: scored.fitLabel,
          necklines: prefs.necklines,
          silhouettes: prefs.silhouettes,
          materials: prefs.materials,
          bookingId: bookingMap.get(interest.id)?.id ?? null,
          bookingStatus: (bookingMap.get(interest.id)?.status ?? null) as 'pending_payment' | 'booked' | 'completed' | 'refunded' | null,
          bookingAmountCents: bookingMap.get(interest.id)?.amount_cents ?? null,
          bookingRentalDays: bookingMap.get(interest.id)?.rental_days ?? null,
        });
      }

      result.sort((a, b) => b.combinedScore - a.combinedScore);
      setInterested(result);
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleAccept(interestId: string) {
    setAcceptingId(interestId);
    await supabase
      .from('interests')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', interestId);
    setInterested((prev) =>
      prev.map((pb) => pb.interestId === interestId ? { ...pb, isAccepted: true } : pb)
    );
    setAcceptingId(null);
  }

  async function handleMarkComplete(bookingId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setCompletingId(bookingId);
    const res = await fetch('/api/stripe/payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookingId }),
    });
    if (res.ok) {
      setInterested((prev) =>
        prev.map((pb) => pb.bookingId === bookingId ? { ...pb, bookingStatus: 'completed' } : pb)
      );
    }
    setCompletingId(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-light tracking-wide text-[var(--color-charcoal)]">
        Interested pre-brides
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Pre-brides who expressed interest in your gown, ranked by compatibility. Accept to start messaging.
      </p>

      {interested.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[var(--color-muted)]">
            No one has expressed interest yet — check back soon.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {interested.map((pb) => (
            <InterestCard
              key={pb.interestId}
              preBride={pb}
              isAccepting={acceptingId === pb.interestId}
              isCompleting={completingId === pb.bookingId}
              onAccept={() => handleAccept(pb.interestId)}
              onMarkComplete={() => { if (pb.bookingId) handleMarkComplete(pb.bookingId); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InterestCard({
  preBride,
  isAccepting,
  isCompleting,
  onAccept,
  onMarkComplete,
}: {
  preBride: InterestedPreBride;
  isAccepting: boolean;
  isCompleting: boolean;
  onAccept: () => void;
  onMarkComplete: () => void;
}) {
  const { firstName, email, combinedScore, fitScore, styleScore, fitLabel, necklines, silhouettes, materials, createdAt, isAccepted } = preBride;

  const scoreBg =
    combinedScore >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    combinedScore >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
    combinedScore >= 55 ? 'bg-[var(--color-blush)] text-[var(--color-rose)] border-[var(--color-blush-dark)]' :
    'bg-stone-50 text-stone-600 border-stone-200';

  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className={`rounded-2xl border bg-[var(--background)] p-6 transition-colors ${isAccepted ? 'border-emerald-200' : 'border-[var(--color-border)]'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Expressed interest on {date}</p>
          <h3 className="mt-0.5 text-base font-medium text-[var(--color-charcoal)]">{firstName}</h3>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{fitLabel}</p>
        </div>
        <div className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${scoreBg}`}>
          {combinedScore}% match
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[var(--color-blush)] px-4 py-3 space-y-1.5">
        <ScoreBar label="Fit" value={fitScore} />
        <ScoreBar label="Style" value={styleScore} />
      </div>

      <div className="mt-4 space-y-2.5">
        {necklines.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-[var(--color-muted)]">Necklines she loves</p>
            <div className="flex flex-wrap gap-1.5">
              {necklines.map((n) => (
                <span key={n} className="rounded-full bg-[var(--color-blush)] px-2.5 py-0.5 text-xs text-[var(--color-charcoal)]">{n}</span>
              ))}
            </div>
          </div>
        )}
        {silhouettes.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-[var(--color-muted)]">Silhouettes she loves</p>
            <div className="flex flex-wrap gap-1.5">
              {silhouettes.map((s) => (
                <span key={s} className="rounded-full bg-[var(--color-blush)] px-2.5 py-0.5 text-xs text-[var(--color-charcoal)]">{s}</span>
              ))}
            </div>
          </div>
        )}
        {materials.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-[var(--color-muted)]">Fabrics she loves</p>
            <div className="flex flex-wrap gap-1.5">
              {materials.map((m) => (
                <span key={m} className="rounded-full bg-[var(--color-blush)] px-2.5 py-0.5 text-xs text-[var(--color-charcoal)]">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {preBride.bookingStatus === 'completed' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium text-emerald-700">Rental complete ✓</p>
            <p className="mt-1 text-xs text-emerald-600">
              ${((preBride.bookingAmountCents ?? 0) * 0.8 / 100).toFixed(0)} has been transferred to your account.
            </p>
          </div>
        ) : preBride.bookingStatus === 'booked' ? (
          <>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-medium text-blue-700">Booking confirmed — payment received ✓</p>
              <p className="mt-1 text-xs text-blue-600">
                {preBride.bookingRentalDays} day{(preBride.bookingRentalDays ?? 1) > 1 ? 's' : ''} ·
                ${((preBride.bookingAmountCents ?? 0) / 100).toFixed(0)} total ·
                You receive ${((preBride.bookingAmountCents ?? 0) * 0.8 / 100).toFixed(0)}
              </p>
            </div>
            <button
              type="button"
              disabled={isCompleting}
              onClick={onMarkComplete}
              className={`w-full rounded-full py-2.5 text-sm font-medium transition-colors ${
                isCompleting
                  ? 'border border-[var(--color-border)] bg-[var(--color-blush)] text-[var(--color-muted)] cursor-wait'
                  : 'border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer'
              }`}
            >
              {isCompleting ? 'Processing…' : 'Mark rental complete'}
            </button>
          </>
        ) : preBride.bookingStatus === 'pending_payment' ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-blush)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--color-charcoal)]">Waiting for payment</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{firstName} has been notified and can complete the booking.</p>
          </div>
        ) : preBride.isAccepted ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-medium text-emerald-700">You accepted her interest ✓</p>
              <p className="mt-0.5 text-xs text-emerald-600">Coordinate pickup and return details below.</p>
            </div>
            <a
              href={`/messages/${preBride.interestId}`}
              className="flex items-center justify-center gap-2 w-full rounded-full border border-[var(--color-rose)] py-2.5 text-sm font-medium text-[var(--color-rose)] hover:bg-[var(--color-blush)] transition-colors"
            >
              Message {firstName} →
            </a>
          </div>
        ) : (
          <button
            type="button"
            disabled={isAccepting}
            onClick={onAccept}
            className={`w-full rounded-full py-2.5 text-sm font-medium transition-colors ${
              isAccepting
                ? 'border border-[var(--color-border)] bg-[var(--color-blush)] text-[var(--color-muted)] cursor-wait'
                : 'border border-[var(--color-rose)] bg-[var(--color-rose)] text-white hover:bg-[var(--color-rose-dark)] cursor-pointer'
            }`}
          >
            {isAccepting ? 'Accepting…' : `Accept ${firstName}'s interest`}
          </button>
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
