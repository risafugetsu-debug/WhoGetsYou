interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export default function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{stepLabels[currentStep - 1]}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < currentStep
                ? 'bg-[var(--color-rose)]'
                : 'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
