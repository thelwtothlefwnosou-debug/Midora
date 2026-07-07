-- Portal listing fields (DAC7-safe: no booking/payment tracking)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS rental_type text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'per_month',
  ADD COLUMN IF NOT EXISTS price_per_night numeric,
  ADD COLUMN IF NOT EXISTS ama_number text,
  ADD COLUMN IF NOT EXISTS legal_registry_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS accepts_under_60_days boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_stay_label text,
  ADD COLUMN IF NOT EXISTS advertiser_verification_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS identity_provider text,
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS property_verification_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS property_verification_method text,
  ADD COLUMN IF NOT EXISTS external_listing_url text,
  ADD COLUMN IF NOT EXISTS midora_verification_code text,
  ADD COLUMN IF NOT EXISTS admin_verification_notes text,
  ADD COLUMN IF NOT EXISTS owner_responsibility_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS platform_role_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft';

-- Backfill approval_status from legacy status
UPDATE listings SET approval_status = 'approved' WHERE status = 'approved' AND approval_status = 'draft';
UPDATE listings SET approval_status = 'pending_review' WHERE status = 'pending' AND approval_status = 'draft';
UPDATE listings SET approval_status = 'rejected' WHERE status = 'rejected' AND approval_status = 'draft';

-- Default availability for portal model
UPDATE listings SET availability_status = 'upon_request' WHERE availability_status IS NULL;

COMMENT ON COLUMN listings.rental_type IS 'short_term | monthly | long_term';
COMMENT ON COLUMN listings.price_type IS 'per_night | per_month';
COMMENT ON COLUMN listings.legal_registry_type IS 'none | ama | esl | mag';
COMMENT ON COLUMN listings.approval_status IS 'draft | pending_review | approved | rejected';
