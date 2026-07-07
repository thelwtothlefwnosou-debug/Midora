import type { ListingWithImages } from "@/lib/types";
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
  | "checked";

export type ListingBadge = {
  kind: ListingBadgeKind;
  label: string;
  priority: number;
};

const BADGE_LABELS: Record<ListingBadgeKind, string> = {
  new: "Νέο",
  popular: "Δημοφιλές",
  instant: "Άμεση επικοινωνία",
  verified: "Επαληθευμένος αγγελιοδότης",
  rental_type: "",
  rental_type_secondary: "",
  ama: "Με καταχωρημένο ΑΜΑ",
  checked: "Ελεγμένη αγγελία",
};

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

function isReviewedListing(listing: ListingWithImages): boolean {
  return listing.status === "approved" && listing.approval_status === "approved";
}

/** Homepage cards — rental type, optional new, discrete reviewed badge only. */
export function getHomepageListingBadges(listing: ListingWithImages): ListingBadge[] {
  const badges: ListingBadge[] = [];
  const rentalBadges = listingRentalBadgeLabels(listing);

  badges.push({
    kind: "rental_type",
    label: rentalBadges.primary,
    priority: 0,
  });

  if (isNewListing(listing.created_at)) {
    badges.push({ kind: "new", label: BADGE_LABELS.new, priority: 1 });
  } else if (isReviewedListing(listing)) {
    badges.push({ kind: "checked", label: BADGE_LABELS.checked, priority: 2 });
  }

  return badges.slice(0, 2);
}

/** Up to 3 badges — rental type + verification prioritized */
export function getListingBadges(listing: ListingWithImages): ListingBadge[] {
  const badges: ListingBadge[] = [];
  const rentalBadges = listingRentalBadgeLabels(listing);

  badges.push({
    kind: "rental_type",
    label: rentalBadges.primary,
    priority: 0,
  });

  if (listing.advertiser_verification_status === "verified") {
    badges.push({ kind: "verified", label: BADGE_LABELS.verified, priority: 2 });
  }

  if (needsPublicRegistryDisplay(listing) && listing.ama_number?.trim()) {
    badges.push({
      kind: "ama",
      label: legalRegistryRegisteredBadge(listing) ?? BADGE_LABELS.ama,
      priority: 3,
    });
  } else if (listing.ama_number?.trim()) {
    badges.push({ kind: "ama", label: BADGE_LABELS.ama, priority: 3 });
  }

  if (isNewListing(listing.created_at)) {
    badges.push({ kind: "new", label: BADGE_LABELS.new, priority: 4 });
  }
  if (isPopularListing(listing.search_boost_until)) {
    badges.push({ kind: "popular", label: BADGE_LABELS.popular, priority: 5 });
  }
  if (hasDirectContact(listing)) {
    badges.push({ kind: "instant", label: BADGE_LABELS.instant, priority: 6 });
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
    case "verified":
    default:
      return "bg-white/95 text-charcoal";
  }
}
