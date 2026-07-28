import type { Listing, ListingPriceRule } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { addDays, stayNightsBetween, todayDateKey } from "@/lib/availability-calendar";
import { getDefaultFiveNightRange } from "@/lib/listing-default-stay-range";
import { intlLocale, pickLocale } from "@/lib/locale-fallbacks";

export type ShortTermPricingConfig = Pick<
  Listing,
  | "price_per_night"
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

export type IndicativeStayPrice = {
  nights: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  averagePerNight: number;
  extraGuestNights: number;
  ruleLabel?: string | null;
  discountLabel?: string | null;
};

const DEFAULT_WEEKEND_DAYS = [5, 6];

function ruleForDate(rules: ListingPriceRule[], dateKey: string): ListingPriceRule | null {
  const matches = rules.filter((r) => r.start_date <= dateKey && r.end_date >= dateKey);
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
}

function dayOfWeek(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function isWeekendDay(dateKey: string, weekendDays: number[] | null | undefined): boolean {
  const days = weekendDays?.length ? weekendDays : DEFAULT_WEEKEND_DAYS;
  return days.includes(dayOfWeek(dateKey));
}

export function makeWeekendDayChecker(
  weekendDays: number[] | null | undefined
): (dateKey: string) => boolean {
  const days = weekendDays?.length ? weekendDays : DEFAULT_WEEKEND_DAYS;
  return (dateKey: string) => days.includes(dayOfWeek(dateKey));
}

export function isDateBlocked(
  dateKey: string,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[]
): boolean {
  return periods.some((p) => dateKey >= p.start_date && dateKey <= p.end_date);
}

/**
 * Price precedence:
 * 1. blocked → null
 * 2. date-specific rule (listing_price_rules)
 * 3. weekend price (listing.weekend_price_per_night)
 * 4. base price
 */
export function resolveNightlyPrice(
  config: ShortTermPricingConfig,
  rules: ListingPriceRule[],
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[],
  dateKey: string
): number | null {
  if (isDateBlocked(dateKey, periods)) return null;

  const base = config.price_per_night ?? 0;
  const rule = ruleForDate(rules, dateKey);

  if (rule?.price_per_night && rule.price_per_night > 0) {
    return rule.price_per_night;
  }

  if (
    config.weekend_price_per_night &&
    config.weekend_price_per_night > 0 &&
    isWeekendDay(dateKey, config.weekend_days)
  ) {
    return config.weekend_price_per_night;
  }

  return base > 0 ? base : null;
}

export function nightlyPriceForDate(
  basePricePerNight: number | null | undefined,
  rules: ListingPriceRule[],
  dateKey: string
): number | null {
  return resolveNightlyPrice(
    { price_per_night: basePricePerNight },
    rules,
    [],
    dateKey
  );
}

export function hasCustomPriceForDate(
  config: ShortTermPricingConfig,
  rules: ListingPriceRule[],
  dateKey: string
): boolean {
  const rule = ruleForDate(rules, dateKey);
  if (rule?.price_per_night && rule.price_per_night !== config.price_per_night) {
    return true;
  }
  if (
    config.weekend_price_per_night &&
    config.weekend_price_per_night !== config.price_per_night &&
    isWeekendDay(dateKey, config.weekend_days) &&
    !rule
  ) {
    return true;
  }
  return false;
}

export function findPriceRuleForDate(
  rules: ListingPriceRule[],
  dateKey: string
): ListingPriceRule | null {
  return ruleForDate(rules, dateKey);
}

function resolveDiscountPercent(
  nights: number,
  config: ShortTermPricingConfig,
  locale?: string
): {
  percent: number;
  label: string | null;
} {
  if (nights >= 28 && (config.monthly_discount_percent ?? 0) > 0) {
    const pct = config.monthly_discount_percent!;
    return {
      percent: pct,
      label: pickLocale(
        locale,
        `Έκπτωση 28+ νυχτών (${pct}%)`,
        `28+ night discount (${pct}%)`
      ),
    };
  }
  if (nights >= 7 && (config.weekly_discount_percent ?? 0) > 0) {
    const pct = config.weekly_discount_percent!;
    return {
      percent: pct,
      label: pickLocale(
        locale,
        `Εβδομαδιαία έκπτωση (${pct}%)`,
        `Weekly discount (${pct}%)`
      ),
    };
  }
  return { percent: 0, label: null };
}

/** Indicative only — not a booking total or agreement price. */
export function computeIndicativeStayPrice(
  listing: ShortTermPricingConfig &
    Pick<Listing, "price_per_night" | "included_guests" | "extra_guest_fee_per_night">,
  rules: ListingPriceRule[],
  startDate: string,
  endDate: string,
  guests: number,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[] = [],
  locale?: string
): IndicativeStayPrice | null {
  if (!startDate || !endDate || endDate < startDate) return null;

  const nights = stayNightsBetween(startDate, endDate);
  if (nights < 1) return null;

  let subtotal = 0;
  let extraGuestNights = 0;
  let ruleLabel: string | null = null;

  for (let i = 0; i < nights; i++) {
    const key = addDays(startDate, i);
    const rule = ruleForDate(rules, key);
    const nightPrice = resolveNightlyPrice(listing, rules, periods, key);
    if (!nightPrice || nightPrice <= 0) return null;

    const included = rule?.included_guests ?? listing.included_guests ?? guests;
    const extraFee =
      rule?.extra_guest_fee_per_night ?? listing.extra_guest_fee_per_night ?? 0;
    const extraGuests = Math.max(0, guests - (included ?? guests));
    subtotal += nightPrice + extraGuests * extraFee;
    if (extraGuests > 0) extraGuestNights += extraGuests;
    if (rule?.label && !ruleLabel) ruleLabel = rule.label;
  }

  const { percent: discountPercent, label: discountLabel } = resolveDiscountPercent(
    nights,
    listing,
    locale
  );
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount;

  return {
    nights,
    subtotal,
    discountPercent,
    discountAmount,
    total,
    averagePerNight: Math.round(total / nights),
    extraGuestNights,
    ruleLabel,
    discountLabel,
  };
}

export function countBedsFromSleeping(arrangements: { quantity: number }[]): number {
  return arrangements.reduce((sum, a) => sum + a.quantity, 0);
}

export function formatIndicativePriceBreakdown(
  price: IndicativeStayPrice,
  locale?: string
): string[] {
  const tag = intlLocale(locale);
  const lines: string[] = [];
  lines.push(
    `${price.nights} ${formatIndicativeNightsLabel(price.nights, locale)} × ~€${price.averagePerNight.toLocaleString(tag)}`
  );
  if (price.discountAmount > 0 && price.discountLabel) {
    lines.push(`${price.discountLabel}: -€${price.discountAmount.toLocaleString(tag)}`);
  }
  lines.push(
    `${pickLocale(locale, "Σύνολο", "Total")}: €${price.total.toLocaleString(tag)}`
  );
  return lines;
}

/** Default indicative stay length when visitor has not selected dates. */
export const INDICATIVE_DEFAULT_NIGHTS = 5;

export function formatIndicativeNightsLabel(nights: number, locale?: string): string {
  return nights === 1
    ? pickLocale(locale, "διανυκτέρευση", "night")
    : pickLocale(locale, "διανυκτερεύσεις", "nights");
}

export function formatShortTermIndicativeDisplay(
  total: number,
  nights: number,
  options?: { prefixFrom?: boolean; locale?: string }
): string {
  const locale = options?.locale;
  const amount = `€${total.toLocaleString(intlLocale(locale))}`;
  const prefix = options?.prefixFrom ? pickLocale(locale, "Από ", "From ") : "";
  const forWord = pickLocale(locale, "για", "for");
  return `${prefix}${amount} ${forWord} ${nights} ${formatIndicativeNightsLabel(nights, locale)}`;
}

export function formatPublicStayPriceTotal(total: number, locale?: string): string {
  return `€${total.toLocaleString(intlLocale(locale))} ${pickLocale(locale, "συνολικά", "total")}`;
}

export function formatPublicStayPriceNightsLine(nights: number, locale?: string): string {
  const forWord = pickLocale(locale, "για", "for");
  return `${forWord} ${nights} ${formatIndicativeNightsLabel(nights, locale)}`;
}

export function stayRangeHasBlockedNight(
  startDate: string,
  endDate: string,
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[]
): boolean {
  const nights = stayNightsBetween(startDate, endDate);
  for (let i = 0; i < nights; i++) {
    if (isDateBlocked(addDays(startDate, i), periods)) return true;
  }
  return false;
}

/** Indicative default stay price when no user dates are selected. */
export function computeDefaultIndicativeStayPrice(
  listing: ShortTermPricingConfig,
  rules: ListingPriceRule[] = [],
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[] = [],
  guests = 2,
  minimumStayNights = 1,
  locale?: string
): IndicativeStayPrice | null {
  const range = getDefaultFiveNightRange(
    listing,
    rules,
    periods,
    minimumStayNights,
    guests
  );
  if (!range) return null;

  return computeIndicativeStayPrice(
    listing,
    rules,
    range.checkIn,
    range.checkOut,
    guests,
    periods,
    locale
  );
}
