import { supabase } from './supabase';
import type { SignupFormData } from '@/components/signup/types';
import {
  isPreBrideMeasurements,
  isPreBrideWeddingDetails,
  isPostBrideWeddingDetails,
} from '@/components/signup/types';

export async function signupWizard(
  formData: SignupFormData,
  password: string
): Promise<{ error: string | null }> {
  const { step1, step2, step3, step4, step5, step6 } = formData;
  const role = step1.role!;
  const { firstName, email, ethnicity } = step2;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ethnicity: ethnicity ?? null,
      },
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Sign up failed' };
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    first_name: firstName,
    role,
    email,
  });

  if (profileError) return { error: profileError.message };

  if (step3) {
    const isPre = isPreBrideMeasurements(step3);
    const unitSystem = step3.unitSystem;

    let heightTotal: number;
    if (isPre && unitSystem === 'cm') {
      heightTotal = Math.round(parseFloat(step3.heightCm) / 2.54);
    } else {
      heightTotal = parseInt(step3.heightFeet, 10) * 12 + parseInt(step3.heightInches, 10);
    }

    const measurementRow = isPre
      ? {
          user_id: userId,
          unit_system: unitSystem,
          height: heightTotal,
          neck_to_waist: parseFloat(step3.neckToWaist) || 0,
          shoulder_width: parseFloat(step3.shoulderWidth) || 0,
          bust_top: parseFloat(step3.bust) || 0,
          under_bust: parseFloat(step3.underBust) || 0,
          waist: parseFloat(step3.waist) || 0,
          high_hip: parseFloat(step3.highHip) || 0,
          low_hip: parseFloat(step3.hips) || 0,
          arm_length: parseFloat(step3.armLength) || 0,
        }
      : {
          user_id: userId,
          unit_system: unitSystem,
          height: heightTotal,
          neck_to_waist: parseFloat(step3.dressNeckToWaist) || 0,
          shoulder_width: parseFloat(step3.dressShoulderWidth) || 0,
          bust_top: parseFloat(step3.dressBust) || 0,
          under_bust: parseFloat(step3.dressUnderBust) || 0,
          waist: parseFloat(step3.dressWaist) || 0,
          high_hip: parseFloat(step3.dressHighHip) || 0,
          low_hip: parseFloat(step3.dressHips) || 0,
          arm_length: parseFloat(step3.dressArmLength) || 0,
        };

    const { error: measError } = await supabase.from('measurements').insert(measurementRow);
    if (measError) return { error: measError.message };
  }

  if (role === 'pre-bride') {
    // step4 = PreBrideWeddingDetails, step5 = PreBrideStyle
    const weddingDetails = step4 && isPreBrideWeddingDetails(step4) ? step4 : null;
    const styleData = step5 && !isPostBrideWeddingDetails(step5) ? step5 : null;

    let weddingDate: string | null = null;
    if (weddingDetails && !weddingDetails.dateUndecided && weddingDetails.weddingMonth && weddingDetails.weddingYear) {
      weddingDate = `${weddingDetails.weddingYear}-${weddingDetails.weddingMonth}-01`;
    }

    const { error: styleError } = await supabase.from('style_preferences').insert({
      user_id: userId,
      necklines: styleData?.necklines ?? [],
      silhouettes: styleData?.silhouettes ?? [],
      materials: styleData?.materials ?? [],
      wedding_city: 'New York',
      wedding_borough: null,
      wedding_date: weddingDate,
      date_undecided: weddingDetails?.dateUndecided ?? true,
      profile_photo_path: null,
      venue_type: weddingDetails?.venueUndecided ? null : (weddingDetails?.venue ?? null),
    });

    if (styleError) return { error: styleError.message };
  }

  if (role === 'post-bride') {
    // step4 = PostBrideStyle, step5 = PostBrideWeddingDetails, step6 = ListingLocationData
    const styleData = step4 && !isPreBrideWeddingDetails(step4) ? step4 : null;
    const weddingDetails = step5 && isPostBrideWeddingDetails(step5) ? step5 : null;
    const location = step6;

    let weddingDate: string | null = null;
    if (weddingDetails && weddingDetails.weddingMonth && weddingDetails.weddingYear) {
      weddingDate = `${weddingDetails.weddingYear}-${weddingDetails.weddingMonth}-01`;
    }

    const { error: listingError } = await supabase.from('gown_listings').insert({
      user_id: userId,
      neckline: styleData?.neckline ?? null,
      silhouette: styleData?.silhouette ?? null,
      materials: styleData?.materials ?? [],
      condition: 'Excellent',
      condition_notes: null,
      wedding_city: location?.city ?? 'New York',
      wedding_borough: location?.borough ?? null,
      wedding_date: weddingDate,
      venue_type: weddingDetails?.venue ?? null,
      available_from: location?.availableFrom || null,
      available_until: location?.availableUntil || null,
      is_available: true,
    });

    if (listingError) return { error: listingError.message };
  }

  return { error: null };
}
