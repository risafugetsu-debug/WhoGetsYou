'use client';

import { useState } from 'react';
import { Measurements, MEASUREMENT_FIELDS } from '@/types/user';

interface MeasurementStepProps {
  measurements: Measurements;
  unitSystem: 'cm' | 'in';
  onMeasurementsChange: (measurements: Measurements) => void;
  onUnitSystemChange: (unit: 'cm' | 'in') => void;
  errors: Partial<Record<keyof Measurements, string>>;
}

export default function MeasurementStep({
  measurements,
  unitSystem,
  onMeasurementsChange,
  onUnitSystemChange,
  errors,
}: MeasurementStepProps) {
  const [cmData, setCmData] = useState<Record<string, string>>(unitSystem === 'cm' ? { ...measurements } : {});
  const [inData, setInData] = useState<Record<string, string>>(unitSystem === 'in' ? { ...measurements } : {});

  function publish(u: 'cm' | 'in', newCm: Record<string, string>, newIn: Record<string, string>) {
    const newMeas: Measurements = { ...measurements };
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      if (u === 'cm') {
        if (newCm[key] !== undefined) {
          newMeas[key] = newCm[key];
        } else if (newIn[key] !== undefined && newIn[key] !== '') {
          const val = parseFloat(newIn[key]);
          newMeas[key] = isNaN(val) ? '' : String((val * 2.54).toFixed(1));
        } else {
          newMeas[key] = '';
        }
      } else {
        if (newIn[key] !== undefined) {
          newMeas[key] = newIn[key];
        } else if (newCm[key] !== undefined && newCm[key] !== '') {
          const val = parseFloat(newCm[key]);
          newMeas[key] = isNaN(val) ? '' : String((val / 2.54).toFixed(1));
        } else {
          newMeas[key] = '';
        }
      }
    });
    onMeasurementsChange(newMeas);
  }

  function handleChange(key: keyof Measurements, value: string) {
    if (unitSystem === 'cm') {
      const newCm = { ...cmData, [key]: value };
      setCmData(newCm);
      publish('cm', newCm, inData);
    } else {
      const newIn = { ...inData, [key]: value };
      setInData(newIn);
      publish('in', cmData, newIn);
    }
  }

  function handleUnitToggle(newUnit: 'cm' | 'in') {
    if (newUnit === unitSystem) return;
    onUnitSystemChange(newUnit);
    publish(newUnit, cmData, inData);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">
          Your measurements
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Accurate measurements help us find your perfect fit. Take these with a soft measuring tape.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--color-muted)]">Units</span>
        <div className="flex rounded-full border border-[var(--color-border)] p-0.5">
          {(['cm', 'in'] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => handleUnitToggle(unit)}
              className={`rounded-full px-4 py-1 text-sm transition-colors ${unitSystem === unit
                ? 'bg-[var(--color-charcoal)] text-[var(--color-ivory)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-charcoal)]'
                }`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {MEASUREMENT_FIELDS.map(({ key, label, guide }) => (
          <div key={key}>
            <div className="mb-1.5 flex items-start justify-between gap-4">
              <label htmlFor={key} className="text-sm font-medium text-[var(--color-charcoal)]">
                {label}
              </label>
              <span className="max-w-xs text-right text-xs text-[var(--color-muted)] leading-snug">
                {guide}
              </span>
            </div>
            {key === 'height' && unitSystem === 'in' ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id={`${key}-ft`}
                    type="number"
                    min="0"
                    step="1"
                    value={measurements.height ? Math.floor(parseFloat(measurements.height) / 12) : ''}
                    onChange={(e) => {
                      const ft = parseFloat(e.target.value) || 0;
                      const inc = parseFloat(measurements.height) ? parseFloat(measurements.height) % 12 : 0;
                      handleChange('height', String(ft * 12 + inc));
                    }}
                    placeholder="0"
                    className={`w-20 rounded-lg border px-3 py-2 text-sm bg-[var(--background)] text-[var(--color-charcoal)] placeholder:text-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors ${errors[key] ? 'border-red-400' : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
                      }`}
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
                    value={measurements.height ? Math.floor(parseFloat(measurements.height) % 12) : ''}
                    onChange={(e) => {
                      let inc = parseFloat(e.target.value) || 0;
                      if (inc >= 12) inc = 11;
                      const ft = parseFloat(measurements.height) ? Math.floor(parseFloat(measurements.height) / 12) : 0;
                      handleChange('height', String(ft * 12 + inc));
                    }}
                    placeholder="0"
                    className={`w-20 rounded-lg border px-3 py-2 text-sm bg-[var(--background)] text-[var(--color-charcoal)] placeholder:text-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors ${errors[key] ? 'border-red-400' : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
                      }`}
                  />
                  <span className="text-sm text-[var(--color-muted)]">in</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  id={key}
                  type="number"
                  min="0"
                  step="0.1"
                  value={measurements[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="0"
                  className={`w-20 rounded-lg border px-4 py-3 text-sm bg-[var(--background)] text-[var(--color-charcoal)] placeholder:text-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors ${errors[key]
                    ? 'border-red-400'
                    : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
                    }`}
                />
                <span className="text-sm text-[var(--color-muted)]">{unitSystem}</span>
              </div>
            )}
            {errors[key] && (
              <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
