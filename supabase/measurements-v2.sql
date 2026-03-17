-- ============================================================
-- measurements table additions
-- Adds heel_height for post-brides (height of heels worn with dress).
-- ============================================================

ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS heel_height numeric;
