-- Simple listing availability (no booking calendar)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available_now';

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS availability_note text;

COMMENT ON COLUMN listings.availability_status IS 'available_now | from_month | upon_request';
COMMENT ON COLUMN listings.availability_note IS 'Free-text month when status is from_month';
