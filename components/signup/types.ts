import type { NecklineStyle, SilhouetteStyle, FabricMaterial } from '@/types/user';
export type { NecklineStyle, SilhouetteStyle, FabricMaterial };

export type UserRole = 'pre-bride' | 'post-bride';

export type EthnicityOption =
  | 'East Asian'
  | 'Southeast Asian'
  | 'South Asian'
  | 'Central Asian'
  | 'Black or African American'
  | 'Hispanic or Latino'
  | 'Middle Eastern or North African'
  | 'Native American or Alaska Native'
  | 'Native Hawaiian or Pacific Islander'
  | 'White'
  | 'Multiracial'
  | 'Prefer not to say';

export type DressStyle =
  | 'Ballgown'
  | 'A-line'
  | 'Mermaid'
  | 'Minimalist/Slip'
  | 'Princess'
  | 'Boho';

export const VENUE_OPTIONS = [
  'Church / Cathedral',
  'Beach',
  'Garden / Outdoor',
  'City Hall',
  'At home',
  'Ballroom',
  'Rooftop',
  'Winery / Vineyard',
  'Museum / Gallery',
  'Other',
] as const;

export type VenueType = typeof VENUE_OPTIONS[number];

export const NYC_BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island'] as const;

export interface RoleData {
  role: UserRole | null;
}

export interface BasicInfoData {
  firstName: string;
  email: string;
  password: string;
  confirmPassword: string;
  ethnicity: EthnicityOption | null;
}

// Pre-bride: body measurements (Height cm or ft/in toggle + 8 body measurements)
export interface PreBrideMeasurements {
  unitSystem: 'cm' | 'in';
  heightCm: string;
  heightFeet: string;
  heightInches: string;
  bust: string;          // discriminator — 'bust' in m = pre-bride
  underBust: string;
  waist: string;
  highHip: string;
  hips: string;
  neckToWaist: string;
  shoulderWidth: string;
  armLength: string;
}

// Post-bride: dress measurements (Height ft/in + 8 dress measurements)
export interface PostBrideMeasurements {
  unitSystem: 'cm' | 'in';
  heightFeet: string;
  heightInches: string;
  dressBust: string;         // discriminator — 'dressBust' in m = post-bride
  dressUnderBust: string;
  dressWaist: string;
  dressHighHip: string;
  dressHips: string;
  dressNeckToWaist: string;
  dressShoulderWidth: string;
  dressArmLength: string;
}

// Pre-bride: multi-select necklines, silhouettes, materials
export interface PreBrideStyle {
  necklines: NecklineStyle[];
  silhouettes: SilhouetteStyle[];
  materials: FabricMaterial[];
}

// Post-bride: single neckline, silhouette + multi materials
export interface PostBrideStyle {
  neckline: NecklineStyle | null;
  silhouette: SilhouetteStyle | null;
  materials: FabricMaterial[];
}

// Post-bride step 5: wedding details
export interface PostBrideWeddingDetails {
  venue: VenueType | null;
  weddingMonth: string;   // '01'..'12'
  weddingYear: string;    // e.g. '2024'
}

// Pre-bride step 4: wedding details
export interface PreBrideWeddingDetails {
  venue: VenueType | null;
  venueUndecided: boolean;
  weddingMonth: string;
  weddingYear: string;
  dateUndecided: boolean;
}

// Post-bride step 6: listing location + availability
export interface ListingLocationData {
  city: string;
  borough: string | null;
  availableFrom: string;   // 'YYYY-MM-DD'
  availableUntil: string;  // 'YYYY-MM-DD'
}

// Post-bride flow:  step4=PostBrideStyle, step5=PostBrideWeddingDetails, step6=ListingLocationData
// Pre-bride flow:   step4=PreBrideWeddingDetails, step5=PreBrideStyle, step6=null
export interface SignupFormData {
  step1: RoleData;
  step2: BasicInfoData;
  step3: PreBrideMeasurements | PostBrideMeasurements | null;
  step4: PostBrideStyle | PreBrideWeddingDetails | null;
  step5: PreBrideStyle | PostBrideWeddingDetails | null;
  step6: ListingLocationData | null;
}

export function isPreBrideMeasurements(
  m: PreBrideMeasurements | PostBrideMeasurements
): m is PreBrideMeasurements {
  return 'bust' in m;
}

export function isPreBrideStyle(
  s: PreBrideStyle | PostBrideStyle
): s is PreBrideStyle {
  return 'necklines' in s;
}

export function isPreBrideWeddingDetails(
  d: PostBrideStyle | PreBrideWeddingDetails
): d is PreBrideWeddingDetails {
  return 'dateUndecided' in d;
}

export function isPostBrideWeddingDetails(
  d: PreBrideStyle | PostBrideWeddingDetails
): d is PostBrideWeddingDetails {
  return 'weddingMonth' in d;
}

export const DRESS_STYLES: DressStyle[] = [
  'Ballgown',
  'A-line',
  'Mermaid',
  'Minimalist/Slip',
  'Princess',
  'Boho',
];

export const ETHNICITY_OPTIONS: EthnicityOption[] = [
  'East Asian',
  'Southeast Asian',
  'South Asian',
  'Central Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Middle Eastern or North African',
  'Native American or Alaska Native',
  'Native Hawaiian or Pacific Islander',
  'White',
  'Multiracial',
  'Prefer not to say',
];
