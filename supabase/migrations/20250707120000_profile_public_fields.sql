-- Public profile fields for owner profile page
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS advertiser_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS communication_languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_contact_method text NOT NULL DEFAULT 'message',
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_title text;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_advertiser_type_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_advertiser_type_check
  CHECK (advertiser_type IN ('individual', 'professional'));

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_contact_method_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_preferred_contact_method_check
  CHECK (preferred_contact_method IN ('message', 'phone', 'email'));

COMMENT ON COLUMN profiles.display_name IS 'Public display name; falls back to full_name';
COMMENT ON COLUMN profiles.bio IS 'Short public bio, max ~350 chars';
COMMENT ON COLUMN profiles.advertiser_type IS 'individual | professional';
COMMENT ON COLUMN profiles.communication_languages IS 'Languages owner can communicate in';
