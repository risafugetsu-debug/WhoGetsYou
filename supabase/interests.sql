CREATE TABLE interests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_bride_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id     uuid NOT NULL REFERENCES gown_listings(id) ON DELETE CASCADE,
  post_bride_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(pre_bride_id, listing_id)
);

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- Pre-brides can express interest
CREATE POLICY "Pre-brides can insert interests" ON interests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = pre_bride_id);

-- Pre-brides can see their own interests (to know if they already expressed interest)
CREATE POLICY "Pre-brides can view own interests" ON interests
  FOR SELECT TO authenticated
  USING (auth.uid() = pre_bride_id);

-- Post-brides can see who expressed interest in their listing
CREATE POLICY "Post-brides can view interests in their listings" ON interests
  FOR SELECT TO authenticated
  USING (auth.uid() = post_bride_id);
