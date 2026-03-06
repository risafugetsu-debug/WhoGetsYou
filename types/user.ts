export type UserRole = 'post-bride' | 'pre-bride';

export type NecklineStyle =
  | 'Sweetheart'
  | 'V-neck'
  | 'Square'
  | 'High Neck'
  | 'Strapless'
  | 'Off-shoulder'
  | 'Halter'
  | 'Scoop'
  | 'Bateau';

export type SilhouetteStyle =
  | 'A-line'
  | 'Ball Gown'
  | 'Mermaid'
  | 'Trumpet'
  | 'Sheath/Column'
  | 'Empire'
  | 'Tea-length';

export type FabricMaterial =
  | 'Lace'
  | 'Silk'
  | 'Satin'
  | 'Tulle'
  | 'Chiffon'
  | 'Organza'
  | 'Crepe'
  | 'Mikado'
  | 'Jersey';

export type GownCondition = 'Pristine' | 'Excellent' | 'Very Good' | 'Good';

export interface Measurements {
  height: string;
  neckToWaist: string;
  shoulderWidth: string;
  bustTop: string;
  underBust: string;
  waist: string;
  highHip: string;
  lowHip: string;
  armLength: string;
}

export interface StyleProfile {
  neckline: NecklineStyle | null;
  silhouette: SilhouetteStyle | null;
  materials: FabricMaterial[];
}

export interface StylePreferences {
  necklines: NecklineStyle[];
  silhouettes: SilhouetteStyle[];
  materials: FabricMaterial[];
}

export interface PostBrideFormData {
  firstName: string;
  email: string;
  password: string;
  confirmPassword: string;
  measurements: Measurements;
  unitSystem: 'cm' | 'in';
  styleProfile: StyleProfile;
  condition: GownCondition | null;
  conditionNotes: string;
  weddingCity: string;
  weddingBorough: string;
  weddingDate: string;
  photos: File[];
}

export interface PreBrideFormData {
  firstName: string;
  email: string;
  password: string;
  confirmPassword: string;
  measurements: Measurements;
  unitSystem: 'cm' | 'in';
  stylePreferences: StylePreferences;
  weddingCity: string;
  weddingBorough: string;
  weddingDate: string;
  dateUndecided: boolean;
  profilePhoto: File | null;
}

export const NECKLINE_OPTIONS: NecklineStyle[] = [
  'Sweetheart',
  'V-neck',
  'Square',
  'High Neck',
  'Strapless',
  'Off-shoulder',
  'Halter',
  'Scoop',
  'Bateau',
];

export const SILHOUETTE_OPTIONS: SilhouetteStyle[] = [
  'A-line',
  'Ball Gown',
  'Mermaid',
  'Trumpet',
  'Sheath/Column',
  'Empire',
  'Tea-length',
];

export const FABRIC_OPTIONS: FabricMaterial[] = [
  'Lace',
  'Silk',
  'Satin',
  'Tulle',
  'Chiffon',
  'Organza',
  'Crepe',
  'Mikado',
  'Jersey',
];

export const CONDITION_OPTIONS: { value: GownCondition; label: string; description: string }[] = [
  {
    value: 'Pristine',
    label: 'Pristine',
    description: 'Never worn or sample condition. No signs of use.',
  },
  {
    value: 'Excellent',
    label: 'Excellent',
    description: 'Worn once. Professionally cleaned. No visible flaws.',
  },
  {
    value: 'Very Good',
    label: 'Very Good',
    description: 'Minor signs of wear. Cleaned. Small imperfections only.',
  },
  {
    value: 'Good',
    label: 'Good',
    description: 'Some visible wear. Honest condition. Priced accordingly.',
  },
];

export const NYC_BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island'];

export const MEASUREMENT_FIELDS: {
  key: keyof Measurements;
  label: string;
  guide: string;
}[] = [
  {
    key: 'height',
    label: 'Height',
    guide: 'Stand against a wall without shoes. Measure from floor to top of head.',
  },
  {
    key: 'neckToWaist',
    label: 'Neck to Waist',
    guide: 'Measure from the base of your neck (where a necklace would sit) straight down to your natural waist.',
  },
  {
    key: 'shoulderWidth',
    label: 'Shoulder Width',
    guide: 'Measure across the back from the tip of one shoulder to the tip of the other.',
  },
  {
    key: 'bustTop',
    label: 'Bust (Upper)',
    guide: 'Measure around the fullest part of your chest, keeping the tape level and parallel to the floor.',
  },
  {
    key: 'underBust',
    label: 'Under Bust',
    guide: 'Measure directly under your bust, around your ribcage. Keep the tape snug but not tight.',
  },
  {
    key: 'waist',
    label: 'Waist',
    guide: 'Measure around your natural waist — the narrowest part of your torso, usually just above the navel.',
  },
  {
    key: 'highHip',
    label: 'High Hip',
    guide: 'Measure around your body approximately 4 inches (10 cm) below your natural waist.',
  },
  {
    key: 'lowHip',
    label: 'Low Hip',
    guide: 'Measure around the fullest part of your hips and seat, usually 7–9 inches (18–23 cm) below your waist.',
  },
  {
    key: 'armLength',
    label: 'Arm Length',
    guide: 'With your arm slightly bent, measure from the tip of your shoulder to your wrist bone.',
  },
];
