import { normalizePhoneToE164 } from "@/lib/phone-e164";

/** Normalize Greek phone for wa.me links (expects mobile). */
export function normalizePhoneForWhatsApp(phone: string): string | null {
  const e164 = normalizePhoneToE164(phone);
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildListingWhatsAppMessage(listingTitle: string): string {
  return `Γεια σας, ενδιαφέρομαι για την αγγελία «${listingTitle}» στο Midora.`;
}

/** @deprecated Use buildListingWhatsAppMessage(title) */
export function buildListingWhatsAppMessageLegacy(
  listingTitle: string,
  city: string,
  area: string
): string {
  void city;
  void area;
  return buildListingWhatsAppMessage(listingTitle);
}
