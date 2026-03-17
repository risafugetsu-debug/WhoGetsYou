-- ============================================================
-- Rename wedding_city / wedding_borough → city / borough
-- These columns now represent the user's current location,
-- not the wedding location.
-- ============================================================

ALTER TABLE public.gown_listings
  RENAME COLUMN wedding_city TO city;

ALTER TABLE public.gown_listings
  RENAME COLUMN wedding_borough TO borough;

ALTER TABLE public.style_preferences
  RENAME COLUMN wedding_city TO city;

ALTER TABLE public.style_preferences
  RENAME COLUMN wedding_borough TO borough;
