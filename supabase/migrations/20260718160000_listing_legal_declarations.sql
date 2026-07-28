-- Optional owner legal declarations (tax + authority disclosure).
-- Safe to apply multiple times. listing-db-write strips missing columns if not applied yet.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS tax_obligation_accepted boolean NOT NULL DEFAULT false;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS authority_disclosure_accepted boolean NOT NULL DEFAULT false;
