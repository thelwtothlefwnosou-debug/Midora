-- Portal-safe lead statuses (no rental completion tracking)

ALTER TABLE property_leads DROP CONSTRAINT IF EXISTS property_leads_status_check;

UPDATE property_leads SET status = 'archived' WHERE status = 'closed';

ALTER TABLE property_leads
  ADD CONSTRAINT property_leads_status_check
  CHECK (status IN ('new', 'contacted', 'archived'));

ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS timing_note text;

COMMENT ON COLUMN property_leads.timing_note IS 'Free-text: when interested (not a booking date)';
