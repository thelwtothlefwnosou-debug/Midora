-- Free Hosting offers on short-term listings (not a third rental type).
-- Canonical window: [start_date, end_exclusive) — same night semantics as iCal / stay nights.
-- DO NOT apply to production until explicitly approved.

-- ---------------------------------------------------------------------------
-- Offers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_free_hosting_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_exclusive date NOT NULL,
  max_nights integer NOT NULL CHECK (max_nights >= 1 AND max_nights <= 90),
  max_guests integer NOT NULL CHECK (max_guests >= 1 AND max_guests <= 50),
  owner_message text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_free_hosting_offers_range_chk
    CHECK (end_exclusive > start_date)
);

CREATE INDEX IF NOT EXISTS listing_free_hosting_offers_listing_id_idx
  ON listing_free_hosting_offers(listing_id);

CREATE INDEX IF NOT EXISTS listing_free_hosting_offers_owner_id_idx
  ON listing_free_hosting_offers(owner_id);

CREATE INDEX IF NOT EXISTS listing_free_hosting_offers_active_window_idx
  ON listing_free_hosting_offers(status, start_date, end_exclusive)
  WHERE status = 'active';

COMMENT ON TABLE listing_free_hosting_offers IS
  'Short-term free-lodging windows. Not bookings. Half-open [start_date, end_exclusive).';

COMMENT ON COLUMN listing_free_hosting_offers.end_exclusive IS
  'First night NOT included (checkout day). Matches Midora stay / iCal half-open semantics.';

ALTER TABLE listing_free_hosting_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select own free hosting offers"
  ON listing_free_hosting_offers FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert own free hosting offers"
  ON listing_free_hosting_offers FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.user_id = auth.uid()
        AND l.rental_type = 'short_term'
    )
  );

CREATE POLICY "Owners update own free hosting offers"
  ON listing_free_hosting_offers FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete own free hosting offers"
  ON listing_free_hosting_offers FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins manage free hosting offers"
  ON listing_free_hosting_offers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public can read active offers only (for discovery). Exact listing privacy still via listings RLS.
CREATE POLICY "Public select active free hosting offers"
  ON listing_free_hosting_offers FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.status = 'approved'
        AND l.rental_type = 'short_term'
    )
  );

-- ---------------------------------------------------------------------------
-- Lead kind (extend existing inquiry table — no second messaging universe)
-- ---------------------------------------------------------------------------
ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS lead_kind text;

ALTER TABLE property_leads
  DROP CONSTRAINT IF EXISTS property_leads_lead_kind_chk;

ALTER TABLE property_leads
  ADD CONSTRAINT property_leads_lead_kind_chk
  CHECK (
    lead_kind IS NULL
    OR lead_kind IN ('availability', 'rental', 'message', 'free_hosting')
  );

COMMENT ON COLUMN property_leads.lead_kind IS
  'Optional inquiry kind. free_hosting = Free Hosting request (not a booking).';
