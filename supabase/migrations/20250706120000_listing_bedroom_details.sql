-- Optional photo + bed size note per bedroom (Blueground-style cards)

ALTER TABLE listing_sleeping_arrangements
  ADD COLUMN IF NOT EXISTS listing_image_id uuid REFERENCES listing_images(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bed_size_note text;
