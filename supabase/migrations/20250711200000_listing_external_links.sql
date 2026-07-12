-- Owner-provided external platform links (URLs only — no scraped content).

CREATE TABLE IF NOT EXISTS listing_external_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  label text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_external_links_platform_check CHECK (
    platform IN ('airbnb', 'booking', 'vrbo', 'other')
  ),
  CONSTRAINT listing_external_links_listing_platform_unique UNIQUE (listing_id, platform)
);

CREATE INDEX IF NOT EXISTS listing_external_links_listing_id_idx
  ON listing_external_links(listing_id);

ALTER TABLE listing_external_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select own listing external links"
  ON listing_external_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners insert own listing external links"
  ON listing_external_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners update own listing external links"
  ON listing_external_links FOR UPDATE
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

CREATE POLICY "Owners delete own listing external links"
  ON listing_external_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Public read public external links on approved listings"
  ON listing_external_links FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.status = 'approved'
        AND l.is_hidden = false
    )
  );

COMMENT ON TABLE listing_external_links IS
  'Owner-provided HTTPS links to the same property on other platforms — no imported content';
