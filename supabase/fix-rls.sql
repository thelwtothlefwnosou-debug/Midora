-- Fix: infinite recursion in RLS policies
-- Run this in Supabase SQL Editor (once)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_has_approved_listing(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.user_id = profile_id
      AND l.status = 'approved'
      AND (l.expires_at IS NULL OR l.expires_at > NOW())
  );
$$;

-- Listings: no direct profiles subquery (was causing recursion)
DROP POLICY IF EXISTS "Approved non-expired listings are public" ON listings;
CREATE POLICY "Approved non-expired listings are public"
  ON listings FOR SELECT USING (
    (status = 'approved' AND (expires_at IS NULL OR expires_at > NOW()))
    OR auth.uid() = user_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE TO authenticated USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Profiles: use security definer function instead of nested listings query
DROP POLICY IF EXISTS "Public can view listing owner profiles" ON profiles;
CREATE POLICY "Public can view listing owner profiles"
  ON profiles FOR SELECT USING (
    public.profile_has_approved_listing(profiles.id)
    OR auth.uid() = id
    OR public.is_admin()
  );

-- Listing images: use is_admin() helper
DROP POLICY IF EXISTS "Images follow listing visibility" ON listing_images;
CREATE POLICY "Images follow listing visibility"
  ON listing_images FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l WHERE l.id = listing_id AND (
        (l.status = 'approved' AND (l.expires_at IS NULL OR l.expires_at > NOW()))
        OR l.user_id = auth.uid()
        OR public.is_admin()
      )
    )
  );
