-- Public profile slug and visibility toggles.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS public_profile_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_owned_listings_on_profile boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_cohosted_listings_on_profile boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_slug_unique_idx
  ON profiles(public_slug)
  WHERE public_slug IS NOT NULL;

COMMENT ON COLUMN profiles.public_slug IS 'URL-safe public profile identifier for /users/:slug';
COMMENT ON COLUMN profiles.public_profile_enabled IS 'Whether visitors can open the public profile page';
COMMENT ON COLUMN profiles.show_owned_listings_on_profile IS 'Show owned published listings on public profile';
COMMENT ON COLUMN profiles.show_cohosted_listings_on_profile IS 'Show co-hosted published listings on public profile';
