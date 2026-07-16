-- Allow public read of profiles with public_slug or active co-host role.

DROP POLICY IF EXISTS "Public can view listing owner profiles" ON profiles;

CREATE POLICY "Public can view listing owner profiles"
  ON profiles FOR SELECT
  USING (
    public.profile_has_approved_listing(profiles.id)
    OR auth.uid() = id
    OR public.is_admin()
    OR (
      COALESCE(public_profile_enabled, true) = true
      AND public_slug IS NOT NULL
      AND btrim(public_slug) <> ''
    )
    OR EXISTS (
      SELECT 1
      FROM listing_cohosts c
      INNER JOIN listings l ON l.id = c.listing_id
      WHERE c.cohost_user_id = profiles.id
        AND c.status = 'accepted'
        AND l.status = 'approved'
        AND COALESCE(l.is_hidden, false) = false
    )
  );
