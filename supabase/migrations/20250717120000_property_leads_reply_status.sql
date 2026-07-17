-- Align property_leads.status with app inquiry reply flow.
-- Production previously allowed: new | contacted | closed | archived
-- App uses: new | read | replied | archived
-- Safe remap only; no data drop.

UPDATE property_leads SET status = 'read' WHERE status = 'contacted';
UPDATE property_leads SET status = 'archived' WHERE status = 'closed';

ALTER TABLE property_leads DROP CONSTRAINT IF EXISTS property_leads_status_check;
ALTER TABLE property_leads
  ADD CONSTRAINT property_leads_status_check
  CHECK (status IN ('new', 'read', 'replied', 'archived'));
