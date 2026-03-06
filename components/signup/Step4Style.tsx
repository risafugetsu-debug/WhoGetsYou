import { useState } from "react";
import { UserRole, DressStyle, PreBrideStyle, PostBrideStyle } from "./types";
import NavigationButtons from "./NavigationButtons";

interface Step4StyleProps {
  role: UserRole;
  data: PreBrideStyle | PostBrideStyle;
  onChange: (data: PreBrideStyle | PostBrideStyle) => void;
  onNext: () => void;
  onBack: () => void;
}

const DRESS_STYLES: DressStyle[] = [
  "Ballgown",
  "A-line",
  "Mermaid",
  "Minimalist/Slip",
  "Princess",
  "Boho",
];

export default function Step4Style({
  role,
  data,
  onChange,
  onNext,
  onBack,
}: Step4StyleProps) {
  const [error, setError] = useState<string | null>(null);

  const isPreBride = role === "pre-bride";
  const preBrideData = isPreBride ? (data as PreBrideStyle) : null;
  const postBrideData = !isPreBride ? (data as PostBrideStyle) : null;

  function togglePreBrideStyle(style: DressStyle) {
    if (!preBrideData) return;
    const current = preBrideData.preferredStyles;
    const next = current.includes(style)
      ? current.filter((s) => s !== style)
      : [...current, style];
    onChange({ preferredStyles: next });
    if (next.length > 0) setError(null);
  }

  function selectPostBrideStyle(style: DressStyle) {
    onChange({ dressStyle: style });
    setError(null);
  }

  function handleNext() {
    if (isPreBride && preBrideData && preBrideData.preferredStyles.length === 0) {
      setError("Select at least one style");
      return;
    }
    if (!isPreBride && postBrideData && postBrideData.dressStyle === null) {
      setError("Select a style for your dress");
      return;
    }
    setError(null);
    onNext();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-1">
        {isPreBride ? "Style preferences" : "Your dress style"}
      </h2>
      <p className="text-sm text-zinc-500 mb-6">
        {isPreBride
          ? "Select all the styles you love. You can change this later."
          : "What silhouette best describes your dress?"}
      </p>

      <div className="flex flex-wrap gap-2">
        {DRESS_STYLES.map((style) => {
          const selected = isPreBride
            ? preBrideData?.preferredStyles.includes(style) ?? false
            : postBrideData?.dressStyle === style;

          return (
            <button
              key={style}
              onClick={() =>
                isPreBride ? togglePreBrideStyle(style) : selectPostBrideStyle(style)
              }
              className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {style}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      <NavigationButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}
