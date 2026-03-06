'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NECKLINE_OPTIONS, SILHOUETTE_OPTIONS, FABRIC_OPTIONS, NYC_BOROUGHS } from '@/types/user';

interface FormState {
  necklines: string[];
  silhouettes: string[];
  materials: string[];
  wedding_borough: string;
  wedding_date: string;
  date_undecided: boolean;
}

export default function EditPreferencesPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    necklines: [],
    silhouettes: [],
    materials: [],
    wedding_borough: '',
    wedding_date: '',
    date_undecided: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'pre-bride') { router.replace('/dashboard'); return; }

      const { data } = await supabase
        .from('style_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setForm({
          necklines: data.necklines ?? [],
          silhouettes: data.silhouettes ?? [],
          materials: data.materials ?? [],
          wedding_borough: data.wedding_borough ?? '',
          wedding_date: data.wedding_date ?? '',
          date_undecided: data.date_undecided ?? false,
        });
      }

      setLoading(false);
    }
    load();
  }, [router]);

  function toggle(field: 'necklines' | 'silhouettes' | 'materials', value: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((x) => x !== value)
        : [...f[field], value],
    }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (form.necklines.length === 0) e.necklines = 'Select at least one';
    if (form.silhouettes.length === 0) e.silhouettes = 'Select at least one';
    if (form.materials.length === 0) e.materials = 'Select at least one';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('style_preferences').update({
      necklines: form.necklines,
      silhouettes: form.silhouettes,
      materials: form.materials,
      wedding_borough: form.wedding_borough,
      wedding_date: form.date_undecided ? null : (form.wedding_date || null),
      date_undecided: form.date_undecided,
    }).eq('user_id', session.user.id);

    setSaving(false);
    if (!error) router.push('/dashboard');
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <Link href="/dashboard" className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">Edit style preferences</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Necklines */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Necklines <span className="text-[var(--color-muted)] font-normal">(select all you love)</span></p>
          <div className="flex flex-wrap gap-2">
            {NECKLINE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggle('necklines', n)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  form.necklines.includes(n)
                    ? 'bg-[var(--color-rose)] text-white'
                    : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {errors.necklines && <p className="mt-1.5 text-xs text-red-500">{errors.necklines}</p>}
        </div>

        {/* Silhouettes */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Silhouettes <span className="text-[var(--color-muted)] font-normal">(select all you love)</span></p>
          <div className="flex flex-wrap gap-2">
            {SILHOUETTE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggle('silhouettes', s)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  form.silhouettes.includes(s)
                    ? 'bg-[var(--color-rose)] text-white'
                    : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.silhouettes && <p className="mt-1.5 text-xs text-red-500">{errors.silhouettes}</p>}
        </div>

        {/* Fabrics */}
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-charcoal)]">Fabrics <span className="text-[var(--color-muted)] font-normal">(select all you love)</span></p>
          <div className="flex flex-wrap gap-2">
            {FABRIC_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggle('materials', m)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  form.materials.includes(m)
                    ? 'bg-[var(--color-rose)] text-white'
                    : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {errors.materials && <p className="mt-1.5 text-xs text-red-500">{errors.materials}</p>}
        </div>

        {/* Borough */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">
            Wedding borough <span className="text-[var(--color-muted)] font-normal">(optional)</span>
          </label>
          <select
            value={form.wedding_borough}
            onChange={(e) => setForm((f) => ({ ...f, wedding_borough: e.target.value }))}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
          >
            <option value="">Not decided</option>
            {NYC_BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-charcoal)]">
            Wedding date <span className="text-[var(--color-muted)] font-normal">(optional)</span>
          </label>
          <label className="mb-3 flex items-center gap-2 text-sm text-[var(--color-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={form.date_undecided}
              onChange={(e) => setForm((f) => ({ ...f, date_undecided: e.target.checked, wedding_date: '' }))}
              className="accent-[var(--color-rose)]"
            />
            Not decided yet
          </label>
          {!form.date_undecided && (
            <input
              type="date"
              value={form.wedding_date}
              onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--color-charcoal)] py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </form>
    </div>
  );
}
