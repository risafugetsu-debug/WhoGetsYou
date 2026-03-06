'use client';

import type {
  UserRole,
  PostBrideWeddingDetails,
  PreBrideWeddingDetails,
  VenueType,
} from './types';
import { VENUE_OPTIONS } from './types';

interface StepWeddingDetailsProps {
  role: UserRole;
  data: PostBrideWeddingDetails | PreBrideWeddingDetails;
  onChange: (data: PostBrideWeddingDetails | PreBrideWeddingDetails) => void;
  errors: Partial<Record<string, string>>;
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const POST_BRIDE_YEARS = Array.from({ length: 15 }, (_, i) => currentYear - i);
const PRE_BRIDE_YEARS = Array.from({ length: 5 }, (_, i) => currentYear + i);

const selectBase =
  'w-full rounded-xl border px-4 py-2.5 text-sm bg-[var(--background)] text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)]';

export default function StepWeddingDetails({ role, data, onChange, errors }: StepWeddingDetailsProps) {
  const isPreBride = role === 'pre-bride';
  const preBrideData = isPreBride ? (data as PreBrideWeddingDetails) : null;

  function update(key: string, value: string | boolean | null) {
    onChange({ ...data, [key]: value } as PostBrideWeddingDetails | PreBrideWeddingDetails);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-[var(--color-charcoal)]">
          {isPreBride ? 'Your wedding plans' : 'Your wedding'}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {isPreBride
            ? 'Helps us match you with gowns that suit your setting.'
            : 'Gives pre-brides a sense of where your dress has been.'}
        </p>
      </div>

      {/* Venue */}
      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
          {isPreBride ? 'Venue type' : 'Where did you wear your dress?'}
        </label>

        {isPreBride && preBrideData?.venueUndecided ? (
          <p className="text-sm text-[var(--color-muted)] italic py-2">Not decided yet</p>
        ) : (
          <select
            value={data.venue ?? ''}
            onChange={(e) => update('venue', (e.target.value as VenueType) || null)}
            className={`${selectBase} ${errors.venue ? 'border-red-300' : 'border-[var(--color-border)]'}`}
          >
            <option value="">Select a venue type</option>
            {VENUE_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        )}

        {isPreBride && (
          <label className="mt-2 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preBrideData?.venueUndecided ?? false}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange({ ...data, venueUndecided: checked, venue: checked ? null : data.venue } as PreBrideWeddingDetails);
              }}
              className="rounded border-[var(--color-border)] text-[var(--color-rose)] focus:ring-[var(--color-rose)]"
            />
            <span className="text-sm text-[var(--color-muted)]">Not decided yet</span>
          </label>
        )}

        {errors.venue && <p className="text-red-400 text-xs mt-1">{errors.venue}</p>}
      </div>

      {/* Wedding date */}
      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
          {isPreBride ? 'Wedding date' : 'When was your wedding?'}
        </label>

        {isPreBride && preBrideData?.dateUndecided ? (
          <p className="text-sm text-[var(--color-muted)] italic py-2">Date not decided</p>
        ) : (
          <div className="flex gap-3">
            <select
              value={data.weddingMonth}
              onChange={(e) => update('weddingMonth', e.target.value)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm bg-[var(--background)] text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] ${
                errors.weddingMonth ? 'border-red-300' : 'border-[var(--color-border)]'
              }`}
            >
              <option value="">Month</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={data.weddingYear}
              onChange={(e) => update('weddingYear', e.target.value)}
              className={`w-28 rounded-xl border px-3 py-2.5 text-sm bg-[var(--background)] text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] ${
                errors.weddingYear ? 'border-red-300' : 'border-[var(--color-border)]'
              }`}
            >
              <option value="">Year</option>
              {(isPreBride ? PRE_BRIDE_YEARS : POST_BRIDE_YEARS).map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {isPreBride && (
          <label className="mt-2 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preBrideData?.dateUndecided ?? false}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange({ ...data, dateUndecided: checked, weddingMonth: checked ? '' : data.weddingMonth, weddingYear: checked ? '' : data.weddingYear } as PreBrideWeddingDetails);
              }}
              className="rounded border-[var(--color-border)] text-[var(--color-rose)] focus:ring-[var(--color-rose)]"
            />
            <span className="text-sm text-[var(--color-muted)]">Date not decided yet</span>
          </label>
        )}

        {(errors.weddingMonth || errors.weddingYear) && (
          <p className="text-red-400 text-xs mt-1">Please select a month and year</p>
        )}
      </div>
    </div>
  );
}
