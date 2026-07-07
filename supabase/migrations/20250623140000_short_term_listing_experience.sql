-- Short-term listing experience: highlights, sleeping, amenities, house rules, area hints

-- Highlights (max 3 enforced in app)
CREATE TABLE IF NOT EXISTS listing_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  label text NOT NULL,
  icon_key text NOT NULL DEFAULT 'sparkles',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_highlights_listing_id_idx ON listing_highlights(listing_id);

-- Sleeping arrangements
CREATE TABLE IF NOT EXISTS listing_sleeping_arrangements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  room_name text NOT NULL,
  bed_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_sleeping_listing_id_idx ON listing_sleeping_arrangements(listing_id);

-- Amenities (keys reference src/lib/amenities-catalog.ts)
CREATE TABLE IF NOT EXISTS listing_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amenity_key text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, amenity_key)
);

CREATE INDEX IF NOT EXISTS listing_amenities_listing_id_idx ON listing_amenities(listing_id);

-- Structured house rules + area hints on listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS pets_policy text,
  ADD COLUMN IF NOT EXISTS smoking_policy text,
  ADD COLUMN IF NOT EXISTS events_policy text,
  ADD COLUMN IF NOT EXISTS quiet_hours_from text,
  ADD COLUMN IF NOT EXISTS quiet_hours_to text,
  ADD COLUMN IF NOT EXISTS check_in_from text,
  ADD COLUMN IF NOT EXISTS check_in_to text,
  ADD COLUMN IF NOT EXISTS check_out_until text,
  ADD COLUMN IF NOT EXISTS arrival_method text,
  ADD COLUMN IF NOT EXISTS commercial_photo_policy text,
  ADD COLUMN IF NOT EXISTS nearby_metro text,
  ADD COLUMN IF NOT EXISTS distance_beach text,
  ADD COLUMN IF NOT EXISTS distance_center text,
  ADD COLUMN IF NOT EXISTS distance_airport text,
  ADD COLUMN IF NOT EXISTS distance_port text;

-- RLS
ALTER TABLE listing_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_sleeping_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_highlights_public_read ON listing_highlights;
CREATE POLICY listing_highlights_public_read ON listing_highlights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.status = 'approved' AND COALESCE(l.is_hidden, false) = false
    )
  );

DROP POLICY IF EXISTS listing_highlights_owner ON listing_highlights;
CREATE POLICY listing_highlights_owner ON listing_highlights
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
  );

DROP POLICY IF EXISTS listing_sleeping_public_read ON listing_sleeping_arrangements;
CREATE POLICY listing_sleeping_public_read ON listing_sleeping_arrangements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.status = 'approved' AND COALESCE(l.is_hidden, false) = false
    )
  );

DROP POLICY IF EXISTS listing_sleeping_owner ON listing_sleeping_arrangements;
CREATE POLICY listing_sleeping_owner ON listing_sleeping_arrangements
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
  );

DROP POLICY IF EXISTS listing_amenities_public_read ON listing_amenities;
CREATE POLICY listing_amenities_public_read ON listing_amenities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.status = 'approved' AND COALESCE(l.is_hidden, false) = false
    )
  );

DROP POLICY IF EXISTS listing_amenities_owner ON listing_amenities;
CREATE POLICY listing_amenities_owner ON listing_amenities
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
  );

-- Backfill pets_policy from pets_allowed
UPDATE listings
SET pets_policy = CASE WHEN pets_allowed THEN 'yes' ELSE 'no' END
WHERE pets_policy IS NULL;
