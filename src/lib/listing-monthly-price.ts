/**
 * Monthly / mid-term occupancy-based pricing.
 * Midora does not process payments — display/calc only; owner confirms final terms.
 */

import { intlLocale, pickLocale } from "@/lib/locale-fallbacks";

export type MonthlyPricingMode = "fixed" | "extra_person" | "tiers";

export type MonthlyPriceTier = {
  people_from: number;
  people_to: number;
  monthly_price: number;
};

export type MonthlyPricingInput = {
  pricingMode?: MonthlyPricingMode | null;
  /** Canonical monthly rate / base (also listings.price_monthly). */
  basePrice?: number | null;
  monthlyBasePrice?: number | null;
  includedPeople?: number | null;
  maxPeople?: number | null;
  extraPersonPrice?: number | null;
  maxPrice?: number | null;
  tiers?: MonthlyPriceTier[] | null;
  /** Legacy capacity fallback. */
  maxGuests?: number | null;
  priceMonthly?: number | null;
};

export type MonthlyPriceResult = {
  price: number;
  isFromPrice: boolean;
  displayLabel: string;
  subtext: string | null;
  error: string | null;
  selectedPeople: number | null;
  maxPeople: number;
  includedPeople: number;
  mode: MonthlyPricingMode;
};

function positiveInt(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const v = Math.floor(n);
  return v > 0 ? v : null;
}

function nonNegInt(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const v = Math.floor(n);
  return v >= 0 ? v : null;
}

export function resolveMonthlyPricingMode(
  input: MonthlyPricingInput
): MonthlyPricingMode {
  const mode = input.pricingMode;
  if (mode === "fixed" || mode === "extra_person" || mode === "tiers") return mode;
  if (input.tiers && input.tiers.length > 0) return "tiers";
  if (
    (input.extraPersonPrice != null && input.extraPersonPrice > 0) ||
    (input.includedPeople != null && input.includedPeople > 0)
  ) {
    return "extra_person";
  }
  return "fixed";
}

export function resolveMonthlyMaxPeople(input: MonthlyPricingInput): number {
  return (
    positiveInt(input.maxPeople) ??
    positiveInt(input.maxGuests) ??
    1
  );
}

export function resolveMonthlyBasePrice(input: MonthlyPricingInput): number {
  return (
    positiveInt(input.monthlyBasePrice) ??
    positiveInt(input.basePrice) ??
    positiveInt(input.priceMonthly) ??
    0
  );
}

type MonthlyDisplayT = (
  key: string,
  values?: Record<string, string | number>
) => string;

function formatMonthlyEuro(amount: number, locale?: string): string {
  return `€${amount.toLocaleString(intlLocale(locale))}`;
}

function personWord(count: number, t?: MonthlyDisplayT, locale?: string): string {
  if (t) return t(count === 1 ? "personOne" : "personOther", { count });
  return pickLocale(locale, count === 1 ? "άτομο" : "άτομα", count === 1 ? "person" : "people");
}

function sortTiers(tiers: MonthlyPriceTier[]): MonthlyPriceTier[] {
  return [...tiers].sort(
    (a, b) => a.people_from - b.people_from || a.people_to - b.people_to
  );
}

function findTierPrice(
  tiers: MonthlyPriceTier[],
  people: number
): number | null {
  for (const tier of sortTiers(tiers)) {
    if (people >= tier.people_from && people <= tier.people_to) {
      return positiveInt(tier.monthly_price);
    }
  }
  return null;
}

/**
 * Shared monthly occupancy price calculator — search cards, detail, inquiry, owner preview.
 */
export function calculateMonthlyPrice(
  input: MonthlyPricingInput,
  selectedPeople?: number | null,
  t?: MonthlyDisplayT,
  locale?: string
): MonthlyPriceResult {
  const mode = resolveMonthlyPricingMode(input);
  const maxPeople = resolveMonthlyMaxPeople(input);
  const basePrice = resolveMonthlyBasePrice(input);
  const includedPeople =
    positiveInt(input.includedPeople) ?? Math.min(2, maxPeople);
  const extraPersonPrice = nonNegInt(input.extraPersonPrice) ?? 0;
  const maxPrice = positiveInt(input.maxPrice);
  const people =
    selectedPeople != null && Number.isFinite(selectedPeople)
      ? Math.floor(selectedPeople)
      : null;

  if (people != null && people > maxPeople) {
    const msg = t
      ? t("maxPeopleExceeded", { max: maxPeople })
      : pickLocale(
          locale,
          `Το ακίνητο δέχεται έως ${maxPeople} άτομα.`,
          `This property accepts up to ${maxPeople} people.`
        );
    return {
      price: 0,
      isFromPrice: false,
      displayLabel: "—",
      subtext: msg,
      error: msg,
      selectedPeople: people,
      maxPeople,
      includedPeople,
      mode,
    };
  }

  if (people != null && people < 1) {
    const msg = t
      ? t("selectOnePerson")
      : pickLocale(locale, "Επίλεξε τουλάχιστον 1 άτομο.", "Select at least 1 person.");
    return {
      price: 0,
      isFromPrice: false,
      displayLabel: "—",
      subtext: msg,
      error: msg,
      selectedPeople: people,
      maxPeople,
      includedPeople,
      mode,
    };
  }

  const perMonth = t ? t("perMonthSuffix") : pickLocale(locale, "/ μήνα", "/ month");
  const fromPrefix = t ? t("fromPrefix") : pickLocale(locale, "Από ", "From ");

  // No people selected → "from" / base display
  if (people == null) {
    if (mode === "tiers" && input.tiers && input.tiers.length > 0) {
      const minTier = sortTiers(input.tiers)[0];
      const fromPrice = positiveInt(minTier.monthly_price) ?? basePrice;
      return {
        price: fromPrice,
        isFromPrice: true,
        displayLabel:
          fromPrice > 0
            ? `${fromPrefix}${formatMonthlyEuro(fromPrice, locale)} ${perMonth}`
            : "—",
        subtext:
          minTier.people_to >= minTier.people_from
            ? t
              ? t("priceUpToPeople", { count: minTier.people_to })
              : pickLocale(
                  locale,
                  `Η τιμή αφορά έως ${minTier.people_to} άτομα.`,
                  `Price applies to up to ${minTier.people_to} people.`
                )
            : null,
        error: null,
        selectedPeople: null,
        maxPeople,
        includedPeople,
        mode,
      };
    }

    if (mode === "extra_person") {
      return {
        price: basePrice,
        isFromPrice: true,
        displayLabel:
          basePrice > 0
            ? `${fromPrefix}${formatMonthlyEuro(basePrice, locale)} ${perMonth}`
            : "—",
        subtext:
          includedPeople > 0
            ? t
              ? t("priceUpToPeople", { count: includedPeople })
              : pickLocale(
                  locale,
                  `Η τιμή αφορά έως ${includedPeople} ${personWord(includedPeople, t, locale)}.`,
                  `Price applies to up to ${includedPeople} ${personWord(includedPeople, t, locale)}.`
                )
            : null,
        error: null,
        selectedPeople: null,
        maxPeople,
        includedPeople,
        mode,
      };
    }

    return {
      price: basePrice,
      isFromPrice: false,
      displayLabel:
        basePrice > 0 ? `${formatMonthlyEuro(basePrice, locale)} ${perMonth}` : "—",
      subtext:
        maxPeople > 0
          ? t
            ? t("forUpToPeople", { count: maxPeople })
            : pickLocale(
                locale,
                `Για έως ${maxPeople} ${personWord(maxPeople, t, locale)}`,
                `For up to ${maxPeople} ${personWord(maxPeople, t, locale)}`
              )
          : null,
      error: null,
      selectedPeople: null,
      maxPeople,
      includedPeople,
      mode,
    };
  }

  // People selected → exact monthly price
  let price = 0;

  if (mode === "tiers") {
    const tierPrice = input.tiers?.length
      ? findTierPrice(input.tiers, people)
      : null;
    if (tierPrice == null) {
      return {
        price: 0,
        isFromPrice: false,
        displayLabel: t ? t("requestPrice") : pickLocale(locale, "Στείλε αίτημα για τιμή", "Request a price quote"),
        subtext: t
          ? t("ownerConfirmsPrice")
          : pickLocale(
              locale,
              "Η τελική τιμή επιβεβαιώνεται από τον ιδιοκτήτη.",
              "Final price is confirmed by the owner."
            ),
        error: null,
        selectedPeople: people,
        maxPeople,
        includedPeople,
        mode,
      };
    }
    price = tierPrice;
  } else if (mode === "extra_person") {
    const extra = Math.max(0, people - includedPeople);
    price = basePrice + extra * extraPersonPrice;
    if (maxPrice != null) price = Math.min(price, maxPrice);
  } else {
    price = basePrice;
  }

  return {
    price,
    isFromPrice: false,
    displayLabel:
      price > 0 ? `${formatMonthlyEuro(price, locale)} ${perMonth}` : "—",
    subtext: t
      ? t("forPeople", { count: people })
      : pickLocale(
          locale,
          `για ${people} ${personWord(people, t, locale)}`,
          `for ${people} ${personWord(people, t, locale)}`
        ),
    error: null,
    selectedPeople: people,
    maxPeople,
    includedPeople,
    mode,
  };
}

export function listingToMonthlyPricingInput(listing: {
  monthly_pricing_mode?: MonthlyPricingMode | null;
  monthly_base_price?: number | null;
  monthly_included_people?: number | null;
  monthly_max_people?: number | null;
  monthly_extra_person_price?: number | null;
  monthly_max_price?: number | null;
  price_monthly?: number | null;
  max_guests?: number | null;
  monthly_price_tiers?: MonthlyPriceTier[] | null;
}): MonthlyPricingInput {
  return {
    pricingMode: listing.monthly_pricing_mode,
    monthlyBasePrice: listing.monthly_base_price,
    priceMonthly: listing.price_monthly,
    includedPeople: listing.monthly_included_people,
    maxPeople: listing.monthly_max_people,
    maxGuests: listing.max_guests,
    extraPersonPrice: listing.monthly_extra_person_price,
    maxPrice: listing.monthly_max_price,
    tiers: listing.monthly_price_tiers ?? null,
  };
}

export function buildExtraPersonExamples(input: MonthlyPricingInput): {
  people: number;
  price: number;
}[] {
  const maxPeople = resolveMonthlyMaxPeople(input);
  const included = positiveInt(input.includedPeople) ?? Math.min(2, maxPeople);
  const samples = Array.from(
    new Set([included, Math.min(included + 2, maxPeople), Math.min(included + 4, maxPeople), maxPeople])
  )
    .filter((n) => n >= 1 && n <= maxPeople)
    .sort((a, b) => a - b);

  return samples.map((people) => ({
    people,
    price: calculateMonthlyPrice(input, people).price,
  }));
}

export function validateMonthlyOccupancyPricing(input: MonthlyPricingInput): string | null {
  const mode = resolveMonthlyPricingMode(input);
  const maxPeople = resolveMonthlyMaxPeople(input);
  const included = positiveInt(input.includedPeople) ?? 1;

  if (mode === "tiers") {
    const tiers = input.tiers ?? [];
    if (tiers.length === 0) return "monthlyTierRequired";
    const sorted = sortTiers(tiers);
    for (const t of sorted) {
      if (t.people_from < 1 || t.people_to < t.people_from) {
        return "monthlyTierInvalidRange";
      }
      if (t.people_to > maxPeople) {
        return "monthlyTierExceedsMaxPeople";
      }
      if (!positiveInt(t.monthly_price)) {
        return "monthlyTierPositivePrice";
      }
    }
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].people_from <= sorted[i - 1].people_to) {
        return "monthlyTierOverlap";
      }
    }
    if (maxPeople < 1) return "monthlyMaxPeopleRequired";
    return null;
  }

  const base = resolveMonthlyBasePrice(input);
  if (base <= 0) return "monthlyBasePriceRequired";
  if (maxPeople < 1) return "monthlyMaxPeopleRequired";

  if (mode === "extra_person") {
    if (included < 1) return "monthlyIncludedPeopleRequired";
    if (maxPeople < included) {
      return "monthlyMaxPeopleBelowIncluded";
    }
    const extra = nonNegInt(input.extraPersonPrice);
    if (extra == null) return "monthlyExtraPersonRequired";
    const maxPrice = positiveInt(input.maxPrice);
    if (maxPrice != null && maxPrice < base) {
      return "monthlyMaxPriceBelowBase";
    }
  }

  return null;
}

/** Owner review / summary copy for monthly occupancy pricing. */
export function formatMonthlyOccupancyReviewSummary(
  input: MonthlyPricingInput,
  t?: MonthlyDisplayT,
  locale = "el"
): {
  title: string;
  lines: string[];
} {
  const perMonth = t ? t("perMonthSuffix") : pickLocale(locale, "/ μήνα", "/ month");
  const fromPrefix = t ? t("fromPrefix") : pickLocale(locale, "Από ", "From ");
  const mode = resolveMonthlyPricingMode(input);
  const base = resolveMonthlyBasePrice(input);
  const maxPeople = resolveMonthlyMaxPeople(input);
  const included = positiveInt(input.includedPeople) ?? Math.min(2, maxPeople);
  const extra = nonNegInt(input.extraPersonPrice) ?? 0;
  const maxPrice = positiveInt(input.maxPrice);

  if (mode === "fixed") {
    return {
      title: t ? t("title") : pickLocale(locale, "Μηνιαία τιμή", "Monthly price"),
      lines: [
        base > 0
          ? t
            ? t("fixedLine", {
                price: formatMonthlyEuro(base, locale),
                perMonth,
                count: maxPeople,
              })
            : pickLocale(
                locale,
                `${formatMonthlyEuro(base, locale)} ${perMonth} για έως ${maxPeople} ${personWord(maxPeople, t, locale)}`,
                `${formatMonthlyEuro(base, locale)} ${perMonth} for up to ${maxPeople} ${personWord(maxPeople, t, locale)}`
              )
          : "—",
      ],
    };
  }

  if (mode === "tiers") {
    const tiers = sortTiers(input.tiers ?? []);
    return {
      title: t ? t("titleTiers") : pickLocale(locale, "Μηνιαία τιμή (βαθμίδες)", "Monthly price (tiers)"),
      lines:
        tiers.length > 0
          ? tiers.map((tier) =>
              t
                ? t("tierLine", {
                    from: tier.people_from,
                    to: tier.people_to,
                    price: formatMonthlyEuro(tier.monthly_price, locale),
                    perMonth,
                  })
                : pickLocale(
                    locale,
                    `${tier.people_from}–${tier.people_to} άτομα → ${formatMonthlyEuro(tier.monthly_price, locale)} ${perMonth}`,
                    `${tier.people_from}–${tier.people_to} people → ${formatMonthlyEuro(tier.monthly_price, locale)} ${perMonth}`
                  )
            )
          : [t ? t("noTiers") : pickLocale(locale, "Δεν έχουν οριστεί βαθμίδες", "No tiers configured")],
    };
  }

  const lines = [
    base > 0
      ? t
        ? t("extraPersonBaseLine", {
            price: formatMonthlyEuro(base, locale),
            perMonth,
            fromPrefix,
            count: included,
          })
        : pickLocale(
            locale,
            `${fromPrefix}${formatMonthlyEuro(base, locale)} ${perMonth} για έως ${included} ${personWord(included, t, locale)}`,
            `${fromPrefix}${formatMonthlyEuro(base, locale)} ${perMonth} for up to ${included} ${personWord(included, t, locale)}`
          )
      : "—",
  ];
  if (extra > 0) {
    lines.push(
      t
        ? t("extraPersonFeeLine", { price: formatMonthlyEuro(extra, locale), perMonth })
        : pickLocale(
            locale,
            `+${formatMonthlyEuro(extra, locale)} ${perMonth} ανά επιπλέον άτομο`,
            `+${formatMonthlyEuro(extra, locale)} ${perMonth} per extra person`
          )
    );
  }
  if (maxPrice != null) {
    lines.push(
      t
        ? t("maxPriceLine", { price: formatMonthlyEuro(maxPrice, locale), perMonth })
        : pickLocale(
            locale,
            `Μέγιστη τιμή: ${formatMonthlyEuro(maxPrice, locale)} ${perMonth}`,
            `Maximum price: ${formatMonthlyEuro(maxPrice, locale)} ${perMonth}`
          )
    );
  }
  if (maxPeople > 0) {
    lines.push(
      t
        ? t("upToPeopleLine", { count: maxPeople })
        : pickLocale(locale, `Έως ${maxPeople} άτομα`, `Up to ${maxPeople} people`)
    );
  }
  return {
    title: t ? t("title") : pickLocale(locale, "Μηνιαία τιμή", "Monthly price"),
    lines,
  };
}
