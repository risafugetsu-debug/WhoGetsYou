-- Add 14-day pricing tier to gown_listings
ALTER TABLE gown_listings
  ADD COLUMN IF NOT EXISTS price_14day numeric;

-- Add rental dates to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS rental_start_date date,
  ADD COLUMN IF NOT EXISTS rental_end_date date;
