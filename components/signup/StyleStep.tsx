'use client';

import {
  NecklineStyle,
  SilhouetteStyle,
  FabricMaterial,
  NECKLINE_OPTIONS,
  SILHOUETTE_OPTIONS,
  FABRIC_OPTIONS,
} from '@/types/user';

interface SingleStyleStepProps {
  mode: 'single';
  selectedNeckline: NecklineStyle | null;
  selectedSilhouette: SilhouetteStyle | null;
  selectedMaterials: FabricMaterial[];
  onNecklineChange: (v: NecklineStyle) => void;
  onSilhouetteChange: (v: SilhouetteStyle) => void;
  onMaterialsChange: (v: FabricMaterial[]) => void;
  errors: { neckline?: string; silhouette?: string; materials?: string };
}

interface MultiStyleStepProps {
  mode: 'multi';
  selectedNecklines: NecklineStyle[];
  selectedSilhouettes: SilhouetteStyle[];
  selectedMaterials: FabricMaterial[];
  onNecklinesChange: (v: NecklineStyle[]) => void;
  onSilhouettesChange: (v: SilhouetteStyle[]) => void;
  onMaterialsChange: (v: FabricMaterial[]) => void;
  errors: { necklines?: string; silhouettes?: string; materials?: string };
}

type StyleStepProps = SingleStyleStepProps | MultiStyleStepProps;

function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm transition-all ${
        selected
          ? 'border-[var(--color-rose)] bg-[var(--color-blush)] text-[var(--color-charcoal)] ring-1 ring-[var(--color-rose)]'
          : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-rose)] hover:text-[var(--color-charcoal)]'
      }`}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">
      {children}
    </h3>
  );
}

export default function StyleStep(props: StyleStepProps) {
  if (props.mode === 'single') {
    const { selectedNeckline, selectedSilhouette, selectedMaterials, onNecklineChange, onSilhouetteChange, onMaterialsChange, errors } = props;

    function toggleMaterial(m: FabricMaterial) {
      onMaterialsChange(
        selectedMaterials.includes(m)
          ? selectedMaterials.filter((x) => x !== m)
          : [...selectedMaterials, m]
      );
    }

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">
            Your dress
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Tell us about the style of your gown.
          </p>
        </div>

        <div className="space-y-3">
          <SectionLabel>Neckline</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {NECKLINE_OPTIONS.map((n) => (
              <OptionCard
                key={n}
                label={n}
                selected={selectedNeckline === n}
                onClick={() => onNecklineChange(n)}
              />
            ))}
          </div>
          {errors.neckline && <p className="text-xs text-red-500">{errors.neckline}</p>}
        </div>

        <div className="space-y-3">
          <SectionLabel>Silhouette</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {SILHOUETTE_OPTIONS.map((s) => (
              <OptionCard
                key={s}
                label={s}
                selected={selectedSilhouette === s}
                onClick={() => onSilhouetteChange(s)}
              />
            ))}
          </div>
          {errors.silhouette && <p className="text-xs text-red-500">{errors.silhouette}</p>}
        </div>

        <div className="space-y-3">
          <SectionLabel>Fabric / Material</SectionLabel>
          <p className="text-xs text-[var(--color-muted)]">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {FABRIC_OPTIONS.map((m) => (
              <OptionCard
                key={m}
                label={m}
                selected={selectedMaterials.includes(m)}
                onClick={() => toggleMaterial(m)}
              />
            ))}
          </div>
          {errors.materials && <p className="text-xs text-red-500">{errors.materials}</p>}
        </div>
      </div>
    );
  }

  const { selectedNecklines, selectedSilhouettes, selectedMaterials, onNecklinesChange, onSilhouettesChange, onMaterialsChange, errors } = props;

  function toggleNeckline(n: NecklineStyle) {
    onNecklinesChange(
      selectedNecklines.includes(n)
        ? selectedNecklines.filter((x) => x !== n)
        : [...selectedNecklines, n]
    );
  }

  function toggleSilhouette(s: SilhouetteStyle) {
    onSilhouettesChange(
      selectedSilhouettes.includes(s)
        ? selectedSilhouettes.filter((x) => x !== s)
        : [...selectedSilhouettes, s]
    );
  }

  function toggleMaterial(m: FabricMaterial) {
    onMaterialsChange(
      selectedMaterials.includes(m)
        ? selectedMaterials.filter((x) => x !== m)
        : [...selectedMaterials, m]
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">
          Your style preferences
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Select everything that appeals to you — the more you share, the better your matches.
        </p>
      </div>

      <div className="space-y-3">
        <SectionLabel>Neckline</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {NECKLINE_OPTIONS.map((n) => (
            <OptionCard
              key={n}
              label={n}
              selected={selectedNecklines.includes(n)}
              onClick={() => toggleNeckline(n)}
            />
          ))}
        </div>
        {errors.necklines && <p className="text-xs text-red-500">{errors.necklines}</p>}
      </div>

      <div className="space-y-3">
        <SectionLabel>Silhouette</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {SILHOUETTE_OPTIONS.map((s) => (
            <OptionCard
              key={s}
              label={s}
              selected={selectedSilhouettes.includes(s)}
              onClick={() => toggleSilhouette(s)}
            />
          ))}
        </div>
        {errors.silhouettes && <p className="text-xs text-red-500">{errors.silhouettes}</p>}
      </div>

      <div className="space-y-3">
        <SectionLabel>Fabric / Material</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {FABRIC_OPTIONS.map((m) => (
            <OptionCard
              key={m}
              label={m}
              selected={selectedMaterials.includes(m)}
              onClick={() => toggleMaterial(m)}
            />
          ))}
        </div>
        {errors.materials && <p className="text-xs text-red-500">{errors.materials}</p>}
      </div>
    </div>
  );
}
