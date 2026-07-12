-- supabase/na-measurements.sql
-- Allow N/A dress measurements for fields that don't apply to all gown styles.
-- NULL = measurement doesn't exist on this dress.
-- Do NOT use 0 or empty string — those would be misread as measurements.

ALTER TABLE public.measurements ALTER COLUMN shoulder_width DROP NOT NULL;
ALTER TABLE public.measurements ALTER COLUMN under_bust     DROP NOT NULL;
ALTER TABLE public.measurements ALTER COLUMN high_hip       DROP NOT NULL;
ALTER TABLE public.measurements ALTER COLUMN arm_length     DROP NOT NULL;
