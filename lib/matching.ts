// ============================================================
// WhoGetsYou — Matching Algorithm
// ============================================================
//
// Fit score (0–100): how closely a post-bride's measurements
// match the pre-bride's, weighted by alteration difficulty.
//
// Style score (0–100): how much the post-bride's gown style
// overlaps with the pre-bride's stated preferences.
//
// Combined score = 70% fit + 30% style
// ============================================================

const CM_PER_INCH = 2.54;

function toCm(value: number, unit: string): number {
  return unit === 'in' ? value * CM_PER_INCH : value;
}

// Maximum deviation (cm) before a measurement scores 0.
// Based on typical alteration limits for bridal gowns.
const TOLERANCE_CM: Record<string, number> = {
  bust_top: 5,   // ±5 cm — hard to let out significantly
  low_hip: 4,   // ±4 cm — very difficult, especially mermaid/trumpet
  waist: 5,   // ±5 cm — easier to take in, harder to let out
  height: 8,   // ±8 cm — affects hem, alterable but costly
  under_bust: 4,
  high_hip: 4,
  shoulder_width: 2,   // tightest tolerance — structural seam
};

// Weights must sum to 1.0
const WEIGHTS: Record<string, number> = {
  bust_top: 0.22,
  low_hip: 0.22,
  waist: 0.18,
  height: 0.15,
  under_bust: 0.10,
  high_hip: 0.08,
  shoulder_width: 0.05,
};

function scoreMeasurement(
  preBrideCm: number,
  postBrideCm: number,
  toleranceCm: number,
): number {
  const diff = Math.abs(preBrideCm - postBrideCm);
  if (diff <= toleranceCm * 0.5) return 100;
  if (diff <= toleranceCm) return 75;
  if (diff <= toleranceCm * 1.5) return 50;
  if (diff <= toleranceCm * 2) return 25;
  return 0;
}

export interface MeasurementRow {
  user_id: string;
  unit_system: string;
  height: number;
  bust_top: number;
  under_bust: number | null;
  waist: number;
  high_hip: number | null;
  low_hip: number;
  shoulder_width: number | null;
  neck_to_waist: number;
  arm_length: number | null;
}

export interface GownListing {
  id: string;
  user_id: string;
  neckline: string;
  silhouette: string;
  materials: string[];
  condition: string;
  condition_notes: string;
  borough: string;
  wedding_date: string;
  price_3day: number | null;
  price_7day: number | null;
  price_14day: number | null;
  retail_price: number | null;
  is_available: boolean;
}

export interface StylePreferencesRow {
  necklines: string[];
  silhouettes: string[];
  materials: string[];
}

export interface ScoredListing {
  listing: GownListing;
  fitScore: number;
  styleScore: number;
  combinedScore: number;
  fitLabel: string;
}

function fitLabel(score: number): string {
  if (score >= 85) return 'Excellent fit';
  if (score >= 70) return 'Great fit';
  if (score >= 55) return 'Good fit';
  return 'Fair fit';
}

export function scoreListing(
  preBrideMeasurements: MeasurementRow,
  preBridePreferences: StylePreferencesRow,
  postBrideMeasurements: MeasurementRow,
  listing: GownListing,
): ScoredListing {
  const preUnit = preBrideMeasurements.unit_system;
  const postUnit = postBrideMeasurements.unit_system;

  // Normalize both sides to cm
  const preValues: Record<string, number> = {
    bust_top: toCm(preBrideMeasurements.bust_top, preUnit),
    low_hip: toCm(preBrideMeasurements.low_hip, preUnit),
    waist: toCm(preBrideMeasurements.waist, preUnit),
    height: toCm(preBrideMeasurements.height, preUnit),
    under_bust: toCm(preBrideMeasurements.under_bust ?? 0, preUnit),
    high_hip: toCm(preBrideMeasurements.high_hip ?? 0, preUnit),
    shoulder_width: toCm(preBrideMeasurements.shoulder_width ?? 0, preUnit),
  };

  const postValues: Record<string, number | null> = {
    bust_top: toCm(postBrideMeasurements.bust_top, postUnit),
    low_hip: toCm(postBrideMeasurements.low_hip, postUnit),
    waist: toCm(postBrideMeasurements.waist, postUnit),
    height: toCm(postBrideMeasurements.height, postUnit),
    under_bust: postBrideMeasurements.under_bust != null
      ? toCm(postBrideMeasurements.under_bust, postUnit) : null,
    high_hip: postBrideMeasurements.high_hip != null
      ? toCm(postBrideMeasurements.high_hip, postUnit) : null,
    shoulder_width: postBrideMeasurements.shoulder_width != null
      ? toCm(postBrideMeasurements.shoulder_width, postUnit) : null,
  };

  // Weighted fit score — skip N/A dress fields and renormalize
  let fitScore = 0;
  let usedWeightSum = 0;
  for (const key of Object.keys(WEIGHTS)) {
    const postCm = postValues[key];
    if (postCm === null) continue;
    fitScore += scoreMeasurement(preValues[key], postCm, TOLERANCE_CM[key]) * WEIGHTS[key];
    usedWeightSum += WEIGHTS[key];
  }
  fitScore = usedWeightSum > 0 ? fitScore / usedWeightSum : 0;

  // Style overlap score
  const necklineMatch = preBridePreferences.necklines.includes(listing.neckline) ? 1 : 0;
  const silhouetteMatch = preBridePreferences.silhouettes.includes(listing.silhouette) ? 1 : 0;

  const prefMaterials = new Set(preBridePreferences.materials);
  const overlappingMaterials = listing.materials.filter((m) => prefMaterials.has(m)).length;
  const maxMaterials = Math.max(preBridePreferences.materials.length, listing.materials.length, 1);
  const materialOverlap = overlappingMaterials / maxMaterials;

  const styleScore = ((necklineMatch + silhouetteMatch + materialOverlap) / 3) * 100;

  const combinedScore = fitScore * 0.7 + styleScore * 0.3;

  return {
    listing,
    fitScore: Math.round(fitScore),
    styleScore: Math.round(styleScore),
    combinedScore: Math.round(combinedScore),
    fitLabel: fitLabel(fitScore),
  };
}

export function rankListings(
  preBrideMeasurements: MeasurementRow,
  preBridePreferences: StylePreferencesRow,
  listings: GownListing[],
  measurementsByUserId: Map<string, MeasurementRow>,
  minScore = 30,
): ScoredListing[] {
  const scored: ScoredListing[] = [];

  for (const listing of listings) {
    const postMeasurements = measurementsByUserId.get(listing.user_id);
    if (!postMeasurements) continue;

    const result = scoreListing(
      preBrideMeasurements,
      preBridePreferences,
      postMeasurements,
      listing,
    );

    if (result.combinedScore >= minScore) {
      scored.push(result);
    }
  }

  return scored.sort((a, b) => b.combinedScore - a.combinedScore);
}
