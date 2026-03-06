import { supabase } from './supabase';
import { PostBrideFormData } from '@/types/user';

export async function submitPostBride(data: PostBrideFormData): Promise<{ error: string | null }> {
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
    role: 'post-bride',
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

  // 4. Insert gown listing
  const { data: listing, error: listingError } = await supabase
    .from('gown_listings')
    .insert({
      user_id: userId,
      neckline: data.styleProfile.neckline,
      silhouette: data.styleProfile.silhouette,
      materials: data.styleProfile.materials,
      condition: data.condition,
      condition_notes: data.conditionNotes,
      wedding_city: data.weddingCity,
      wedding_borough: data.weddingBorough,
      wedding_date: data.weddingDate,
    })
    .select('id')
    .single();

  if (listingError) return { error: listingError.message };

  // 5. Upload each photo and record in gown_photos
  for (const photo of data.photos) {
    const ext = photo.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('gown-photos')
      .upload(path, photo);

    if (uploadError) return { error: uploadError.message };

    const { error: photoRecordError } = await supabase.from('gown_photos').insert({
      listing_id: listing.id,
      storage_path: path,
    });

    if (photoRecordError) return { error: photoRecordError.message };
  }

  return { error: null };
}
