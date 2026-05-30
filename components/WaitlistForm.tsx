'use client';

import { useState } from 'react';

export default function WaitlistForm() {
  const [role, setRole] = useState<'post-bride' | 'pre-bride'>('pre-bride');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), first_name: firstName.trim(), role }),
    });

    setStatus(res.ok ? 'success' : 'error');
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-2">
        <p className="text-2xl">🌸</p>
        <p className="text-base font-light text-[var(--color-charcoal)]">You&apos;re on the list.</p>
        <p className="text-sm text-[var(--color-muted)]">We&apos;ll reach out as WhoGetsYou grows.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
      {/* Role toggle */}
      <div className="flex rounded-full border border-[var(--color-border)] p-1 text-sm">
        {(['pre-bride', 'post-bride'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${
              role === r
                ? 'bg-[var(--color-charcoal)] text-white'
                : 'text-[var(--color-muted)] hover:text-[var(--color-charcoal)]'
            }`}
          >
            {r === 'pre-bride' ? 'Looking for a gown' : 'Have a gown to list'}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full rounded-full border border-[var(--color-border)] bg-[var(--background)] px-5 py-3 text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
      />

      <input
        type="email"
        required
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-full border border-[var(--color-border)] bg-[var(--background)] px-5 py-3 text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
      />

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-full bg-[var(--color-rose)] py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Stay in the loop'}
      </button>

      {status === 'error' && (
        <p className="text-center text-xs text-red-500">Something went wrong — please try again.</p>
      )}

      <p className="text-center text-xs text-[var(--color-muted)]">No spam. Just updates when we launch and grow.</p>
    </form>
  );
}
