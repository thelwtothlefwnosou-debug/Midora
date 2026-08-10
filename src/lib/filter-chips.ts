import type { ReadonlyURLSearchParams } from "next/navigation";
import { getPropertyTypeLabel, propertyTypeLabel } from "@/lib/listing-filter-helpers";

export type FilterChip = {
  key: string;
  param: string;
  label: string;
};

/** next-intl translator scoped to `Listings.chip` (or compatible). */
type ChipT = (key: string, values?: Record<string, string | number>) => string;

export type BuildFilterChipsOptions = {
  includeRentalType?: boolean;
  /** When provided, chip labels are translated. Falls back to Greek otherwise. */
  t?: ChipT;
  /** Translator scoped to `PropertyTypes` for the property-type chip. */
  propertyTypeT?: ChipT;
  locale?: string;
};

function currencyLocale(locale?: string): string {
  return locale === "en" ? "en-IE" : "el-GR";
}

function formatEuro(n: number, locale?: string): string {
  return new Intl.NumberFormat(currencyLocale(locale), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateChip(iso: string, locale?: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "el-GR", {
    day: "numeric",
    month: "short",
  }).format(new Date(y, m - 1, d));
}

function formatMonthChip(ym: string, locale?: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "el-GR", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

export function buildFilterChips(
  params: URLSearchParams | ReadonlyURLSearchParams,
  options?: BuildFilterChipsOptions
): FilterChip[] {
  const chips: FilterChip[] = [];
  const rt = params.get("rentalType") ?? "";
  const isShort = rt === "short_term";
  const includeRentalType = options?.includeRentalType ?? false;
  const locale = options?.locale;

  const fallbackEl: Record<string, string> = {
    from: "Από {value}",
    priceRangeNight: "{min}–{max} / βράδυ",
    priceToNight: "Έως {value} / βράδυ",
    priceFromNight: "Από {value} / βράδυ",
    priceRangeMonth: "{min}–{max} / μήνα",
    priceToMonth: "Έως {value} / μήνα",
    priceFromMonth: "Από {value} / μήνα",
    priceRange: "{min}–{max}",
    priceTo: "Έως {value}",
    priceFrom: "Από {value}",
    bedrooms: "{count} υπνοδωμάτια",
    bedroomsPlus: "{count}+ υπνοδωμάτια",
    bathrooms: "{count} μπάνια",
    bathroomsPlus: "{count}+ μπάνια",
    guests: "{count} άτομα",
    furnished: "Επιπλωμένο",
    parking: "Parking",
    pets: "Κατοικίδια επιτρέπονται",
    heating: "Θέρμανση",
    bills: "Λογαριασμοί περιλαμβάνονται",
    rentalShortTerm: "Βραχυχρόνια μίσθωση",
    rentalMonthly: "Μηνιαία / μεσοπρόθεσμη",
    freeHosting: "Δωρεάν φιλοξενία",
  };
  const fallbackEn: Record<string, string> = {
    from: "From {value}",
    priceRangeNight: "{min}–{max} / night",
    priceToNight: "Up to {value} / night",
    priceFromNight: "From {value} / night",
    priceRangeMonth: "{min}–{max} / month",
    priceToMonth: "Up to {value} / month",
    priceFromMonth: "From {value} / month",
    priceRange: "{min}–{max}",
    priceTo: "Up to {value}",
    priceFrom: "From {value}",
    bedrooms: "{count} bedrooms",
    bedroomsPlus: "{count}+ bedrooms",
    bathrooms: "{count} bathrooms",
    bathroomsPlus: "{count}+ bathrooms",
    guests: "{count} people",
    furnished: "Furnished",
    parking: "Parking",
    pets: "Pets allowed",
    heating: "Heating",
    bills: "Utilities included",
    rentalShortTerm: "Short-term rental",
    rentalMonthly: "Monthly / mid-term",
    freeHosting: "Free hosting",
  };
  const fallback = locale === "en" ? fallbackEn : fallbackEl;

  const tr: ChipT = (key, values) => {
    if (options?.t) return options.t(key, values);
    let out = fallback[key] ?? key;
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        out = out.replace(`{${k}}`, String(v));
      }
    }
    return out;
  };

  const push = (key: string, param: string, label: string) => {
    chips.push({ key, param, label });
  };

  if (includeRentalType && rt) {
    push(
      "rentalType",
      "rentalType",
      isShort ? tr("rentalShortTerm") : tr("rentalMonthly")
    );
  }

  const city = params.get("city");
  if (city) push("city", "city", decodeURIComponent(city));

  const area = params.get("area");
  if (area) push("area", "area", decodeURIComponent(area));

  const district = params.get("district");
  if (district) push("district", "district", decodeURIComponent(district));

  const from =
    params.get("interestFrom")?.trim() || params.get("start")?.trim() || "";
  const to = params.get("interestTo")?.trim() || params.get("end")?.trim() || "";
  if (from && to) {
    push(
      "dates",
      "dates",
      `${formatDateChip(from, locale)} – ${formatDateChip(to, locale)}`
    );
  } else if (from) {
    push("interestFrom", "interestFrom", tr("from", { value: formatDateChip(from, locale) }));
  }

  const startMonth = params.get("startMonth");
  if (startMonth) push("startMonth", "startMonth", formatMonthChip(startMonth, locale));

  const minNight =
    params.get("minPriceNight") ?? (!isShort ? null : params.get("minPrice"));
  const maxNight =
    params.get("maxPriceNight") ?? (!isShort ? null : params.get("maxPrice"));
  const minMonthly =
    params.get("minMonthly") ?? (isShort ? null : params.get("minPrice"));
  const maxMonthly =
    params.get("maxMonthly") ?? (isShort ? null : params.get("maxPrice"));

  if (isShort) {
    if (minNight && maxNight) {
      push("priceNight", "priceNight", tr("priceRangeNight", {
        min: formatEuro(Number(minNight), locale),
        max: formatEuro(Number(maxNight), locale),
      }));
    } else if (maxNight) {
      push("maxPriceNight", "maxPriceNight", tr("priceToNight", { value: formatEuro(Number(maxNight), locale) }));
    } else if (minNight) {
      push("minPriceNight", "minPriceNight", tr("priceFromNight", { value: formatEuro(Number(minNight), locale) }));
    }
  } else if (rt) {
    if (minMonthly && maxMonthly) {
      push("priceMonthly", "priceMonthly", tr("priceRangeMonth", {
        min: formatEuro(Number(minMonthly), locale),
        max: formatEuro(Number(maxMonthly), locale),
      }));
    } else if (maxMonthly) {
      push("maxMonthly", "maxMonthly", tr("priceToMonth", { value: formatEuro(Number(maxMonthly), locale) }));
    } else if (minMonthly) {
      push("minMonthly", "minMonthly", tr("priceFromMonth", { value: formatEuro(Number(minMonthly), locale) }));
    }
  } else {
    const min = params.get("minPrice");
    const max = params.get("maxPrice");
    if (min && max) {
      push("price", "price", tr("priceRange", {
        min: formatEuro(Number(min), locale),
        max: formatEuro(Number(max), locale),
      }));
    } else if (max) {
      push("maxPrice", "maxPrice", tr("priceTo", { value: formatEuro(Number(max), locale) }));
    } else if (min) {
      push("minPrice", "minPrice", tr("priceFrom", { value: formatEuro(Number(min), locale) }));
    }
  }

  const type = params.get("type");
  if (type) {
    push(
      "type",
      "type",
      options?.propertyTypeT
        ? getPropertyTypeLabel(type, options.propertyTypeT, locale)
        : propertyTypeLabel(type, locale)
    );
  }

  const bedrooms = params.get("bedrooms");
  if (bedrooms) {
    push(
      "bedrooms",
      "bedrooms",
      bedrooms === "10"
        ? tr("bedroomsPlus", { count: 10 })
        : tr("bedrooms", { count: Number(bedrooms) })
    );
  }

  const bathrooms = params.get("bathrooms");
  if (bathrooms) {
    push(
      "bathrooms",
      "bathrooms",
      bathrooms === "4"
        ? tr("bathroomsPlus", { count: 4 })
        : tr("bathrooms", { count: Number(bathrooms) })
    );
  }

  const guests = params.get("guests");
  if (guests) push("guests", "guests", tr("guests", { count: Number(guests) }));

  if (params.get("furnished") === "true") push("furnished", "furnished", tr("furnished"));
  if (params.get("parking") === "true") push("parking", "parking", tr("parking"));
  if (params.get("pets") === "true") push("pets", "pets", tr("pets"));
  if (params.get("heating") === "true") push("heating", "heating", tr("heating"));
  if (params.get("bills") === "true") push("bills", "bills", tr("bills"));
  if (isShort && (params.get("freeHosting") === "true" || params.get("freeHosting") === "1")) {
    push("freeHosting", "freeHosting", tr("freeHosting"));
  }

  return chips;
}

export function removeFilterChip(
  params: URLSearchParams,
  chip: FilterChip
): URLSearchParams {
  const next = new URLSearchParams(params.toString());

  if (chip.param === "dates") {
    next.delete("interestFrom");
    next.delete("interestTo");
    next.delete("start");
    next.delete("end");
  } else if (chip.param === "priceNight") {
    next.delete("minPriceNight");
    next.delete("maxPriceNight");
    next.delete("minPrice");
    next.delete("maxPrice");
  } else if (chip.param === "priceMonthly") {
    next.delete("minMonthly");
    next.delete("maxMonthly");
    next.delete("minPrice");
    next.delete("maxPrice");
  } else if (chip.param === "price") {
    next.delete("minPrice");
    next.delete("maxPrice");
  } else {
    next.delete(chip.param);
  }

  return next;
}
