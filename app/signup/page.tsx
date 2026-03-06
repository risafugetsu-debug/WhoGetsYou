'use client';

import Link from 'next/link';
import SignupWizard from '@/components/signup/SignupWizard';

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center py-16 px-6">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--background)] shadow-sm px-6 py-10">
        <SignupWizard />
      </div>
      <Link
        href="/"
        className="mt-6 text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  );
}
