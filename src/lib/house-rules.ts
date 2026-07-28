import type {
  ArrivalMethod,
  Listing,
  PolicyValue,
  SmokingPolicyValue,
} from "@/lib/types";
import { pickLocale } from "@/lib/locale-fallbacks";

/** @deprecated Use `getPolicyLabel` with `Listing.houseRules` */
export const POLICY_LABELS: Record<PolicyValue, string> = {
  yes: "Ναι",
  no: "Όχι",
  on_request: "Κατόπιν συνεννόησης",
};

const POLICY_LABELS_EN: Record<PolicyValue, string> = {
  yes: "Yes",
  no: "No",
  on_request: "By arrangement",
};

const SMOKING_LABELS_EN: Record<SmokingPolicyValue, string> = {
  yes: "Yes",
  no: "No",
  outdoor_only: "Outdoor areas only",
};

/** @deprecated Use `getSmokingLabel` with `Listing.houseRules` */
export const SMOKING_LABELS: Record<SmokingPolicyValue, string> = {
  yes: "Ναι",
  no: "Όχι",
  outdoor_only: "Μόνο σε εξωτερικό χώρο",
};

export const ARRIVAL_LABELS_EN: Record<ArrivalMethod, string> = {
  host: "Host greeting",
  self: "Self check-in",
  on_request: "By arrangement",
};

/** @deprecated Use `getArrivalLabel` with `Listing.houseRules` */
export const ARRIVAL_LABELS: Record<ArrivalMethod, string> = {
  host: "Υποδοχή από αγγελιοδότη",
  self: "Self check-in",
  on_request: "Κατόπιν συνεννόησης",
};

type HouseRulesListing = Pick<
  Listing,
  | "pets_policy"
  | "pets_allowed"
  | "smoking_policy"
  | "events_policy"
  | "quiet_hours_from"
  | "quiet_hours_to"
  | "check_in_from"
  | "check_in_to"
  | "check_out_until"
  | "arrival_method"
  | "commercial_photo_policy"
  | "max_guests"
>;

export function resolvePetsPolicy(listing: HouseRulesListing): PolicyValue | null {
  if (listing.pets_policy) return listing.pets_policy;
  if (listing.pets_allowed === true) return "yes";
  if (listing.pets_allowed === false) return "no";
  return null;
}

export function hasStructuredHouseRules(listing: HouseRulesListing): boolean {
  return Boolean(
    resolvePetsPolicy(listing) ||
      listing.smoking_policy ||
      listing.events_policy ||
      listing.quiet_hours_from ||
      listing.quiet_hours_to ||
      listing.check_in_from ||
      listing.check_in_to ||
      listing.check_out_until ||
      listing.arrival_method ||
      listing.commercial_photo_policy ||
      listing.max_guests
  );
}

export type HouseRuleItemKey =
  | "pets"
  | "smoking"
  | "events"
  | "quietHours"
  | "checkIn"
  | "checkOut"
  | "arrivalMethod"
  | "maxGuests"
  | "commercialPhoto";

export function houseRulesItems(
  listing: HouseRulesListing,
  locale?: string
): { key: HouseRuleItemKey; label: string; value: string }[] {
  const items: { key: HouseRuleItemKey; label: string; value: string }[] = [];
  const pets = resolvePetsPolicy(listing);
  if (pets) {
    items.push({
      key: "pets",
      label: pickLocale(locale, "Επιτρέπονται κατοικίδια", "Pets allowed"),
      value: pickLocale(locale, POLICY_LABELS[pets], POLICY_LABELS_EN[pets]),
    });
  }
  if (listing.smoking_policy) {
    items.push({
      key: "smoking",
      label: pickLocale(locale, "Επιτρέπεται κάπνισμα", "Smoking allowed"),
      value: pickLocale(
        locale,
        SMOKING_LABELS[listing.smoking_policy],
        SMOKING_LABELS_EN[listing.smoking_policy]
      ),
    });
  }
  if (listing.events_policy) {
    items.push({
      key: "events",
      label: pickLocale(locale, "Επιτρέπονται εκδηλώσεις", "Events allowed"),
      value: pickLocale(locale, POLICY_LABELS[listing.events_policy], POLICY_LABELS_EN[listing.events_policy]),
    });
  }
  if (listing.quiet_hours_from || listing.quiet_hours_to) {
    items.push({
      key: "quietHours",
      label: pickLocale(locale, "Ώρες κοινής ησυχίας", "Quiet hours"),
      value: [listing.quiet_hours_from, listing.quiet_hours_to].filter(Boolean).join(" – "),
    });
  }
  if (listing.check_in_from || listing.check_in_to) {
    items.push({
      key: "checkIn",
      label: "Check-in",
      value: [listing.check_in_from, listing.check_in_to].filter(Boolean).join(" – "),
    });
  }
  if (listing.check_out_until) {
    items.push({
      key: "checkOut",
      label: "Check-out",
      value: pickLocale(locale, `έως ${listing.check_out_until}`, `until ${listing.check_out_until}`),
    });
  }
  if (listing.arrival_method) {
    items.push({
      key: "arrivalMethod",
      label: pickLocale(locale, "Τρόπος άφιξης", "Arrival method"),
      value: pickLocale(
        locale,
        ARRIVAL_LABELS[listing.arrival_method],
        ARRIVAL_LABELS_EN[listing.arrival_method]
      ),
    });
  }
  if (listing.max_guests != null) {
    items.push({
      key: "maxGuests",
      label: pickLocale(locale, "Μέγιστος αριθμός ατόμων", "Maximum guests"),
      value: String(listing.max_guests),
    });
  }
  if (listing.commercial_photo_policy) {
    items.push({
      key: "commercialPhoto",
      label: pickLocale(locale, "Εμπορική φωτογράφιση/βιντεοσκόπηση", "Commercial photo/video"),
      value: pickLocale(
        locale,
        POLICY_LABELS[listing.commercial_photo_policy],
        POLICY_LABELS_EN[listing.commercial_photo_policy]
      ),
    });
  }
  return items;
}

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

/** i18n-aware policy value label via next-intl `Listing.houseRules` messages. */
export function getPolicyLabel(
  value: PolicyValue,
  t: TranslateFn,
  locale?: string
): string {
  try {
    const label = t(`policy.${value}`);
    if (!label || label.endsWith(`.${value}`)) {
      return pickLocale(locale, POLICY_LABELS[value], POLICY_LABELS_EN[value]);
    }
    return label;
  } catch {
    return pickLocale(locale, POLICY_LABELS[value], POLICY_LABELS_EN[value]);
  }
}

/** i18n-aware smoking policy label via next-intl `Listing.houseRules` messages. */
export function getSmokingLabel(
  value: SmokingPolicyValue,
  t: TranslateFn,
  locale?: string
): string {
  try {
    const label = t(`smoking.${value}`);
    if (!label || label.endsWith(`.${value}`)) {
      return pickLocale(locale, SMOKING_LABELS[value], SMOKING_LABELS_EN[value]);
    }
    return label;
  } catch {
    return pickLocale(locale, SMOKING_LABELS[value], SMOKING_LABELS_EN[value]);
  }
}

/** i18n-aware arrival method label via next-intl `Listing.houseRules` messages. */
export function getArrivalLabel(
  value: ArrivalMethod,
  t: TranslateFn,
  locale?: string
): string {
  try {
    const label = t(`arrival.${value}`);
    if (!label || label.endsWith(`.${value}`)) {
      return pickLocale(locale, ARRIVAL_LABELS[value], ARRIVAL_LABELS_EN[value]);
    }
    return label;
  } catch {
    return pickLocale(locale, ARRIVAL_LABELS[value], ARRIVAL_LABELS_EN[value]);
  }
}

/** i18n-aware variant of `houseRulesItems` via next-intl `Listing.houseRules` messages. */
export function getHouseRulesItems(
  listing: HouseRulesListing,
  t: TranslateFn,
  locale?: string
): { key: HouseRuleItemKey; label: string; value: string }[] {
  const items: { key: HouseRuleItemKey; label: string; value: string }[] = [];
  const pets = resolvePetsPolicy(listing);
  if (pets) {
    items.push({
      key: "pets",
      label: t("petsAllowedLabel"),
      value: getPolicyLabel(pets, t, locale),
    });
  }
  if (listing.smoking_policy) {
    items.push({
      key: "smoking",
      label: t("smokingAllowedLabel"),
      value: getSmokingLabel(listing.smoking_policy, t, locale),
    });
  }
  if (listing.events_policy) {
    items.push({
      key: "events",
      label: t("eventsAllowedLabel"),
      value: getPolicyLabel(listing.events_policy, t, locale),
    });
  }
  if (listing.quiet_hours_from || listing.quiet_hours_to) {
    items.push({
      key: "quietHours",
      label: t("quietHoursLabel"),
      value: [listing.quiet_hours_from, listing.quiet_hours_to].filter(Boolean).join(" – "),
    });
  }
  if (listing.check_in_from || listing.check_in_to) {
    items.push({
      key: "checkIn",
      label: t("checkInLabel"),
      value: [listing.check_in_from, listing.check_in_to].filter(Boolean).join(" – "),
    });
  }
  if (listing.check_out_until) {
    items.push({
      key: "checkOut",
      label: t("checkOutLabel"),
      value: t("checkOutUntil", { value: listing.check_out_until }),
    });
  }
  if (listing.arrival_method) {
    items.push({
      key: "arrivalMethod",
      label: t("arrivalMethodLabel"),
      value: getArrivalLabel(listing.arrival_method, t, locale),
    });
  }
  if (listing.max_guests != null) {
    items.push({ key: "maxGuests", label: t("maxGuestsLabel"), value: String(listing.max_guests) });
  }
  if (listing.commercial_photo_policy) {
    items.push({
      key: "commercialPhoto",
      label: t("commercialPhotoLabel"),
      value: getPolicyLabel(listing.commercial_photo_policy, t, locale),
    });
  }
  return items;
}
