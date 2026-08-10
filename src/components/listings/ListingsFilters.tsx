"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { LocationSearchField } from "@/components/search/LocationSearchField";
import {
  GuidedSearchFields,
  EMPTY_GUIDED_SEARCH,
  guidedStateFromDefaults,
  type GuidedSearchState,
} from "@/components/search/GuidedSearchFields";
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
import {
  type ActiveSearchField,
  getPartialDateRangeMessage,
} from "@/lib/guided-search";
import { saveLastSearchState } from "@/lib/midora-search-state";
import { cn } from "@/lib/utils";
import { MobileSearchSummaryBar } from "@/components/mobile/MobileSearchSummaryBar";

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
  amenities?: string;
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
  return "short_term";
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
  const tListings = useTranslations("Listings");
  const tChip = useTranslations("Listings.chip");
  const tSearch = useTranslations("Search");
  const tHome = useTranslations("Home");
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
  const [guidedState, setGuidedState] = useState<GuidedSearchState>(() =>
    guidedStateFromDefaults(defaults)
  );
  const [activeSearchField, setActiveSearchField] = useState<ActiveSearchField>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [partialDateHint, setPartialDateHint] = useState<string | null>(null);
  /** Phone-only (≤639): compact summary → full dock. Hidden from 640px via CSS. */
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const defaultsSyncKey = useMemo(() => JSON.stringify(defaults), [defaults]);

  useEffect(() => {
    setValues(defaults);
    setDraft(defaults);
    setRentalType(resolveInitialRentalType(defaults));
    modeFieldCache.current = createModeFieldCache(defaults);
    setSelectedLocation(null);
    setNearbyCoords(null);
    setGuidedState(guidedStateFromDefaults(defaults));
    setActiveSearchField(null);
    setDatePickerOpen(false);
    setGuestPickerOpen(false);
    setPartialDateHint(null);
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
    pets: defaults.pets,
  };

  const searchShellRef = useRef<HTMLDivElement>(null);

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

    const pets = pickFormField(formData, "pets", v.pets);
    if (pets && pets !== "0") p.set("pets", pets);

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
      if (durationMonths) {
        const duration = parseInt(durationMonths, 10);
        if (Number.isFinite(duration) && duration >= 2) {
          p.set("durationMonths", String(duration));
        }
      }
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
    if (v.amenities?.trim()) p.set("amenities", v.amenities.trim());
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
    if (!p.has("rentalType")) {
      p.set("rentalType", rentalOverride ?? rentalType);
    }
    const qs = p.toString();
    saveLastSearchState(p);
    router.push(qs ? `/listings?${qs}` : `/listings?rentalType=${rentalOverride ?? rentalType}`, {
      scroll: false,
    });
  }

  function applyLocationSelection(
    loc: SearchLocation,
    nearby?: { lat: number; lng: number } | null,
    options?: { navigate?: boolean }
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

    if (options?.navigate) {
      navigateWithValues(next, rentalType, {
        location: loc.kind === "nearby" ? null : loc,
        nearby: nearby ?? null,
      });
      return;
    }

    setActiveSearchField(null);
    setDatePickerOpen(false);
    setGuestPickerOpen(false);
  }

  const buildPreviewQuery = useCallback(
    (v: ListingsFilterValues) => {
      const fd = formRef.current ? new FormData(formRef.current) : null;
      return buildParams(v, fd, rentalType).toString();
    },
    [rentalType, values, selectedLocation, nearbyCoords]
  );

  function patchGuidedState(patch: Partial<GuidedSearchState>) {
    setGuidedState((prev) => {
      const next = { ...prev, ...patch };
      const valuePatch: Partial<ListingsFilterValues> = {};
      if (patch.dateRange !== undefined) {
        valuePatch.interestFrom = next.dateRange?.start ?? "";
        valuePatch.interestTo = next.dateRange?.end ?? "";
        setPartialDateHint(null);
      }
      if (patch.hasGuestSelection !== undefined || patch.guestCounts !== undefined) {
        const total =
          next.hasGuestSelection && next.guestCounts
            ? next.guestCounts.adults + next.guestCounts.children
            : 0;
        valuePatch.guests = total > 0 ? String(total) : "";
        valuePatch.pets =
          next.hasGuestSelection && next.guestCounts && next.guestCounts.pets > 0
            ? String(next.guestCounts.pets)
            : "";
      }
      if (patch.startMonth !== undefined) valuePatch.startMonth = next.startMonth;
      if (patch.durationMonths !== undefined) {
        valuePatch.durationMonths = next.durationMonths;
      }
      if (Object.keys(valuePatch).length) {
        setValues((v) => ({ ...v, ...valuePatch }));
      }
      return next;
    });
  }

  function submitSearch() {
    setPartialDateHint(null);

    if (rentalType === "short_term") {
      const hint = getPartialDateRangeMessage(
        guidedState.dateRange?.start,
        guidedState.dateRange?.end
      );
      if (hint) {
        setPartialDateHint(hint);
        setActiveSearchField("checkOut");
        setDatePickerOpen(true);
        return;
      }
    }

    setActiveSearchField(null);
    setDatePickerOpen(false);
    setGuestPickerOpen(false);
    navigateWithValues(values);
  }
  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    submitSearch();
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
    setGuidedState(EMPTY_GUIDED_SEARCH);
    setActiveSearchField(null);
    setDatePickerOpen(false);
    setGuestPickerOpen(false);
    setPartialDateHint(null);
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
    const p = buildParams(next);
    saveLastSearchState(p);
    router.push(`/listings?${p.toString()}`);
  }

  function clearMapArea() {
    setValues((v) => ({ ...v, polygon: undefined }));
  }

  const mobileSummaryTitle =
    values.city?.trim() ||
    (values.nearby ? tListings("nearYou") : null) ||
    (values.polygon ? tListings("inMapArea") : null) ||
    tSearch("search");

  const mobileSummarySubtitle = (() => {
    if (rentalType === "short_term") {
      const from = values.interestFrom;
      const to = values.interestTo;
      if (from && to) return `${from} → ${to}`;
      if (values.guests) {
        return tChip("guests", { count: values.guests });
      }
      return tHome("tabShort");
    }
    const month = values.startMonth;
    const duration = values.durationMonths;
    if (month && duration) return `${month} · ${duration}`;
    if (month) return month;
    return tHome("tabMonthly");
  })();

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

        {/* Phone-only compact summary + horizontal filter chips (≤639) */}
        <div className="midora-msearch-only px-4 pb-3 pt-1">
          {!mobileSearchOpen ? (
            <MobileSearchSummaryBar
              title={mobileSummaryTitle}
              subtitle={mobileSummarySubtitle}
              onOpen={() => setMobileSearchOpen(true)}
            />
          ) : null}
          <div className="midora-msearch-chips" role="list">
            <button
              type="button"
              role="listitem"
              onClick={openFilters}
              className={cn(
                "midora-msearch-chip",
                filterBadge > 0 && "midora-msearch-chip--active"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              {tListings("filters")}
              {filterBadge > 0 ? (
                <span className="midora-msearch-chip__badge">{filterBadge}</span>
              ) : null}
            </button>
            <button
              type="button"
              role="listitem"
              onClick={() => handleRentalTypeChange("short_term")}
              className={cn(
                "midora-msearch-chip",
                rentalType === "short_term" && "midora-msearch-chip--active"
              )}
            >
              {tHome("tabShort")}
            </button>
            <button
              type="button"
              role="listitem"
              onClick={() => handleRentalTypeChange("monthly")}
              className={cn(
                "midora-msearch-chip",
                rentalType === "monthly" && "midora-msearch-chip--active"
              )}
            >
              <span className="max-[360px]:hidden">{tHome("tabMonthly")}</span>
              <span className="hidden max-[360px]:inline">{tHome("tabMonthlyShort")}</span>
            </button>
            <button
              type="button"
              role="listitem"
              onClick={openFilters}
              className="midora-msearch-chip"
            >
              {tListings("price")}
            </button>
            <button
              type="button"
              role="listitem"
              onClick={() => {
                setMobileSearchOpen(true);
                setActiveSearchField("guests");
                setGuestPickerOpen(true);
              }}
              className={cn("midora-msearch-chip", values.guests && "midora-msearch-chip--active")}
            >
              {tSearch("guests")}
            </button>
          </div>
        </div>

        {/* Row 2 — unified search dock (hidden on phone until expanded) */}
        <div
          className={cn(
            "listings-search-header__search relative overflow-visible px-4 pb-4 pt-1 lg:px-[18px]",
            !mobileSearchOpen && "midora-msearch-hide-phone"
          )}
        >
          <div
            ref={searchShellRef}
            className={cn(
              "listings-search-dock relative overflow-visible",
              (datePickerOpen || guestPickerOpen) && "listings-search-dock--popover-open"
            )}
          >
            <RentalModeToggle value={rentalType} onChange={handleRentalTypeChange} />

            <LocationSearchField
              variant="toolbar"
              defaultValue={defaults.city}
              mapAreaActive={Boolean(values.polygon || defaults.polygon)}
              onClearMapArea={clearMapArea}
              onFocus={() => {
                setActiveSearchField("location");
                setDatePickerOpen(false);
                setGuestPickerOpen(false);
              }}
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
              className={cn(
                "relative z-[60] min-w-0 flex-[1.05]",
                activeSearchField === "location" && "listings-search-segment--active"
              )}
            />

            <GuidedSearchFields
              rentalType={rentalType}
              variant="search"
              state={guidedState}
              onStateChange={patchGuidedState}
              partialDateHint={partialDateHint}
              defaults={rentalDefaults}
              guidedFlow={{
                activeField: activeSearchField,
                onActiveFieldChange: setActiveSearchField,
                datePickerOpen,
                onDatePickerOpenChange: setDatePickerOpen,
                guestPickerOpen,
                onGuestPickerOpenChange: setGuestPickerOpen,
                searchShellRef,
              }}
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
              <span className="hidden sm:inline">{tListings("filters")}</span>
              {filterBadge > 0 && (
                <span className="listings-search-dock__filters-badge">{filterBadge}</span>
              )}
            </button>

            <button
              type="submit"
              className="listings-search-dock__submit"
              aria-label={tSearch("search")}
            >
              <Search className="h-4 w-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">{tSearch("search")}</span>
            </button>
          </div>
          {mobileSearchOpen ? (
            <div className="midora-msearch-only mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setDatePickerOpen(false);
                  setGuestPickerOpen(false);
                }}
                className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted"
              >
                {tListings("close")}
              </button>
            </div>
          ) : null}
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
