-- Persist last visited create-wizard step for draft resume («Συνέχισε τη συμπλήρωση»).
-- Values are catalog step ids (e.g. amenities, photos, review). Safe if not applied yet:
-- listing-db-write strips missing columns.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS wizard_resume_step text;
