"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { LocationSearchField } from "@/components/search/LocationSearchField";
import { RentalTypeSearchFields } from "@/components/search/RentalTypeSearchFields";
import { ListingsFilterModal } from "@/components/listings/filters/ListingsFilterModal";
import { ListingsSearchNav } from "@/components/listings/ListingsSearchNav";
import { RentalModeToggle } from "@/components/listings/RentalModeToggle";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { SiteHeaderActions } from "@/components/layout/SiteHeaderActions";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  applyRentalModeSwitch,
  createModeFieldCache,
} from "@/lib/listings-search-mode-switch";
import {
  formatLocationSelection,
  NEARBY_LOCATION,
  type SearchLocation,
} from "@/lib/data/locations-shared";
import { appendLocationToParams } from "@/lib/search-params";
import { encodePolygonParam } from "@/lib/geo/polygon";
import type { LatLng } from "@/lib/geo/polygon";
import {
  clearDetailedFilterValues,
  countActiveFilterGroups,
} from "@/lib/filter-groups";
import type { PriceHistogramBucket } from "@/lib/listing-price-histogram";
import { compareDateKeys, isPastDateInAthens, isPastMonthInAthens } from "@/lib/dates-athens";
import type { RentalType } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

export type ListingsFilterValues = {
  city?: string;
  area?: string;
  district?: string;
  nearby?: string;
  polygon?: string;
  bounds?: string;
  autoMap?: string;
  rentalType?: string;
  interestFrom?: string;
  interestTo?: string;
  startMonth?: string;
  durationMonths?: string;
  availableFrom?: string;
  minDuration?: string;
  guests?: string;
  bedrooms?: string;
  bathrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  minPriceNight?: string;
  maxPriceNight?: string;
  minMonthly?: string;
  maxMonthly?: string;
  type?: string;
  furnished?: string;
  bills?: string;
  minMonths?: string;
  moveIn?: string;
  minSqm?: string;
  parking?: string;
  pets?: string;
  heating?: string;
  sort?: string;
};

type Props = {
  defaults: ListingsFilterValues;
  totalCount?: number;
  priceHistogram?: { buckets: PriceHistogramBucket[]; min: number; max: number };
};

function resolveInitialRentalType(defaults: ListingsFilterValues): RentalType {
  const rt = defaults.rentalType as RentalType;
  if (rt === "short_term" || rt === "monthly") return rt;
  return "monthly";
}

const DEFAULT_PRICE_HISTOGRAM = {
  min: 400,
  max: 2500,
  buckets: [] as PriceHistogramBucket[],
};

export function ListingsFilters({
  defaults,
  totalCount = 0,
  priceHistogram = DEFAULT_PRICE_HISTOGRAM,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<ListingsFilterValues>(defaults);
  const [user, setUser] = useState<User | null>(null);
  const [values, setValues] = useState<ListingsFilterValues>(defaults);
  const [rentalType, setRentalType] = useState<RentalType>(() =>
    resolveInitialRentalType(defaults)
  );
  const modeFieldCache = useRef(createModeFieldCache(defaults));

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [selectedLocation, setSelectedLocation] = useState<SearchLocation | null>(null);
  const [nearbyCoords, setNearbyCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const defaultsSyncKey = useMemo(() => JSON.stringify(defaults), [defaults]);

  useEffect(() => {
    setValues(defaults);
    setDraft(defaults);
    setRentalType(resolveInitialRentalType(defaults));
    modeFieldCache.current = createModeFieldCache(defaults);
    setSelectedLocation(null);
    setNearbyCoords(null);
  }, [defaultsSyncKey]);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  function openFilters() {
    setDraft(values);
    setFiltersOpen(true);
  }

  function closeFilters() {
    setDraft(values);
    setFiltersOpen(false);
  }

  function setField(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function setDraftField(name: string, value: string) {
    setDraft((v) => ({ ...v, [name]: value }));
  }

  function setDraftBoolField(name: string, checked: boolean) {
    setDraft((v) => ({ ...v, [name]: checked ? "true" : "" }));
  }

  const filterBadge = countActiveFilterGroups(values);

  const rentalDefaults = {
    interestFrom: defaults.interestFrom,
    interestTo: defaults.interestTo,
    startMonth: defaults.startMonth,
    durationMonths: defaults.durationMonths,
    guests: defaults.guests,
  };

  function pickFormField(formData: FormData | null | undefined, name: string, fallback?: string) {
    if (formData) {
      const raw = (formData.get(name) as string | null)?.trim();
      if (raw) return raw;
    }
    return fallback?.trim() ?? "";
  }

  function appendRentalFieldsToParams(
    p: URLSearchParams,
    v: ListingsFilterValues,
    formData: FormData | null | undefined,
    rt: string
  ) {
    const guests = pickFormField(formData, "guests", v.guests);
    if (guests) p.set("guests", guests);

    const propertyType = pickFormField(formData, "propertyType", v.type);
    if (propertyType) p.set("type", propertyType);

    if (rt === "short_term") {
      let from = pickFormField(formData, "interestFrom", v.interestFrom);
      let to = pickFormField(formData, "interestTo", v.interestTo);
      if (from && isPastDateInAthens(from)) from = "";
      if (to && isPastDateInAthens(to)) to = "";
      if (from && to && compareDateKeys(to, from) < 0) to = from;
      if (from) {
        p.set("interestFrom", from);
        p.set("start", from);
      }
      if (to) {
        p.set("interestTo", to);
        p.set("end", to);
      }
    } else if (rt === "monthly") {
      const startMonth = pickFormField(formData, "startMonth", v.startMonth);
      const durationMonths = pickFormField(formData, "durationMonths", v.durationMonths);
      if (startMonth && !isPastMonthInAthens(startMonth)) {
        p.set("startMonth", startMonth);
      }
      const duration = parseInt(durationMonths || "2", 10);
      p.set("durationMonths", String(Math.max(2, duration)));
    }
  }

  function buildParams(
    v: ListingsFilterValues,
    formData?: FormData | null,
    rentalOverride?: RentalType,
    locationOverride?: {
      location?: SearchLocation | null;
      nearby?: { lat: number; lng: number } | null;
    }
  ) {
    const p = new URLSearchParams();

    if (v.polygon?.trim()) {
      p.set("polygon", v.polygon.trim());
    } else if (v.bounds?.trim()) {
      p.set("bounds", v.bounds.trim());
      if (v.autoMap === "1") p.set("autoMap", "1");
    } else if (v.nearby?.trim()) {
      p.set("nearby", v.nearby.trim());
    } else {
      appendLocationToParams(p, {
        location:
          locationOverride && "location" in locationOverride
            ? locationOverride.location
            : selectedLocation,
        nearby:
          locationOverride && "nearby" in locationOverride
            ? locationOverride.nearby
            : nearbyCoords,
        cityText: v.city,
      });
      if (v.area && !selectedLocation && !locationOverride?.location) p.set("area", v.area);
      if (v.district && !selectedLocation && !locationOverride?.location) {
        p.set("district", v.district);
      }
    }

    const rt =
      rentalOverride ??
      ((formData?.get("rentalType") as string)?.trim() || rentalType || v.rentalType);
    if (rt) {
      p.set("rentalType", rt);
      appendRentalFieldsToParams(p, v, formData, rt);
    }

    if (v.bedrooms) p.set("bedrooms", v.bedrooms);
    if (v.bathrooms) p.set("bathrooms", v.bathrooms);
    if (v.type) p.set("type", v.type);
    if (v.furnished === "true") p.set("furnished", "true");
    if (v.bills === "true") p.set("bills", "true");
    if (v.parking === "true") p.set("parking", "true");
    if (v.pets === "true") p.set("pets", "true");
    if (v.heating === "true") p.set("heating", "true");
    if (v.minSqm) p.set("minSqm", v.minSqm);
    if (v.minMonths) p.set("minMonths", v.minMonths);
    if (v.sort && v.sort !== "recommended") p.set("sort", v.sort);

    const isShort = rt === "short_term";
    if (isShort) {
      if (v.minPriceNight) p.set("minPriceNight", v.minPriceNight);
      if (v.maxPriceNight) p.set("maxPriceNight", v.maxPriceNight);
    } else if (rt) {
      if (v.minMonthly) p.set("minMonthly", v.minMonthly);
      if (v.maxMonthly) p.set("maxMonthly", v.maxMonthly);
    } else {
      if (v.minPrice) p.set("minPrice", v.minPrice);
      if (v.maxPrice) p.set("maxPrice", v.maxPrice);
    }

    return p;
  }

  function handleSearchFieldChange(
    patch: Partial<{
      interestFrom?: string;
      interestTo?: string;
      startMonth?: string;
      durationMonths?: string;
      guests?: string;
    }>,
    options?: { autoSearch?: boolean }
  ) {
    const next = { ...values, ...patch };
    setValues(next);
    if (options?.autoSearch) {
      navigateWithValues(next);
    }
  }

  function navigateWithValues(
    nextValues: ListingsFilterValues,
    rentalOverride?: RentalType,
    locationOverride?: {
      location?: SearchLocation | null;
      nearby?: { lat: number; lng: number } | null;
    }
  ) {
    const fd = formRef.current ? new FormData(formRef.current) : null;
    const p = buildParams(nextValues, fd, rentalOverride, locationOverride);
    router.push(p.toString() ? `/listings?${p.toString()}` : "/listings", {
      scroll: false,
    });
  }

  function applyLocationSelection(
    loc: SearchLocation,
    nearby?: { lat: number; lng: number } | null
  ) {
    const next: ListingsFilterValues = {
      ...values,
      city: loc.kind === "nearby" ? undefined : formatLocationSelection(loc),
      area: loc.kind === "area" ? loc.area : undefined,
      district:
        loc.kind === "district"
          ? loc.district
          : loc.area && loc.district
            ? loc.district
            : undefined,
      nearby:
        nearby != null ? `${nearby.lat},${nearby.lng},8` : undefined,
      polygon: undefined,
      bounds: undefined,
      autoMap: undefined,
    };

    setSelectedLocation(loc.kind === "nearby" ? null : loc);
    setNearbyCoords(nearby ?? null);
    setValues(next);
    navigateWithValues(next, rentalType, {
      location: loc.kind === "nearby" ? null : loc,
      nearby: nearby ?? null,
    });
  }

  const buildPreviewQuery = useCallback(
    (v: ListingsFilterValues) => {
      const fd = formRef.current ? new FormData(formRef.current) : null;
      return buildParams(v, fd, rentalType).toString();
    },
    [rentalType, values, selectedLocation, nearbyCoords]
  );

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    navigateWithValues(values);
  }

  function applyDraftFilters() {
    setValues(draft);
    setFiltersOpen(false);
    navigateWithValues(draft);
  }

  function clearDetailedDraft() {
    setDraft((d) => clearDetailedFilterValues(d));
  }

  function handleRentalTypeChange(next: RentalType) {
    if (next === rentalType) return;
    const nextValues = applyRentalModeSwitch(
      values,
      rentalType,
      next,
      modeFieldCache.current
    );
    setRentalType(next);
    setValues(nextValues);
    navigateWithValues(nextValues, next);
  }


  function handleDrawSearch(polygon: LatLng[]) {
    const next: ListingsFilterValues = {
      ...values,
      city: undefined,
      area: undefined,
      district: undefined,
      nearby: undefined,
      polygon: encodePolygonParam(polygon),
    };
    setSelectedLocation(null);
    setNearbyCoords(null);
    setValues(next);
    router.push(`/listings?${buildParams(next).toString()}`);
  }

  function clearMapArea() {
    setValues((v) => ({ ...v, polygon: undefined }));
  }

  return (
    <header className="listings-search-header fixed top-0 right-0 left-0 z-[100] border-b border-charcoal/8 bg-white">
      <form ref={formRef} onSubmit={applyFilters} className="relative mx-auto w-full max-w-[1600px]">
        {/* Row 1 — brand + nav + actions */}
        <div className="listings-search-header__nav flex h-[4.25rem] items-center gap-4 px-4 lg:px-[18px]">
          <MidoraLogo href="/" variant="header" className="shrink-0" />
          <div className="hidden min-w-0 flex-1 md:flex">
            <ListingsSearchNav className="w-full" />
          </div>
          <SiteHeaderActions user={user} variant="listings" className="ml-auto shrink-0" />
        </div>

        {/* Row 2 — unified search dock */}
        <div className="listings-search-header__search px-4 pb-4 pt-1 lg:px-[18px]">
          <div className="listings-search-dock">
            <RentalModeToggle value={rentalType} onChange={handleRentalTypeChange} />

            <LocationSearchField
              variant="toolbar"
              defaultValue={defaults.city}
              mapAreaActive={Boolean(values.polygon || defaults.polygon)}
              onClearMapArea={clearMapArea}
              onValueChange={(v) =>
                setValues((prev) => ({
                  ...prev,
                  city: v,
                  area: undefined,
                  district: undefined,
                  nearby: undefined,
                  polygon: undefined,
                }))
              }
              onSelect={(loc) => {
                if (loc.kind === "nearby") return;
                applyLocationSelection(loc);
              }}
              onNearbySelect={(coords) => {
                applyLocationSelection(NEARBY_LOCATION, coords);
              }}
              onDrawSearch={handleDrawSearch}
              className="relative z-[60] min-w-0 flex-[1.05]"
            />

            <RentalTypeSearchFields
              rentalType={rentalType}
              variant="search"
              defaults={rentalDefaults}
              searchValues={{
                interestFrom: values.interestFrom,
                interestTo: values.interestTo,
                startMonth: values.startMonth,
                durationMonths: values.durationMonths,
                guests: values.guests,
              }}
              onSearchFieldChange={handleSearchFieldChange}
            />

            <button
              type="button"
              onClick={openFilters}
              className={cn(
                "listings-search-dock__filters",
                filtersOpen && "listings-search-dock__filters--active"
              )}
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-charcoal/55" aria-hidden />
              <span className="hidden sm:inline">Φίλτρα</span>
              {filterBadge > 0 && (
                <span className="listings-search-dock__filters-badge">{filterBadge}</span>
              )}
            </button>

            <button
              type="submit"
              className="listings-search-dock__submit"
              aria-label="Αναζήτηση"
            >
              <Search className="h-4 w-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">Αναζήτηση</span>
            </button>
          </div>
        </div>

        <input type="hidden" name="rentalType" value={rentalType} />

      <ListingsFilterModal
        open={filtersOpen}
        onClose={closeFilters}
        draft={draft}
        applied={values}
        rentalType={rentalType}
        priceHistogram={priceHistogram}
        totalCount={totalCount}
        setDraftField={setDraftField}
        setDraftBoolField={setDraftBoolField}
        onClearDetailed={clearDetailedDraft}
        onApply={applyDraftFilters}
        buildPreviewQuery={buildPreviewQuery}
      />

      <input type="hidden" name="city" value={values.city ?? ""} />
      </form>
    </header>
  );
}
