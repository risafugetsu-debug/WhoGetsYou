'use client';

interface NavigationButtonsProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export default function NavigationButtons({
  step,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
}: NavigationButtonsProps) {
  const isLast = step === totalSteps;

  return (
    <div className="mt-8 flex items-center justify-between">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          ← Back
        </button>
      ) : (
        <div />
      )}

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-full bg-[var(--color-rose)] px-7 py-3 text-sm text-white transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-60"
        >
          Create my profile
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[var(--color-rose)] px-7 py-3 text-sm text-white transition-colors hover:bg-[var(--color-rose-dark)]"
        >
          Next →
        </button>
      )}
    </div>
  );
}
