-- Full Greece location system + listing location FKs

-- Replace legacy simple locations table if it exists with minimal columns
DROP TABLE IF EXISTS public.location_aliases CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_el text NOT NULL,
  normalized_name text NOT NULL,
  location_type text NOT NULL CHECK (
    location_type IN (
      'region',
      'regional_unit',
      'municipality',
      'city',
      'town',
      'settlement',
      'neighborhood',
      'island'
    )
  ),
  parent_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  region_name text,
  municipality_name text,
  latitude numeric,
  longitude numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX locations_normalized_name_type_uq ON public.locations (normalized_name, location_type);

CREATE TABLE public.location_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX locations_normalized_name_idx ON public.locations (normalized_name);
CREATE INDEX locations_parent_id_idx ON public.locations (parent_id);
CREATE INDEX locations_location_type_idx ON public.locations (location_type);
CREATE INDEX location_aliases_normalized_alias_idx ON public.location_aliases (normalized_alias);
CREATE INDEX location_aliases_location_id_idx ON public.location_aliases (location_id);

-- Trigram indexes when extension is available
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX locations_normalized_name_trgm_idx ON public.locations USING gin (normalized_name gin_trgm_ops);
  CREATE INDEX location_aliases_normalized_alias_trgm_idx ON public.location_aliases USING gin (normalized_alias gin_trgm_ops);
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'pg_trgm extension not available; skipping trigram indexes';
  WHEN duplicate_table THEN
    NULL;
END $$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS city_location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS area_location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city_display_name text,
  ADD COLUMN IF NOT EXISTS area_display_name text,
  ADD COLUMN IF NOT EXISTS private_street text,
  ADD COLUMN IF NOT EXISTS private_street_number text,
  ADD COLUMN IF NOT EXISTS private_postal_code text;

COMMENT ON COLUMN listings.city_location_id IS 'Canonical city/settlement from locations table';
COMMENT ON COLUMN listings.area_location_id IS 'Canonical neighborhood/area from locations table';
COMMENT ON COLUMN listings.city_display_name IS 'Greek display name fallback when FK missing';
COMMENT ON COLUMN listings.area_display_name IS 'Greek area display fallback when FK missing';

CREATE INDEX IF NOT EXISTS listings_city_location_id_idx ON public.listings (city_location_id);
CREATE INDEX IF NOT EXISTS listings_area_location_id_idx ON public.listings (area_location_id);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY locations_public_read ON public.locations
  FOR SELECT USING (is_active = true);

CREATE POLICY location_aliases_public_read ON public.location_aliases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.locations l
      WHERE l.id = location_id AND l.is_active = true
    )
  );
