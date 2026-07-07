-- Favorites table for saved listings
-- Run: npm run db:migrate-favorites
-- Or paste in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT favorites_user_listing_unique UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_listing_id_idx ON favorites(listing_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
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
-- Simple listing availability (no booking calendar)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available_now';

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS availability_note text;

COMMENT ON COLUMN listings.availability_status IS 'available_now | from_month | upon_request';
COMMENT ON COLUMN listings.availability_note IS 'Free-text month when status is from_month';
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
-- Portal-safe lead statuses (no rental completion tracking)

ALTER TABLE property_leads DROP CONSTRAINT IF EXISTS property_leads_status_check;

UPDATE property_leads SET status = 'archived' WHERE status = 'closed';

ALTER TABLE property_leads
  ADD CONSTRAINT property_leads_status_check
  CHECK (status IN ('new', 'contacted', 'archived'));

ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS timing_note text;

COMMENT ON COLUMN property_leads.timing_note IS 'Free-text: when interested (not a booking date)';
-- Listing reports from public users

CREATE TABLE IF NOT EXISTS listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  reporter_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_reports_listing_id_idx ON listing_reports(listing_id);

COMMENT ON TABLE listing_reports IS 'Public listing reports â€” not linked to bookings or payments';
-- Unavailable periods (informational only â€” NOT bookings)

CREATE TABLE IF NOT EXISTS listing_unavailable_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_unavailable_periods_dates_check CHECK (end_date >= start_date),
  CONSTRAINT listing_unavailable_periods_reason_check CHECK (
    reason IS NULL OR reason IN ('personal_use', 'maintenance', 'unavailable', 'other')
  )
);

CREATE INDEX IF NOT EXISTS listing_unavailable_periods_listing_id_idx
  ON listing_unavailable_periods(listing_id);
CREATE INDEX IF NOT EXISTS listing_unavailable_periods_owner_id_idx
  ON listing_unavailable_periods(owner_id);
CREATE INDEX IF NOT EXISTS listing_unavailable_periods_start_date_idx
  ON listing_unavailable_periods(start_date);
CREATE INDEX IF NOT EXISTS listing_unavailable_periods_end_date_idx
  ON listing_unavailable_periods(end_date);

ALTER TABLE listing_unavailable_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select own unavailable periods"
  ON listing_unavailable_periods FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert own unavailable periods"
  ON listing_unavailable_periods FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners update own unavailable periods"
  ON listing_unavailable_periods FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete own unavailable periods"
  ON listing_unavailable_periods FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Public read unavailable periods for approved listings"
  ON listing_unavailable_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.status = 'approved'
    )
  );

COMMENT ON TABLE listing_unavailable_periods IS
  'Owner-declared unavailable date ranges â€” not bookings or reservations';

CREATE POLICY "Admins manage all unavailable periods"
  ON listing_unavailable_periods
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
-- Interest period fields on leads (not bookings)

ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS interest_start_date date,
  ADD COLUMN IF NOT EXISTS interest_end_date date,
  ADD COLUMN IF NOT EXISTS interest_start_month text,
  ADD COLUMN IF NOT EXISTS interest_duration_months integer;

COMMENT ON COLUMN property_leads.interest_start_date IS
  'Visitor period of interest start â€” not a confirmed booking';
COMMENT ON COLUMN property_leads.interest_end_date IS
  'Visitor period of interest end â€” not a confirmed booking';
-- Admin Control Room: profiles, reports, audit, events, settings, RLS

-- â”€â”€â”€ Profiles extensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'advertiser', 'admin'));

-- â”€â”€â”€ Listings: admin hide flag â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS listings_is_hidden_idx ON listings(is_hidden) WHERE is_hidden = true;

-- â”€â”€â”€ Property leads: portal-safe statuses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
UPDATE property_leads SET status = 'read' WHERE status = 'contacted';

ALTER TABLE property_leads DROP CONSTRAINT IF EXISTS property_leads_status_check;
ALTER TABLE property_leads ADD CONSTRAINT property_leads_status_check
  CHECK (status IN ('new', 'read', 'replied', 'archived'));

-- â”€â”€â”€ Listing reports extensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE listing_reports DROP CONSTRAINT IF EXISTS listing_reports_status_check;
ALTER TABLE listing_reports ADD CONSTRAINT listing_reports_status_check
  CHECK (status IN ('new', 'reviewing', 'resolved', 'dismissed'));

-- â”€â”€â”€ Bug reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url text,
  message text NOT NULL,
  category text,
  browser_info jsonb,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bug_reports DROP CONSTRAINT IF EXISTS bug_reports_status_check;
ALTER TABLE bug_reports ADD CONSTRAINT bug_reports_status_check
  CHECK (status IN ('new', 'reviewing', 'fixed', 'rejected'));

ALTER TABLE bug_reports DROP CONSTRAINT IF EXISTS bug_reports_category_check;
ALTER TABLE bug_reports ADD CONSTRAINT bug_reports_category_check
  CHECK (category IS NULL OR category IN (
    'search', 'listing', 'dashboard', 'calendar', 'photos',
    'contact', 'verification', 'account', 'other'
  ));

CREATE INDEX IF NOT EXISTS bug_reports_status_idx ON bug_reports(status);
CREATE INDEX IF NOT EXISTS bug_reports_created_at_idx ON bug_reports(created_at DESC);

-- â”€â”€â”€ Admin audit logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_user_id_idx ON admin_audit_logs(admin_user_id);

-- â”€â”€â”€ App events (technical / product telemetry) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS app_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_events_created_at_idx ON app_events(created_at DESC);
CREATE INDEX IF NOT EXISTS app_events_event_type_idx ON app_events(event_type);

-- â”€â”€â”€ Admin settings (key-value) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- â”€â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Listing reports: anyone can insert; admin reads/updates
DROP POLICY IF EXISTS listing_reports_insert ON listing_reports;
CREATE POLICY listing_reports_insert ON listing_reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS listing_reports_admin ON listing_reports;
CREATE POLICY listing_reports_admin ON listing_reports
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Bug reports: users insert own; users read own; admin all
DROP POLICY IF EXISTS bug_reports_insert ON bug_reports;
CREATE POLICY bug_reports_insert ON bug_reports
  FOR INSERT TO anon, authenticated WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS bug_reports_select_own ON bug_reports;
CREATE POLICY bug_reports_select_own ON bug_reports
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS bug_reports_admin ON bug_reports;
CREATE POLICY bug_reports_admin ON bug_reports
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Audit logs: admin only
DROP POLICY IF EXISTS admin_audit_logs_admin ON admin_audit_logs;
CREATE POLICY admin_audit_logs_admin ON admin_audit_logs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- App events: insert authenticated; admin read
DROP POLICY IF EXISTS app_events_insert ON app_events;
CREATE POLICY app_events_insert ON app_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS app_events_admin_select ON app_events;
CREATE POLICY app_events_admin_select ON app_events
  FOR SELECT TO authenticated USING (public.is_admin());

-- Admin settings: admin only
DROP POLICY IF EXISTS admin_settings_admin ON admin_settings;
CREATE POLICY admin_settings_admin ON admin_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admins can read all profiles
DROP POLICY IF EXISTS profiles_admin_select ON profiles;
CREATE POLICY profiles_admin_select ON profiles
  FOR SELECT TO authenticated USING (public.is_admin());

-- Admins can read all property leads
DROP POLICY IF EXISTS property_leads_admin ON property_leads;
CREATE POLICY property_leads_admin ON property_leads
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS property_leads_admin_update ON property_leads;
CREATE POLICY property_leads_admin_update ON property_leads
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admins can read all payments (listing visibility subscriptions)
DROP POLICY IF EXISTS payments_admin_select ON payments;
CREATE POLICY payments_admin_select ON payments
  FOR SELECT TO authenticated USING (public.is_admin());

COMMENT ON TABLE admin_audit_logs IS 'Admin actions audit trail â€” admins only';
COMMENT ON TABLE app_events IS 'Product/technical events â€” no sensitive PII';
COMMENT ON TABLE bug_reports IS 'User-submitted bug reports';
-- Listing wizard: private address, short-term pricing, contacts, locations, price rules

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS accepts_under_60_days boolean NOT NULL DEFAULT false,
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
  ADD COLUMN IF NOT EXISTS location_needs_review boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN listings.accepts_under_60_days IS 'Short-term always true; monthly owner-controlled';
COMMENT ON COLUMN listings.location_needs_review IS 'City/area not matched to canonical dataset';

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name_el text NOT NULL,
  normalized_name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  region text,
  municipality text,
  location_type text NOT NULL DEFAULT 'city',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS locations_normalized_name_idx ON public.locations (normalized_name);

CREATE TABLE IF NOT EXISTS public.listing_price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  label text,
  price_per_night numeric,
  included_guests integer,
  extra_guest_fee_per_night numeric,
  min_stay_nights integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_price_rules_date_order CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS listing_price_rules_listing_id_idx ON public.listing_price_rules (listing_id);

ALTER TABLE public.listing_price_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_price_rules_owner_all ON public.listing_price_rules
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY listing_price_rules_public_read ON public.listing_price_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.status = 'approved' AND COALESCE(l.is_hidden, false) = false
    )
  );
-- Midora feature migration: parking, video media
-- Run in Supabase SQL Editor after schema.sql

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS has_parking BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS max_guests INTEGER CHECK (max_guests IS NULL OR max_guests > 0);

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS cleaning_included BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER
    CHECK (duration_seconds IS NULL OR duration_seconds > 0);

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0);

CREATE INDEX IF NOT EXISTS listing_images_listing_cover_idx
  ON listing_images(listing_id, is_cover)
  WHERE is_cover = true;

CREATE INDEX IF NOT EXISTS listings_has_parking_idx ON listings(has_parking);
-- Extended listing_images metadata for wizard uploads
ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0);

CREATE INDEX IF NOT EXISTS listing_images_listing_cover_idx
  ON listing_images(listing_id, is_cover)
  WHERE is_cover = true;
-- Explicit INSERT/UPDATE policies for listing_images (owner draft uploads)

DROP POLICY IF EXISTS "Owners can insert listing images" ON listing_images;
CREATE POLICY "Owners can insert listing images"
  ON listing_images FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update listing images" ON listing_images;
CREATE POLICY "Owners can update listing images"
  ON listing_images FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete listing images" ON listing_images;
CREATE POLICY "Owners can delete listing images"
  ON listing_images FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );
