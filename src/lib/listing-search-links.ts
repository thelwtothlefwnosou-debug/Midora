import { stayNightsBetween } from "@/lib/availability-calendar";
import { formatListingPrice, listingRentalType } from "@/lib/rental-types";
import type { Listing } from "@/lib/types";

const STAY_QUERY_KEYS = [
  "rentalType",
  "interestFrom",
  "interestTo",
  "start",
  "end",
  "startMonth",
  "durationMonths",
  "guests",
] as const;

/** Preserve search dates / duration when opening a listing from results. */
export function buildListingDetailHref(
  listing: { id: string; slug?: string | null },
  searchParams?: URLSearchParams | string | null
): string {
  const base = `/listings/${listing.id}`;

  if (!searchParams) return base;

  const source =
    typeof searchParams === "string"
      ? new URLSearchParams(searchParams)
      : searchParams;

  const next = new URLSearchParams();
  for (const key of STAY_QUERY_KEYS) {
    const value = source.get(key)?.trim();
    if (value) next.set(key, value);
  }

  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

export type ListingSearchPriceContext = {
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalTypeFilter?: string | null;
};

export type ResolvedListingSearchPrice = {
  sortAmount: number;
  priceLabel: string;
  priceUnit: string;
  display: string;
  breakdown?: string;
  isStayTotal: boolean;
  nights?: number;
  months?: number;
  total?: number;
};

/** Total stay price when dates/duration are set; otherwise nightly/monthly rate. */
export function resolveListingSearchPrice(
  listing: Pick<Listing, "rental_type" | "price_type" | "price_per_night" | "price_monthly">,
  context: ListingSearchPriceContext = {}
): ResolvedListingSearchPrice {
  const rt = listingRentalType(listing);
  const filter = context.rentalTypeFilter;
  const preferShort =
    filter === "short_term" || (filter !== "monthly" && rt === "short_term");
  const preferMonthly =
    filter === "monthly" || (filter !== "short_term" && rt === "monthly");

  if (
    (preferShort || filter === "short_term" || filter == null) &&
    context.interestFrom &&
    context.interestTo
  ) {
    const nights = stayNightsBetween(context.interestFrom, context.interestTo);
    if (nights >= 1) {
      const perNight = listing.price_per_night ?? listing.price_monthly ?? 0;
      if (perNight > 0) {
        const total = perNight * nights;
        const nightLabel = nights === 1 ? "νύχτα" : "νύχτες";
        return {
          sortAmount: total,
          priceLabel: `€${total.toLocaleString("el-GR")}`,
          priceUnit: ` · ${nights} ${nightLabel}`,
          display: `€${total.toLocaleString("el-GR")} · ${nights} ${nightLabel}`,
          breakdown: `€${perNight.toLocaleString("el-GR")} / βράδυ × ${nights} ${nightLabel}`,
          isStayTotal: true,
          nights,
          total,
        };
      }
    }
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
  };
}

export function formatListingStayPrice(
  listing: Pick<Listing, "rental_type" | "price_type" | "price_per_night" | "price_monthly">,
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

  if (!resolved.isStayTotal || resolved.total == null) return null;

  return {
    nights: resolved.nights ?? resolved.months ?? 0,
    total: resolved.total,
    display: resolved.display,
  };
}

export function parseSearchDurationMonths(raw?: string | null): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
}
