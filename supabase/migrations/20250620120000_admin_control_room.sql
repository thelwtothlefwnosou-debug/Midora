-- Admin Control Room: profiles, reports, audit, events, settings, RLS

-- ─── Profiles extensions ───────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'advertiser', 'admin'));

-- ─── Listings: admin hide flag ─────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS listings_is_hidden_idx ON listings(is_hidden) WHERE is_hidden = true;

-- ─── Property leads: portal-safe statuses ──────────────────────────────────
UPDATE property_leads SET status = 'read' WHERE status = 'contacted';

ALTER TABLE property_leads DROP CONSTRAINT IF EXISTS property_leads_status_check;
ALTER TABLE property_leads ADD CONSTRAINT property_leads_status_check
  CHECK (status IN ('new', 'read', 'replied', 'archived'));

-- ─── Listing reports extensions ────────────────────────────────────────────
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE listing_reports DROP CONSTRAINT IF EXISTS listing_reports_status_check;
ALTER TABLE listing_reports ADD CONSTRAINT listing_reports_status_check
  CHECK (status IN ('new', 'reviewing', 'resolved', 'dismissed'));

-- ─── Bug reports ───────────────────────────────────────────────────────────
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

-- ─── Admin audit logs ──────────────────────────────────────────────────────
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

-- ─── App events (technical / product telemetry) ────────────────────────────
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

-- ─── Admin settings (key-value) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─── RLS ───────────────────────────────────────────────────────────────────
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

COMMENT ON TABLE admin_audit_logs IS 'Admin actions audit trail — admins only';
COMMENT ON TABLE app_events IS 'Product/technical events — no sensitive PII';
COMMENT ON TABLE bug_reports IS 'User-submitted bug reports';
