import type { Listing } from "@/lib/types";
import { listingRentalType, listingSupportsMonthly, listingSupportsShortTerm, listingRentalBadgeLabels } from "@/lib/rental-types";

export type PublicRentalMode = "short_term" | "monthly";

export const MONTHLY_MIN_STAY_FLOOR = 2;

type ListingModeFields = Pick<
  Listing,
  | "rental_type"
  | "price_monthly"
  | "price_per_night"
  | "supports_short_term"
  | "supports_monthly"
  | "minimum_stay_nights"
  | "minimum_stay_months"
  | "min_stay_label"
  | "min_months"
  | "monthly_terms"
  | "monthly_includes_bills"
  | "utilities_included"
  | "included_guests"
  | "extra_guest_fee_per_night"
  | "max_guests"
>;

/** Single source of truth: `rental_type` only — one listing, one mode. */
export function resolveSupportsShortTerm(listing: ListingModeFields): boolean {
  return listingSupportsShortTerm(listing);
}

export function resolveSupportsMonthly(listing: ListingModeFields): boolean {
  return listingSupportsMonthly(listing);
}

export function resolveSupportsBothModes(_listing: ListingModeFields): boolean {
  return false;
}

export function defaultPublicRentalMode(listing: ListingModeFields): PublicRentalMode {
  const rt = listingRentalType(listing);
  return rt === "short_term" ? "short_term" : "monthly";
}

export function fixedPublicRentalMode(listing: ListingModeFields): PublicRentalMode {
  return defaultPublicRentalMode(listing);
}

export function parseNightsFromLabel(label: string | null | undefined): number | null {
  if (!label?.trim()) return null;
  const t = label.trim().toLowerCase();
  if (!t.includes("νύχτ")) return null;
  const m = t.match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 ? n : null;
}

export function parseMonthsFromLabel(label: string | null | undefined): number | null {
  if (!label?.trim()) return null;
  const t = label.trim().toLowerCase();
  if (!t.includes("μήν")) return null;
  const m = t.match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 ? n : null;
}

/** Minimum nights for short-term — never uses monthly min_months. */
export function resolveMinimumStayNights(listing: ListingModeFields): number {
  if (listing.minimum_stay_nights != null && listing.minimum_stay_nights >= 1) {
    return listing.minimum_stay_nights;
  }
  const fromLabel = parseNightsFromLabel(listing.min_stay_label);
  if (fromLabel != null) return fromLabel;
  if (listingRentalType(listing) === "short_term" && listing.min_months >= 1) {
    return listing.min_months;
  }
  return 2;
}

/** Minimum months for monthly — floor 2, never 1. */
export function resolveMinimumStayMonths(listing: ListingModeFields): number {
  if (listing.minimum_stay_months != null && listing.minimum_stay_months >= MONTHLY_MIN_STAY_FLOOR) {
    return listing.minimum_stay_months;
  }
  const fromLabel = parseMonthsFromLabel(listing.min_stay_label);
  if (fromLabel != null && fromLabel >= MONTHLY_MIN_STAY_FLOOR) return fromLabel;
  if (listing.min_months != null && listing.min_months >= MONTHLY_MIN_STAY_FLOOR) {
    return listing.min_months;
  }
  return MONTHLY_MIN_STAY_FLOOR;
}

export function formatPublicMinStayNights(listing: ListingModeFields): string {
  const n = resolveMinimumStayNights(listing);
  return n === 1 ? "1 νύχτα" : `${n} νύχτες`;
}

export function formatPublicMinStayMonths(listing: ListingModeFields): string {
  const n = resolveMinimumStayMonths(listing);
  return n === 1 ? "1 μήνας" : `${n} μήνες`;
}

export function formatPublicMinStayForMode(
  listing: ListingModeFields,
  mode: PublicRentalMode
): string {
  return mode === "short_term"
    ? formatPublicMinStayNights(listing)
    : formatPublicMinStayMonths(listing);
}

export function publicMinStayHeading(mode: PublicRentalMode): string {
  return mode === "short_term" ? "Ελάχιστη διαμονή" : "Ελάχιστη διάρκεια";
}

export function publicPricePrimary(
  listing: ListingModeFields,
  mode: PublicRentalMode
): { amount: number; suffix: string; display: string } {
  if (mode === "short_term") {
    const amount = listing.price_per_night ?? listing.price_monthly;
    return {
      amount,
      suffix: "/ βράδυ",
      display: `€${amount.toLocaleString("el-GR")} / βράδυ`,
    };
  }
  return {
    amount: listing.price_monthly,
    suffix: "/ μήνα",
    display: `€${listing.price_monthly.toLocaleString("el-GR")} / μήνα`,
  };
}

export function publicPriceSecondaryHint(
  _listing: ListingModeFields,
  _mode: PublicRentalMode
): string | null {
  return null;
}

export function publicModeBadgeLabels(
  listing: ListingModeFields,
  _activeMode: PublicRentalMode
): { primary: string; secondary?: string } {
  return listingRentalBadgeLabels(listing);
}

export function monthlyDurationOptions(minMonths: number) {
  const floor = Math.max(MONTHLY_MIN_STAY_FLOOR, minMonths);
  const base = [
    { value: 2, label: "2 μήνες" },
    { value: 3, label: "3 μήνες" },
    { value: 6, label: "6 μήνες" },
    { value: 9, label: "9 μήνες" },
    { value: 12, label: "12+ μήνες" },
  ];
  return base.filter((o) => o.value >= floor);
}

export function resolveMonthlyIncludesBills(listing: ListingModeFields): boolean {
  if (listing.monthly_includes_bills != null) return listing.monthly_includes_bills;
  return Boolean(listing.utilities_included);
}
