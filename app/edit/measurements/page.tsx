'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const FIELDS: { key: string; label: string; guide: string }[] = [
  { key: 'height', label: 'Height', guide: 'Stand against a wall without shoes. Measure from floor to top of head.' },
  { key: 'neck_to_waist', label: 'Neck to Waist', guide: 'From the base of your neck down to your natural waist.' },
  { key: 'shoulder_width', label: 'Shoulder Width', guide: 'Across the back from the tip of one shoulder to the other.' },
  { key: 'bust_top', label: 'Bust (Upper)', guide: 'Around the fullest part of your chest, tape level and parallel to the floor.' },
  { key: 'under_bust', label: 'Under Bust', guide: 'Directly under your bust, around your ribcage. Snug but not tight.' },
  { key: 'waist', label: 'Waist', guide: 'Around your natural waist — the narrowest part of your torso.' },
  { key: 'high_hip', label: 'High Hip', guide: 'Around your body approximately 4 inches (10 cm) below your natural waist.' },
  { key: 'low_hip', label: 'Low Hip', guide: 'Around the fullest part of your hips, usually 7–9 inches below your waist.' },
  { key: 'arm_length', label: 'Arm Length', guide: 'Arm slightly bent, from the tip of your shoulder to your wrist bone.' },
];

type FormState = Record<string, string> & { unit_system: string };

export default function EditMeasurementsPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    unit_system: 'cm',
    height: '', neck_to_waist: '', shoulder_width: '',
    bust_top: '', under_bust: '', waist: '',
    high_hip: '', low_hip: '', arm_length: '',
  });
  const [cmData, setCmData] = useState<Record<string, string>>({});
  const [inData, setInData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }

      const { data } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        const sourceData = {
          height: String(data.height || ''),
          neck_to_waist: String(data.neck_to_waist || ''),
          shoulder_width: String(data.shoulder_width || ''),
          bust_top: String(data.bust_top || ''),
          under_bust: String(data.under_bust || ''),
          waist: String(data.waist || ''),
          high_hip: String(data.high_hip || ''),
          low_hip: String(data.low_hip || ''),
          arm_length: String(data.arm_length || ''),
        };
        setForm({
          unit_system: data.unit_system,
          ...sourceData,
        });
        if (data.unit_system === 'in') setInData(sourceData);
        else setCmData(sourceData);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const field of FIELDS) {
      const val = parseFloat(form[field.key]);
      if (!form[field.key] || isNaN(val) || val <= 0) {
        newErrors[field.key] = 'Required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('measurements').update({
      unit_system: form.unit_system,
      height: parseFloat(form.height),
      neck_to_waist: parseFloat(form.neck_to_waist),
      shoulder_width: parseFloat(form.shoulder_width),
      bust_top: parseFloat(form.bust_top),
      under_bust: parseFloat(form.under_bust),
      waist: parseFloat(form.waist),
      high_hip: parseFloat(form.high_hip),
      low_hip: parseFloat(form.low_hip),
      arm_length: parseFloat(form.arm_length),
    }).eq('user_id', session.user.id);

    setSaving(false);
    if (!error) router.push('/dashboard');
  }

  function handleUnitToggle(newUnit: string) {
    if (newUnit === form.unit_system) return;

    const updatedForm: FormState = { ...form, unit_system: newUnit };

    for (const field of FIELDS) {
      if (newUnit === 'cm') {
        if (cmData[field.key] !== undefined) {
          updatedForm[field.key as keyof FormState] = cmData[field.key];
        } else if (inData[field.key] !== undefined && inData[field.key] !== '') {
          const val = parseFloat(inData[field.key]);
          updatedForm[field.key as keyof FormState] = isNaN(val) ? '' : String((val * 2.54).toFixed(1));
        } else {
          updatedForm[field.key as keyof FormState] = '';
        }
      } else {
        if (inData[field.key] !== undefined) {
          updatedForm[field.key as keyof FormState] = inData[field.key];
        } else if (cmData[field.key] !== undefined && cmData[field.key] !== '') {
          const val = parseFloat(cmData[field.key]);
          updatedForm[field.key as keyof FormState] = isNaN(val) ? '' : String((val / 2.54).toFixed(1));
        } else {
          updatedForm[field.key as keyof FormState] = '';
        }
      }
    }

    setForm(updatedForm);
  }

  function handleChange(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (form.unit_system === 'cm') setCmData((prev) => ({ ...prev, [key]: val }));
    else setInData((prev) => ({ ...prev, [key]: val }));
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  const unit = form.unit_system;

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <Link href="/dashboard" className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">Edit measurements</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Unit toggle */}
        <div className="flex gap-2">
          {(['cm', 'in'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitToggle(u)}
              className={`rounded-full px-5 py-2 text-sm transition-colors ${unit === u
                ? 'bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                : 'border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-charcoal)]'
                }`}
            >
              {u}
            </button>
          ))}
        </div>

        {FIELDS.map(({ key, label, guide }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-[var(--color-charcoal)]">
              {label} <span className="text-[var(--color-muted)] font-normal">({unit})</span>
            </label>
            <p className="mb-2 text-xs text-[var(--color-muted)]">{guide}</p>
            {key === 'height' && unit === 'in' ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id={`${key}-ft`}
                    type="number"
                    min="0"
                    step="1"
                    value={form.height ? Math.floor(parseFloat(form.height) / 12) : ''}
                    onChange={(e) => {
                      const ft = parseFloat(e.target.value) || 0;
                      const inc = parseFloat(form.height) ? parseFloat(form.height) % 12 : 0;
                      handleChange('height', String(ft * 12 + inc));
                    }}
                    placeholder="0"
                    className={`w-20 rounded-xl border px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors ${errors[key] ? 'border-red-300' : 'border-[var(--color-border)]'
                      } bg-[var(--background)]`}
                  />
                  <span className="text-sm text-[var(--color-muted)]">ft</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={`${key}-in`}
                    type="number"
                    min="0"
                    max="11"
                    step="1"
                    value={form.height ? Math.floor(parseFloat(form.height) % 12) : ''}
                    onChange={(e) => {
                      let inc = parseFloat(e.target.value) || 0;
                      if (inc >= 12) inc = 11;
                      const ft = parseFloat(form.height) ? Math.floor(parseFloat(form.height) / 12) : 0;
                      handleChange('height', String(ft * 12 + inc));
                    }}
                    placeholder="0"
                    className={`w-20 rounded-xl border px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors ${errors[key] ? 'border-red-300' : 'border-[var(--color-border)]'
                      } bg-[var(--background)]`}
                  />
                  <span className="text-sm text-[var(--color-muted)]">in</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`w-20 rounded-xl border px-4 py-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors ${errors[key] ? 'border-red-300' : 'border-[var(--color-border)]'
                    } bg-[var(--background)]`}
                />
                <span className="text-sm text-[var(--color-muted)]">{unit}</span>
              </div>
            )}
            {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--color-charcoal)] py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save measurements'}
        </button>
      </form>
    </div>
  );
}
