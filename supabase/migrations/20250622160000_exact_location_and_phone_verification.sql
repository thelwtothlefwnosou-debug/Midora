-- Exact property location + phone verification (P0)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS city_display_name TEXT,
  ADD COLUMN IF NOT EXISTS area_display_name TEXT,
  ADD COLUMN IF NOT EXISTS formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS provider_place_id TEXT,
  ADD COLUMN IF NOT EXISTS location_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location_confirmed_by_owner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_pin_moved_manually BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS private_street TEXT,
  ADD COLUMN IF NOT EXISTS private_street_number TEXT,
  ADD COLUMN IF NOT EXISTS private_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS use_profile_contact BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_admin_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location_admin_status TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS primary_phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viber_phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_attempt_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS phone_verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('primary', 'whatsapp', 'viber')),
  sends_this_hour INTEGER NOT NULL DEFAULT 0,
  hour_window_start TIMESTAMPTZ,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, purpose)
);

CREATE INDEX IF NOT EXISTS phone_verification_sessions_user_idx
  ON phone_verification_sessions (user_id);

ALTER TABLE phone_verification_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY phone_verification_sessions_own ON phone_verification_sessions
  FOR ALL USING (auth.uid() = user_id);
