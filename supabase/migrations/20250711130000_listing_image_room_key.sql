-- Room-by-room photo tour (Airbnb-style house tour)

ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS room_key text;

CREATE INDEX IF NOT EXISTS listing_images_listing_room_idx
  ON listing_images(listing_id, room_key);
