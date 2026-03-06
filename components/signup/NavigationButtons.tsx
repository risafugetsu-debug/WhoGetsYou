interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  nextDisabled?: boolean;
  submitDisabled?: boolean;
}

export default function NavigationButtons({
  onBack,
  onNext,
  onSubmit,
  nextDisabled = false,
  submitDisabled = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
      {onBack ? (
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          ← Back
        </button>
      ) : (
        <div />
      )}

      {onSubmit ? (
        <button
          onClick={onSubmit}
          disabled={submitDisabled}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-zinc-900 rounded-full hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-zinc-900 rounded-full hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      )}
    </div>
  );
}
