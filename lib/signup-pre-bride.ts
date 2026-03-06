import { supabase } from './supabase';
import { PreBrideFormData } from '@/types/user';

export async function submitPreBride(data: PreBrideFormData): Promise<{ error: string | null }> {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) return { error: authError.message };
  if (!authData.user || !authData.session) {
    return { error: 'Sign up failed. Please try again.' };
  }

  const userId = authData.user.id;

  // 2. Insert profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    first_name: data.firstName,
    role: 'pre-bride',
    email: data.email,
  });

  if (profileError) return { error: profileError.message };

  // 3. Insert measurements
  const { error: measurementsError } = await supabase.from('measurements').insert({
    user_id: userId,
    unit_system: data.unitSystem,
    height: parseFloat(data.measurements.height),
    neck_to_waist: parseFloat(data.measurements.neckToWaist),
    shoulder_width: parseFloat(data.measurements.shoulderWidth),
    bust_top: parseFloat(data.measurements.bustTop),
    under_bust: parseFloat(data.measurements.underBust),
    waist: parseFloat(data.measurements.waist),
    high_hip: parseFloat(data.measurements.highHip),
    low_hip: parseFloat(data.measurements.lowHip),
    arm_length: parseFloat(data.measurements.armLength),
  });

  if (measurementsError) return { error: measurementsError.message };

  // 4. Upload profile photo
  let profilePhotoPath = '';

  if (data.profilePhoto) {
    const ext = data.profilePhoto.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(path, data.profilePhoto);

    if (uploadError) return { error: uploadError.message };
    profilePhotoPath = path;
  }

  // 5. Insert style preferences
  const { error: prefsError } = await supabase.from('style_preferences').insert({
    user_id: userId,
    necklines: data.stylePreferences.necklines,
    silhouettes: data.stylePreferences.silhouettes,
    materials: data.stylePreferences.materials,
    wedding_city: data.weddingCity,
    wedding_borough: data.weddingBorough,
    wedding_date: data.weddingDate || null,
    date_undecided: data.dateUndecided,
    profile_photo_path: profilePhotoPath,
  });

  if (prefsError) return { error: prefsError.message };

  return { error: null };
}
