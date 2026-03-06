'use client';

import type { UserRole, PreBrideStyle, PostBrideStyle, NecklineStyle, SilhouetteStyle, FabricMaterial } from './types';
import { isPreBrideStyle } from './types';
import StyleStep from './StyleStep';

interface Step4StyleProps {
  role: UserRole;
  data: PreBrideStyle | PostBrideStyle;
  onChange: (data: PreBrideStyle | PostBrideStyle) => void;
  errors: Partial<Record<string, string>>;
}

export default function Step4Style({ role, data, onChange, errors }: Step4StyleProps) {
  if (role === 'pre-bride') {
    const d = data as PreBrideStyle;
    return (
      <StyleStep
        mode="multi"
        selectedNecklines={d.necklines}
        selectedSilhouettes={d.silhouettes}
        selectedMaterials={d.materials}
        onNecklinesChange={(v) => onChange({ ...d, necklines: v })}
        onSilhouettesChange={(v) => onChange({ ...d, silhouettes: v })}
        onMaterialsChange={(v) => onChange({ ...d, materials: v })}
        errors={{
          necklines: errors.necklines,
          silhouettes: errors.silhouettes,
          materials: errors.materials,
        }}
      />
    );
  }

  const d = data as PostBrideStyle;
  return (
    <StyleStep
      mode="single"
      selectedNeckline={d.neckline}
      selectedSilhouette={d.silhouette}
      selectedMaterials={d.materials}
      onNecklineChange={(v: NecklineStyle) => onChange({ ...d, neckline: v })}
      onSilhouetteChange={(v: SilhouetteStyle) => onChange({ ...d, silhouette: v })}
      onMaterialsChange={(v: FabricMaterial[]) => onChange({ ...d, materials: v })}
      errors={{
        neckline: errors.neckline,
        silhouette: errors.silhouette,
        materials: errors.materials,
      }}
    />
  );
}
