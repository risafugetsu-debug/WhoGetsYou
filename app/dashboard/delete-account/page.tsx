'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function DeleteAccountContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'pre-bride' | 'post-bride' | null;
  const isPreBride = role !== 'post-bride';

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <p className="text-5xl">{isPreBride ? '💍' : '🤍'}</p>

      <h1 className="mt-6 text-3xl font-light tracking-wide text-[var(--color-charcoal)]">
        {isPreBride
          ? 'Congratulations, newlywed!'
          : 'Your gown found its next love story.'}
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
        {isPreBride
          ? "We're so glad WhoGetsYou was part of your journey. Wishing you a lifetime of happiness — and a gorgeous wedding day."
          : 'Thank you for trusting this community with your gown. We hope whoever wore it next felt just as beautiful as you did.'}
      </p>

      <div className="mt-10 space-y-3">
        <button
          className="w-full rounded-full bg-[var(--color-rose)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-rose-dark)]"
          onClick={() => {
            // TODO: call delete-account API once auth is wired
            // e.g. await supabase.auth.admin.deleteUser(session.user.id)
          }}
        >
          Close my account
        </button>
        <Link
          href="/dashboard/settings"
          className="block pt-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-charcoal)]"
        >
          Actually, not yet
        </Link>
      </div>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <Suspense>
      <DeleteAccountContent />
    </Suspense>
  );
}
