"use client";

import {
  Building2,
  Car,
  Dog,
  Home,
  Sofa,
  Zap,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { RentalType } from "@/lib/rental-types";
import type { ListingsFilterValues } from "@/components/listings/ListingsFilters";
import type { PriceHistogramBucket } from "@/lib/listing-price-histogram";
import {
  popularFilterAmenities,
} from "@/lib/amenities-catalog";
import { getAmenityLabel } from "@/lib/amenities-i18n";
import {
  parseAmenityFilterParam,
  serializeAmenityFilterParam,
  amenityKeySetsBills,
  amenityKeySetsClimate,
  amenityKeySetsFurnished,
  amenityKeySetsParking,
  amenityKeySetsPets,
} from "@/lib/search-amenity-filters";
import {
  FilterModalSection,
  FilterStepperRow,
} from "@/components/listings/filters/FilterModalSection";
import { FilterPriceSection } from "@/components/listings/filters/FilterPriceSection";
import { cn } from "@/lib/utils";

const PROPERTY_TYPE_VALUES = [
  "apartment",
  "house",
  "studio",
  "villa",
  "room",
  "other",
] as const;

const PROPERTY_TYPE_ICONS = {
  apartment: Building2,
  house: Home,
  studio: Building2,
  villa: Home,
  room: Building2,
  other: Building2,
} as const;

type QuickFilter = {
  key: string;
  labelKey:
    | "furnished"
    | "billsInPrice"
    | "petsAllowed"
    | "freeParking";
  icon: React.ComponentType<{ className?: string }>;
  boolField?: "parking" | "pets" | "furnished" | "bills" | "heating";
};

const MONTHLY_QUICK: QuickFilter[] = [
  { key: "furnished", labelKey: "furnished", icon: Sofa, boolField: "furnished" },
  { key: "bills", labelKey: "billsInPrice", icon: Zap, boolField: "bills" },
  { key: "pets", labelKey: "petsAllowed", icon: Dog, boolField: "pets" },
  { key: "parking", labelKey: "freeParking", icon: Car, boolField: "parking" },
];

type AmenityRow = {
  key: "heating" | "parking" | "pets" | "furnished" | "bills";
  labelKey:
    | "heatingClimate"
    | "freeParking"
    | "petsAllowed"
    | "furnished"
    | "billsIncluded";
  monthlyOnly?: boolean;
  shortOnly?: boolean;
};

function selectedAmenityKeys(values: ListingsFilterValues): Set<string> {
  return new Set(parseAmenityFilterParam(values.amenities));
}

function syncLegacyAmenityBools(
  keys: Set<string>,
  setBoolField: (name: string, checked: boolean) => void
) {
  setBoolField(
    "parking",
    [...keys].some((key) => amenityKeySetsParking(key))
  );
  setBoolField(
    "furnished",
    [...keys].some((key) => amenityKeySetsFurnished(key))
  );
  setBoolField(
    "bills",
    [...keys].some((key) => amenityKeySetsBills(key))
  );
  setBoolField(
    "pets",
    [...keys].some((key) => amenityKeySetsPets(key))
  );
  setBoolField(
    "heating",
    [...keys].some((key) => amenityKeySetsClimate(key))
  );
}

const AMENITIES: AmenityRow[] = [
  { key: "heating", labelKey: "heatingClimate" },
  { key: "parking", labelKey: "freeParking" },
  { key: "pets", labelKey: "petsAllowed" },
  { key: "furnished", labelKey: "furnished", monthlyOnly: true },
  { key: "bills", labelKey: "billsIncluded", monthlyOnly: true },
];

function activeChipCount(values: ListingsFilterValues, isShort: boolean): number {
  let n = 0;
  if (values.bedrooms) n++;
  if (values.bathrooms) n++;
  if (values.type) n++;
  const hasPrice = isShort
    ? Boolean(values.minPriceNight || values.maxPriceNight)
    : Boolean(values.minMonthly || values.maxMonthly);
  if (hasPrice) n++;
  if (
    values.furnished === "true" ||
    values.bills === "true" ||
    values.parking === "true" ||
    values.pets === "true" ||
    values.heating === "true" ||
    values.amenities?.trim()
  ) {
    n++;
  }
  if (values.minMonths) n++;
  if (values.minSqm) n++;
  return n;
}

function buildActiveChips(
  values: ListingsFilterValues,
  isShort: boolean,
  isMonthly: boolean,
  t: (key: string, values?: Record<string, string | number>) => string,
  amenityT: (key: string) => string
): { key: string; label: string; clear: () => void }[] {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  const typeLabel = (value: string) => {
    switch (value) {
      case "apartment":
        return t("typeApartment");
      case "house":
        return t("typeHouse");
      case "studio":
        return t("typeStudio");
      case "villa":
        return t("typeVilla");
      case "room":
        return t("typeRoom");
      case "other":
        return t("typeOther");
      default:
        return value;
    }
  };

  const minP = isShort ? values.minPriceNight : values.minMonthly;
  const maxP = isShort ? values.maxPriceNight : values.maxMonthly;
  if (minP || maxP) {
    const unit = isShort ? t("unitNight") : t("unitMonth");
    let label: string;
    if (minP && maxP) label = t("chipRange", { min: minP, max: maxP, unit });
    else if (minP) label = t("chipFrom", { value: minP, unit });
    else label = t("chipTo", { value: maxP as string, unit });
    chips.push({
      key: "price",
      label,
      clear: () => {},
    });
  }
  if (values.bedrooms) {
    chips.push({
      key: "bedrooms",
      label: t("chipBedrooms", { count: values.bedrooms }),
      clear: () => {},
    });
  }
  if (values.bathrooms) {
    chips.push({
      key: "bathrooms",
      label: t("chipBathrooms", { count: values.bathrooms }),
      clear: () => {},
    });
  }
  if (values.type) {
    chips.push({
      key: "type",
      label: typeLabel(values.type),
      clear: () => {},
    });
  }
  for (const key of selectedAmenityKeys(values)) {
    chips.push({
      key: `amenity-${key}`,
      label: getAmenityLabel(key, amenityT),
      clear: () => {},
    });
  }
  for (const a of AMENITIES) {
    if (isShort && a.monthlyOnly) continue;
    if (isMonthly && a.shortOnly) continue;
    if (values[a.key] === "true") {
      chips.push({ key: a.key, label: t(a.labelKey), clear: () => {} });
    }
  }
  if (values.minMonths) {
    chips.push({
      key: "minMonths",
      label: t("chipMinMonths", { count: values.minMonths }),
      clear: () => {},
    });
  }
  if (values.minSqm) {
    chips.push({
      key: "minSqm",
      label: t("chipMinSqm", { value: values.minSqm }),
      clear: () => {},
    });
  }
  return chips;
}

type Props = {
  draft: ListingsFilterValues;
  rentalType: RentalType;
  priceHistogram: { buckets: PriceHistogramBucket[]; min: number; max: number };
  setField: (name: string, value: string) => void;
  setBoolField: (name: string, checked: boolean) => void;
  onRemoveChip: (key: string) => void;
};

export function ListingsFilterModalContent({
  draft,
  rentalType,
  priceHistogram,
  setField,
  setBoolField,
  onRemoveChip,
}: Props) {
  const t = useTranslations("Listings.filter");
  const tAmenities = useTranslations("Amenities");
  const isShort = rentalType === "short_term";
  const isMonthly = rentalType === "monthly";

  const minPrice = isShort
    ? (draft.minPriceNight ?? "")
    : (draft.minMonthly ?? "");
  const maxPrice = isShort
    ? (draft.maxPriceNight ?? "")
    : (draft.maxMonthly ?? "");

  function setMinPrice(v: string) {
    if (isShort) {
      setField("minPriceNight", v);
      setField("minMonthly", "");
    } else {
      setField("minMonthly", v);
      setField("minPriceNight", "");
    }
  }

  function setMaxPrice(v: string) {
    if (isShort) {
      setField("maxPriceNight", v);
      setField("maxMonthly", "");
    } else {
      setField("maxMonthly", v);
      setField("maxPriceNight", "");
    }
  }

  function toggleType(value: string) {
    setField("type", draft.type === value ? "" : value);
  }

  function toggleQuick(f: QuickFilter) {
    if (!f.boolField) return;
    setBoolField(f.boolField, draft[f.boolField] !== "true");
  }

  const quickFilters = isMonthly ? MONTHLY_QUICK.slice(0, 4) : [];

  const popularAmenities = popularFilterAmenities(isShort ? "short_term" : "monthly");
  const selectedKeys = selectedAmenityKeys(draft);

  const amenityActiveCount =
    selectedKeys.size +
    AMENITIES.filter((a) => {
      if (isShort && a.monthlyOnly) return false;
      if (isMonthly && a.shortOnly) return false;
      return draft[a.key] === "true";
    }).length;

  function togglePopularAmenity(key: string) {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setField("amenities", serializeAmenityFilterParam(next));
    syncLegacyAmenityBools(next, setBoolField);
  }

  const typeActiveCount = draft.type ? 1 : 0;
  const roomsActiveCount =
    (draft.bedrooms ? 1 : 0) + (draft.bathrooms ? 1 : 0);
  const bookingActiveCount =
    (isMonthly && draft.minMonths ? 1 : 0) + (isMonthly && draft.minSqm ? 1 : 0);

  const chips = buildActiveChips(
    draft,
    isShort,
    isMonthly,
    (key, values) => t(key as Parameters<typeof t>[0], values),
    tAmenities
  ).map((c) => ({
    ...c,
    clear: () => onRemoveChip(c.key),
  }));

  const typeLabel = (value: (typeof PROPERTY_TYPE_VALUES)[number]) => {
    switch (value) {
      case "apartment":
        return t("typeApartment");
      case "house":
        return t("typeHouse");
      case "studio":
        return t("typeStudio");
      case "villa":
        return t("typeVilla");
      case "room":
        return t("typeRoom");
      case "other":
        return t("typeOther");
    }
  };

  return (
    <div className="px-5 sm:px-6">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-charcoal/8 py-4">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-gold/35 bg-[#f7f0e6] px-3 text-xs font-medium text-charcoal transition-colors hover:border-gold/55"
            >
              {chip.label}
              <X className="h-3.5 w-3.5 text-muted" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {quickFilters.length > 0 && (
        <FilterModalSection title={t("recommended")} defaultOpen>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            {quickFilters.map((f) => {
              const active = f.boolField ? draft[f.boolField] === "true" : false;
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleQuick(f)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "border-gold/45 bg-[#f7f0e6] text-charcoal ring-1 ring-gold/20"
                      : "border-charcoal/12 bg-white text-charcoal/85 hover:border-gold/30"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                  <span className="leading-snug">{t(f.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </FilterModalSection>
      )}

      <FilterPriceSection
        isShort={isShort}
        histogram={priceHistogram}
        minValue={minPrice}
        maxValue={maxPrice}
        onMinChange={setMinPrice}
        onMaxChange={setMaxPrice}
      />

      <FilterModalSection
        title={t("roomsBeds")}
        defaultOpen
        activeCount={roomsActiveCount}
      >
        <FilterStepperRow
          label={t("bedrooms")}
          value={draft.bedrooms ?? ""}
          onChange={(v) => setField("bedrooms", v)}
        />
        <FilterStepperRow
          label={t("bathrooms")}
          value={draft.bathrooms ?? ""}
          onChange={(v) => setField("bathrooms", v)}
        />
      </FilterModalSection>

      <FilterModalSection
        title={t("propertyType")}
        defaultOpen
        activeCount={typeActiveCount}
      >
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPE_VALUES.map((value) => {
            const active = draft.type === value;
            const Icon = PROPERTY_TYPE_ICONS[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleType(value)}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-gold/45 bg-[#f7f0e6] ring-1 ring-gold/20"
                    : "border-charcoal/12 bg-white hover:border-gold/30"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                {typeLabel(value)}
              </button>
            );
          })}
        </div>
      </FilterModalSection>

      <FilterModalSection
        title={t("popularAmenities")}
        defaultOpen
        activeCount={amenityActiveCount}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {popularAmenities.map((def) => {
            const active = selectedKeys.has(def.key);
            return (
              <button
                key={def.key}
                type="button"
                onClick={() => togglePopularAmenity(def.key)}
                className={cn(
                  "flex min-h-11 items-center rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "border-charcoal bg-charcoal text-white"
                    : "border-charcoal/12 bg-white text-charcoal hover:border-gold/30"
                )}
              >
                {getAmenityLabel(def.key, tAmenities)}
              </button>
            );
          })}
        </div>
      </FilterModalSection>

      {isMonthly && (
        <FilterModalSection
          title={t("monthlyTerms")}
          defaultOpen={false}
          activeCount={bookingActiveCount}
        >
          <div className="space-y-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                {t("minStayMonths")}
              </span>
              <input
                type="number"
                min={1}
                value={draft.minMonths ?? ""}
                onChange={(e) => setField("minMonths", e.target.value)}
                placeholder={t("placeholderMonths")}
                className="min-h-11 rounded-xl border border-charcoal/12 px-3 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">{t("minSqm")}</span>
              <input
                type="number"
                min={0}
                value={draft.minSqm ?? ""}
                onChange={(e) => setField("minSqm", e.target.value)}
                placeholder={t("placeholderSqm")}
                className="min-h-11 rounded-xl border border-charcoal/12 px-3 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </label>
          </div>
        </FilterModalSection>
      )}
    </div>
  );
}

export { activeChipCount };
