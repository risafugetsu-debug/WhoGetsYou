-- Add accepted_at to track when a post-bride accepts an interest
ALTER TABLE interests ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Post-bride can accept (update) interests in her listing
CREATE POLICY "Post-brides can update interests in their listings" ON interests
  FOR UPDATE TO authenticated
  USING (auth.uid() = post_bride_id)
  WITH CHECK (auth.uid() = post_bride_id);

-- Store email in profiles so it can be revealed on acceptance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Allow all authenticated users to read any profile
-- (needed for first-name + email lookups in the matching and interests flows)
CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (true);
