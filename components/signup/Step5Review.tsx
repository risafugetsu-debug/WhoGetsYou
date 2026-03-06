import {
  SignupFormData,
  isPreBrideMeasurements,
  isPreBrideStyle,
} from "./types";
import NavigationButtons from "./NavigationButtons";

interface Step5ReviewProps {
  formData: SignupFormData;
  onEdit: (step: 1 | 2 | 3 | 4) => void;
  onSubmit: () => void;
  onBack: () => void;
}

function formatHeight(feet: string, inches: string) {
  return `${feet} ft ${inches} in`;
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-zinc-100 last:border-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{title}</p>
        <button
          onClick={onEdit}
          className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900 transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="text-sm text-zinc-800 space-y-1">{children}</div>
    </div>
  );
}

export default function Step5Review({
  formData,
  onEdit,
  onSubmit,
  onBack,
}: Step5ReviewProps) {
  const { step1, step2, step3, step4 } = formData;

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-1">Review your info</h2>
      <p className="text-sm text-zinc-500 mb-6">
        Everything look good? You can edit any section before submitting.
      </p>

      <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 divide-y divide-zinc-100">
        <Section title="Role" onEdit={() => onEdit(1)}>
          <p>{step1.role === "pre-bride" ? "Pre-bride — Looking for a dress" : "Post-bride — Sharing a dress"}</p>
        </Section>

        <Section title="Basic info" onEdit={() => onEdit(2)}>
          <p>{step2.firstName} {step2.lastName}</p>
          <p>{step2.email}</p>
          <p>Age {step2.age} &middot; ZIP {step2.zipCode}</p>
          {step2.ethnicity && <p>Ethnicity: {step2.ethnicity}</p>}
        </Section>

        <Section title="Measurements" onEdit={() => onEdit(3)}>
          {step3 && (
            <>
              <p>Height: {formatHeight(step3.heightFeet, step3.heightInches)}</p>
              {isPreBrideMeasurements(step3) ? (
                <>
                  <p>Bust: {step3.bust} in &middot; Waist: {step3.waist} in &middot; Hips: {step3.hips} in</p>
                </>
              ) : (
                <>
                  <p>
                    Dress bust: {step3.dressBust} in &middot; Dress waist: {step3.dressWaist} in &middot; Dress hips:{" "}
                    {step3.dressHips} in
                  </p>
                </>
              )}
            </>
          )}
        </Section>

        <Section title="Style" onEdit={() => onEdit(4)}>
          {step4 && (
            <p>
              {isPreBrideStyle(step4)
                ? step4.preferredStyles.join(", ")
                : step4.dressStyle ?? "—"}
            </p>
          )}
        </Section>
      </div>

      <NavigationButtons onBack={onBack} onSubmit={onSubmit} />
    </div>
  );
}
