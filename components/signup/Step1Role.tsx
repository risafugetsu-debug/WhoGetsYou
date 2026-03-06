'use client';

import type { RoleData, UserRole } from './types';

interface Step1RoleProps {
  data: RoleData;
  onChange: (data: RoleData) => void;
}

const cards: { role: UserRole; heading: string; subtext: string }[] = [
  {
    role: 'pre-bride',
    heading: "I'm looking for a dress",
    subtext: 'Borrow a loved gown that fits you perfectly.',
  },
  {
    role: 'post-bride',
    heading: 'I wore it, now I want to share the happiness',
    subtext: 'Lend your gown and let another bride have her moment in it.',
  },
];

export default function Step1Role({ data, onChange }: Step1RoleProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-light text-[var(--color-charcoal)]">
        What brings you here?
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {cards.map(({ role, heading, subtext }) => {
          const selected = data.role === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange({ role })}
              className={`rounded-2xl p-6 text-left w-full transition-all ${
                selected
                  ? 'border-2 border-[var(--color-rose)] bg-[var(--color-blush)]'
                  : 'border border-[var(--color-border)] hover:border-[var(--color-rose)]'
              }`}
            >
              <p className="text-sm font-medium text-[var(--color-charcoal)]">{heading}</p>
              <p className="mt-1.5 text-xs text-[var(--color-muted)]">{subtext}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
