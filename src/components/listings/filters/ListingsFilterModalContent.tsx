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
import type { RentalType } from "@/lib/rental-types";
import type { ListingsFilterValues } from "@/components/listings/ListingsFilters";
import type { PriceHistogramBucket } from "@/lib/listing-price-histogram";
import {
  amenityLabel,
  popularFilterAmenities,
} from "@/lib/amenities-catalog";
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

const PROPERTY_TYPES = [
  { value: "apartment", label: "Διαμέρισμα", icon: Building2 },
  { value: "house", label: "Σπίτι / Μονοκατοικία", icon: Home },
  { value: "studio", label: "Studio", icon: Building2 },
  { value: "villa", label: "Βίλα", icon: Home },
  { value: "room", label: "Δωμάτιο", icon: Building2 },
  { value: "other", label: "Άλλο", icon: Building2 },
] as const;

type QuickFilter = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  boolField?: "parking" | "pets" | "furnished" | "bills" | "heating";
};

const MONTHLY_QUICK: QuickFilter[] = [
  { key: "furnished", label: "Επιπλωμένο", icon: Sofa, boolField: "furnished" },
  { key: "bills", label: "Λογαριασμοί μέσα στην τιμή", icon: Zap, boolField: "bills" },
  { key: "pets", label: "Επιτρέπονται κατοικίδια", icon: Dog, boolField: "pets" },
  { key: "parking", label: "Δωρεάν στάθμευση", icon: Car, boolField: "parking" },
];

type AmenityRow = {
  key: "heating" | "parking" | "pets" | "furnished" | "bills";
  label: string;
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
  { key: "heating", label: "Θέρμανση / κλιματισμός" },
  { key: "parking", label: "Δωρεάν στάθμευση" },
  { key: "pets", label: "Επιτρέπονται κατοικίδια" },
  { key: "furnished", label: "Επιπλωμένο", monthlyOnly: true },
  { key: "bills", label: "Λογαριασμοί περιλαμβάνονται", monthlyOnly: true },
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
  isMonthly: boolean
): { key: string; label: string; clear: () => void }[] {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  const minP = isShort ? values.minPriceNight : values.minMonthly;
  const maxP = isShort ? values.maxPriceNight : values.maxMonthly;
  if (minP || maxP) {
    const unit = isShort ? "€/βράδυ" : "€/μήνα";
    chips.push({
      key: "price",
      label: minP && maxP ? `${minP}–${maxP} ${unit}` : minP ? `από ${minP} ${unit}` : `έως ${maxP} ${unit}`,
      clear: () => {},
    });
  }
  if (values.bedrooms) {
    chips.push({
      key: "bedrooms",
      label: `${values.bedrooms}+ υπνοδωμάτια`,
      clear: () => {},
    });
  }
  if (values.bathrooms) {
    chips.push({
      key: "bathrooms",
      label: `${values.bathrooms}+ μπάνια`,
      clear: () => {},
    });
  }
  if (values.type) {
    const t = PROPERTY_TYPES.find((p) => p.value === values.type);
    chips.push({ key: "type", label: t?.label ?? values.type, clear: () => {} });
  }
  for (const key of selectedAmenityKeys(values)) {
    chips.push({
      key: `amenity-${key}`,
      label: amenityLabel(key),
      clear: () => {},
    });
  }
  for (const a of AMENITIES) {
    if (isShort && a.monthlyOnly) continue;
    if (isMonthly && a.shortOnly) continue;
    if (values[a.key] === "true") {
      chips.push({ key: a.key, label: a.label, clear: () => {} });
    }
  }
  if (values.minMonths) {
    chips.push({
      key: "minMonths",
      label: `Ελάχ. ${values.minMonths} μήνες`,
      clear: () => {},
    });
  }
  if (values.minSqm) {
    chips.push({ key: "minSqm", label: `από ${values.minSqm} τ.μ.`, clear: () => {} });
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

  const chips = buildActiveChips(draft, isShort, isMonthly).map((c) => ({
    ...c,
    clear: () => onRemoveChip(c.key),
  }));

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
        <FilterModalSection title="Προτεινόμενα" defaultOpen>
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
                  <span className="leading-snug">{f.label}</span>
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
        title="Χώροι και κρεβάτια"
        defaultOpen
        activeCount={roomsActiveCount}
      >
        <FilterStepperRow
          label="Υπνοδωμάτια"
          value={draft.bedrooms ?? ""}
          onChange={(v) => setField("bedrooms", v)}
        />
        <FilterStepperRow
          label="Μπάνια"
          value={draft.bathrooms ?? ""}
          onChange={(v) => setField("bathrooms", v)}
        />
      </FilterModalSection>

      <FilterModalSection
        title="Τύπος ακινήτου"
        defaultOpen
        activeCount={typeActiveCount}
      >
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map((t) => {
            const active = draft.type === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleType(t.value)}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-gold/45 bg-[#f7f0e6] ring-1 ring-gold/20"
                    : "border-charcoal/12 bg-white hover:border-gold/30"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>
      </FilterModalSection>

      <FilterModalSection
        title="Δημοφιλείς παροχές"
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
                {def.label}
              </button>
            );
          })}
        </div>
      </FilterModalSection>

      {isMonthly && (
        <FilterModalSection
          title="Όροι μηνιαίας μίσθωσης"
          defaultOpen={false}
          activeCount={bookingActiveCount}
        >
          <div className="space-y-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Ελάχιστη διάρκεια μίσθωσης (μήνες)
              </span>
              <input
                type="number"
                min={1}
                value={draft.minMonths ?? ""}
                onChange={(e) => setField("minMonths", e.target.value)}
                placeholder="π.χ. 3"
                className="min-h-11 rounded-xl border border-charcoal/12 px-3 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Ελάχιστα τ.μ.</span>
              <input
                type="number"
                min={0}
                value={draft.minSqm ?? ""}
                onChange={(e) => setField("minSqm", e.target.value)}
                placeholder="π.χ. 45"
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
