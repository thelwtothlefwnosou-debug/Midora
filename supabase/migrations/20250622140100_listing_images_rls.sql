-- Explicit INSERT/UPDATE policies for listing_images (owner draft uploads)

DROP POLICY IF EXISTS "Owners can insert listing images" ON listing_images;
CREATE POLICY "Owners can insert listing images"
  ON listing_images FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update listing images" ON listing_images;
CREATE POLICY "Owners can update listing images"
  ON listing_images FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete listing images" ON listing_images;
CREATE POLICY "Owners can delete listing images"
  ON listing_images FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );
