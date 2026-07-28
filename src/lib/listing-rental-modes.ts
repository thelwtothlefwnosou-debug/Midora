import type { Listing } from "@/lib/types";
import { pickLocale } from "@/lib/locale-fallbacks";
import { listingRentalType, listingSupportsMonthly, listingSupportsShortTerm, listingRentalBadgeLabels } from "@/lib/rental-types";
import {
  calculateMonthlyPrice,
  listingToMonthlyPricingInput,
} from "@/lib/listing-monthly-price";

export type PublicRentalMode = "short_term" | "monthly";

export const MONTHLY_MIN_STAY_FLOOR = 2;

/** Structural listing fields used by public mode/price helpers (monthly cols optional on older shapes). */
type ListingModeFields = Partial<
  Pick<
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
    | "monthly_pricing_mode"
    | "monthly_base_price"
    | "monthly_included_people"
    | "monthly_max_people"
    | "monthly_extra_person_price"
    | "monthly_max_price"
    | "monthly_price_tiers"
  >
>;

/** Single source of truth: `rental_type` only — one listing, one mode. */
export function resolveSupportsShortTerm(listing: ListingModeFields): boolean {
  return listingSupportsShortTerm(
    listing as Pick<Listing, "rental_type" | "price_per_night">
  );
}

export function resolveSupportsMonthly(listing: ListingModeFields): boolean {
  return listingSupportsMonthly(
    listing as Pick<Listing, "rental_type" | "price_monthly" | "price_per_night">
  );
}

export function resolveSupportsBothModes(_listing: ListingModeFields): boolean {
  return false;
}

export function defaultPublicRentalMode(listing: ListingModeFields): PublicRentalMode {
  const rt = listingRentalType(listing as Pick<Listing, "rental_type">);
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
  if (
    listingRentalType(listing as Pick<Listing, "rental_type">) === "short_term" &&
    (listing.min_months ?? 0) >= 1
  ) {
    return listing.min_months as number;
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

export function formatPublicMinStayNights(
  listing: ListingModeFields,
  t?: (key: "nightsCount", values: { count: number }) => string,
  locale?: string
): string {
  const n = resolveMinimumStayNights(listing);
  if (t) return t("nightsCount", { count: n });
  return n === 1
    ? pickLocale(locale, "1 νύχτα", "1 night")
    : pickLocale(locale, `${n} νύχτες`, `${n} nights`);
}

export function formatPublicMinStayMonths(
  listing: ListingModeFields,
  t?: (key: "monthsCount", values: { count: number }) => string,
  locale?: string
): string {
  const n = resolveMinimumStayMonths(listing);
  if (t) return t("monthsCount", { count: n });
  return n === 1
    ? pickLocale(locale, "1 μήνας", "1 month")
    : pickLocale(locale, `${n} μήνες`, `${n} months`);
}

export function formatPublicMinStayForMode(
  listing: ListingModeFields,
  mode: PublicRentalMode,
  t?: (key: "nightsCount" | "monthsCount", values: { count: number }) => string,
  locale?: string
): string {
  return mode === "short_term"
    ? formatPublicMinStayNights(listing, t, locale)
    : formatPublicMinStayMonths(listing, t, locale);
}

export function publicMinStayHeading(
  mode: PublicRentalMode,
  t?: (key: "minStayHeading" | "minDurationHeading") => string,
  locale?: string
): string {
  if (t) {
    return mode === "short_term" ? t("minStayHeading") : t("minDurationHeading");
  }
  return mode === "short_term"
    ? pickLocale(locale, "Ελάχιστη διαμονή", "Minimum stay")
    : pickLocale(locale, "Ελάχιστη διάρκεια", "Minimum duration");
}

export function publicPricePrimary(
  listing: ListingModeFields,
  mode: PublicRentalMode,
  selectedPeople?: number | null,
  units?: { perNight: string; perMonth: string },
  locale?: string
): {
  amount: number;
  suffix: string;
  display: string;
  subtext?: string | null;
  error?: string | null;
  isFromPrice?: boolean;
} {
  const perNight = units?.perNight ?? pickLocale(locale, "/ βράδυ", "/ night");
  const perMonth = units?.perMonth ?? pickLocale(locale, "/ μήνα", "/ month");
  const localeTag = locale ?? (units ? undefined : "el-GR");

  if (mode === "short_term") {
    const raw = listing.price_per_night ?? listing.price_monthly;
    const amount = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    return {
      amount,
      suffix: perNight,
      display:
        amount > 0
          ? `€${amount.toLocaleString(localeTag ?? "el-GR")} ${perNight}`
          : "—",
    };
  }

  const calc = calculateMonthlyPrice(
    listingToMonthlyPricingInput(listing),
    selectedPeople,
    undefined,
    locale
  );
  return {
    amount: calc.price,
    suffix: perMonth,
    display: calc.displayLabel,
    subtext: calc.subtext,
    error: calc.error,
    isFromPrice: calc.isFromPrice,
  };
}

export function publicPriceSecondaryHint(
  listing: ListingModeFields,
  mode: PublicRentalMode,
  selectedPeople?: number | null,
  locale?: string
): string | null {
  if (mode !== "monthly") return null;
  const calc = calculateMonthlyPrice(
    listingToMonthlyPricingInput(listing),
    selectedPeople,
    undefined,
    locale
  );
  return calc.subtext;
}

export function publicModeBadgeLabels(
  listing: ListingModeFields,
  _activeMode: PublicRentalMode,
  locale?: string
): { primary: string; secondary?: string } {
  return listingRentalBadgeLabels(
    listing as Pick<Listing, "rental_type" | "price_monthly" | "price_per_night">,
    locale
  );
}

export function monthlyDurationOptions(
  minMonths: number,
  t?: (key: "durationMonths" | "monthsPlus", values: { count: number }) => string,
  locale?: string
) {
  const floor = Math.max(MONTHLY_MIN_STAY_FLOOR, minMonths);
  const base = [2, 3, 6, 9, 12];
  return base
    .filter((value) => value >= floor)
    .map((value) => ({
      value,
      label: t
        ? value === 12
          ? t("monthsPlus", { count: 12 })
          : t("durationMonths", { count: value })
        : value === 12
          ? pickLocale(locale, "12+ μήνες", "12+ months")
          : pickLocale(locale, `${value} μήνες`, `${value} months`),
    }));
}

export function resolveMonthlyIncludesBills(listing: ListingModeFields): boolean {
  if (listing.monthly_includes_bills != null) return listing.monthly_includes_bills;
  return Boolean(listing.utilities_included);
}
