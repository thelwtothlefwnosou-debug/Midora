-- Διαθεσιμότητα ακινήτων (mid-term)
-- Run in Supabase SQL Editor

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS available_from DATE;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS available_until DATE;

CREATE INDEX IF NOT EXISTS listings_available_from_idx ON listings(available_from);
CREATE INDEX IF NOT EXISTS listings_available_until_idx ON listings(available_until);

COMMENT ON COLUMN listings.available_from IS 'Πρώτη διαθέσιμη ημέρα (NULL = άμεσα)';
COMMENT ON COLUMN listings.available_until IS 'Τελευταία διαθέσιμη ημέρα (NULL = αορίστου)';
