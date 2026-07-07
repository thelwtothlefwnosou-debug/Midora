-- Midora feature migration: parking, video media
-- Run in Supabase SQL Editor after schema.sql

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS has_parking BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS max_guests INTEGER CHECK (max_guests IS NULL OR max_guests > 0);

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS cleaning_included BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER
    CHECK (duration_seconds IS NULL OR duration_seconds > 0);

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0);

CREATE INDEX IF NOT EXISTS listing_images_listing_cover_idx
  ON listing_images(listing_id, is_cover)
  WHERE is_cover = true;

CREATE INDEX IF NOT EXISTS listings_has_parking_idx ON listings(has_parking);
