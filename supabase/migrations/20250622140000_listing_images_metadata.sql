-- Extended listing_images metadata for wizard uploads
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
