-- Short-term pricing: weekend rates, discounts, optional cleaning fee note

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS weekend_price_per_night integer,
  ADD COLUMN IF NOT EXISTS weekend_days integer[] NOT NULL DEFAULT '{5,6}',
  ADD COLUMN IF NOT EXISTS cleaning_fee_note text,
  ADD COLUMN IF NOT EXISTS weekly_discount_percent integer,
  ADD COLUMN IF NOT EXISTS monthly_discount_percent integer,
  ADD COLUMN IF NOT EXISTS last_minute_discount_percent integer,
  ADD COLUMN IF NOT EXISTS early_bird_discount_percent integer;

COMMENT ON COLUMN listings.weekend_price_per_night IS 'Override nightly price for weekend_days (Fri/Sat default)';
COMMENT ON COLUMN listings.weekend_days IS 'JS getDay() values: 0=Sun, 5=Fri, 6=Sat';
COMMENT ON COLUMN listings.cleaning_fee_note IS 'Informational cleaning fee — not charged by Midora';
COMMENT ON COLUMN listings.weekly_discount_percent IS 'Discount % for stays 7+ nights';
COMMENT ON COLUMN listings.monthly_discount_percent IS 'Discount % for stays 28+ nights';
