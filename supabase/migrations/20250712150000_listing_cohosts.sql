-- Co-hosts, listing contact numbers, audit logs, and lead replies.

-- ---------------------------------------------------------------------------
-- listing_cohosts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS listing_cohosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohost_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email text NOT NULL,
  invited_name text,
  invite_token uuid NOT NULL DEFAULT gen_random_uuid(),
  invite_message text,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'declined', 'removed')
  ),
  permission_level text NOT NULL DEFAULT 'full_access' CHECK (
    permission_level IN ('full_access', 'messages_availability', 'messages_only')
  ),
  can_manage_listing boolean NOT NULL DEFAULT true,
  can_manage_photos boolean NOT NULL DEFAULT true,
  can_manage_availability boolean NOT NULL DEFAULT true,
  can_manage_pricing boolean NOT NULL DEFAULT true,
  can_manage_messages boolean NOT NULL DEFAULT true,
  can_view_stats boolean NOT NULL DEFAULT true,
  can_manage_cohosts boolean NOT NULL DEFAULT false,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  removed_at timestamptz,
  CONSTRAINT listing_cohosts_invited_email_lower CHECK (invited_email = lower(invited_email)),
  CONSTRAINT listing_cohosts_no_self_invite CHECK (
    cohost_user_id IS NULL OR cohost_user_id <> owner_user_id
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS listing_cohosts_invite_token_idx
  ON listing_cohosts(invite_token);

CREATE UNIQUE INDEX IF NOT EXISTS listing_cohosts_listing_email_active_idx
  ON listing_cohosts(listing_id, invited_email)
  WHERE status IN ('pending', 'accepted');

CREATE INDEX IF NOT EXISTS listing_cohosts_listing_id_idx ON listing_cohosts(listing_id);
CREATE INDEX IF NOT EXISTS listing_cohosts_cohost_user_id_idx ON listing_cohosts(cohost_user_id);
CREATE INDEX IF NOT EXISTS listing_cohosts_owner_user_id_idx ON listing_cohosts(owner_user_id);

-- ---------------------------------------------------------------------------
-- listing_contact_numbers
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS listing_contact_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'cohost')),
  label text,
  phone_number text NOT NULL,
  visibility text NOT NULL DEFAULT 'private' CHECK (
    visibility IN ('private', 'after_inquiry', 'public')
  ),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_contact_numbers_listing_id_idx
  ON listing_contact_numbers(listing_id);

CREATE INDEX IF NOT EXISTS listing_contact_numbers_user_id_idx
  ON listing_contact_numbers(user_id);

-- ---------------------------------------------------------------------------
-- listing_audit_logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS listing_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_role text NOT NULL CHECK (actor_role IN ('owner', 'cohost', 'admin', 'system')),
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_audit_logs_listing_id_idx
  ON listing_audit_logs(listing_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- property_lead_replies (message thread metadata)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS property_lead_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES property_leads(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('owner', 'cohost', 'guest')),
  sender_display_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_lead_replies_lead_id_idx
  ON property_lead_replies(lead_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- Permission helper (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_listing_permission(
  p_listing_id uuid,
  p_permission text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = p_listing_id AND l.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM listing_cohosts c
      WHERE c.listing_id = p_listing_id
        AND c.cohost_user_id = auth.uid()
        AND c.status = 'accepted'
        AND CASE p_permission
          WHEN 'manage_listing' THEN c.can_manage_listing
          WHEN 'manage_photos' THEN c.can_manage_photos
          WHEN 'manage_availability' THEN c.can_manage_availability
          WHEN 'manage_pricing' THEN c.can_manage_pricing
          WHEN 'manage_messages' THEN c.can_manage_messages
          WHEN 'view_stats' THEN c.can_view_stats
          WHEN 'manage_cohosts' THEN c.can_manage_cohosts
          WHEN 'view' THEN true
          ELSE false
        END
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS: listing_cohosts
-- ---------------------------------------------------------------------------

ALTER TABLE listing_cohosts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage listing cohosts" ON listing_cohosts;
CREATE POLICY "Owners manage listing cohosts"
  ON listing_cohosts FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Cohosts view own membership" ON listing_cohosts;
CREATE POLICY "Cohosts view own membership"
  ON listing_cohosts FOR SELECT
  TO authenticated
  USING (cohost_user_id = auth.uid());

DROP POLICY IF EXISTS "Invitees view pending invite by token match" ON listing_cohosts;
CREATE POLICY "Invitees view pending invite by token match"
  ON listing_cohosts FOR SELECT
  TO authenticated
  USING (
    status = 'pending'
    AND lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Cohosts accept or decline own invite" ON listing_cohosts;
CREATE POLICY "Cohosts accept or decline own invite"
  ON listing_cohosts FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    cohost_user_id = auth.uid()
    OR cohost_user_id IS NULL
  );

DROP POLICY IF EXISTS "Public read accepted cohosts on approved listings" ON listing_cohosts;
CREATE POLICY "Public read accepted cohosts on approved listings"
  ON listing_cohosts FOR SELECT
  TO anon, authenticated
  USING (
    status = 'accepted'
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.status = 'approved'
        AND l.is_hidden = false
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: listing_contact_numbers
-- ---------------------------------------------------------------------------

ALTER TABLE listing_contact_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and cohosts manage contact numbers"
  ON listing_contact_numbers FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.user_has_listing_permission(listing_id, 'manage_listing')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.user_has_listing_permission(listing_id, 'manage_listing')
  );

CREATE POLICY "Public read public contact numbers on approved listings"
  ON listing_contact_numbers FOR SELECT
  TO anon, authenticated
  USING (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.status = 'approved'
        AND l.is_hidden = false
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: listing_audit_logs
-- ---------------------------------------------------------------------------

ALTER TABLE listing_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and cohosts read listing audit logs"
  ON listing_audit_logs FOR SELECT
  TO authenticated
  USING (public.user_has_listing_permission(listing_id, 'view'));

CREATE POLICY "Owners and cohosts insert audit logs"
  ON listing_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND public.user_has_listing_permission(listing_id, 'view')
  );

-- ---------------------------------------------------------------------------
-- RLS: property_lead_replies
-- ---------------------------------------------------------------------------

ALTER TABLE property_lead_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead participants read replies"
  ON property_lead_replies FOR SELECT
  TO authenticated
  USING (
    public.user_has_listing_permission(listing_id, 'manage_messages')
    OR EXISTS (
      SELECT 1 FROM property_leads pl
      WHERE pl.id = lead_id AND pl.guest_id = auth.uid()
    )
  );

CREATE POLICY "Owners and cohosts insert replies"
  ON property_lead_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND public.user_has_listing_permission(listing_id, 'manage_messages')
  );

-- ---------------------------------------------------------------------------
-- Extend listings RLS for co-host read access
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Cohosts select shared listings" ON listings;
CREATE POLICY "Cohosts select shared listings"
  ON listings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listing_cohosts c
      WHERE c.listing_id = listings.id
        AND c.cohost_user_id = auth.uid()
        AND c.status = 'accepted'
    )
  );

-- ---------------------------------------------------------------------------
-- Extend property_leads for co-host access
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Cohosts view listing leads" ON property_leads;
CREATE POLICY "Cohosts view listing leads"
  ON property_leads FOR SELECT
  TO authenticated
  USING (public.user_has_listing_permission(listing_id, 'manage_messages'));

DROP POLICY IF EXISTS "Cohosts update listing leads on property_leads" ON property_leads;
CREATE POLICY "Cohosts update listing leads on property_leads"
  ON property_leads FOR UPDATE
  TO authenticated
  USING (public.user_has_listing_permission(listing_id, 'manage_messages'))
  WITH CHECK (public.user_has_listing_permission(listing_id, 'manage_messages'));

COMMENT ON TABLE listing_cohosts IS 'Co-host invitations and permissions per listing';
COMMENT ON TABLE listing_contact_numbers IS 'Per-listing contact phones with visibility control';
COMMENT ON TABLE listing_audit_logs IS 'Audit trail for multi-user listing management';
COMMENT ON TABLE property_lead_replies IS 'Thread replies on property interest leads';
