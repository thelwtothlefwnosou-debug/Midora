/** Normalize Greek phone numbers to E.164 (+30...). */
export function normalizePhoneToE164(phone: string, defaultCountry = "30"): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(defaultCountry)) {
    return `+${digits}`;
  }

  // Local mobile with trunk 0 (e.g. 06941234567)
  if (digits.startsWith("0") && digits.length === 11) {
    return `+${defaultCountry}${digits.slice(1)}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `+${defaultCountry}${digits.slice(1)}`;
  }

  // Greek mobile without trunk 0 (e.g. 6941234567)
  if (/^(69|68|67)\d{8}$/.test(digits)) {
    return `+${defaultCountry}${digits}`;
  }

  if (digits.length === 9 && digits.startsWith("6")) {
    return `+${defaultCountry}${digits}`;
  }

  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}

export function formatPhoneForDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("30") && digits.length === 12) {
    const local = `0${digits.slice(2)}`;
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return e164;
}

export function isValidGreekMobileE164(e164: string): boolean {
  const digits = e164.replace(/\D/g, "");
  return /^30(69|68|67)\d{8}$/.test(digits);
}

export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const e164a = a?.trim() ? normalizePhoneToE164(a) : null;
  const e164b = b?.trim() ? normalizePhoneToE164(b) : null;
  return Boolean(e164a && e164b && e164a === e164b);
}
