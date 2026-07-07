-- Listing wizard: private address, short-term pricing, contacts, locations, price rules

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS accepts_under_60_days boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_postal_code text,
  ADD COLUMN IF NOT EXISTS address_floor text,
  ADD COLUMN IF NOT EXISTS address_unit text,
  ADD COLUMN IF NOT EXISTS included_guests integer,
  ADD COLUMN IF NOT EXISTS extra_guest_fee_per_night numeric,
  ADD COLUMN IF NOT EXISTS ama_declaration_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS preferred_contact text,
  ADD COLUMN IF NOT EXISTS location_needs_review boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN listings.accepts_under_60_days IS 'Short-term always true; monthly owner-controlled';
COMMENT ON COLUMN listings.location_needs_review IS 'City/area not matched to canonical dataset';

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name_el text NOT NULL,
  normalized_name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  region text,
  municipality text,
  location_type text NOT NULL DEFAULT 'city',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS locations_normalized_name_idx ON public.locations (normalized_name);

CREATE TABLE IF NOT EXISTS public.listing_price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  label text,
  price_per_night numeric,
  included_guests integer,
  extra_guest_fee_per_night numeric,
  min_stay_nights integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_price_rules_date_order CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS listing_price_rules_listing_id_idx ON public.listing_price_rules (listing_id);

ALTER TABLE public.listing_price_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_price_rules_owner_all ON public.listing_price_rules
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY listing_price_rules_public_read ON public.listing_price_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.status = 'approved' AND COALESCE(l.is_hidden, false) = false
    )
  );
