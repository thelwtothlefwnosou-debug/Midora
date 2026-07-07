-- Extended search, bilingual descriptions, referrals
-- Run in Supabase SQL Editor

ALTER TABLE listings ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_boost_until TIMESTAMPTZ;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS listings_search_boost_idx ON listings(search_boost_until);
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles(referral_code);
