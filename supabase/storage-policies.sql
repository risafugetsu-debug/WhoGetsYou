-- ============================================================
-- WhoGetsYou — Storage Policies
-- Run this in Supabase SQL Editor after schema.sql
-- ============================================================

-- Gown Photos bucket policies
create policy "Users can upload their own gown photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gown-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Authenticated users can view gown photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'gown-photos');

create policy "Users can delete their own gown photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gown-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- Profile Photos bucket policies
create policy "Users can upload their own profile photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Authenticated users can view profile photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-photos');

create policy "Users can delete their own profile photo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
