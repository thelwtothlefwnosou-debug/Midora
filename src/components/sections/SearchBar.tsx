"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MapPin, Search } from "lucide-react";
import { LocationSearchField } from "@/components/search/LocationSearchField";
import { appendRentalSearchParams } from "@/components/search/RentalTypeSearchFields";
import {
  GuidedSearchFields,
  EMPTY_GUIDED_SEARCH,
  type GuidedSearchState,
} from "@/components/search/GuidedSearchFields";
import type { LatLng } from "@/lib/geo/polygon";
import type { SearchLocation } from "@/lib/data/locations-shared";
import { appendLocationToParams } from "@/lib/search-params";
import { RENTAL_TYPE_SEARCH_TABS } from "@/lib/homepage-content";
import type { RentalType } from "@/lib/rental-types";
import {
  type ActiveSearchField,
  getPartialDateRangeMessage,
} from "@/lib/guided-search";
import { saveLastSearchState } from "@/lib/midora-search-state";
import { cn } from "@/lib/utils";
import { MobileSearchCollapsedBar } from "@/components/mobile/MobileSearchCollapsedBar";

const HERO_CITY_SUGGESTION_HREFS = {
  athens: "/listings?city=%CE%91%CE%B8%CE%AE%CE%BD%CE%B1",
  thessaloniki: "/listings?city=%CE%98%CE%B5%CF%83%CF%83%CE%B1%CE%BB%CE%BD%CE%AF%CE%BA%CE%B7",
} as const;

const HERO_LOCATION_INPUT_ID = "hero-search-location";

type SearchBarProps = {
  variant?: "default" | "fullscreen";
};

export function SearchBar({ variant = "default" }: SearchBarProps) {
  const t = useTranslations("Home");
  const tListings = useTranslations("Listings");
  const tCommon = useTranslations("Common");
  const locationPlaceholder = tListings("addDestination");
  const isFullscreen = variant === "fullscreen";
  const heroCitySuggestions = [
    { label: t("cityAthens"), href: HERO_CITY_SUGGESTION_HREFS.athens },
    { label: t("cityThessaloniki"), href: HERO_CITY_SUGGESTION_HREFS.thessaloniki },
  ] as const;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const heroSearchShellRef = useRef<HTMLDivElement>(null);
  const heroSearchActionsRef = useRef<HTMLDivElement>(null);
  const [rentalType, setRentalType] = useState<RentalType>("short_term");
  const [selectedLocation, setSelectedLocation] = useState<SearchLocation | null>(null);
  const [nearbyCoords, setNearbyCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [guidedState, setGuidedState] = useState<GuidedSearchState>(EMPTY_GUIDED_SEARCH);
  const [activeField, setActiveField] = useState<ActiveSearchField>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [partialDateHint, setPartialDateHint] = useState<string | null>(null);
  /** Phone-only (≤639): collapsed entry → existing search form. Ignored from 640px up via CSS. */
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function patchGuidedState(patch: Partial<GuidedSearchState>) {
    setGuidedState((prev) => ({ ...prev, ...patch }));
    if (patch.dateRange !== undefined) {
      setPartialDateHint(null);
    }
  }

  function commitLocationSelection() {
    setActiveField(null);
    setDatePickerOpen(false);
    setGuestPickerOpen(false);
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
        setActiveField("checkOut");
        setDatePickerOpen(true);
        return;
      }
    }

    setActiveField(null);
    setDatePickerOpen(false);
    setGuestPickerOpen(false);
    navigate();
  }

  function navigate(extra?: {
    polygon?: LatLng[];
    location?: SearchLocation | null;
    nearby?: { lat: number; lng: number } | null;
  }) {
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const params = new URLSearchParams();
    const cityText = data.get("city") as string;

    appendLocationToParams(params, {
      polygon: extra?.polygon,
      location: extra?.location ?? selectedLocation,
      nearby: extra?.nearby ?? nearbyCoords,
      cityText,
    });

    const rt = (data.get("rentalType") as string) || rentalType;
    if (rt) params.set("rentalType", rt);

    appendRentalSearchParams(params, data, rt);

    if (!params.has("rentalType") && rt) {
      params.set("rentalType", rt);
    }
    const qs = params.toString();
    saveLastSearchState(params);
    router.push(qs ? `/listings?${qs}` : `/listings?rentalType=${rt || rentalType}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitSearch();
  }

  function clearAll() {
    setSelectedLocation(null);
    setNearbyCoords(null);
    setGuidedState(EMPTY_GUIDED_SEARCH);
    setActiveField(null);
    setDatePickerOpen(false);
    setGuestPickerOpen(false);
    setPartialDateHint(null);
    const input = document.getElementById(HERO_LOCATION_INPUT_ID) as HTMLInputElement | null;
    if (input) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function handleRentalTypeChange(next: RentalType) {
    setRentalType(next);
    setGuidedState(EMPTY_GUIDED_SEARCH);
    setActiveField(null);
    setDatePickerOpen(false);
    setGuestPickerOpen(false);
    setPartialDateHint(null);
  }

  return (
    <div className={cn("space-y-3", isFullscreen ? "sm:space-y-3" : "sm:space-y-3.5")}>
      {!mobileSearchOpen ? (
        <div className="midora-msearch-only">
          <MobileSearchCollapsedBar onOpen={() => setMobileSearchOpen(true)} />
        </div>
      ) : null}

      <div
        className={cn(
          "border border-border bg-white/97 backdrop-blur-md",
          isFullscreen
            ? "rounded-[1.75rem] p-3 shadow-[0_20px_50px_-18px_rgba(20,16,12,0.45)] sm:p-4"
            : "rounded-2xl p-2.5 shadow-[0_8px_32px_-12px_rgba(26,26,26,0.14)] sm:p-3.5 ring-1 ring-white/60",
          (datePickerOpen || guestPickerOpen) && "search-shell--popover-open",
          !mobileSearchOpen && "midora-msearch-hide-phone"
        )}
      >
        <form
          ref={formRef}
          id="hero-search-form"
          onSubmit={handleSearch}
          className="home-hero-search-form"
        >
          <input type="hidden" name="rentalType" value={rentalType} />

          <div
            className={cn(
              isFullscreen ? "home-hero-search-segment" : "home-hero-search-tabs"
            )}
            role="tablist"
            aria-label={t("searchModeAria")}
          >
            {RENTAL_TYPE_SEARCH_TABS.map((tab) => {
              const active = rentalType === tab.value;
              const label = tab.value === "short_term" ? t("tabShort") : t("tabMonthly");
              const description =
                tab.value === "short_term" ? t("tabShortDesc") : t("tabMonthlyDesc");
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleRentalTypeChange(tab.value)}
                  className={cn(
                    isFullscreen
                      ? cn(
                          "home-hero-search-segment__btn",
                          active && "home-hero-search-segment__btn--active"
                        )
                      : cn(
                          "flex h-full min-h-[3.75rem] min-w-[8.5rem] shrink-0 flex-col justify-center rounded-xl border px-3 py-2 text-left transition-all sm:min-h-[4rem] sm:min-w-0",
                          active
                            ? "border-gold/40 bg-[#f7f0e6] ring-1 ring-gold/20"
                            : "border-border bg-white hover:border-gold/20 hover:bg-sand/30"
                        )
                  )}
                >
                  <span
                    className={cn(
                      "block font-semibold leading-snug text-charcoal",
                      isFullscreen ? "text-[13px] sm:text-sm" : "text-sm"
                    )}
                  >
                    {label}
                  </span>
                  {!isFullscreen && (
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted/90 sm:text-xs">
                      {description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            ref={heroSearchShellRef}
            className={cn(
              "home-hero-search-fields relative",
              rentalType === "short_term"
                ? "home-hero-search-fields--short"
                : "home-hero-search-fields--monthly",
              (datePickerOpen || guestPickerOpen) && "home-hero-search-fields--active"
            )}
          >
            <label
              htmlFor={HERO_LOCATION_INPUT_ID}
              className={cn(
                "home-hero-search-cell home-search-field relative w-full cursor-text text-left transition-colors hover:bg-[#faf6ef]",
                "focus-within:z-[1] focus-within:bg-[#f7f0e6] focus-within:ring-1 focus-within:ring-inset focus-within:ring-gold/55",
                activeField === "location" && "z-[1] bg-[#f7f0e6] ring-1 ring-inset ring-gold/55"
              )}
            >
              <MapPin
                className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
                strokeWidth={1.75}
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                <span className="home-search-field-label pointer-events-none">{t("searchWhere")}</span>
                <div className="min-w-0">
                  <LocationSearchField
                    variant="embedded"
                    inputId={HERO_LOCATION_INPUT_ID}
                    placeholder={locationPlaceholder}
                    onFocus={() => {
                      setActiveField("location");
                      setDatePickerOpen(false);
                      setGuestPickerOpen(false);
                    }}
                    onSelect={(loc) => {
                      setSelectedLocation(loc);
                      if (loc.kind !== "nearby") setNearbyCoords(null);
                      commitLocationSelection();
                    }}
                    onNearbySelect={(coords) => {
                      setNearbyCoords(coords);
                      setSelectedLocation(null);
                      commitLocationSelection();
                    }}
                    onDrawSearch={(polygon) => navigate({ polygon })}
                  />
                </div>
              </div>
            </label>

            <GuidedSearchFields
              rentalType={rentalType}
              variant="hero"
              state={guidedState}
              onStateChange={patchGuidedState}
              partialDateHint={partialDateHint}
              guidedFlow={{
                activeField,
                onActiveFieldChange: setActiveField,
                datePickerOpen,
                onDatePickerOpenChange: setDatePickerOpen,
                guestPickerOpen,
                onGuestPickerOpenChange: setGuestPickerOpen,
                searchShellRef: heroSearchShellRef,
                ignoreRefs: [heroSearchActionsRef],
              }}
            />
          </div>

          <div ref={heroSearchActionsRef} className="flex flex-wrap items-center gap-2">
            <button type="submit" className="home-btn-primary home-hero-search-submit min-w-0 flex-1">
              <Search className="h-4 w-4" />
              {t("searchSubmit")}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="shrink-0 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-gold/30 hover:text-charcoal"
            >
              {t("searchClear")}
            </button>
            {mobileSearchOpen ? (
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="midora-msearch-only shrink-0 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted"
              >
                {tCommon("close")}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {!isFullscreen && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 pt-0.5">
          <span className="mr-0.5 text-[10px] font-medium tracking-[0.1em] text-muted/75 uppercase">
            {t("popularLabel")}
          </span>
          {heroCitySuggestions.map((item) => (
            <Link key={item.label} href={item.href} className="home-chip">
              {item.label}
            </Link>
          ))}
          <Link href="/listings?rentalType=short_term" className="home-chip">
            {t("tabShort")}
          </Link>
          <Link href="/listings?rentalType=monthly" className="home-chip">
            {t("tabMonthly")}
          </Link>
        </div>
      )}
    </div>
  );
}
