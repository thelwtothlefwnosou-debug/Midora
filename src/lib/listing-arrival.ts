import type { ArrivalMethod, Listing } from "@/lib/types";
import { ARRIVAL_LABELS, ARRIVAL_LABELS_EN, getArrivalLabel } from "@/lib/house-rules";
import { pickLocale } from "@/lib/locale-fallbacks";

type ArrivalListing = Pick<
  Listing,
  "check_in_from" | "check_in_to" | "check_out_until" | "arrival_method"
>;

export function hasArrivalInfo(listing: ArrivalListing): boolean {
  return Boolean(
    listing.check_in_from ||
      listing.check_in_to ||
      listing.check_out_until ||
      listing.arrival_method
  );
}

/** @deprecated Use `getArrivalInfoItems` with `Listing.houseRules` messages. */
export function arrivalInfoItems(
  listing: ArrivalListing,
  locale?: string
): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];

  if (listing.check_in_from || listing.check_in_to) {
    const range = [listing.check_in_from, listing.check_in_to].filter(Boolean).join(" – ");
    items.push({
      label: pickLocale(locale, "Άφιξη", "Check-in"),
      value: range,
    });
  }
  if (listing.check_out_until) {
    items.push({
      label: pickLocale(locale, "Αναχώρηση", "Check-out"),
      value: pickLocale(locale, `έως ${listing.check_out_until}`, `until ${listing.check_out_until}`),
    });
  }
  if (listing.arrival_method) {
    const method = listing.arrival_method as ArrivalMethod;
    items.push({
      label: pickLocale(locale, "Τρόπος άφιξης", "Arrival method"),
      value:
        locale === "en"
          ? ARRIVAL_LABELS_EN[method]
          : ARRIVAL_LABELS[method],
    });
  }

  return items;
}

type ArrivalT = (key: string, values?: Record<string, string | number>) => string;

/** i18n-aware variant via next-intl `Listing.houseRules` messages. */
export function getArrivalInfoItems(
  listing: ArrivalListing,
  t: ArrivalT,
  locale?: string
): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];

  if (listing.check_in_from || listing.check_in_to) {
    const range = [listing.check_in_from, listing.check_in_to].filter(Boolean).join(" – ");
    items.push({ label: t("checkInLabel"), value: range });
  }
  if (listing.check_out_until) {
    items.push({
      label: t("checkOutLabel"),
      value: t("checkOutUntil", { value: listing.check_out_until }),
    });
  }
  if (listing.arrival_method) {
    items.push({
      label: t("arrivalMethodLabel"),
      value: getArrivalLabel(listing.arrival_method as ArrivalMethod, t, locale),
    });
  }

  return items;
}
