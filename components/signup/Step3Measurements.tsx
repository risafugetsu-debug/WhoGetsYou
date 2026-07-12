'use client';

import type { UserRole, PreBrideMeasurements, PostBrideMeasurements } from './types';
import { NECKLINE_OPTIONS, type NecklineStyle } from '@/types/user';

const SHOULDER_NA_NECKLINES: NecklineStyle[] = ['Strapless', 'Off-shoulder', 'Halter'];
const SLEEVE_NA_NECKLINES: NecklineStyle[] = ['Strapless', 'Off-shoulder'];

interface Step3MeasurementsProps {
  role: UserRole;
  data: PreBrideMeasurements | PostBrideMeasurements;
  onChange: (data: PreBrideMeasurements | PostBrideMeasurements) => void;
  errors: Partial<Record<string, string>>;
  dressNeckline?: NecklineStyle | null;
  onNecklineChange?: (n: NecklineStyle) => void;
}

const inputBase =
  'w-24 rounded-xl border px-3 py-2.5 text-sm bg-[var(--background)] text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)]';

// Body measurement guides (pre-bride)
const PRE_BRIDE_FIELDS: { key: keyof PreBrideMeasurements; label: string; guide: string }[] = [
  {
    key: 'neckToWaist',
    label: 'Neck to Waist',
    guide: 'Measure from the base of your neck (where a necklace would sit) straight down to your natural waist.',
  },
  {
    key: 'shoulderWidth',
    label: 'Shoulder Width',
    guide: 'Measure across the back from the tip of one shoulder to the tip of the other.',
  },
  {
    key: 'bust',
    label: 'Bust',
    guide: 'Measure around the fullest part of your chest, keeping the tape level and parallel to the floor.',
  },
  {
    key: 'underBust',
    label: 'Under Bust',
    guide: 'Measure directly under your bust, around your ribcage. Keep the tape snug but not tight.',
  },
  {
    key: 'waist',
    label: 'Waist',
    guide: 'Measure around your natural waist — the narrowest part of your torso, usually just above the navel.',
  },
  {
    key: 'highHip',
    label: 'High Hip',
    guide: 'Measure around your body approximately 4 inches (10 cm) below your natural waist.',
  },
  {
    key: 'hips',
    label: 'Hips',
    guide: 'Measure around the fullest part of your hips and seat, usually 7–9 inches (18–23 cm) below your waist.',
  },
  {
    key: 'armLength',
    label: 'Arm Length',
    guide: 'With your arm slightly bent, measure from the tip of your shoulder to your wrist bone.',
  },
];

// Flat garment measurement guides (post-bride) — measure the dress, not the body
const POST_BRIDE_FIELDS: { key: keyof PostBrideMeasurements; label: string; guide: string }[] = [
  {
    key: 'dressNeckToWaist',
    label: 'Dress Neck to Waist',
    guide: 'Lay dress flat. Measure from the center-back neckline edge straight down to the waist seam.',
  },
  {
    key: 'dressShoulderWidth',
    label: 'Dress Shoulder Width',
    guide: 'Lay dress flat. Measure across the back bodice from one shoulder seam tip to the other.',
  },
  {
    key: 'dressBust',
    label: 'Dress Bust',
    guide: 'Lay dress flat. Measure across the bodice at the fullest bust point, edge to edge, then double it for the full circumference.',
  },
  {
    key: 'dressUnderBust',
    label: 'Dress Under Bust',
    guide: 'Lay dress flat. Measure just below the bust/underwire seam, edge to edge, then double it.',
  },
  {
    key: 'dressWaist',
    label: 'Dress Waist',
    guide: 'Lay dress flat. Measure the waist seam edge to edge, then double it.',
  },
  {
    key: 'dressHighHip',
    label: 'Dress High Hip',
    guide: 'Lay dress flat. Measure the skirt 4 inches below the waist seam, edge to edge, then double it.',
  },
  {
    key: 'dressHips',
    label: 'Dress Hips',
    guide: 'Lay dress flat. Measure the widest part of the hip area, edge to edge, then double it.',
  },
  {
    key: 'dressArmLength',
    label: 'Sleeve Length',
    guide: 'If the dress has sleeves, measure from shoulder seam to wrist edge. Leave blank if sleeveless.',
  },
];

function convertMeasurement(val: string, from: 'cm' | 'in', to: 'cm' | 'in'): string {
  if (!val) return '';
  const num = parseFloat(val);
  if (isNaN(num) || num === 0) return val;
  const converted = from === 'in' ? num * 2.54 : num / 2.54;
  return String(Math.round(converted * 10) / 10);
}

export default function Step3Measurements({
  role,
  data,
  onChange,
  errors,
  dressNeckline,
  onNecklineChange,
}: Step3MeasurementsProps) {
  const isPreBride = role === 'pre-bride';
  const values = data as unknown as Record<string, string | boolean>;

  function update(key: string, value: string | boolean) {
    onChange({ ...data, [key]: value } as PreBrideMeasurements | PostBrideMeasurements);
  }

  function handleNecklinePick(n: NecklineStyle) {
    const postData = data as PostBrideMeasurements;
    const shoulderNA = SHOULDER_NA_NECKLINES.includes(n);
    const sleeveNA = SLEEVE_NA_NECKLINES.includes(n);
    onChange({
      ...postData,
      dressShoulderWidthNA: shoulderNA,
      dressShoulderWidth: shoulderNA ? '' : postData.dressShoulderWidth,
      dressArmLengthNA: sleeveNA,
      dressArmLength: sleeveNA ? '' : postData.dressArmLength,
    });
    onNecklineChange?.(n);
  }

  function toggleUnit(to: 'cm' | 'in') {
    const from = values.unitSystem as 'cm' | 'in';
    if (from === to) return;

    // Convert height
    let heightUpdates: Record<string, string> = {};
    if (from === 'cm' && to === 'in') {
      const cm = parseFloat(values.heightCm as string);
      if (!isNaN(cm) && cm > 0) {
        const totalIn = cm / 2.54;
        heightUpdates = { heightFeet: String(Math.floor(totalIn / 12)), heightInches: String(Math.round(totalIn % 12)) };
      }
    } else {
      const ft = parseInt(values.heightFeet as string, 10);
      const inches = parseInt(values.heightInches as string, 10);
      if (!isNaN(ft) && !isNaN(inches)) {
        heightUpdates = { heightCm: String(Math.round((ft * 12 + inches) * 2.54)) };
      }
    }

    // Convert measurement fields (string fields only — NA booleans are not converted)
    const measureKeys = isPreBride
      ? ['bust', 'underBust', 'waist', 'highHip', 'hips', 'neckToWaist', 'shoulderWidth', 'armLength']
      : ['dressBust', 'dressUnderBust', 'dressWaist', 'dressHighHip', 'dressHips', 'dressNeckToWaist', 'dressShoulderWidth', 'dressArmLength', 'heelHeight'];

    const measureUpdates: Record<string, string> = {};
    for (const key of measureKeys) {
      measureUpdates[key] = convertMeasurement((values[key] as string) ?? '', from, to);
    }

    onChange({ ...data, unitSystem: to, ...heightUpdates, ...measureUpdates } as PreBrideMeasurements | PostBrideMeasurements);
  }

  const unitSystem = values.unitSystem as 'cm' | 'in';
  const unit = unitSystem === 'cm' ? 'cm' : 'in';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-[var(--color-charcoal)]">
          {isPreBride ? 'Your measurements' : 'Your dress measurements'}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {isPreBride
            ? 'Measure your body for the best fit match. Use a soft tape measure.'
            : 'Measure the actual dress fabric — not your body. Lay the dress flat.'}
        </p>
      </div>

      {/* Neckline quick-picker — post-bride only. Drives auto-inference of N/A fields. */}
      {!isPreBride && (
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Dress neckline</p>
          <p className="text-xs text-[var(--color-muted)] mb-2">
            Select your neckline — some measurement fields will auto-fill as N/A.
          </p>
          <div className="flex flex-wrap gap-2">
            {NECKLINE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleNecklinePick(n)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  dressNeckline === n
                    ? 'bg-[var(--color-rose)] text-white'
                    : 'border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-rose)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unit toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Units</span>
        <div className="flex rounded-full border border-[var(--color-border)] p-0.5">
          {(['cm', 'in'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => toggleUnit(u)}
              className={`rounded-full px-4 py-1 text-sm transition-colors ${
                unitSystem === u
                  ? 'bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-charcoal)]'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
          Height
        </label>
        {unitSystem === 'cm' ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={(values.heightCm as string) ?? ''}
              min={100}
              max={250}
              step={1}
              onChange={(e) => update('heightCm', e.target.value)}
              className={`${inputBase} ${errors.height ? 'border-red-300' : 'border-[var(--color-border)]'}`}
            />
            <span className="text-xs text-[var(--color-muted)]">cm</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={values.heightFeet as string}
                min={3}
                max={8}
                step={1}
                onChange={(e) => update('heightFeet', e.target.value)}
                className={`${inputBase} ${errors.height ? 'border-red-300' : 'border-[var(--color-border)]'}`}
              />
              <span className="text-xs text-[var(--color-muted)]">ft</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={values.heightInches as string}
                min={0}
                max={11}
                step={1}
                onChange={(e) => update('heightInches', e.target.value)}
                className={`${inputBase} ${errors.height ? 'border-red-300' : 'border-[var(--color-border)]'}`}
              />
              <span className="text-xs text-[var(--color-muted)]">in</span>
            </div>
          </div>
        )}
        {errors.height && <p className="text-red-400 text-xs mt-1">{errors.height}</p>}
      </div>

      {/* Heel height — post-bride only */}
      {!isPreBride && (
        <div>
          <label className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
            Heel Height <span className="normal-case font-normal">(optional)</span>
          </label>
          <p className="text-xs text-[var(--color-muted)] mb-1">Height of the heels you wore with the dress.</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              min={0}
              value={(values.heelHeight as string) ?? ''}
              onChange={(e) => update('heelHeight', e.target.value)}
              className={`${inputBase} border-[var(--color-border)]`}
              placeholder="0"
            />
            <span className="text-xs text-[var(--color-muted)]">{unit}</span>
          </div>
        </div>
      )}

      {/* Measurements */}
      <div className="space-y-5">
        {(isPreBride ? PRE_BRIDE_FIELDS : POST_BRIDE_FIELDS).map(({ key, label, guide }) => {
          const postData = !isPreBride ? (data as PostBrideMeasurements) : null;

          // Determine N/A state for this field
          let isNA = false;
          let isAutoNA = false;
          let naKey = '';
          let naTooltip = '';

          if (postData) {
            if (key === 'dressShoulderWidth') {
              isNA = postData.dressShoulderWidthNA;
              isAutoNA = postData.dressShoulderWidthNA;
              naKey = 'dressShoulderWidthNA';
              naTooltip = 'Not applicable for strapless, halter, and off-shoulder styles';
            } else if (key === 'dressUnderBust') {
              isNA = postData.dressUnderBustNA;
              naKey = 'dressUnderBustNA';
              naTooltip = 'Check if your dress has no underwire or boning (e.g., empire waist)';
            } else if (key === 'dressHighHip') {
              isNA = postData.dressHighHipNA;
              naKey = 'dressHighHipNA';
              naTooltip = 'Check if your dress has a very full skirt where this measurement is impractical (e.g., ball gown)';
            } else if (key === 'dressArmLength') {
              isNA = postData.dressArmLengthNA;
              isAutoNA = postData.dressArmLengthNA;
              naKey = 'dressArmLengthNA';
              naTooltip = 'Not applicable for sleeveless and strapless styles';
            }
          }

          return (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="shrink-0">
                <label className={`text-xs uppercase tracking-wider block mb-1 ${isNA ? 'text-[var(--color-muted)] opacity-50' : 'text-[var(--color-muted)]'}`}>
                  {label}
                </label>

                {isNA ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`${inputBase} border-[var(--color-border)] opacity-40 bg-stone-50 flex items-center`}>
                        <span className="text-xs text-[var(--color-muted)]">N/A</span>
                      </div>
                    </div>
                    {isAutoNA ? (
                      <button
                        type="button"
                        onClick={() => update(naKey, false)}
                        className="text-xs text-[var(--color-rose)] hover:underline"
                      >
                        This doesn&apos;t seem right — enter manually
                      </button>
                    ) : (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => update(naKey, false)}
                          className="rounded border-[var(--color-border)]"
                        />
                        <span className="text-xs text-[var(--color-muted)]">Not applicable</span>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={(values[key] as string) ?? ''}
                        onChange={(e) => update(key, e.target.value)}
                        className={`${inputBase} ${errors[key] ? 'border-red-300' : 'border-[var(--color-border)]'}`}
                      />
                      <span className="text-xs text-[var(--color-muted)]">{unit}</span>
                    </div>
                    {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}

                    {/* Manual N/A toggle — only for non-auto-inferred N/A-able post-bride fields */}
                    {naKey && !isAutoNA && (
                      <label className="flex items-center gap-1.5 cursor-pointer mt-1" title={naTooltip}>
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => {
                            onChange({
                              ...data,
                              [naKey]: true,
                              [key]: '',
                            } as PostBrideMeasurements);
                          }}
                          className="rounded border-[var(--color-border)]"
                        />
                        <span className="text-xs text-[var(--color-muted)]">Not applicable for this dress</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              <span className="text-xs text-[var(--color-muted)] text-right leading-snug max-w-[200px]">
                {isNA ? <span className="italic">Not applicable for this style</span> : guide}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
