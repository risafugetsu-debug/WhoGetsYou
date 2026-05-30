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
  borough: string;
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
  borough: string;
  wedding_date: string | null;
  date_undecided: boolean;
}

interface BookingRow {
  id: string;
  listing_id: string;
  rental_days: number;
  amount_cents: number;
  platform_fee_cents: number;
  status: 'pending_payment' | 'booked' | 'completed';
  gown_listings: { neckline: string; silhouette: string } | { neckline: string; silhouette: string }[] | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRow | null>(null);
  const [listings, setListings] = useState<GownListing[]>([]);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [preferences, setPreferences] = useState<StylePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [payoutPending, setPayoutPending] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  useEffect(() => {
    const stripeReturn = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('stripe') : null;
    if (stripeReturn !== 'connected') return;
    async function recheckStripe() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('stripe_accounts')
        .select('onboarding_complete')
        .eq('user_id', session.user.id)
        .single();
      if (data?.onboarding_complete) setStripeStatus('connected');
      else setStripeStatus('pending');
    }
    recheckStripe();
  }, []);

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

        const [stripeData, postBookingsData] = await Promise.all([
          supabase
            .from('stripe_accounts')
            .select('onboarding_complete')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('bookings')
            .select('id, listing_id, rental_days, amount_cents, platform_fee_cents, status, gown_listings(neckline, silhouette)')
            .eq('post_bride_id', userId)
            .order('created_at', { ascending: false }),
        ]);

        if (!stripeData.data) {
          setStripeStatus('none');
        } else if (stripeData.data.onboarding_complete) {
          setStripeStatus('connected');
        } else {
          setStripeStatus('pending');
        }

        setBookings((postBookingsData.data ?? []) as BookingRow[]);
      } else {
        const [prefsData, preBookingsData] = await Promise.all([
          supabase
            .from('style_preferences')
            .select('*')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('bookings')
            .select('id, listing_id, rental_days, amount_cents, platform_fee_cents, status, gown_listings(neckline, silhouette)')
            .eq('pre_bride_id', userId)
            .order('created_at', { ascending: false }),
        ]);
        setPreferences(prefsData.data as StylePreferences | null);
        setBookings((preBookingsData.data ?? []) as BookingRow[]);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function connectStripe() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/stripe/connect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const { url, error } = await res.json();
    if (error) { alert('Could not start Stripe setup. Please try again.'); return; }
    window.location.href = url;
  }

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

  async function releasePayment(bookingId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setPayoutPending(bookingId);
    setPayoutError(null);
    const res = await fetch('/api/stripe/payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookingId }),
    });
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
    } else {
      const json = await res.json();
      setPayoutError(json.error ?? 'Could not release payment — please try again.');
    }
    setPayoutPending(null);
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
              {preferences.borough && (
                <Stat label="Location" value={`${preferences.borough}, New York`} />
              )}
            </div>
          </Section>
        )}

        {profile.role === 'post-bride' && listings.length > 0 && stripeStatus !== 'connected' && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-blush)] px-4 py-4">
            <p className="text-sm font-medium text-[var(--color-charcoal)]">
              {stripeStatus === 'pending' ? 'Finish setting up payouts' : 'Set up payouts to receive rent'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">
              {stripeStatus === 'pending'
                ? 'Your Stripe account setup is incomplete. Finish it so pre-brides can book your gown.'
                : 'Connect a bank account so pre-brides can pay you directly through the platform.'}
            </p>
            <button
              type="button"
              onClick={connectStripe}
              className="mt-3 inline-block rounded-full bg-[var(--color-rose)] px-4 py-1.5 text-xs text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            >
              {stripeStatus === 'pending' ? 'Finish setup →' : 'Connect Stripe →'}
            </button>
          </div>
        )}

        {profile.role === 'post-bride' && listings.length > 0 && stripeStatus === 'connected' && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-xs font-medium text-emerald-700">Payouts connected ✓</span>
            <span className="text-xs text-emerald-600">You&apos;ll receive 80% of each rental.</span>
          </div>
        )}

        {bookings.length > 0 && (
          <Section title="Your bookings">
            <div className="divide-y divide-[var(--color-border)]">
              {bookings.map((booking) => {
                const gown = Array.isArray(booking.gown_listings)
                  ? booking.gown_listings[0] ?? null
                  : booking.gown_listings;
                const label = gown ? `${gown.silhouette} · ${gown.neckline}` : 'Gown';
                const days = booking.rental_days;
                const amount = profile.role === 'pre-bride'
                  ? booking.amount_cents / 100
                  : (booking.amount_cents - booking.platform_fee_cents) / 100;
                const isReleasing = payoutPending === booking.id;

                const badgeClass =
                  booking.status === 'booked'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : booking.status === 'pending_payment'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-stone-200 bg-stone-50 text-stone-500';
                const badgeLabel =
                  booking.status === 'booked' ? 'Confirmed'
                  : booking.status === 'pending_payment' ? 'Awaiting payment'
                  : 'Completed';

                return (
                  <div key={booking.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/listings/${booking.listing_id}`}
                        className="flex-1 min-w-0 text-sm text-[var(--color-charcoal)] hover:text-[var(--color-rose)] transition-colors truncate"
                      >
                        {label}
                      </Link>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--color-muted)]">
                        {days} day{days > 1 ? 's' : ''}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-[var(--color-charcoal)]">
                        ${amount.toFixed(0)}
                      </span>
                      {profile.role === 'post-bride' && booking.status === 'booked' && (
                        <button
                          type="button"
                          disabled={isReleasing}
                          onClick={() => releasePayment(booking.id)}
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            isReleasing
                              ? 'bg-[var(--color-blush)] text-[var(--color-muted)] cursor-wait'
                              : 'bg-[var(--color-rose)] text-white hover:bg-[var(--color-rose-dark)] cursor-pointer'
                          }`}
                        >
                          {isReleasing ? 'Releasing…' : 'Release payment →'}
                        </button>
                      )}
                    </div>
                    {payoutError && payoutPending === null && booking.status === 'booked' && profile.role === 'post-bride' && (
                      <p className="mt-1 text-xs text-red-500">{payoutError}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {bookings.length === 0 && (
          <Section title="Your bookings">
            <p className="text-sm text-[var(--color-muted)]">No bookings yet.</p>
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
