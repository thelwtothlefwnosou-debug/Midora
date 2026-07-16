export type ExternalLinkPlatform = "airbnb" | "booking" | "vrbo" | "other";

export type ListingExternalLink = {
  id: string;
  listing_id: string;
  platform: ExternalLinkPlatform;
  url: string;
  label: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type ExternalLinkValidation = {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
  warning?: string;
};

/** Configurable legal disclaimer for public external-link sections. */
export const EXTERNAL_LINKS_DISCLAIMER =
  process.env.NEXT_PUBLIC_EXTERNAL_LINKS_DISCLAIMER ??
  "Οι εξωτερικοί σύνδεσμοι προστίθενται από τον ιδιοκτήτη. Το Midora δεν ελέγχει ούτε διαχειρίζεται το περιεχόμενο ή τις συναλλαγές σε τρίτες πλατφόρμες.";

export const EXTERNAL_LINK_PLATFORM_LABELS: Record<ExternalLinkPlatform, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  vrbo: "Vrbo",
  other: "Άλλη πλατφόρμα",
};

export const EXTERNAL_LINK_PUBLIC_BUTTON_LABELS: Record<ExternalLinkPlatform, string> = {
  airbnb: "Άνοιγμα αγγελίας στο Airbnb",
  booking: "Άνοιγμα αγγελίας στο Booking.com",
  vrbo: "Άνοιγμα αγγελίας στο Vrbo",
  other: "Άνοιγμα εξωτερικής αγγελίας",
};

const PLATFORM_HOSTS: Record<Exclude<ExternalLinkPlatform, "other">, string[]> = {
  airbnb: ["airbnb.com", "www.airbnb.com", "airbnb.gr", "www.airbnb.gr"],
  booking: ["booking.com", "www.booking.com"],
  vrbo: ["vrbo.com", "www.vrbo.com"],
};

const SUSPICIOUS_SHORTENERS = [
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rb.gy",
  "shorturl.at",
];

function hostMatches(hostname: string, allowed: string[]): boolean {
  const host = hostname.toLowerCase();
  return allowed.some((h) => host === h || host.endsWith(`.${h.replace(/^www\./, "")}`));
}

export function validateExternalLinkUrl(
  platform: ExternalLinkPlatform,
  rawUrl: string
): ExternalLinkValidation {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: "Συμπλήρωσε URL." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Μη έγκυρο URL." };
  }

  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      error: "Πρόσθεσε έγκυρο σύνδεσμο που ξεκινά με https://",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (SUSPICIOUS_SHORTENERS.some((s) => hostname === s || hostname.endsWith(`.${s}`))) {
    return { valid: false, error: "Μη επιτρεπτοί συντομευμένοι σύνδεσμοι." };
  }

  if (platform !== "other") {
    const allowed = PLATFORM_HOSTS[platform];
    if (!hostMatches(hostname, allowed)) {
      return {
        valid: false,
        error: "Ο σύνδεσμος δεν φαίνεται να ανήκει στην επιλεγμένη πλατφόρμα.",
      };
    }
  }

  const warning =
    platform === "other"
      ? "Βεβαιώσου ότι το link οδηγεί σε δική σου αγγελία."
      : undefined;

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
    warning,
  };
}

export function isStoredExternalLinkValid(link: Pick<ListingExternalLink, "platform" | "url">): boolean {
  return validateExternalLinkUrl(link.platform, link.url).valid;
}

export const EXTERNAL_LINK_PLATFORMS: ExternalLinkPlatform[] = [
  "airbnb",
  "booking",
  "vrbo",
  "other",
];
