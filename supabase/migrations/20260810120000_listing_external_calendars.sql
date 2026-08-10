-- External iCal/ICS calendar sync for short-term listings (availability only — NOT bookings).
-- Imported busy ranges write into listing_unavailable_periods with source = external_calendar.
-- Midora ICS export feeds are separate and NEVER include imported external blocks (anti-loop).

-- ---------------------------------------------------------------------------
-- Connections (private calendar URLs — owner-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_external_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('airbnb', 'booking', 'vrbo', 'other')),
  display_name text,
  calendar_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  last_successful_sync_at timestamptz,
  last_sync_status text NOT NULL DEFAULT 'pending'
    CHECK (last_sync_status IN ('pending', 'syncing', 'success', 'error', 'needs_attention')),
  last_error text,
  last_event_count integer,
  sync_lock_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_external_calendars_listing_id_idx
  ON listing_external_calendars(listing_id);
CREATE INDEX IF NOT EXISTS listing_external_calendars_owner_id_idx
  ON listing_external_calendars(owner_id);
CREATE INDEX IF NOT EXISTS listing_external_calendars_enabled_sync_idx
  ON listing_external_calendars(enabled, last_synced_at)
  WHERE enabled = true;

COMMENT ON TABLE listing_external_calendars IS
  'Owner-linked external iCal feeds for short-term availability sync. calendar_url is secret — never public.';

ALTER TABLE listing_external_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select own external calendars"
  ON listing_external_calendars FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert own external calendars"
  ON listing_external_calendars FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.user_id = auth.uid()
        AND l.rental_type = 'short_term'
    )
  );

CREATE POLICY "Owners update own external calendars"
  ON listing_external_calendars FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete own external calendars"
  ON listing_external_calendars FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins manage all external calendars"
  ON listing_external_calendars FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Source metadata on unavailable periods (reuse existing availability truth)
-- ---------------------------------------------------------------------------
ALTER TABLE listing_unavailable_periods
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE listing_unavailable_periods
  ADD COLUMN IF NOT EXISTS external_calendar_id uuid
    REFERENCES listing_external_calendars(id) ON DELETE CASCADE;

ALTER TABLE listing_unavailable_periods
  ADD COLUMN IF NOT EXISTS external_event_uid text;

ALTER TABLE listing_unavailable_periods
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listing_unavailable_periods_source_check'
  ) THEN
    ALTER TABLE listing_unavailable_periods
      ADD CONSTRAINT listing_unavailable_periods_source_check
      CHECK (source IN ('manual', 'external_calendar'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listing_unavailable_periods_external_source_check'
  ) THEN
    ALTER TABLE listing_unavailable_periods
      ADD CONSTRAINT listing_unavailable_periods_external_source_check
      CHECK (
        (source = 'manual' AND external_calendar_id IS NULL AND external_event_uid IS NULL)
        OR
        (source = 'external_calendar' AND external_calendar_id IS NOT NULL AND external_event_uid IS NOT NULL)
      );
  END IF;
END $$;

-- Unique per external event; multiple manual rows may have (NULL, NULL).
CREATE UNIQUE INDEX IF NOT EXISTS listing_unavailable_periods_external_uid_uidx
  ON listing_unavailable_periods(external_calendar_id, external_event_uid)
  WHERE external_calendar_id IS NOT NULL AND external_event_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS listing_unavailable_periods_external_calendar_id_idx
  ON listing_unavailable_periods(external_calendar_id)
  WHERE external_calendar_id IS NOT NULL;

COMMENT ON COLUMN listing_unavailable_periods.source IS
  'manual = owner block; external_calendar = imported iCal busy range (not a Midora booking)';

-- ---------------------------------------------------------------------------
-- Midora ICS export (manual Midora blocks only — anti-loop)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_calendar_export_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS listing_calendar_export_feeds_listing_uidx
  ON listing_calendar_export_feeds(listing_id);

CREATE INDEX IF NOT EXISTS listing_calendar_export_feeds_token_idx
  ON listing_calendar_export_feeds(token)
  WHERE enabled = true;

COMMENT ON TABLE listing_calendar_export_feeds IS
  'Unguessable Midora ICS export tokens. Feed includes only Midora-native manual unavailable periods.';

ALTER TABLE listing_calendar_export_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select own calendar export feeds"
  ON listing_calendar_export_feeds FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert own calendar export feeds"
  ON listing_calendar_export_feeds FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.user_id = auth.uid()
        AND l.rental_type = 'short_term'
    )
  );

CREATE POLICY "Owners update own calendar export feeds"
  ON listing_calendar_export_feeds FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete own calendar export feeds"
  ON listing_calendar_export_feeds FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins manage calendar export feeds"
  ON listing_calendar_export_feeds FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
