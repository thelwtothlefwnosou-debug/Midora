-- Unavailable periods (informational only — NOT bookings)

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
  'Owner-declared unavailable date ranges — not bookings or reservations';

CREATE POLICY "Admins manage all unavailable periods"
  ON listing_unavailable_periods
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
