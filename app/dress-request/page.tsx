'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Outside NYC'] as const;
const SIZE_RANGES = ['0–2', '4–6', '8–10', '12–14', '16+'] as const;
const SILHOUETTES = ['A-line', 'Ball gown', 'Mermaid', 'Sheath', 'Tea-length'] as const;
const NECKLINES = ['V-neck', 'Sweetheart', 'Strapless', 'High neck', 'Off-shoulder'] as const;
const BUDGETS = ['Under $200', '$200–$400', '$400–$600', '$600+'] as const;

interface FormState {
  firstName: string;
  email: string;
  weddingMonth: string;
  borough: string;
  sizeRange: string;
  silhouettes: string[];
  necklines: string[];
  budget: string;
  designerVibe: string;
}

export default function DressRequestPage() {
  const [form, setForm] = useState<FormState>({
    firstName: '',
    email: '',
    weddingMonth: '',
    borough: '',
    sizeRange: '',
    silhouettes: [],
    necklines: [],
    budget: '',
    designerVibe: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);

  function toggleMulti(field: 'silhouettes' | 'necklines', value: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required';
    if (!form.borough) e.borough = 'Required';
    if (!form.sizeRange) e.sizeRange = 'Required';
    if (form.silhouettes.length === 0) e.silhouettes = 'Select at least one';
    if (!form.budget) e.budget = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');

    const { error } = await supabase.from('dress_requests').insert({
      first_name: form.firstName.trim(),
      email: form.email.trim(),
      wedding_month: form.weddingMonth || null,
      borough: form.borough,
      size_range: form.sizeRange,
      silhouettes: form.silhouettes,
      necklines: form.necklines,
      rental_budget: form.budget,
      designer_vibe: form.designerVibe.trim() || null,
    });

    setSubmitting(false);
    if (error) { setSubmitError('Something went wrong. Please try again.'); return; }
    setSubmitted(true);
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass = 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors';
  const pillBase = 'rounded-full px-4 py-2 text-sm transition-colors';
  const pillActive = 'bg-[var(--color-rose)] text-white';
  const pillInactive = 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]';

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-4xl mb-6">🤍</p>
        <h1 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)] mb-4">
          You&apos;re on the list.
        </h1>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-3">
          We&apos;ll email you the moment a dress that matches yours lists in NYC.
        </p>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-8">
          Know a post-bride with a beautiful dress sitting in a bag? Send her here.
        </p>
        <button
          type="button"
          onClick={handleShare}
          className="rounded-full bg-[var(--color-charcoal)] px-8 py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)]"
        >
          {copied ? 'Link copied!' : 'Share WhoGetsYou'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">
        Tell us about your dress.
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
        We&apos;ll match you when a post-bride lists something that fits.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* First name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">First name</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className={inputClass}
            placeholder="Your first name"
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Wedding date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-charcoal)]">
            Wedding date <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <p className="mb-1.5 text-xs text-[var(--color-muted)]">Approximate is fine</p>
          <input
            type="month"
            value={form.weddingMonth}
            onChange={(e) => setForm((f) => ({ ...f, weddingMonth: e.target.value }))}
            className={inputClass}
          />
        </div>

        {/* Borough */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">NYC borough</label>
          <select
            value={form.borough}
            onChange={(e) => setForm((f) => ({ ...f, borough: e.target.value }))}
            className={inputClass}
          >
            <option value="">Select borough</option>
            {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.borough && <p className="mt-1 text-xs text-red-500">{errors.borough}</p>}
        </div>

        {/* Dress size range */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">Dress size range</label>
          <select
            value={form.sizeRange}
            onChange={(e) => setForm((f) => ({ ...f, sizeRange: e.target.value }))}
            className={inputClass}
          >
            <option value="">Select size range</option>
            {SIZE_RANGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.sizeRange && <p className="mt-1 text-xs text-red-500">{errors.sizeRange}</p>}
        </div>

        {/* Silhouette — required multi-select */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Silhouette</p>
          <div className="flex flex-wrap gap-2">
            {SILHOUETTES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleMulti('silhouettes', s)}
                className={`${pillBase} ${form.silhouettes.includes(s) ? pillActive : pillInactive}`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.silhouettes && <p className="mt-1.5 text-xs text-red-500">{errors.silhouettes}</p>}
        </div>

        {/* Neckline — optional multi-select */}
        <div>
          <p className="mb-1 text-sm font-medium text-[var(--color-charcoal)]">
            Neckline <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {NECKLINES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggleMulti('necklines', n)}
                className={`${pillBase} ${form.necklines.includes(n) ? pillActive : pillInactive}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Rental budget */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">Rental budget</label>
          <select
            value={form.budget}
            onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            className={inputClass}
          >
            <option value="">Select budget</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.budget && <p className="mt-1 text-xs text-red-500">{errors.budget}</p>}
        </div>

        {/* Dream designer or vibe */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">
            Dream designer or vibe <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <input
            type="text"
            value={form.designerVibe}
            onChange={(e) => setForm((f) => ({ ...f, designerVibe: e.target.value }))}
            className={inputClass}
            placeholder="Vera Wang, minimalist, lacy, etc."
          />
        </div>

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[var(--color-charcoal)] py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Notify me when there\'s a match →'}
        </button>
      </form>
    </div>
  );
}
