import type { ListingsFilterValues } from "@/components/listings/ListingsFilters";

const DETAILED_KEYS = [
  "bedrooms",
  "bathrooms",
  "type",
  "furnished",
  "bills",
  "parking",
  "pets",
  "heating",
  "amenities",
  "minSqm",
  "minMonths",
  "minPrice",
  "maxPrice",
  "minPriceNight",
  "maxPriceNight",
  "minMonthly",
  "maxMonthly",
] as const;

/** Count active filter groups for badge (not individual checkboxes). */
export function countActiveFilterGroups(values: ListingsFilterValues): number {
  let groups = 0;
  const isShort = values.rentalType === "short_term";

  const hasMin = isShort
    ? Boolean(values.minPriceNight || values.minPrice)
    : Boolean(values.minMonthly || values.minPrice);
  const hasMax = isShort
    ? Boolean(values.maxPriceNight || values.maxPrice)
    : Boolean(values.maxMonthly || values.maxPrice);
  if (hasMin || hasMax) groups++;

  if (values.bedrooms) groups++;
  if (values.bathrooms) groups++;
  if (values.type) groups++;

  const amenityOn =
    values.furnished === "true" ||
    values.bills === "true" ||
    values.parking === "true" ||
    values.pets === "true" ||
    values.heating === "true" ||
    Boolean(values.amenities?.trim());
  if (amenityOn) groups++;

  if (values.minMonths) groups++;
  if (values.minSqm) groups++;

  return groups;
}

/** Clear detailed filters; preserve location, dates, guests, rental type. */
export function clearDetailedFilterValues(
  values: ListingsFilterValues
): ListingsFilterValues {
  const next: ListingsFilterValues = { ...values };
  for (const key of DETAILED_KEYS) {
    delete next[key];
  }
  return next;
}

export function draftFiltersMatchApplied(
  draft: ListingsFilterValues,
  applied: ListingsFilterValues
): boolean {
  const pick = (v: ListingsFilterValues) =>
    JSON.stringify(
      DETAILED_KEYS.reduce(
        (acc, k) => {
          acc[k] = v[k] ?? "";
          return acc;
        },
        {} as Record<string, string | undefined>
      )
    );
  return pick(draft) === pick(applied);
}
