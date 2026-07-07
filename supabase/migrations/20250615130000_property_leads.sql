-- Property interest leads (not bookings)
-- Run in Supabase SQL Editor or via migration script

CREATE TABLE IF NOT EXISTS property_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  start_date DATE,
  duration TEXT,
  guests INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS property_leads_owner_id_idx ON property_leads(owner_id);
CREATE INDEX IF NOT EXISTS property_leads_listing_id_idx ON property_leads(listing_id);
CREATE INDEX IF NOT EXISTS property_leads_guest_id_idx ON property_leads(guest_id);
CREATE INDEX IF NOT EXISTS property_leads_status_idx ON property_leads(status);

ALTER TABLE property_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit property leads" ON property_leads;
DROP POLICY IF EXISTS "Owners view own listing leads" ON property_leads;
DROP POLICY IF EXISTS "Guests view own leads" ON property_leads;
DROP POLICY IF EXISTS "Owners update own listing leads" ON property_leads;

CREATE POLICY "Anyone can submit property leads"
  ON property_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND trim(name) <> ''
    AND (email IS NOT NULL OR phone IS NOT NULL)
  );

CREATE POLICY "Owners view own listing leads"
  ON property_leads FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Guests view own leads"
  ON property_leads FOR SELECT
  TO authenticated
  USING (guest_id = auth.uid());

CREATE POLICY "Owners update own listing leads"
  ON property_leads FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
