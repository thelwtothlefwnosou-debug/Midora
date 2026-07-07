import type { Listing, ListingPriceRule } from "@/lib/types";
import { addDays, stayNightsBetween } from "@/lib/availability-calendar";

export type IndicativeStayPrice = {
  nights: number;
  total: number;
  averagePerNight: number;
  extraGuestNights: number;
  ruleLabel?: string | null;
};

function ruleForDate(rules: ListingPriceRule[], dateKey: string): ListingPriceRule | null {
  const match = rules.find((r) => r.start_date <= dateKey && r.end_date >= dateKey);
  return match ?? null;
}

export function nightlyPriceForDate(
  basePricePerNight: number | null | undefined,
  rules: ListingPriceRule[],
  dateKey: string
): number | null {
  const base = basePricePerNight ?? 0;
  if (base <= 0 && rules.length === 0) return null;
  const rule = ruleForDate(rules, dateKey);
  const price = rule?.price_per_night ?? base;
  return price > 0 ? price : null;
}

export function hasCustomPriceForDate(
  basePricePerNight: number | null | undefined,
  rules: ListingPriceRule[],
  dateKey: string
): boolean {
  const rule = ruleForDate(rules, dateKey);
  if (!rule?.price_per_night) return false;
  return rule.price_per_night !== basePricePerNight;
}

export function findPriceRuleForDate(
  rules: ListingPriceRule[],
  dateKey: string
): ListingPriceRule | null {
  return ruleForDate(rules, dateKey);
}

/** Indicative only — not a booking total or agreement price. */
export function computeIndicativeStayPrice(
  listing: Pick<
    Listing,
    "price_per_night" | "included_guests" | "extra_guest_fee_per_night"
  >,
  rules: ListingPriceRule[],
  startDate: string,
  endDate: string,
  guests: number
): IndicativeStayPrice | null {
  if (!startDate || !endDate || endDate < startDate) return null;

  const nights = stayNightsBetween(startDate, endDate);
  if (nights < 1) return null;

  let total = 0;
  let extraGuestNights = 0;
  let ruleLabel: string | null = null;

  for (let i = 0; i < nights; i++) {
    const key = addDays(startDate, i);
    const rule = ruleForDate(rules, key);
    const baseNight = rule?.price_per_night ?? listing.price_per_night;
    if (!baseNight || baseNight <= 0) return null;

    const included = rule?.included_guests ?? listing.included_guests ?? guests;
    const extraFee =
      rule?.extra_guest_fee_per_night ?? listing.extra_guest_fee_per_night ?? 0;
    const extraGuests = Math.max(0, guests - included);
    total += baseNight + extraGuests * extraFee;
    if (extraGuests > 0) extraGuestNights += extraGuests;
    if (rule?.label && !ruleLabel) ruleLabel = rule.label;
  }

  return {
    nights,
    total,
    averagePerNight: Math.round(total / nights),
    extraGuestNights,
    ruleLabel,
  };
}

export function countBedsFromSleeping(
  arrangements: { quantity: number }[]
): number {
  return arrangements.reduce((sum, a) => sum + a.quantity, 0);
}
