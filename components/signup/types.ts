export type UserRole = "pre-bride" | "post-bride";

export type EthnicityOption =
  | "Asian"
  | "Black or African American"
  | "Hispanic or Latino"
  | "Middle Eastern or North African"
  | "Native American or Alaska Native"
  | "Native Hawaiian or Pacific Islander"
  | "White"
  | "Multiracial"
  | "Prefer not to say";

export type DressStyle =
  | "Ballgown"
  | "A-line"
  | "Mermaid"
  | "Minimalist/Slip"
  | "Princess"
  | "Boho";

export interface RoleData {
  role: UserRole | null;
}

export interface BasicInfoData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  ethnicity: EthnicityOption | null;
  zipCode: string;
}

// Pre-bride: all body measurements required
export interface PreBrideMeasurements {
  heightFeet: string;
  heightInches: string;
  bust: string;
  waist: string;
  hips: string;
}

// Post-bride: height required + dress measurements required (NOT current body)
export interface PostBrideMeasurements {
  heightFeet: string;
  heightInches: string;
  dressBust: string;
  dressWaist: string;
  dressHips: string;
}

export interface PreBrideStyle {
  preferredStyles: DressStyle[]; // multi-select, at least one required
}

export interface PostBrideStyle {
  dressStyle: DressStyle | null; // single-select
}

export interface SignupFormData {
  step1: RoleData;
  step2: BasicInfoData;
  step3: PreBrideMeasurements | PostBrideMeasurements | null;
  step4: PreBrideStyle | PostBrideStyle | null;
}

export function isPreBrideMeasurements(
  m: PreBrideMeasurements | PostBrideMeasurements
): m is PreBrideMeasurements {
  return "bust" in m;
}

export function isPreBrideStyle(
  s: PreBrideStyle | PostBrideStyle
): s is PreBrideStyle {
  return "preferredStyles" in s;
}
