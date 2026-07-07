-- Profile and listing contact method flags (portal — not booking)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_phone_contact boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_viber boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS viber_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_use_primary_phone boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS viber_use_primary_phone boolean NOT NULL DEFAULT true;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS allow_phone_contact boolean,
  ADD COLUMN IF NOT EXISTS allow_whatsapp boolean,
  ADD COLUMN IF NOT EXISTS allow_viber boolean,
  ADD COLUMN IF NOT EXISTS allow_message boolean,
  ADD COLUMN IF NOT EXISTS contact_whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS contact_viber_phone text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp_use_primary boolean,
  ADD COLUMN IF NOT EXISTS contact_viber_use_primary boolean;
