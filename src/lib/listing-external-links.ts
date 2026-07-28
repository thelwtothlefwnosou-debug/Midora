import { pickLocale } from "@/lib/locale-fallbacks";

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

const EXTERNAL_LINKS_DISCLAIMER_EL =
  "Οι εξωτερικοί σύνδεσμοι προστίθενται από τον ιδιοκτήτη. Το Midora δεν ελέγχει ούτε διαχειρίζεται το περιεχόμενο ή τις συναλλαγές σε τρίτες πλατφόρμες.";
const EXTERNAL_LINKS_DISCLAIMER_EN =
  "External links are added by the owner. Midora does not control or manage content or transactions on third-party platforms.";

/** Configurable legal disclaimer for public external-link sections. */
export const EXTERNAL_LINKS_DISCLAIMER =
  process.env.NEXT_PUBLIC_EXTERNAL_LINKS_DISCLAIMER ?? EXTERNAL_LINKS_DISCLAIMER_EL;

export function externalLinksDisclaimer(locale?: string): string {
  if (process.env.NEXT_PUBLIC_EXTERNAL_LINKS_DISCLAIMER) {
    return EXTERNAL_LINKS_DISCLAIMER;
  }
  return pickLocale(locale, EXTERNAL_LINKS_DISCLAIMER_EL, EXTERNAL_LINKS_DISCLAIMER_EN);
}

export const EXTERNAL_LINK_PLATFORM_LABELS: Record<ExternalLinkPlatform, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  vrbo: "Vrbo",
  other: "Άλλη πλατφόρμα",
};

const EXTERNAL_LINK_PLATFORM_LABELS_EN: Record<ExternalLinkPlatform, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  vrbo: "Vrbo",
  other: "Other platform",
};

export function externalLinkPlatformLabel(
  platform: ExternalLinkPlatform,
  locale?: string
): string {
  return pickLocale(
    locale,
    EXTERNAL_LINK_PLATFORM_LABELS[platform],
    EXTERNAL_LINK_PLATFORM_LABELS_EN[platform]
  );
}

export const EXTERNAL_LINK_PUBLIC_BUTTON_LABELS: Record<ExternalLinkPlatform, string> = {
  airbnb: "Άνοιγμα αγγελίας στο Airbnb",
  booking: "Άνοιγμα αγγελίας στο Booking.com",
  vrbo: "Άνοιγμα αγγελίας στο Vrbo",
  other: "Άνοιγμα εξωτερικής αγγελίας",
};

const EXTERNAL_LINK_PUBLIC_BUTTON_LABELS_EN: Record<ExternalLinkPlatform, string> = {
  airbnb: "Open listing on Airbnb",
  booking: "Open listing on Booking.com",
  vrbo: "Open listing on Vrbo",
  other: "Open external listing",
};

export function externalLinkPublicButtonLabel(
  platform: ExternalLinkPlatform,
  locale?: string
): string {
  return pickLocale(
    locale,
    EXTERNAL_LINK_PUBLIC_BUTTON_LABELS[platform],
    EXTERNAL_LINK_PUBLIC_BUTTON_LABELS_EN[platform]
  );
}

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
  rawUrl: string,
  locale?: string
): ExternalLinkValidation {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: pickLocale(locale, "Συμπλήρωσε URL.", "Enter a URL."),
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: pickLocale(locale, "Μη έγκυρο URL.", "Invalid URL."),
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      error: pickLocale(
        locale,
        "Πρόσθεσε έγκυρο σύνδεσμο που ξεκινά με https://",
        "Add a valid link starting with https://"
      ),
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (SUSPICIOUS_SHORTENERS.some((s) => hostname === s || hostname.endsWith(`.${s}`))) {
    return {
      valid: false,
      error: pickLocale(
        locale,
        "Μη επιτρεπτοί συντομευμένοι σύνδεσμοι.",
        "Shortened links are not allowed."
      ),
    };
  }

  if (platform !== "other") {
    const allowed = PLATFORM_HOSTS[platform];
    if (!hostMatches(hostname, allowed)) {
      return {
        valid: false,
        error: pickLocale(
          locale,
          "Ο σύνδεσμος δεν φαίνεται να ανήκει στην επιλεγμένη πλατφόρμα.",
          "The link doesn't appear to belong to the selected platform."
        ),
      };
    }
  }

  const warning =
    platform === "other"
      ? pickLocale(
          locale,
          "Βεβαιώσου ότι το link οδηγεί σε δική σου αγγελία.",
          "Make sure the link leads to your own listing."
        )
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
