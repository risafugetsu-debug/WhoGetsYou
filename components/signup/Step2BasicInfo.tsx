'use client';

import { useState } from 'react';
import type { BasicInfoData, EthnicityOption } from './types';
import { ETHNICITY_OPTIONS } from './types';

interface Step2BasicInfoProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  errors: Partial<Record<keyof BasicInfoData, string>>;
}

const inputBase =
  'w-full rounded-xl border px-4 py-2.5 text-sm bg-[var(--background)] text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)]';

function validateField(field: keyof BasicInfoData, data: BasicInfoData): string {
  switch (field) {
    case 'firstName':
      return data.firstName.trim() ? '' : 'Required';
    case 'email': {
      const e = data.email;
      return e.trim() && e.includes('@') && e.slice(e.indexOf('@')).includes('.')
        ? ''
        : 'Valid email required';
    }
    case 'password':
      return data.password.length >= 8 ? '' : 'Min 8 characters';
    case 'confirmPassword':
      return data.confirmPassword === data.password ? '' : 'Passwords do not match';
    default:
      return '';
  }
}

interface FieldProps {
  id: keyof BasicInfoData;
  label: string;
  value: string;
  error: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  type?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

function Field({ id, label, value, error, onChange, onBlur, type = 'text', inputProps }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${inputBase} ${error ? 'border-red-300' : 'border-[var(--color-border)]'}`}
        {...inputProps}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function Step2BasicInfo({ data, onChange, errors }: Step2BasicInfoProps) {
  const [touched, setTouched] = useState(new Set<keyof BasicInfoData>());

  function update(key: keyof BasicInfoData, value: string) {
    onChange({ ...data, [key]: value });
  }

  function markTouched(field: keyof BasicInfoData) {
    setTouched((prev) => new Set([...prev, field]));
  }

  function getError(field: keyof BasicInfoData): string {
    if (touched.has(field)) return validateField(field, data);
    return errors[field] ?? '';
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-light text-[var(--color-charcoal)]">About you</h2>

      <Field
        id="firstName"
        label="First name"
        value={data.firstName}
        error={getError('firstName')}
        onChange={(v) => update('firstName', v)}
        onBlur={() => markTouched('firstName')}
      />

      <Field
        id="email"
        label="Email"
        type="email"
        value={data.email}
        error={getError('email')}
        onChange={(v) => update('email', v)}
        onBlur={() => markTouched('email')}
      />

      <Field
        id="password"
        label="Password"
        type="password"
        value={data.password}
        error={getError('password')}
        onChange={(v) => update('password', v)}
        onBlur={() => markTouched('password')}
        inputProps={{ autoComplete: 'new-password' }}
      />

      <Field
        id="confirmPassword"
        label="Confirm password"
        type="password"
        value={data.confirmPassword}
        error={getError('confirmPassword')}
        onChange={(v) => update('confirmPassword', v)}
        onBlur={() => markTouched('confirmPassword')}
        inputProps={{ autoComplete: 'new-password' }}
      />

      <div>
        <label htmlFor="ethnicity" className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
          Ethnicity
        </label>
        <select
          id="ethnicity"
          value={data.ethnicity ?? ''}
          onChange={(e) =>
            onChange({ ...data, ethnicity: (e.target.value as EthnicityOption) || null })
          }
          className={`${inputBase} border-[var(--color-border)]`}
        >
          <option value="">Select (optional)</option>
          {ETHNICITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          Optional — used only for analytics.
        </p>
      </div>
    </div>
  );
}
