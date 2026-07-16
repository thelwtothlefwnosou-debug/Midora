import { stayNightsBetween } from "@/lib/availability-calendar";
import { copySearchParams } from "@/lib/midora-search-state";
import { formatListingPrice, listingRentalType } from "@/lib/rental-types";
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
import type { Listing, ListingPriceRule } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

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
  context: ListingSearchPriceContext
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
          display: "Μη διαθέσιμο",
          helper: "Οι επιλεγμένες ημερομηνίες δεν είναι διαθέσιμες.",
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
        periods
      );

      if (computed) {
        const display = formatShortTermIndicativeDisplay(computed.total, computed.nights);
        return {
          sortAmount: computed.total,
          priceLabel: `€${computed.total.toLocaleString("el-GR")}`,
          priceUnit: ` · ${computed.nights} ${formatIndicativeNightsLabel(computed.nights)}`,
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
        const display = formatShortTermIndicativeDisplay(total, nights);
        return {
          sortAmount: total,
          priceLabel: `€${total.toLocaleString("el-GR")}`,
          priceUnit: ` · ${nights} ${formatIndicativeNightsLabel(nights)}`,
          display,
          isStayTotal: true,
          isIndicative: true,
          nights,
          total,
        };
      }
    }
  }

  const defaultStay = computeDefaultIndicativeStayPrice(pricing, rules, periods, guests);
  if (!defaultStay) return null;

  const display = formatShortTermIndicativeDisplay(
    defaultStay.total,
    defaultStay.nights
  );

  return {
    sortAmount: defaultStay.total,
    priceLabel: `€${defaultStay.total.toLocaleString("el-GR")}`,
    priceUnit: ` · ${defaultStay.nights} ${formatIndicativeNightsLabel(defaultStay.nights)}`,
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
  context: ListingSearchPriceContext = {}
): ResolvedListingSearchPrice {
  const rt = listingRentalType(listing);
  const filter = context.rentalTypeFilter;
  const preferShort =
    filter === "short_term" || (filter !== "monthly" && rt === "short_term");
  const preferMonthly =
    filter === "monthly" || (filter !== "short_term" && rt === "monthly");

  if (preferShort || filter === "short_term" || (filter == null && rt === "short_term")) {
    const shortTerm = resolveShortTermSearchPrice(listing, context);
    if (shortTerm) return shortTerm;
  }

  if (preferMonthly && context.durationMonths && context.durationMonths >= 1) {
    const perMonth = listing.price_monthly ?? listing.price_per_night ?? 0;
    if (perMonth > 0) {
      const months = context.durationMonths;
      const total = perMonth * months;
      const monthLabel = months === 1 ? "μήνας" : "μήνες";
      return {
        sortAmount: total,
        priceLabel: `€${total.toLocaleString("el-GR")}`,
        priceUnit: ` · ${months} ${monthLabel}`,
        display: `€${total.toLocaleString("el-GR")} · ${months} ${monthLabel}`,
        breakdown: `€${perMonth.toLocaleString("el-GR")} / μήνα × ${months} ${monthLabel}`,
        isStayTotal: true,
        isIndicative: true,
        months,
        total,
      };
    }
  }

  const price = formatListingPrice(listing);
  return {
    sortAmount: price.amount,
    priceLabel: `€${price.amount.toLocaleString("el-GR")}`,
    priceUnit: price.unit,
    display: price.display,
    isStayTotal: false,
    isIndicative: false,
  };
}

export function formatListingStayPrice(
  listing: ShortTermListing,
  interestFrom?: string,
  interestTo?: string,
  durationMonths?: number,
  rentalTypeFilter?: string | null
): { display: string; nights: number; total: number } | null {
  const resolved = resolveListingSearchPrice(listing, {
    interestFrom,
    interestTo,
    durationMonths,
    rentalTypeFilter,
  });

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
