-- Listing declaration acknowledgments (portal compliance)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS terms_privacy_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declarations_submitted_at timestamptz;

COMMENT ON COLUMN listings.terms_privacy_accepted IS 'Owner accepted Terms, Listing Rules and Privacy Policy at submission';
COMMENT ON COLUMN listings.declarations_submitted_at IS 'When required declarations were submitted for review';
