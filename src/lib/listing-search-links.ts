import { stayNightsBetween } from "@/lib/availability-calendar";
import { copySearchParams } from "@/lib/midora-search-state";
import { listingRentalType } from "@/lib/rental-types";
import { getListingPublicId } from "@/lib/utils";
import {
  computeDefaultIndicativeStayPrice,
  computeIndicativeStayPrice,
  formatIndicativeNightsLabel,
  formatShortTermIndicativeDisplay,
  INDICATIVE_DEFAULT_NIGHTS,
  stayRangeHasBlockedNight,
  type ShortTermPricingConfig,
} from "@/lib/listing-short-term-price";
import {
  calculateMonthlyPrice,
  listingToMonthlyPricingInput,
} from "@/lib/listing-monthly-price";
import type { Listing, ListingPriceRule } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { intlLocale, pickLocale } from "@/lib/locale-fallbacks";

/** Preserve search context when opening a listing from results. */
export function buildListingDetailHref(
  listing: { id: string; slug?: string | null },
  searchParams?: URLSearchParams | string | null
): string {
  const base = `/listings/${getListingPublicId(listing)}`;

  if (!searchParams) return base;

  const next = copySearchParams(searchParams);
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

export type ListingSearchPriceContext = {
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
  guests?: number;
  priceRules?: ListingPriceRule[];
  unavailablePeriods?: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
};

export type ResolvedListingSearchPrice = {
  sortAmount: number;
  priceLabel: string;
  priceUnit: string;
  display: string;
  breakdown?: string;
  helper?: string;
  isStayTotal: boolean;
  isIndicative: boolean;
  isUnavailable?: boolean;
  nights?: number;
  months?: number;
  total?: number;
};

type ShortTermListing = Pick<
  Listing,
  | "rental_type"
  | "price_type"
  | "price_per_night"
  | "price_monthly"
  | "included_guests"
  | "extra_guest_fee_per_night"
  | "weekend_price_per_night"
  | "weekend_days"
  | "weekly_discount_percent"
  | "monthly_discount_percent"
  | "last_minute_discount_percent"
  | "early_bird_discount_percent"
  | "cleaning_fee_note"
>;

function resolveShortTermSearchPrice(
  listing: ShortTermListing,
  context: ListingSearchPriceContext,
  locale?: string
): ResolvedListingSearchPrice | null {
  const rules = context.priceRules ?? [];
  const periods = context.unavailablePeriods ?? [];
  const guests = context.guests ?? 2;
  const pricing = listing as ShortTermPricingConfig;

  if (context.interestFrom && context.interestTo) {
    const nights = stayNightsBetween(context.interestFrom, context.interestTo);
    if (nights >= 1) {
      if (stayRangeHasBlockedNight(context.interestFrom, context.interestTo, periods)) {
        return {
          sortAmount: 0,
          priceLabel: "—",
          priceUnit: "",
          display: pickLocale(locale, "Μη διαθέσιμο", "Unavailable"),
          helper: pickLocale(
            locale,
            "Οι επιλεγμένες ημερομηνίες δεν είναι διαθέσιμες.",
            "The selected dates are not available."
          ),
          isStayTotal: false,
          isIndicative: false,
          isUnavailable: true,
          nights,
        };
      }

      const computed = computeIndicativeStayPrice(
        pricing,
        rules,
        context.interestFrom,
        context.interestTo,
        guests,
        periods,
        locale
      );

      if (computed) {
        const display = formatShortTermIndicativeDisplay(computed.total, computed.nights, {
          locale,
        });
        return {
          sortAmount: computed.total,
          priceLabel: `€${computed.total.toLocaleString(intlLocale(locale))}`,
          priceUnit: ` · ${computed.nights} ${formatIndicativeNightsLabel(computed.nights, locale)}`,
          display,
          isStayTotal: true,
          isIndicative: true,
          nights: computed.nights,
          total: computed.total,
        };
      }

      const perNight = listing.price_per_night ?? 0;
      if (perNight > 0) {
        const total = perNight * nights;
        const display = formatShortTermIndicativeDisplay(total, nights, { locale });
        return {
          sortAmount: total,
          priceLabel: `€${total.toLocaleString(intlLocale(locale))}`,
          priceUnit: ` · ${nights} ${formatIndicativeNightsLabel(nights, locale)}`,
          display,
          isStayTotal: true,
          isIndicative: true,
          nights,
          total,
        };
      }
    }
  }

  const defaultStay = computeDefaultIndicativeStayPrice(
    pricing,
    rules,
    periods,
    guests,
    1,
    locale
  );
  if (!defaultStay) return null;

  const display = formatShortTermIndicativeDisplay(
    defaultStay.total,
    defaultStay.nights,
    { locale }
  );

  return {
    sortAmount: defaultStay.total,
    priceLabel: `€${defaultStay.total.toLocaleString(intlLocale(locale))}`,
    priceUnit: ` · ${defaultStay.nights} ${formatIndicativeNightsLabel(defaultStay.nights, locale)}`,
    display,
    isStayTotal: true,
    isIndicative: true,
    nights: defaultStay.nights,
    total: defaultStay.total,
  };
}

/** Total stay price when dates/duration are set; otherwise indicative 5-night (short-term) or rate. */
export function resolveListingSearchPrice(
  listing: ShortTermListing,
  context: ListingSearchPriceContext = {},
  locale?: string
): ResolvedListingSearchPrice {
  const rt = listingRentalType(listing);
  const filter =
    context.rentalTypeFilter === "monthly" || context.rentalTypeFilter === "short_term"
      ? context.rentalTypeFilter
      : null;

  // Search mode wins: never show monthly pricing in short-term results (or vice versa).
  const mode: "short_term" | "monthly" =
    filter ?? (rt === "short_term" ? "short_term" : "monthly");

  if (mode === "short_term") {
    if (rt !== "short_term") {
      return {
        sortAmount: 0,
        priceLabel: "—",
        priceUnit: "",
        display: "—",
        isStayTotal: false,
        isIndicative: false,
        isUnavailable: true,
      };
    }
    const shortTerm = resolveShortTermSearchPrice(listing, context, locale);
    if (shortTerm) return shortTerm;
    return {
      sortAmount: 0,
      priceLabel: "—",
      priceUnit: "",
      display: "—",
      isStayTotal: false,
      isIndicative: false,
      isUnavailable: true,
    };
  }

  if (rt !== "monthly") {
    return {
      sortAmount: 0,
      priceLabel: "—",
      priceUnit: "",
      display: "—",
      isStayTotal: false,
      isIndicative: false,
      isUnavailable: true,
    };
  }

  const people =
    context.guests != null && Number.isFinite(context.guests)
      ? Math.floor(context.guests)
      : null;
  const calc = calculateMonthlyPrice(
    listingToMonthlyPricingInput(listing),
    people,
    undefined,
    locale
  );
  if (calc.error) {
    return {
      sortAmount: listing.price_monthly ?? 0,
      priceLabel: "—",
      priceUnit: "",
      display: calc.error,
      helper: calc.subtext ?? undefined,
      isStayTotal: false,
      isIndicative: false,
      isUnavailable: true,
    };
  }
  if (calc.price > 0 || calc.displayLabel !== "—") {
    return {
      sortAmount: calc.price || listing.price_monthly || 0,
      priceLabel: calc.displayLabel.replace(/ \/ (μήνα|month)$/, ""),
      priceUnit: pickLocale(locale, " / μήνα", " / month"),
      display: calc.displayLabel,
      helper: calc.subtext ?? undefined,
      isStayTotal: false,
      isIndicative: calc.isFromPrice,
      months: context.durationMonths,
      total: calc.price,
    };
  }

  return {
    sortAmount: 0,
    priceLabel: "—",
    priceUnit: "",
    display: "—",
    isStayTotal: false,
    isIndicative: false,
    isUnavailable: true,
  };
}

export function formatListingStayPrice(
  listing: ShortTermListing,
  interestFrom?: string,
  interestTo?: string,
  durationMonths?: number,
  rentalTypeFilter?: string | null,
  locale?: string
): { display: string; nights: number; total: number } | null {
  const resolved = resolveListingSearchPrice(listing, {
    interestFrom,
    interestTo,
    durationMonths,
    rentalTypeFilter,
  }, locale);

  if (!resolved.isStayTotal || resolved.total == null || resolved.isUnavailable) return null;

  return {
    nights: resolved.nights ?? resolved.months ?? INDICATIVE_DEFAULT_NIGHTS,
    total: resolved.total,
    display: resolved.display,
  };
}

export function parseSearchDurationMonths(raw?: string | null): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
}
