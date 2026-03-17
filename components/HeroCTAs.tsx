'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HeroCTAs() {
  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleLenderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), first_name: firstName.trim() || null }),
    });

    setSubmitting(false);
    if (!res.ok) { setError('Something went wrong. Please try again.'); return; }
    setSubmitted(true);
  }

  return (
    <div className="mt-10 mx-auto grid max-w-2xl gap-4 sm:grid-cols-2 text-left w-full">
      {/* Card 1 — Post-bride lender */}
      <div className="rounded-2xl border border-[var(--color-border)] p-6">
        <h3 className="text-lg font-medium text-[var(--color-charcoal)]">
          I wore my dress once.
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
          It&apos;s been in a bag since the wedding. I&apos;d love for someone else to wear it.
        </p>

        {submitted ? (
          <p className="mt-4 text-sm text-[var(--color-rose)] leading-relaxed">
            You&apos;re on the list. We&apos;ll reach out when we launch.
          </p>
        ) : showForm ? (
          <form onSubmit={handleLenderSubmit} className="mt-4 space-y-2">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)]"
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)]"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[var(--color-charcoal)] px-6 py-2.5 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Join the list →'}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-full bg-[var(--color-charcoal)] px-6 py-2.5 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)]"
          >
            List my dress →
          </button>
        )}
      </div>

      {/* Card 2 — Pre-bride renter */}
      <div className="rounded-2xl border border-[var(--color-border)] p-6">
        <h3 className="text-lg font-medium text-[var(--color-charcoal)]">
          I&apos;m still looking for my dress.
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
          Tell us what you&apos;re looking for — we&apos;ll notify you when a match lists.
        </p>
        <Link
          href="/dress-request"
          className="mt-4 inline-block rounded-full border border-[var(--color-charcoal)] px-6 py-2.5 text-sm text-[var(--color-charcoal)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]"
        >
          Submit my dress request →
        </Link>
      </div>
    </div>
  );
}
