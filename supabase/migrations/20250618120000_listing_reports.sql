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

COMMENT ON TABLE listing_reports IS 'Public listing reports — not linked to bookings or payments';
