-- Interest period fields on leads (not bookings)

ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS interest_start_date date,
  ADD COLUMN IF NOT EXISTS interest_end_date date,
  ADD COLUMN IF NOT EXISTS interest_start_month text,
  ADD COLUMN IF NOT EXISTS interest_duration_months integer;

COMMENT ON COLUMN property_leads.interest_start_date IS
  'Visitor period of interest start — not a confirmed booking';
COMMENT ON COLUMN property_leads.interest_end_date IS
  'Visitor period of interest end — not a confirmed booking';
