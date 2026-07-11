-- Optional caption per listing photo

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS caption text;
