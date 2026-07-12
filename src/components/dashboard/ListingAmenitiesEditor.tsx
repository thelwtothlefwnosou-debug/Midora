"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  AMENITY_CATEGORY_LABELS,
  AMENITY_CATEGORY_ORDER,
  amenityLabel,
  catalogForRentalMode,
  normalizeAmenityKey,
  popularFilterAmenities,
  recommendedAmenityKeys,
} from "@/lib/amenities-catalog";
import type { AmenityCategory } from "@/lib/amenities-catalog-types";
import { saveOwnerListingAmenities } from "@/lib/listing-amenities";
import { listingRentalType } from "@/lib/rental-types";
import type { ListingAmenityRow, ListingWithImages } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingWithImages;
  initialAmenities: ListingAmenityRow[];
};

export function ListingAmenitiesEditor({ listing, initialAmenities }: Props) {
  const router = useRouter();
  const rentalMode = listingRentalType(listing) === "monthly" ? "monthly" : "short_term";

  const initialKeys = useMemo(
    () =>
      initialAmenities
        .map((row) => normalizeAmenityKey(row.amenity_key))
        .filter(Boolean),
    [initialAmenities]
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialKeys));
  const [query, setQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<AmenityCategory>>(
    () => new Set(["basic", rentalMode === "monthly" ? "monthly_terms" : "kitchen_dining"])
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const catalog = useMemo(() => catalogForRentalMode(rentalMode), [rentalMode]);
  const popular = useMemo(() => popularFilterAmenities(rentalMode), [rentalMode]);
  const recommended = recommendedAmenityKeys(rentalMode);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCatalog = useMemo(() => {
    if (!normalizedQuery) return catalog;
    return catalog.filter((def) => def.label.toLowerCase().includes(normalizedQuery));
  }, [catalog, normalizedQuery]);

  const categoriesWithItems = useMemo(() => {
    const grouped = new Map<AmenityCategory, typeof catalog>();
    for (const def of filteredCatalog) {
      const list = grouped.get(def.category) ?? [];
      list.push(def);
      grouped.set(def.category, list);
    }
    return AMENITY_CATEGORY_ORDER.flatMap((category) => {
      const items = grouped.get(category);
      if (!items?.length) return [];
      return [{ category, items }];
    });
  }, [filteredCatalog]);

  const missingRecommended = recommended.filter((key) => !selected.has(key));

  function toggleKey(key: string) {
    const normalized = normalizeAmenityKey(key);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(normalized)) next.delete(normalized);
      else next.add(normalized);
      return next;
    });
  }

  function toggleCategory(category: AmenityCategory) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveOwnerListingAmenities(listing.id, [...selected]);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage(`Αποθηκεύτηκαν ${result.count ?? selected.size} παροχές.`);
      router.refresh();
    });
  }

  return (
    <GlassCard className="mb-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-charcoal">Παροχές</h3>
          <p className="mt-1 text-sm text-muted">
            Επίλεξε ό,τι προσφέρει πραγματικά το ακίνητο. Οι επισκέπτες βλέπουν μόνο τις επιλεγμένες παροχές.
          </p>
        </div>
        <p className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark">
          {selected.size} επιλεγμένες
        </p>
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση παροχών…"
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm text-charcoal outline-none focus:border-gold/50"
        />
      </div>

      {popular.length > 0 && !normalizedQuery ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Δημοφιλείς</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {popular.map((def) => {
              const active = selected.has(def.key);
              return (
                <button
                  key={def.key}
                  type="button"
                  onClick={() => toggleKey(def.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-charcoal bg-charcoal text-white"
                      : "border-charcoal/12 bg-white text-charcoal hover:border-gold/35"
                  )}
                >
                  {active ? <Check className="h-3.5 w-3.5" /> : null}
                  {def.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {missingRecommended.length > 0 && !normalizedQuery ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          Πρόσθεσε βασικές παροχές για πιο ολοκληρωμένη αγγελία (π.χ.{" "}
          {missingRecommended.slice(0, 3).map(amenityLabel).join(", ")}).
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {categoriesWithItems.map(({ category, items }) => {
          const isOpen = normalizedQuery ? true : openCategories.has(category);
          const selectedInCategory = items.filter((def) => selected.has(def.key)).length;
          return (
            <div
              key={category}
              className="overflow-hidden rounded-xl border border-charcoal/10 bg-white"
            >
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-charcoal">
                  {AMENITY_CATEGORY_LABELS[category]}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {selectedInCategory > 0 ? `${selectedInCategory} επιλεγμένες` : null}
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                  />
                </span>
              </button>

              {isOpen ? (
                <div className="grid gap-2 border-t border-charcoal/8 px-4 py-3 sm:grid-cols-2">
                  {items.map((def) => {
                    const active = selected.has(def.key);
                    return (
                      <label
                        key={def.key}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "border-gold/35 bg-gold/8 text-charcoal"
                            : "border-transparent hover:bg-charcoal/[0.03]"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={active}
                          onChange={() => toggleKey(def.key)}
                        />
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                            active
                              ? "border-gold bg-gold text-white"
                              : "border-charcoal/20 bg-white"
                          )}
                        >
                          {active ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                        <span>{def.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Αποθήκευση…" : "Αποθήκευση παροχών"}
      </button>
    </GlassCard>
  );
}
