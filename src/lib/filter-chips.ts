import type { ReadonlyURLSearchParams } from "next/navigation";
import { propertyTypeLabel } from "@/lib/listing-filter-helpers";
import { MVP_SEARCH_RENTAL_TYPE_OPTIONS } from "@/lib/rental-types";

export type FilterChip = {
  key: string;
  param: string;
  label: string;
};

function formatEuro(n: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateChip(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    "Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαϊ", "Ιουν",
    "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ",
  ];
  return `${d} ${months[m - 1]}`;
}

function formatMonthChip(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const months = [
    "Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
    "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος",
  ];
  return `${months[m - 1]} ${y}`;
}

function rentalLabel(value: string): string {
  return (
    MVP_SEARCH_RENTAL_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
  );
}

export function buildFilterChips(
  params: URLSearchParams | ReadonlyURLSearchParams,
  options?: { includeRentalType?: boolean }
): FilterChip[] {
  const chips: FilterChip[] = [];
  const rt = params.get("rentalType") ?? "";
  const isShort = rt === "short_term";
  const includeRentalType = options?.includeRentalType ?? false;

  const push = (key: string, param: string, label: string) => {
    chips.push({ key, param, label });
  };

  if (includeRentalType && rt) push("rentalType", "rentalType", rentalLabel(rt));

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
    push("dates", "dates", `${formatDateChip(from)} – ${formatDateChip(to)}`);
  } else if (from) {
    push("interestFrom", "interestFrom", `Από ${formatDateChip(from)}`);
  }

  const startMonth = params.get("startMonth");
  if (startMonth) push("startMonth", "startMonth", formatMonthChip(startMonth));

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
      push(
        "priceNight",
        "priceNight",
        `${formatEuro(Number(minNight))}–${formatEuro(Number(maxNight))} / βράδυ`
      );
    } else if (maxNight) {
      push("maxPriceNight", "maxPriceNight", `Έως ${formatEuro(Number(maxNight))} / βράδυ`);
    } else if (minNight) {
      push("minPriceNight", "minPriceNight", `Από ${formatEuro(Number(minNight))} / βράδυ`);
    }
  } else if (rt) {
    if (minMonthly && maxMonthly) {
      push(
        "priceMonthly",
        "priceMonthly",
        `${formatEuro(Number(minMonthly))}–${formatEuro(Number(maxMonthly))} / μήνα`
      );
    } else if (maxMonthly) {
      push("maxMonthly", "maxMonthly", `Έως ${formatEuro(Number(maxMonthly))} / μήνα`);
    } else if (minMonthly) {
      push("minMonthly", "minMonthly", `Από ${formatEuro(Number(minMonthly))} / μήνα`);
    }
  } else {
    const min = params.get("minPrice");
    const max = params.get("maxPrice");
    if (min && max) {
      push("price", "price", `${formatEuro(Number(min))}–${formatEuro(Number(max))}`);
    } else if (max) {
      push("maxPrice", "maxPrice", `Έως ${formatEuro(Number(max))}`);
    } else if (min) {
      push("minPrice", "minPrice", `Από ${formatEuro(Number(min))}`);
    }
  }

  const type = params.get("type");
  if (type) push("type", "type", propertyTypeLabel(type));

  const bedrooms = params.get("bedrooms");
  if (bedrooms) {
    push(
      "bedrooms",
      "bedrooms",
      bedrooms === "10" ? "10+ υπνοδωμάτια" : `${bedrooms} υπνοδωμάτια`
    );
  }

  const bathrooms = params.get("bathrooms");
  if (bathrooms) {
    push(
      "bathrooms",
      "bathrooms",
      bathrooms === "4" ? "4+ μπάνια" : `${bathrooms} μπάνια`
    );
  }

  const guests = params.get("guests");
  if (guests) push("guests", "guests", `${guests} άτομα`);

  if (params.get("furnished") === "true") push("furnished", "furnished", "Επιπλωμένο");
  if (params.get("parking") === "true") push("parking", "parking", "Parking");
  if (params.get("pets") === "true") push("pets", "pets", "Κατοικίδια επιτρέπονται");
  if (params.get("heating") === "true") push("heating", "heating", "Θέρμανση");
  if (params.get("bills") === "true") push("bills", "bills", "Λογαριασμοί περιλαμβάνονται");

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
