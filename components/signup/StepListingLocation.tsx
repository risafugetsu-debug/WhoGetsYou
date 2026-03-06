'use client';

import type { ListingLocationData } from './types';
import { NYC_BOROUGHS } from './types';

interface StepListingLocationProps {
  data: ListingLocationData;
  onChange: (data: ListingLocationData) => void;
  errors: Partial<Record<string, string>>;
}

const inputBase =
  'w-full rounded-xl border px-4 py-2.5 text-sm bg-[var(--background)] text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)]';

export default function StepListingLocation({ data, onChange, errors }: StepListingLocationProps) {
  function update(key: keyof ListingLocationData, value: string | null) {
    onChange({ ...data, [key]: value });
  }

  const isNYC = data.city.trim().toLowerCase().replace(/\s+/g, '') === 'newyorkcity'
    || data.city.trim().toLowerCase() === 'new york'
    || data.city.trim().toLowerCase() === 'nyc';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-[var(--color-charcoal)]">
          Location & availability
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Helps pre-brides find gowns near them and know when yours is free.
        </p>
      </div>

      {/* City */}
      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
          City
        </label>
        <input
          type="text"
          value={data.city}
          onChange={(e) => update('city', e.target.value)}
          className={`${inputBase} ${errors.city ? 'border-red-300' : 'border-[var(--color-border)]'}`}
          placeholder="New York"
        />
        {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
      </div>

      {/* Borough (NYC only) */}
      {isNYC && (
        <div>
          <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
            Borough
          </label>
          <select
            value={data.borough ?? ''}
            onChange={(e) => update('borough', e.target.value || null)}
            className={`${inputBase} ${errors.borough ? 'border-red-300' : 'border-[var(--color-border)]'}`}
          >
            <option value="">Select (optional)</option>
            {NYC_BOROUGHS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      )}

      {/* Availability */}
      <div className="space-y-4">
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] block">
          When is the dress available?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">From</label>
            <input
              type="date"
              value={data.availableFrom}
              onChange={(e) => update('availableFrom', e.target.value)}
              className={`${inputBase} ${errors.availableFrom ? 'border-red-300' : 'border-[var(--color-border)]'}`}
            />
            {errors.availableFrom && (
              <p className="text-red-400 text-xs mt-1">{errors.availableFrom}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">Until</label>
            <input
              type="date"
              value={data.availableUntil}
              onChange={(e) => update('availableUntil', e.target.value)}
              min={data.availableFrom || undefined}
              className={`${inputBase} ${errors.availableUntil ? 'border-red-300' : 'border-[var(--color-border)]'}`}
            />
            {errors.availableUntil && (
              <p className="text-red-400 text-xs mt-1">{errors.availableUntil}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
