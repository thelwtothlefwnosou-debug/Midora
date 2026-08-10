import type { ListingWithImages } from "@/lib/types";
import { pickLocale } from "@/lib/locale-fallbacks";
import {
  listingRentalBadgeLabels,
  needsPublicRegistryDisplay,
  legalRegistryRegisteredBadge,
} from "@/lib/rental-types";

export type ListingBadgeKind =
  | "verified"
  | "new"
  | "popular"
  | "instant"
  | "rental_type"
  | "rental_type_secondary"
  | "ama"
  | "checked"
  | "free_hosting";

export type ListingBadge = {
  kind: ListingBadgeKind;
  label: string;
  priority: number;
};

const BADGE_LABELS_EL: Record<ListingBadgeKind, string> = {
  new: "Νέο",
  popular: "Δημοφιλές",
  instant: "Άμεση επικοινωνία",
  verified: "Επαληθευμένος αγγελιοδότης",
  rental_type: "",
  rental_type_secondary: "",
  ama: "Με καταχωρημένο ΑΜΑ",
  checked: "Ελεγμένη αγγελία",
  free_hosting: "Δωρεάν φιλοξενία",
};

const BADGE_LABELS_EN: Record<ListingBadgeKind, string> = {
  new: "New",
  popular: "Popular",
  instant: "Instant contact",
  verified: "Verified advertiser",
  rental_type: "",
  rental_type_secondary: "",
  ama: "Registered AMA",
  checked: "Reviewed listing",
  free_hosting: "Free hosting",
};

const BADGE_LABEL_KEYS: Partial<Record<ListingBadgeKind, string>> = {
  new: "new",
  popular: "popular",
  instant: "instant",
  verified: "verified",
  ama: "ama",
  checked: "checked",
};

function badgeLabel(kind: ListingBadgeKind, locale?: string): string {
  return pickLocale(locale, BADGE_LABELS_EL[kind], BADGE_LABELS_EN[kind]);
}

export function listingBadgeKey(kind: ListingBadgeKind): string | null {
  return BADGE_LABEL_KEYS[kind] ?? null;
}

function isNewListing(createdAt: string): boolean {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

function isPopularListing(searchBoostUntil?: string | null): boolean {
  if (!searchBoostUntil) return false;
  const boost = new Date(searchBoostUntil);
  return !Number.isNaN(boost.getTime()) && boost > new Date();
}

function hasDirectContact(listing: ListingWithImages): boolean {
  return Boolean(listing.profiles?.phone?.trim());
}

/** Homepage cards — rental type + optional “new” only (no verified/checked claims). */
export function getHomepageListingBadges(
  listing: ListingWithImages,
  locale?: string
): ListingBadge[] {
  const badges: ListingBadge[] = [];
  const rentalBadges = listingRentalBadgeLabels(listing, locale);

  badges.push({
    kind: "rental_type",
    label: rentalBadges.primary,
    priority: 0,
  });

  if (isNewListing(listing.created_at)) {
    badges.push({
      kind: "new",
      label: pickLocale(locale, "Νέα αγγελία", "New listing"),
      priority: 1,
    });
  }

  return badges.slice(0, 2);
}

/** Up to 3 badges — rental type + verification prioritized */
export function getListingBadges(
  listing: ListingWithImages,
  locale?: string
): ListingBadge[] {
  const badges: ListingBadge[] = [];
  const rentalBadges = listingRentalBadgeLabels(listing, locale);

  badges.push({
    kind: "rental_type",
    label: rentalBadges.primary,
    priority: 0,
  });

  if (listing.advertiser_verification_status === "verified") {
    badges.push({ kind: "verified", label: badgeLabel("verified", locale), priority: 2 });
  }

  if (needsPublicRegistryDisplay(listing) && listing.ama_number?.trim()) {
    badges.push({
      kind: "ama",
      label: legalRegistryRegisteredBadge(listing, locale) ?? badgeLabel("ama", locale),
      priority: 3,
    });
  } else if (listing.ama_number?.trim()) {
    badges.push({ kind: "ama", label: badgeLabel("ama", locale), priority: 3 });
  }

  if (isNewListing(listing.created_at)) {
    badges.push({ kind: "new", label: badgeLabel("new", locale), priority: 4 });
  }
  if (isPopularListing(listing.search_boost_until)) {
    badges.push({ kind: "popular", label: badgeLabel("popular", locale), priority: 5 });
  }
  if (hasDirectContact(listing)) {
    badges.push({ kind: "instant", label: badgeLabel("instant", locale), priority: 6 });
  }

  return badges.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

export function badgeClassName(kind: ListingBadgeKind, variant: "default" | "home" = "default"): string {
  switch (kind) {
    case "rental_type":
      return "bg-charcoal/90 text-white";
    case "rental_type_secondary":
      return "bg-white/95 text-charcoal ring-1 ring-border";
    case "ama":
      return "bg-teal/95 text-white";
    case "checked":
      return variant === "home"
        ? "bg-white/92 text-charcoal/70 ring-1 ring-border normal-case tracking-normal font-medium"
        : "bg-gold/95 text-white";
    case "new":
      return "bg-charcoal text-white";
    case "popular":
      return "bg-gold/95 text-white";
    case "instant":
      return "bg-teal/95 text-white";
    case "free_hosting":
      return "bg-charcoal/92 text-white tracking-[0.08em]";
    case "verified":
    default:
      return "bg-white/95 text-charcoal";
  }
}
