-- Minimal portal schema for admin review (run in Supabase SQL Editor)
-- Project: mid term (kfbdssafcyqsrvrwzdto)

-- Portal listing fields
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS rental_type text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'per_month',
  ADD COLUMN IF NOT EXISTS price_per_night numeric,
  ADD COLUMN IF NOT EXISTS ama_number text,
  ADD COLUMN IF NOT EXISTS legal_registry_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS accepts_under_60_days boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_stay_label text,
  ADD COLUMN IF NOT EXISTS advertiser_verification_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS property_verification_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS property_verification_method text,
  ADD COLUMN IF NOT EXISTS external_listing_url text,
  ADD COLUMN IF NOT EXISTS midora_verification_code text,
  ADD COLUMN IF NOT EXISTS admin_verification_notes text,
  ADD COLUMN IF NOT EXISTS owner_responsibility_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS platform_role_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft';

-- Wizard / contact fields
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_postal_code text,
  ADD COLUMN IF NOT EXISTS address_floor text,
  ADD COLUMN IF NOT EXISTS address_unit text,
  ADD COLUMN IF NOT EXISTS included_guests integer,
  ADD COLUMN IF NOT EXISTS extra_guest_fee_per_night numeric,
  ADD COLUMN IF NOT EXISTS ama_declaration_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS preferred_contact text,
  ADD COLUMN IF NOT EXISTS location_needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_phone_contact boolean,
  ADD COLUMN IF NOT EXISTS allow_whatsapp boolean,
  ADD COLUMN IF NOT EXISTS allow_viber boolean,
  ADD COLUMN IF NOT EXISTS allow_message boolean,
  ADD COLUMN IF NOT EXISTS contact_whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS contact_viber_phone text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp_use_primary boolean,
  ADD COLUMN IF NOT EXISTS contact_viber_use_primary boolean;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_phone_contact boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_viber boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS viber_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_use_primary_phone boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS viber_use_primary_phone boolean NOT NULL DEFAULT true;

-- Admin hide flag
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Availability
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available_now',
  ADD COLUMN IF NOT EXISTS availability_note text;

-- Rental mode separation (short-term vs monthly)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS supports_short_term boolean,
  ADD COLUMN IF NOT EXISTS supports_monthly boolean,
  ADD COLUMN IF NOT EXISTS minimum_stay_nights integer,
  ADD COLUMN IF NOT EXISTS minimum_stay_months integer,
  ADD COLUMN IF NOT EXISTS monthly_includes_bills boolean,
  ADD COLUMN IF NOT EXISTS monthly_terms text;

UPDATE listings SET minimum_stay_months = 2, min_months = 2
WHERE (supports_monthly IS TRUE OR rental_type = 'monthly')
  AND (minimum_stay_months IS NULL OR minimum_stay_months < 2 OR min_months < 2);

-- Backfill approval_status from legacy status
UPDATE listings SET approval_status = 'approved' WHERE status = 'approved' AND (approval_status IS NULL OR approval_status = 'draft');
UPDATE listings SET approval_status = 'pending_review' WHERE status = 'pending' AND (approval_status IS NULL OR approval_status = 'draft');
UPDATE listings SET approval_status = 'rejected' WHERE status = 'rejected' AND (approval_status IS NULL OR approval_status = 'draft');

-- Listing images metadata (optional but helpful)
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS is_cover boolean NOT NULL DEFAULT false;
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS size_bytes bigint;

-- Admin audit log (for approve/reject logging)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_logs_admin ON admin_audit_logs;
CREATE POLICY admin_audit_logs_admin ON admin_audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Verify
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'listings'
  AND column_name IN ('ama_number', 'legal_registry_type', 'approval_status', 'rental_type')
ORDER BY column_name;
