-- Separate short-term vs monthly rental mode fields on listings

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS supports_short_term boolean,
  ADD COLUMN IF NOT EXISTS supports_monthly boolean,
  ADD COLUMN IF NOT EXISTS minimum_stay_nights integer,
  ADD COLUMN IF NOT EXISTS minimum_stay_months integer,
  ADD COLUMN IF NOT EXISTS monthly_includes_bills boolean,
  ADD COLUMN IF NOT EXISTS monthly_terms text;

-- Backfill mode flags from prices / rental_type
UPDATE listings
SET supports_short_term = COALESCE(
  supports_short_term,
  rental_type = 'short_term'
    OR (price_per_night IS NOT NULL AND price_per_night > 0)
)
WHERE supports_short_term IS NULL;

UPDATE listings
SET supports_monthly = COALESCE(
  supports_monthly,
  rental_type IN ('monthly', 'long_term')
    OR (price_monthly IS NOT NULL AND price_monthly > 0
        AND (price_per_night IS NULL OR price_per_night <> price_monthly))
)
WHERE supports_monthly IS NULL;

-- Backfill minimum_stay_nights from min_stay_label when it mentions nights
UPDATE listings
SET minimum_stay_nights = sub.nights
FROM (
  SELECT
    id,
    NULLIF(substring(min_stay_label FROM '(\d+)'), '')::integer AS nights
  FROM listings
  WHERE min_stay_label IS NOT NULL
    AND min_stay_label ~* 'νύχτ'
) AS sub
WHERE listings.id = sub.id
  AND listings.minimum_stay_nights IS NULL
  AND sub.nights >= 1;

-- Backfill minimum_stay_months from label or min_months (floor 2 for monthly)
UPDATE listings
SET minimum_stay_months = GREATEST(
  2,
  COALESCE(
    NULLIF(substring(min_stay_label FROM '(\d+)'), '')::integer,
    CASE WHEN min_months >= 2 THEN min_months ELSE NULL END,
    2
  )
)
WHERE supports_monthly IS TRUE
  AND minimum_stay_months IS NULL
  AND (
    min_stay_label ~* 'μήν'
    OR min_months IS NOT NULL
    OR rental_type = 'monthly'
  );

-- Fix legacy monthly listings with min_months = 1
UPDATE listings
SET
  min_months = 2,
  minimum_stay_months = COALESCE(minimum_stay_months, 2)
WHERE supports_monthly IS TRUE
  AND (min_months IS NULL OR min_months < 2);

UPDATE listings
SET monthly_includes_bills = utilities_included
WHERE supports_monthly IS TRUE
  AND monthly_includes_bills IS NULL;
