'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'pending' | 'not_found'>('loading');

  useEffect(() => {
    async function check() {
      const { data } = await supabase
        .from('bookings')
        .select('status')
        .eq('stripe_checkout_session_id', id)
        .single();

      if (!data) { setStatus('not_found'); return; }
      if (data.status === 'booked' || data.status === 'completed') {
        setStatus('confirmed');
      } else {
        setTimeout(async () => {
          const { data: retry } = await supabase
            .from('bookings')
            .select('status')
            .eq('stripe_checkout_session_id', id)
            .single();
          setStatus(retry?.status === 'booked' || retry?.status === 'completed' ? 'confirmed' : 'pending');
        }, 2000);
      }
    }
    check();
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Confirming your booking…</p>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 text-center">
        <div className="space-y-3">
          <p className="text-sm text-red-500">Booking not found.</p>
          <Link href="/matches" className="text-sm text-[var(--color-rose)] hover:underline">Back to matches</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center space-y-4">
      <p className="text-4xl">🌸</p>
      <h1 className="text-2xl font-light text-[var(--color-charcoal)]">
        {status === 'confirmed' ? 'Booking confirmed' : 'Payment received'}
      </h1>
      <p className="text-sm text-[var(--color-muted)] leading-relaxed">
        {status === 'confirmed'
          ? 'Your booking is confirmed. The seller will be in touch to arrange the handover.'
          : 'Your payment was received. Your booking is being confirmed — this usually takes a moment.'}
      </p>
      <Link
        href="/matches"
        className="mt-4 inline-block rounded-full bg-[var(--color-rose)] px-8 py-3 text-sm text-white transition-colors hover:bg-[var(--color-rose-dark)]"
      >
        Back to matches
      </Link>
    </div>
  );
}
