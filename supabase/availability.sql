-- Add an availability flag to gown listings. Default is true (available).
ALTER TABLE public.gown_listings ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
