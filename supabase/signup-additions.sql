-- Add venue_type to gown_listings (where post-bride wore the dress)
ALTER TABLE gown_listings ADD COLUMN IF NOT EXISTS venue_type text;

-- Add availability date range to gown_listings
ALTER TABLE gown_listings ADD COLUMN IF NOT EXISTS available_from date;
ALTER TABLE gown_listings ADD COLUMN IF NOT EXISTS available_until date;

-- Add venue_type to style_preferences (pre-bride's preferred venue)
ALTER TABLE style_preferences ADD COLUMN IF NOT EXISTS venue_type text;
