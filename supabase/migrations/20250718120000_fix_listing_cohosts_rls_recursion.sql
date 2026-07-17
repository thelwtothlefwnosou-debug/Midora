-- Fix infinite RLS recursion between listings <-> listing_cohosts.
--
-- Cycle was:
--   listings policy "Cohosts select shared listings"
--     → SELECT listing_cohosts (RLS)
--   listing_cohosts policy "Public read accepted cohosts on approved listings"
--     → SELECT listings (RLS)
--   → infinite recursion
--
-- Pattern: SECURITY DEFINER helpers (same as is_admin / profile_has_approved_listing).

CREATE OR REPLACE FUNCTION public.user_is_accepted_cohost(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listing_cohosts c
    WHERE c.listing_id = p_listing_id
      AND c.cohost_user_id = auth.uid()
      AND c.status = 'accepted'
  );
$$;

CREATE OR REPLACE FUNCTION public.listing_is_publicly_visible(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND l.status = 'approved'
      AND COALESCE(l.is_hidden, false) = false
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_is_accepted_public_cohost(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listing_cohosts c
    INNER JOIN public.listings l ON l.id = c.listing_id
    WHERE c.cohost_user_id = p_profile_id
      AND c.status = 'accepted'
      AND l.status = 'approved'
      AND COALESCE(l.is_hidden, false) = false
  );
$$;

-- Listings: cohost access without RLS subquery into listing_cohosts
DROP POLICY IF EXISTS "Cohosts select shared listings" ON listings;
CREATE POLICY "Cohosts select shared listings"
  ON listings FOR SELECT
  TO authenticated
  USING (public.user_is_accepted_cohost(id));

-- listing_cohosts: public read without RLS subquery into listings
DROP POLICY IF EXISTS "Public read accepted cohosts on approved listings" ON listing_cohosts;
CREATE POLICY "Public read accepted cohosts on approved listings"
  ON listing_cohosts FOR SELECT
  TO anon, authenticated
  USING (
    status = 'accepted'
    AND public.listing_is_publicly_visible(listing_id)
  );

-- listing_contact_numbers: same listings visibility helper (prevents related cycles)
DROP POLICY IF EXISTS "Public read public contact numbers on approved listings" ON listing_contact_numbers;
CREATE POLICY "Public read public contact numbers on approved listings"
  ON listing_contact_numbers FOR SELECT
  TO anon, authenticated
  USING (
    visibility = 'public'
    AND public.listing_is_publicly_visible(listing_id)
  );

-- Profiles: avoid direct listing_cohosts/listings join under RLS
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
    OR public.profile_is_accepted_public_cohost(profiles.id)
  );

COMMENT ON FUNCTION public.user_is_accepted_cohost(uuid) IS
  'RLS-safe: true when auth.uid() is an accepted cohost on the listing';
COMMENT ON FUNCTION public.listing_is_publicly_visible(uuid) IS
  'RLS-safe: true when listing is approved and not hidden';
COMMENT ON FUNCTION public.profile_is_accepted_public_cohost(uuid) IS
  'RLS-safe: true when profile is accepted cohost on a public listing';
