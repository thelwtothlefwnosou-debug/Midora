-- Email alerts for saved searches
-- Run in Supabase SQL Editor

ALTER TABLE saved_searches
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE saved_searches
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS saved_search_notifications (
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (saved_search_id, listing_id)
);

CREATE INDEX IF NOT EXISTS saved_search_notifications_listing_idx
  ON saved_search_notifications(listing_id);
