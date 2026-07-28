-- Monthly / mid-term occupancy-based pricing

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS monthly_pricing_mode text
    CHECK (monthly_pricing_mode IS NULL OR monthly_pricing_mode IN ('fixed', 'extra_person', 'tiers')),
  ADD COLUMN IF NOT EXISTS monthly_base_price integer,
  ADD COLUMN IF NOT EXISTS monthly_included_people integer,
  ADD COLUMN IF NOT EXISTS monthly_max_people integer,
  ADD COLUMN IF NOT EXISTS monthly_extra_person_price integer,
  ADD COLUMN IF NOT EXISTS monthly_max_price integer;

COMMENT ON COLUMN listings.monthly_pricing_mode IS
  'fixed | extra_person | tiers — monthly occupancy pricing mode';
COMMENT ON COLUMN listings.monthly_base_price IS
  'Base monthly price (mirrors price_monthly for fixed/extra_person)';
COMMENT ON COLUMN listings.monthly_included_people IS
  'People included in the base monthly price (extra_person mode)';
COMMENT ON COLUMN listings.monthly_max_people IS
  'Max occupants for monthly stay (defaults to max_guests)';
COMMENT ON COLUMN listings.monthly_extra_person_price IS
  'Extra €/month per person above included (extra_person mode)';
COMMENT ON COLUMN listings.monthly_max_price IS
  'Optional cap on calculated monthly price';

-- Backfill: existing monthly listings → fixed mode using price_monthly
UPDATE public.listings
SET
  monthly_pricing_mode = COALESCE(monthly_pricing_mode, 'fixed'),
  monthly_base_price = COALESCE(monthly_base_price, NULLIF(price_monthly, 0)),
  monthly_max_people = COALESCE(monthly_max_people, max_guests),
  monthly_included_people = COALESCE(monthly_included_people, GREATEST(1, LEAST(COALESCE(max_guests, 2), 2)))
WHERE COALESCE(supports_monthly, rental_type = 'monthly', false) = true
  OR rental_type = 'monthly';

CREATE TABLE IF NOT EXISTS public.listing_monthly_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  people_from integer NOT NULL CHECK (people_from >= 1),
  people_to integer NOT NULL CHECK (people_to >= 1),
  monthly_price integer NOT NULL CHECK (monthly_price > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_monthly_price_tiers_range CHECK (people_to >= people_from)
);

CREATE INDEX IF NOT EXISTS listing_monthly_price_tiers_listing_id_idx
  ON public.listing_monthly_price_tiers (listing_id);

ALTER TABLE public.listing_monthly_price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_monthly_price_tiers_owner_all ON public.listing_monthly_price_tiers
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY listing_monthly_price_tiers_public_read ON public.listing_monthly_price_tiers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.status = 'approved'
        AND COALESCE(l.is_hidden, false) = false
    )
  );
