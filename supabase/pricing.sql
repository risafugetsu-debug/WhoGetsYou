-- Add rental pricing and retail value columns to gown_listings
ALTER TABLE gown_listings
  ADD COLUMN IF NOT EXISTS price_1day   numeric,
  ADD COLUMN IF NOT EXISTS price_3day   numeric,
  ADD COLUMN IF NOT EXISTS price_7day   numeric,
  ADD COLUMN IF NOT EXISTS retail_price numeric;
