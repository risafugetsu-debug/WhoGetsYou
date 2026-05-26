-- supabase/multi-listing.sql

-- Allow multiple listings per user
ALTER TABLE public.gown_listings DROP CONSTRAINT gown_listings_user_id_key;

-- Allow post-brides to delete their own listings
CREATE POLICY "Post-brides can delete own listing"
  ON public.gown_listings FOR DELETE
  USING (auth.uid() = user_id);
