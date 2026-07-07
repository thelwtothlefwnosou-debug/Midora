-- Listing view counter (real visits + organic boost computed in app)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN listings.view_count IS 'Real public detail-page views (display may include organic boost in app)';

CREATE OR REPLACE FUNCTION public.increment_listing_view(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE listings
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = now()
  WHERE id = p_listing_id
    AND status = 'approved'
    AND COALESCE(is_hidden, false) = false;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_listing_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_listing_view(uuid) TO anon, authenticated;
